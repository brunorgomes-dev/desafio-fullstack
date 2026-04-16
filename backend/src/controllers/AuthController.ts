import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import jwt from 'jsonwebtoken'; // importanto Json web token

//Função para registrar
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 1. Verificar se o usuário já existe
    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    // 2. Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Salvar no banco de dados via Prisma
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    return res.status(201).json({ message: 'Usuário criado com sucesso!' });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
};

//Funçao para verificar registro e login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // 2. Comparar a senha digitada com a criptografada
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    // 3. Gerar o Token JWT
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // O que vai dentro do crachá
      secret,                                // A chave para assinar
      { expiresIn: '1d' }                    // Validade de 1 dia
    );

    // 4. Retornar o token e os dados básicos do usuário
    return res.json({
      message: "Login realizado com sucesso!",
      user: { id: user.id, name: user.name, email: user.email },
      token
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao realizar login.' });
  }
};