import { Router } from 'express';
import { createTask, getTasks, updateTask, updateTaskStatus, deleteTask } from '../controllers/TaskController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus)
router.delete('/:id', deleteTask);

export default router;
