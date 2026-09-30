#!/usr/bin/env python3
"""
Generates the introductory audio briefing for Hands-Free Mode ("Modalità Mani Libere").
Supports both Giuseppe and Elsa voices using Edge-TTS:
- Giuseppe (it-IT-GiuseppeMultilingualNeural, rate=-5%, pitch=-5Hz) in public/audio/giuseppe/drive_intro.mp3
- Elsa (it-IT-ElsaNeural, rate=-2%, pitch=+0Hz) in public/audio/elsa/drive_intro.mp3
"""

import os
import sys
import asyncio
import subprocess
import imageio_ffmpeg
import edge_tts

FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

INTRO_TEXT = (
    "Benvenuto nella modalità a mani libere. "
    "Lo schermo rimarrà sempre acceso durante la sessione. "
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

async def generate_voice_intro(name: str, config: dict):
    dest = config["dest"]
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    tmp_dest = f"{dest}.tmp.mp3"
    print(f"Generating drive intro for voice '{name}' ({config['voice']})...")
    comm = edge_tts.Communicate(
        text=INTRO_TEXT,
        voice=config["voice"],
        rate=config["rate"],
        pitch=config["pitch"]
    )
    await comm.save(tmp_dest)
    trim_cmd = [
        FFMPEG_EXE, "-y", "-i", tmp_dest,
        "-af", "areverse,silenceremove=start_periods=1:start_duration=0.1:start_threshold=-45dB,areverse,apad=pad_dur=0.1",
        "-ar", "24000", "-ac", "1", "-b:a", "48k",
        dest
    ]
    subprocess.run(trim_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(tmp_dest):
        os.remove(tmp_dest)
    size = os.path.getsize(dest)
    print(f"Saved trimmed {dest} ({size} bytes)")

async def main():
    for name, config in VOICE_CONFIGS.items():
        await generate_voice_intro(name, config)
    print("Done! Drive Mode audio intros generated successfully.")

if __name__ == "__main__":
    asyncio.run(main())
