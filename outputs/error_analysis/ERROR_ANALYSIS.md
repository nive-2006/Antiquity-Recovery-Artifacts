# Error Analysis Report — Digital Heritage AI

**Document Path**: `outputs/error_analysis/ERROR_ANALYSIS.md`  
**Total Evaluation Queries**: 100  
**Top-1 Misclassifications / Unlabeled Matches**: 100  

---

## 1. Primary Failure Mode Breakdown

1. **Unlabeled Reference Images (95.98% Dataset Unlabeled)**:
   - Queries retrieving stone relief sculptures or temple carvings where `deity_or_subject = NaN`.
2. **Pose & Material Ambiguity**:
   - High visual similarity between bronze idols of different deities sharing identical architectural framing.
3. **Lighting & Texture Variations**:
   - Severe lighting differences between field photograph query images and museum archive reference images.

---

## 2. Sample Failure Cases Log

Saved detailed CSV log: [`outputs/error_analysis/error_cases.csv`](file:///c:/Users/Dell/OneDrive/Desktop/pep-project-2/pep-project-2/outputs/error_analysis/error_cases.csv)
