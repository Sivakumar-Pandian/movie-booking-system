#!/bin/bash
# Record the Yozigo Cinemas project demo using Chrome + ffmpeg X11 capture
# Opens Chrome, navigates through the app, records for ~75 seconds

set -e

DISPLAY=:0
OUTPUT="/home/siva/Desktop/movie-booking-system/brag-output/project_recording.mp4"
APP_URL="http://localhost:5173"
DURATION=75

echo "🎬 Starting project demo recording..."

# Launch Chrome in kiosk-like mode maximized
google-chrome \
  --display=:0 \
  --new-window \
  --start-maximized \
  --disable-extensions \
  --disable-notifications \
  --disable-infobars \
  --app="$APP_URL" \
  --window-size=1920,1080 \
  &
CHROME_PID=$!
echo "Chrome PID: $CHROME_PID"

# Wait for Chrome to open
sleep 4

# Start ffmpeg screen recording
echo "📹 Starting screen capture..."
ffmpeg -y \
  -video_size 1920x1080 \
  -framerate 30 \
  -f x11grab \
  -i :0.0 \
  -t $DURATION \
  -c:v libx264 \
  -preset ultrafast \
  -crf 20 \
  -pix_fmt yuv420p \
  "$OUTPUT" &
FFMPEG_PID=$!
echo "FFmpeg PID: $FFMPEG_PID"

# Mouse automation using xdotool to simulate browsing
sleep 3

echo "🖱️ Simulating mouse movements..."

# Move to center and wait for page load
xdotool mousemove 960 540
sleep 3

# Hover over first movie card (approximately where Leo card would be)
xdotool mousemove --sync 400 400
sleep 2
xdotool mousemove --sync 700 400
sleep 2
xdotool mousemove --sync 1000 400
sleep 2
xdotool mousemove --sync 1300 400
sleep 2

# Scroll down to reveal more content
xdotool key super
sleep 1

# Scroll down
for i in {1..5}; do
  xdotool click 5  # scroll down
  sleep 0.5
done

sleep 2

# Click somewhere visible
xdotool mousemove 700 450
sleep 1
xdotool click 1
sleep 4

# More scrolling and mouse movements
xdotool mousemove 960 300
sleep 2

for i in {1..8}; do
  xdotool click 5
  sleep 0.4
done

sleep 2

xdotool mousemove 500 500
sleep 1
xdotool mousemove 800 500
sleep 1
xdotool mousemove 1100 500
sleep 2

# Scroll back up
for i in {1..10}; do
  xdotool click 4  # scroll up
  sleep 0.3
done

sleep 3

echo "⏳ Waiting for recording to finish ($DURATION seconds)..."
wait $FFMPEG_PID

echo "✅ Recording complete: $OUTPUT"
kill $CHROME_PID 2>/dev/null || true
