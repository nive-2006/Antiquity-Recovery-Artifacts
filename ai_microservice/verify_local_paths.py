import os
import random
import numpy as np
import pandas as pd

def main():
    metadata_file = os.path.join("data", "master_image_metadata.csv")
    local_paths_file = os.path.join("data", "image_paths_local.npy")

    if not os.path.exists(metadata_file):
        raise FileNotFoundError(f"Metadata file not found at '{metadata_file}'")
    if not os.path.exists(local_paths_file):
        raise FileNotFoundError(f"Local paths file not found at '{local_paths_file}'")

    metadata = pd.read_csv(metadata_file)
    local_paths = np.load(local_paths_file, allow_pickle=True)

    metadata_rows = len(metadata)
    local_paths_count = len(local_paths)

    total_images = len(metadata["image_name"])
    unique_filenames = metadata["image_name"].nunique()
    duplicate_filenames = total_images - unique_filenames

    # Check index 214
    idx_214_meta_name = metadata.iloc[214]["image_name"]
    idx_214_local_path = local_paths[214]
    idx_214_match = (os.path.basename(idx_214_local_path) == idx_214_meta_name) and idx_214_local_path.startswith("images/")

    # Sample 20 random indices verification
    random.seed(42)
    sample_indices = random.sample(range(metadata_rows), 20)
    sample_matches = [
        (os.path.basename(local_paths[i]) == metadata.iloc[i]["image_name"]) and local_paths[i].startswith("images/")
        for i in sample_indices
    ]
    all_samples_pass = all(sample_matches)

    # Full 20399 check
    full_matches = [
        (os.path.basename(local_paths[i]) == metadata.iloc[i]["image_name"]) and local_paths[i].startswith("images/")
        for i in range(metadata_rows)
    ]
    all_full_pass = (metadata_rows == 20399) and (local_paths_count == 20399) and all(full_matches)

    print("========================================")
    print("LOCAL IMAGE PATH MAPPING TEST")
    print("========================================")
    print(f"\nMetadata rows       : {metadata_rows}")
    print(f"Local paths         : {local_paths_count}")
    print(f"Unique filenames    : {unique_filenames}")
    print(f"Duplicate filenames : {duplicate_filenames}")
    print(f"\nIndex 214:")
    print(f"Metadata image name : {idx_214_meta_name}")
    print(f"Local image path    : {idx_214_local_path}")
    print(f"Filename match      : {idx_214_match}")
    print(f"\nSample (20 random rows) match check: {'Passed' if all_samples_pass else 'Failed'}")
    print("\nOverall mapping:")
    if all_full_pass and idx_214_match:
        print("SUCCESS")
    else:
        print("FAILED")

if __name__ == "__main__":
    main()
