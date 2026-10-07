import os
import json
import pandas as pd
from typing import Dict, Any, List, Optional
from metadata_schema import METADATA_FIELDS, sanitize_record

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "heritage_metadata.csv")
JSON_PATH = os.path.join(DATA_DIR, "heritage_metadata.json")
MASTER_METADATA_PATH = os.path.join(DATA_DIR, "master_image_metadata.csv")

class HeritageMetadataStore:
    def __init__(self, csv_path: str = CSV_PATH, json_path: str = JSON_PATH):
        self.csv_path = csv_path
        self.json_path = json_path
        self.records: List[Dict[str, Any]] = []
        self.by_id: Dict[str, Dict[str, Any]] = {}
        self.by_name: Dict[str, Dict[str, Any]] = {}

        self.load()

    def load(self):
        """Loads existing metadata CSV/JSON if present."""
        if os.path.exists(self.csv_path):
            try:
                df = pd.read_csv(self.csv_path)
                df = df.where(pd.notnull(df), None)
                self.records = df.to_dict(orient="records")
                self._reindex()
                return
            except Exception as e:
                print(f"[MetadataStore] Warning reading CSV ({e}). Loading fallback.")

        if os.path.exists(self.json_path):
            try:
                with open(self.json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self.records = data
                    elif isinstance(data, dict):
                        self.records = list(data.values())
                self._reindex()
                return
            except Exception as e:
                print(f"[MetadataStore] Warning reading JSON: {e}")

        self.records = []
        self.by_id = {}
        self.by_name = {}

    def _reindex(self):
        self.by_id = {}
        self.by_name = {}
        for rec in self.records:
            sanitized = sanitize_record(rec)
            img_id = str(sanitized["image_id"])
            img_name = str(sanitized["image_name"])
            self.by_id[img_id] = sanitized
            self.by_name[img_name] = sanitized

    def get_by_id(self, image_id: str) -> Optional[Dict[str, Any]]:
        return self.by_id.get(str(image_id))

    def get_by_name(self, image_name: str) -> Optional[Dict[str, Any]]:
        return self.by_name.get(str(image_name))

    def get_by_index(self, index: int) -> Optional[Dict[str, Any]]:
        if 0 <= index < len(self.records):
            return self.records[index]
        return None

    def upsert_record(self, record: Dict[str, Any], index: Optional[int] = None):
        sanitized = sanitize_record(record)
        img_id = str(sanitized["image_id"])
        img_name = str(sanitized["image_name"])

        if index is not None:
            # Expand list if needed to accommodate index
            while len(self.records) <= index:
                self.records.append({})
            self.records[index] = sanitized
        else:
            self.records.append(sanitized)

        self.by_id[img_id] = sanitized
        self.by_name[img_name] = sanitized

    def save(self):
        """Saves current records atomically to both CSV and JSON."""
        os.makedirs(os.path.dirname(self.csv_path), exist_ok=True)
        
        # Ensure exact column schema
        sanitized_list = [sanitize_record(r) if r else sanitize_record({"image_id": "", "image_name": ""}) for r in self.records]
        df = pd.DataFrame(sanitized_list)
        
        for col in METADATA_FIELDS:
            if col not in df.columns:
                df[col] = None

        df = df[METADATA_FIELDS]
        df.to_csv(self.csv_path, index=False)

        # Save JSON as dict indexed by image_id & index list
        dict_mapping = {str(r["image_id"]): r for r in sanitized_list if r.get("image_id")}
        output_json = {
            "total_records": len(sanitized_list),
            "by_id": dict_mapping,
            "records": sanitized_list
        }
        with open(self.json_path, "w", encoding="utf-8") as f:
            json.dump(output_json, f, indent=2, ensure_ascii=False)
