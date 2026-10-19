const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TOTAL_DURATION = 26.0; // 26 seconds
const FPS = 30;
const TOTAL_FRAMES = Math.round(TOTAL_DURATION * FPS); // 780 frames

async function main() {
  console.log(`Starting video render: ${TOTAL_FRAMES} frames @ ${FPS}fps (~${TOTAL_DURATION}s)...`);

  const posterBuf = fs.readFileSync(path.join(__dirname, '../brag.jpg'));

  // Spawn ffmpeg
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', '-',
    '-i', path.join(__dirname, 'audio/soundtrack.mp3'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'faster',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    path.join(__dirname, '../brag.mp4')
  ];

  const ffmpeg = spawn('/home/siva/.local/bin/ffmpeg', ffmpegArgs, {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  ffmpeg.stderr.on('data', (d) => {
    // console.log('FFmpeg:', d.toString());
  });

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file://' + path.join(__dirname, 'render_template.html'), { waitUntil: 'networkidle0' });

  const startTime = Date.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    // Frame 0 is baked with poster as required by /brag specification
    if (frame === 0) {
      ffmpeg.stdin.write(posterBuf);
      continue;
    }

    const t = frame / FPS;
    await page.evaluate((time) => window.seek(time), t);

    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 95
    });

    const canWrite = ffmpeg.stdin.write(buf);
    if (!canWrite) {
      await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    }

    if (frame % 60 === 0 || frame === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = Math.round((frame / TOTAL_FRAMES) * 100);
      console.log(`Rendered frame ${frame}/${TOTAL_FRAMES} (${pct}%) in ${elapsed}s`);
    }
  }

  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  await browser.close();
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Render finished successfully in ${totalElapsed}s!`);
}

main().catch((err) => {
  console.error('Render error:', err);
  process.exit(1);
});
