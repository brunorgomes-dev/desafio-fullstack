import { Request, Response } from 'express';

import prisma from '../config/database';
import { logError, logInfo, logWarn } from '../utils/logger';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, dueDate, clientId } = req.body;

    if (!title || !clientId) {
      return res.status(400).json({ error: 'Titulo e cliente sao obrigatorios.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId: Number(clientId)
      }
    });

    logInfo('task.create.success', { taskId: task.id, clientId: Number(clientId) });
    return res.status(201).json(task);
  } catch (error) {
    logError('task.create.error', error);
    return res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { status, clientId } = req.query;
    const userId = (req as any).user.id;

    const tasks = await prisma.task.findMany({
      where: {
        client: {
          userId
        },
        ...(clientId && { clientId: Number(clientId) }),
        ...(status && { status: status as any })
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(tasks);
  } catch (error) {
    logError('task.list.error', error);
    return res.status(500).json({ error: 'Erro ao buscar tarefas filtradas.' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate, clientId } = req.body;
    const userId = (req as any).user.id;

    const taskExists = await prisma.task.findFirst({
      where: {
        id: Number(id),
        client: {
          userId
        }
      }
    });

    if (!taskExists) {
      logWarn('task.update.not_found', { taskId: Number(id), userId });
      return res.status(404).json({ error: 'Tarefa nao encontrada.' });
    }

    if (clientId) {
      const clientExists = await prisma.client.findFirst({
        where: {
          id: Number(clientId),
          userId
        }
      });

      if (!clientExists) {
        logWarn('task.update.invalid_client', { taskId: Number(id), clientId: Number(clientId), userId });
        return res.status(404).json({ error: 'Cliente nao encontrado para vincular a tarefa.' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId: Number(clientId)
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    logInfo('task.update.success', { taskId: updatedTask.id, userId });
    return res.json(updatedTask);
  } catch (error) {
    logError('task.update.error', error, { taskId: Number(req.params.id) });
    return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { status }
    });

    logInfo('task.update_status.success', { taskId: updatedTask.id, status });
    return res.json(updatedTask);
  } catch (error) {
    logWarn('task.update_status.invalid', { taskId: Number(req.params.id), status: req.body?.status });
    return res.status(400).json({ error: 'Status invalido. Use PENDING, DOING ou DONE.' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id: Number(id) }
    });

    logInfo('task.delete.success', { taskId: Number(id) });
    return res.status(204).send();
  } catch (error) {
    logWarn('task.delete.not_found', { taskId: Number(req.params.id) });
    return res.status(404).json({ error: 'Tarefa nao encontrada ou ja removida.' });
  }
};
