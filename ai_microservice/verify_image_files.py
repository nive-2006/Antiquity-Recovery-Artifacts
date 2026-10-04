import os
import random
import pandas as pd

def file_exists_win(dir_path, filename):
    abs_p = os.path.abspath(os.path.join(dir_path, str(filename)))
    if os.name == 'nt' and not abs_p.startswith('\\\\?\\'):
        abs_p = '\\\\?\\' + abs_p
    return os.path.exists(abs_p)

def main():
    metadata_file = os.path.join("data", "master_image_metadata.csv")
    images_dir = "images"

    if not os.path.exists(metadata_file):
        raise FileNotFoundError(f"Metadata file not found at '{metadata_file}'")
    if not os.path.exists(images_dir):
        raise FileNotFoundError(f"Images directory not found at '{images_dir}'")

    metadata = pd.read_csv(metadata_file)
    expected_image_names = metadata["image_name"].tolist()

    all_dir_files = set(os.listdir(images_dir))
    expected_set = set(expected_image_names)

    found_count = sum(1 for name in expected_image_names if file_exists_win(images_dir, name))
    missing_count = len(expected_image_names) - found_count
    extra_count = len(all_dir_files - expected_set)

    # Index 214 Verification
    idx_214_name = metadata.iloc[214]["image_name"]
    idx_214_path = os.path.join(images_dir, idx_214_name).replace("\\", "/")
    idx_214_exists = file_exists_win(images_dir, idx_214_name)

    # Random Sample Verification (20 random items)
    random.seed(42)
    sample_indices = random.sample(range(len(metadata)), 20)
    sample_passed = True
    for i in sample_indices:
        img_name = metadata.iloc[i]["image_name"]
        if not file_exists_win(images_dir, img_name):
            sample_passed = False
            break

    print("========================================")
    print("LOCAL IMAGE FILE VERIFICATION")
    print("========================================")
    print(f"\nExpected images : {len(expected_image_names)}")
    print(f"Found images    : {found_count}")
    print(f"Missing images  : {missing_count}")
    print(f"Extra images    : {extra_count}")

    print(f"\nIndex 214:")
    print(f"Image name      : {idx_214_name}")
    print(f"Local path      : {idx_214_path}")
    print(f"File exists     : {idx_214_exists}")

    print(f"\nRandom sample verification: {'PASSED' if sample_passed else 'FAILED'}")

    if found_count == len(expected_image_names) and idx_214_exists and sample_passed:
        print("\nALL 20399 IMAGE FILES FOUND")
        print("IMAGE PATH SYSTEM READY")

if __name__ == "__main__":
    main()
