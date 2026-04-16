import { Request, Response } from 'express';
import prisma from '../config/database';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, dueDate, clientId } = req.body;

    // Validação básica de obrigatoriedade
    if (!title || !clientId) {
      return res.status(400).json({ error: 'Título e Cliente são obrigatórios.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId: Number(clientId)
      }
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Erro no createTask:", error);
    return res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    // Pegamos os filtros da URL (Ex: ?status=DONE&clientId=1)
    const { status, clientId } = req.query;
    const userId = (req as any).user.id; // Padrão de segurança que definimos

    const tasks = await prisma.task.findMany({
      where: {
        // Filtro 1: A tarefa sempre deve ser de um cliente que pertence ao usuário logado
        client: {
          userId: userId
        },
        // Filtro 2: Se o usuário enviou clientId na URL, filtramos
        ...(clientId && { clientId: Number(clientId) }),
        // Filtro 3: Se o usuário enviou status, filtramos (o Prisma valida o Enum)
        ...(status && { status: status as any })
      },
      // Incluimos os dados basicos do cliente para facilitar a exibicao no frontend
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
    console.error("Erro no getTasks:", error);
    return res.status(500).json({ error: 'Erro ao buscar tarefas filtradas.' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate, clientId } = req.body;
    const userId = (req as any).user.id;

    // Primeiro garantimos que a tarefa pertence a um cliente do usuario logado
    const taskExists = await prisma.task.findFirst({
      where: {
        id: Number(id),
        client: {
          userId
        }
      }
    });

    if (!taskExists) {
      return res.status(404).json({ error: 'Tarefa nao encontrada.' });
    }

    // Se o cliente for alterado, validamos se o novo cliente tambem pertence ao usuario
    if (clientId) {
      const clientExists = await prisma.client.findFirst({
        where: {
          id: Number(clientId),
          userId
        }
      });

      if (!clientExists) {
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

    return res.json(updatedTask);
  } catch (error) {
    console.error("Erro no updateTask:", error);
    return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // O usuário envia "PENDING", "DOING" ou "DONE"

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { status } // O Prisma valida automaticamente se o valor existe no Enum
    });

    return res.json(updatedTask);
  } catch (error) {
    // Se o status for inválido, o Prisma lança um erro específico
    return res.status(400).json({ error: 'Status inválido. Use PENDING, DOING ou DONE.' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id: Number(id) }
    });

    // 204 significa "Sucesso, mas sem conteúdo para exibir"
    return res.status(204).send();
    
  } catch (error) {
    console.error("Erro no deleteTask:", error);
    return res.status(404).json({ error: 'Tarefa não encontrada ou já removida.' });
  }
};
