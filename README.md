# Simple Todo App (React + Node.js + AWS RDS PostgreSQL)

```
Browser ──► frontend (nginx :80) ──/api──► backend (Node/Express :5000) ──► AWS RDS PostgreSQL
```

- `frontend/` – React (Vite). Built into static files and served by nginx. nginx also proxies `/api/*` to the backend, so the browser only talks to one origin.
- `backend/` – Express REST API. Creates the `todos` table automatically on startup.
- `docker-compose.yml` – runs backend + frontend. The database is **not** in Docker; it's AWS RDS.

## 1. Create the RDS database

1. RDS → Create database → **PostgreSQL**, template **Free tier**.
2. Set master username/password, and under *Additional configuration* set **Initial database name** = `todos`.
3. Security group: allow inbound **TCP 5432** from
   - your EC2 instance's security group (for deployment), and/or
   - your own IP (only if you want to run the app from your laptop; also set *Public access = Yes*).
4. Copy the **Endpoint** once the DB is "Available".

## 2. Configure

```bash
cp .env.example .env
# edit .env: DB_HOST=<rds-endpoint>, DB_USER, DB_PASSWORD, DB_NAME=todos, DB_SSL=true
```

## 3. Run with Docker

```bash
docker compose up -d --build
# open http://localhost  (or http://<EC2-public-IP>)
docker compose logs -f backend   # should print "Backend listening on port 5000"
docker compose down
```

If the backend keeps logging `DB not ready ... retrying`, it can't reach RDS. Check the security group, the endpoint, and *Public access* (when connecting from outside AWS).

## Run without Docker (development)

```bash
cd backend && npm install && export $(grep -v '^#' ../.env | xargs) && npm run dev
cd frontend && npm install && npm run dev   # Vite proxies /api to localhost:5000
```

## API

| Method | Path             | Body                               |
|--------|------------------|------------------------------------|
| GET    | /api/health      |                                    |
| GET    | /api/todos       |                                    |
| POST   | /api/todos       | `{ "title": "..." }`               |
| PUT    | /api/todos/:id   | `{ "title"?: "...", "completed"?: true }` |
| DELETE | /api/todos/:id   |                                    |

## Deploying on AWS

1. **EC2 + RDS (start here)**
   - Launch EC2 (Amazon Linux / Ubuntu), security group open on 80 (and 22 for SSH).
   - Add the EC2 security group to the RDS security group's inbound 5432 rule.
   - Install Docker + compose plugin, copy this folder, create `.env`, `docker compose up -d --build`.

2. **ECR + ECS Fargate + ALB (next step)**
   - Push both images to ECR; create ECS services behind an Application Load Balancer.
   - Route `/api/*` → backend target group (health check `/api/health`), `/*` → frontend.
   - Pass the DB settings as task environment variables (password ideally from Secrets Manager).
   - Note: nginx refuses to start if it can't resolve the host `backend`. On ECS, either change `proxy_pass` in `frontend/nginx.conf` to the backend's service-discovery name or ALB DNS, or remove the `/api/` block and let the ALB do the routing.
