import os
import sys
import time
import json
import argparse
import pandas as pd
from datetime import datetime
from typing import Optional, Dict, Any, List, Set

# Ensure local imports work cleanly
METADATA_DIR = os.path.dirname(os.path.abspath(__file__))
AI_MICROSERVICE_DIR = os.path.dirname(METADATA_DIR)
if METADATA_DIR not in sys.path:
    sys.path.insert(0, METADATA_DIR)

from metadata_schema import HeritageMetadataRecord, sanitize_record
from filename_parser import parse_filename_metadata
from image_analyzer import analyze_heritage_image
from source_verifier import verify_against_authoritative_sources
from metadata_store import HeritageMetadataStore
from metadata_progress import MetadataProgressTracker

DATA_DIR = os.path.join(AI_MICROSERVICE_DIR, "data")
MASTER_METADATA_PATH = os.path.join(DATA_DIR, "master_image_metadata.csv")
IMAGES_DIR = os.path.join(AI_MICROSERVICE_DIR, "images")
REPORT_JSON_PATH = os.path.join(DATA_DIR, "metadata_enrichment_report.json")
REPORT_TXT_PATH = os.path.join(DATA_DIR, "metadata_enrichment_report.txt")

def print_progress_bar(iteration, total, prefix='', suffix='', decimals=1, length=30, fill='#'):
    percent = (("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))) if total > 0 else "100.0"
    filled_length = int(length * iteration // total) if total > 0 else length
    bar = fill * filled_length + '-' * (length - filled_length)
    try:
        sys.stdout.write(f'\r{prefix} |{bar}| {percent}% {suffix}')
        sys.stdout.flush()
    except Exception:
        pass
    if iteration == total:
        print()

def run_metadata_enrichment(
    resume: bool = False,
    force: bool = False,
    limit: Optional[int] = None,
    start: Optional[int] = None,
    end: Optional[int] = None,
    batch_size: int = 100
):
    start_time = time.time()
    start_iso = datetime.utcnow().isoformat()

    if not os.path.exists(MASTER_METADATA_PATH):
        raise FileNotFoundError(f"Master image metadata not found at '{MASTER_METADATA_PATH}'")

    master_df = pd.read_csv(MASTER_METADATA_PATH)
    total_images = len(master_df)

    store = HeritageMetadataStore()
    tracker = MetadataProgressTracker(total_images=total_images)

    # Determine execution index bounds
    if start is not None:
        start_idx = max(0, start)
    elif resume:
        start_idx = max(0, tracker.last_processed_index + 1)
    else:
        start_idx = 0

    if end is not None:
        end_idx = min(total_images, end)
    elif limit is not None:
        end_idx = min(total_images, start_idx + limit)
    else:
        end_idx = total_images

    print("========================================")
    print("DIGITAL HERITAGE METADATA ENRICHMENT")
    print("========================================")
    print(f"Total dataset images : {total_images:,}")
    print(f"Target index range   : {start_idx:,} -> {end_idx:,}")
    print(f"Batch size           : {batch_size}")
    print(f"Resume mode          : {resume}")
    print(f"Force re-process     : {force}")
    print("========================================")

    processed_in_run = 0
    skipped_in_run = 0
    failed_in_run = 0

    current_batch_count = 0

    for idx in range(start_idx, end_idx):
        row = master_df.iloc[idx]
        image_id = str(row["image_id"])
        image_name = str(row["image_name"])
        local_image_path = os.path.join(IMAGES_DIR, image_name)

        # Check if already populated unless force is set
        existing = store.get_by_id(image_id)
        if not force and existing and existing.get("metadata_generated_by"):
            skipped_in_run += 1
            tracker.update(processed_count=store.get_by_index(idx) and (idx + 1) or len(store.records), last_index=idx)
            continue

        try:
            # Step 4: Extract from filename
            fn_res = parse_filename_metadata(image_name)

            if not fn_res["is_uninformative"] and fn_res["candidate_metadata"]:
                candidate = fn_res["candidate_metadata"]
            else:
                # Step 5: Image visual understanding
                candidate = analyze_heritage_image(local_image_path, image_name)

            # Step 6: Cross-reference with authoritative sources
            enriched = verify_against_authoritative_sources(candidate, image_name)

            # Build record preserving exact image_id and image_name mapping
            record = HeritageMetadataRecord(
                image_id=image_id,
                image_name=image_name,
                image_path=f"images/{image_name}",
                artifact_name=enriched.get("artifact_name"),
                temple_name=enriched.get("temple_name"),
                monument_name=enriched.get("monument_name"),
                deity_or_subject=enriched.get("deity_or_subject"),
                artifact_type=enriched.get("artifact_type"),
                material=enriched.get("material"),
                architectural_style=enriched.get("architectural_style"),
                location=enriched.get("location"),
                district=enriched.get("district"),
                state=enriched.get("state"),
                country=enriched.get("country", "India"),
                historical_period=enriched.get("historical_period"),
                approximate_date=enriched.get("approximate_date"),
                dynasty=enriched.get("dynasty"),
                description=enriched.get("description"),
                historical_background=enriched.get("historical_background"),
                provenance=enriched.get("provenance"),
                current_location=enriched.get("current_location"),
                metadata_source=enriched.get("metadata_source"),
                source_url=enriched.get("source_url"),
                metadata_confidence=enriched.get("metadata_confidence", "low"),
                verification_status=enriched.get("verification_status", "unverified"),
                metadata_generated_by=enriched.get("metadata_generated_by", "filename"),
                last_updated=datetime.utcnow().isoformat()
            )

            store.upsert_record(record.to_dict(), index=idx)
            processed_in_run += 1
            current_batch_count += 1

        except Exception as err:
            print(f"\nError processing image index {idx} ({image_name}): {err}")
            failed_in_run += 1

        # Checkpoint every batch_size or at final index
        if current_batch_count >= batch_size or idx == end_idx - 1:
            store.save()
            tracker.update(processed_count=idx + 1, last_index=idx)
            current_batch_count = 0

        # Print progress status
        if (processed_in_run + skipped_in_run) % max(1, limit // 10 if limit else 50) == 0 or idx == end_idx - 1:
            curr = idx - start_idx + 1
            tot = end_idx - start_idx
            print_progress_bar(curr, tot, prefix='Processing metadata', suffix=f'({idx + 1}/{total_images})')

    # Final store & progress save
    store.save()
    tracker.update(processed_count=end_idx, last_index=end_idx - 1)

    end_time = time.time()
    elapsed_seconds = round(end_time - start_time, 2)
    end_iso = datetime.utcnow().isoformat()

    # Calculate status breakdowns
    status_counts = {"verified": 0, "partially_verified": 0, "candidate": 0, "unverified": 0}
    sources_set = set()
    for rec in store.records:
        st = rec.get("verification_status", "unverified")
        status_counts[st] = status_counts.get(st, 0) + 1
        src = rec.get("metadata_source")
        if src:
            sources_set.add(src)

    # Step 22: Create JSON and TXT reports
    report_data = {
        "total_images": total_images,
        "processed_images": len(store.records),
        "processed_in_this_run": processed_in_run,
        "skipped_in_this_run": skipped_in_run,
        "failed_in_this_run": failed_in_run,
        "verified_images": status_counts.get("verified", 0),
        "partially_verified_images": status_counts.get("partially_verified", 0),
        "candidate_images": status_counts.get("candidate", 0),
        "unverified_images": status_counts.get("unverified", 0),
        "metadata_sources": sorted(list(sources_set)),
        "start_time": start_iso,
        "end_time": end_iso,
        "processing_time_seconds": elapsed_seconds
    }

    with open(REPORT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    txt_summary = f"""========================================
DIGITAL HERITAGE METADATA ENRICHMENT REPORT
========================================
Execution Completed At : {end_iso}
Processing Time        : {elapsed_seconds} seconds

Total Heritage Images  : {total_images:,}
Processed Metadata Rows: {len(store.records):,}
Processed in this run  : {processed_in_run:,}
Skipped (Existing)     : {skipped_in_run:,}
Failed Images          : {failed_in_run:,}

VERIFICATION STATUS BREAKDOWN:
  - Verified           : {status_counts.get("verified", 0):,}
  - Partially Verified : {status_counts.get("partially_verified", 0):,}
  - Candidate          : {status_counts.get("candidate", 0):,}
  - Unverified         : {status_counts.get("unverified", 0):,}

METADATA SOURCES:
{chr(10).join("  - " + s for s in sorted(list(sources_set)))}
========================================
"""
    with open(REPORT_TXT_PATH, "w", encoding="utf-8") as f:
        f.write(txt_summary)

    print("\n" + txt_summary)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Digital Heritage Metadata Enrichment System")
    parser.add_argument("--resume", action="store_true", help="Resume from last processed index")
    parser.add_argument("--force", action="store_true", help="Force re-processing of existing metadata")
    parser.add_argument("--limit", type=int, default=None, help="Limit maximum images to process")
    parser.add_argument("--start", type=int, default=None, help="Start index")
    parser.add_argument("--end", type=int, default=None, help="End index")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch checkpointing size")

    args = parser.parse_args()
    run_metadata_enrichment(
        resume=args.resume,
        force=args.force,
        limit=args.limit,
        start=args.start,
        end=args.end,
        batch_size=args.batch_size
    )
