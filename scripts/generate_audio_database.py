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
import subprocess
import shutil
import edge_tts

try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    FFMPEG_EXE = shutil.which("ffmpeg") or "ffmpeg"

VOICE_CONFIGS = {
    "giuseppe": {
        # it-IT-DiegoNeural is pure native Italian (no multilingual language bleed)
        # with calm cockpit instructor tone. Backward compatible directory.
        "voice": "it-IT-DiegoNeural",
        "rate": "-4%",
        "pitch": "-4Hz",
        "dir": os.path.join("public", "audio", "giuseppe")
    },
    "elsa": {
        # it-IT-ElsaNeural is pure native Italian female neural voice, crisp and clear
        "voice": "it-IT-ElsaNeural",
        "rate": "-2%",
        "pitch": "+0Hz",
        "dir": os.path.join("public", "audio", "elsa")
    },
    "diego": {
        "voice": "it-IT-DiegoNeural",
        "rate": "-4%",
        "pitch": "-4Hz",
        "dir": os.path.join("public", "audio", "diego")
    }
}

def normalize_phonetics(text: str) -> str:
    if not text:
        return ""
    cleaned = text
    cleaned = cleaned.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')

    # 1. Regulations and institutions (before single-letter/acronym rules)
    cleaned = re.sub(r'D\.P\.R\.\s*(\d+)/(\d+)', r'Decreto del Presidente della Repubblica \1 del \2', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'D\.P\.R\.', 'Decreto del Presidente della Repubblica', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Ae\.C\.I\.', "Aero Club d'Italia", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bAeCI\b', "Aero Club d'Italia", cleaned)
    cleaned = re.sub(r'\bENAC\b', 'Enac', cleaned)
    cleaned = re.sub(r'\bENAV\b', 'Enav', cleaned)
    cleaned = re.sub(r'\bICAO\b', 'Icao', cleaned)

    # 2. Physics formulas, subscripts, superscripts, and composite units
    # Must run BEFORE acronym rules because superscripts like ² create a boundary after V/S/m.
    cleaned = re.sub(r'\bkg/m²(?![a-zA-Z0-9])', 'chilogrammi per metro quadrato', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bm/s²(?![a-zA-Z0-9])', 'metri al secondo quadrato', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bm²(?![a-zA-Z0-9])', 'metri quadrati', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b1/2\b', 'un mezzo', cleaned)
    cleaned = re.sub(r'\bCₚ(?![a-zA-Z0-9])', 'ci con pi', cleaned)
    cleaned = re.sub(r'\bCᵣ(?![a-zA-Z0-9])', 'ci con erre', cleaned)
    cleaned = re.sub(r'\bEₚ(?![a-zA-Z0-9])', 'e con pi', cleaned)
    cleaned = re.sub(r'\bO₂(?![a-zA-Z0-9])', 'ossigeno', cleaned)
    cleaned = re.sub(r'(?<![a-zA-ZÀ-ÿ])[ρϱ](?![a-zA-ZÀ-ÿ])', 'ro', cleaned)
    cleaned = re.sub(r'√n\b', 'radice di enne', cleaned)
    cleaned = re.sub(r'∝', 'è proporzionale a', cleaned)
    cleaned = re.sub(r'\bVx\b', 'vu con ics', cleaned)
    cleaned = re.sub(r'\bVy\b', 'vu con ipsilon', cleaned)
    cleaned = re.sub(r'\bVz\b', 'vu con zeta', cleaned)
    cleaned = re.sub(r'\bVs\b', 'vu con esse', cleaned)
    cleaned = re.sub(r'\b3V\b', 'tre vu', cleaned)
    cleaned = re.sub(r'\b[vV]²(?![a-zA-Z0-9])', 'vu al quadrato', cleaned)
    cleaned = re.sub(r'\bS²(?![a-zA-Z0-9])', 'esse al quadrato', cleaned)
    cleaned = re.sub(r'\bb²(?![a-zA-Z0-9])', 'bi al quadrato', cleaned)
    cleaned = re.sub(r'(\d+)²(?![a-zA-Z0-9])', r'\1 al quadrato', cleaned)

    # 3. Compound and single aeronautical acronyms (syllabic Italian letter names)
    cleaned = re.sub(r'\bVDS\s*[/-]\s*VL\b', 'vu di esse, vu elle', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bTAS/IAS\b', 'ti a esse su i a esse', cleaned)
    cleaned = re.sub(r'\bEN/LTF\b', 'e enne, elle ti effe', cleaned)
    cleaned = re.sub(r'\bEN-A\b', 'e enne a', cleaned)
    cleaned = re.sub(r'\bEN-B\b', 'e enne bi', cleaned)
    cleaned = re.sub(r'\bEN-C\b', 'e enne ci', cleaned)
    cleaned = re.sub(r'\bEN-D\b', 'e enne di', cleaned)
    cleaned = re.sub(r'\bVDS\b', 'vu di esse', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bVL\b', 'vu elle', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bVFR\b', 'vu effe erre', cleaned)
    cleaned = re.sub(r'\bIFR\b', 'i effe erre', cleaned)
    cleaned = re.sub(r'\bRCT\b', 'erre ci ti', cleaned)
    cleaned = re.sub(r'\bCTR\b', 'ci ti erre', cleaned)
    cleaned = re.sub(r'\bTMA\b', 'ti emme a', cleaned)
    cleaned = re.sub(r'\bATZ\b', 'a ti zeta', cleaned)
    cleaned = re.sub(r'\bNOTAM\b', 'Notam', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bMETAR\b', 'Metar', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bTAF\b', 'Taf', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bQNH\b', 'qu enne acca', cleaned)
    cleaned = re.sub(r'\bQFE\b', 'qu effe e', cleaned)
    cleaned = re.sub(r'\bVNE\b', 'vu enne e', cleaned)
    cleaned = re.sub(r'\bGPS\b', 'gi pi esse', cleaned)
    cleaned = re.sub(r'\bIAS\b', 'i a esse', cleaned)
    cleaned = re.sub(r'\bTAS\b', 'ti a esse', cleaned)
    cleaned = re.sub(r'\bGS\b', 'gi esse', cleaned)
    cleaned = re.sub(r'\bATC\b', 'a ti ci', cleaned)
    cleaned = re.sub(r'\bSIV\b', 'esse i vu', cleaned)
    cleaned = re.sub(r'\bPIO\b', 'pi i o', cleaned)
    cleaned = re.sub(r'\bMSL\b', 'emme esse elle', cleaned)
    cleaned = re.sub(r'\bAIP\b', 'a i pi', cleaned)
    cleaned = re.sub(r'\bISA\b', 'i esse a', cleaned)
    cleaned = re.sub(r'\bVMC\b', 'vu emme ci', cleaned)
    cleaned = re.sub(r'\bIMC\b', 'i emme ci', cleaned)
    cleaned = re.sub(r'\bUV\b', 'u vu', cleaned)
    cleaned = re.sub(r'\bUR\b', 'u erre', cleaned)
    cleaned = re.sub(r'\bAWY\b', 'a doppia vu ipsilon', cleaned)
    cleaned = re.sub(r'\bPLS\b', 'pi elle esse', cleaned)
    cleaned = re.sub(r'\bWMO\b', 'doppia vu emme o', cleaned)
    cleaned = re.sub(r'(?<![a-zA-ZÀ-ÿ])AR(?![a-zA-ZÀ-ÿ])', 'a erre', cleaned)

    # Standalone uppercase V (velocity symbol in formulas) -> "vu" so TTS never reads "quinto"
    cleaned = re.sub(r'(?<![a-zA-ZÀ-ÿ])V(?![a-zA-ZÀ-ÿ])', 'vu', cleaned)

    # 4. Aeronautical units of measurement and flight levels
    cleaned = re.sub(r'\bhPa\b', 'ettopascal', cleaned)
    cleaned = re.sub(r'\bFL\s*(\d+)', r'Livello di volo \1', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bkm/h\b', "chilometri all'ora", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bm/s\b', 'metri al secondo', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bkts?\b', 'nodi', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'(\d+(?:[.,]\d+)?)\s*°C\b', r'\1 gradi centigradi', cleaned)
    cleaned = re.sub(r'(\d+(?:[.,]\d+)?)\s*°(?![a-zA-Z])', r'\1 gradi', cleaned)

    # 5. Soft punctuation: replace trailing question mark with period to avoid shrill pitch
    cleaned = re.sub(r'\?\s*$', '.', cleaned)

    # 6. Phonetic overrides to resolve homographs and enforce correct Italian tonic accents
    for pattern, replacement in PHONETIC_OVERRIDES:
        def repl(match):
            val = match.group(0)
            if val[0].isupper():
                return replacement[0].upper() + replacement[1:]
            return replacement
        cleaned = re.sub(pattern, repl, cleaned, flags=re.IGNORECASE)

    return re.sub(r'\s+', ' ', cleaned).strip()

# Phonetic overrides for neural Italian TTS (Diego and Elsa)
PHONETIC_OVERRIDES = [
    # 1. Verbs vs nouns/adjectives (homographs)
    (r'\bdecade\b', 'decàde'),
    (r'\bdecadono\b', 'decàdono'),
    (r'\bsubito\b', 'sùbito'),
    (r'\bcircuito\b', 'circùito'),
    (r'\bcircuiti\b', 'circùiti'),
    (r'\breticolo\b', 'retìcolo'),

    # 2. Flight axes and flight dynamics (penultimate tonic accent)
    (r'\bverticale\b', 'verticàle'),
    (r'\bverticali\b', 'verticàli'),
    (r'\bverticalmente\b', 'verticalménte'),
    (r'\borizzontale\b', 'orizzontàle'),
    (r'\borizzontali\b', 'orizzontàli'),
    (r'\borizzontalmente\b', 'orizzontalménte'),
    (r'\brollio\b', 'rollìo'),
    (r'\bvelivolo\b', 'velìvolo'),
    (r'\bvelivoli\b', 'velìvoli'),
    (r'\baerodina\b', 'aerodìna'),
    (r'\baerodine\b', 'aerodìne'),

    # 3. Flight instruments (antepenultimate tonic accent)
    (r'\bvariometro\b', 'variòmetro'),
    (r'\bvariometri\b', 'variòmetri'),
    (r'\banemometro\b', 'anemòmetro'),
    (r'\banemometri\b', 'anemòmetri'),
    (r'\baltimetro\b', 'altìmetro'),
    (r'\baltimetri\b', 'altìmetri'),
    (r'\bbarometro\b', 'baròmetro'),
    (r'\bbarometri\b', 'baròmetri'),
    (r'\bigrometro\b', 'igròmetro'),
    (r'\bigrometri\b', 'igròmetri'),

    # 4. Meteorology and cloud formations
    (r'\bisobare\b', 'isòbare'),
    (r'\bisobara\b', 'isòbara'),
    (r'\bcumulo\b', 'cùmulo'),
    (r'\bcumuli\b', 'cùmuli'),
    (r'\bcumulonembo\b', 'cumulonèmbo'),
    (r'\bcumulonembi\b', 'cumulonèmbi'),
    (r'\bstratocumulo\b', 'stratocùmulo'),
    (r'\bstratocumuli\b', 'stratocùmuli'),
    (r'\baltocumulo\b', 'altocùmulo'),
    (r'\baltocumuli\b', 'altocùmuli'),
    (r'\bcirrostrato\b', 'cirrostràto'),
    (r'\baltostrato\b', 'altostràto'),
    (r'\bsottovento\b', 'sottovènto'),
    (r'\bsopravvento\b', 'sopravvènto'),
    (r'\bsopravento\b', 'sopravvènto'),
]

def is_question_affected_by_phonetics(q: dict) -> bool:
    """Returns True if any text field in the question contains words affected by phonetic overrides."""
    parts = [
        q.get("question", ""),
        q.get("options", ["", "", ""])[0],
        q.get("options", ["", "", ""])[1],
        q.get("options", ["", "", ""])[2],
        q.get("explanation", {}).get("rule", ""),
        q.get("explanation", {}).get("trap", "")
    ]
    combined = " ".join(parts)
    for pattern, _ in PHONETIC_OVERRIDES:
        if re.search(pattern, combined, flags=re.IGNORECASE):
            return True
    return False

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
        explanation_text = f"La risposta esatta è {ordinals[correct_idx]}: {correct_text}. Regola: {rule}. Tranello: {trap}."
        segments.append((f"{qid}_e.mp3", explanation_text))
        
    return segments

async def generate_single(out_dir: str, filename: str, text: str, voice_cfg: dict, semaphore: asyncio.Semaphore, max_retries: int = 5, force: bool = False):
    dest = os.path.join(out_dir, filename)
    if not force and os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return True # Already present and valid

    # Clean up empty or corrupted existing file
    if os.path.exists(dest) and os.path.getsize(dest) <= 1000:
        try:
            os.remove(dest)
        except OSError:
            pass

    async with semaphore:
        tmp_dest = f"{dest}.{os.getpid()}_{id(asyncio.current_task())}.tmp"
        for attempt in range(max_retries):
            try:
                comm = edge_tts.Communicate(
                    text=text,
                    voice=voice_cfg["voice"],
                    rate=voice_cfg["rate"],
                    pitch=voice_cfg["pitch"]
                )
                await comm.save(tmp_dest)
                if os.path.exists(tmp_dest) and os.path.getsize(tmp_dest) > 1000:
                    # Trim trailing silence leaving clean 100ms decay padding
                    trimmed_tmp = f"{tmp_dest}.trimmed.mp3"
                    trim_cmd = [
                        FFMPEG_EXE, "-y", "-i", tmp_dest,
                        "-af", "areverse,silenceremove=start_periods=1:start_duration=0.1:start_threshold=-45dB,areverse,apad=pad_dur=0.1",
                        "-ar", "24000", "-ac", "1", "-b:a", "48k",
                        trimmed_tmp
                    ]
                    trim_res = subprocess.run(trim_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    if trim_res.returncode == 0 and os.path.exists(trimmed_tmp) and os.path.getsize(trimmed_tmp) > 1000:
                        os.replace(trimmed_tmp, dest)
                        if os.path.exists(tmp_dest):
                            os.remove(tmp_dest)
                    else:
                        if os.path.exists(trimmed_tmp):
                            os.remove(trimmed_tmp)
                        os.replace(tmp_dest, dest)
                    return True
                else:
                    if os.path.exists(tmp_dest):
                        os.remove(tmp_dest)
                    raise IOError(f"Generated audio file is invalid or too small ({tmp_dest})")
            except Exception as e:
                if os.path.exists(tmp_dest):
                    try:
                        os.remove(tmp_dest)
                    except OSError:
                        pass
                if attempt == max_retries - 1:
                    print(f"\n[ERROR] Failed to generate {dest}: {e}", file=sys.stderr)
                    return False
                await asyncio.sleep(2.0 * (attempt + 1))

async def process_voice(voice_key: str, questions: list, concurrency: int, part_filter: str = "all", force: bool = False, allowed_segments: set | None = None):
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
        for fn, txt in segments:
            if allowed_segments is not None and fn not in allowed_segments:
                continue
            total_segments += 1
            tasks.append(generate_single(out_dir, fn, txt, cfg, semaphore, force=force))

    print(f"Total segments: {total_segments} (Concurrency: {concurrency})")
    if total_segments == 0:
        print(f"No segments matched for {voice_key.upper()}.")
        return

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
    parser.add_argument("--voice", choices=["giuseppe", "elsa", "diego", "all"], default="all", help="Target voice")
    parser.add_argument("--part", choices=["all", "q", "options", "explanation"], default="all", help="Part filter to generate")
    parser.add_argument("--force", action="store_true", help="Force overwrite existing audio files")
    parser.add_argument("--start", type=int, default=None, help="Start question ID (e.g. 1001)")
    parser.add_argument("--end", type=int, default=None, help="End question ID (e.g. 1040)")
    parser.add_argument("--ids", type=str, default=None, help="Comma-separated list of question IDs to process")
    parser.add_argument("--segments-file", type=str, default=None, help="JSON array file of exact segment filenames (e.g. 2047_e.mp3)")
    parser.add_argument("--phonetic-only", action="store_true", help="Only process questions affected by phonetic overrides")
    parser.add_argument("--limit", type=int, default=None, help="Max number of quiz items to process")
    parser.add_argument("--concurrency", type=int, default=10, help="Concurrent edge-tts calls")
    args = parser.parse_args()

    with open("src/data/questions.json", "r", encoding="utf-8") as f:
        all_questions = json.load(f)

    allowed_segments = None
    if args.segments_file:
        with open(args.segments_file, "r", encoding="utf-8") as sf:
            allowed_segments = set(json.load(sf))

    target_questions = all_questions
    if args.ids:
        id_set = {int(x.strip()) for x in args.ids.split(",") if x.strip()}
        target_questions = [q for q in target_questions if q["id"] in id_set]
    if args.phonetic_only:
        target_questions = [q for q in target_questions if is_question_affected_by_phonetics(q)]
    if args.start is not None:
        target_questions = [q for q in target_questions if q["id"] >= args.start]
    if args.end is not None:
        target_questions = [q for q in target_questions if q["id"] <= args.end]
    if args.limit is not None:
        target_questions = target_questions[:args.limit]

    print(f"Selected questions: {len(target_questions)} of {len(all_questions)}")

    voices_to_run = ["giuseppe", "elsa"] if args.voice == "all" else [args.voice]
    for v in voices_to_run:
        await process_voice(v, target_questions, args.concurrency, part_filter=args.part, force=args.force, allowed_segments=allowed_segments)

    print("\nAll requested generations completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
