# NexData Indian Artifact Pose Detection API (RF-DETR & Roboflow Integration)

FastAPI microservice for detecting Indian heritage artifact statues, posture (sitting vs standing), and antiquities using fine-tuned **RF-DETR** via Roboflow Hosted Inference API or local PyTorch model weights.

## Model Details
- **Model URL / ID**: `nivetha-l/indian-heritage-artifact-detecti-5a1pz-3-rfdetr-small-t1`
- **Supported Classes**: `sitting`, `standing` (and customizable heritage artifact classes)

---

## Setup & Installation

### 1. Install Dependencies
```bash
cd ai_microservice
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your Roboflow API key:
```env
ROBOFLOW_API_KEY=your_actual_roboflow_api_key
ROBOFLOW_MODEL_ID=nivetha-l/indian-heritage-artifact-detecti-5a1pz-3-rfdetr-small-t1
ROBOFLOW_CONFIDENCE_THRESHOLD=0.40
```

---

## Running the Microservice
```bash
python ai_service.py
# Server runs on http://localhost:8000
```

---

## Endpoints

### 1. Health Check
`GET /health`

**Response:**
```json
{
  "status": "online",
  "service": "RF-DETR Artifact Detector Microservice",
  "roboflow_integration": {
    "enabled": true,
    "model_id": "nivetha-l/indian-heritage-artifact-detecti-5a1pz-3-rfdetr-small-t1",
    "api_key_configured": true
  },
  "endpoints": ["/predict", "/detect", "/health"]
}
```

### 2. Roboflow RF-DETR Artifact Prediction
`POST /predict` (also `POST /detect`)

**Parameters:**
- `file` or `image` (Multipart Form Data): The uploaded artifact image file (`.jpg`, `.png`, `.webp`)
- `threshold` (Query Parameter, optional, default `0.40`): Confidence cutoff threshold between 0.05 and 0.95

**Response:**
```json
{
  "success": true,
  "mode": "Roboflow RF-DETR Model (nivetha-l/indian-heritage-artifact-detecti-5a1pz-3-rfdetr-small-t1)",
  "model_id": "nivetha-l/indian-heritage-artifact-detecti-5a1pz-3-rfdetr-small-t1",
  "image_dimensions": {
    "width": 800,
    "height": 600
  },
  "detection_count": 1,
  "detections": [
    {
      "class": "sitting",
      "class_name": "sitting",
      "confidence": 0.945,
      "class_id": 0,
      "bbox": {
        "x": 400.0,
        "y": 300.0,
        "width": 200.0,
        "height": 300.0,
        "x1": 300.0,
        "y1": 150.0,
        "x2": 500.0,
        "y2": 450.0
      }
    }
  ]
}
```
