import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
} from '../controllers/course.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles(['admin', 'instructor']), createCourse);
router.get('/', getCourses);
router.get('/:id', getCourseById);

export default router;
