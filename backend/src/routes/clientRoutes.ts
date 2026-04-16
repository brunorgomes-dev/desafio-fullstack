import { Router } from 'express';
import { createClient, getClients, updateClient, deleteClient, searchCep } from '../controllers/ClientController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas de clientes agora usam o middleware
router.use(authMiddleware); 

router.post('/', createClient);
router.get('/', getClients);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
// ROTA DO CEP: GET /clients/cep/01001000
router.get('/cep/:cep', searchCep);

export default router;
