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
      orderBy: { createdAt: 'desc' }
    });

    return res.json(tasks);
  } catch (error) {
    console.error("Erro no getTasks:", error);
    return res.status(500).json({ error: 'Erro ao buscar tarefas filtradas.' });
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