import os
import sys
import json
import csv
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
import faiss
from PIL import Image
from transformers import AutoImageProcessor, AutoModel

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

def normalize_class_name(cname):
    c = cname.lower().strip()
    if 'nataraja' in c or 'nadaraja' in c: return 'Nataraja'
    elif 'shiva' in c or 'shivan' in c: return 'Shiva'
    elif 'vishnu' in c or 'perumal' in c: return 'Vishnu'
    elif 'lakshmi' in c: return 'Lakshmi'
    elif 'ganesha' in c or 'ganesh' in c: return 'Ganesha'
    elif 'murugan' in c or 'murugar' in c: return 'Murugan'
    elif 'buddha' in c: return 'Buddha'
    elif 'hanuman' in c: return 'Hanuman'
    return cname

def is_relevant(ref_row, q_class):
    q_norm = q_class.lower()
    deity = str(ref_row.get('deity_or_subject', '')).lower()
    if deity and deity != 'nan':
        if q_norm in deity or (q_norm == 'nataraja' and 'nadaraja' in deity) or (q_norm == 'shiva' and 'shivan' in deity) or (q_norm == 'murugan' and 'murugar' in deity):
            return True
        elif any(k in deity for k in ['nataraja', 'shiva', 'vishnu', 'lakshmi', 'ganesha', 'murugan', 'buddha', 'hanuman']):
            return False

    art = str(ref_row.get('artifact_name', '')).lower()
    if art and art != 'nan':
        if q_norm in art or (q_norm == 'nataraja' and 'nadaraja' in art) or (q_norm == 'shiva' and 'shivan' in art) or (q_norm == 'murugan' and 'murugar' in art):
            return True

    img_n = str(ref_row.get('image_name', '')).lower()
    if img_n and img_n != 'nan':
        if q_norm in img_n or (q_norm == 'nataraja' and 'nadaraja' in img_n) or (q_norm == 'shiva' and 'shivan' in img_n) or (q_norm == 'murugan' and 'murugar' in img_n):
            return True

    return False

def calculate_ap(rel_mask, k=10):
    hits = 0
    sum_prec = 0.0
    for i in range(min(k, len(rel_mask))):
        if rel_mask[i]:
            hits += 1
            sum_prec += hits / (i + 1)
    if hits == 0: return 0.0
    return sum_prec / min(hits, k)

def run_phase_4_5_6():
    print("=" * 80, flush=True)
    print("DIGITAL HERITAGE AI — PHASES 4, 5, 6 (BASELINES & FAISS SIMILARITY AUDIT)", flush=True)
    print("=" * 80, flush=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    base_dir = "ai_microservice"
    data_dir = os.path.join(base_dir, "data")

    # Load resources
    ckpt_path = os.path.join(data_dir, "best_projection_head.pt")
    baseline_faiss_path = os.path.join(data_dir, "dinov2_faiss.index")
    baseline_emb_path = os.path.join(data_dir, "dinov2_embeddings.npy")
    local_paths_path = os.path.join(data_dir, "image_paths_local.npy")
    heritage_meta_path = os.path.join(data_dir, "heritage_metadata.csv")
    indep_test_dir = os.path.join(base_dir, "independent_test")

    proj_head = ProjectionHead().to(device)
    proj_head.load_state_dict(torch.load(ckpt_path, map_location=device))
    proj_head.eval()

    model_name = "facebook/dinov2-base"
    print(f"Loading backbone {model_name}...", flush=True)
    processor = AutoImageProcessor.from_pretrained(model_name)
    dinov2_model = AutoModel.from_pretrained(model_name).to(device)
    dinov2_model.eval()

    ref_paths = np.load(local_paths_path, allow_pickle=True)
    heritage_df = pd.read_csv(heritage_meta_path)
    emb768 = np.load(baseline_emb_path)

    # 256-D Embeddings
    print("Projecting 768-D to 256-D embeddings...", flush=True)
    with torch.no_grad():
        t_in = torch.from_numpy(emb768).to(device)
        t_out = proj_head(t_in)
        emb256 = t_out.cpu().numpy().astype(np.float32)

    # Build FAISS Indexes
    print("Building FAISS indexes...", flush=True)
    index768_cos = faiss.read_index(baseline_faiss_path)
    index256_cos = faiss.IndexFlatIP(256)
    index256_cos.add(emb256)

    # Queries
    subdirs = sorted([d for d in os.listdir(indep_test_dir) if os.path.isdir(os.path.join(indep_test_dir, d))])
    test_queries = []
    for sd in subdirs:
        sd_path = os.path.join(indep_test_dir, sd)
        imgs = sorted([f for f in os.listdir(sd_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])
        for img in imgs:
            test_queries.append({
                'folder_class': sd,
                'norm_class': normalize_class_name(sd),
                'full_path': os.path.join(sd_path, img),
                'rel_path': f"{sd}/{img}"
            })

    b768_res = []
    b256_res = []
    
    b768_q_metrics = []
    b256_q_metrics = []

    TOP_K = 10
    print(f"Evaluating {len(test_queries)} independent test queries...", flush=True)

    for idx, q in enumerate(test_queries, 1):
        if idx % 10 == 0 or idx == len(test_queries):
            print(f"  Progress: Query {idx}/{len(test_queries)} ({q['rel_path']})", flush=True)

        image = Image.open(q['full_path']).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = dinov2_model(**inputs)
            cls_768 = outputs.last_hidden_state[:, 0, :]
            cls_768_norm = F.normalize(cls_768, p=2, dim=1)
            proj_256 = proj_head(cls_768)

        emb768_q = cls_768_norm.cpu().numpy().astype(np.float32)
        emb256_q = proj_256.cpu().numpy().astype(np.float32)

        # Baseline A: 768-D FAISS Search
        d768, i768 = index768_cos.search(emb768_q, TOP_K)
        rel768 = []
        for r in range(TOP_K):
            ref_i = int(i768[0][r])
            sim = float(d768[0][r])
            ref_row = heritage_df.iloc[ref_i].to_dict()
            is_r = is_relevant(ref_row, q['norm_class'])
            rel768.append(is_r)
            b768_res.append({
                'query_image': q['rel_path'],
                'ground_truth_class': q['folder_class'],
                'rank': r + 1,
                'retrieved_image': ref_row['image_name'],
                'similarity': round(sim, 6),
                'is_relevant': is_r
            })

        # Baseline B: 256-D Projection Search
        d256, i256 = index256_cos.search(emb256_q, TOP_K)
        rel256 = []
        for r in range(TOP_K):
            ref_i = int(i256[0][r])
            sim = float(d256[0][r])
            ref_row = heritage_df.iloc[ref_i].to_dict()
            is_r = is_relevant(ref_row, q['norm_class'])
            rel256.append(is_r)
            b256_res.append({
                'query_image': q['rel_path'],
                'ground_truth_class': q['folder_class'],
                'rank': r + 1,
                'retrieved_image': ref_row['image_name'],
                'similarity': round(sim, 6),
                'is_relevant': is_r
            })

        def compute_m(rel_m):
            return {
                'recall_1': 1.0 if any(rel_m[:1]) else 0.0,
                'recall_5': 1.0 if any(rel_m[:5]) else 0.0,
                'recall_10': 1.0 if any(rel_m[:10]) else 0.0,
                'prec_1': sum(rel_m[:1]) / 1.0,
                'prec_5': sum(rel_m[:5]) / 5.0,
                'prec_10': sum(rel_m[:10]) / 10.0,
                'ap_10': calculate_ap(rel_m, k=10)
            }

        b768_q_metrics.append(compute_m(rel768))
        b256_q_metrics.append(compute_m(rel256))

    def aggregate(m_list):
        return {
            'Recall@1': round(float(np.mean([m['recall_1'] for m in m_list])) * 100.0, 2),
            'Recall@5': round(float(np.mean([m['recall_5'] for m in m_list])) * 100.0, 2),
            'Recall@10': round(float(np.mean([m['recall_10'] for m in m_list])) * 100.0, 2),
            'Precision@1': round(float(np.mean([m['prec_1'] for m in m_list])) * 100.0, 2),
            'Precision@5': round(float(np.mean([m['prec_5'] for m in m_list])) * 100.0, 2),
            'Precision@10': round(float(np.mean([m['prec_10'] for m in m_list])) * 100.0, 2),
            'mAP@10': round(float(np.mean([m['ap_10'] for m in m_list])) * 100.0, 2)
        }

    m768 = aggregate(b768_q_metrics)
    m256 = aggregate(b256_q_metrics)

    # ---------------------------------------------------------
    # PHASE 4 OUTPUTS: outputs/baseline_dinov2/
    # ---------------------------------------------------------
    out_b768 = "outputs/baseline_dinov2"
    os.makedirs(out_b768, exist_ok=True)
    with open(os.path.join(out_b768, "metrics.json"), "w") as f:
        json.dump(m768, f, indent=4)
    pd.DataFrame([m768]).to_csv(os.path.join(out_b768, "metrics.csv"), index=False)
    pd.DataFrame(b768_res).to_csv(os.path.join(out_b768, "retrieval_results.csv"), index=False)

    # ---------------------------------------------------------
    # PHASE 5 OUTPUTS: outputs/baseline_projection/
    # ---------------------------------------------------------
    out_b256 = "outputs/baseline_projection"
    os.makedirs(out_b256, exist_ok=True)
    with open(os.path.join(out_b256, "metrics.json"), "w") as f:
        json.dump(m256, f, indent=4)
    pd.DataFrame([m256]).to_csv(os.path.join(out_b256, "metrics.csv"), index=False)
    pd.DataFrame(b256_res).to_csv(os.path.join(out_b256, "retrieval_results.csv"), index=False)

    # ---------------------------------------------------------
    # PHASE 6 OUTPUTS: outputs/similarity_comparison/
    # ---------------------------------------------------------
    out_sim = "outputs/similarity_comparison"
    os.makedirs(out_sim, exist_ok=True)
    sim_report = {
        "similarity_metric": "Cosine Similarity via L2-Normalized Vectors + FAISS IndexFlatIP",
        "reference_embeddings_normalized": True,
        "query_embeddings_normalized": True,
        "l2_norm_check": {
            "dinov2_768d_norm": float(np.linalg.norm(emb768[0])),
            "projection_256d_norm": float(np.linalg.norm(emb256[0]))
        },
        "recommendation": "Preserve explicit L2 normalization before FAISS IndexFlatIP search to ensure accurate Cosine Similarity measurement."
    }
    with open(os.path.join(out_sim, "similarity_audit.json"), "w") as f:
        json.dump(sim_report, f, indent=4)

    print("\nPhase 4, 5, 6 Execution Completed!", flush=True)
    print(f"  - Baseline A (768-D) Saved to: {out_b768}/", flush=True)
    print(f"  - Baseline B (256-D) Saved to: {out_b256}/", flush=True)
    print(f"  - Similarity Audit Saved to : {out_sim}/", flush=True)

if __name__ == "__main__":
    run_phase_4_5_6()
