import os
import json
from dataclasses import dataclass, asdict, field
from typing import Dict, Any, Optional
from datetime import datetime

METADATA_FIELDS = [
    "image_id",
    "image_name",
    "image_path",
    "artifact_name",
    "temple_name",
    "monument_name",
    "deity_or_subject",
    "artifact_type",
    "material",
    "architectural_style",
    "location",
    "district",
    "state",
    "country",
    "historical_period",
    "approximate_date",
    "dynasty",
    "description",
    "historical_background",
    "provenance",
    "current_location",
    "metadata_source",
    "source_url",
    "metadata_confidence",
    "verification_status",
    "metadata_generated_by",
    "last_updated"
]

VALID_VERIFICATION_STATUSES = {"unverified", "candidate", "partially_verified", "verified"}
VALID_CONFIDENCE_LEVELS = {"low", "medium", "high"}
VALID_GENERATED_BY = {
    "filename",
    "ai_vision",
    "official_source",
    "museum_source",
    "government_source",
    "manual_verification",
    "combined"
}

@dataclass
class HeritageMetadataRecord:
    image_id: str
    image_name: str
    image_path: str = ""
    artifact_name: Optional[str] = None
    temple_name: Optional[str] = None
    monument_name: Optional[str] = None
    deity_or_subject: Optional[str] = None
    artifact_type: Optional[str] = None
    material: Optional[str] = None
    architectural_style: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    historical_period: Optional[str] = None
    approximate_date: Optional[str] = None
    dynasty: Optional[str] = None
    description: Optional[str] = None
    historical_background: Optional[str] = None
    provenance: Optional[str] = None
    current_location: Optional[str] = None
    metadata_source: Optional[str] = None
    source_url: Optional[str] = None
    metadata_confidence: str = "low"
    verification_status: str = "unverified"
    metadata_generated_by: str = "filename"
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        # Ensure all fields present and null/empty handled gracefully
        for key in METADATA_FIELDS:
            if key not in data:
                data[key] = None
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "HeritageMetadataRecord":
        filtered = {k: v for k, v in data.items() if k in METADATA_FIELDS}
        return cls(**filtered)

def sanitize_record(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensures all keys in METADATA_FIELDS exist in dictionary,
    replaces NaN / None / float('nan') with None or empty strings for output consistency,
    and validates enum values.
    """
    record = {}
    for k in METADATA_FIELDS:
        val = data.get(k)
        if val is None or (isinstance(val, float) and str(val) == "nan"):
            record[k] = None
        else:
            record[k] = str(val).strip() if isinstance(val, str) else val

    # Validate defaults
    if not record.get("verification_status") or record["verification_status"] not in VALID_VERIFICATION_STATUSES:
        record["verification_status"] = "unverified"

    if not record.get("metadata_confidence") or record["metadata_confidence"] not in VALID_CONFIDENCE_LEVELS:
        record["metadata_confidence"] = "low"

    if not record.get("metadata_generated_by") or record["metadata_generated_by"] not in VALID_GENERATED_BY:
        record["metadata_generated_by"] = "filename"

    if not record.get("last_updated"):
        record["last_updated"] = datetime.utcnow().isoformat()

    return record
