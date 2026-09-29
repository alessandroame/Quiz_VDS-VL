#!/usr/bin/env python3
"""
Orchestration script to completely regenerate neural audio for all 504 questions
for both Giuseppe and Elsa voices without XML tags, followed by updating manifest.json.
"""

import os
import sys
import subprocess
import time

def run_step(desc: str, cmd: list):
    print(f"\n========================================================")
    print(f"STEP: {desc}")
    print(f"COMMAND: {' '.join(cmd)}")
    print(f"========================================================")
    t0 = time.time()
    res = subprocess.run(cmd, check=True)
    elapsed = time.time() - t0
    print(f"-> Completed in {elapsed:.1f}s (Exit code: {res.returncode})")

def main():
    start_time = time.time()
    python_exe = sys.executable

    # 1. Drive intro audio
    run_step("1/3 Regenerate Drive Intro Briefings", [python_exe, "scripts/generate_drive_intro.py"])

    # 2. Complete Audio Database (Giuseppe + Elsa, all questions, all parts)
    run_step("2/3 Regenerate 5,040 Quiz Audio Snippets (Force, Concurrency 15)", [
        python_exe, "scripts/generate_audio_database.py",
        "--voice", "all",
        "--part", "all",
        "--force",
        "--concurrency", "15"
    ])

    # 3. Audio Manifest Catalog
    run_step("3/3 Update Audio Catalog Manifest (public/audio/manifest.json)", [
        python_exe, "scripts/generate_audio_manifest.py"
    ])

    total_elapsed = time.time() - start_time
    print(f"\n========================================================")
    print(f"[SUCCESS] FULL REGENERATION COMPLETED SUCCESSFULLY in {total_elapsed/60:.1f} minutes!")
    print(f"========================================================")

if __name__ == "__main__":
    main()
