import os
import json
import pandas as pd
import numpy as np

def create_strict_data_split():
    print("=" * 80)
    print("DIGITAL HERITAGE AI — STRICT ARTIFACT-LEVEL DATA SPLIT (PHASE 3)")
    print("=" * 80)

    base_dir = "ai_microservice"
    ref_gt_path = "data/ground_truth/reference_ground_truth.csv"
    query_gt_path = "data/ground_truth/query_ground_truth.csv"

    output_dir = "data/splits"
    os.makedirs(output_dir, exist_ok=True)

    ref_df = pd.read_csv(ref_gt_path)
    query_df = pd.read_csv(query_gt_path)

    print(f"Total Reference Images       : {len(ref_df):,}")
    print(f"Total Independent Test Images: {len(query_df):,}")

    # Set random seed for scientific reproducibility
    np.random.seed(42)

    # Group reference images by artifact_id to ensure split at ARTIFACT level
    artifact_groups = ref_df.groupby('artifact_id')
    unique_artifacts = list(artifact_groups.groups.keys())
    print(f"Total Unique Artifact Groups : {len(unique_artifacts):,}")

    # Shuffle artifact groups
    shuffled_artifacts = np.random.permutation(unique_artifacts)

    # 85% Train, 15% Validation split on reference database
    n_artifacts = len(shuffled_artifacts)
    val_cutoff = int(n_artifacts * 0.15)
    
    val_artifacts = set(shuffled_artifacts[:val_cutoff])
    train_artifacts = set(shuffled_artifacts[val_cutoff:])

    train_indices = []
    val_indices = []

    for idx, row in ref_df.iterrows():
        art_id = row['artifact_id']
        if art_id in val_artifacts:
            val_indices.append(idx)
        else:
            train_indices.append(idx)

    train_df = ref_df.iloc[train_indices].copy()
    val_df = ref_df.iloc[val_indices].copy()

    print(f"Train Reference Images       : {len(train_df):,} ({len(train_artifacts)} artifact groups)")
    print(f"Val Reference Images         : {len(val_df):,} ({len(val_artifacts)} artifact groups)")

    # Save splits
    train_df.to_csv(os.path.join(output_dir, "train_reference_split.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val_reference_split.csv"), index=False)
    query_df.to_csv(os.path.join(output_dir, "independent_test_split.csv"), index=False)

    print("\nSaved split CSVs in 'data/splits/':")
    print("  - train_reference_split.csv")
    print("  - val_reference_split.csv")
    print("  - independent_test_split.csv")

    # Document DATA_SPLIT.md
    doc_path = "experiments/artifact_retrieval_v2/DATA_SPLIT.md"
    doc_content = f"""# Strict Data Split Strategy — Digital Heritage AI

**Document Path**: `experiments/artifact_retrieval_v2/DATA_SPLIT.md`  
**Random Seed**: `42`  

---

## 1. Principles of Data Leakage Prevention

In multi-view antiquity retrieval, splitting individual photographs randomly leads to severe **data leakage**, as multiple photos of the same physical statue appear in both training and evaluation splits.

To prevent this:
1. **Independent Test Set Isolation**: All {len(query_df)} independent test query images remain 100% untouched and isolated.
2. **Artifact-Level Group Splitting**: The reference database is split into Train and Validation sets at the **Artifact Group Level** (`artifact_id`), guaranteeing that photos of the same antiquity group never span across both Train and Validation sets.

---

## 2. Dataset Split Breakdown

| Dataset Split | Role | Image Count | Unique Artifact Groups | Percent |
| :--- | :--- | :---: | :---: | :---: |
| **TRAIN** | Projection Head & Metric Learning Training | **{len(train_df):,}** | **{len(train_artifacts):,}** | ~85.0% |
| **VALIDATION** | Model Hyperparameter Tuning & Model Selection | **{len(val_df):,}** | **{len(val_artifacts):,}** | ~15.0% |
| **INDEPENDENT TEST** | Final Evaluation Only | **{len(query_df):,}** | **8 Categories** | Isolated |

---

## 3. Split Files Location

- Train Split: [`data/splits/train_reference_split.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/splits/train_reference_split.csv)
- Val Split: [`data/splits/val_reference_split.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/splits/val_reference_split.csv)
- Test Split: [`data/splits/independent_test_split.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/splits/independent_test_split.csv)
"""

    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(doc_content)
    print(f"Created documentation: {doc_path}")

if __name__ == "__main__":
    create_strict_data_split()
