const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
const THUMBS_DIR = path.join(DATA_DIR, 'thumbnails');
const META_FILE = path.join(DATA_DIR, 'metadata.json');

// Ensure directories exist
[VIDEOS_DIR, THUMBS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Ensure metadata file exists
if (!fs.existsSync(META_FILE)) {
  fs.writeFileSync(META_FILE, JSON.stringify([], null, 2));
}

app.use(cors());
app.use(express.json());
app.use('/static/videos', express.static(VIDEOS_DIR));
app.use('/static/thumbnails', express.static(THUMBS_DIR));

// --- Helpers ---

function loadMetadata() {
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveMetadata(data) {
  fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
}

function generateThumbnail(videoPath, thumbnailPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['10%'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '640x360',
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

function getVideoDuration(videoPath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err || !metadata || !metadata.format) {
        resolve(0);
        return;
      }
      resolve(parseFloat(metadata.format.duration) || 0);
    });
  });
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Multer config ---

const storage = multer.diskStorage({
  destination: VIDEOS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${base}_${Date.now()}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|mov|avi|mkv|webm|m4v)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: mp4, mov, avi, mkv, webm, m4v'));
    }
  },
});

// --- Routes ---

// Serve frontend (built React app)
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
}

// List all videos
app.get('/api/videos', (_req, res) => {
  const meta = loadMetadata();
  const videos = meta.map((v) => ({
    ...v,
    videoUrl: `/static/videos/${v.filename}`,
    thumbnailUrl: `/static/thumbnails/${v.thumbnail}`,
    durationFormatted: formatDuration(v.duration || 0),
  }));
  res.json(videos);
});

// Upload a video
app.post('/api/videos', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { title, description } = req.body;
  const filename = req.file.filename;
  const videoPath = req.file.path;
  const thumbName = filename.replace(/\.[^.]+$/, '.jpg');
  const thumbPath = path.join(THUMBS_DIR, thumbName);

  let duration = 0;
  try {
    duration = await getVideoDuration(videoPath);
  } catch { /* ignore */ }

  try {
    await generateThumbnail(videoPath, thumbPath);
  } catch {
    // Thumbnail generation failed — frontend will show a fallback icon
  }

  const entry = {
    id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
    description: description || '',
    filename,
    thumbnail: thumbName,
    size: req.file.size,
    duration,
    uploadedAt: new Date().toISOString(),
  };

  const meta = loadMetadata();
  meta.unshift(entry);
  saveMetadata(meta);

  res.status(201).json({
    ...entry,
    videoUrl: `/static/videos/${entry.filename}`,
    thumbnailUrl: `/static/thumbnails/${entry.thumbnail}`,
    durationFormatted: formatDuration(entry.duration),
  });
});

// Delete a video
app.delete('/api/videos/:id', (req, res) => {
  const meta = loadMetadata();
  const entry = meta.find((v) => v.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Video not found' });

  // Delete files
  [path.join(VIDEOS_DIR, entry.filename), path.join(THUMBS_DIR, entry.thumbnail)].forEach((f) => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  const updated = meta.filter((v) => v.id !== req.params.id);
  saveMetadata(updated);
  res.json({ success: true });
});

// Update video metadata (title, description)
app.patch('/api/videos/:id', (req, res) => {
  const meta = loadMetadata();
  const entry = meta.find((v) => v.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Video not found' });

  if (req.body.title !== undefined) entry.title = req.body.title;
  if (req.body.description !== undefined) entry.description = req.body.description;

  saveMetadata(meta);
  res.json(entry);
});

// Stream video with range support
app.get('/api/stream/:filename', (req, res) => {
  const videoPath = path.join(VIDEOS_DIR, req.params.filename);
  if (!fs.existsSync(videoPath)) return res.status(404).send('Not found');

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(videoPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  const indexPath = path.join(clientBuild, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built. Run npm run build:client');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Cloud server running on http://0.0.0.0:${PORT}`);
});
