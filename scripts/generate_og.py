# -*- coding: utf-8 -*-
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og.jpg"
FONT_DIR = ROOT / "public" / "fonts" / "fontshare"
CLASH = FONT_DIR / "clash-display" / "otf" / "ClashDisplay-Bold.otf"
SATOSHI = FONT_DIR / "satoshi" / "otf" / "Satoshi-Medium.otf"
W, H = 1200, 630
NAVY = (12, 10, 11)
ROSE = (232, 164, 168)
FG = (243, 236, 238)
MUTED = (168, 154, 158)


def font(path: Path, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), NAVY)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, W, 8), fill=ROSE)
    # soft orb
    orb = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    for i, a in enumerate(range(90, 8, -8)):
        r = 40 + i * 22
        od.ellipse((900 - r, 280 - r, 900 + r, 280 + r), fill=(*ROSE, a))
    img = Image.alpha_composite(img.convert("RGBA"), orb).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw.text((72, 58), "FLICKBEAN", font=font(SATOSHI, 22), fill=ROSE)
    draw.text((72, 118), "rub, don't tap", font=font(CLASH, 72), fill=FG)
    draw.text((72, 220), "Drag the orb. Taps earn almost nothing.", font=font(SATOSHI, 28), fill=MUTED)
    draw.text((72, 270), "Hold max speed for a prize.", font=font(SATOSHI, 28), fill=MUTED)
    draw.text((72, 548), "flickbean.grok.me", font=font(SATOSHI, 24), fill=ROSE)
    draw.text((72, 586), "@SuddenlyJon", font=font(SATOSHI, 22), fill=MUTED)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "JPEG", quality=90, optimize=True)
    print(f"wrote {OUT} {img.size}")


if __name__ == "__main__":
    main()
