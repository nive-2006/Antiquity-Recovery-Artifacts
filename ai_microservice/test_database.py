import os
import numpy as np
import faiss
import pandas as pd

DATA_DIR = "data"

FAISS_FILE = os.path.join(DATA_DIR, "dinov2_faiss.index")
EMBEDDINGS_FILE = os.path.join(DATA_DIR, "dinov2_embeddings.npy")
PATHS_FILE = os.path.join(DATA_DIR, "image_paths.npy")
METADATA_FILE = os.path.join(DATA_DIR, "master_image_metadata.csv")

print("Loading local heritage database...\n")

# Check files
for file in [
    FAISS_FILE,
    EMBEDDINGS_FILE,
    PATHS_FILE,
    METADATA_FILE
]:
    print(file, "->", os.path.exists(file))

# Load
index = faiss.read_index(FAISS_FILE)
embeddings = np.load(EMBEDDINGS_FILE)
image_paths = np.load(PATHS_FILE, allow_pickle=True)
metadata = pd.read_csv(METADATA_FILE)

print("\n========== DATABASE TEST ==========")
print("FAISS vectors    :", index.ntotal)
print("FAISS dimension  :", index.d)
print("Embeddings shape :", embeddings.shape)
print("Image paths      :", len(image_paths))
print("Metadata rows    :", len(metadata))

print("\nFirst metadata:")
print(metadata.iloc[0])

print("\n========== RESULT ==========")

if (
    index.ntotal == 20399
    and index.d == 768
    and embeddings.shape == (20399, 768)
    and len(image_paths) == 20399
    and len(metadata) == 20399
):
    print("SUCCESS: Local heritage database is working!")
else:
    print("WARNING: Database dimensions do not match expected values.")