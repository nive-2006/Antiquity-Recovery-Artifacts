# Project Audit — Digital Heritage Identity / Antiquity Recovery

**Date**: October 6, 2026  
**Project**: Digital Heritage Identity / Antiquity Recovery Artifact Retrieval  
**Audit Location**: `experiments/artifact_retrieval_v2/PROJECT_AUDIT.md`  

---

## 1. Executive Summary & Overview

This audit documents the baseline architecture, data structures, model checkpoints, and evaluation results for the Digital Heritage AI image retrieval system. The system performs fine-grained visual retrieval of heritage antiquities and artifacts using a DINOv2 backbone, a 2-layer MLP projection head, and a FAISS vector index.

---

## 2. Identified Pipeline Components & Code Structure

| Component | Location / File | Description |
| :--- | :--- | :--- |
| **DINOv2 Loading** | [`ai_microservice/dinov2_service.py`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/dinov2_service.py) | Loads `facebook/dinov2-base`, extracts 768-D `[CLS]` token output. |
| **Projection Head** | [`ai_microservice/generate_trained_embeddings.py`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/generate_trained_embeddings.py) | 2-layer MLP: `Linear(768, 512) -> GELU -> Linear(512, 256) -> L2 Normalization`. |
| **Embedding Generation** | [`ai_microservice/generate_trained_embeddings.py`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/generate_trained_embeddings.py) | Batch passes 768-D base embeddings through projection head to produce normalized 256-D vectors. |
| **FAISS Index Creation** | [`ai_microservice/generate_trained_embeddings.py`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/generate_trained_embeddings.py) | Constructs `faiss.IndexFlatIP(256)` using 20,399 L2-normalized 256-D vectors. |
| **FAISS Search** | [`ai_microservice/evaluate_external_retrieval.py`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/evaluate_external_retrieval.py) | Executes $K$-nearest neighbor similarity search ($K=10$) via Inner Product. |
| **Evaluation Pipeline** | [`evaluation/independent_test_evaluation.py`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/evaluation/independent_test_evaluation.py) | Evaluates baseline 768-D vs trained 256-D models on 100 independent test images. |
| **Master Metadata** | [`ai_microservice/data/master_image_metadata.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/data/master_image_metadata.csv) | Index mapping (20,399 rows: `image_id`, `image_name`, `image_path`, `embedding_index`). |
| **Heritage Metadata** | [`ai_microservice/data/heritage_metadata.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/data/heritage_metadata.csv) | 20,399 rows with 27 attributes (`deity_or_subject`, `artifact_name`, `temple_name`, etc.). |
| **Reference Images** | [`ai_microservice/images/`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/images/) | 20,399 reference database image files. |
| **Independent Test Set**| [`ai_microservice/independent_test/`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/independent_test/) | 100 independent query images across 8 deity/subject subfolders. |

---

## 3. Checkpoints & Precomputed Embeddings

- **Checkpoint Path**: [`ai_microservice/data/best_projection_head.pt`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/ai_microservice/data/best_projection_head.pt)
  - **State**: Loaded as PyTorch `OrderedDict`.
  - **Weights Verified**:
    - `network.0.weight`: $[512, 768]$ ($393,216$ parameters)
    - `network.0.bias`: $[512]$ ($512$ parameters)
    - `network.2.weight`: $[256, 512]$ ($131,072$ parameters)
    - `network.2.bias`: $[256]$ ($256$ parameters)
    - **Total Trainable Parameters**: **525,056**
- **Embeddings Verification**:
  - `dinov2_embeddings.npy`: $[20399, 768]$, L2-norm $= 1.0000$ (normalized).
  - `trained_all_embeddings.npy`: $[20399, 256]$, L2-norm $= 1.0000$ (normalized).

---

## 4. Current Experimental Results Audit

The existing baseline evaluation yields the following measured metrics on the 100 independent test query images:

| Model | Recall@1 | Recall@5 | Recall@10 | Precision@1 | Precision@5 | Precision@10 | mAP@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline DINOv2-base (768-D)** | **14.00%** | **29.00%** | **42.00%** | **14.00%** | **8.40%** | **7.80%** | **18.62%** |
| **Trained Projection Head (256-D)** | **8.00%** | **23.00%** | **33.00%** | **8.00%** | **8.20%** | **7.70%** | **13.56%** |

### Key Observations:
1. **Normalization**: Both 768-D raw DINOv2 embeddings and 256-D projection head outputs are explicitly L2-normalized ($||x||_2 = 1.0$). Therefore, FAISS `IndexFlatIP` computes exact Cosine Similarity.
2. **Dimension vs Accuracy Trade-off**: The 256-D projection head compresses vector dimension by 3× (768 $\to$ 256), reducing storage footprint from ~62.6 MB to ~20.8 MB. However, it experiences a 5.06% drop in mAP@10 compared to raw DINOv2 768-D embeddings.
3. **Classification Metrics**: Classification metrics (Accuracy, Precision, Recall, F1) were **not** calculated because explicit deity/artifact ground truth labels are missing for **95.98% (19,579 / 20,399)** of reference images in the database.

---

## 5. Identified Bottlenecks & Potential Problems

1. **Missing Unique Artifact IDs**:
   - Out of 20,399 reference images, 19,579 have `deity_or_subject = NaN`.
   - Many reference images share generic descriptive titles (e.g. *"Sculpture from Badami Cave Temples"*, *"Shiva Sculpture"*), making multi-view artifact association ambiguous without explicit artifact IDs.
2. **Suboptimal Projection Head Tuning**:
   - The current 256-D projection head was trained without hard negative mining or multi-view positive pairs, causing dimensional bottleneck loss without gaining class/identity separation.
3. **Background & Context Clutter**:
   - Images contain noisy background elements (temple walls, lighting shifts, tourist crowds), which influence global DINOv2 embeddings.

---

## 6. Recommended Academic Next Steps

1. **Ground Truth Standardization**: Establish explicit `artifact_id` schema mapping multi-view photos of identical antiquities.
2. **Data Quality Audit**: Scan for corrupted files, duplicates, and unreadable images.
3. **Strict Artifact-Level Split**: Split data into Train/Val/Independent Test at the **artifact level** to prevent photographic leakage.
4. **Metric Learning with Hard Negatives**: Fine-tune projection head using Triplet / Contrastive Loss with hard negative mining on training set only.
5. **Artifact-Detection Cropping**: Test detector-based cropping to focus embeddings strictly on antiquity subjects.
