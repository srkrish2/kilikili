#!/usr/bin/env python3
"""Pre-generate Tamil audio clips so the app works on devices without a Tamil
text-to-speech voice (notably iPad/iPhone).

    npm run speech:texts                      # writes speech-texts.json
    pip install google-cloud-texttospeech
    gcloud auth application-default login     # or GOOGLE_APPLICATION_CREDENTIALS
    python scripts/generate_audio.py

Clips go to public/audio/<hash>.mp3 and public/audio/manifest.json maps each
text to its file. Existing clips are kept, so re-runs only synthesize new text.
You can also point manifest entries at your own recordings — a parent's voice
is the nicest option of all.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "public" / "audio"
MANIFEST = AUDIO_DIR / "manifest.json"


def clip_name(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:16] + ".mp3"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--texts", type=Path, default=ROOT / "speech-texts.json")
    parser.add_argument("--voice", default="ta-IN-Wavenet-A", help="Google Cloud TTS voice name")
    parser.add_argument("--rate", type=float, default=0.85, help="speaking rate (1.0 = normal)")
    parser.add_argument("--dry-run", action="store_true", help="list what would be generated")
    args = parser.parse_args()

    texts = [unicodedata.normalize("NFC", t) for t in json.loads(args.texts.read_text("utf-8"))]
    manifest: dict[str, str] = json.loads(MANIFEST.read_text("utf-8")) if MANIFEST.exists() else {}
    todo = [t for t in texts if t not in manifest or not (AUDIO_DIR / manifest[t]).exists()]
    print(f"{len(texts)} texts, {len(todo)} to generate with {args.voice}")
    if args.dry_run or not todo:
        return

    from google.cloud import texttospeech  # imported late so --dry-run needs no install

    client = texttospeech.TextToSpeechClient()
    voice = texttospeech.VoiceSelectionParams(language_code="ta-IN", name=args.voice)
    config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3, speaking_rate=args.rate)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for i, text in enumerate(todo, 1):
        response = client.synthesize_speech(
            input=texttospeech.SynthesisInput(text=text), voice=voice, audio_config=config
        )
        name = clip_name(text)
        (AUDIO_DIR / name).write_bytes(response.audio_content)
        manifest[text] = name
        if i % 25 == 0 or i == len(todo):
            # Save as we go so an interrupted run loses nothing.
            MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", "utf-8")
            print(f"  {i}/{len(todo)}")


if __name__ == "__main__":
    main()
