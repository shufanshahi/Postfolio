from gtts import gTTS
from playsound import playsound
import argparse
import os

def speak(text, lang='en', filename='output.mp3', play=False):
    tts = gTTS(text=text, lang=lang, slow=False)
    tts.save(filename)
    print(f"SUCCESS: Audio file created at {filename}")
    if play:
        playsound(filename)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert text to speech using gTTS')
    parser.add_argument('--text', required=True, help='Text to convert to speech')
    parser.add_argument('--output', default='output.mp3', help='Output audio file path')
    parser.add_argument('--lang', default='en', help='Language for TTS (default: en)')
    parser.add_argument('--play', action='store_true', help='Play the audio after saving')
    args = parser.parse_args()
    speak(args.text, lang=args.lang, filename=args.output, play=args.play)
