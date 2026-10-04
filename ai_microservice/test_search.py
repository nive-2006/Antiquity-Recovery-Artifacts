import os
import sys
import numpy as np
import pandas as pd
import torch
import faiss
from PIL import Image
from transformers import AutoImageProcessor, AutoModel

def main():
    print("=" * 60)
    print("STARTING DINOv2 + FAISS HERITAGE ARTIFACT SEARCH TEST")
    print("=" * 60)

    # 1. Device Selection
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device                   : {device}")

    # 2. File Paths
    DATA_DIR = "data"
    FAISS_FILE = os.path.join(DATA_DIR, "dinov2_faiss.index")
    METADATA_FILE = os.path.join(DATA_DIR, "master_image_metadata.csv")
    IMAGE_PATH = os.path.join("test_images", "test_artifact.jpg")

    if not os.path.exists(IMAGE_PATH):
        raise FileNotFoundError(f"Test artifact image not found at '{IMAGE_PATH}'")

    # 3. Load DINOv2 Model & Processor
    MODEL_NAME = "facebook/dinov2-base"
    print(f"\nLoading DINOv2 model ({MODEL_NAME})...")
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    model = AutoModel.from_pretrained(MODEL_NAME).to(device)
    model.eval()

    # 4. Load FAISS index & Metadata
    print("\nLoading FAISS index and metadata...")
    index = faiss.read_index(FAISS_FILE)
    metadata = pd.read_csv(METADATA_FILE)

    print(f"FAISS vectors            : {index.ntotal}")
    print(f"FAISS dimension          : {index.d}")

    # 5. Load and process image
    print(f"\nLoading test image from '{IMAGE_PATH}'...")
    image = Image.open(IMAGE_PATH).convert("RGB")
    print(f"Test image size          : {image.size}")

    inputs = processor(images=image, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # 6. Extract & normalize CLS embedding
    with torch.no_grad():
        outputs = model(**inputs)
        cls_embedding = outputs.last_hidden_state[:, 0, :]
        normalized_embedding = torch.nn.functional.normalize(cls_embedding, p=2, dim=1)

    embedding_np = normalized_embedding.cpu().numpy().astype(np.float32)
    print(f"Embedding shape          : {embedding_np.shape}")

    # 7. Search FAISS index
    TOP_K = 5
    distances, indices = index.search(embedding_np, TOP_K)

    print("\n========== TOP 5 MATCHING HERITAGE ARTIFACTS ==========")
    for rank in range(TOP_K):
        idx = indices[0][rank]
        dist = distances[0][rank]
        row = metadata.iloc[idx] if idx < len(metadata) else {}
        img_name = row.get("image_name", "N/A") if isinstance(row, pd.Series) else "N/A"
        img_path = row.get("image_path", "N/A") if isinstance(row, pd.Series) else "N/A"

        print(f"\nRank {rank + 1}:")
        print(f"  FAISS index     : {idx}")
        print(f"  Similarity score: {dist:.6f}")
        print(f"  Image name      : {img_name}")
        print(f"  Image path      : {img_path}")

    print("\n========================================================")
    print("SEARCH COMPLETED SUCCESSFULLY")

if __name__ == "__main__":
    main()
