# ConUHacks VII (2024)

## Utilisation

### Client

Utiliser Docker ou faire

```bash
npm run dev
```
dans le répertoire `client/volt-client`

### Serveur

Utiliser Docker ou faire

```bash
uvicorn server:app
```
dans le répertoire `server`. Assurez vous d'installer les dépendances avec un venv

## Build des images Docker

### Client

Dans le répertoire `client/volt-client`:

#### Dev

```bash
docker build --target dev -t volt-client:dev .
```

#### Prod

```bash
docker build --target prod -t volt-client:prod .
```

### Serveur

Dans le répertoire `server`:

```bash
docker build --target prod -t volt-server .
```

## Se connecter au registry de Github

```bash
export GITHUB_REGISTRY_PAT=<votre token>
echo $GITHUB_REGISTRY_PAT | docker login ghcr.io -u <votre username> --password-stdin
```