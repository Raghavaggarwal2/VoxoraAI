import json
import os
import shutil
import subprocess
import yt_dlp
from pydub import AudioSegment

DOWNLOAD_DIR = "downloads/"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


class YouTubeVerificationRequiredError(RuntimeError):
    """Raised when YouTube requires sign-in, bot check, or interactive verification."""
    pass


class YouTubeAccessDeniedError(RuntimeError):
    """Raised when YouTube media is private, age-restricted, or unavailable."""
    pass


class NoAudioStreamError(RuntimeError):
    """Raised when an uploaded video or media file does not contain an audio track."""
    pass


class EmptyAudioError(RuntimeError):
    """Raised when the audio file is empty or has zero duration."""
    pass


class AudioConversionError(RuntimeError):
    """Raised when media audio conversion fails."""
    pass


def _get_ffmpeg_location() -> str | None:
    return os.getenv("FFMPEG_LOCATION") or shutil.which("ffmpeg")


def _get_ffprobe_location() -> str | None:
    probe = shutil.which("ffprobe")
    if probe:
        return probe
    ffmpeg_loc = _get_ffmpeg_location()
    if ffmpeg_loc:
        ffmpeg_dir = os.path.dirname(ffmpeg_loc) if not os.path.isdir(ffmpeg_loc) else ffmpeg_loc
        candidate = os.path.join(ffmpeg_dir, "ffprobe.exe" if os.name == "nt" else "ffprobe")
        if os.path.exists(candidate):
            return candidate
    return None


def _get_ffmpeg_directory() -> str | None:
    ffmpeg_location = _get_ffmpeg_location()
    if not ffmpeg_location:
        return None
    if os.path.isdir(ffmpeg_location):
        return ffmpeg_location
    return os.path.dirname(ffmpeg_location)


def has_audio_stream(input_path: str) -> bool:
    """
    Check if a media file contains at least one valid audio stream using ffprobe.
    """
    ffprobe_executable = _get_ffprobe_location()
    if not ffprobe_executable or not os.path.exists(input_path):
        return True  # Fallback: assume present if probe tool is not available

    try:
        cmd = [
            ffprobe_executable,
            "-v", "error",
            "-select_streams", "a",
            "-show_entries", "stream=index,codec_name",
            "-of", "json",
            input_path,
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if res.returncode == 0 and res.stdout:
            data = json.loads(res.stdout)
            streams = data.get("streams", [])
            return len(streams) > 0
    except Exception as e:
        print(f"Notice: ffprobe audio stream check returned non-fatal error: {e}")

    # Secondary check: if ffprobe JSON failed, try probing via ffmpeg null muxer
    ffmpeg_executable = _get_ffmpeg_location()
    if ffmpeg_executable:
        try:
            cmd = [
                ffmpeg_executable,
                "-y",
                "-i", input_path,
                "-vn",
                "-t", "0.1",
                "-f", "null",
                "-",
            ]
            probe_res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            err_output = (probe_res.stderr or "").lower()
            if "does not contain any stream" in err_output or "matches no streams" in err_output:
                return False
        except Exception:
            pass

    return True


def download_youtube_audio(url: str, output_dir: str = None) -> str:
    target_dir = output_dir or DOWNLOAD_DIR
    os.makedirs(target_dir, exist_ok=True)
    output_path = os.path.join(target_dir, "%(title)s.%(ext)s")
    ffmpeg_location = _get_ffmpeg_directory()

    if not ffmpeg_location:
        raise RuntimeError(
            "ffmpeg/ffprobe were not found. Install FFmpeg and add it to PATH, or set the FFMPEG_LOCATION environment variable."
        )

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "ffmpeg_location": ffmpeg_location,
        "noplaylist": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
        "quiet": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # Handle playlist info dict edge case if single entry
            if "entries" in info and info["entries"]:
                info = info["entries"][0]
            prep_name = ydl.prepare_filename(info)
            base_name = os.path.splitext(prep_name)[0]
            target_wav = f"{base_name}.wav"

            if os.path.exists(target_wav):
                return target_wav

            # Fallback scan in output directory for most recently written wav
            wav_files = [
                os.path.join(target_dir, f)
                for f in os.listdir(target_dir)
                if f.lower().endswith(".wav")
            ]
            if wav_files:
                return max(wav_files, key=os.path.getmtime)

            return target_wav
    except Exception as e:
        msg = str(e).lower()
        if "confirm you're not a bot" in msg or "sign in" in msg or "bot" in msg or "403" in msg:
            raise YouTubeVerificationRequiredError(
                "YouTube requires sign-in or bot verification for this video. Automated stream extraction was not permitted. Please upload a local media file directly."
            ) from e
        if "private video" in msg or "members-only" in msg or "age" in msg or "unavailable" in msg:
            raise YouTubeAccessDeniedError(
                f"Video is private, restricted, or unavailable on YouTube: {str(e)}"
            ) from e
        raise


def convert_to_wav(input_path: str, output_path: str = None) -> str:
    """
    Convert any audio/video file directly to 16kHz mono WAV format suitable for Whisper.
    Proactively checks for audio streams to prevent empty stream errors.
    """
    if not output_path:
        output_path = os.path.splitext(input_path)[0] + "_converted.wav"

    ffmpeg_executable = _get_ffmpeg_location()
    if not ffmpeg_executable:
        raise RuntimeError(
            "ffmpeg/ffprobe were not found. Install FFmpeg and add it to PATH, or set the FFMPEG_LOCATION environment variable."
        )

    # 1. Proactively verify that the media file actually has an audio stream
    if not has_audio_stream(input_path):
        raise NoAudioStreamError(
            "The selected media file does not contain an audio track. "
            "Please provide a video or audio file with audible speech."
        )

    # 2. Extract and convert directly via FFmpeg for high performance and low memory
    cmd = [
        ffmpeg_executable,
        "-y",
        "-i", input_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        err_msg = (result.stderr or "").lower()
        if "does not contain any stream" in err_msg or "matches no streams" in err_msg:
            raise NoAudioStreamError(
                "The selected media file does not contain an audio track. "
                "Please provide a video or audio file with audible speech."
            )

        # Fallback to pydub if direct ffmpeg invocation failed for non-stream reasons
        try:
            AudioSegment.converter = ffmpeg_executable
            AudioSegment.ffprobe = _get_ffprobe_location() or ffmpeg_executable
            audio = AudioSegment.from_file(input_path)
            audio = audio.set_channels(1).set_frame_rate(16000)
            audio.export(output_path, format="wav")
            return output_path
        except IndexError as e:
            raise NoAudioStreamError(
                "The selected media file does not contain an audio track. "
                "Please provide a video or audio file with audible speech."
            ) from e
        except Exception as e:
            raise AudioConversionError(f"Audio conversion failed: {result.stderr or str(e)}") from e

    # 3. Verify the converted file exists and has data beyond standard 44-byte WAV header
    if not os.path.exists(output_path) or os.path.getsize(output_path) <= 44:
        raise EmptyAudioError("The generated audio file is empty or contains no audible data.")

    return output_path


def chunk_audio(wav_path: str, chunk_minutes: int = 5, output_dir: str = None) -> list:
    """Split a WAV file into smaller chunks for Whisper transcription."""
    if not os.path.exists(wav_path) or os.path.getsize(wav_path) <= 44:
        raise EmptyAudioError("The converted audio is empty or has zero duration.")

    audio = AudioSegment.from_wav(wav_path)
    if len(audio) == 0:
        raise EmptyAudioError("The audio file contains no audible sound or has zero duration.")

    audio = audio.set_channels(1).set_frame_rate(16000)
    chunk_length_ms = chunk_minutes * 60 * 1000
    chunks = []
    for i, start in enumerate(range(0, len(audio), chunk_length_ms)):
        chunk = audio[start:start + chunk_length_ms]
        if output_dir:
            chunk_path = os.path.join(output_dir, f"chunk_{i}.wav")
        else:
            chunk_path = f"{wav_path}_chunk_{i}.wav"
        chunk.export(chunk_path, format="wav")
        chunks.append(chunk_path)

    return chunks


def process_input(source: str, output_dir: str = None) -> list:
    """Process an input file (YouTube URL or local file) and return a list of WAV chunk paths."""
    if source.startswith("http://") or source.startswith("https://"):
        print("Detected YouTube URL. Downloading audio...")
        wav_path = download_youtube_audio(source, output_dir=output_dir)
    else:
        print("Detected local file. Converting to WAV...")
        wav_target = os.path.join(output_dir, "input_converted.wav") if output_dir else None
        wav_path = convert_to_wav(source, output_path=wav_target)

    print("Chunking audio into smaller segments...")
    chunks = chunk_audio(wav_path, output_dir=output_dir)
    print(f"Audio processing complete. Generated {len(chunks)} chunk(s).")
    return chunks
