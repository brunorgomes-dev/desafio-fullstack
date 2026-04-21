import { Request, Response } from 'express';

import prisma from '../config/database';
import { getAddressByCep } from '../services/cepService';
import { logError, logInfo, logWarn } from '../utils/logger';

export const createClient = async (req: Request, res: Response) => {
  try {
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

    logInfo('client.create.success', { userId, clientId: client.id });
    return res.status(201).json(client);
  } catch (error) {
    logError('client.create.error', error);
    return res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
};

export const getClients = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      logWarn('client.list.unauthenticated');
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const clients = await prisma.client.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(clients);
  } catch (error) {
    logError('client.list.error', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, cep, street, number, neighbor, city, state } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      logWarn('client.update.unauthenticated', { clientId: Number(id) });
      return res.status(401).json({ error: 'Usuario nao autenticado.' });
    }

    const clientExists = await prisma.client.findFirst({
      where: {
        id: Number(id),
        userId: Number(userId)
      }
    });

    if (!clientExists) {
      logWarn('client.update.not_found', { userId, clientId: Number(id) });
      return res.status(404).json({ error: 'Cliente nao encontrado.' });
    }

    const updatedClient = await prisma.client.update({
      where: { id: Number(id) },
      data: {
        name,
        email,
        phone,
        cep,
        street,
        number,
        neighbor,
        city,
        state
      }
    });

    logInfo('client.update.success', { userId, clientId: updatedClient.id });
    return res.json(updatedClient);
  } catch (error) {
    logError('client.update.error', error, { clientId: Number(req.params.id) });
    return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
};

export const searchCep = async (req: Request, res: Response) => {
  try {
    const cep = String(req.params.cep || '');
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      logWarn('client.cep.invalid', { cep });
      return res.status(400).json({ error: 'CEP invalido.' });
    }

    const data = await getAddressByCep(cleanCep);

    if (data.erro) {
      logWarn('client.cep.not_found', { cep: cleanCep });
      return res.status(404).json({ error: 'CEP nao encontrado.' });
    }

    return res.json({
      street: data.logradouro,
      neighbor: data.bairro,
      city: data.localidade,
      state: data.uf
    });
  } catch (error) {
    logError('client.cep.error', error, { cep: req.params.cep });
    return res.status(500).json({ error: 'Erro ao consultar CEP.' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({
      where: { id: Number(id) }
    });

    logInfo('client.delete.success', { clientId: Number(id) });
    return res.status(204).send();
  } catch (error) {
    logWarn('client.delete.not_found', { clientId: Number(req.params.id) });
    return res.status(404).json({ error: 'Cliente nao encontrado.' });
  }
};
