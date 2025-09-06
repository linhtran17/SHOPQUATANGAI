// backend/src/router/uploadRoutes.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// (Tuỳ chọn) bảo vệ endpoint: chỉ admin mới upload
// const requireAuth = require('../middleware/requireAuth.db');
// const authorize   = require('../middleware/authorize');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename:    (_, file, cb) => {
    const safe = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '-');
    cb(null, safe);
  }
});
const upload = multer({ storage });

const r = express.Router();

/**
 * POST /api/uploads
 * field: "files" (multiple)
 * trả về: { urls: ["http://localhost:3000/uploads/xxx.jpg", ...] }
 */
r.post('/',
//  requireAuth, authorize('product:create'), // 👈 Bật nếu muốn chỉ admin được upload
  upload.array('files', 10),
  (req, res) => {
    const urls = (req.files || []).map(f => {
      const base = `${req.protocol}://${req.get('host')}`;
      return `${base}/uploads/${f.filename}`;
    });
    res.json({ urls });
  }
);

module.exports = r;
