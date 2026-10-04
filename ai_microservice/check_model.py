import torch
import numpy as np
import faiss

# Paths are relative to the ai_microservice folder (where your terminal is)
ckpt = torch.load("data/best_projection_head.pt", map_location="cpu")
print("Checkpoint type:", type(ckpt))
if isinstance(ckpt, dict):
    for k, v in ckpt.items():
        print(k, getattr(v, "shape", type(v)))

# Check that the index and image paths are in sync
index = faiss.read_index("data/dinov2_faiss.index")
paths = np.load("data/image_paths.npy", allow_pickle=True)
print("FAISS vectors:", index.ntotal)
print("Image paths:", len(paths))
print("First 5 paths:", paths[:5])