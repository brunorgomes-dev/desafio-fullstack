import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const [, token] = authHeader.split(' ');

  // Se o header vier fora do padrão Bearer token, interrompemos antes da validação
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    // Mantemos um fallback para desenvolvimento local quando a variável não estiver definida
    const secret = process.env.JWT_SECRET ?? 'fallback_secret';
    const decoded = jwt.verify(token, secret) as unknown as { userId: number };

    (req as any).user = { id: decoded.userId };

    // O return aqui garante que a função pare e o Express siga para o próximo passo
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
