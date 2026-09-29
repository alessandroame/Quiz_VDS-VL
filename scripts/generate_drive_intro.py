#!/usr/bin/env python3
"""
Generates the introductory audio briefing for Drive Mode ("Modalità Alla Guida").
Supports both Giuseppe and Elsa voices using Edge-TTS:
- Giuseppe (it-IT-GiuseppeMultilingualNeural, rate=-5%, pitch=-5Hz) in public/audio/giuseppe/drive_intro.mp3
- Elsa (it-IT-ElsaNeural, rate=-2%, pitch=+0Hz) in public/audio/elsa/drive_intro.mp3
"""

import os
import sys
import asyncio
import edge_tts

INTRO_TEXT = (
    "Benvenuto nella modalità alla guida. "
    "Lo schermo rimarrà sempre acceso sul tuo cruscotto. "
    "Le domande e le opzioni verranno lette automaticamente. "
    "Puoi rispondere toccando i tre grandi pulsanti sullo schermo, "
    "oppure usando i comandi vocali pronunciando Uno, Due o Tre. "
    "Puoi dire Ripeti per riascoltare, oppure Aiuto per l'elenco dei comandi. "
    "Tocca lo schermo per iniziare."
)

VOICE_CONFIGS = {
    "giuseppe": {
        "voice": "it-IT-DiegoNeural",
        "rate": "-4%",
        "pitch": "-4Hz",
        "dest": os.path.join("public", "audio", "giuseppe", "drive_intro.mp3")
    },
    "elsa": {
        "voice": "it-IT-ElsaNeural",
        "rate": "-2%",
        "pitch": "+0Hz",
        "dest": os.path.join("public", "audio", "elsa", "drive_intro.mp3")
    }
}

def build_ssml(text: str, voice: str, rate: str, pitch: str) -> str:
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    return (
        f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' "
        f"xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='it-IT'>"
        f"<voice name='{voice}'>"
        f"<prosody rate='{rate}' pitch='{pitch}'>"
        f"<lang xml:lang='it-IT'>{escaped}</lang>"
        f"</prosody></voice></speak>"
    )

async def generate_voice_intro(name: str, config: dict):
    dest = config["dest"]
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"Generating drive intro for voice '{name}' ({config['voice']})...")
    ssml = build_ssml(INTRO_TEXT, config["voice"], config["rate"], config["pitch"])
    comm = edge_tts.Communicate(
        ssml,
        config["voice"]
    )
    await comm.save(dest)
    size = os.path.getsize(dest)
    print(f"Saved {dest} ({size} bytes)")

async def main():
    for name, config in VOICE_CONFIGS.items():
        await generate_voice_intro(name, config)
    print("Done! Drive Mode audio intros generated successfully.")

if __name__ == "__main__":
    asyncio.run(main())
