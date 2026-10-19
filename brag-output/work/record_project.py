#!/usr/bin/env python3
"""
Record the Yozigo Cinemas project demo using:
1. Google Chrome to render the live app
2. ffmpeg X11 grab for screen capture
3. python-Xlib for mouse movement simulation (no tkinter needed)
"""

import subprocess
import time
import os
import sys
import threading
import math

DISPLAY_STR = ":0"
XAUTHORITY = "/run/user/1000/.mutter-Xwaylandauth.8VSCX3"
APP_URL = "http://localhost:5173"
OUTPUT_FILE = "/home/siva/Desktop/movie-booking-system/brag-output/project_recording.mp4"
RECORDING_DURATION = 80  # seconds

os.environ["DISPLAY"] = DISPLAY_STR
os.environ["XAUTHORITY"] = XAUTHORITY

def get_display():
    from Xlib import display, X
    import Xlib.ext.xtest
    return display.Display(DISPLAY_STR), X, Xlib.ext.xtest

def smooth_move(d, X, xtest, x, y, steps=40, delay=0.02):
    """Smoothly move mouse from current position to (x, y)."""
    # Get current position
    root = d.screen().root
    geom = root.query_pointer()
    cx, cy = geom.root_x, geom.root_y
    
    for i in range(1, steps + 1):
        t = i / steps
        # Ease in-out cubic
        t = 3*t*t - 2*t*t*t
        nx = int(cx + (x - cx) * t)
        ny = int(cy + (y - cy) * t)
        xtest.fake_input(d, X.MotionNotify, x=nx, y=ny)
        d.flush()
        time.sleep(delay)

def click(d, X, xtest, button=1):
    """Click the mouse."""
    xtest.fake_input(d, X.ButtonPress, button)
    d.flush()
    time.sleep(0.05)
    xtest.fake_input(d, X.ButtonRelease, button)
    d.flush()

def scroll_down(d, X, xtest, times=3):
    for _ in range(times):
        xtest.fake_input(d, X.ButtonPress, 5)  # scroll down
        d.flush()
        time.sleep(0.03)
        xtest.fake_input(d, X.ButtonRelease, 5)
        d.flush()
        time.sleep(0.1)

def scroll_up(d, X, xtest, times=3):
    for _ in range(times):
        xtest.fake_input(d, X.ButtonPress, 4)  # scroll up
        d.flush()
        time.sleep(0.03)
        xtest.fake_input(d, X.ButtonRelease, 4)
        d.flush()
        time.sleep(0.1)

def simulate_demo():
    """Run the full demo interaction flow."""
    d, X, xtest = get_display()
    
    print("🖱️ Demo simulation started...")
    time.sleep(3)  # Let Chrome settle
    
    # === Phase 1: Show the Homepage (0s-15s) ===
    print("   Phase 1: Homepage movie browsing...")
    smooth_move(d, X, xtest, 960, 100, steps=30, delay=0.03)
    time.sleep(2)
    
    # Hover over movie cards one by one
    movie_cards = [
        (250, 380), (510, 380), (770, 380), (1030, 380), (1290, 380)
    ]
    for mx, my in movie_cards:
        smooth_move(d, X, xtest, mx, my, steps=25, delay=0.025)
        time.sleep(1.8)
    
    # Scroll down to show more content
    smooth_move(d, X, xtest, 960, 500)
    time.sleep(0.5)
    scroll_down(d, X, xtest, 4)
    time.sleep(2)
    
    # === Phase 2: Click on a movie ===
    print("   Phase 2: Clicking Dark Knight Rises...")
    smooth_move(d, X, xtest, 770, 400, steps=25, delay=0.025)
    time.sleep(1)
    click(d, X, xtest)
    time.sleep(4)  # Wait for movie detail page
    
    # === Phase 3: Movie Detail Page ===
    print("   Phase 3: Movie details & showtime selection...")
    smooth_move(d, X, xtest, 960, 300, steps=20)
    time.sleep(2)
    
    # Scroll down to showtimes
    scroll_down(d, X, xtest, 5)
    time.sleep(1.5)
    
    # Click on an IMAX showtime button (look around middle of page)
    smooth_move(d, X, xtest, 480, 520, steps=20, delay=0.025)
    time.sleep(0.8)
    click(d, X, xtest)
    time.sleep(3.5)
    
    # === Phase 4: Seat Matrix ===
    print("   Phase 4: Seat selection...")
    smooth_move(d, X, xtest, 960, 300, steps=20)
    time.sleep(1.5)
    
    # Slowly scan across the seat grid
    for x_pos in range(300, 1600, 60):
        smooth_move(d, X, xtest, x_pos, 480, steps=5, delay=0.015)
    time.sleep(0.5)
    
    # Select D5
    smooth_move(d, X, xtest, 680, 490, steps=25, delay=0.025)
    time.sleep(0.5)
    click(d, X, xtest)
    time.sleep(0.8)
    
    # Select D6
    smooth_move(d, X, xtest, 725, 490, steps=15, delay=0.02)
    time.sleep(0.5)
    click(d, X, xtest)
    time.sleep(1.5)
    
    # Show the price counter
    smooth_move(d, X, xtest, 960, 700, steps=25, delay=0.03)
    time.sleep(2)
    
    # === Phase 5: Proceed to Checkout ===
    print("   Phase 5: Checkout...")
    # Scroll down to find Book Now button
    scroll_down(d, X, xtest, 3)
    time.sleep(0.5)
    smooth_move(d, X, xtest, 960, 750, steps=20)
    time.sleep(0.5)
    click(d, X, xtest)
    time.sleep(3.5)
    
    # === Phase 6: Food & Beverage ===
    print("   Phase 6: Food selection...")
    smooth_move(d, X, xtest, 960, 300, steps=20)
    time.sleep(2)
    
    # Hover over food items
    smooth_move(d, X, xtest, 380, 450, steps=20)
    time.sleep(1.5)
    click(d, X, xtest)
    time.sleep(0.8)
    smooth_move(d, X, xtest, 650, 450, steps=15)
    time.sleep(1)
    
    # Scroll and continue
    scroll_down(d, X, xtest, 3)
    time.sleep(0.5)
    smooth_move(d, X, xtest, 960, 700, steps=20)
    time.sleep(0.5)
    click(d, X, xtest)
    time.sleep(3.5)
    
    # === Phase 7: Booking Confirmation / QR Code ===
    print("   Phase 7: Booking confirmation...")
    smooth_move(d, X, xtest, 960, 300, steps=20)
    time.sleep(2.5)
    
    # Hover around QR code / confirmation card
    smooth_move(d, X, xtest, 960, 450, steps=20)
    time.sleep(2)
    smooth_move(d, X, xtest, 960, 550, steps=15)
    time.sleep(2)
    smooth_move(d, X, xtest, 960, 400, steps=15)
    time.sleep(3)
    
    print("   ✅ Demo simulation complete!")

def launch_chrome():
    env = {**os.environ, "DISPLAY": DISPLAY_STR, "XAUTHORITY": XAUTHORITY}
    proc = subprocess.Popen([
        "google-chrome",
        "--new-window",
        "--start-maximized",
        "--disable-extensions",
        "--disable-notifications",
        "--disable-infobars",
        "--window-size=1920,1080",
        APP_URL
    ], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"🌐 Chrome PID: {proc.pid}")
    return proc

def start_recording():
    env = {**os.environ, "DISPLAY": DISPLAY_STR, "XAUTHORITY": XAUTHORITY}
    cmd = [
        "ffmpeg", "-y",
        "-f", "x11grab",
        "-video_size", "1920x1080",
        "-framerate", "30",
        "-i", f"{DISPLAY_STR}.0",
        "-t", str(RECORDING_DURATION),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "20",
        "-pix_fmt", "yuv420p",
        OUTPUT_FILE
    ]
    proc = subprocess.Popen(cmd, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"📹 FFmpeg PID: {proc.pid}")
    return proc

def main():
    print("=" * 60)
    print("Yozigo Cinemas — Live Project Demo Recorder")
    print("=" * 60)
    
    # Launch Chrome
    chrome_proc = launch_chrome()
    time.sleep(5)
    
    # Start screen recording
    ffmpeg_proc = start_recording()
    time.sleep(1)
    
    # Simulate demo in a background thread
    demo_thread = threading.Thread(target=simulate_demo, daemon=True)
    demo_thread.start()
    
    print(f"\n⏳ Recording for {RECORDING_DURATION} seconds...")
    ffmpeg_proc.wait()
    
    try:
        chrome_proc.terminate()
    except Exception:
        pass
    
    if os.path.exists(OUTPUT_FILE):
        size = os.path.getsize(OUTPUT_FILE)
        print(f"\n✅ Project recording saved: {OUTPUT_FILE}")
        print(f"   Size: {size // (1024*1024)} MB")
    else:
        print("❌ Recording failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
