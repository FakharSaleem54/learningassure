import sys
import os
import io
import uuid

# Fix Windows encoding issues - force UTF-8 for stdout/stderr
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import moviepy.editor as mp
import speech_recognition as sr

def transcribe_video(video_path):
    # dynamic temp audio file
    temp_audio = f"temp_audio_{uuid.uuid4()}.wav"
    
    try:
        # Load the audio directly from the video file (bypasses video FPS issues)
        # AudioFileClip works for video files too
        audio_clip = mp.AudioFileClip(video_path)
        
        # Write audio to temp file
        audio_clip.write_audiofile(temp_audio, verbose=False, logger=None)
        
        # Close the clip to release resources
        audio_clip.close()
        
        # Initialize recognizer
        r = sr.Recognizer()
        
        # Load the audio file
        with sr.AudioFile(temp_audio) as source:
            data = r.record(source)
        
        # Convert speech to text
        try:
            # Using recognize_whisper as requested (assumes openai-whisper is installed)
            text = r.recognize_whisper(data)
            print(text)
        except sr.UnknownValueError:
            print("Speech Recognition could not understand audio")
        except sr.RequestError as e:
            print(f"Could not request results; {e}")
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        # Cleanup
        if os.path.exists(temp_audio):
            os.remove(temp_audio)
        if 'audio_clip' in locals():
            audio_clip.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcriber.py <video_path>", file=sys.stderr)
        sys.exit(1)
        
    video_path = sys.argv[1]
    transcribe_video(video_path)