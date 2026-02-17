"""
Production virtual try-on pipeline with SCHP mask logic and model adapter.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
import subprocess

import cv2
import numpy as np
from PIL import Image

from mask_utils import (
    TryonMasks,
    build_agnostic_person,
    build_face_protected_output,
    extract_tryon_masks,
    preprocess_garment_mask,
    validate_output_constraints,
)
from vton_adapter import VtonInputPaths, build_vton_adapter


class ProductionTryonPipeline:
    """
    Implements a correct virtual try-on preprocessing + synthesis flow.

    Required external components:
    - SCHP parser callable
    - Pose estimator callable
    - VTON backend command (IDM-VTON/CatVTON)
    """

    def __init__(self):
        self.schp_command_template = os.getenv("SCHP_LABELMAP_COMMAND_TEMPLATE", "").strip()
        self.pose_command_template = os.getenv("POSE_MAP_COMMAND_TEMPLATE", "").strip()
        if not self.schp_command_template:
            raise RuntimeError("SCHP_LABELMAP_COMMAND_TEMPLATE is required in production mode")
        if not self.pose_command_template:
            raise RuntimeError("POSE_MAP_COMMAND_TEMPLATE is required in production mode")
        self.vton_adapter = build_vton_adapter(strict=True)
        print("[PRODUCTION] SCHP + pose + VTON pipeline initialized")

    def _load_original_rgb(self, path: str) -> np.ndarray:
        return np.array(Image.open(path).convert("RGB"))

    def _load_rgb(self, path: str, size: tuple[int, int] = (768, 1024)) -> np.ndarray:
        img = Image.open(path).convert("RGB").resize(size, Image.Resampling.LANCZOS)
        return np.array(img)

    def _save_rgb(self, image: np.ndarray, path: str):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(image).save(path)

    def _save_mask(self, mask: np.ndarray, path: str):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray((mask * 255).astype(np.uint8)).save(path)

    def _run_schp(self, person_rgb: np.ndarray) -> np.ndarray:
        """
        Run SCHP parser.

        Expects SCHP parser script/endpoint configured via env:
        - SCHP_LABELMAP_COMMAND_TEMPLATE

        Template placeholders:
        - {person_image}
        - {output_labelmap}
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            person_path = str(Path(temp_dir) / "person.png")
            labelmap_path = str(Path(temp_dir) / "labels.png")
            self._save_rgb(person_rgb, person_path)

            command = self.schp_command_template.format(person_image=person_path, output_labelmap=labelmap_path)
            result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
            if result.returncode != 0 or not Path(labelmap_path).exists():
                raise RuntimeError(
                    "SCHP parsing command failed. "
                    f"exit={result.returncode} stdout={result.stdout} stderr={result.stderr}"
                )

            labels = np.array(Image.open(labelmap_path))
            if labels.ndim == 3:
                labels = labels[:, :, 0]
            return labels.astype(np.uint8)

    def _run_pose(self, person_rgb: np.ndarray) -> np.ndarray:
        """
        Run pose estimator command.

        Expects env:
        - POSE_MAP_COMMAND_TEMPLATE

        Template placeholders:
        - {person_image}
        - {output_pose}
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            person_path = str(Path(temp_dir) / "person.png")
            pose_path = str(Path(temp_dir) / "pose.png")
            self._save_rgb(person_rgb, person_path)

            command = self.pose_command_template.format(person_image=person_path, output_pose=pose_path)
            result = subprocess.run(command, shell=True, capture_output=True, text=True, check=False)
            if result.returncode != 0 or not Path(pose_path).exists():
                raise RuntimeError(
                    "Pose command failed. "
                    f"exit={result.returncode} stdout={result.stdout} stderr={result.stderr}"
                )

            pose = np.array(Image.open(pose_path).convert("L"))
            return (pose > 0).astype(np.uint8)

    def run(self, person_image_path: str, garment_image_path: str, output_path: str) -> str:
        if not Path(person_image_path).exists():
            raise RuntimeError(f"Person image missing: {person_image_path}")
        if not Path(garment_image_path).exists():
            raise RuntimeError(f"Garment image missing: {garment_image_path}")

        person_original_rgb = self._load_original_rgb(person_image_path)
        original_h, original_w = person_original_rgb.shape[:2]
        person_rgb = self._load_rgb(person_image_path)
        garment_rgb = self._load_rgb(garment_image_path)

        schp_labels = self._run_schp(person_rgb)
        masks: TryonMasks = extract_tryon_masks(schp_labels)

        agnostic_person = build_agnostic_person(person_rgb, masks)
        cloth_mask = preprocess_garment_mask(garment_rgb)
        pose_mask = self._run_pose(person_rgb)

        with tempfile.TemporaryDirectory() as temp_dir:
            agnostic_path = str(Path(temp_dir) / "agnostic.png")
            garment_path = str(Path(temp_dir) / "garment.png")
            cloth_mask_path = str(Path(temp_dir) / "cloth_mask.png")
            pose_path = str(Path(temp_dir) / "pose.png")
            edit_mask_path = str(Path(temp_dir) / "edit_mask.png")
            generated_path = str(Path(temp_dir) / "generated.png")

            self._save_rgb(agnostic_person, agnostic_path)
            self._save_rgb(garment_rgb, garment_path)
            self._save_mask(cloth_mask, cloth_mask_path)
            self._save_mask(pose_mask, pose_path)
            self._save_mask(masks.editable, edit_mask_path)

            self.vton_adapter.generate(
                VtonInputPaths(
                    person_agnostic=agnostic_path,
                    garment_image=garment_path,
                    garment_mask=cloth_mask_path,
                    pose_map=pose_path,
                    edit_mask=edit_mask_path,
                    output_path=generated_path,
                )
            )

            if not Path(generated_path).exists():
                raise RuntimeError(f"VTON did not create output image: {generated_path}")

            generated_rgb = np.array(Image.open(generated_path).convert("RGB").resize((768, 1024)))
            safe_output = build_face_protected_output(person_rgb, generated_rgb, masks)
            validate_output_constraints(person_rgb, safe_output, masks)

            output_rgb = np.array(
                Image.fromarray(safe_output).resize((original_w, original_h), Image.Resampling.LANCZOS)
            )
            face_hair_full = np.array(
                Image.fromarray((masks.face_hair * 255).astype(np.uint8)).resize(
                    (original_w, original_h), Image.Resampling.NEAREST
                )
            ) > 0
            output_rgb[face_hair_full] = person_original_rgb[face_hair_full]

            if output_rgb.shape != person_original_rgb.shape:
                raise ValueError(
                    f"Output shape mismatch: expected {person_original_rgb.shape}, got {output_rgb.shape}"
                )
            if np.any(face_hair_full):
                if not np.array_equal(output_rgb[face_hair_full], person_original_rgb[face_hair_full]):
                    raise ValueError("Face/hair protection validation failed at original resolution")

            self._save_rgb(output_rgb, output_path)

        if not Path(output_path).exists():
            raise RuntimeError(f"Final output image missing: {output_path}")
        return output_path
