import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../../src/app';
import { createAuthenticatedUser } from '../helpers/auth';

describe('Clients E2E', () => {
  it('creates a client when authenticated', async () => {
    const { token } = await createAuthenticatedUser();

    const response = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente E2E',
        email: `cliente_${Date.now()}@mail.com`,
        phone: '11999999999',
        cep: '01001000',
        street: 'Praca da Se',
        number: '100',
        neighbor: 'Se',
        city: 'Sao Paulo',
        state: 'SP'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Cliente E2E');
  });

  it('lists only the authenticated user clients', async () => {
    const userA = await createAuthenticatedUser();
    const userB = await createAuthenticatedUser();

    await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        name: 'Cliente A',
        email: `cliente_a_${Date.now()}@mail.com`
      });

    await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({
        name: 'Cliente B',
        email: `cliente_b_${Date.now()}@mail.com`
      });

    const response = await request(app)
      .get('/clients')
      .set('Authorization', `Bearer ${userA.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Cliente A');
  });

  it('updates and deletes a client', async () => {
    const { token } = await createAuthenticatedUser();

    const createResponse = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente para atualizar',
        email: `cliente_update_${Date.now()}@mail.com`
      });

    const clientId = createResponse.body.id as number;

    const updateResponse = await request(app)
      .put(`/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente atualizado',
        email: createResponse.body.email
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Cliente atualizado');

    const deleteResponse = await request(app)
      .delete(`/clients/${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(204);
  });
});
