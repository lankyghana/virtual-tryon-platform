"""
Adapters for real virtual try-on synthesis backends.

This module is designed for production integration with open-source VTON models
such as IDM-VTON or CatVTON.
"""
from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class VtonInputPaths:
    person_agnostic: str
    garment_image: str
    garment_mask: str
    pose_map: str
    edit_mask: str
    output_path: str


class BaseVtonAdapter:
    def generate(self, data: VtonInputPaths) -> str:
        raise NotImplementedError


class CommandVtonAdapter(BaseVtonAdapter):
    """
    Generic command-based adapter.

    Use this for IDM-VTON/CatVTON by setting env vars:
    - VTON_COMMAND_TEMPLATE
      Example:
      python inference.py --person {person_agnostic} --cloth {garment_image}
        --cloth_mask {garment_mask} --pose {pose_map} --edit_mask {edit_mask}
        --output {output_path}
    - VTON_WORKDIR (optional)
    """

    def __init__(self, command_template: str, workdir: str | None = None):
        self.command_template = command_template
        self.workdir = workdir

    def generate(self, data: VtonInputPaths) -> str:
        required_inputs = {
            "person_agnostic": data.person_agnostic,
            "garment_image": data.garment_image,
            "garment_mask": data.garment_mask,
            "pose_map": data.pose_map,
            "edit_mask": data.edit_mask,
        }
        for key, path in required_inputs.items():
            input_path = Path(path)
            if not input_path.exists():
                raise RuntimeError(f"VTON required input is missing: {key}={path}")
            if input_path.is_file() and input_path.stat().st_size == 0:
                raise RuntimeError(f"VTON required input is empty: {key}={path}")

        command = self.command_template.format(
            person_agnostic=data.person_agnostic,
            garment_image=data.garment_image,
            garment_mask=data.garment_mask,
            pose_map=data.pose_map,
            edit_mask=data.edit_mask,
            output_path=data.output_path,
        )

        result = subprocess.run(
            command,
            shell=True,
            cwd=self.workdir,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.returncode != 0:
            raise RuntimeError(
                "VTON command failed. "
                f"exit={result.returncode}\nstdout={result.stdout}\nstderr={result.stderr}"
            )

        if not Path(data.output_path).exists():
            raise RuntimeError(f"VTON output was not created: {data.output_path}")

        return data.output_path


def build_vton_adapter(strict: bool = False) -> BaseVtonAdapter:
    command_template = os.getenv("VTON_COMMAND_TEMPLATE", "").strip()
    workdir = os.getenv("VTON_WORKDIR", "").strip() or None

    if not command_template:
        raise RuntimeError(
            "VTON_COMMAND_TEMPLATE is not configured. "
            "Production mode requires an explicit VTON command."
        )

    if workdir is not None and not Path(workdir).exists():
        raise RuntimeError(f"VTON_WORKDIR does not exist: {workdir}")

    return CommandVtonAdapter(command_template=command_template, workdir=workdir)
