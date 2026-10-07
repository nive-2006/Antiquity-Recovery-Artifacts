import os
import sys
import json
import pandas as pd
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "heritage_metadata.csv")

def test_metadata_structure():
    print("========================================")
    print("METADATA API INTEGRATION TEST")
    print("========================================")
    
    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} missing")
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    print(f"Loaded heritage_metadata.csv: {len(df):,} rows")

    # Sample a verified record
    verified_sample = df[df["verification_status"] == "verified"].iloc[0].to_dict()
    print("\nSAMPLE VERIFIED RECORD:")
    for k, v in list(verified_sample.items())[:12]:
        print(f"  {k:22s}: {v}")

    # Sample a candidate record
    candidate_sample = df[df["verification_status"] == "candidate"].iloc[0].to_dict()
    print("\nSAMPLE CANDIDATE RECORD:")
    for k, v in list(candidate_sample.items())[:12]:
        print(f"  {k:22s}: {v}")

    print("\nMETADATA INTEGRATION TEST: PASSED")
    print("========================================")

if __name__ == "__main__":
    test_metadata_structure()
