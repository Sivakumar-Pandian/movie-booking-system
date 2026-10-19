#!/usr/bin/env python3
"""
Generate scene-by-scene TTS narration for the Yozigo Cinemas brag video.
Uses gTTS (Google Text-to-Speech) and ffmpeg to create a mixed narration track.
"""

import os
import subprocess
import sys

# Scene narration scripts synced to brag.mp4 timeline
# Format: (start_time_seconds, duration_seconds, text)
SCENES = [
    (0.0, 3.2,
     "Introducing Yozigo Cinemas. A next-generation movie booking system, "
     "built to replace the frustration of outdated cinema apps."),

    (3.2, 5.8,
     "Browse curated blockbusters in Ultra HD and IMAX. "
     "Real-time showtimes, immersive movie cards, and instant city-based filtering."),

    (9.0, 6.2,
     "Interactive seat selection with zero latency. "
     "Choose your seats on a live auditorium grid with tiered pricing — "
     "VIP, Premium, and Standard — all updating instantly."),

    (15.2, 5.8,
     "Seamless checkout with food and beverage combos. "
     "Get your instant digital boarding pass with a verified QR code — no queues, no delays."),

    (21.0, 5.0,
     "Built on React 18 with TypeScript on the frontend, "
     "and FastAPI with Python 3.12 on the backend. "
     "Engineered for speed, built for scale. Yozigo Cinemas — full-stack demo ready."),
]

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(OUTPUT_DIR, "audio")
NARRATION_DIR = os.path.join(OUTPUT_DIR, "narration")
os.makedirs(NARRATION_DIR, exist_ok=True)

def generate_tts(text, output_file, lang="en", tld="co.in"):
    """Generate TTS audio using gTTS."""
    from gtts import gTTS
    print(f"Generating TTS: {output_file}")
    tts = gTTS(text=text, lang=lang, tld=tld, slow=False)
    tts.save(output_file)
    return output_file

def get_audio_duration(audio_file):
    """Get the duration of an audio file using ffprobe."""
    result = subprocess.run([
        "ffprobe", "-v", "quiet", "-print_format", "json",
        "-show_format", audio_file
    ], capture_output=True, text=True)
    import json
    data = json.loads(result.stdout)
    return float(data["format"]["duration"])

def build_narration_track(total_duration=26.0):
    """Build a single narration audio track with TTS at correct timecodes."""
    scene_files = []
    
    for i, (start, duration, text) in enumerate(SCENES):
        mp3_file = os.path.join(NARRATION_DIR, f"scene_{i+1}.mp3")
        generate_tts(text, mp3_file)
        scene_files.append((start, mp3_file))
    
    print("\nCreating timed narration track...")
    
    # Build ffmpeg filter complex for overlaying narrations at correct timestamps
    # First create silence base track
    inputs = ["-f", "lavfi", "-t", str(total_duration), "-i", "anullsrc=r=44100:cl=stereo"]
    
    for _, mp3_file in scene_files:
        inputs.extend(["-i", mp3_file])
    
    # Build filter complex: mix all narrations at their start times
    filter_parts = []
    mix_labels = ["[0]"]  # Start with silence base
    
    for i, (start, _) in enumerate(scene_files):
        in_idx = i + 1
        label = f"[n{i}]"
        # Delay the narration by start_time
        filter_parts.append(f"[{in_idx}]adelay={int(start*1000)}|{int(start*1000)}{label}")
        mix_labels.append(label)
    
    n_inputs = len(mix_labels)
    mix_str = "".join(mix_labels)
    filter_parts.append(f"{mix_str}amix=inputs={n_inputs}:normalize=0[narration]")
    
    filter_complex = ";".join(filter_parts)
    
    narration_track = os.path.join(NARRATION_DIR, "narration_track.mp3")
    
    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[narration]",
        "-t", str(total_duration),
        "-ar", "44100",
        "-ac", "2",
        "-q:a", "2",
        narration_track
    ]
    
    print("Running:", " ".join(cmd[:15]), "...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("STDERR:", result.stderr[-2000:])
        sys.exit(1)
    
    print(f"✅ Narration track created: {narration_track}")
    return narration_track

def mix_narration_with_brag(narration_track, brag_mp4, output_mp4):
    """Mix narration with the existing brag.mp4 audio (BGM)."""
    print("\nMixing narration with brag video...")
    
    # Mix narration at 1.0 volume with existing audio at 0.5 volume
    cmd = [
        "ffmpeg", "-y",
        "-i", brag_mp4,
        "-i", narration_track,
        "-filter_complex",
        "[0:a]volume=0.45[bgm];[1:a]volume=1.0[narr];[bgm][narr]amix=inputs=2:normalize=0[out]",
        "-map", "0:v",
        "-map", "[out]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", "26",
        output_mp4
    ]
    
    print("Running mix command...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("STDERR:", result.stderr[-2000:])
        sys.exit(1)
    
    print(f"✅ Final brag video with narration: {output_mp4}")
    return output_mp4

if __name__ == "__main__":
    brag_mp4 = os.path.join(os.path.dirname(OUTPUT_DIR), "brag.mp4")
    output_mp4 = os.path.join(os.path.dirname(OUTPUT_DIR), "brag_with_narration.mp4")
    
    print("=" * 60)
    print("Yozigo Cinemas — Brag Video Narration Generator")
    print("=" * 60)
    
    narration_track = build_narration_track(total_duration=26.0)
    final_video = mix_narration_with_brag(narration_track, brag_mp4, output_mp4)
    
    print("\n" + "=" * 60)
    print(f"✅ DONE! Output: {final_video}")
    print("=" * 60)
