import request from 'supertest';

import { app } from '../../src/app';

type AuthUserResult = {
  token: string;
  userId: number;
  email: string;
  name: string;
  password: string;
};

export const createAuthenticatedUser = async (): Promise<AuthUserResult> => {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const email = `tester_${suffix}@mail.com`;
  const name = `Tester ${suffix}`;
  const password = '123456';

  const registerResponse = await request(app).post('/auth/register').send({
    name,
    email,
    password
  });

  if (registerResponse.status !== 201) {
    throw new Error(`Failed to register test user: ${registerResponse.text}`);
  }

  const loginResponse = await request(app).post('/auth/login').send({
    email,
    password
  });

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to login test user: ${loginResponse.text}`);
  }

  return {
    token: loginResponse.body.token as string,
    userId: loginResponse.body.user.id as number,
    email,
    name,
    password
  };
};
