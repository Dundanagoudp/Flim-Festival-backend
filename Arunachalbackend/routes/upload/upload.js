// routes/uploads.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { getUploadsRoot } from '../../utils/fileStorage.js';

const Uploadrouter = express.Router();

// Helper: secure filename check (no traversal, no absolute paths)
function isValidFilename(filename) {
  if (!filename || typeof filename !== 'string') return false;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false;
  // optionally: further validation (allowed chars, ext check) here
  return true;
}

// OPTIONS preflight for thumbnails (specific route)
Uploadrouter.options('/VideoBlog/thumbnails/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// OPTIONS preflight for video streaming (range requests)
Uploadrouter.options('/VideoBlog/videos/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Range');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// Video streaming route (range support)
Uploadrouter.get('/VideoBlog/videos/:filename', (req, res) => {
  try {
    const filename = req.params.filename;

    if (!isValidFilename(filename)) {
      return res.status(400).send('Invalid filename');
    }

    const videoPath = path.join(getUploadsRoot(), 'VideoBlog', 'videos', filename);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).send('Video not found');
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Caching + content headers (CORS handled by main middleware)
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Range');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'video/mp4'); // change if you serve other types
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (range) {
      // parse "bytes=start-end"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
        return res.status(416).set('Content-Range', `bytes */${fileSize}`).send('Range Not Satisfiable');
      }

      const chunkSize = (end - start) + 1;
      const stream = fs.createReadStream(videoPath, { start, end });
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize,
        'Accept-Ranges': 'bytes',
        //'Content-Type': 'video/mp4' // already set above
      };

      res.writeHead(206, headers);
      stream.pipe(res);

      stream.on('error', (err) => {
        console.error('Video stream error:', err);
        if (!res.headersSent) res.status(500).send('Stream error');
      });

    } else {
      // send whole file
      const stream = fs.createReadStream(videoPath);
      res.writeHead(200, { 'Content-Length': fileSize });
      stream.pipe(res);

      stream.on('error', (err) => {
        console.error('Video stream error:', err);
        if (!res.headersSent) res.status(500).send('Stream error');
      });
    }
  } catch (err) {
    console.error('Video route error:', err);
    if (!res.headersSent) res.status(500).send('Internal server error');
  }
});

// Middleware for other uploads (images, thumbnails) — sets headers based on extension
Uploadrouter.use((req, res, next) => {
  const filePath = req.path.toLowerCase();

  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  const imageMimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };

  for (const [ext, mimeType] of Object.entries(imageMimeTypes)) {
    if (filePath.endsWith(ext)) {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      break;
    }
  }

  next();
});

// Serve static files from uploads directory
// NOTE: This will handle all /uploads/* static serving when mounted at root path in app.
const uploadsRoot = getUploadsRoot();
Uploadrouter.use('/', express.static(uploadsRoot, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (filePath.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Accept-Ranges', 'bytes');
    }

    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

export default Uploadrouter;
