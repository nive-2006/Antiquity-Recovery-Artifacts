import os
import sys
import numpy as np
import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
IMAGES_DIR = os.path.join(SCRIPT_DIR, "images")

MASTER_METADATA_PATH = os.path.join(DATA_DIR, "master_image_metadata.csv")
HERITAGE_METADATA_PATH = os.path.join(DATA_DIR, "heritage_metadata.csv")
LOCAL_PATHS_PATH = os.path.join(DATA_DIR, "image_paths_local.npy")

EXPECTED_FIELDS = [
    "image_id", "image_name", "image_path", "artifact_name", "temple_name",
    "monument_name", "deity_or_subject", "artifact_type", "material",
    "architectural_style", "location", "district", "state", "country",
    "historical_period", "approximate_date", "dynasty", "description",
    "historical_background", "provenance", "current_location",
    "metadata_source", "source_url", "metadata_confidence",
    "verification_status", "metadata_generated_by", "last_updated"
]

VALID_STATUSES = {"verified", "partially_verified", "candidate", "unverified"}

def validate():
    if not os.path.exists(MASTER_METADATA_PATH):
        print(f"Error: Master image metadata missing at '{MASTER_METADATA_PATH}'")
        sys.exit(1)

    if not os.path.exists(HERITAGE_METADATA_PATH):
        print(f"Error: Heritage metadata CSV missing at '{HERITAGE_METADATA_PATH}'")
        sys.exit(1)

    master_df = pd.read_csv(MASTER_METADATA_PATH)
    meta_df = pd.read_csv(HERITAGE_METADATA_PATH)

    total_master_images = len(master_df)
    total_meta_records = len(meta_df)

    # 1. Total images comparison
    missing_metadata = max(0, total_master_images - total_meta_records)

    # 2. Check schema columns
    missing_cols = [c for c in EXPECTED_FIELDS if c not in meta_df.columns]
    if missing_cols:
        print(f"Validation Error: Schema missing required columns: {missing_cols}")
        sys.exit(1)

    # 3. Duplicate Image IDs & Filenames
    dup_ids = total_master_images - master_df["image_id"].nunique()
    dup_names = total_master_images - master_df["image_name"].nunique()

    # Build set of existing files in images directory for O(1) exact match
    existing_files_set = set(os.listdir(IMAGES_DIR))

    missing_images = 0
    broken_paths = 0

    if os.path.exists(LOCAL_PATHS_PATH):
        local_paths = np.load(LOCAL_PATHS_PATH, allow_pickle=True)
    else:
        local_paths = []

    faiss_mapping_pass = True

    for i in range(total_meta_records):
        row = meta_df.iloc[i]
        img_name = str(row["image_name"])

        if img_name not in existing_files_set:
            missing_images += 1
            broken_paths += 1

        # Check alignment with FAISS local_paths[i]
        if i < len(local_paths):
            lp_basename = os.path.basename(str(local_paths[i]).replace("\\", "/"))
            if lp_basename != img_name:
                faiss_mapping_pass = False

    # 5. Status counts
    status_counts = meta_df["verification_status"].value_counts().to_dict()
    v_verified = status_counts.get("verified", 0)
    v_partially = status_counts.get("partially_verified", 0)
    v_candidate = status_counts.get("candidate", 0)
    v_unverified = status_counts.get("unverified", 0)

    # 6. Check status values valid
    invalid_statuses = set(meta_df["verification_status"].dropna().unique()) - VALID_STATUSES

    passed = (
        total_meta_records == total_master_images and
        missing_metadata == 0 and
        missing_images == 0 and
        broken_paths == 0 and
        len(invalid_statuses) == 0 and
        faiss_mapping_pass
    )

    print("========================================")
    print("HERITAGE METADATA VALIDATION")
    print("========================================")
    print(f"\nImages                  : {total_master_images}")
    print(f"Metadata records        : {total_meta_records}")
    print(f"Missing metadata        : {missing_metadata}")
    print(f"Missing images          : {missing_images}")
    print(f"Duplicate image IDs     : {dup_ids}")
    print(f"Broken paths            : {broken_paths}")
    print(f"\nVerified                : {v_verified}")
    print(f"Partially verified      : {v_partially}")
    print(f"Candidate               : {v_candidate}")
    print(f"Unverified              : {v_unverified}")
    print(f"\nFAISS mapping check     : {'PASSED' if faiss_mapping_pass else 'FAILED'}")
    print(f"Validation: {'PASSED' if passed else 'FAILED'}")
    print("========================================")

    if not passed:
        sys.exit(1)

if __name__ == "__main__":
    validate()
