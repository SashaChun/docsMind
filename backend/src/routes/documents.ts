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
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    }
    cb(null, true);
  }
});

router.use(authMiddleware);

router.post('/', upload.single('file'), documentsController.validateUpload, documentsController.upload);
router.get('/', documentsController.getAll);
router.get('/:id', documentsController.getById);
router.put('/:id/content', documentsController.updateContent);
router.delete('/:id', documentsController.delete);

export default router;
