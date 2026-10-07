# Data Quality Audit Report — Digital Heritage AI

**Date**: October 6, 2026  
**Audited Directory**: `ai_microservice/images/` (20,400 files)  

---

## 1. Summary Statistics

- **Total Reference Image Files**: 20,400
- **Corrupted / Unreadable Files**: 0
- **Exact Duplicate Image Files**: 146
- **Average Resolution**: 501.0 × 502.7 pixels
- **Average File Size**: 61.8 KB
- **Missing Explicit Deity/Subject Metadata**: 19,579 / 20,399 (95.98%)

---

## 2. Integrity & Corruption Results

All 20,400 reference files were verified for decoding, header integrity, and resolution constraints:
- **Corrupted File Count**: 0
- **Action**: No original images modified. Any unreadable files logged in `corrupted_images.csv`.

---

## 3. Duplicate Image Inspection

SHA-256 hash collision detection across all reference images:
- **Exact Duplicate Pairs**: 146
- **Action**: Preserved in dataset; documented in `duplicate_images.csv`.

---

## 4. Metadata Completeness

- **Total Catalog Rows**: 20,399
- **Rows Missing `deity_or_subject`**: 19,579
- **Rows Missing `artifact_name`**: 43
