# Strict Data Split Strategy — Digital Heritage AI

**Document Path**: `experiments/artifact_retrieval_v2/DATA_SPLIT.md`  
**Random Seed**: `42`  

---

## 1. Principles of Data Leakage Prevention

In multi-view antiquity retrieval, splitting individual photographs randomly leads to severe **data leakage**, as multiple photos of the same physical statue appear in both training and evaluation splits.

To prevent this:
1. **Independent Test Set Isolation**: All 100 independent test query images remain 100% untouched and isolated.
2. **Artifact-Level Group Splitting**: The reference database is split into Train and Validation sets at the **Artifact Group Level** (`artifact_id`), guaranteeing that photos of the same antiquity group never span across both Train and Validation sets.

---

## 2. Dataset Split Breakdown

| Dataset Split | Role | Image Count | Unique Artifact Groups | Percent |
| :--- | :--- | :---: | :---: | :---: |
| **TRAIN** | Projection Head & Metric Learning Training | **20,051** | **68** | ~85.0% |
| **VALIDATION** | Model Hyperparameter Tuning & Model Selection | **348** | **11** | ~15.0% |
| **INDEPENDENT TEST** | Final Evaluation Only | **100** | **8 Categories** | Isolated |

---

## 3. Split Files Location

- Train Split: [`data/splits/train_reference_split.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/splits/train_reference_split.csv)
- Val Split: [`data/splits/val_reference_split.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/splits/val_reference_split.csv)
- Test Split: [`data/splits/independent_test_split.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/splits/independent_test_split.csv)
