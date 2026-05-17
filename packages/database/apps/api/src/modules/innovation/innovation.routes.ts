import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as innovationController from './innovation.controller';

const router = Router();

router.use(authenticate);

// Allow all authenticated users to view ideas
router.get('/ideas', authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']), innovationController.getIdeas);

// Restrict creation/updates to ADMIN/MANAGER if needed, or keep for all
router.post('/ideas', authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']), innovationController.createIdea);
router.put('/ideas/:id', authorize(['ADMIN', 'MANAGER']), innovationController.updateIdea);
router.delete('/ideas/:id', authorize(['ADMIN']), innovationController.deleteIdea);

export default router;
