import { Router } from 'express';
import multer from 'multer';
import { documentsController } from '../controllers/documentsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Fix UTF-8 encoding for filename
    if (file.originalname) {
      const original = file.originalname;
      try {
        // Try to decode if it's already UTF-8
        const decoded = decodeURIComponent(escape(original));
        file.originalname = decoded;
      } catch (e) {
        // If decoding fails, try latin1 to utf8 conversion
        file.originalname = Buffer.from(original, 'latin1').toString('utf8');
      }
    }
    cb(null, true);
  }
});

router.use(authMiddleware);

router.post('/', upload.single('file'), documentsController.validateUpload, documentsController.upload);
router.post('/multiple', upload.array('files', 20), documentsController.validateMultipleUpload, documentsController.uploadMultiple);
router.post('/folders', documentsController.validateCreateFolder, documentsController.createFolder);
router.get('/', documentsController.getAll);
router.get('/folders', documentsController.getFolders);
router.get('/:id', documentsController.getById);
router.get('/:id/file', documentsController.getFile);
router.put('/:id/content', documentsController.updateContent);
router.put('/:id/move', documentsController.moveToFolder);
router.delete('/:id', documentsController.delete);
router.delete('/folders/:id', documentsController.deleteFolder);

export default router;
