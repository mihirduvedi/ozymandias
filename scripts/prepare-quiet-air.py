"""Prepare the CC0 gentle-air source supplied by dhallcomposer.

Usage: python3 scripts/prepare-quiet-air.py source.mp3 output.mp3
Requires FFmpeg. Source and attribution are in public/world/audio/CREDITS.md.
"""
import shutil
import subprocess
import sys
from pathlib import Path

ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
source, destination = map(Path, sys.argv[1:3])
rates = [1, .94, 1.045, .975, 1.025, .955]
filters = [
    "[0:a]highpass=f=450:p=2,lowpass=f=2800:p=2,"
    "equalizer=f=650:t=q:w=0.7:g=-5,"
    "acompressor=threshold=0.003:ratio=2.5:attack=120:release=1800:makeup=1:knee=4,"
    "volume=11dB,asplit=6" + "".join(f"[air{i}]" for i in range(6))
]
for i, rate in enumerate(rates):
    # Small tempo changes lengthen the transitions without dramatic pitch shifts.
    filters.append(f"[air{i}]atempo={rate}[pass{i}]")
previous = "pass0"
for i in range(1, 6):
    output = f"blend{i}"
    filters.append(f"[{previous}][pass{i}]acrossfade=d=12:c1=qsin:c2=qsin[{output}]")
    previous = output
filters.append(f"[{previous}]volume=3,alimiter=limit=0.072:level=false,volume=0.333333[out]")
subprocess.run([
    ffmpeg, "-hide_banner", "-y", "-i", str(source), "-filter_complex", ";".join(filters),
    "-map", "[out]", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", str(destination)
], check=True)
