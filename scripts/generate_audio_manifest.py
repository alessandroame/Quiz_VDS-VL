#!/usr/bin/env python3
"""
Generates the public/audio/manifest.json audio catalog manifest.
Enables differential audio updates and offline CacheStorage invalidation
by recording lightweight content hashes for all audio fragments.
"""

import os
import glob
import hashlib
import json
from datetime import datetime, timezone

def generate_manifest(out_path="public/audio/manifest.json"):
    manifest = {
        "schemaVersion": 1,
        "bundleVersion": "1.0.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "voices": {}
    }

    for voice in ["giuseppe", "elsa"]:
        vdir = os.path.join("public", "audio", voice)
        if not os.path.isdir(vdir):
            continue

        files = glob.glob(os.path.join(vdir, "*.mp3"))
        total_bytes = 0
        file_map = {}

        for f in sorted(files):
            fname = os.path.basename(f)
            fsize = os.path.getsize(f)
            total_bytes += fsize

            # Fast composite hash using size and bounding byte windows
            with open(f, "rb") as fp:
                head = fp.read(2048)
                fp.seek(max(0, fsize - 2048))
                tail = fp.read(2048)

            digest = hashlib.md5(f"{fsize}".encode() + head + tail).hexdigest()[:8]
            file_map[fname] = digest

        manifest["voices"][voice] = {
            "version": "1.0.0",
            "fileCount": len(files),
            "totalBytes": total_bytes,
            "files": file_map
        }
        print(f"[{voice}] Indexed {len(files)} files ({total_bytes / (1024*1024):.2f} MB)")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Generated manifest {out_path} ({size_kb:.1f} KB)")

if __name__ == "__main__":
    generate_manifest()
