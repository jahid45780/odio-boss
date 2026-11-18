const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, 'Invalid image format. Allowed: JPEG, PNG, WebP, SVG.'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
