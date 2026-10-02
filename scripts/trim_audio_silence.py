#!/usr/bin/env python3
"""
Pipeline for trimming trailing silence from neural TTS audio files in Quiz VDS-VL.
Removes artificial 900ms dead silence appended by Azure Edge-TTS (especially it-IT-DiegoNeural),
preserving natural 100ms acoustic decay tail while retaining 100% of speech content.
"""

import os
import sys
import glob
import time
import argparse
import subprocess
from concurrent.futures import ProcessPoolExecutor, as_completed
import imageio_ffmpeg
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate_audio_manifest import generate_manifest

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

def trim_file(file_path: str) -> dict:
    """Trims trailing silence from a single MP3 file using ffmpeg audio filters."""
    tmp_path = f"{file_path}.trim_{os.getpid()}_{time.time_ns()}.mp3"
    try:
        orig_size = os.path.getsize(file_path)
        if orig_size < 1000:
            return {"file": file_path, "status": "skipped_too_small", "orig_size": orig_size, "new_size": orig_size}

        # Filter:
        # 1. areverse: reverse audio to treat trailing silence as leading silence
        # 2. silenceremove: strip silence from start (which is the reversed tail)
        # 3. areverse: restore original speech orientation
        # 4. apad: append clean 100ms decay padding so audio does not end abruptly
        cmd = [
            FFMPEG_EXE, "-y", "-i", file_path,
            "-af", "areverse,silenceremove=start_periods=1:start_duration=0.1:start_threshold=-45dB,areverse,apad=pad_dur=0.1",
            "-ar", "24000", "-ac", "1", "-b:a", "48k",
            tmp_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            err_msg = res.stderr[-200:].replace("\n", " ") if res.stderr else f"code_{res.returncode}"
            return {"file": file_path, "status": f"error_ffmpeg: {err_msg}", "orig_size": orig_size, "new_size": orig_size}

        new_size = os.path.getsize(tmp_path)
        if new_size < 1000:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            return {"file": file_path, "status": "error_output_too_small", "orig_size": orig_size, "new_size": orig_size}

        # Atomic replacement on disk
        os.replace(tmp_path, file_path)
        return {"file": file_path, "status": "ok", "orig_size": orig_size, "new_size": new_size}

    except Exception as err:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        return {"file": file_path, "status": f"exception: {err}", "orig_size": 0, "new_size": 0}


def main():
    parser = argparse.ArgumentParser(description="Trim trailing silence from neural TTS audio dataset.")
    parser.add_argument("--voice", choices=["giuseppe", "elsa", "all"], default="all", help="Target voice directory")
    parser.add_argument("--workers", type=int, default=8, help="Number of concurrent workers")
    args = parser.parse_args()

    voices = ["giuseppe", "elsa"] if args.voice == "all" else [args.voice]
    files_to_process = []

    for v in voices:
        vdir = os.path.join("public", "audio", v)
        if not os.path.isdir(vdir):
            print(f"[WARN] Directory not found: {vdir}")
            continue
        v_files = sorted(glob.glob(os.path.join(vdir, "*.mp3")))
        files_to_process.extend(v_files)

    total_files = len(files_to_process)
    if total_files == 0:
        print("[INFO] No MP3 files found to process.")
        return

    print(f"=== TRIMMING TRAILING SILENCE ({total_files} files, {args.workers} workers) ===")
    t_start = time.time()
    processed_count = 0
    ok_count = 0
    err_count = 0
    total_orig_bytes = 0
    total_new_bytes = 0

    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(trim_file, f): f for f in files_to_process}
        for future in as_completed(futures):
            res = future.result()
            processed_count += 1
            total_orig_bytes += res.get("orig_size", 0)
            total_new_bytes += res.get("new_size", 0)

            if res.get("status") == "ok":
                ok_count += 1
            else:
                err_count += 1
                print(f"[ERROR] {res.get('file')}: {res.get('status')}", file=sys.stderr)

            if processed_count % 250 == 0 or processed_count == total_files:
                elapsed = time.time() - t_start
                rate = processed_count / elapsed if elapsed > 0 else 0
                pct = (processed_count / total_files) * 100
                print(f"[{processed_count}/{total_files} ({pct:.1f}%)] - {rate:.1f} files/s - OK: {ok_count}, Err: {err_count}")

    t_end = time.time()
    elapsed_total = t_end - t_start
    saved_bytes = total_orig_bytes - total_new_bytes
    saved_mb = saved_bytes / (1024 * 1024)

    print("\n=== TRIMMING COMPLETE ===")
    print(f"Total files: {total_files}")
    print(f"Successfully trimmed: {ok_count}")
    print(f"Errors: {err_count}")
    print(f"Time elapsed: {elapsed_total:.2f}s ({total_files / elapsed_total:.1f} files/s)")
    print(f"Storage reduction: {saved_mb:.2f} MB saved ({total_orig_bytes / (1024*1024):.2f} MB -> {total_new_bytes / (1024*1024):.2f} MB)")

    print("\nUpdating audio manifest (public/audio/manifest.json)...")
    generate_manifest("public/audio/manifest.json")
    print("Manifest successfully updated.")


if __name__ == "__main__":
    main()
