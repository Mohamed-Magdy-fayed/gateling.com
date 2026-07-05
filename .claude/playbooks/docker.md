# Playbook: Docker Desktop (local)

**Role here:** local development dependencies (Postgres, mailhog, etc.) — production
runs on managed platforms (Vercel/Neon), not self-hosted containers.

## Conventions
- `docker-compose.yml` (or `compose.yaml`) at project root defines local services; committed, documented in the README setup section.
- Local Postgres mirrors the production major version — version skew hides migration bugs.
- Named volumes for data that should survive restarts; ports offset if multiple projects run simultaneously (document which).

## Common operations
- `docker compose up -d` / `down` (add `-v` only to intentionally wipe local data — it's destructive).
- Diagnosing: `docker compose ps`, `docker compose logs <service> --tail 100`.
- Windows note: ensure Docker Desktop is running before compose commands; WSL2 backend path quirks — keep bind mounts inside the project directory.

## Rules
- If local setup changes (new service, port, env), update compose file + README + `docs/deployment.md` local section in the same change.
- Never bake secrets into images or compose files — compose reads from `.env` (gitignored).
