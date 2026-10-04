"""
RF-DETR Training Script for Indian Heritage Artifact Detection
Detecting Sitting vs Standing Statues (395 images, 2 classes)
"""
import os
import sys
import argparse

def train_artifact_model(api_key=None, workspace=None, project_name=None, version_number=1, dataset_dir=None, epochs=60, batch_size=8, lr=1e-4):
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Step 1: Obtain Dataset Location
    if dataset_dir and os.path.exists(dataset_dir):
        print(f"--- Using Local COCO Dataset at: {dataset_dir} ---")
        dataset_path = os.path.abspath(dataset_dir)
    elif api_key and workspace and project_name:
        print("--- Step 1: Downloading Dataset from Roboflow ---")
        try:
            from roboflow import Roboflow
            rf = Roboflow(api_key=api_key)
            project = rf.workspace(workspace).project(project_name)
            version = project.version(version_number)
            dataset = version.download("coco")
            dataset_path = dataset.location
            print(f"[OK] Dataset downloaded to: {dataset_path}")
        except Exception as e:
            print(f"[ERROR] Roboflow download error: {e}")
            sys.exit(1)
    else:
        print("[ERROR] Error: You must specify either --dataset-dir OR (--api-key, --workspace, and --project).")
        sys.exit(1)

    # Step 2: Initialize RF-DETR
    print("--- Step 2: Initializing RF-DETR Small ---")
    try:
        from rfdetr import RFDETRSmall
    except ImportError:
        print("[ERROR] Error: 'rfdetr' package is not installed. Run: pip install 'rfdetr[train]'")
        sys.exit(1)

    model = RFDETRSmall()

    output_dir = os.path.join(script_dir, "weights_run")
    target_weights_dir = os.path.join(script_dir, "weights")
    target_ckpt = os.path.join(target_weights_dir, "best.ckpt")

    # Step 3: Train Model
    print(f"--- Step 3: Training RF-DETR Model ({epochs} Epochs, Batch Size {batch_size}) ---")
    try:
        model.train(
            dataset_dir=dataset_path,
            epochs=epochs,
            batch_size=batch_size,
            lr=lr,
            grad_accum_steps=2,
            img_size=640,
            output_dir=output_dir
        )
    except Exception as e:
        print(f"[ERROR] Training error: {e}")
        sys.exit(1)

    # Step 4: Save Checkpoint
    best_ckpt = os.path.join(output_dir, "checkpoints", "best.ckpt")
    if os.path.exists(best_ckpt):
        import shutil
        os.makedirs(target_weights_dir, exist_ok=True)
        shutil.copy(best_ckpt, target_ckpt)
        print(f"[OK] Successfully saved best model checkpoint to: {target_ckpt}")
    else:
        print(f"[WARNING] Training completed, but best.ckpt not found at {best_ckpt}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train RF-DETR on Indian Artifact Dataset")
    parser.add_argument("--dataset-dir", default=None, help="Path to local COCO dataset directory (e.g. ./Indian-Artifacts-1)")
    parser.add_argument("--api-key", default=None, help="Roboflow API Key")
    parser.add_argument("--workspace", default=None, help="Roboflow Workspace ID")
    parser.add_argument("--project", default=None, help="Roboflow Project ID")
    parser.add_argument("--version", type=int, default=1, help="Roboflow Dataset Version")
    parser.add_argument("--epochs", type=int, default=60, help="Training Epochs (Default: 60)")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch Size (Default: 8)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning Rate (Default: 0.0001)")

    args = parser.parse_args()
    train_artifact_model(
        dataset_dir=args.dataset_dir,
        api_key=args.api_key,
        workspace=args.workspace,
        project_name=args.project,
        version_number=args.version,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr
    )
