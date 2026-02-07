from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
import moviepy.editor as mp
import tempfile
import os
import shutil
import uuid

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "custom-transcriber"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Create temp paths
    temp_video = f"temp_video_{uuid.uuid4()}.mp4"
    temp_audio = f"temp_audio_{uuid.uuid4()}.wav"
    
    try:
        # Save uploaded file
        with open(temp_video, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract audio using moviepy (Original Logic)
        audio_clip = mp.AudioFileClip(temp_video)
        audio_clip.write_audiofile(temp_audio, verbose=False, logger=None)
        audio_clip.close()
        
        # Transcribe using speech_recognition (Original Logic)
        r = sr.Recognizer()
        with sr.AudioFile(temp_audio) as source:
            data = r.record(source)
            
        # Use whisper via speech_recognition
        text = r.recognize_whisper(data)
        return {"text": text.strip()}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup
        if os.path.exists(temp_video):
            os.remove(temp_video)
        if os.path.exists(temp_audio):
            os.remove(temp_audio)
