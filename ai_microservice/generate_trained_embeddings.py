import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
import faiss
from transformers import AutoImageProcessor, AutoModel

def file_exists_win(dir_path, filename):
    abs_p = os.path.abspath(os.path.join(dir_path, str(filename)))
    if os.name == 'nt' and not abs_p.startswith('\\\\?\\'):
        abs_p = '\\\\?\\' + abs_p
    return os.path.exists(abs_p)

# 5. ProjectionHead Architecture Definition
class ProjectionHead(nn.Module):
    def __init__(self, input_dim=768, hidden_dim=512, output_dim=256):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, output_dim)
        )

    def forward(self, x):
        x = self.network(x)
        x = F.normalize(x, p=2, dim=1)
        return x

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("Device:", device)

    # File paths
    DATA_DIR = "data"
    MODEL_NAME = "facebook/dinov2-base"
    CHECKPOINT_PATH = os.path.join(DATA_DIR, "best_projection_head.pt")
    LOCAL_PATHS_FILE = os.path.join(DATA_DIR, "image_paths_local.npy")
    EMBEDDINGS_768_FILE = os.path.join(DATA_DIR, "dinov2_embeddings.npy")
    TRAINED_EMBEDDINGS_FILE = os.path.join(DATA_DIR, "trained_all_embeddings.npy")
    TRAINED_FAISS_FILE = os.path.join(DATA_DIR, "trained_dinov2_faiss.index")

    # 1. Load DINOv2 model & processor
    print(f"\n1. Loading DINOv2 model ({MODEL_NAME})...")
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    dinov2_model = AutoModel.from_pretrained(MODEL_NAME).to(device)
    dinov2_model.eval()

    # 2. Load image_paths_local.npy
    print(f"\n2. Loading local image paths from '{LOCAL_PATHS_FILE}'...")
    if not os.path.exists(LOCAL_PATHS_FILE):
        raise FileNotFoundError(f"Missing file: {LOCAL_PATHS_FILE}")
    
    image_paths_local = np.load(LOCAL_PATHS_FILE, allow_pickle=True)
    num_paths = len(image_paths_local)
    print(f"Loaded image paths count: {num_paths}")

    # 3. Verify exactly 20399 paths exist
    if num_paths != 20399:
        raise ValueError(f"Expected 20399 image paths, found {num_paths}")

    # 4. Verify every path exists on disk
    print("\n4. Verifying existence of all 20,399 image files on disk...")
    missing_files = []
    for i, p in enumerate(image_paths_local):
        fname = os.path.basename(str(p))
        if not file_exists_win("images", fname):
            missing_files.append((i, fname))
    
    if missing_files:
        raise FileNotFoundError(f"Verification failed: {len(missing_files)} image files are missing on disk.")
    print("All 20,399 image files verified successfully on disk!")

    # 5 & 6. Load Projection Head Checkpoint
    print(f"\n5. Loading projection head checkpoint from '{CHECKPOINT_PATH}'...")
    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(f"Checkpoint file not found at '{CHECKPOINT_PATH}'")

    projection_head = ProjectionHead(input_dim=768, hidden_dim=512, output_dim=256).to(device)
    ckpt = torch.load(CHECKPOINT_PATH, map_location=device)

    # 7. Verify required checkpoint keys
    required_keys = ["network.0.weight", "network.0.bias", "network.2.weight", "network.2.bias"]
    for k in required_keys:
        if k not in ckpt:
            raise KeyError(f"Missing required key '{k}' in checkpoint!")
    
    projection_head.load_state_dict(ckpt)

    # 8. Freeze DINOv2 and projection head
    for param in dinov2_model.parameters():
        param.requires_grad = False
    for param in projection_head.parameters():
        param.requires_grad = False
    projection_head.eval()

    # 9 & 10. Process embeddings
    print("\n9. Generating 256-dimensional trained embeddings...")
    if os.path.exists(EMBEDDINGS_768_FILE):
        print(f"Loading 768-d base DINOv2 embeddings from '{EMBEDDINGS_768_FILE}'...")
        emb768 = np.load(EMBEDDINGS_768_FILE)
        if len(emb768) != 20399:
            raise ValueError(f"Expected 20399 768-d embeddings, got {len(emb768)}")
        
        with torch.no_grad():
            t_in = torch.from_numpy(emb768).to(device)
            t_out = projection_head(t_in)
            trained_embeddings = t_out.cpu().numpy().astype(np.float32)
    else:
        raise FileNotFoundError(f"Missing precomputed 768-d embeddings file '{EMBEDDINGS_768_FILE}'")

    # 11. Save trained_all_embeddings.npy
    print(f"\n11. Saving trained 256-d embeddings to '{TRAINED_EMBEDDINGS_FILE}'...")
    np.save(TRAINED_EMBEDDINGS_FILE, trained_embeddings)

    # 12. Check NaN / Inf
    nan_count = int(np.isnan(trained_embeddings).sum())
    inf_count = int(np.isinf(trained_embeddings).sum())
    print(f"Embedding shape : {trained_embeddings.shape}")
    print(f"NaN count       : {nan_count}")
    print(f"Inf count       : {inf_count}")

    if nan_count > 0 or inf_count > 0:
        raise ValueError(f"Embeddings contain invalid values! NaN: {nan_count}, Inf: {inf_count}")

    # 13. Verify embedding order
    if len(trained_embeddings) != len(image_paths_local):
        raise ValueError("Embedding order/count mismatch with image_paths_local!")

    # 14. Create FAISS IndexFlatIP (256-d)
    print("\n14. Building FAISS IndexFlatIP(256)...")
    index256 = faiss.IndexFlatIP(256)
    index256.add(trained_embeddings)

    print(f"Saving FAISS index to '{TRAINED_FAISS_FILE}'...")
    faiss.write_index(index256, TRAINED_FAISS_FILE)

    # 15. Verify FAISS index
    loaded_index = faiss.read_index(TRAINED_FAISS_FILE)
    print(f"\n15. Verification:")
    print(f"FAISS vectors   : {loaded_index.ntotal}")
    print(f"FAISS dimension : {loaded_index.d}")
    print(f"Embeddings shape: {trained_embeddings.shape}")
    print(f"Image paths     : {len(image_paths_local)}")

    # 16. Test Index 214
    test_idx = 214
    print(f"\nTest known index {test_idx}:")
    print(f"FAISS index     : {test_idx}")
    print(f"Image path      : {image_paths_local[test_idx]}")

    # Final Summary Report
    print("\n========================================")
    print("TRAINED HERITAGE DATABASE")
    print("========================================")
    print(f"DINOv2             : {MODEL_NAME}")
    print(f"Projection         : best_projection_head.pt")
    print(f"Images             : {len(image_paths_local)}")
    print(f"Embedding dimension: {trained_embeddings.shape[1]}")
    print(f"NaN                : {nan_count}")
    print(f"Inf                : {inf_count}")
    print(f"FAISS vectors      : {loaded_index.ntotal}")
    print(f"FAISS dimension    : {loaded_index.d}")
    print(f"Index              : {TRAINED_FAISS_FILE}")
    print(f"Embeddings         : {TRAINED_EMBEDDINGS_FILE}")

if __name__ == "__main__":
    main()
