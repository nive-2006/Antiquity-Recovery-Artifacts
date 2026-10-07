# Model Ablation Study — Digital Heritage AI

**Document Path**: `outputs/ablation/ablation_table.md`  

| Model Variant | Recall@1 | Recall@5 | Recall@10 | Precision@1 | Precision@5 | Precision@10 | mAP@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. DINOv2 768-D Raw** | 14.00% | 28.00% | 40.00% | 14.00% | 8.20% | 7.40% | **18.01%** |
| **2. DINOv2 + Existing 256-D Projection** | 8.00% | 20.00% | 28.00% | 8.00% | 7.20% | 6.70% | **12.19%** |
| **3. DINOv2 + L2 Normalization (256-D)** | 8.00% | 20.00% | 28.00% | 8.00% | 7.20% | 6.70% | **12.19%** |
| **4. DINOv2 + Refined Projection (256-D)** | 0.00% | 8.00% | 10.00% | 0.00% | 1.60% | 1.30% | **2.63%** |
| **5. Fine-Tuned DINOv2 + Hard Negatives (256-D)** | 0.00% | 8.00% | 10.00% | 0.00% | 1.60% | 1.30% | **2.63%** |
