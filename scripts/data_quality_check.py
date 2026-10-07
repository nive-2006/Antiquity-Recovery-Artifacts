import os
import sys
import glob
import hashlib
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import numpy as np
from PIL import Image

def get_win_path(fpath):
    abs_p = os.path.abspath(fpath)
    if os.name == 'nt' and not abs_p.startswith('\\\\?\\'):
        abs_p = '\\\\?\\' + abs_p
    return abs_p

def run_data_quality_check():
    print("=" * 80)
    print("DIGITAL HERITAGE AI — DATA QUALITY AUDIT (PHASE 2)")
    print("=" * 80)

    base_dir = "ai_microservice"
    img_dir = os.path.join(base_dir, "images")
    meta_path = os.path.join(base_dir, "data", "heritage_metadata.csv")

    output_dir = "outputs/data_quality"
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n[1] Scanning reference image files in '{img_dir}'...")
    img_files = sorted(glob.glob(os.path.join(img_dir, "*")))
    total_files = len(img_files)
    print(f"Total reference files found: {total_files:,}")

    corrupted_records = []
    hash_map = {}
    duplicate_records = []
    stats_records = []

    print("\n[2] Checking image integrity, resolutions, and exact duplicate SHA-256 hashes...")

    def inspect_file(fpath):
        fname = os.path.basename(fpath)
        win_fpath = get_win_path(fpath)
        
        try:
            sz_bytes = os.path.getsize(win_fpath)
        except Exception as e:
            return {
                'status': 'corrupted',
                'file_name': fname,
                'file_path': fpath,
                'size_bytes': 0,
                'width': 0,
                'height': 0,
                'format': 'UNKNOWN',
                'reason': f'Path read error: {str(e)}'
            }, None, None

        if sz_bytes == 0:
            return {
                'status': 'corrupted',
                'file_name': fname,
                'file_path': fpath,
                'size_bytes': 0,
                'width': 0,
                'height': 0,
                'format': 'UNKNOWN',
                'reason': 'Zero-byte empty file'
            }, None, None

        # Compute SHA-256
        h = hashlib.sha256()
        try:
            with open(win_fpath, 'rb') as f:
                while chunk := f.read(65536):
                    h.update(chunk)
            sha256_str = h.hexdigest()
        except Exception as e:
            return {
                'status': 'corrupted',
                'file_name': fname,
                'file_path': fpath,
                'size_bytes': sz_bytes,
                'width': 0,
                'height': 0,
                'format': 'UNKNOWN',
                'reason': f'Read error: {str(e)}'
            }, None, None

        # PIL Open & Verify
        try:
            with Image.open(win_fpath) as img:
                w, h_px = img.size
                fmt = img.format
                img.verify()
            
            if w < 32 or h_px < 32:
                return {
                    'status': 'suspicious_small',
                    'file_name': fname,
                    'file_path': fpath,
                    'size_bytes': sz_bytes,
                    'width': w,
                    'height': h_px,
                    'format': fmt,
                    'reason': f'Extremely low resolution ({w}x{h_px})'
                }, (fname, sha256_str), (fname, sz_bytes, w, h_px, fmt)

            return {
                'status': 'ok',
                'file_name': fname,
                'file_path': fpath,
                'size_bytes': sz_bytes,
                'width': w,
                'height': h_px,
                'format': fmt,
                'reason': 'Valid'
            }, (fname, sha256_str), (fname, sz_bytes, w, h_px, fmt)

        except Exception as e:
            return {
                'status': 'corrupted',
                'file_name': fname,
                'file_path': fpath,
                'size_bytes': sz_bytes,
                'width': 0,
                'height': 0,
                'format': 'UNKNOWN',
                'reason': f'PIL decoding failure: {str(e)}'
            }, None, None

    with ThreadPoolExecutor(max_workers=16) as executor:
        results = executor.map(inspect_file, img_files)
        for res, hash_tuple, stat_tuple in results:
            if res['status'] in ['corrupted', 'suspicious_small']:
                corrupted_records.append(res)
            
            if hash_tuple:
                fname, h_val = hash_tuple
                if h_val in hash_map:
                    duplicate_records.append({
                        'duplicate_image': fname,
                        'original_image': hash_map[h_val],
                        'sha256_hash': h_val
                    })
                else:
                    hash_map[h_val] = fname
            
            if stat_tuple:
                fname, sz_b, w, h_p, fmt = stat_tuple
                stats_records.append({
                    'file_name': fname,
                    'size_bytes': sz_b,
                    'width': w,
                    'height': h_p,
                    'aspect_ratio': round(w / max(1, h_p), 2),
                    'format': fmt
                })

    # Save outputs/data_quality/corrupted_images.csv
    corrupted_df = pd.DataFrame(corrupted_records)
    corrupted_csv = os.path.join(output_dir, "corrupted_images.csv")
    corrupted_df.to_csv(corrupted_csv, index=False)
    print(f"Saved corrupted/problematic images report: {corrupted_csv} ({len(corrupted_df)} records)")

    # Save outputs/data_quality/duplicate_images.csv
    duplicate_df = pd.DataFrame(duplicate_records)
    duplicate_csv = os.path.join(output_dir, "duplicate_images.csv")
    duplicate_df.to_csv(duplicate_csv, index=False)
    print(f"Saved exact duplicate images report: {duplicate_csv} ({len(duplicate_df)} records)")

    # Save outputs/data_quality/image_statistics.csv
    stats_df = pd.DataFrame(stats_records)
    stats_csv = os.path.join(output_dir, "image_statistics.csv")
    stats_df.to_csv(stats_csv, index=False)
    print(f"Saved image statistics report: {stats_csv} ({len(stats_df)} records)")

    # 3. Missing Metadata Check
    print("\n[3] Checking metadata completeness in heritage_metadata.csv...")
    meta_df = pd.read_csv(meta_path)
    missing_meta_records = []
    
    for idx, row in meta_df.iterrows():
        fname = str(row['image_name'])
        deity = str(row.get('deity_or_subject', ''))
        art_name = str(row.get('artifact_name', ''))
        
        is_missing_deity = (not deity or deity == 'nan')
        is_missing_art = (not art_name or art_name == 'nan')
        
        if is_missing_deity or is_missing_art:
            missing_meta_records.append({
                'row_index': idx,
                'image_name': fname,
                'missing_deity_or_subject': is_missing_deity,
                'missing_artifact_name': is_missing_art,
                'current_artifact_name': art_name if not is_missing_art else 'N/A'
            })

    missing_meta_df = pd.DataFrame(missing_meta_records)
    missing_meta_csv = os.path.join(output_dir, "missing_metadata.csv")
    missing_meta_df.to_csv(missing_meta_csv, index=False)
    print(f"Saved missing metadata report: {missing_meta_csv} ({len(missing_meta_df)} records)")

    # 4. Generate Markdown Summary Report
    print("\n[4] Generating data_quality_report.md...")
    report_md_path = os.path.join(output_dir, "data_quality_report.md")
    
    mean_w = stats_df['width'].mean() if not stats_df.empty else 0
    mean_h = stats_df['height'].mean() if not stats_df.empty else 0
    mean_sz = stats_df['size_bytes'].mean() / 1024.0 if not stats_df.empty else 0

    report_content = f"""# Data Quality Audit Report — Digital Heritage AI

**Date**: October 6, 2026  
**Audited Directory**: `ai_microservice/images/` ({total_files:,} files)  

---

## 1. Summary Statistics

- **Total Reference Image Files**: {total_files:,}
- **Corrupted / Unreadable Files**: {len(corrupted_df)}
- **Exact Duplicate Image Files**: {len(duplicate_df)}
- **Average Resolution**: {mean_w:.1f} × {mean_h:.1f} pixels
- **Average File Size**: {mean_sz:.1f} KB
- **Missing Explicit Deity/Subject Metadata**: {len(missing_meta_df):,} / {len(meta_df):,} ({len(missing_meta_df)/len(meta_df)*100:.2f}%)

---

## 2. Integrity & Corruption Results

All {total_files:,} reference files were verified for decoding, header integrity, and resolution constraints:
- **Corrupted File Count**: {len(corrupted_df)}
- **Action**: No original images modified. Any unreadable files logged in `corrupted_images.csv`.

---

## 3. Duplicate Image Inspection

SHA-256 hash collision detection across all reference images:
- **Exact Duplicate Pairs**: {len(duplicate_df)}
- **Action**: Preserved in dataset; documented in `duplicate_images.csv`.

---

## 4. Metadata Completeness

- **Total Catalog Rows**: {len(meta_df):,}
- **Rows Missing `deity_or_subject`**: {missing_meta_df['missing_deity_or_subject'].sum():,}
- **Rows Missing `artifact_name`**: {missing_meta_df['missing_artifact_name'].sum():,}
"""

    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"Saved data quality report markdown: {report_md_path}")
    print("\nData Quality Check Complete!")

if __name__ == "__main__":
    run_data_quality_check()
