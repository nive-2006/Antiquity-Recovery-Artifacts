import os
import json
import urllib.parse
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
import faiss
from PIL import Image
from typing import List, Dict, Any, Optional
from transformers import AutoImageProcessor, AutoModel

# Named Constants & Configuration
MODEL_NAME = "facebook/dinov2-base"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
IMAGES_DIR = os.path.join(SCRIPT_DIR, "images")

CHECKPOINT_PATH = os.path.join(DATA_DIR, "best_projection_head.pt")
TRAINED_FAISS_PATH = os.path.join(DATA_DIR, "trained_dinov2_faiss.index")
TRAINED_EMBEDDINGS_PATH = os.path.join(DATA_DIR, "trained_all_embeddings.npy")
LOCAL_PATHS_PATH = os.path.join(DATA_DIR, "image_paths_local.npy")
METADATA_PATH = os.path.join(DATA_DIR, "master_image_metadata.csv")


class ProjectionHead(nn.Module):
    """
    Trained PyTorch projection head from Kaggle training.
    Maps 768-dimensional DINOv2 CLS embedding -> 512 hidden GELU -> 256 L2-normalized embedding.
    """
    def __init__(self, input_dim: int = 768, hidden_dim: int = 512, output_dim: int = 256):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, output_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.network(x)
        x = F.normalize(x, p=2, dim=1)
        return x


class TrainedHeritageRetrievalService:
    """
    Singleton service for Digital Heritage AI Retrieval using ONLY the trained model
    and the real local heritage image database (20,399 images).
    """
    _instance: Optional['TrainedHeritageRetrievalService'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TrainedHeritageRetrievalService, cls).__new__(cls)
            cls._instance._initialize_pipeline()
        return cls._instance

    def _initialize_pipeline(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[Heritage AI] Using execution device: {self.device}")

        # 1. Load DINOv2 base model & processor
        print(f"[Heritage AI] Loading base model '{MODEL_NAME}'...")
        try:
            self.processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
            self.dinov2_model = AutoModel.from_pretrained(MODEL_NAME).to(self.device)
            self.dinov2_model.eval()
            for p in self.dinov2_model.parameters():
                p.requires_grad = False
        except Exception as e:
            raise RuntimeError(f"[Heritage AI] Failed to load DINOv2 model '{MODEL_NAME}': {str(e)}")

        # 2. Load trained ProjectionHead checkpoint
        print(f"[Heritage AI] Loading projection head checkpoint '{CHECKPOINT_PATH}'...")
        if not os.path.exists(CHECKPOINT_PATH):
            raise FileNotFoundError(f"[Heritage AI] Checkpoint file missing at '{CHECKPOINT_PATH}'")

        self.projection_head = ProjectionHead(input_dim=768, hidden_dim=512, output_dim=256).to(self.device)
        ckpt = torch.load(CHECKPOINT_PATH, map_location=self.device)
        
        required_keys = ["network.0.weight", "network.0.bias", "network.2.weight", "network.2.bias"]
        for k in required_keys:
            if k not in ckpt:
                raise KeyError(f"[Heritage AI] Missing required weight '{k}' in checkpoint '{CHECKPOINT_PATH}'")
        
        self.projection_head.load_state_dict(ckpt)
        self.projection_head.eval()
        for p in self.projection_head.parameters():
            p.requires_grad = False

        # 3. Check trained FAISS index & embeddings
        if os.path.exists(TRAINED_FAISS_PATH):
            print(f"[Heritage AI] Reading trained 256-D FAISS index from '{TRAINED_FAISS_PATH}'...")
            self.index = faiss.read_index(TRAINED_FAISS_PATH)
        elif os.path.exists(TRAINED_EMBEDDINGS_PATH):
            print(f"[Heritage AI] Trained 256-D FAISS index missing. Building from '{TRAINED_EMBEDDINGS_PATH}'...")
            embeddings = np.load(TRAINED_EMBEDDINGS_PATH).astype(np.float32)
            self.index = faiss.IndexFlatIP(256)
            self.index.add(embeddings)
            faiss.write_index(self.index, TRAINED_FAISS_PATH)
            print(f"[Heritage AI] Saved newly built index to '{TRAINED_FAISS_PATH}'.")
        else:
            print("========================================")
            print("ERROR: Trained 256-D FAISS index is missing.")
            print("data/trained_dinov2_faiss.index and data/trained_all_embeddings.npy not found.")
            print("========================================")
            raise FileNotFoundError("Trained 256-D FAISS index is missing. Please generate trained_all_embeddings.npy using DINOv2 + best_projection_head.pt.")

        if self.index.d != 256:
            raise ValueError(f"[Heritage AI] Invalid FAISS index dimension {self.index.d}! Expected 256.")

        # 4. Load database image paths & metadata
        if not os.path.exists(LOCAL_PATHS_PATH):
            raise FileNotFoundError(f"[Heritage AI] Missing image paths file '{LOCAL_PATHS_PATH}'")

        self.local_paths = np.load(LOCAL_PATHS_PATH, allow_pickle=True)
        self.db_size = len(self.local_paths)

        if os.path.exists(METADATA_PATH):
            self.metadata_df = pd.read_csv(METADATA_PATH)
        else:
            self.metadata_df = None

        # 5. Print startup verification banner exactly as required
        print("========================================")
        print("DIGITAL HERITAGE AI MODEL")
        print("========================================")
        print(f"DINOv2: {MODEL_NAME}")
        print(f"Projection: {os.path.basename(CHECKPOINT_PATH)}")
        print(f"Embedding dimension: {self.index.d}")
        print(f"FAISS index: {os.path.basename(TRAINED_FAISS_PATH)}")
        print(f"Database images: {self.db_size:,}")
        print("========================================")

    def extract_trained_embedding(self, image: Image.Image) -> np.ndarray:
        """
        Processes image through DINOv2-base (768-D CLS) -> best_projection_head.pt -> 256-D normalized embedding.
        """
        rgb_img = image.convert("RGB")
        inputs = self.processor(images=rgb_img, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.dinov2_model(**inputs)
            cls_768 = outputs.last_hidden_state[:, 0, :]  # Shape: (1, 768)
            proj_256 = self.projection_head(cls_768)     # Shape: (1, 256), L2-normalized

        embedding_256 = proj_256.cpu().numpy().astype(np.float32)
        return embedding_256

    def search_similar(self, image: Image.Image, top_k: int = 10) -> Dict[str, Any]:
        """
        Queries trained FAISS index and returns top real heritage matches from local database.
        """
        embedding_256 = self.extract_trained_embedding(image)
        distances, indices = self.index.search(embedding_256, top_k)

        results = []
        for rank in range(1, top_k + 1):
            idx = int(indices[0][rank - 1])
            similarity_val = float(distances[0][rank - 1])

            if idx < 0 or idx >= self.db_size:
                continue

            local_path_raw = str(self.local_paths[idx])
            image_name = os.path.basename(local_path_raw.replace("\\", "/"))

            # Construct clean URL for API image serving
            image_url = f"/api/heritage/images/{urllib.parse.quote(image_name)}"

            match_entry = {
                "rank": rank,
                "faiss_index": idx,
                "similarity": round(similarity_val, 6),
                "image_name": image_name,
                "image_url": image_url
            }

            # Attach metadata fields if present
            if self.metadata_df is not None and idx < len(self.metadata_df):
                row = self.metadata_df.iloc[idx]
                if "image_id" in row and pd.notna(row["image_id"]):
                    match_entry["image_id"] = str(row["image_id"])

            # Load heritage metadata from heritage_metadata.csv if available
            match_entry["metadata"] = self.get_heritage_metadata_by_index(idx, match_entry.get("image_id"), image_name)

            results.append(match_entry)

        return {
            "model": "DINOv2-base + trained projection head",
            "embedding_dimension": int(self.index.d),
            "database_size": int(self.db_size),
            "results": results
        }

    def get_heritage_metadata_by_index(self, idx: int, image_id: Optional[str], image_name: str) -> Dict[str, Any]:
        """Loads metadata record for index/image_id, returning structured dict."""
        heritage_csv = os.path.join(DATA_DIR, "heritage_metadata.csv")
        if not hasattr(self, "_heritage_df") or self._heritage_df is None:
            if os.path.exists(heritage_csv):
                try:
                    self._heritage_df = pd.read_csv(heritage_csv).where(pd.notnull, None)
                except Exception:
                    self._heritage_df = None

        if hasattr(self, "_heritage_df") and self._heritage_df is not None and idx < len(self._heritage_df):
            row = self._heritage_df.iloc[idx].to_dict()
            cleaned = {}
            for k, v in row.items():
                if pd.isna(v) or v is None or (isinstance(v, float) and np.isnan(v)):
                    cleaned[k] = None
                else:
                    cleaned[k] = str(v).strip() if isinstance(v, str) else v
            return cleaned

        return {
            "artifact_name": None,
            "temple_name": None,
            "monument_name": None,
            "deity_or_subject": None,
            "location": None,
            "district": None,
            "state": None,
            "country": "India",
            "historical_period": None,
            "approximate_date": None,
            "dynasty": None,
            "architectural_style": None,
            "artifact_type": None,
            "material": None,
            "description": "Historical metadata not yet established.",
            "historical_background": None,
            "provenance": None,
            "current_location": None,
            "metadata_source": "Visual Retrieval Engine",
            "source_url": None,
            "metadata_confidence": "low",
            "verification_status": "unverified",
            "metadata_generated_by": "ai_vision"
        }

    def extract_embedding(self, image: Image.Image) -> np.ndarray:
        """Alias for extract_trained_embedding for backward compatibility."""
        return self.extract_trained_embedding(image)


class EmbeddingStore:
    """
    Manages custom dynamic artifact embeddings and metadata stored in local JSON and npy storage.
    """
    _instance: Optional['EmbeddingStore'] = None

    def __init__(self, storage_dir: Optional[str] = None):
        if storage_dir is None:
            storage_dir = DATA_DIR
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

        self.npy_path = os.path.join(self.storage_dir, "indexed_embeddings.npy")
        self.json_path = os.path.join(self.storage_dir, "indexed_metadata.json")

        self.metadata_list: List[Dict[str, Any]] = []
        self.embeddings: Optional[np.ndarray] = None

        self._load_store()

    def _load_store(self):
        if os.path.exists(self.json_path):
            try:
                with open(self.json_path, "r", encoding="utf-8") as f:
                    self.metadata_list = json.load(f)
            except Exception:
                self.metadata_list = []
        else:
            self.metadata_list = []

        if os.path.exists(self.npy_path):
            try:
                self.embeddings = np.load(self.npy_path).astype(np.float32)
            except Exception:
                self.embeddings = None
        else:
            self.embeddings = None

    def _save_store(self):
        with open(self.json_path, "w", encoding="utf-8") as f:
            json.dump(self.metadata_list, f, indent=2)

        if self.embeddings is not None and len(self.embeddings) > 0:
            np.save(self.npy_path, self.embeddings)

    def add_or_update_artifact(
        self,
        artifact_id: str,
        embedding: np.ndarray,
        metadata: Dict[str, Any],
        image_ref: str
    ):
        vec = np.array(embedding, dtype=np.float32).flatten()

        existing_idx = None
        for idx, item in enumerate(self.metadata_list):
            if item.get("artifact_id") == artifact_id:
                existing_idx = idx
                break

        record = {
            "artifact_id": artifact_id,
            "metadata": metadata,
            "image_ref": image_ref
        }

        if existing_idx is not None:
            self.metadata_list[existing_idx] = record
            if self.embeddings is not None and existing_idx < len(self.embeddings):
                self.embeddings[existing_idx] = vec
        else:
            self.metadata_list.append(record)
            if self.embeddings is None or len(self.embeddings) == 0:
                self.embeddings = np.array([vec], dtype=np.float32)
            else:
                self.embeddings = np.vstack([self.embeddings, vec])

        self._save_store()

    def search_similar(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        if self.embeddings is None or len(self.embeddings) == 0 or len(self.metadata_list) == 0:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32).flatten()
        norm_q = np.linalg.norm(q_vec)
        if norm_q > 0:
            q_vec = q_vec / norm_q

        norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normalized_embeddings = self.embeddings / norms

        similarities = np.dot(normalized_embeddings, q_vec)
        top_indices = np.argsort(similarities)[::-1][:top_k]

        matches = []
        for idx in top_indices:
            if idx < len(self.metadata_list):
                item = dict(self.metadata_list[idx])
                item["similarity"] = float(round(similarities[idx], 6))
                matches.append(item)

        return matches


_global_embedding_store: Optional[EmbeddingStore] = None

def get_embedding_store(storage_dir: Optional[str] = None) -> EmbeddingStore:
    global _global_embedding_store
    if _global_embedding_store is None or storage_dir is not None:
        _global_embedding_store = EmbeddingStore(storage_dir=storage_dir)
    return _global_embedding_store


def get_dinov2_service() -> TrainedHeritageRetrievalService:
    return TrainedHeritageRetrievalService()


# Maintain backward compatibility aliases if needed
DINOv2EmbeddingService = TrainedHeritageRetrievalService


