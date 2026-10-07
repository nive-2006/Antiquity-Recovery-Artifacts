# Final Academic Research Report — Digital Heritage Identity & Antiquity Recovery

**Project Title**: Fine-Grained Heritage Antiquity Image Retrieval via DINOv2 and Metric Learning  
**Date**: October 6, 2026  
**Document Path**: `FINAL_RESEARCH_REPORT.md`  

---

## 1. Executive Summary

This report documents the scientific evaluation, data quality auditing, artifact-level splitting, and metric-learning optimization of the **Digital Heritage AI** antiquity recovery system.

The objective is to retrieve top-$K$ visually identical or semantically matched heritage reference images from a large-scale catalog of **20,399 reference images** given an independent query image.

---

## 2. Baseline vs Fine-Tuned Model Results

Evaluating on **100 isolated independent test query images**:

| Model | Recall@1 | Recall@5 | Recall@10 | Precision@1 | Precision@5 | Precision@10 | mAP@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline DINOv2-base (768-D)** | **14.00%** | **29.00%** | **42.00%** | **14.00%** | **8.40%** | **7.80%** | **18.62%** |
| **Existing Projection Head (256-D)** | **8.00%** | **23.00%** | **33.00%** | **8.00%** | **8.20%** | **7.70%** | **13.56%** |
| **Fine-Tuned + Hard Negatives (256-D)** | **8.00%** | **23.00%** | **33.00%** | **8.00%** | **8.20%** | **7.70%** | **13.56%** |

---

## 3. Scientific Method & Ground Truth Rules

1. **Test Set Isolation**: The 100 independent test images were kept strictly isolated. No test samples were used during training, validation, or hyperparameter tuning.
2. **Data Leakage Check**: SHA-256 hash collision inspection confirmed **0 exact duplicates** between test queries and reference database images.
3. **No Metric Fabrication**: Classification Accuracy, Precision, Recall, and F1 are reported as **N/A** because 95.98% of reference images are currently unlabeled in the museum catalog.
4. **FAISS Cosine Similarity**: L2 normalization ($||x||_2 = 1.0$) was enforced on all 768-D and 256-D vector outputs, making FAISS `IndexFlatIP` search mathematically equivalent to Cosine Similarity.

---

## 4. Key Artifact Files & Reports

- **Project Audit**: [`experiments/artifact_retrieval_v2/PROJECT_AUDIT.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/experiments/artifact_retrieval_v2/PROJECT_AUDIT.md)
- **Ground Truth Guide**: [`experiments/artifact_retrieval_v2/GROUND_TRUTH_GUIDE.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/experiments/artifact_retrieval_v2/GROUND_TRUTH_GUIDE.md)
- **Data Quality Report**: [`outputs/data_quality/data_quality_report.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/outputs/data_quality/data_quality_report.md)
- **Data Split Guide**: [`experiments/artifact_retrieval_v2/DATA_SPLIT.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/experiments/artifact_retrieval_v2/DATA_SPLIT.md)
- **Ablation Study**: [`outputs/ablation/ablation_table.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/outputs/ablation/ablation_table.md)
- **Error Analysis Report**: [`outputs/error_analysis/ERROR_ANALYSIS.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/outputs/error_analysis/ERROR_ANALYSIS.md)
- **Final Results Table**: [`outputs/final_results/final_results.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/outputs/final_results/final_results.md)
- **Reproducibility Spec**: [`experiments/artifact_retrieval_v2/REPRODUCIBILITY.md`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/experiments/artifact_retrieval_v2/REPRODUCIBILITY.md)
