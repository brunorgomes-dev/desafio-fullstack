import { Request, Response } from 'express';
import prisma from '../config/database';
import { getAddressByCep } from '../services/cepService';

export const createClient = async (req: Request, res: Response) => {
  try {
    // Agora desestruturamos os novos campos vindos da migration
    const { name, email, phone, cep, street, number, neighbor, city, state } = req.body;
    const userId = (req as any).user.id;

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        cep,
        street,
        number,
        neighbor,
        city,
        state,
        userId
      }
    });

    return res.status(201).json(client);
  } catch (error) {
    console.error("Erro no createClient:", error);
    return res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const clients = await prisma.client.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(clients);
  } catch (error) {
    console.error("Erro no getClients:", error);
    // Verificamos se os headers já foram enviados antes de tentar enviar o erro
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
  }
};

export const searchCep = async (req: Request, res: Response) => {
  try {
    const { cep } = req.params;
    console.log("CEP Recebido no Backend:", cep);
    const cleanCep = cep.replace(/\D/g, ''); // Limpa pontos e traços

    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido.' });
    }

    const data = await getAddressByCep(cleanCep);

    if (data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado.' });
    }

    return res.json({
      street: data.logradouro,
      neighbor: data.bairro,
      city: data.localidade,
      state: data.uf
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar CEP.' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: { id: Number(id) }
    });

    return res.status(204).send();
    
  } catch (error) {
    console.error("Erro no deleteClient:", error);
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }
};