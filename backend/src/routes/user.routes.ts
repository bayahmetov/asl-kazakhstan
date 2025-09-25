import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { getProfile } from '../controllers/user.controller';

const router = Router();

router.get('/me', authenticateJWT, getProfile);

export default router;
