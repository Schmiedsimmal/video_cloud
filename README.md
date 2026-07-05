# Video Cloud

Professionelle Video-Cloud für Videografen. Läuft in einem Docker-Container auf dem Jetson Nano und ist über das Heimnetz per Browser erreichbar.

## Features

- Drag & Drop Video-Upload (MP4, MOV, AVI, MKV, WebM, M4V — bis 10 GB)
- Automatische Thumbnail-Generierung via FFmpeg
- Professionelles, dunkles UI mit Video-Grid
- Inline-Video-Player mit Streaming (Range-Support)
- Titel & Beschreibung pro Video editierbar
- Videos löschen & herunterladen
- Docker-Volume für persistenten Speicher

## Deployment auf dem Jetson Nano

### 1. Projekt auf den Jetson übertragen

```bash
# Per scp vom Mac zum Jetson
scp -r ./cloud_foto simon@192.168.178.10:~/
```

### 2. Docker Container bauen & starten

Auf dem Jetson Nano (per SSH):

```bash
ssh simon@192.168.178.10
cd ~/cloud_foto
docker compose up -d --build
```

### 3. Im Browser öffnen

```
http://192.168.178.10:3000
```

Die Video-Cloud ist nun von jedem Gerät im Heimnetz erreichbar.

## Lokale Entwicklung

```bash
# Backend + Frontend Dependencies installieren
npm install
cd client && npm install && cd ..

# Frontend builden
npm run build:client

# Server starten
npm start
# → http://localhost:3000
```

Für Hot-Reload Entwicklung (zwei Terminals):

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend (Vite Dev Server)
npm run dev:client
# → http://localhost:5173 (proxyt API an :3000)
```

## Architektur

```
cloud_foto/
├── server/
│   └── index.js          # Express API: Upload, List, Delete, Stream
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/   # Header, VideoGrid, VideoCard, UploadModal, VideoPlayer, EmptyState
│   ├── vite.config.js
│   └── tailwind.config.js
├── data/                 # Videos, Thumbnails, metadata.json (Docker Volume)
├── Dockerfile            # Multi-stage: Frontend-Build + Production-Server
├── docker-compose.yml
└── package.json
```

## Technologie-Stack

- **Backend:** Node.js, Express, Multer, FFmpeg
- **Frontend:** React 18, Vite, TailwindCSS, Lucide Icons
- **Container:** Docker (multi-stage, ARM64-kompatibel für Jetson Nano)

## Hinweise

- Die Videos werden im Docker-Volume `video-data` gespeichert und überleben Container-Neustarts.
- FFmpeg wird im Container installiert für die automatische Thumbnail-Generierung.
- Der Server lauscht auf `0.0.0.0:3000` — im Heimnetz ohne weitere Konfiguration erreichbar.
- Für externen Zugriff (außerhalb Heimnetz) empfiehlt sich ein Reverse Proxy (z.B. nginx) mit Auth.
