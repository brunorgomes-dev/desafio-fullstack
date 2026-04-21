import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../src/app';
import { createAuthenticatedUser } from '../helpers/auth';

describe('Tasks E2E', () => {
  it('creates a task linked to a client', async () => {
    const { token } = await createAuthenticatedUser();

    const clientResponse = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente Tarefa',
        email: `task_client_${Date.now()}@mail.com`
      });

    const taskResponse = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarefa inicial',
        description: 'Descricao teste',
        status: 'PENDING',
        clientId: clientResponse.body.id
      });

    expect(taskResponse.status).toBe(201);
    expect(taskResponse.body.title).toBe('Tarefa inicial');
  });

  it('filters tasks by status and clientId', async () => {
    const { token } = await createAuthenticatedUser();

    const clientA = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente Filtro A',
        email: `filtro_a_${Date.now()}@mail.com`
      });

    const clientB = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente Filtro B',
        email: `filtro_b_${Date.now()}@mail.com`
      });

    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task done',
        status: 'DONE',
        clientId: clientA.body.id
      });

    await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task pending',
        status: 'PENDING',
        clientId: clientB.body.id
      });

    const filtered = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'DONE', clientId: clientA.body.id });

    expect(filtered.status).toBe(200);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].title).toBe('Task done');
  });

  it('updates task status and deletes task', async () => {
    const { token } = await createAuthenticatedUser();

    const client = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente Update',
        email: `task_update_${Date.now()}@mail.com`
      });

    const createdTask = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Task update status',
        status: 'PENDING',
        clientId: client.body.id
      });

    const taskId = createdTask.body.id as number;

    const statusResponse = await request(app)
      .patch(`/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'DONE'
      });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe('DONE');

    const deleteResponse = await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });
});
