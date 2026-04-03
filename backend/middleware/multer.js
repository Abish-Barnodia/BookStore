import multer from 'multer';
import path from 'path';

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public');

    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const safeBase = path
            .basename(file.originalname || 'upload', ext)
            .replace(/[^a-z0-9-_]/gi, '-')
            .slice(0, 48);
        cb(null, `${Date.now()}-${safeBase}${ext}`);
    }
});

const fileFilter = (_req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) {
        cb(null, true);
        return;
    }
    cb(new Error('Only image uploads are allowed'));
};

let upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;