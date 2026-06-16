import yt_dlp
from pydub import AudioSegment
import os
import shutil

DOWNLOAD_DIR = "downloads/"

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def _get_ffmpeg_location() -> str | None:
    return os.getenv("FFMPEG_LOCATION") or shutil.which("ffmpeg")


def _get_ffmpeg_directory() -> str | None:
    ffmpeg_location = _get_ffmpeg_location()

    if not ffmpeg_location:
        return None

    if os.path.isdir(ffmpeg_location):
        return ffmpeg_location

    return os.path.dirname(ffmpeg_location)

def download_youtube_audio(url: str) -> str:
    output_path = os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s")
    ffmpeg_location = _get_ffmpeg_directory()

    if not ffmpeg_location:
        raise RuntimeError(
            "ffmpeg/ffprobe were not found. Install FFmpeg and add it to PATH, or set the FFMPEG_LOCATION environment variable."
        )

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "ffmpeg_location": ffmpeg_location,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
        "quiet": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info).replace(".webm", ".wav").replace(".m4a", ".wav")
    return filename 

def convert_to_wav(input_path: str) -> str:
    """Convert any audio/video file to WAV format."""
    output_path = os.path.splitext(input_path)[0] + "_converted.wav"
    ffmpeg_executable = _get_ffmpeg_location()

    if not ffmpeg_executable:
        raise RuntimeError(
            "ffmpeg/ffprobe were not found. Install FFmpeg and add it to PATH, or set the FFMPEG_LOCATION environment variable."
        )

    AudioSegment.converter = ffmpeg_executable
    AudioSegment.ffprobe = shutil.which("ffprobe") or ffmpeg_executable
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(16000) #best for whisper
    audio.export(output_path, format="wav")
    return output_path

def chunk_audio(wav_path: str, chunk_minutes: int = 5) -> list:
    """Split a WAV file into smaller chunks."""
    audio = AudioSegment.from_wav(wav_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    chunk_length_ms = chunk_minutes * 60 * 1000
    chunks = []
    for i, start in enumerate(range(0, len(audio), chunk_length_ms)):
        chunk = audio[start:start + chunk_length_ms]
        chunk_path = f"{wav_path}_chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)
    return chunks

def process_input(source: str) -> list:
    """Process an input file (YouTube URL or local file) and return a list of WAV chunk paths."""
    if source.startswith("http://") or source.startswith("https://"):
        print("Detected YouTube URL. Downloading audio...")
        wav_path = download_youtube_audio(source)
    else:
        print("Detected local file. Converting to WAV...")
        wav_path = convert_to_wav(source)

    print("Chunking audio into smaller segments...")
    chunks = chunk_audio(wav_path)
    print(f"Audio processing complete. Generated {len(chunks)} chunk(s).")
    return chunks
    
