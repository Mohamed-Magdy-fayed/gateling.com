# /db-reset

Reset the development database to a clean state and re-seed it with demo data.

## When to use

Run this when the database is in a broken state, after pulling schema-breaking changes, or when you want a clean slate for testing.

## Steps

Run these in strict sequence. Stop immediately and report if any step fails.

### 1. Reset the database

```bash
npm run db:reset
```

This tears down the Docker volume (`docker compose down -v`) and restarts PostgreSQL (`docker compose up -d`). Wait for the container to be ready before proceeding.

### 2. Apply migrations

```bash
npm run db:migrate
```

Applies all pending Drizzle migrations to the fresh database.

### 3. Seed demo data

```bash
npm run seed:all
```

Seeds the admin user (`root@gateling.com`), main branch, and the full portfolio demo dataset.

## Done

Report which steps ran, confirm seed completed successfully, and remind the user of the admin credentials (`root@gateling.com`).
