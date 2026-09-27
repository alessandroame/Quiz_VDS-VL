#!/usr/bin/env python3
"""
Pipeline di generazione batch dell'audio vocale neurale per i quiz VDS-VL
Supporta selezione multipla di voci (Giuseppe ed Elsa) con configurazioni timbriche personalizzate:
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
    
    # Normativa e Decreti
    cleaned = re.sub(r'D\.P\.R\.\s*(\d+)/(\d+)', r'Decreto del Presidente della Repubblica \1 del \2', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'D\.P\.R\.', 'Decreto del Presidente della Repubblica', cleaned, flags=re.IGNORECASE)
    
    # Istituzioni
    cleaned = re.sub(r'Ae\.C\.I\.', "Aero Club d'Italia", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bAeCI\b', "Aero Club d'Italia", cleaned)
    cleaned = re.sub(r'\bRCT\b', 'R C T', cleaned)
    cleaned = re.sub(r'\bENAC\b', 'Enac', cleaned)
    cleaned = re.sub(r'\bENAV\b', 'Enav', cleaned)
    
    # Sigle di Volo
    cleaned = re.sub(r'\bVDS/VL\b', 'V D S Volo Libero', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bVDS\b', 'V D S', cleaned)
    cleaned = re.sub(r'\bVL\b', 'Volo Libero', cleaned)
    cleaned = re.sub(r'\bVFR\b', 'V F R', cleaned)
    cleaned = re.sub(r'\bIFR\b', 'I F R', cleaned)
    
    # Spazi Aerei
    cleaned = re.sub(r'\bCTR\b', 'C T R', cleaned)
    cleaned = re.sub(r'\bTMA\b', 'T M A', cleaned)
    cleaned = re.sub(r'\bATZ\b', 'A T Z', cleaned)
    cleaned = re.sub(r'\bNOTAM\b', 'Notam', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bMETAR\b', 'Metar', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bTAF\b', 'Taf', cleaned, flags=re.IGNORECASE)
    
    # Altimetria e Unità
    cleaned = re.sub(r'\bQNH\b', 'Q N H', cleaned)
    cleaned = re.sub(r'\bQFE\b', 'Q F E', cleaned)
    cleaned = re.sub(r'\bhPa\b', 'ettopascal', cleaned)
    cleaned = re.sub(r'\bFL\s*(\d+)', r'Livello di volo \1', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bkm/h\b', "chilometri all'ora", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bm/s\b', 'metri al secondo', cleaned)
    cleaned = re.sub(r'\bkts?\b', 'nodi', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\b(\d+)\s*°C\b', r'\1 gradi centigradi', cleaned)
    cleaned = re.sub(r'\b(\d+)\s*°\b', r'\1 gradi', cleaned)
    
    # Punteggiatura morbida: sostituisce ? finale con . per evitare toni acuti
    cleaned = re.sub(r'\?\s*$', '.', cleaned)
    return re.sub(r'\s+', ' ', cleaned).strip()

def build_segments(q: dict):
    qid = q["id"]
    sub_name = q["subjectName"]
    q_text = normalize_phonetics(q["question"])
    
    opt1 = normalize_phonetics(q["options"][0])
    opt2 = normalize_phonetics(q["options"][1])
    opt3 = normalize_phonetics(q["options"][2])
    
    correct_idx = q["correctAnswer"]
    correct_text = normalize_phonetics(q["options"][correct_idx - 1])
    rule = normalize_phonetics(q.get("explanation", {}).get("rule", ""))
    trap = normalize_phonetics(q.get("explanation", {}).get("trap", ""))
    
    ordinals = {1: "la uno", 2: "la due", 3: "la tre"}
    
    return [
        (f"{qid}_q.mp3", f"Domanda {qid}. {sub_name}. {q_text}"),
        (f"{qid}_1.mp3", f"Uno. {opt1}"),
        (f"{qid}_2.mp3", f"Due. {opt2}"),
        (f"{qid}_3.mp3", f"Tre. {opt3}"),
        (f"{qid}_e.mp3", f"Risposta errata. La risposta esatta è {ordinals[correct_idx]}: {correct_text}. Regola: {rule}. Tranello: {trap}.")
    ]

async def generate_single(out_dir: str, filename: str, text: str, voice_cfg: dict, semaphore: asyncio.Semaphore, max_retries: int = 3):
    dest = os.path.join(out_dir, filename)
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return True # Già presente

    async with semaphore:
        for attempt in range(max_retries):
            try:
                comm = edge_tts.Communicate(text, voice_cfg["voice"], rate=voice_cfg["rate"], pitch=voice_cfg["pitch"])
                await comm.save(dest)
                return True
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"\n[ERRORE] Impossibile generare {dest}: {e}", file=sys.stderr)
                    return False
                await asyncio.sleep(1.5 * (attempt + 1))

async def process_voice(voice_key: str, questions: list, concurrency: int):
    cfg = VOICE_CONFIGS[voice_key]
    out_dir = cfg["dir"]
    os.makedirs(out_dir, exist_ok=True)
    print(f"\n=== Generazione Voce: {voice_key.upper()} ({cfg['voice']}) in {out_dir} ===")

    semaphore = asyncio.Semaphore(concurrency)
    tasks = []
    total_segments = 0
    for q in questions:
        segments = build_segments(q)
        total_segments += len(segments)
        for fn, txt in segments:
            tasks.append(generate_single(out_dir, fn, txt, cfg, semaphore))

    print(f"Segmenti totali: {total_segments} (Concorrenza: {concurrency})")
    
    completed = 0
    for fut in asyncio.as_completed(tasks):
        await fut
        completed += 1
        if completed % 20 == 0 or completed == total_segments:
            pct = (completed / total_segments) * 100
            print(f"\rAvanzamento [{voice_key}]: {completed}/{total_segments} segmenti ({pct:.1f}%)", end="", flush=True)

    print(f"\nCompletata voce {voice_key.upper()}!")

async def main():
    parser = argparse.ArgumentParser(description="Generatore Audio Neurale VDS-VL Multi-Voce")
    parser.add_argument("--voice", choices=["giuseppe", "elsa", "all"], default="all", help="Voce da generare")
    parser.add_argument("--start", type=int, default=None, help="ID domanda di inizio (es. 1001)")
    parser.add_argument("--end", type=int, default=None, help="ID domanda di fine (es. 1040)")
    parser.add_argument("--limit", type=int, default=None, help="Limite massimo di quiz da processare")
    parser.add_argument("--concurrency", type=int, default=10, help="Chiamate concorrenti a edge-tts")
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

    print(f"Quiz selezionati: {len(target_questions)} su {len(all_questions)}")

    voices_to_run = ["giuseppe", "elsa"] if args.voice == "all" else [args.voice]
    for v in voices_to_run:
        await process_voice(v, target_questions, args.concurrency)

    print("\nTutte le generazioni richieste sono terminate con successo!")

if __name__ == "__main__":
    asyncio.run(main())
