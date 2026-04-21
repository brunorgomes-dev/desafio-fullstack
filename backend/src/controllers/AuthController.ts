import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import prisma from '../config/database';
import { logError, logInfo, logWarn } from '../utils/logger';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      logWarn('auth.register.email_in_use', { email });
      return res.status(400).json({ error: 'Este e-mail ja esta em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    logInfo('auth.register.success', { email });
    return res.status(201).json({ message: 'Usuario criado com sucesso!' });
  } catch (error) {
    logError('auth.register.error', error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuario.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logWarn('auth.login.invalid_credentials', { email });
      return res.status(401).json({ error: 'E-mail ou senha invalidos.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logWarn('auth.login.invalid_credentials', { email });
      return res.status(401).json({ error: 'E-mail ou senha invalidos.' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '1d' }
    );

    logInfo('auth.login.success', { userId: user.id, email: user.email });
    return res.json({
      message: 'Login realizado com sucesso!',
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    logError('auth.login.error', error);
    return res.status(500).json({ error: 'Erro ao realizar login.' });
  }
};
