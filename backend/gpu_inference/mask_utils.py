"""
Mask utilities for SCHP-driven virtual try-on preprocessing.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

import cv2
import numpy as np


# LIP/SCHP label ids (commonly used mapping)
LIP_LABELS = {
    "background": 0,
    "hat": 1,
    "hair": 2,
    "glove": 3,
    "sunglasses": 4,
    "upper_clothes": 5,
    "dress": 6,
    "coat": 7,
    "socks": 8,
    "pants": 9,
    "jumpsuits": 10,
    "scarf": 11,
    "skirt": 12,
    "face": 13,
    "left_arm": 14,
    "right_arm": 15,
    "left_leg": 16,
    "right_leg": 17,
    "left_shoe": 18,
    "right_shoe": 19,
}


@dataclass
class TryonMasks:
    face: np.ndarray
    hair: np.ndarray
    face_hair: np.ndarray
    arms: np.ndarray
    torso: np.ndarray
    protect: np.ndarray
    editable: np.ndarray


def _labels_to_mask(label_map: np.ndarray, label_ids: list[int]) -> np.ndarray:
    mask = np.isin(label_map, label_ids).astype(np.uint8)
    return mask


def extract_tryon_masks(label_map: np.ndarray) -> TryonMasks:
    """
    Build explicit masks from SCHP label map.

    Returns binary masks in {0,1}.
    """
    face = _labels_to_mask(label_map, [LIP_LABELS["face"], LIP_LABELS["sunglasses"]])
    hair = _labels_to_mask(label_map, [LIP_LABELS["hair"], LIP_LABELS["hat"]])
    face_hair = np.clip(face + hair, 0, 1).astype(np.uint8)
    arms = _labels_to_mask(label_map, [LIP_LABELS["left_arm"], LIP_LABELS["right_arm"], LIP_LABELS["glove"]])
    torso = _labels_to_mask(
        label_map,
        [
            LIP_LABELS["upper_clothes"],
            LIP_LABELS["dress"],
            LIP_LABELS["coat"],
            LIP_LABELS["scarf"],
            LIP_LABELS["jumpsuits"],
        ],
    )

    protect = np.clip(face + hair + arms, 0, 1)
    protect = cv2.dilate(protect, np.ones((9, 9), np.uint8), iterations=1)

    editable = (torso & (1 - protect)).astype(np.uint8)
    editable = cv2.morphologyEx(editable, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8), iterations=1)

    return TryonMasks(
        face=face,
        hair=hair,
        face_hair=face_hair,
        arms=arms,
        torso=torso,
        protect=protect,
        editable=editable,
    )


def build_agnostic_person(person_rgb: np.ndarray, masks: TryonMasks) -> np.ndarray:
    """
    Remove original upper clothing while preserving face/hair/arms.
    """
    image = person_rgb.copy()
    remove_region = masks.editable.astype(np.uint8)

    if remove_region.sum() == 0:
        return image

    inpaint_mask = (remove_region * 255).astype(np.uint8)
    agnostic = cv2.inpaint(image, inpaint_mask, 5, cv2.INPAINT_TELEA)

    # Preserve protected identity areas from original image.
    protect_3c = np.repeat(masks.protect[:, :, None], 3, axis=2)
    agnostic = np.where(protect_3c == 1, person_rgb, agnostic)

    return agnostic


def build_face_protected_output(original_rgb: np.ndarray, generated_rgb: np.ndarray, masks: TryonMasks) -> np.ndarray:
    """
    Hard-guard compositing to prevent face/hair/arms corruption.
    """
    protect_3c = np.repeat(masks.face_hair[:, :, None], 3, axis=2)
    return np.where(protect_3c == 1, original_rgb, generated_rgb)


def validate_output_constraints(original_rgb: np.ndarray, generated_rgb: np.ndarray, masks: TryonMasks) -> None:
    if original_rgb.shape != generated_rgb.shape:
        raise ValueError(
            f"Output shape mismatch: original={original_rgb.shape}, generated={generated_rgb.shape}"
        )

    face_hair = masks.face_hair.astype(bool)
    if np.any(face_hair):
        original_face = original_rgb[face_hair]
        generated_face = generated_rgb[face_hair]
        if not np.array_equal(original_face, generated_face):
            raise ValueError("Face/hair protection validation failed: protected pixels were modified")


def preprocess_garment_mask(garment_rgb: np.ndarray) -> np.ndarray:
    """
    Build a binary cloth mask from garment RGB image.
    Near-white studio background gets removed.
    """
    hsv = cv2.cvtColor(garment_rgb, cv2.COLOR_RGB2HSV)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]

    # Keep non-background: either saturated pixels or not extremely bright.
    sat_mask = (saturation > 18).astype(np.uint8)
    dark_mask = (value < 245).astype(np.uint8)
    cloth = np.clip(sat_mask + dark_mask, 0, 1).astype(np.uint8)

    cloth = cv2.morphologyEx(cloth, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8), iterations=1)
    cloth = cv2.morphologyEx(cloth, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8), iterations=1)

    return cloth
