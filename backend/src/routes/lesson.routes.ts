import { Router } from 'express';
import {
  uploadLesson,
  getLessonsByCourse,
} from '../controllers/lesson.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import upload from '../middleware/upload.middleware';

const router = Router();

router.post(
  '/upload',
  authenticateJWT,
  authorizeRoles(['admin', 'instructor']),
  upload.single('video'),
  uploadLesson
);

router.get('/course/:courseId', getLessonsByCourse);

export default router;
