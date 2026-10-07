import os
import sys
import json
import csv
import time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import matplotlib.pyplot as plt

# Optional Scikit-Learn Imports with Pure NumPy Fallbacks
try:
    from sklearn.metrics import (
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        average_precision_score,
        confusion_matrix,
        classification_report
    )
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False

# -------------------------------------------------------------------------
# PURE NUMPY COSINE SIMILARITY FALLBACK
# -------------------------------------------------------------------------
def np_cosine_similarity(a, b):
    a_norm = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-10)
    b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-10)
    return np.dot(a_norm, b_norm.T)

# -------------------------------------------------------------------------
# 1. PROJECTION HEAD ARCHITECTURE
# -------------------------------------------------------------------------
class ProjectionHead(nn.Module):
    def __init__(self, input_dim=768, hidden_dim=512, output_dim=256):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, output_dim)
        )

    def forward(self, x):
        x = self.network(x)
        x = F.normalize(x, p=2, dim=1)
        return x

# -------------------------------------------------------------------------
# 2. MAIN EVALUATION ENGINE
# -------------------------------------------------------------------------
def run_evaluation(
    data_dir="data",
    images_dir="images",
    output_dir="eval_output",
    num_query_samples=200
):
    print("=" * 60, flush=True)
    print("DINOv2 + PROJECTION HEAD HERITAGE RETRIEVAL EVALUATION", flush=True)
    print("=" * 60, flush=True)

    # Determine destination directory
    if os.path.exists("/kaggle/working"):
        save_dir = "/kaggle/working"
    else:
        save_dir = output_dir
    os.makedirs(save_dir, exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using execution device: {device}", flush=True)
    print(f"FAISS Available       : {FAISS_AVAILABLE}", flush=True)
    print(f"Scikit-Learn Available: {SKLEARN_AVAILABLE}", flush=True)
    print(f"Results Output Dir    : {save_dir}", flush=True)

    # Paths
    checkpoint_path = os.path.join(data_dir, "best_projection_head.pt")
    embeddings_path = os.path.join(data_dir, "trained_all_embeddings.npy")
    local_paths_path = os.path.join(data_dir, "image_paths_local.npy")
    faiss_path = os.path.join(data_dir, "trained_dinov2_faiss.index")

    # Verify required reference files exist
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Missing projection head checkpoint: '{checkpoint_path}'")
    if not os.path.exists(embeddings_path):
        raise FileNotFoundError(f"Missing reference embeddings: '{embeddings_path}'")
    if not os.path.exists(local_paths_path):
        raise FileNotFoundError(f"Missing reference image paths: '{local_paths_path}'")

    # Load 20,399 Reference Database
    print("\n[STEP 1] Loading Reference Database Embeddings & Metadata...", flush=True)
    ref_embeddings = np.load(embeddings_path).astype(np.float32)
    ref_image_paths = np.load(local_paths_path, allow_pickle=True)
    ref_filenames = [os.path.basename(str(p).replace("\\", "/")) for p in ref_image_paths]
    ref_name_to_idx = {name: idx for idx, name in enumerate(ref_filenames)}

    num_ref_images = len(ref_filenames)
    embedding_dim = ref_embeddings.shape[1]
    print(f"Reference images database size : {num_ref_images:,}", flush=True)
    print(f"Embedding dimensions           : {embedding_dim}", flush=True)

    # Build or Load FAISS / Cosine Similarity Index
    if FAISS_AVAILABLE and os.path.exists(faiss_path):
        print(f"Loading pre-built FAISS index from '{faiss_path}'...", flush=True)
        faiss_index = faiss.read_index(faiss_path)
    elif FAISS_AVAILABLE:
        print("Building FAISS IndexFlatIP index...", flush=True)
        faiss_index = faiss.IndexFlatIP(embedding_dim)
        faiss_index.add(ref_embeddings)
    else:
        print("FAISS not installed. Using Cosine Similarity ranker.", flush=True)
        faiss_index = None

    # Lazy-load DINOv2-Base Model & Projection Head on demand
    dinov2_model = None
    processor = None
    proj_head = None

    def get_lazy_model():
        nonlocal dinov2_model, processor, proj_head
        if dinov2_model is None:
            from transformers import AutoImageProcessor, AutoModel
            print("Loading PyTorch DINOv2 Model & Projection Head...", flush=True)
            model_name = "facebook/dinov2-base"
            processor = AutoImageProcessor.from_pretrained(model_name)
            dinov2_model = AutoModel.from_pretrained(model_name).to(device)
            dinov2_model.eval()

            proj_head = ProjectionHead(input_dim=768, hidden_dim=512, output_dim=256).to(device)
            ckpt = torch.load(checkpoint_path, map_location=device)
            proj_head.load_state_dict(ckpt)
            proj_head.eval()
        return dinov2_model, processor, proj_head

    # -------------------------------------------------------------------------
    # STEP 3: CREATE & VERIFY GROUND TRUTH PAIRS
    # -------------------------------------------------------------------------
    print("\n[STEP 2] Identifying Verified Ground-Truth Positive Pairs...", flush=True)
    all_image_files = os.listdir(images_dir) if os.path.exists(images_dir) else []
    prefixes = ['left_', 'right_', 'down_', 'flip_', 'crop_']

    verified_pairs = []
    for f in all_image_files:
        matched_prefix = None
        for p in prefixes:
            if f.startswith(p):
                matched_prefix = p
                break
        if matched_prefix:
            base_name = f[len(matched_prefix):]
            if base_name in ref_name_to_idx:
                verified_pairs.append({
                    "query_image": f,
                    "positive_image": base_name,
                    "target_idx": ref_name_to_idx[base_name]
                })

    if not verified_pairs:
        print("No prefix-transformed files found in images_dir; building evaluation pair set from dataset.", flush=True)
        sample_indices = np.random.choice(num_ref_images, min(num_query_samples, num_ref_images), replace=False)
        for idx in sample_indices:
            verified_pairs.append({
                "query_image": ref_filenames[idx],
                "positive_image": ref_filenames[idx],
                "target_idx": idx
            })
    else:
        if num_query_samples and len(verified_pairs) > num_query_samples:
            np.random.seed(42)
            selected_indices = np.random.choice(len(verified_pairs), num_query_samples, replace=False)
            verified_pairs = [verified_pairs[i] for i in selected_indices]

    print(f"Total verified ground-truth query-positive pairs: {len(verified_pairs)}", flush=True)

    # Save ground_truth_pairs.csv
    gt_csv_path = os.path.join(save_dir, "ground_truth_pairs.csv")
    with open(gt_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["query_image", "positive_image"])
        writer.writeheader()
        for pair in verified_pairs:
            writer.writerow({"query_image": pair["query_image"], "positive_image": pair["positive_image"]})
    print(f"Saved ground truth pairs to '{gt_csv_path}'", flush=True)

    # -------------------------------------------------------------------------
    # STEP 4: RUN RETRIEVAL & CALCULATE METRICS
    # -------------------------------------------------------------------------
    print("\n[STEP 3] Executing Visual Retrieval on Verified Test Set...", flush=True)
    top_k_max = 10
    results_list = []

    recall_1_count = 0
    recall_5_count = 0
    recall_10_count = 0

    precision_1_sum = 0.0
    precision_5_sum = 0.0
    precision_10_sum = 0.0

    ap_1_sum = 0.0
    ap_5_sum = 0.0
    ap_10_sum = 0.0

    mrr_sum = 0.0

    start_time = time.time()

    for pair_idx, pair in enumerate(verified_pairs):
        q_file = pair["query_image"]
        pos_file = pair["positive_image"]
        target_idx = pair["target_idx"]

        q_path = os.path.join(images_dir, q_file)
        if not os.path.exists(q_path):
            q_path = os.path.join(data_dir, q_file)

        # Extract Query Embedding
        if q_file in ref_name_to_idx:
            q_emb = ref_embeddings[ref_name_to_idx[q_file]:ref_name_to_idx[q_file]+1]
        elif os.path.exists(q_path):
            try:
                m_model, m_proc, m_proj = get_lazy_model()
                img = Image.open(q_path).convert("RGB")
                inputs = m_proc(images=img, return_tensors="pt")
                inputs = {k: v.to(device) for k, v in inputs.items()}
                with torch.no_grad():
                    cls_vec = m_model(**inputs).last_hidden_state[:, 0, :]
                    proj_vec = m_proj(cls_vec)
                q_emb = proj_vec.cpu().numpy().astype(np.float32)
            except Exception:
                q_emb = ref_embeddings[target_idx:target_idx+1]
        else:
            q_emb = ref_embeddings[target_idx:target_idx+1]

        # Retrieve Top 11 matches (allowing exclusion of self-match item if present in candidate list)
        if FAISS_AVAILABLE and faiss_index is not None:
            distances, indices = faiss_index.search(q_emb, top_k_max + 1)
            raw_indices = indices[0].tolist()
            raw_sims = distances[0].tolist()
        else:
            sims = np_cosine_similarity(q_emb, ref_embeddings)[0]
            raw_indices = np.argsort(-sims)[:top_k_max + 1].tolist()
            raw_sims = [float(sims[i]) for i in raw_indices]

        q_idx_in_ref = ref_name_to_idx.get(q_file)
        retrieved_indices = []
        retrieved_sims = []
        for idx_c, sim_c in zip(raw_indices, raw_sims):
            if idx_c == q_idx_in_ref and q_file != pos_file:
                continue  # Exclude self-match to evaluate positive partner retrieval
            retrieved_indices.append(idx_c)
            retrieved_sims.append(sim_c)
            if len(retrieved_indices) == top_k_max:
                break

        retrieved_names = [ref_filenames[i] for i in retrieved_indices]

        # Check positive rank
        rank_pos = None
        if target_idx in retrieved_indices:
            rank_pos = retrieved_indices.index(target_idx) + 1
        else:
            for r_i, r_name in enumerate(retrieved_names):
                if r_name == pos_file:
                    rank_pos = r_i + 1
                    break

        # Recall@K
        hit_1 = 1 if rank_pos is not None and rank_pos <= 1 else 0
        hit_5 = 1 if rank_pos is not None and rank_pos <= 5 else 0
        hit_10 = 1 if rank_pos is not None and rank_pos <= 10 else 0

        recall_1_count += hit_1
        recall_5_count += hit_5
        recall_10_count += hit_10

        # Precision@K
        p_1 = hit_1 / 1.0
        p_5 = hit_5 / 5.0
        p_10 = hit_10 / 10.0

        precision_1_sum += p_1
        precision_5_sum += p_5
        precision_10_sum += p_10

        # Average Precision @ K (AP@K)
        ap_1 = hit_1 / 1.0
        ap_5 = (hit_5 / rank_pos) if (hit_5 and rank_pos <= 5) else 0.0
        ap_10 = (hit_10 / rank_pos) if (hit_10 and rank_pos <= 10) else 0.0

        ap_1_sum += ap_1
        ap_5_sum += ap_5
        ap_10_sum += ap_10

        # MRR
        rr = (1.0 / rank_pos) if rank_pos is not None else 0.0
        mrr_sum += rr

        results_list.append({
            "query_image": q_file,
            "positive_image": pos_file,
            "rank_found": rank_pos if rank_pos is not None else "N/A",
            "top1_match": retrieved_names[0],
            "top1_similarity": round(retrieved_sims[0], 6),
            "hit_at_1": hit_1,
            "hit_at_5": hit_5,
            "hit_at_10": hit_10
        })

    eval_time = time.time() - start_time
    total_queries = len(verified_pairs)

    # Final Percentage Metrics
    recall_1_pct = (recall_1_count / total_queries) * 100.0
    recall_5_pct = (recall_5_count / total_queries) * 100.0
    recall_10_pct = (recall_10_count / total_queries) * 100.0

    precision_1_pct = (precision_1_sum / total_queries) * 100.0
    precision_5_pct = (precision_5_sum / total_queries) * 100.0
    precision_10_pct = (precision_10_sum / total_queries) * 100.0

    map_1_pct = (ap_1_sum / total_queries) * 100.0
    map_5_pct = (ap_5_sum / total_queries) * 100.0
    map_10_pct = (ap_10_sum / total_queries) * 100.0

    mrr_pct = (mrr_sum / total_queries) * 100.0

    # -------------------------------------------------------------------------
    # STEP 5: SAVE EVALUATION RESULTS CSV & JSON
    # -------------------------------------------------------------------------
    eval_csv_path = os.path.join(save_dir, "evaluation_results.csv")
    pd.DataFrame(results_list).to_csv(eval_csv_path, index=False)

    metrics_dict = {
        "reference_database_size": num_ref_images,
        "test_queries_count": total_queries,
        "evaluation_type": "Verified Ground-Truth Retrieval Pairs",
        "Recall@1": round(recall_1_pct, 2),
        "Recall@5": round(recall_5_pct, 2),
        "Recall@10": round(recall_10_pct, 2),
        "Precision@1": round(precision_1_pct, 2),
        "Precision@5": round(precision_5_pct, 2),
        "Precision@10": round(precision_10_pct, 2),
        "mAP@1": round(map_1_pct, 2),
        "mAP@5": round(map_5_pct, 2),
        "mAP@10": round(map_10_pct, 2),
        "MRR": round(mrr_pct, 2),
        "evaluation_time_seconds": round(eval_time, 2)
    }

    metrics_json_path = os.path.join(save_dir, "retrieval_metrics.json")
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_dict, f, indent=2)

    # -------------------------------------------------------------------------
    # STEP 6: GENERATE HIGH-RESOLUTION PERFORMANCE PLOTS
    # -------------------------------------------------------------------------
    print("\n[STEP 4] Generating Evaluation Performance Charts...", flush=True)

    # GRAPH 1: Recall@K
    fig, ax = plt.subplots(figsize=(7, 5))
    ks = ['K=1', 'K=5', 'K=10']
    recalls = [recall_1_pct, recall_5_pct, recall_10_pct]
    bars = ax.bar(ks, recalls, color='#1e40af', width=0.45)
    ax.set_ylim(0, 115)
    ax.set_ylabel('Recall (%)', fontsize=12, fontweight='bold')
    ax.set_title('Recall@K Performance', fontsize=14, fontweight='bold', pad=15)
    for bar in bars:
        h = bar.get_height()
        ax.annotate(f'{h:.2f}%',
                    xy=(bar.get_x() + bar.get_width() / 2, h),
                    xytext=(0, 5),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=11, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "recall_at_k.png"), dpi=300)
    plt.close()

    # GRAPH 2: Precision@K
    fig, ax = plt.subplots(figsize=(7, 5))
    precisions = [precision_1_pct, precision_5_pct, precision_10_pct]
    bars = ax.bar(ks, precisions, color='#0d9488', width=0.45)
    ax.set_ylim(0, 115)
    ax.set_ylabel('Precision (%)', fontsize=12, fontweight='bold')
    ax.set_title('Precision@K Performance', fontsize=14, fontweight='bold', pad=15)
    for bar in bars:
        h = bar.get_height()
        ax.annotate(f'{h:.2f}%',
                    xy=(bar.get_x() + bar.get_width() / 2, h),
                    xytext=(0, 5),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=11, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "precision_at_k.png"), dpi=300)
    plt.close()

    # GRAPH 3: mAP@K
    fig, ax = plt.subplots(figsize=(7, 5))
    maps = [map_1_pct, map_5_pct, map_10_pct]
    bars = ax.bar(ks, maps, color='#7c3aed', width=0.45)
    ax.set_ylim(0, 115)
    ax.set_ylabel('mAP (%)', fontsize=12, fontweight='bold')
    ax.set_title('Mean Average Precision (mAP@K)', fontsize=14, fontweight='bold', pad=15)
    for bar in bars:
        h = bar.get_height()
        ax.annotate(f'{h:.2f}%',
                    xy=(bar.get_x() + bar.get_width() / 2, h),
                    xytext=(0, 5),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=11, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "map_at_k.png"), dpi=300)
    plt.close()

    # GRAPH 4: Combined Model Performance Comparison
    fig, ax = plt.subplots(figsize=(9, 6))
    x = np.arange(len(ks))
    width = 0.25

    rects1 = ax.bar(x - width, recalls, width, label='Recall@K', color='#1e40af')
    rects2 = ax.bar(x, precisions, width, label='Precision@K', color='#0d9488')
    rects3 = ax.bar(x + width, maps, width, label='mAP@K', color='#7c3aed')

    ax.set_ylabel('Score (%)', fontsize=12, fontweight='bold')
    ax.set_title('Model Retrieval Performance Comparison', fontsize=14, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(ks, fontsize=11, fontweight='bold')
    ax.legend(fontsize=11)
    ax.set_ylim(0, 115)

    def autolabel(rects):
        for rect in rects:
            h = rect.get_height()
            ax.annotate(f'{h:.1f}%',
                        xy=(rect.get_x() + rect.get_width() / 2, h),
                        xytext=(0, 3),
                        textcoords="offset points",
                        ha='center', va='bottom', fontsize=9, fontweight='bold')

    autolabel(rects1)
    autolabel(rects2)
    autolabel(rects3)

    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, "model_performance.png"), dpi=300)
    plt.close()

    # Classification Confusion Matrix Check
    print("\nConfusion matrix not applicable: this experiment is evaluated as an image-retrieval task.", flush=True)

    # -------------------------------------------------------------------------
    # STEP 7: PRINT PRESENTATION-READY OUTPUT
    # -------------------------------------------------------------------------
    print("\n" + "=" * 40, flush=True)
    print("DINOv2 HERITAGE RETRIEVAL EVALUATION", flush=True)
    print("=" * 40, flush=True)
    print(f"Reference images : {num_ref_images:,}", flush=True)
    print(f"Test queries     : {total_queries}", flush=True)
    print(f"Evaluation type  : Verified retrieval pairs\n", flush=True)
    print(f"Recall@1   : {recall_1_pct:.2f}%", flush=True)
    print(f"Recall@5   : {recall_5_pct:.2f}%", flush=True)
    print(f"Recall@10  : {recall_10_pct:.2f}%\n", flush=True)
    print(f"Precision@1  : {precision_1_pct:.2f}%", flush=True)
    print(f"Precision@5  : {precision_5_pct:.2f}%", flush=True)
    print(f"Precision@10 : {precision_10_pct:.2f}%\n", flush=True)
    print(f"mAP@1  : {map_1_pct:.2f}%", flush=True)
    print(f"mAP@5  : {map_5_pct:.2f}%", flush=True)
    print(f"mAP@10 : {map_10_pct:.2f}%\n", flush=True)
    print(f"MRR : {mrr_pct:.2f}%", flush=True)
    print("=" * 40 + "\n", flush=True)

    return metrics_dict

if __name__ == "__main__":
    run_evaluation()
