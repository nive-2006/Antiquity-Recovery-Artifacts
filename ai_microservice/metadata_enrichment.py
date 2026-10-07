import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
METADATA_MODULE_DIR = os.path.join(SCRIPT_DIR, "metadata")

if METADATA_MODULE_DIR not in sys.path:
    sys.path.insert(0, METADATA_MODULE_DIR)

from metadata.metadata_enrichment import run_metadata_enrichment, argparse

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
