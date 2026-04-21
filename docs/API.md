# API Documentation

Base URL (local with Docker):

- `http://localhost:3334`

Authentication:

- Protected routes require header `Authorization: Bearer <token>`

## Health

### GET `/`

Response `200`:

```json
{
  "message": "API do Desafio Fullstack rodando!"
}
```

## Auth

### POST `/auth/register`

Body:

```json
{
  "name": "Brunno Silva",
  "email": "brunno@email.com",
  "password": "123456"
}
```

Response `201`:

```json
{
  "message": "Usuario criado com sucesso!"
}
```

### POST `/auth/login`

Body:

```json
{
  "email": "brunno@email.com",
  "password": "123456"
}
```

Response `200`:

```json
{
  "message": "Login realizado com sucesso!",
  "user": {
    "id": 1,
    "name": "Brunno Silva",
    "email": "brunno@email.com"
  },
  "token": "jwt-token"
}
```

## Clients

### GET `/clients`

Protected route.

Response `200`: list of clients for the authenticated user.

### POST `/clients`

Protected route.

Body:

```json
{
  "name": "Cliente A",
  "email": "cliente@empresa.com",
  "phone": "(11) 99999-9999",
  "cep": "01001000",
  "street": "Praca da Se",
  "number": "100",
  "neighbor": "Se",
  "city": "Sao Paulo",
  "state": "SP"
}
```

Response `201`: created client object.

### PUT `/clients/:id`

Protected route.

Body: same fields as create.

Response `200`: updated client object.

### DELETE `/clients/:id`

Protected route.

Response `204`: no content.

### GET `/clients/cep/:cep`

Protected route.

Response `200`:

```json
{
  "street": "Praca da Se",
  "neighbor": "Se",
  "city": "Sao Paulo",
  "state": "SP"
}
```

## Tasks

### GET `/tasks`

Protected route.

Query params (optional):

- `status`: `PENDING | DOING | DONE`
- `clientId`: number

Response `200`: list of tasks (includes basic client data).

### POST `/tasks`

Protected route.

Body:

```json
{
  "title": "Ligar para cliente",
  "description": "Confirmar proposta",
  "status": "PENDING",
  "dueDate": "2026-05-01T10:00:00.000Z",
  "clientId": 1
}
```

Response `201`: created task object.

### PUT `/tasks/:id`

Protected route.

Body: same fields as create.

Response `200`: updated task object.

### PATCH `/tasks/:id/status`

Protected route.

Body:

```json
{
  "status": "DONE"
}
```

Response `200`: updated task object.

### DELETE `/tasks/:id`

Protected route.

Response `204`: no content.

## Common errors

- `400`: invalid input
- `401`: missing or invalid token
- `404`: resource not found
- `500`: internal server error
