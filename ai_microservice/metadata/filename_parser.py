import re
import urllib.parse
from typing import Dict, Any, Optional

HASH_PATTERN = re.compile(r'^[a-fA-F0-9]{24,64}$')

def is_uninformative_filename(filename: str) -> bool:
    """
    Returns True if the filename is an MD5/SHA hash or generic camera default (e.g. IMG_1234).
    """
    name_no_ext = re.sub(r'\.(jpg|jpeg|png|webp|tiff|bmp)$', '', filename, flags=re.IGNORECASE).strip()
    
    # Check if hex hash
    if HASH_PATTERN.match(name_no_ext):
        return True
    
    # Check generic camera / random hashes
    if re.match(r'^(img|dsc|image|photo|pic)[_\-]?\d+$', name_no_ext, flags=re.IGNORECASE):
        return True

    # If it has no alphabetic characters or length < 3
    if not re.search(r'[a-zA-Z]', name_no_ext) or len(name_no_ext) < 3:
        return True

    return False

def clean_filename(filename: str) -> str:
    """
    Cleans raw filename into a human-readable title string.
    Unquotes percent-encoded chars, strips extension and leading numeric indices.
    """
    # Unquote URL encoding
    unquoted = urllib.parse.unquote(filename)
    
    # Strip extension
    name_no_ext = re.sub(r'\.(jpg|jpeg|png|webp|tiff|bmp)$', '', unquoted, flags=re.IGNORECASE).strip()

    # Strip leading quotes/percent artifacts
    name_no_ext = name_no_ext.strip('"'+"'")

    # Strip leading numerical prefixes like "01_", "0040323_", "102_"
    cleaned = re.sub(r'^\d+[\_\-\s]+', '', name_no_ext)

    # Replace multiple underscores or hyphens with single spaces
    cleaned = re.sub(r'[\_\-]+', ' ', cleaned).strip()

    return cleaned

def parse_filename_metadata(filename: str) -> Dict[str, Any]:
    """
    Parses descriptive filename to extract candidate heritage metadata.
    Does NOT assume filename is historically verified.
    Marks metadata_generated_by="filename", verification_status="candidate", metadata_confidence="low" or "medium".
    """
    if is_uninformative_filename(filename):
        return {
            "is_uninformative": True,
            "metadata_source_detail": f"filename: {filename} (uninformative hash/code)",
            "candidate_metadata": {}
        }

    raw_cleaned = clean_filename(filename)
    
    candidate = {
        "artifact_name": None,
        "temple_name": None,
        "monument_name": None,
        "deity_or_subject": None,
        "artifact_type": None,
        "material": None,
        "architectural_style": None,
        "location": None,
        "district": None,
        "state": None,
        "country": "India",
        "historical_period": None,
        "approximate_date": None,
        "dynasty": None,
        "description": f"Heritage artifact image derived from descriptive filename: '{raw_cleaned}'.",
        "historical_background": None,
        "provenance": None,
        "current_location": None,
        "metadata_source": f"Filename Parsing ({filename})",
        "source_url": None,
        "metadata_confidence": "medium" if len(raw_cleaned) > 15 else "low",
        "verification_status": "candidate",
        "metadata_generated_by": "filename"
    }

    # Extract deity or subject hints
    deities = [
        "Madanika", "Salabhanjika", "Nataraja", "Vishnu", "Shiva", "Parvati", "Ganesha",
        "Buddha", "Tirthankara", "Mahavira", "Surya", "Durga", "Mahishasuramardini",
        "Lakshmi", "Saraswati", "Hanuman", "Kartikeya", "Murugan", "Brahma", "Nandi",
        "Dvarapala", "Chamunda", "Varaha", "Narasimha", "Krishna", "Rama"
    ]
    for deity in deities:
        if re.search(r'\b' + re.escape(deity) + r'\b', raw_cleaned, re.IGNORECASE):
            candidate["deity_or_subject"] = deity
            if not candidate["artifact_name"]:
                candidate["artifact_name"] = f"{deity} Sculpture"
            break

    # Extract temple or monument hints
    temples = [
        ("Chennakeshava Temple", "Chennakeshava"),
        ("Hoysaleswara Temple", "Hoysaleswara"),
        ("Brihadisvara Temple", "Brihadisvara|Brihadeeswarar|Tanjore Temple"),
        ("Kailasanatha Temple", "Kailasanatha|Kailasa"),
        ("Konark Sun Temple", "Konark|Sun Temple"),
        ("Shore Temple", "Shore Temple|Mahabalipuram Shore"),
        ("Meenakshi Temple", "Meenakshi"),
        ("Airavatesvara Temple", "Airavatesvara"),
        ("Virupaksha Temple", "Virupaksha"),
        ("Sun Temple Modhera", "Modhera"),
        ("Ajanta Caves", "Ajanta"),
        ("Ellora Caves", "Ellora"),
        ("Khajuraho Temples", "Khajuraho"),
        ("Sanchi Stupa", "Sanchi"),
        ("Elephanta Caves", "Elephanta"),
        ("Badami Cave Temples", "Badami"),
        ("Pattadakal Temples", "Pattadakal"),
        ("Mamallapuram Monuments", "Mahabalipuram|Mamallapuram")
    ]
    for official_tname, pattern in temples:
        if re.search(r'\b(' + pattern + r')\b', raw_cleaned, re.IGNORECASE):
            candidate["temple_name"] = official_tname
            candidate["monument_name"] = official_tname
            break

    # If no specific temple matched but "Temple" in filename
    if not candidate["temple_name"] and "temple" in raw_cleaned.lower():
        # Attempt to extract temple phrase
        t_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+Temple)', raw_cleaned)
        if t_match:
            candidate["temple_name"] = t_match.group(1).strip()

    # Extract dynasty hints
    dynasties = [
        ("Hoysala Dynasty", "Hoysala"),
        ("Chola Dynasty", "Chola"),
        ("Pallava Dynasty", "Pallava"),
        ("Rashtrakuta Dynasty", "Rashtrakuta"),
        ("Chalukya Dynasty", "Chalukya"),
        ("Vijayanagara Empire", "Vijayanagara"),
        ("Eastern Ganga Dynasty", "Ganga"),
        ("Chandela Dynasty", "Chandela"),
        ("Maurya Dynasty", "Maurya"),
        ("Gupta Empire", "Gupta"),
        ("Kushan Empire", "Kushan"),
        ("Cham Empire", "Cham"),
        ("Pala Empire", "Pala")
    ]
    for dyn_name, dyn_pattern in dynasties:
        if re.search(r'\b' + dyn_pattern + r'\b', raw_cleaned, re.IGNORECASE):
            candidate["dynasty"] = dyn_name
            break

    # Extract material or artifact type hints
    if re.search(r'\b(bronze|metal)\b', raw_cleaned, re.IGNORECASE):
        candidate["material"] = "Bronze"
        candidate["artifact_type"] = "Bronze Idol"
    elif re.search(r'\b(stone|granite|schist|marble|sandstone)\b', raw_cleaned, re.IGNORECASE):
        candidate["material"] = "Stone"
        candidate["artifact_type"] = "Stone Sculpture"
    elif re.search(r'\b(panel|relief)\b', raw_cleaned, re.IGNORECASE):
        candidate["artifact_type"] = "Relief Panel"
    elif re.search(r'\b(inscription|pillar)\b', raw_cleaned, re.IGNORECASE):
        candidate["artifact_type"] = "Inscription Stone"
    elif re.search(r'\b(coin)\b', raw_cleaned, re.IGNORECASE):
        candidate["artifact_type"] = "Coin"

    # Default artifact name if not set
    if not candidate["artifact_name"]:
        if candidate["temple_name"] and candidate["deity_or_subject"]:
            candidate["artifact_name"] = f"{candidate['deity_or_subject']} at {candidate['temple_name']}"
        elif candidate["temple_name"]:
            candidate["artifact_name"] = f"Sculpture from {candidate['temple_name']}"
        else:
            candidate["artifact_name"] = raw_cleaned[:60]

    return {
        "is_uninformative": False,
        "metadata_source_detail": f"filename: {filename}",
        "cleaned_title": raw_cleaned,
        "candidate_metadata": candidate
    }
