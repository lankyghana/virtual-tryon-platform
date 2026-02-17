"""
Local development try-on generator.

This is a lightweight, dependency-minimal fallback that places the garment
on the upper body region so local development behaves like a try-on flow
without requiring GPU diffusion models.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance, ImageChops


class LocalTryonService:
    """Simple image-based virtual try-on for local development."""

    @staticmethod
    def _extract_garment_alpha(garment: Image.Image) -> Image.Image:
        """
        Build an alpha mask from non-background garment pixels.
        Treat very bright/low-saturation pixels as background.
        """
        rgba = garment.convert("RGBA")
        hsv = rgba.convert("HSV")
        h, s, v = hsv.split()

        # Keep colorful or darker pixels; remove near-white studio backgrounds.
        color_mask = s.point(lambda px: 255 if px > 18 else 0)
        dark_mask = v.point(lambda px: 255 if px < 245 else 0)
        alpha = ImageChops.lighter(color_mask, dark_mask).filter(ImageFilter.GaussianBlur(1.2))

        rgba.putalpha(alpha)
        return rgba

    @staticmethod
    def _torso_box(width: int, height: int) -> tuple[int, int, int, int]:
        """Heuristic torso region in portrait photos."""
        left = int(width * 0.24)
        right = int(width * 0.76)
        # Keep shirt placement safely below face for selfie/portrait framing.
        top = int(height * 0.40)
        bottom = int(height * 0.88)
        return left, top, right, bottom

    @staticmethod
    def _face_mask(width: int, height: int) -> Image.Image:
        mask = Image.new("L", (width, height), 0)
        ellipse_box = (
            int(width * 0.30),
            int(height * 0.06),
            int(width * 0.70),
            int(height * 0.44),
        )
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.ellipse(ellipse_box, fill=255)
        return mask.filter(ImageFilter.GaussianBlur(3))

    @staticmethod
    def _hair_mask(width: int, height: int) -> Image.Image:
        mask = Image.new("L", (width, height), 0)
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.rectangle((int(width * 0.20), 0, int(width * 0.80), int(height * 0.22)), fill=255)
        return mask.filter(ImageFilter.GaussianBlur(3))

    @staticmethod
    def generate(person_image_path: str, garment_image_path: str, output_path: str) -> str:
        """Generate a local try-on output image and save it to output_path."""
        person = Image.open(person_image_path).convert("RGB")
        garment = Image.open(garment_image_path).convert("RGB")

        # Normalize person size for stable placement, then back to original resolution.
        original_size = person.size
        person_work = person.resize((768, 1024), Image.Resampling.LANCZOS)
        garment_work = garment.resize((720, 960), Image.Resampling.LANCZOS)

        garment_rgba = LocalTryonService._extract_garment_alpha(garment_work)

        # Slight garment enhancement to avoid washed-out appearance.
        garment_rgba = ImageEnhance.Contrast(garment_rgba).enhance(1.08)
        garment_rgba = ImageEnhance.Color(garment_rgba).enhance(1.05)

        canvas = person_work.convert("RGBA")
        w, h = canvas.size
        left, top, right, bottom = LocalTryonService._torso_box(w, h)
        torso_w = right - left
        torso_h = bottom - top

        target_w = int(torso_w * 1.02)
        target_h = int(torso_h * 0.92)
        garment_fit = garment_rgba.resize((target_w, target_h), Image.Resampling.LANCZOS)

        # Mild perspective squeeze for more natural shoulder/waist silhouette.
        warped = garment_fit.transform(
            garment_fit.size,
            Image.Transform.QUAD,
            (
                target_w * 0.12, 0,
                target_w * 0.88, 0,
                target_w * 0.96, target_h,
                target_w * 0.04, target_h,
            ),
            resample=Image.Resampling.BICUBIC,
        )

        paste_x = left - int((target_w - torso_w) * 0.5)
        paste_y = top

        # Composite garment on person.
        canvas.alpha_composite(warped, (paste_x, paste_y))

        # Soft blend to reduce hard boundaries.
        blended_rgba = Image.blend(person_work.convert("RGBA"), canvas, alpha=0.75)

        face_mask = LocalTryonService._face_mask(*person_work.size)
        hair_mask = LocalTryonService._hair_mask(*person_work.size)
        protect = ImageChops.lighter(face_mask, hair_mask)

        blended_rgb = blended_rgba.convert("RGB")
        original_rgb = person_work.convert("RGB")
        blended_rgb.paste(original_rgb, mask=protect)

        black = Image.new("RGB", blended_rgb.size, (0, 0, 0))
        protected_generated = Image.composite(blended_rgb, black, protect)
        protected_original = Image.composite(original_rgb, black, protect)
        if protected_generated.tobytes() != protected_original.tobytes():
            raise ValueError("Local mode face/hair protection validation failed")

        final_image = blended_rgb.resize(original_size, Image.Resampling.LANCZOS)

        if final_image.size != original_size:
            raise ValueError(f"Output size mismatch: expected {original_size}, got {final_image.size}")

        out_path = Path(output_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        final_image.save(out_path, format="JPEG", quality=95)

        return str(out_path)

