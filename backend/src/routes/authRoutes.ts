import { Router } from 'express';
import { register, login } from '../controllers/AuthController'; // Importe o login

const router = Router();

router.post('/register', register);
router.post('/login', login); // Nova rota de login

export default router;