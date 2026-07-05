const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sw-vision-cloud-secret-change-in-production';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const VIDEOS_DIR = path.join(DATA_DIR, 'videos');
const THUMBS_DIR = path.join(DATA_DIR, 'thumbnails');
const META_FILE = path.join(DATA_DIR, 'metadata.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure directories exist
[VIDEOS_DIR, THUMBS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Ensure metadata file exists
if (!fs.existsSync(META_FILE)) {
  fs.writeFileSync(META_FILE, JSON.stringify([], null, 2));
}

// Ensure users file exists with default admin
function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    const defaultHash = bcrypt.hashSync('admin123', 10);
    const defaultUsers = [
      {
        id: 'user_admin',
        username: 'admin',
        password: defaultHash,
        role: 'admin',
        name: 'Administrator',
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    console.log('Created default admin user: admin / admin123');
  }
}
ensureUsersFile();

app.use(cors());
app.use(express.json());

// --- Auth Helpers ---

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

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

// --- Auth Routes ---

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const users = loadUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name },
  });
});

// Verify token / get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Change password
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || ! newPassword) return res.status(400).json({ error: 'Both passwords required' });

  const users = loadUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password is wrong' });
  }

  user.password = bcrypt.hashSync(newPassword, 10);
  saveUsers(users);
  res.json({ success: true });
});

// --- User Management (admin only) ---

// List users
app.get('/api/users', authMiddleware, adminOnly, (_req, res) => {
  const users = loadUsers().map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    name: u.name,
    createdAt: u.createdAt,
  }));
  res.json(users);
});

// Create user
app.post('/api/users', authMiddleware, adminOnly, (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const users = loadUsers();
  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username,
    password: bcrypt.hashSync(password, 10),
    role: role === 'admin' ? 'admin' : 'user',
    name: name || username,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    name: newUser.name,
    createdAt: newUser.createdAt,
  });
});

// Delete user
app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  if (req.params.id === 'user_admin') return res.status(400).json({ error: 'Cannot delete default admin' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

  const users = loadUsers();
  const filtered = users.filter((u) => u.id !== req.params.id);
  if (filtered.length === users.length) return res.status(404).json({ error: 'User not found' });

  saveUsers(filtered);
  res.json({ success: true });
});

// --- Protected static files ---
app.use('/static/videos', authMiddleware, express.static(VIDEOS_DIR));
app.use('/static/thumbnails', authMiddleware, express.static(THUMBS_DIR));

// List all videos (authenticated — admin sees all, users see assigned)
app.get('/api/videos', authMiddleware, (req, res) => {
  const meta = loadMetadata();
  let filtered = meta;
  if (req.user.role !== 'admin') {
    filtered = meta.filter((v) => v.assignedTo && v.assignedTo.includes(req.user.id));
  }
  const videos = filtered.map((v) => ({
    ...v,
    videoUrl: `/static/videos/${v.filename}`,
    thumbnailUrl: `/static/thumbnails/${v.thumbnail}`,
    durationFormatted: formatDuration(v.duration || 0),
  }));
  res.json(videos);
});

// Upload a video (admin only)
app.post('/api/videos', authMiddleware, adminOnly, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { title, description, assignedTo } = req.body;
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

  let assignedUsers = [];
  try { assignedUsers = JSON.parse(assignedTo || '[]'); } catch { assignedUsers = []; }

  const entry = {
    id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
    description: description || '',
    filename,
    thumbnail: thumbName,
    size: req.file.size,
    duration,
    assignedTo: assignedUsers,
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

// Delete a video (admin only)
app.delete('/api/videos/:id', authMiddleware, adminOnly, (req, res) => {
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

// Update video metadata (admin only)
app.patch('/api/videos/:id', authMiddleware, adminOnly, (req, res) => {
  const meta = loadMetadata();
  const entry = meta.find((v) => v.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Video not found' });

  if (req.body.title !== undefined) entry.title = req.body.title;
  if (req.body.description !== undefined) entry.description = req.body.description;
  if (req.body.assignedTo !== undefined) entry.assignedTo = req.body.assignedTo;

  saveMetadata(meta);
  res.json(entry);
});

// Stream video with range support (authenticated — users only see assigned)
app.get('/api/stream/:filename', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    const meta = loadMetadata();
    const video = meta.find((v) => v.filename === req.params.filename);
    if (!video || !video.assignedTo || !video.assignedTo.includes(req.user.id)) {
      return res.status(403).send('Access denied');
    }
  }
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
