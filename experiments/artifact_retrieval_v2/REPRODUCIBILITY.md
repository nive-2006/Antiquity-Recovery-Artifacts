# Research Reproducibility Specification — Digital Heritage AI

**Document Path**: `experiments/artifact_retrieval_v2/REPRODUCIBILITY.md`  

---

## 1. System Environment
- **Python Version**: 3.12.10
- **PyTorch Version**: 2.14.0+cpu
- **Device**: cpu
- **Backbone**: `facebook/dinov2-base` (768-D CLS token)
- **FAISS Version**: `faiss-cpu`

---

## 2. Dataset & Split Specifications
- **Reference Database**: 20,399 images (`ai_microservice/images/`)
- **Train Split**: 20,051 images (68 artifact groups)
- **Validation Split**: 348 images (11 artifact groups)
- **Independent Test Split**: 100 images (8 deity/subject categories)
- **Random Seed**: `42`

---

## 3. Training Hyperparameters (Fine-Tuned Projection Head)
- **Embedding Output Dimension**: 256
- **Loss Function**: Triplet Margin Loss (Margin = 0.3)
- **Hard Negative Mining**: Mined hardest negative within train batch per epoch
- **Optimizer**: AdamW (Learning Rate = 1e-3, Weight Decay = 1e-4)
- **Epochs**: 15
