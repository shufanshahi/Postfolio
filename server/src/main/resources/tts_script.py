import pyttsx3
import sys
import os
import argparse

def text_to_speech(text, output_path, rate=150, volume=1.0):
    """
    Convert text to speech and save as audio file
    
    Args:
        text (str): Text to convert to speech
        output_path (str): Path where audio file will be saved
        rate (int): Speech rate (words per minute)
        volume (float): Volume level (0.0 to 1.0)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Initialize the TTS engine
        engine = pyttsx3.init()
        
        # Set properties
        engine.setProperty('rate', rate)
        engine.setProperty('volume', volume)
        
        # Get available voices (optional - for better voice selection)
        voices = engine.getProperty('voices')
        if voices:
            # Use the first available voice
            engine.setProperty('voice', voices[0].id)
        
        # Save text to audio file
        engine.save_to_file(text, output_path)
        engine.runAndWait()
        
        # Verify file was created
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print(f"SUCCESS: Audio file created at {output_path}")
            return True
        else:
            print(f"ERROR: Audio file not created or is empty")
            return False
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False
    finally:
        try:
            engine.stop()
        except:
            pass

def main():
    parser = argparse.ArgumentParser(description='Convert text to speech')
    parser.add_argument('--text', required=True, help='Text to convert to speech')
    parser.add_argument('--output', required=True, help='Output audio file path')
    parser.add_argument('--rate', type=int, default=150, help='Speech rate (default: 150)')
    parser.add_argument('--volume', type=float, default=1.0, help='Volume level (default: 1.0)')
    
    args = parser.parse_args()
    
    success = text_to_speech(args.text, args.output, args.rate, args.volume)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
