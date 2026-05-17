import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
// import * as techRadarController from './tech-radar.controller'; // Placeholder

const router = Router();

router.use(authenticate);

// Allow all authenticated users to view Tech Radar
router.get('/', authorize(['ADMIN', 'MANAGER', 'EMPLOYEE']), (req, res) => {
    // Placeholder implementation if controller is missing
    res.json({ message: "Tech Radar data" });
});

// Admin-only for management
router.post('/', authorize(['ADMIN']), (req, res) => res.sendStatus(201));
router.put('/:id', authorize(['ADMIN']), (req, res) => res.sendStatus(200));
router.delete('/:id', authorize(['ADMIN']), (req, res) => res.sendStatus(204));

export default router;
