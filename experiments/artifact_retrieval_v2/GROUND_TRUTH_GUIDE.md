# Artifact Ground-Truth Guide — Digital Heritage AI

**Document Path**: `experiments/artifact_retrieval_v2/GROUND_TRUTH_GUIDE.md`  
**Ground Truth Files**:
- Query Ground Truth: [`data/ground_truth/query_ground_truth.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/ground_truth/query_ground_truth.csv)
- Reference Ground Truth: [`data/ground_truth/reference_ground_truth.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/data/ground_truth/reference_ground_truth.csv)

---

## 1. Purpose & Standards

In heritage artifact retrieval, multiple photographs may depict the exact same physical antiquity (e.g. front view, side profile, detail close-up, historical archive photo). This ground-truth system defines explicit, verified **Artifact IDs** (`artifact_id`) for every query image and reference database image.

### Crucial Scientific Rule:
- Ground-truth relevance is based **strictly on verified physical identity**, **never** on FAISS search predictions or model similarity scores.

---

## 2. Ground-Truth Schema Format

### Query Ground Truth (`query_ground_truth.csv`):
```csv
query_id,query_image,category_class,artifact_id
Q_001,Buddha/buddha_1.jpg,Buddha,ART_CLASS_BUDDHA
Q_002,Buddha/buddha_10.jpg,Buddha,ART_CLASS_BUDDHA
...
```

### Reference Ground Truth (`reference_ground_truth.csv`):
```csv
reference_image_id,reference_image,deity_or_subject,artifact_name,artifact_id
REF_00001,%22A_beautiful_stone_work_in_Konark_Sun_Temple%22,,,UNVERIFIED_PENDING_ANNOTATION
REF_00002,0040323_Vishnu,_Cham_Hindu_god_artwork,_Museum...;Vishnu;Vishnu Sculpture;ART_DEITY_VISHNU
...
```

---

## 3. Metadata Coverage & Missing Data Analysis

1. **Query Images (100 Test Images)**:
   - All 100 independent query images are assigned ground-truth category group IDs (`ART_CLASS_BUDDHA`, `ART_CLASS_GANESHA`, `ART_CLASS_HANUMAN`, `ART_CLASS_LAKSHMI`, `ART_CLASS_MURUGAN`, `ART_CLASS_NATARAJA`, `ART_CLASS_SHIVA`, `ART_CLASS_VISHNU`).

2. **Reference Images (20,399 Reference Images)**:
   - **820 images** have verified deity/subject metadata (`deity_or_subject`), assigned to explicit deity artifact groups (`ART_DEITY_SHIVA`, `ART_DEITY_VISHNU`, etc.).
   - **19,579 images** (95.98%) currently have `UNVERIFIED_PENDING_ANNOTATION` status as their exact antiquity identity has not yet been manually cataloged by expert archaeologists.

---

## 4. Instructions for Updating & Verification

When expert archaeological annotations or verified museum catalog numbers become available:
1. Open `data/ground_truth/reference_ground_truth.csv`.
2. Replace `UNVERIFIED_PENDING_ANNOTATION` in the `artifact_id` column with the exact unique artifact identifier (e.g., `ART_MUSEUM_SUB_1049`).
3. Re-run the evaluation script to automatically compute multi-view fine-grained Precision/Recall and mAP metrics against the updated ground truth.
