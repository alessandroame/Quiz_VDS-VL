#!/usr/bin/env python3
"""
Batch generation pipeline for neural voice audio of VDS-VL quiz questions.
Supports multiple voices (Giuseppe and Elsa) with custom timbre and cadence configurations:
- Giuseppe (it-IT-GiuseppeMultilingualNeural, rate=-5%, pitch=-5Hz) in public/audio/giuseppe/
- Elsa (it-IT-ElsaNeural, rate=-2%, pitch=+0Hz) in public/audio/elsa/
"""

import os
import sys
import json
import asyncio
import re
import argparse
import edge_tts

VOICE_CONFIGS = {
    "giuseppe": {
        "voice": "it-IT-GiuseppeMultilingualNeural",
        "rate": "-5%",
        "pitch": "-5Hz",
        "dir": os.path.join("public", "audio", "giuseppe")
    },
    "elsa": {
        "voice": "it-IT-ElsaNeural",
        "rate": "-2%",
        "pitch": "+0Hz",
        "dir": os.path.join("public", "audio", "elsa")
    }
}

def normalize_phonetics(text: str) -> str:
    if not text:
        return ""
    cleaned = text
    cleaned = cleaned.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    
    # Regulations and decrees
    cleaned = re.sub(r'D\.P\.R\.\s*(\d+)/(\d+)', r'Decreto del Presidente della Repubblica \1 del \2', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'D\.P\.R\.', 'Decreto del Presidente della Repubblica', cleaned, flags=re.IGNORECASE)
    
    # Institutions and insurance
    cleaned = re.sub(r'Ae\.C\.I\.', "Aero Club d'Italia", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bAeCI\b', "Aero Club d'Italia", cleaned)
    cleaned = re.sub(r'\bRCT\b', 'R C T', cleaned)
    cleaned = re.sub(r'\bENAC\b', 'Enac', cleaned)
    cleaned = re.sub(r'\bENAV\b', 'Enav', cleaned)
    
    # Flight acronyms and ratings
    cleaned = re.sub(r'\bVDS/VL\b', 'V D S Volo Libero', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bVDS\b', 'V D S', cleaned)
    cleaned = re.sub(r'\bVL\b', 'Volo Libero', cleaned)
    cleaned = re.sub(r'\bVFR\b', 'V F R', cleaned)
    cleaned = re.sub(r'\bIFR\b', 'I F R', cleaned)
    
    # Airspaces and weather reports
    cleaned = re.sub(r'\bCTR\b', 'C T R', cleaned)
    cleaned = re.sub(r'\bTMA\b', 'T M A', cleaned)
    cleaned = re.sub(r'\bATZ\b', 'A T Z', cleaned)
    cleaned = re.sub(r'\bNOTAM\b', 'Notam', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bMETAR\b', 'Metar', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bTAF\b', 'Taf', cleaned, flags=re.IGNORECASE)
    
    # Altimetry and units of measurement
    cleaned = re.sub(r'\bQNH\b', 'Q N H', cleaned)
    cleaned = re.sub(r'\bQFE\b', 'Q F E', cleaned)
    cleaned = re.sub(r'\bhPa\b', 'ettopascal', cleaned)
    cleaned = re.sub(r'\bFL\s*(\d+)', r'Livello di volo \1', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bkm/h\b', "chilometri all'ora", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bm/s\b', 'metri al secondo', cleaned)
    cleaned = re.sub(r'\bkts?\b', 'nodi', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b(\d+)\s*°C\b', r'\1 gradi centigradi', cleaned)
    cleaned = re.sub(r'\b(\d+)\s*°\b', r'\1 gradi', cleaned)
    
    # Soft punctuation: replace trailing question mark with period to avoid shrill pitch
    cleaned = re.sub(r'\?\s*$', '.', cleaned)
    return re.sub(r'\s+', ' ', cleaned).strip()

def build_segments(q: dict, part_filter: str = "all") -> list:
    qid = q["id"]
    q_text = normalize_phonetics(q["question"])
    
    segments = []
    
    # Question text: strictly normalized question text without question ID or category prefix
    if part_filter in ("all", "q"):
        segments.append((f"{qid}_q.mp3", q_text))
    
    if part_filter in ("all", "options"):
        opt1 = normalize_phonetics(q["options"][0])
        opt2 = normalize_phonetics(q["options"][1])
        opt3 = normalize_phonetics(q["options"][2])
        segments.append((f"{qid}_1.mp3", f"Uno. {opt1}"))
        segments.append((f"{qid}_2.mp3", f"Due. {opt2}"))
        segments.append((f"{qid}_3.mp3", f"Tre. {opt3}"))
    
    if part_filter in ("all", "explanation"):
        correct_idx = q["correctAnswer"]
        correct_text = normalize_phonetics(q["options"][correct_idx - 1])
        rule = normalize_phonetics(q.get("explanation", {}).get("rule", ""))
        trap = normalize_phonetics(q.get("explanation", {}).get("trap", ""))
        ordinals = {1: "la uno", 2: "la due", 3: "la tre"}
        explanation_text = f"Risposta errata. La risposta esatta è {ordinals[correct_idx]}: {correct_text}. Regola: {rule}. Tranello: {trap}."
        segments.append((f"{qid}_e.mp3", explanation_text))
        
    return segments

async def generate_single(out_dir: str, filename: str, text: str, voice_cfg: dict, semaphore: asyncio.Semaphore, max_retries: int = 3, force: bool = False):
    dest = os.path.join(out_dir, filename)
    if not force and os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return True # Already present and valid

    async with semaphore:
        for attempt in range(max_retries):
            try:
                comm = edge_tts.Communicate(text, voice_cfg["voice"], rate=voice_cfg["rate"], pitch=voice_cfg["pitch"])
                await comm.save(dest)
                return True
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"\n[ERROR] Failed to generate {dest}: {e}", file=sys.stderr)
                    return False
                await asyncio.sleep(1.5 * (attempt + 1))

async def process_voice(voice_key: str, questions: list, concurrency: int, part_filter: str = "all", force: bool = False):
    cfg = VOICE_CONFIGS[voice_key]
    out_dir = cfg["dir"]
    os.makedirs(out_dir, exist_ok=True)
    print(f"\n=== Voice Generation: {voice_key.upper()} ({cfg['voice']}) in {out_dir} ===")
    print(f"Filter part: {part_filter}, Force overwrite: {force}")

    semaphore = asyncio.Semaphore(concurrency)
    tasks = []
    total_segments = 0
    for q in questions:
        segments = build_segments(q, part_filter=part_filter)
        total_segments += len(segments)
        for fn, txt in segments:
            tasks.append(generate_single(out_dir, fn, txt, cfg, semaphore, force=force))

    print(f"Total segments: {total_segments} (Concurrency: {concurrency})")
    
    completed = 0
    for fut in asyncio.as_completed(tasks):
        await fut
        completed += 1
        if completed % 20 == 0 or completed == total_segments:
            pct = (completed / total_segments) * 100
            print(f"\rProgress [{voice_key}]: {completed}/{total_segments} segments ({pct:.1f}%)", end="", flush=True)

    print(f"\nCompleted voice {voice_key.upper()}!")

async def main():
    parser = argparse.ArgumentParser(description="VDS-VL Multi-Voice Neural Audio Generator")
    parser.add_argument("--voice", choices=["giuseppe", "elsa", "all"], default="all", help="Target voice")
    parser.add_argument("--part", choices=["all", "q", "options", "explanation"], default="all", help="Part filter to generate")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing audio files")
    parser.add_argument("--start", type=int, default=None, help="Start question ID (e.g. 1001)")
    parser.add_argument("--end", type=int, default=None, help="End question ID (e.g. 1040)")
    parser.add_argument("--limit", type=int, default=None, help="Max number of quiz items to process")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent edge-tts calls")
    args = parser.parse_args()

    with open("src/data/questions.json", "r", encoding="utf-8") as f:
        all_questions = json.load(f)

    target_questions = all_questions
    if args.start is not None:
        target_questions = [q for q in target_questions if q["id"] >= args.start]
    if args.end is not None:
        target_questions = [q for q in target_questions if q["id"] <= args.end]
    if args.limit is not None:
        target_questions = target_questions[:args.limit]

    print(f"Selected questions: {len(target_questions)} of {len(all_questions)}")

    voices_to_run = ["giuseppe", "elsa"] if args.voice == "all" else [args.voice]
    for v in voices_to_run:
        await process_voice(v, target_questions, args.concurrency, part_filter=args.part, force=args.force)

    print("\nAll requested generations completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
