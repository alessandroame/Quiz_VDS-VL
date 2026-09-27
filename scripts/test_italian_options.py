import asyncio
import os
import edge_tts

OUT_DIR = os.path.join("public", "audio_samples")

TEXT_WORDS = """
Domanda 1001. Normativa e Legislazione.
Chi può praticare autonomamente il volo libero.
Opzione uno. Chiunque può praticare quest'attività sportiva purché abbia frequentato un apposito corso.
Opzione due. Chiunque, munito dei requisiti richiesti dalle norme in vigore: Attestato V D S in corso di validità e copertura assicurativa R C T.
Opzione tre. Chiunque può praticare quest'attività purché abbia superato un esame Aero Club d'Italia.
Risposta esatta: Opzione due.
Regola: Decreto del Presidente della Repubblica 133 del 2010 e regole dell'aria.
""".strip()

TEXT_RISPOSTA = """
Domanda 1001. Normativa e Legislazione.
Chi può praticare autonomamente il volo libero.
Risposta 1. Chiunque può praticare quest'attività sportiva purché abbia frequentato un apposito corso.
Risposta 2. Chiunque, munito dei requisiti richiesti dalle norme in vigore: Attestato V D S in corso di validità e copertura assicurativa R C T.
Risposta 3. Chiunque può praticare quest'attività purché abbia superato un esame Aero Club d'Italia.
Risposta esatta: Risposta 2.
Regola: Decreto del Presidente della Repubblica 133 del 2010 e regole dell'aria.
""".strip()

TEXT_NUMERI_SEMPLICI = """
Domanda 1001. Normativa e Legislazione.
Chi può praticare autonomamente il volo libero.
Uno. Chiunque può praticare quest'attività sportiva purché abbia frequentato un apposito corso.
Due. Chiunque, munito dei requisiti richiesti dalle norme in vigore: Attestato V D S in corso di validità e copertura assicurativa R C T.
Tre. Chiunque può praticare quest'attività purché abbia superato un esame Aero Club d'Italia.
Risposta esatta: La due.
Regola: Decreto del Presidente della Repubblica 133 del 2010 e regole dell'aria.
""".strip()

async def main():
    voice = "it-IT-GiuseppeMultilingualNeural"
    rate = "-5%"
    pitch = "-5Hz"

    items = [
        ("quiz_1001_opzione_lettere.mp3", TEXT_WORDS, "Opzione uno / due / tre (in lettere)"),
        ("quiz_1001_risposta_num.mp3", TEXT_RISPOSTA, "Risposta 1 / 2 / 3"),
        ("quiz_1001_uno_due_tre.mp3", TEXT_NUMERI_SEMPLICI, "Uno / Due / Tre (Cockpit minimale)"),
    ]

    for fname, text, desc in items:
        path = os.path.join(OUT_DIR, fname)
        comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await comm.save(path)
        print(f"Generato {fname} ({desc})")

if __name__ == "__main__":
    asyncio.run(main())
