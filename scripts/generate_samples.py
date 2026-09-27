import asyncio
import os
import edge_tts

# Assicuriamo la directory di destinazione
OUT_DIR = os.path.join("public", "audio_samples")
os.makedirs(OUT_DIR, exist_ok=True)

# Quiz 1001: Normativa e Attestato VDS
# Testiamo acronimi come VDS/VL, RCT, Ae.C.I., D.P.R. 133/2010
TEXT_1001 = """
Domanda 1001. Normativa e Legislazione.
Chi può praticare autonomamente il volo libero?
Opzione 1. Chiunque può praticare quest'attività sportiva purché abbia frequentato un apposito corso.
Opzione 2. Chiunque, munito dei requisiti richiesti dalle norme in vigore: Attestato V D S in corso di validità e copertura assicurativa R C T.
Opzione 3. Chiunque può praticare quest'attività purché abbia superato un esame Aero Club d'Italia.
Risposta esatta: Opzione 2.
Regola: Decreto del Presidente della Repubblica 133 del 2010 e regole dell'aria. Rispetto rigoroso degli spazi aerei, precedenze a destra e quote di sicurezza.
""".strip()

# Quiz 1034: Rotte convergenti e prevenzione collisioni
TEXT_1034 = """
Domanda 1034. Normativa e Legislazione.
Due apparecchi V D S si trovano su rotte convergenti alla stessa quota. Come si devono comportare i rispettivi piloti?
Opzione 1. Uno mantiene la quota e l'altro la cambia per evitare la collisione.
Opzione 2. Quello che viene da destra continua diritto, l'altro vira per evitare la collisione.
Opzione 3. Entrambi effettuano una virata a destra mantenendo l'altro in vista per evitare la collisione.
Risposta esatta: Opzione 3.
Regola: Nelle rotte convergenti tra apparecchi della stessa categoria, ciascun pilota deve accostare a destra per disimpegnarsi.
""".strip()

# Quiz 6001: Strumenti e Altimetria (QNH / QFE)
TEXT_6001 = """
Domanda 6001. Strumenti.
Che cos'è l'altimetro?
Opzione 1. È lo strumento che misura sempre la distanza di un apparecchio dal suolo.
Opzione 2. È lo strumento che misura la velocità verticale di un apparecchio.
Opzione 3. È lo strumento che misura l'altitudine di un apparecchio rispetto a un punto noto, come ad esempio il livello del mare.
Risposta esatta: Opzione 3.
Regola: L'altimetro misura la pressione statica barometrica. Va tarato alla quota nota di decollo regolando la scala Q-N-H o Q-F-E in ettopascal.
""".strip()

SAMPLES = [
    {"id": "1001", "name": "diego", "voice": "it-IT-DiegoNeural", "text": TEXT_1001},
    {"id": "1001", "name": "elsa", "voice": "it-IT-ElsaNeural", "text": TEXT_1001},
    {"id": "1034", "name": "diego", "voice": "it-IT-DiegoNeural", "text": TEXT_1034},
    {"id": "6001", "name": "diego", "voice": "it-IT-DiegoNeural", "text": TEXT_6001},
    {"id": "6001", "name": "elsa", "voice": "it-IT-ElsaNeural", "text": TEXT_6001},
]

async def generate():
    for item in SAMPLES:
        out_path = os.path.join(OUT_DIR, f"quiz_{item['id']}_{item['name']}.mp3")
        print(f"Generazione {out_path} con voce {item['voice']}...")
        comm = edge_tts.Communicate(item["text"], item["voice"], rate="+0%")
        await comm.save(out_path)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"-> Generato con successo: {size_kb:.1f} KB")

if __name__ == "__main__":
    asyncio.run(generate())
