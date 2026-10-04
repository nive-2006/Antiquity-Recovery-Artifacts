import os
import sys
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
import faiss
from PIL import Image
from transformers import AutoImageProcessor, AutoModel

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

def file_exists_win(dir_path, filename):
    abs_p = os.path.abspath(os.path.join(dir_path, str(filename)))
    if os.name == 'nt' and not abs_p.startswith('\\\\?\\'):
        abs_p = '\\\\?\\' + abs_p
    return os.path.exists(abs_p)

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Paths
    DATA_DIR = "data"
    CHECKPOINT_FILE = os.path.join(DATA_DIR, "best_projection_head.pt")
    FAISS_FILE = os.path.join(DATA_DIR, "trained_dinov2_faiss.index")
    METADATA_FILE = os.path.join(DATA_DIR, "master_image_metadata.csv")
    LOCAL_PATHS_FILE = os.path.join(DATA_DIR, "image_paths_local.npy")
    TEST_IMAGE_PATH = os.path.join("test_images", "perumal.jpg")

    if not os.path.exists(TEST_IMAGE_PATH):
        TEST_IMAGE_PATH = os.path.join("test_images", "test_artifact.jpg")

    print("============================================================")
    print("DIGITAL HERITAGE AI TRAINED RETRIEVAL TEST")
    print("============================================================")
    print(f"\nTest image:")
    print(f"{TEST_IMAGE_PATH.replace('\\\\', '/')}")

    # 1. Load DINOv2 & ProjectionHead
    MODEL_NAME = "facebook/dinov2-base"
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    model = AutoModel.from_pretrained(MODEL_NAME).to(device)
    model.eval()

    proj_head = ProjectionHead(input_dim=768, hidden_dim=512, output_dim=256).to(device)
    proj_head.load_state_dict(torch.load(CHECKPOINT_FILE, map_location=device))
    proj_head.eval()

    # 2. Load trained FAISS index, metadata, local paths
    index = faiss.read_index(FAISS_FILE)
    metadata = pd.read_csv(METADATA_FILE)
    local_paths = np.load(LOCAL_PATHS_FILE, allow_pickle=True)

    # 3. Process test image
    image = Image.open(TEST_IMAGE_PATH).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        cls_embedding = outputs.last_hidden_state[:, 0, :]
        proj_embedding = proj_head(cls_embedding)

    embedding_np = proj_embedding.cpu().numpy().astype(np.float32)

    print(f"\nEmbedding shape:")
    print(f"{embedding_np.shape}")
    print(f"\nFAISS vectors:")
    print(f"{index.ntotal}")
    print(f"\nFAISS dimension:")
    print(f"{index.d}")

    # 4. Search FAISS index
    TOP_K = 5
    distances, indices = index.search(embedding_np, TOP_K)

    print("\n============================================================")
    print("TOP 5 MATCHING HERITAGE ARTIFACTS")
    print("============================================================")

    for rank in range(TOP_K):
        idx = indices[0][rank]
        dist = distances[0][rank]
        row = metadata.iloc[idx]
        img_name = row["image_name"]
        local_path = str(local_paths[idx]).replace("\\", "/")
        exists = file_exists_win("images", img_name)

        print(f"\nRank {rank + 1}:")
        print(f"FAISS index     : {idx}")
        print(f"Similarity      : {dist:.6f}")
        print(f"Image name      : {img_name}")
        print(f"Local path      : {local_path}")
        print(f"File exists     : {exists}")

    print("\n============================================================")
    print("LOCAL RETRIEVAL TEST COMPLETE")

    # Self-match check note
    rank1_dist = distances[0][0]
    rank1_name = metadata.iloc[indices[0][0]]["image_name"]
    test_img_filename = os.path.basename(TEST_IMAGE_PATH)
    if abs(rank1_dist - 1.0) < 1e-3 or rank1_name == test_img_filename:
        print("\nTest image is present in the database; Rank 1 may be an exact/self match.")

if __name__ == "__main__":
    main()
