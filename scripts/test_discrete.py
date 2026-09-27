import asyncio
import os
import edge_tts

async def test():
    out_dir = os.path.join("public", "audio")
    os.makedirs(out_dir, exist_ok=True)
    voice = "it-IT-GiuseppeMultilingualNeural"
    rate = "-5%"
    pitch = "-5Hz"
    
    segments = [
        ("1001_q.mp3", "Domanda 1001. Normativa e Legislazione. Chi può praticare autonomamente il volo libero."),
        ("1001_1.mp3", "Uno. Chiunque può praticare quest'attività sportiva purché abbia frequentato un apposito corso."),
        ("1001_2.mp3", "Due. Chiunque, munito dei requisiti richiesti dalle norme in vigore: Attestato V D S in corso di validità e copertura assicurativa R C T."),
        ("1001_3.mp3", "Tre. Chiunque può praticare quest'attività purché abbia superato un esame Aero Club d'Italia."),
        ("1001_e.mp3", "Risposta errata. La risposta esatta è la due: Chiunque, munito dei requisiti richiesti dalle norme in vigore. Regola: Decreto del Presidente della Repubblica 133 del 2010 e regole dell'aria. Tranello: Attenzione a non confondere le regole generali V D S con quelle commerciali o militari.")
    ]
    for fn, txt in segments:
        dest = os.path.join(out_dir, fn)
        await edge_tts.Communicate(txt, voice, rate=rate, pitch=pitch).save(dest)
        print(f"Generated {fn}: {os.path.getsize(dest)} bytes")

if __name__ == "__main__":
    asyncio.run(test())
