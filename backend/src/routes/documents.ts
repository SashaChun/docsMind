import { Router } from 'express';
import multer from 'multer';
import { documentsController } from '../controllers/documentsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

router.post('/', upload.single('file'), documentsController.validateUpload, documentsController.upload);
router.get('/', documentsController.getAll);
router.get('/:id', documentsController.getById);
router.put('/:id/content', documentsController.updateContent);
router.delete('/:id', documentsController.delete);

export default router;
