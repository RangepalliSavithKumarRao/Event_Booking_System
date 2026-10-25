const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`),
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
  const err = new Error('Only image files (jpg, png, webp, gif) are allowed');
  err.status = 400;
  cb(err);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
