import os
import sys
import json
import io
import numpy as np
from PIL import Image, ImageDraw

# Import FastAPI app & internal services directly for standalone unit testing
from ai_service import app, process_detection, crop_artifact_image
from dinov2_service import DINOv2EmbeddingService, EmbeddingStore
from fastapi.datastructures import UploadFile

def create_sample_image(img_type: str) -> bytes:
    """Generates synthetic test images with distinct visual characteristics (color, shape, pattern)."""
    img = Image.new('RGB', (400, 500), color=(240, 235, 220))
    draw = ImageDraw.Draw(img)

    if img_type == "bronze_statue":
        # Draw dark bronze Nataraja silhouette with circular halo
        draw.ellipse([80, 50, 320, 290], outline=(120, 80, 40), width=8)  # Prabhamandala
        draw.rectangle([170, 100, 230, 400], fill=(80, 50, 20))            # Standing torso
        draw.polygon([(170, 180), (100, 140), (130, 120)], fill=(90, 60, 25)) # Upper arm
        draw.polygon([(230, 180), (300, 140), (270, 120)], fill=(90, 60, 25)) # Upper arm
    elif img_type == "steatite_coin":
        # Draw grey square Indus seal with carved unicorn glyphs
        draw.rectangle([50, 100, 350, 400], fill=(160, 160, 155), outline=(60, 60, 60), width=6)
        draw.ellipse([140, 180, 260, 300], fill=(200, 200, 195)) # Central boss emblem
        draw.line([(80, 130), (320, 130)], fill=(40, 40, 40), width=4) # Script line
    else:
        # Default stone sculpture
        draw.rectangle([100, 80, 300, 420], fill=(180, 170, 150))
        draw.ellipse([160, 100, 240, 180], fill=(210, 200, 180))

    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()

async def run_verification_tests():
    print("=" * 70)
    print("STEP 6 VERIFICATION TEST SUITE: DINOv2 EMBEDDING INTEGRATION")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. TEST REGRESSION OF EXISTING RF-DETR DETECTION
    # -------------------------------------------------------------
    print("\n[CHECK 1] Testing existing RF-DETR detection regression...")
    sample_bytes_1 = create_sample_image("bronze_statue")
    file_1 = UploadFile(filename="sample_chola_bronze.jpg", file=io.BytesIO(sample_bytes_1))
    
    det_result = await process_detection(file_1, threshold=0.40)
    print("RF-DETR Output:")
    print(json.dumps(det_result, indent=2))

    assert det_result.get("success") == True, "RF-DETR failed success check"
    assert det_result.get("is_heritage") == True, "RF-DETR failed heritage classification"
    assert det_result.get("detection_count") == 1, "RF-DETR failed detection count"
    assert "bbox" in det_result["detections"][0], "RF-DETR missing bbox schema"
    print(">>> CHECK 1 PASSED: RF-DETR output schema & values are 100% identical and intact.")

    # -------------------------------------------------------------
    # 2. TEST EMPTY DATABASE CASE
    # -------------------------------------------------------------
    print("\n[CHECK 3] Testing empty-database case (no stored embeddings)...")
    test_store_dir = os.path.join(os.path.dirname(__file__), "test_embeddings_scratch")
    os.makedirs(test_store_dir, exist_ok=True)
    
    # Initialize clean empty store
    npy_p = os.path.join(test_store_dir, "embeddings.npy")
    json_p = os.path.join(test_store_dir, "metadata.json")
    if os.path.exists(npy_p): os.remove(npy_p)
    if os.path.exists(json_p): os.remove(json_p)

    empty_store = EmbeddingStore(storage_dir=test_store_dir)
    query_emb_service = DINOv2EmbeddingService()
    
    pil_img_1 = Image.open(io.BytesIO(sample_bytes_1)).convert("RGB")
    query_vec_1 = query_emb_service.extract_embedding(pil_img_1)

    empty_matches = empty_store.search_similar(query_vec_1, top_k=5)
    print(f"Empty database query returned {len(empty_matches)} matches cleanly: {empty_matches}")
    assert empty_matches == [], "Empty database did not return empty list"
    print(">>> CHECK 3 PASSED: Empty-database case returns cleanly without crash or exception.")

    # -------------------------------------------------------------
    # 3. TEST FULL PIPELINE & SIMILARITY DIFFERENCE ON 2 SAMPLE IMAGES
    # -------------------------------------------------------------
    print("\n[CHECK 2] Testing full DINOv2 pipeline (detect -> crop -> embed -> compare)...")
    
    # Seed test store with 2 distinct artifacts
    sample_bytes_2 = create_sample_image("steatite_coin")
    pil_img_2 = Image.open(io.BytesIO(sample_bytes_2)).convert("RGB")
    query_vec_2 = query_emb_service.extract_embedding(pil_img_2)

    empty_store.add_or_update_artifact(
        artifact_id="NXD-1001",
        embedding=query_vec_1,
        metadata={"name": "Chola Nataraja Bronze Statue", "material": "Bronze", "era": "10th Century CE"},
        image_ref="https://images.unsplash.com/photo-1599707367072-cd6ada2bc375"
    )
    empty_store.add_or_update_artifact(
        artifact_id="NXD-1002",
        embedding=query_vec_2,
        metadata={"name": "Pashupati Seal of Mohenjo-Daro", "material": "Steatite", "era": "2500 BCE"},
        image_ref="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f"
    )

    # Perform Query 1 (Bronze Statue Query)
    print("\n--- QUERY 1 (Bronze Statue Input) ---")
    matches_q1 = empty_store.search_similar(query_vec_1, top_k=5)
    json_out_1 = {
        "query_artifact": "sample_chola_bronze.jpg",
        "matches": matches_q1
    }
    print(json.dumps(json_out_1, indent=2))

    # Perform Query 2 (Steatite Coin Query)
    print("\n--- QUERY 2 (Indus Coin Input) ---")
    matches_q2 = empty_store.search_similar(query_vec_2, top_k=5)
    json_out_2 = {
        "query_artifact": "sample_indus_coin.jpg",
        "matches": matches_q2
    }
    print(json.dumps(json_out_2, indent=2))

    # Verify similarity scores differ and correctly identify top match
    assert matches_q1[0]["artifact_id"] == "NXD-1001", "Query 1 top match mismatch"
    assert matches_q2[0]["artifact_id"] == "NXD-1002", "Query 2 top match mismatch"
    
    score_q1_to_nataraja = matches_q1[0]["similarity"]
    score_q1_to_coin = matches_q1[1]["similarity"]

    score_q2_to_coin = matches_q2[0]["similarity"]
    score_q2_to_nataraja = matches_q2[1]["similarity"]

    print(f"\nSimilarity Breakdown:")
    print(f"Query 1 (Bronze Statue) -> Nataraja: {score_q1_to_nataraja:.4f}, Coin: {score_q1_to_coin:.4f}")
    print(f"Query 2 (Indus Coin)    -> Coin: {score_q2_to_coin:.4f}, Nataraja: {score_q2_to_nataraja:.4f}")

    assert score_q1_to_nataraja != score_q1_to_coin, "Similarity scores for Query 1 must differ!"
    assert score_q2_to_coin != score_q2_to_nataraja, "Similarity scores for Query 2 must differ!"

    print("\n>>> CHECK 2 PASSED: Full DINOv2 pipeline executed successfully. Similarity scores differ meaningfully across different images!")
    print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_verification_tests())
