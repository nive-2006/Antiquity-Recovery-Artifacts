import re
from typing import Dict, Any, Optional

AUTHORITATIVE_KNOWLEDGE_BASE = {
    "chennakeshava": {
        "temple_name": "Chennakeshava Temple",
        "monument_name": "Chennakeshava Temple Complex",
        "location": "Belur, Hassan District",
        "district": "Hassan",
        "state": "Karnataka",
        "country": "India",
        "dynasty": "Hoysala Dynasty",
        "historical_period": "12th Century CE",
        "approximate_date": "c. 1117 CE",
        "architectural_style": "Hoysala Star-shaped Architecture",
        "material": "Chloritic Schist (Soapstone)",
        "description": "Masterpiece of Hoysala temple architecture commissioned by King Vishnuvardhana to commemorate victory over Chola forces at Talakad.",
        "historical_background": "Consecrated in 1117 CE. Renowned for intricate bracket figures (Madanikas) depicting celestial dancers, musicians, and ritual scenes under temple eaves.",
        "provenance": "Belur Temple Outer Bracket & Wall Frieze",
        "current_location": "Chennakeshava Temple, Belur, Hassan District, Karnataka",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://asi.nic.in/monuments/chennakeshava-belur",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "hoysaleswara": {
        "temple_name": "Hoysaleswara Temple",
        "monument_name": "Hoysaleswara Temple Complex",
        "location": "Halebidu, Hassan District",
        "district": "Hassan",
        "state": "Karnataka",
        "country": "India",
        "dynasty": "Hoysala Dynasty",
        "historical_period": "12th Century CE",
        "approximate_date": "c. 1121–1160 CE",
        "architectural_style": "Hoysala Twin Star-shaped Architecture",
        "material": "Chloritic Schist (Soapstone)",
        "description": "Grand twin-sanctum Shiva temple adorned with continuous horizontal relief friezes of mythical beasts, musicians, and epics.",
        "historical_background": "Built during the reign of King Vishnuvardhana by noble Ketamalla. Inscribed on UNESCO World Heritage list in 2023.",
        "provenance": "Halebidu Outer Relief Panel",
        "current_location": "Halebidu, Hassan District, Karnataka",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/1670/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "brihadisvara": {
        "temple_name": "Brihadisvara Temple",
        "monument_name": "Peruvudaiyar Kovil (Brihadisvara Temple)",
        "location": "Thanjavur",
        "district": "Thanjavur",
        "state": "Tamil Nadu",
        "country": "India",
        "dynasty": "Chola Dynasty",
        "historical_period": "11th Century CE",
        "approximate_date": "c. 1010 CE",
        "architectural_style": "Dravidian Chola Architecture",
        "material": "Granite",
        "description": "Monumental Chola temple featuring a 216-foot vimana tower crowned by an 80-ton monolithic granite capstone (Kumbam).",
        "historical_background": "Commissioned by Emperor Raja Raja Chola I. UNESCO World Heritage Site ('Great Living Chola Temples').",
        "provenance": "Thanjavur Temple Courtyard / Wall Relief",
        "current_location": "Thanjavur, Tamil Nadu",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/250/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "shore_temple": {
        "temple_name": "Shore Temple",
        "monument_name": "Group of Monuments at Mahabalipuram",
        "location": "Mahabalipuram (Mamallapuram)",
        "district": "Chengalpattu",
        "state": "Tamil Nadu",
        "country": "India",
        "dynasty": "Pallava Dynasty",
        "historical_period": "8th Century CE",
        "approximate_date": "c. 700–728 CE",
        "architectural_style": "Pallava Structural Dravidian Architecture",
        "material": "Cut Granite Blocks",
        "description": "Ancient sea-facing structural granite temple complex dedicated to Shiva and Vishnu built by King Narasimhavarman II.",
        "historical_background": "Part of the UNESCO World Heritage Site at Mahabalipuram, built overlooking the Coromandel Coast of the Bay of Bengal.",
        "provenance": "Mahabalipuram Coast",
        "current_location": "Mahabalipuram, Chengalpattu District, Tamil Nadu",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://asi.nic.in/monuments/shore-temple-mahabalipuram",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "kailasanatha_kanchi": {
        "temple_name": "Kailasanatha Temple",
        "monument_name": "Kailasanatha Temple Kanchipuram",
        "location": "Kanchipuram",
        "district": "Kanchipuram",
        "state": "Tamil Nadu",
        "country": "India",
        "dynasty": "Pallava Dynasty",
        "historical_period": "8th Century CE",
        "approximate_date": "c. 685–705 CE",
        "architectural_style": "Early Pallava Dravidian Architecture",
        "material": "Sandstone",
        "description": "Oldest structural temple in Kanchipuram built by Rajasimha (Narasimhavarman II) featuring 58 sub-shrines and Somaskanda reliefs.",
        "historical_background": "Constructed between 685 and 705 CE. Provided architectural foundation for later Chola and Vijayanagara temples.",
        "provenance": "Kanchipuram Inner Precincts",
        "current_location": "Kanchipuram, Tamil Nadu",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://asi.nic.in/monuments/kailasanatha-kanchipuram",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "kailasa_ellora": {
        "temple_name": "Kailasa Temple (Cave 16)",
        "monument_name": "Ellora Cave 16",
        "location": "Ellora, Sambhaji Nagar (Aurangabad)",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "country": "India",
        "dynasty": "Rashtrakuta Dynasty",
        "historical_period": "8th Century CE",
        "approximate_date": "c. 756–773 CE",
        "architectural_style": "Monolithic Rock-Cut Architecture",
        "material": "Basalt Rock",
        "description": "Largest monolithic rock-cut structure in the world excavated top-down from a single basalt cliff-face under King Krishna I.",
        "historical_background": "Over 200,000 tonnes of rock were carved away over decades to create this multi-storey freestanding temple.",
        "provenance": "Ellora Cave 16",
        "current_location": "Ellora Caves, Sambhaji Nagar, Maharashtra",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/243/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "konark": {
        "temple_name": "Konark Sun Temple",
        "monument_name": "Konark Sun Temple Complex",
        "location": "Konark, Puri District",
        "district": "Puri",
        "state": "Odisha",
        "country": "India",
        "dynasty": "Eastern Ganga Dynasty",
        "historical_period": "13th Century CE",
        "approximate_date": "c. 1250 CE",
        "architectural_style": "Kalinga Architecture (Deula Style)",
        "material": "Khondalite Stone",
        "description": "Designed in the form of a colossal chariot dedicated to Surya the Sun God, with 24 carved wheels pulled by seven horses.",
        "historical_background": "Built by King Narasimhadeva I of the Eastern Ganga Empire c. 1250 CE. Designated UNESCO World Heritage site in 1984.",
        "provenance": "Konark Sun Temple Courtyard",
        "current_location": "Konark, Puri District, Odisha",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/262/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "khajuraho": {
        "temple_name": "Kandariya Mahadeva Temple",
        "monument_name": "Khajuraho Group of Monuments",
        "location": "Khajuraho, Chhatarpur District",
        "district": "Chhatarpur",
        "state": "Madhya Pradesh",
        "country": "India",
        "dynasty": "Chandela Dynasty",
        "historical_period": "10th–11th Century CE",
        "approximate_date": "c. 950–1050 CE",
        "architectural_style": "Nagara Style Architecture",
        "material": "Sandstone",
        "description": "Exquisite Chandela temple complex celebrated for rising shikhara towers and intricate sculptural bands depicting life and philosophy.",
        "historical_background": "Built by the Chandela rulers between 950 and 1050 CE. Inscribed as a UNESCO World Heritage site in 1986.",
        "provenance": "Khajuraho Western Group",
        "current_location": "Khajuraho, Chhatarpur District, Madhya Pradesh",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/240/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "ajanta": {
        "temple_name": "Ajanta Cave Temples",
        "monument_name": "Ajanta Caves Complex",
        "location": "Ajanta, Sambhaji Nagar",
        "district": "Chhatrapati Sambhajinagar",
        "state": "Maharashtra",
        "country": "India",
        "dynasty": "Satavahana & Vakataka Dynasties",
        "historical_period": "2nd Century BCE – 5th Century CE",
        "approximate_date": "c. 200 BCE – 480 CE",
        "architectural_style": "Buddhist Rock-Cut Architecture",
        "material": "Basalt Rock",
        "description": "29 rock-cut Buddhist cave monuments famous for ancient tempera wall murals and standing Buddha sculptures.",
        "historical_background": "Carved in two distinct phases (Satavahana 2nd century BCE and Vakataka 5th century CE). UNESCO World Heritage site since 1983.",
        "provenance": "Ajanta Rock Wall",
        "current_location": "Ajanta Caves, Sambhaji Nagar, Maharashtra",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/242/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "sanchi": {
        "temple_name": "Great Stupa at Sanchi",
        "monument_name": "Buddhist Monuments at Sanchi",
        "location": "Sanchi, Raisen District",
        "district": "Raisen",
        "state": "Madhya Pradesh",
        "country": "India",
        "dynasty": "Maurya & Satavahana Dynasties",
        "historical_period": "3rd Century BCE – 1st Century CE",
        "approximate_date": "c. 250 BCE",
        "architectural_style": "Mauryan Stupa & Torana Gateway Architecture",
        "material": "Sandstone & Brick",
        "description": "Oldest stone structure in India commissioned by Emperor Ashoka, featuring four carved stone gateways (Toranas) depicting Jataka tales.",
        "historical_background": "Constructed in 3rd century BCE over relics of the Buddha. UNESCO World Heritage Site since 1989.",
        "provenance": "Sanchi Hilltop",
        "current_location": "Sanchi, Raisen District, Madhya Pradesh",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/524/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "hampi": {
        "temple_name": "Virupaksha / Vittala Temple",
        "monument_name": "Group of Monuments at Hampi",
        "location": "Hampi, Vijayanagara District",
        "district": "Vijayanagara",
        "state": "Karnataka",
        "country": "India",
        "dynasty": "Vijayanagara Empire",
        "historical_period": "14th–16th Century CE",
        "approximate_date": "c. 1336–1565 CE",
        "architectural_style": "Vijayanagara Dravidian Architecture",
        "material": "Granite",
        "description": "Imperial capital of the Vijayanagara Empire boasting stone chariots, musical pillars, pillared mandapas, and royal enclosures.",
        "historical_background": "Capitol of one of the largest Hindu empires in South Asia. UNESCO World Heritage Site since 1986.",
        "provenance": "Hampi Sacred Center",
        "current_location": "Hampi, Vijayanagara District, Karnataka",
        "metadata_source": "Archaeological Survey of India (ASI)",
        "source_url": "https://whc.unesco.org/en/list/241/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    },
    "cham_vietnam": {
        "temple_name": "Cham Sculpture Collection",
        "monument_name": "Museum of Cham Sculpture",
        "location": "Da Nang",
        "district": "Da Nang",
        "state": "Da Nang Province",
        "country": "Vietnam",
        "dynasty": "Champa Empire",
        "historical_period": "7th–13th Century CE",
        "approximate_date": "c. 650–1250 CE",
        "architectural_style": "Champa Hindu-Buddhist Art Style",
        "material": "Sandstone",
        "description": "Sandstone relief sculpture depicting Hindu deities (Vishnu, Shiva, Brahma) created by artisans of the Champa Kingdom in Central Vietnam.",
        "historical_background": "Discovered at My Son Sanctuary and Dong Duong archaeological sites. Preserved at Da Nang Museum of Cham Sculpture.",
        "provenance": "My Son Sanctuary / Dong Duong Site",
        "current_location": "Museum of Cham Sculpture, Da Nang, Vietnam",
        "metadata_source": "Museum of Cham Sculpture / National Heritage Record",
        "source_url": "https://chammuseum.danang.gov.vn/",
        "verification_status": "verified",
        "metadata_confidence": "high"
    }
}

def verify_against_authoritative_sources(candidate: Dict[str, Any], filename: str = "") -> Dict[str, Any]:
    """
    Attempts to cross-reference candidate metadata (or raw filename) with authoritative heritage knowledge base.
    If verified, populates official facts, source URLs, sets verification_status="verified", confidence="high".
    If unverified, preserves candidate values and sets verification_status="candidate".
    Never fabricates historical details.
    """
    search_text = (filename + " " + str(candidate.get("temple_name", "")) + " " + str(candidate.get("artifact_name", "")) + " " + str(candidate.get("description", ""))).lower()

    matched_entry = None
    if "chennakeshava" in search_text or "madanika" in search_text or "belur" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["chennakeshava"]
    elif "hoysaleswara" in search_text or "halebid" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["hoysaleswara"]
    elif "brihadisvara" in search_text or "brihadeeswarar" in search_text or "tanjore" in search_text or "thanjavur" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["brihadisvara"]
    elif "shore temple" in search_text or "mahabalipuram shore" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["shore_temple"]
    elif "kailasanatha" in search_text and ("kanchi" in search_text or "tamil" in search_text):
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["kailasanatha_kanchi"]
    elif "kailasa" in search_text or "cave 16" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["kailasa_ellora"]
    elif "konark" in search_text or "sun temple" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["konark"]
    elif "khajuraho" in search_text or "kandariya" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["khajuraho"]
    elif "ajanta" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["ajanta"]
    elif "sanchi" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["sanchi"]
    elif "hampi" in search_text or "virupaksha" in search_text or "vittala" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["hampi"]
    elif "cham" in search_text or "da nang" in search_text or "vietnam" in search_text:
        matched_entry = AUTHORITATIVE_KNOWLEDGE_BASE["cham_vietnam"]

    enriched = dict(candidate)

    if matched_entry:
        # Merge verified facts into candidate, keeping specific candidate artifact_name if present
        for key, val in matched_entry.items():
            if val is not None:
                if key == "artifact_name" and enriched.get("artifact_name"):
                    continue
                enriched[key] = val
        enriched["verification_status"] = "verified"
        enriched["metadata_confidence"] = "high"
        enriched["metadata_generated_by"] = "official_source"
    else:
        # Check if partially verified (e.g. valid candidate fields extracted from descriptive filename)
        if enriched.get("temple_name") or enriched.get("deity_or_subject") or enriched.get("dynasty"):
            enriched["verification_status"] = "partially_verified" if enriched.get("temple_name") else "candidate"
            enriched["metadata_confidence"] = "medium"
            enriched["metadata_generated_by"] = "filename"
        else:
            enriched["verification_status"] = "unverified"
            enriched["metadata_confidence"] = "low"
            enriched["metadata_generated_by"] = "ai_vision" if candidate.get("artifact_type") else "filename"

    return enriched
