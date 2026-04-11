# Pragmatic Play Local Server

Node.js + Express + PostgreSQL server for local Pragmatic Play slot games.

## Setup local

```bash
npm install
createdb pragmatic
node src/config/migrate.js
npm start
```

## Extrair jogo do HAR

```bash
node scripts/extract-har.js cult path/to/cult.har
node scripts/extract-har.js zeus path/to/zeus.har
node scripts/extract-har.js pub  path/to/pub.har
```

## Variáveis de ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Jogos disponíveis

- `/gs2c/game5Html.html?slug=cult` — Cult of Fortune
- `/gs2c/game5Html.html?slug=zeus` — Zeus vs Hades
- `/gs2c/game5Html.html?slug=pub`  — Lucky's Wild Pub 2
