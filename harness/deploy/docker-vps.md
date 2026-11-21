# Docker + VPS

## Fits / Constraints

- Fits: anything that runs in a container, on a server you control (Hetzner, DigitalOcean, Linode,
  a company VM).
- Constraints: you own the server: OS updates, TLS, backups, firewall, monitoring.
- Environments: one directory per environment on the server (`/opt/<app>/staging`,
  `/opt/<app>/production`), or one server each.

## Options

`deploy.options`: `sshHost` (an alias in `~/.ssh/config`), `registry` (default `ghcr.io/<owner>/<app>`),
`domainStaging`, `domainProduction`, `platform` (default `linux/amd64`).

## Setup

1. Server with Docker Engine and the Compose plugin; a non-root deploy user in the `docker` group;
   SSH key access (`ssh -o BatchMode=yes <sshHost> true` must work without a prompt).
2. A reverse proxy with automatic TLS (Caddy recommended) routing each domain to its environment.
3. Registry login, locally and on the server. For GHCR:

   ```bash
   gh auth refresh -s write:packages
   gh auth token | docker login ghcr.io -u <github-user> --password-stdin
   ```

   On the server, a read-only token (`read:packages`) stored once with `docker login`.
4. `/opt/<app>/<env>/.env` on the server with the secrets (permissions `600`), written by the human
   or piped over SSH — never committed.

## Bootstrap

`Dockerfile` (multi-stage, non-root user, `HEALTHCHECK`), `compose.yaml` using
`image: ${REGISTRY}:${IMAGE_TAG}` and `env_file: .env`, copied to each environment directory
(`scp compose.yaml <sshHost>:/opt/<app>/<env>/`).

## Deploy staging

```bash
docker build --platform <platform> -t <registry>:<sha> .
docker push <registry>:<sha>
ssh <sshHost> "cd /opt/<app>/staging && IMAGE_TAG=<sha> docker compose pull && IMAGE_TAG=<sha> docker compose up -d"
```

BASE_URL: `https://<domainStaging>`.

## Deploy production

Same image, no rebuild:

```bash
ssh <sshHost> "cd /opt/<app>/production && IMAGE_TAG=<sha> docker compose pull && IMAGE_TAG=<sha> docker compose up -d"
```

Persist the deployed tag (`echo <sha> > /opt/<app>/production/DEPLOYED_TAG`).

## Migrations

`ssh <sshHost> "cd /opt/<app>/<env> && IMAGE_TAG=<sha> docker compose run --rm app <migration command>"`,
after a database backup in production (`pg_dump` to a dated file).

## Logs

`ssh <sshHost> "cd /opt/<app>/<env> && docker compose logs --since 10m app"`

## Rollback

The rollback point is the content of `DEPLOYED_TAG` before the deploy. Re-run the production deploy
command with that tag.

## Cost

The server's fixed monthly price, plus backups and registry storage.
