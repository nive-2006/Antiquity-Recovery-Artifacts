import os
import json
from datetime import datetime
from typing import Dict, Any

SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
PROGRESS_PATH = os.path.join(DATA_DIR, "metadata_progress.json")

class MetadataProgressTracker:
    def __init__(self, progress_path: str = PROGRESS_PATH, total_images: int = 20399):
        self.progress_path = progress_path
        self.total_images = total_images
        self.processed_images = 0
        self.remaining_images = total_images
        self.last_processed_index = -1
        self.load()

    def load(self):
        if os.path.exists(self.progress_path):
            try:
                with open(self.progress_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.total_images = data.get("total_images", self.total_images)
                    self.processed_images = data.get("processed_images", 0)
                    self.last_processed_index = data.get("last_processed_index", -1)
                    self.remaining_images = self.total_images - self.processed_images
            except Exception as e:
                print(f"[ProgressTracker] Warning reading progress file: {e}")

    def update(self, processed_count: int, last_index: int):
        self.processed_images = processed_count
        self.last_processed_index = last_index
        self.remaining_images = max(0, self.total_images - self.processed_images)
        self.save()

    def save(self):
        os.makedirs(os.path.dirname(self.progress_path), exist_ok=True)
        data = {
            "total_images": self.total_images,
            "processed_images": self.processed_images,
            "remaining_images": self.remaining_images,
            "last_processed_index": self.last_processed_index,
            "last_updated": datetime.utcnow().isoformat()
        }
        with open(self.progress_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_images": self.total_images,
            "processed_images": self.processed_images,
            "remaining_images": self.remaining_images,
            "last_processed_index": self.last_processed_index
        }
