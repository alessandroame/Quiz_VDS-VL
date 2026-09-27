import asyncio
import os
import edge_tts

OUT_DIR = os.path.join("public", "audio_samples")
os.makedirs(OUT_DIR, exist_ok=True)

# Testo calibrato: usiamo punti fermi e pause per evitare che il sintetizzatore
# esasperi l'intonazione interrogativa a fine frase con acuti innaturali.
TEXT_1001_TUNED = """
Domanda 1001. Normativa e Legislazione.
Chi può praticare autonomamente il volo libero.
Opzione 1. Chiunque può praticare quest'attività sportiva purché abbia frequentato un apposito corso.
Opzione 2. Chiunque, munito dei requisiti richiesti dalle norme in vigore: Attestato V D S in corso di validità e copertura assicurativa R C T.
Opzione 3. Chiunque può praticare quest'attività purché abbia superato un esame Aero Club d'Italia.
Risposta esatta: Opzione 2.
Regola: Decreto del Presidente della Repubblica 133 del 2010 e regole dell'aria. Rispetto degli spazi aerei, precedenze a destra e quote di sicurezza.
""".strip()

VARIATIONS = [
    {
        "filename": "quiz_1001_giuseppe_calm.mp3",
        "voice": "it-IT-GiuseppeMultilingualNeural",
        "rate": "-5%",
        "pitch": "-5Hz",
        "label": "Giuseppe (Maschile Pacato / Baritono)",
        "desc": "Nuovo modello multilingue neurale: tono fermo, zero acuti striduli, stile istruttore calmo."
    },
    {
        "filename": "quiz_1001_giuseppe_deep.mp3",
        "voice": "it-IT-GiuseppeMultilingualNeural",
        "rate": "-6%",
        "pitch": "-12Hz",
        "label": "Giuseppe (Baritono Profondo)",
        "desc": "Pitch abbassato di 12Hz: voce grave e rilassata, ideale per ascolto prolungato."
    },
    {
        "filename": "quiz_1001_diego_deeper.mp3",
        "voice": "it-IT-DiegoNeural",
        "rate": "-6%",
        "pitch": "-16Hz",
        "label": "Diego (Calibrato -16Hz)",
        "desc": "Diego modificato con taglio netto delle alte frequenze (-16Hz) e ritmo più lento."
    },
]

async def run():
    for v in VARIATIONS:
        out_path = os.path.join(OUT_DIR, v["filename"])
        print(f"Generazione {v['filename']} con {v['voice']} (rate={v['rate']}, pitch={v['pitch']})...")
        comm = edge_tts.Communicate(TEXT_1001_TUNED, v["voice"], rate=v["rate"], pitch=v["pitch"])
        await comm.save(out_path)
        print(f"-> OK ({os.path.getsize(out_path)/1024:.1f} KB)")

if __name__ == "__main__":
    asyncio.run(run())
