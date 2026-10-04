import os
import sys
import json
import csv
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
    TEST_IMAGES_DIR = "test_images"

    test_filenames = ["perumal.jpg", "lakshmi.jpg", "murugar.jpg"]

    # 1. Load DINOv2 Model & Processor
    MODEL_NAME = "facebook/dinov2-base"
    print(f"Loading DINOv2 model ({MODEL_NAME})...")
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    model = AutoModel.from_pretrained(MODEL_NAME).to(device)
    model.eval()

    # 2. Load Projection Head
    print(f"Loading projection head ({CHECKPOINT_FILE})...")
    proj_head = ProjectionHead(input_dim=768, hidden_dim=512, output_dim=256).to(device)
    proj_head.load_state_dict(torch.load(CHECKPOINT_FILE, map_location=device))
    proj_head.eval()

    # 3. Load Database Files
    print("Loading trained 256-D FAISS index, metadata, and local paths...")
    index = faiss.read_index(FAISS_FILE)
    metadata = pd.read_csv(METADATA_FILE)
    local_paths = np.load(LOCAL_PATHS_FILE, allow_pickle=True)

    print(f"FAISS total vectors : {index.ntotal}")
    print(f"FAISS dimension     : {index.d}")

    all_results = []
    summary_rows = []

    TOP_K = 10

    for test_filename in test_filenames:
        test_image_path = os.path.join(TEST_IMAGES_DIR, test_filename)
        if not os.path.exists(test_image_path):
            print(f"\n[WARNING] Test image '{test_image_path}' not found. Skipping.")
            continue

        # Load image & measure dimensions
        image = Image.open(test_image_path).convert("RGB")
        img_size = image.size

        # Extract 768-d CLS embedding -> Projection head 256-d normalized
        inputs = processor(images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            cls_embedding = outputs.last_hidden_state[:, 0, :]
            proj_embedding = proj_head(cls_embedding)

        embedding_np = proj_embedding.cpu().numpy().astype(np.float32)

        print("\n" + "=" * 40)
        print(f"TEST IMAGE: {test_filename}")
        print("=" * 40)
        print(f"Image dimensions: {img_size}")
        print(f"Embedding shape : {embedding_np.shape}")

        # Search FAISS index
        distances, indices = index.search(embedding_np, TOP_K)

        top_5_matches = []
        image_results = []
        exact_in_db = False
        exact_match_filename = None

        for rank in range(1, TOP_K + 1):
            idx = int(indices[0][rank - 1])
            dist = float(distances[0][rank - 1])
            matched_name = str(metadata.iloc[idx]["image_name"])
            matched_path = str(local_paths[idx]).replace("\\", "/")
            exists = file_exists_win("images", matched_name)

            if rank == 1 and (dist > 0.999 or matched_name == test_filename):
                exact_in_db = True
                exact_match_filename = matched_name

            if rank <= 5:
                top_5_matches.append(matched_name)

            rec = {
                "test_image": test_filename,
                "rank": rank,
                "faiss_index": idx,
                "similarity": round(dist, 6),
                "matched_image_name": matched_name,
                "matched_image_path": matched_path,
                "file_exists": exists
            }
            image_results.append(rec)
            all_results.append(rec)

            print(f"\nRank {rank}")
            print(f"FAISS index     : {idx}")
            print(f"Similarity      : {dist:.6f}")
            print(f"Image name      : {matched_name}")
            print(f"Local image path: {matched_path}")
            print(f"File exists     : {exists}")

        # Summary for this test image
        top1_rec = image_results[0]
        summary_rows.append({
            "test_image": test_filename,
            "top1_match": top1_rec["matched_image_name"],
            "top1_similarity": top1_rec["similarity"],
            "top5_matches": ", ".join(top_5_matches)
        })

        if exact_in_db:
            print(f"\nNote: Test image is present in the database; Rank 1 match '{exact_match_filename}' is an exact match.")
        else:
            print(f"\nNote: Test image '{test_filename}' is external (not in database). Nearest dataset match: '{top1_rec['matched_image_name']}' ({top1_rec['similarity']:.6f}).")

    # Save CSV
    csv_path = os.path.join(TEST_IMAGES_DIR, "retrieval_results.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "test_image", "rank", "faiss_index", "similarity",
            "matched_image_name", "matched_image_path", "file_exists"
        ])
        writer.writeheader()
        writer.writerows(all_results)
    print(f"\nSaved CSV results to: '{csv_path}'")

    # Save JSON
    json_path = os.path.join(TEST_IMAGES_DIR, "retrieval_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)
    print(f"Saved JSON results to: '{json_path}'")

    # Print Summary Table
    print("\n" + "=" * 80)
    print("EXTERNAL RETRIEVAL EVALUATION SUMMARY TABLE")
    print("=" * 80)
    header = f"{'Test Image':<15} | {'Top 1 Match':<35} | {'Top 1 Similarity':<16} | {'Top 5 Best Matches'}"
    print(header)
    print("-" * 100)
    for row in summary_rows:
        top1 = row['top1_match']
        if len(top1) > 33:
            top1 = top1[:30] + "..."
        print(f"{row['test_image']:<15} | {top1:<35} | {row['top1_similarity']:<16.6f} | {row['top5_matches']}")
    print("=" * 80)

if __name__ == "__main__":
    main()
