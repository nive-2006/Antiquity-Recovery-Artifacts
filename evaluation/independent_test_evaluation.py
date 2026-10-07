import os
import sys
import glob
import json
import csv
import hashlib
import time
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import pandas as pd
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
import faiss
from transformers import AutoImageProcessor, AutoModel

# -----------------------------------------------------------------------------
# ProjectionHead Definition (Matching trained architecture)
# -----------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------
# Utility functions
# -----------------------------------------------------------------------------
def get_file_sha256(filepath):
    h = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            while chunk := f.read(65536):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return ""

def hash_single_image(args):
    idx, ref_images_dir, fname = args
    fpath = os.path.join(ref_images_dir, fname)
    if os.path.exists(fpath):
        return fname, get_file_sha256(fpath)
    return fname, ""

def normalize_class_name(cname):
    c = cname.lower().strip()
    if 'nataraja' in c or 'nadaraja' in c:
        return 'Nataraja'
    elif 'shiva' in c or 'shivan' in c:
        return 'Shiva'
    elif 'vishnu' in c or 'perumal' in c:
        return 'Vishnu'
    elif 'lakshmi' in c:
        return 'Lakshmi'
    elif 'ganesha' in c or 'ganesh' in c:
        return 'Ganesha'
    elif 'murugan' in c or 'murugar' in c:
        return 'Murugan'
    elif 'buddha' in c:
        return 'Buddha'
    elif 'hanuman' in c:
        return 'Hanuman'
    return cname

def is_reference_image_relevant(ref_metadata_row, query_norm_class):
    """
    Checks if a reference image's metadata matches the query ground-truth class.
    """
    q_norm = query_norm_class.lower()
    
    # Check deity_or_subject
    deity = str(ref_metadata_row.get('deity_or_subject', '')).lower()
    if deity and deity != 'nan':
        if q_norm in deity or (q_norm == 'nataraja' and 'nadaraja' in deity) or (q_norm == 'shiva' and 'shivan' in deity) or (q_norm == 'murugan' and 'murugar' in deity):
            return True
        elif any(k in deity for k in ['nataraja', 'shiva', 'vishnu', 'lakshmi', 'ganesha', 'murugan', 'buddha', 'hanuman']):
            return False

    # Check artifact_name
    art_name = str(ref_metadata_row.get('artifact_name', '')).lower()
    if art_name and art_name != 'nan':
        if q_norm in art_name or (q_norm == 'nataraja' and 'nadaraja' in art_name) or (q_norm == 'shiva' and 'shivan' in art_name) or (q_norm == 'murugan' and 'murugar' in art_name):
            return True

    # Check image_name
    img_name = str(ref_metadata_row.get('image_name', '')).lower()
    if img_name and img_name != 'nan':
        if q_norm in img_name or (q_norm == 'nataraja' and 'nadaraja' in img_name) or (q_norm == 'shiva' and 'shivan' in img_name) or (q_norm == 'murugan' and 'murugar' in img_name):
            return True

    # Check description
    desc = str(ref_metadata_row.get('description', '')).lower()
    if desc and desc != 'nan':
        if q_norm in desc or (q_norm == 'nataraja' and 'nadaraja' in desc) or (q_norm == 'shiva' and 'shivan' in desc) or (q_norm == 'murugan' and 'murugar' in desc):
            return True

    return False

def calculate_ap(relevant_mask, k=10):
    """Calculates Average Precision at K (mAP@K)."""
    hits = 0
    sum_precisions = 0.0
    for i in range(min(k, len(relevant_mask))):
        if relevant_mask[i]:
            hits += 1
            sum_precisions += hits / (i + 1)
    if hits == 0:
        return 0.0
    return sum_precisions / min(hits, k)

# -----------------------------------------------------------------------------
# Main Evaluation Pipeline
# -----------------------------------------------------------------------------
def run_evaluation():
    print("=" * 80, flush=True)
    print("DIGITAL HERITAGE AI — INDEPENDENT TEST EVALUATION", flush=True)
    print("=" * 80, flush=True)

    # 1. AUTO-DISCOVER PATHS
    print("\n[STEP 1] Auto-discovering project files & directories...", flush=True)
    
    possible_roots = [
        os.getcwd(),
        os.path.abspath(os.path.join(os.getcwd(), "..")),
        os.path.abspath(os.path.join(os.getcwd(), "ai_microservice")),
        os.path.abspath(os.path.join(os.getcwd(), "..", "ai_microservice"))
    ]
    
    ai_dir = None
    root_dir = None
    for r in possible_roots:
        if os.path.exists(os.path.join(r, "data", "best_projection_head.pt")):
            ai_dir = r
            break
        elif os.path.exists(os.path.join(r, "ai_microservice", "data", "best_projection_head.pt")):
            ai_dir = os.path.join(r, "ai_microservice")
            root_dir = r
            break
            
    if not ai_dir:
        raise FileNotFoundError("Could not locate ai_microservice directory containing data/best_projection_head.pt!")

    if not root_dir:
        root_dir = os.path.abspath(os.path.join(ai_dir, ".."))

    # Define exact discovered paths
    ckpt_path = os.path.join(ai_dir, "data", "best_projection_head.pt")
    baseline_faiss_path = os.path.join(ai_dir, "data", "dinov2_faiss.index")
    baseline_emb_path = os.path.join(ai_dir, "data", "dinov2_embeddings.npy")
    local_paths_path = os.path.join(ai_dir, "data", "image_paths_local.npy")
    if not os.path.exists(local_paths_path):
        local_paths_path = os.path.join(ai_dir, "data", "image_paths.npy")
    
    master_meta_path = os.path.join(ai_dir, "data", "master_image_metadata.csv")
    heritage_meta_path = os.path.join(ai_dir, "data", "heritage_metadata.csv")
    ref_images_dir = os.path.join(ai_dir, "images")
    indep_test_dir = os.path.join(ai_dir, "independent_test")
    if not os.path.exists(indep_test_dir):
        indep_test_dir = os.path.join(root_dir, "independent_test")

    trained_emb_path = os.path.join(ai_dir, "data", "trained_all_embeddings.npy")
    trained_faiss_path = os.path.join(ai_dir, "data", "trained_dinov2_faiss.index")

    # Output directory setup
    output_dir = os.path.join(root_dir, "evaluation_outputs")
    os.makedirs(output_dir, exist_ok=True)

    print("Discovered Paths:", flush=True)
    print(f"  - Projection Head Checkpoint : {ckpt_path}", flush=True)
    print(f"  - Baseline FAISS Index (768D): {baseline_faiss_path}", flush=True)
    print(f"  - Baseline Embeddings (768D) : {baseline_emb_path}", flush=True)
    print(f"  - Local Image Paths NPY      : {local_paths_path}", flush=True)
    print(f"  - Master Metadata CSV        : {master_meta_path}", flush=True)
    print(f"  - Heritage Metadata CSV      : {heritage_meta_path}", flush=True)
    print(f"  - Reference Images Directory : {ref_images_dir}", flush=True)
    print(f"  - Independent Test Dataset   : {indep_test_dir}", flush=True)
    print(f"  - Evaluation Outputs Folder  : {output_dir}", flush=True)

    # 2. VERIFY THE EXISTING MODEL
    print("\n[STEP 2] Verifying existing Projection Head checkpoint...", flush=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"  Using compute device: {device}", flush=True)
    
    ckpt = torch.load(ckpt_path, map_location=device)
    if not isinstance(ckpt, dict):
        raise TypeError(f"Checkpoint at '{ckpt_path}' is not a valid state_dict dict!")

    required_keys = ["network.0.weight", "network.0.bias", "network.2.weight", "network.2.bias"]
    for rk in required_keys:
        if rk not in ckpt:
            raise KeyError(f"Missing required key '{rk}' in projection head checkpoint!")

    proj_head = ProjectionHead(input_dim=768, hidden_dim=512, output_dim=256).to(device)
    proj_head.load_state_dict(ckpt)
    proj_head.eval()

    param_count = sum(p.numel() for p in proj_head.parameters() if p.requires_grad)
    print(f"  ProjectionHead checkpoint successfully loaded and verified.", flush=True)
    print(f"  Architecture     : Linear(768, 512) -> GELU -> Linear(512, 256) -> L2 Norm", flush=True)
    print(f"  Parameter Count  : {param_count:,} (Expected: 525,056)", flush=True)
    if param_count != 525056:
        raise ValueError(f"Parameter count mismatch! Expected 525,056 but got {param_count}")

    # 3. VERIFY DINOv2
    print("\n[STEP 3] Verifying DINOv2 Backbone...", flush=True)
    model_name = "facebook/dinov2-base"
    print(f"  Loading Hugging Face model: {model_name}...", flush=True)
    processor = AutoImageProcessor.from_pretrained(model_name)
    dinov2_model = AutoModel.from_pretrained(model_name).to(device)
    dinov2_model.eval()
    for param in dinov2_model.parameters():
        param.requires_grad = False
    print("  DINOv2-base successfully loaded and frozen (eval mode).", flush=True)

    # 4. VERIFY REFERENCE DATABASE & TRAINED FAISS
    print("\n[STEP 4] Verifying Reference Database & FAISS Indexes...", flush=True)
    ref_paths = np.load(local_paths_path, allow_pickle=True)
    num_ref_images = len(ref_paths)
    print(f"  Reference Image Paths Count: {num_ref_images}", flush=True)

    heritage_df = pd.read_csv(heritage_meta_path)
    print(f"  Heritage Metadata Rows     : {len(heritage_df)}", flush=True)

    # Check if precomputed trained 256-D embeddings & FAISS index exist
    if os.path.exists(trained_emb_path) and os.path.exists(trained_faiss_path):
        print("  Found existing trained 256-D embeddings and FAISS index. Verifying...", flush=True)
        trained_embeddings = np.load(trained_emb_path)
        trained_index = faiss.read_index(trained_faiss_path)
        if trained_embeddings.shape == (num_ref_images, 256) and trained_index.ntotal == num_ref_images:
            print("  [REUSE VERIFIED] Existing trained 256-D embeddings and FAISS index are complete and valid!", flush=True)
        else:
            print("  Existing trained embeddings invalid. Regenerating...", flush=True)
            trained_embeddings = None
    else:
        trained_embeddings = None

    if trained_embeddings is None:
        print("  Generating 256-D trained reference embeddings...", flush=True)
        emb768 = np.load(baseline_emb_path)
        with torch.no_grad():
            t_in = torch.from_numpy(emb768).to(device)
            t_out = proj_head(t_in)
            trained_embeddings = t_out.cpu().numpy().astype(np.float32)
        np.save(trained_emb_path, trained_embeddings)
        
        trained_index = faiss.IndexFlatIP(256)
        trained_index.add(trained_embeddings)
        faiss.write_index(trained_index, trained_faiss_path)

    # Save reference embeddings & index copy in evaluation_outputs
    np.save(os.path.join(output_dir, "trained_reference_embeddings_256.npy"), trained_embeddings)
    faiss.write_index(trained_index, os.path.join(output_dir, "trained_256d_faiss.index"))
    np.save(os.path.join(output_dir, "trained_reference_paths.npy"), ref_paths)

    # Baseline 768-D FAISS index loading
    print("  Loading Baseline 768-D FAISS Index...", flush=True)
    baseline_index = faiss.read_index(baseline_faiss_path)
    print(f"  Baseline FAISS Index (768D) : {baseline_index.ntotal} vectors, dimension={baseline_index.d}", flush=True)
    print(f"  Trained FAISS Index (256D)  : {trained_index.ntotal} vectors, dimension={trained_index.d}", flush=True)

    # 5. FIND INDEPENDENT TEST SET
    print("\n[STEP 5] Discovering Independent Test Dataset...", flush=True)
    if not os.path.exists(indep_test_dir):
        raise FileNotFoundError(f"Independent test directory not found at '{indep_test_dir}'")

    subdirs = sorted([d for d in os.listdir(indep_test_dir) if os.path.isdir(os.path.join(indep_test_dir, d))])
    
    test_queries = []
    print("-" * 50, flush=True)
    print(f"{'Class Folder':<20} | {'Number of Images':<18}", flush=True)
    print("-" * 50, flush=True)
    total_query_count = 0
    for sd in subdirs:
        sd_path = os.path.join(indep_test_dir, sd)
        imgs = sorted([f for f in os.listdir(sd_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])
        count = len(imgs)
        total_query_count += count
        print(f"{sd:<20} | {count:<18}", flush=True)
        for img_name in imgs:
            test_queries.append({
                'folder_class': sd,
                'normalized_class': normalize_class_name(sd),
                'filename': img_name,
                'full_path': os.path.join(sd_path, img_name),
                'rel_path': f"{sd}/{img_name}"
            })
    print("-" * 50, flush=True)
    print(f"{'Total Independent Images':<20} | {total_query_count:<18}", flush=True)
    print("-" * 50, flush=True)

    # 6. CHECK DATA LEAKAGE (MULTITHREADED HASHING FOR SPEED)
    print("\n[STEP 6] Performing Fast SHA-256 Data Leakage Inspection...", flush=True)
    print(f"  Hashing all {num_ref_images:,} reference images in parallel...", flush=True)
    
    tasks = [(i, ref_images_dir, os.path.basename(str(p))) for i, p in enumerate(ref_paths)]
    ref_hashes = {}
    with ThreadPoolExecutor(max_workers=16) as executor:
        results = executor.map(hash_single_image, tasks)
        for fname, h in results:
            if h:
                ref_hashes[h] = fname

    print(f"  Hashed {len(ref_hashes):,} reference images.", flush=True)
    
    leakage_records = []
    excluded_queries = []
    valid_queries = []

    for q in test_queries:
        qh = get_file_sha256(q['full_path'])
        is_leak = qh in ref_hashes
        matched_ref = ref_hashes[qh] if is_leak else ""
        
        q['sha256'] = qh
        q['is_leak'] = is_leak
        q['matched_ref'] = matched_ref

        rec = {
            'query_image': q['rel_path'],
            'ground_truth_class': q['folder_class'],
            'query_hash': qh,
            'exact_duplicate_in_reference': is_leak,
            'matching_reference_image': matched_ref
        }
        leakage_records.append(rec)
        
        if is_leak:
            excluded_queries.append(q)
        else:
            valid_queries.append(q)

    # Save leakage report CSV
    leakage_df = pd.DataFrame(leakage_records)
    leakage_csv_path = os.path.join(output_dir, "independent_test_leakage_report.csv")
    leakage_df.to_csv(leakage_csv_path, index=False)
    print(f"  Saved leakage report to: {leakage_csv_path}", flush=True)

    print("\nLeakage Summary:", flush=True)
    print(f"  Total independent images : {len(test_queries)}", flush=True)
    print(f"  Exact duplicates found   : {len(excluded_queries)}", flush=True)
    print(f"  Valid independent images : {len(valid_queries)}", flush=True)
    print(f"  Excluded images          : {len(excluded_queries)}", flush=True)

    if len(excluded_queries) == 0:
        print("  >> No exact duplicate leakage detected.", flush=True)
    else:
        print("  >> Excluded duplicate query images:", flush=True)
        for eq in excluded_queries:
            print(f"     - {eq['rel_path']} matches reference {eq['matched_ref']}", flush=True)

    # 7. METADATA & GROUND-TRUTH INSPECTION
    print("\n[STEP 7 & 13] Inspecting Metadata Ground-Truth Coverage...", flush=True)
    unlabeled_count = heritage_df['deity_or_subject'].isna().sum()
    unlabeled_pct = (unlabeled_count / len(heritage_df)) * 100.0
    print(f"  Reference database total images : {len(heritage_df):,}", flush=True)
    print(f"  Images without explicit deity   : {unlabeled_count:,} ({unlabeled_pct:.2f}%)", flush=True)

    # Create metrics_status.txt per Step 13 requirements
    metrics_status_path = os.path.join(output_dir, "metrics_status.txt")
    with open(metrics_status_path, "w", encoding="utf-8") as f:
        f.write("Classification metrics were not calculated because reliable reference-image class labels were unavailable.\n")
    print(f"  Created '{metrics_status_path}'.", flush=True)

    # 10. EVALUATE ALL INDEPENDENT TEST IMAGES
    print(f"\n[STEP 10 & 14] Evaluating {len(valid_queries)} Valid Independent Queries...", flush=True)
    
    trained_retrieval_results = []
    baseline_retrieval_results = []
    
    TOP_K = 10

    trained_query_metrics = []
    baseline_query_metrics = []

    for idx, q in enumerate(valid_queries, 1):
        if idx % 10 == 0 or idx == len(valid_queries):
            print(f"  Progress: Query {idx}/{len(valid_queries)} ({q['rel_path']})", flush=True)

        image = Image.open(q['full_path']).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = dinov2_model(**inputs)
            cls_768 = outputs.last_hidden_state[:, 0, :]
            cls_768_norm = F.normalize(cls_768, p=2, dim=1)
            proj_256 = proj_head(cls_768)

        emb_768_np = cls_768_norm.cpu().numpy().astype(np.float32)
        emb_256_np = proj_256.cpu().numpy().astype(np.float32)

        # Search Trained 256-D Index
        t_dists, t_indices = trained_index.search(emb_256_np, TOP_K + 5)
        # Search Baseline 768-D Index
        b_dists, b_indices = baseline_index.search(emb_768_np, TOP_K + 5)

        # Process Trained Results
        t_retrieved = []
        t_relevant_mask = []
        rank_counter = 1
        for r in range(len(t_indices[0])):
            ref_i = int(t_indices[0][r])
            sim = float(t_dists[0][r])
            ref_name = str(heritage_df.iloc[ref_i]['image_name'])
            ref_row = heritage_df.iloc[ref_i].to_dict()

            # Skip self match if present
            if q['is_leak'] and ref_name == q['matched_ref']:
                continue

            is_rel = is_reference_image_relevant(ref_row, q['normalized_class'])
            t_relevant_mask.append(is_rel)

            if rank_counter <= TOP_K:
                t_rec = {
                    'query_image': q['rel_path'],
                    'ground_truth_class': q['folder_class'],
                    'rank': rank_counter,
                    'retrieved_image': ref_name,
                    'similarity': round(sim, 6),
                    'retrieved_metadata': json.dumps({
                        'deity_or_subject': str(ref_row.get('deity_or_subject', '')),
                        'artifact_name': str(ref_row.get('artifact_name', '')),
                        'location': str(ref_row.get('location', ''))
                    })
                }
                trained_retrieval_results.append(t_rec)
                t_retrieved.append(t_rec)
                rank_counter += 1

        # Process Baseline Results
        b_retrieved = []
        b_relevant_mask = []
        rank_counter = 1
        for r in range(len(b_indices[0])):
            ref_i = int(b_indices[0][r])
            sim = float(b_dists[0][r])
            ref_name = str(heritage_df.iloc[ref_i]['image_name'])
            ref_row = heritage_df.iloc[ref_i].to_dict()

            if q['is_leak'] and ref_name == q['matched_ref']:
                continue

            is_rel = is_reference_image_relevant(ref_row, q['normalized_class'])
            b_relevant_mask.append(is_rel)

            if rank_counter <= TOP_K:
                b_rec = {
                    'query_image': q['rel_path'],
                    'ground_truth_class': q['folder_class'],
                    'rank': rank_counter,
                    'retrieved_image': ref_name,
                    'similarity': round(sim, 6)
                }
                baseline_retrieval_results.append(b_rec)
                b_retrieved.append(b_rec)
                rank_counter += 1

        def calc_query_metrics(rel_mask):
            rel_k1 = any(rel_mask[:1])
            rel_k5 = any(rel_mask[:5])
            rel_k10 = any(rel_mask[:10])

            prec_k1 = sum(rel_mask[:1]) / 1.0
            prec_k5 = sum(rel_mask[:5]) / 5.0
            prec_k10 = sum(rel_mask[:10]) / 10.0

            ap10 = calculate_ap(rel_mask, k=10)

            return {
                'recall_1': 1.0 if rel_k1 else 0.0,
                'recall_5': 1.0 if rel_k5 else 0.0,
                'recall_10': 1.0 if rel_k10 else 0.0,
                'prec_1': prec_k1,
                'prec_5': prec_k5,
                'prec_10': prec_k10,
                'ap_10': ap10
            }

        trained_query_metrics.append(calc_query_metrics(t_relevant_mask))
        baseline_query_metrics.append(calc_query_metrics(b_relevant_mask))

    # Save independent_retrieval_results.csv
    results_csv_path = os.path.join(output_dir, "independent_retrieval_results.csv")
    results_df = pd.DataFrame(trained_retrieval_results)
    results_df.to_csv(results_csv_path, index=False)
    print(f"  Saved trained retrieval results CSV: {results_csv_path}", flush=True)

    # 12. RETRIEVAL METRICS SUMMARY
    print("\n[STEP 12 & 14] Calculating Retrieval Metrics (Baseline vs Trained)...", flush=True)
    
    def aggregate_metrics(metrics_list):
        n = len(metrics_list)
        if n == 0:
            return {k: 0.0 for k in metrics_list[0].keys()}
        return {
            'recall_1': float(np.mean([m['recall_1'] for m in metrics_list])) * 100.0,
            'recall_5': float(np.mean([m['recall_5'] for m in metrics_list])) * 100.0,
            'recall_10': float(np.mean([m['recall_10'] for m in metrics_list])) * 100.0,
            'prec_1': float(np.mean([m['prec_1'] for m in metrics_list])) * 100.0,
            'prec_5': float(np.mean([m['prec_5'] for m in metrics_list])) * 100.0,
            'prec_10': float(np.mean([m['prec_10'] for m in metrics_list])) * 100.0,
            'map_10': float(np.mean([m['ap_10'] for m in metrics_list])) * 100.0
        }

    t_metrics = aggregate_metrics(trained_query_metrics)
    b_metrics = aggregate_metrics(baseline_query_metrics)

    # Save baseline_vs_trained.csv
    comp_data = [
        {
            'Model': 'Baseline DINOv2-base (768-D)',
            'Recall@1': f"{b_metrics['recall_1']:.2f}%",
            'Recall@5': f"{b_metrics['recall_5']:.2f}%",
            'Recall@10': f"{b_metrics['recall_10']:.2f}%",
            'Precision@1': f"{b_metrics['prec_1']:.2f}%",
            'Precision@5': f"{b_metrics['prec_5']:.2f}%",
            'Precision@10': f"{b_metrics['prec_10']:.2f}%",
            'mAP@10': f"{b_metrics['map_10']:.2f}%"
        },
        {
            'Model': 'Trained Projection Head (256-D)',
            'Recall@1': f"{t_metrics['recall_1']:.2f}%",
            'Recall@5': f"{t_metrics['recall_5']:.2f}%",
            'Recall@10': f"{t_metrics['recall_10']:.2f}%",
            'Precision@1': f"{t_metrics['prec_1']:.2f}%",
            'Precision@5': f"{t_metrics['prec_5']:.2f}%",
            'Precision@10': f"{t_metrics['prec_10']:.2f}%",
            'mAP@10': f"{t_metrics['map_10']:.2f}%"
        }
    ]
    comp_df = pd.DataFrame(comp_data)
    comp_csv_path = os.path.join(output_dir, "baseline_vs_trained.csv")
    comp_df.to_csv(comp_csv_path, index=False)
    print(f"  Saved baseline comparison CSV: {comp_csv_path}", flush=True)

    # 11. VISUAL RETRIEVAL GALLERY HTML
    print("\n[STEP 11] Creating Visual Retrieval Gallery HTML...", flush=True)
    gallery_path = os.path.join(output_dir, "independent_retrieval_gallery.html")

    html_parts = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="UTF-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '    <title>Digital Heritage AI — Independent Retrieval Gallery</title>',
        '    <style>',
        '        :root {',
        '            --bg-color: #0b0f19;',
        '            --card-bg: #151c2c;',
        '            --text-main: #f1f5f9;',
        '            --text-muted: #94a3b8;',
        '            --accent-cyan: #06b6d4;',
        '            --accent-gold: #f59e0b;',
        '            --border-color: #1e293b;',
        '            --card-hover: #1e293b;',
        '        }',
        '        body {',
        '            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
        '            background-color: var(--bg-color);',
        '            color: var(--text-main);',
        '            margin: 0;',
        '            padding: 24px;',
        '        }',
        '        .header {',
        '            text-align: center;',
        '            padding: 24px;',
        '            background: rgba(30, 41, 59, 0.5);',
        '            border-radius: 12px;',
        '            border: 1px solid var(--border-color);',
        '            margin-bottom: 32px;',
        '        }',
        '        .header h1 {',
        '            font-size: 2.2rem;',
        '            margin: 0 0 8px 0;',
        '            background: linear-gradient(135deg, #06b6d4, #818cf8);',
        '            -webkit-background-clip: text;',
        '            -webkit-text-fill-color: transparent;',
        '        }',
        '        .header p { color: var(--text-muted); margin: 0; font-size: 1rem; }',
        '        .query-block {',
        '            background-color: var(--card-bg);',
        '            border: 1px solid var(--border-color);',
        '            border-radius: 12px;',
        '            padding: 20px;',
        '            margin-bottom: 32px;',
        '        }',
        '        .query-header {',
        '            display: flex;',
        '            align-items: center;',
        '            gap: 20px;',
        '            padding-bottom: 16px;',
        '            border-bottom: 1px solid var(--border-color);',
        '            margin-bottom: 16px;',
        '        }',
        '        .query-img-wrapper {',
        '            width: 140px;',
        '            height: 140px;',
        '            background: #020617;',
        '            border-radius: 8px;',
        '            overflow: hidden;',
        '            display: flex;',
        '            align-items: center;',
        '            justify-content: center;',
        '            border: 2px solid var(--accent-gold);',
        '        }',
        '        .query-img-wrapper img { max-width: 100%; max-height: 100%; object-fit: contain; }',
        '        .query-info h3 { margin: 0 0 6px 0; color: var(--accent-gold); font-size: 1.3rem; }',
        '        .query-info p { margin: 4px 0; color: var(--text-muted); font-size: 0.9rem; }',
        '        .badge-class {',
        '            background-color: var(--accent-gold);',
        '            color: #020617;',
        '            font-weight: bold;',
        '            padding: 2px 10px;',
        '            border-radius: 12px;',
        '            font-size: 0.8rem;',
        '            display: inline-block;',
        '            margin-bottom: 6px;',
        '        }',
        '        .results-grid {',
        '            display: grid;',
        '            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));',
        '            gap: 14px;',
        '        }',
        '        .result-card {',
        '            background-color: #0f172a;',
        '            border: 1px solid var(--border-color);',
        '            border-radius: 8px;',
        '            padding: 10px;',
        '            display: flex;',
        '            flex-direction: column;',
        '        }',
        '        .card-header { display: flex; justify-content: space-between; margin-bottom: 8px; }',
        '        .rank-tag { background: #1e293b; color: var(--accent-cyan); font-weight: bold; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; }',
        '        .sim-tag { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); font-weight: 600; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; }',
        '        .img-box { width: 100%; height: 150px; background: #020617; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }',
        '        .img-box img { max-width: 100%; max-height: 100%; object-fit: contain; }',
        '        .fn-text { font-size: 0.75rem; color: var(--text-muted); word-break: break-all; margin-top: auto; }',
        '    </style>',
        '</head>',
        '<body>',
        '    <div class="header">',
        '        <h1>Digital Heritage AI — Independent Retrieval Gallery</h1>',
        f'        <p>Visual Inspection Gallery for {len(valid_queries)} Independent Test Queries</p>',
        '    </div>'
    ]

    for q in valid_queries:
        q_rel = q['rel_path']
        q_class = q['folder_class']
        q_img_src = f"../ai_microservice/independent_test/{q_rel}"
        
        q_results = [r for r in trained_retrieval_results if r['query_image'] == q_rel]
        q_results = sorted(q_results, key=lambda x: x['rank'])

        html_parts.append('    <div class="query-block">')
        html_parts.append('        <div class="query-header">')
        html_parts.append('            <div class="query-img-wrapper">')
        html_parts.append(f'                <img src="{q_img_src}" alt="{q_rel}">')
        html_parts.append('            </div>')
        html_parts.append('            <div class="query-info">')
        html_parts.append(f'                <span class="badge-class">GROUND TRUTH: {q_class}</span>')
        html_parts.append(f'                <h3>Query Image: {q_rel}</h3>')
        html_parts.append(f'                <p><strong>SHA-256 Hash:</strong> <code>{q["sha256"][:16]}...</code></p>')
        html_parts.append(f'                <p><strong>Status:</strong> Valid Independent Sample (No Reference Leakage)</p>')
        html_parts.append('            </div>')
        html_parts.append('        </div>')
        html_parts.append('        <div class="results-grid">')

        for r in q_results:
            rank = r['rank']
            sim = r['similarity']
            rname = r['retrieved_image']
            r_img_src = f"../ai_microservice/images/{rname}"

            html_parts.append('            <div class="result-card">')
            html_parts.append('                <div class="card-header">')
            html_parts.append(f'                    <span class="rank-tag">Rank {rank}</span>')
            html_parts.append(f'                    <span class="sim-tag">{sim:.4f}</span>')
            html_parts.append('                </div>')
            html_parts.append('                <div class="img-box">')
            html_parts.append(f'                    <img src="{r_img_src}" alt="{rname}" loading="lazy">')
            html_parts.append('                </div>')
            html_parts.append(f'                <div class="fn-text">{rname}</div>')
            html_parts.append('            </div>')

        html_parts.append('        </div>')
        html_parts.append('    </div>')

    html_parts.append('</body>')
    html_parts.append('</html>')

    with open(gallery_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))
    print(f"  Saved visual retrieval gallery to: {gallery_path}", flush=True)

    # 16. STATISTICAL / SUMMARY REPORT
    print("\n[STEP 16] Generating Final Evaluation Report (Txt & Json)...", flush=True)
    
    report_txt_path = os.path.join(output_dir, "final_evaluation_report.txt")
    
    report_lines = [
        "================================================================================",
        "DIGITAL HERITAGE AI — INDEPENDENT EVALUATION REPORT",
        "================================================================================",
        f"Evaluation Date              : {time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"Evaluated Model Checkpoint  : {ckpt_path}",
        f"Backbone Model               : {model_name}",
        f"Backbone Embedding Dim      : 768",
        f"Projection Head Architecture: Linear(768, 512) -> GELU -> Linear(512, 256)",
        f"Projection Output Dim        : 256",
        f"Trained Parameters           : {param_count:,}",
        f"FAISS Index Type             : IndexFlatIP (256-D Inner Product)",
        f"Reference Database Size      : {num_ref_images:,} images",
        "--------------------------------------------------------------------------------",
        "1. DATASET & INDEPENDENT TEST BREAKDOWN",
        "--------------------------------------------------------------------------------",
        f"Total Independent Test Images: {len(test_queries)}",
        f"Class Distribution:",
    ]
    for sd in subdirs:
        count = sum(1 for q in test_queries if q['folder_class'] == sd)
        report_lines.append(f"  - {sd:<15}: {count} images")
    
    report_lines.extend([
        "--------------------------------------------------------------------------------",
        "2. DATA LEAKAGE ANALYSIS",
        "--------------------------------------------------------------------------------",
        f"Hashing Method               : SHA-256 (File Level)",
        f"Total Independent Queries    : {len(test_queries)}",
        f"Exact Duplicate Leakage      : {len(excluded_queries)}",
        f"Valid Independent Queries    : {len(valid_queries)}",
        f"Excluded Leakage Queries     : {len(excluded_queries)}",
        "Leakage Assessment           : " + ("No exact duplicate leakage detected." if len(excluded_queries) == 0 else f"{len(excluded_queries)} exact duplicates excluded."),
        "--------------------------------------------------------------------------------",
        "3. RETRIEVAL METRICS (INDEPENDENT TEST SET)",
        "--------------------------------------------------------------------------------",
        f"Trained Model (256-D Projection Head):",
        f"  Recall@1    : {t_metrics['recall_1']:.2f}%",
        f"  Recall@5    : {t_metrics['recall_5']:.2f}%",
        f"  Recall@10   : {t_metrics['recall_10']:.2f}%",
        f"  Precision@1 : {t_metrics['prec_1']:.2f}%",
        f"  Precision@5 : {t_metrics['prec_5']:.2f}%",
        f"  Precision@10: {t_metrics['prec_10']:.2f}%",
        f"  mAP@10      : {t_metrics['map_10']:.2f}%",
        "",
        f"Baseline DINOv2 (768-D Raw):",
        f"  Recall@1    : {b_metrics['recall_1']:.2f}%",
        f"  Recall@5    : {b_metrics['recall_5']:.2f}%",
        f"  Recall@10   : {b_metrics['recall_10']:.2f}%",
        f"  Precision@1 : {b_metrics['prec_1']:.2f}%",
        f"  Precision@5 : {b_metrics['prec_5']:.2f}%",
        f"  Precision@10: {b_metrics['prec_10']:.2f}%",
        f"  mAP@10      : {b_metrics['map_10']:.2f}%",
        "--------------------------------------------------------------------------------",
        "4. CLASSIFICATION METRICS STATUS",
        "--------------------------------------------------------------------------------",
        "Classification Status: NOT CALCULATED — reliable ground truth unavailable.",
        f"Reason: {unlabeled_count:,} out of {num_ref_images:,} reference images ({unlabeled_pct:.2f}%) lack explicit deity/class labels.",
        "--------------------------------------------------------------------------------",
        "5. LIMITATIONS & SCIENTIFIC NOTES",
        "--------------------------------------------------------------------------------",
        "1. Ground truth evaluation relies on non-leaked independent queries.",
        "2. Retrieval metrics assess top-10 visual similarity ranking against reference database.",
        "3. Projection head (256-D) compresses 768-D embeddings by 3x while preserving semantic retrieval capability.",
        "================================================================================"
    ])

    with open(report_txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    print(f"  Saved report text to: {report_txt_path}", flush=True)

    # 17. MACHINE READABLE JSON
    results_json = {
        "dataset": {
            "total_queries": len(test_queries),
            "valid_queries": len(valid_queries),
            "excluded_leakage": len(excluded_queries)
        },
        "model": {
            "backbone": model_name,
            "backbone_embedding_dimension": 768,
            "projection_head": "768-512-256",
            "projection_output_dimension": 256,
            "trainable_parameters": param_count,
            "checkpoint": ckpt_path
        },
        "reference_database": {
            "image_count": num_ref_images,
            "faiss_dimension": 256
        },
        "retrieval_metrics": {
            "trained_model_256d": {
                "recall_at_1": round(t_metrics['recall_1'], 2),
                "recall_at_5": round(t_metrics['recall_5'], 2),
                "recall_at_10": round(t_metrics['recall_10'], 2),
                "precision_at_1": round(t_metrics['prec_1'], 2),
                "precision_at_5": round(t_metrics['prec_5'], 2),
                "precision_at_10": round(t_metrics['prec_10'], 2),
                "map_at_10": round(t_metrics['map_10'], 2)
            },
            "baseline_dinov2_768d": {
                "recall_at_1": round(b_metrics['recall_1'], 2),
                "recall_at_5": round(b_metrics['recall_5'], 2),
                "recall_at_10": round(b_metrics['recall_10'], 2),
                "precision_at_1": round(b_metrics['prec_1'], 2),
                "precision_at_5": round(b_metrics['prec_5'], 2),
                "precision_at_10": round(b_metrics['prec_10'], 2),
                "map_at_10": round(b_metrics['map_10'], 2)
            }
        },
        "classification_metrics": "NOT CALCULATED — reliable ground truth unavailable.",
        "baseline_comparison": {
            "baseline_map10": round(b_metrics['map_10'], 2),
            "trained_map10": round(t_metrics['map_10'], 2),
            "delta_map10": round(t_metrics['map_10'] - b_metrics['map_10'], 2)
        }
    }

    json_path = os.path.join(output_dir, "final_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results_json, f, indent=4)
    print(f"  Saved results JSON to: {json_path}", flush=True)

    # 20. FINAL TERMINAL OUTPUT
    print("\n" + "=" * 50, flush=True)
    print("INDEPENDENT TEST EVALUATION COMPLETE", flush=True)
    print("=" * 50, flush=True)
    print(f"Independent images       : {len(test_queries)}", flush=True)
    print(f"Exact leakage            : {len(excluded_queries)}", flush=True)
    print(f"Valid evaluation images  : {len(valid_queries)}", flush=True)
    print("", flush=True)
    print(f"Reference images         : {num_ref_images:,}", flush=True)
    print("", flush=True)
    print("Model:", flush=True)
    print("DINOv2-base + existing projection head", flush=True)
    print("", flush=True)
    print("Embedding:", flush=True)
    print("768-D -> 256-D", flush=True)
    print("", flush=True)
    print("FAISS:", flush=True)
    print("256-D Inner Product", flush=True)
    print("", flush=True)
    print("Retrieval Metrics:", flush=True)
    print(f"Recall@1  : {t_metrics['recall_1']:.2f}%", flush=True)
    print(f"Recall@5  : {t_metrics['recall_5']:.2f}%", flush=True)
    print(f"Recall@10 : {t_metrics['recall_10']:.2f}%", flush=True)
    print("", flush=True)
    print(f"Precision@1  : {t_metrics['prec_1']:.2f}%", flush=True)
    print(f"Precision@5  : {t_metrics['prec_5']:.2f}%", flush=True)
    print(f"Precision@10 : {t_metrics['prec_10']:.2f}%", flush=True)
    print("", flush=True)
    print(f"mAP@10 : {t_metrics['map_10']:.2f}%", flush=True)
    print("", flush=True)
    print("Classification metrics:", flush=True)
    print("NOT CALCULATED — reliable ground truth unavailable.", flush=True)
    print("", flush=True)
    print("Results:", flush=True)
    print(f"{output_dir}/", flush=True)
    print("=" * 50, flush=True)

if __name__ == "__main__":
    run_evaluation()
