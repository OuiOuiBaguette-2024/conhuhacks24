FROM node:18.17.0-slim AS base

WORKDIR /app
COPY package*.json ./

FROM base AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM base AS prod
LABEL maintainer="oui oui baguette"
LABEL org.opencontainers.image.description DESCRIPTION="NextJS frontend for Volt"

WORKDIR /app

ENV NODE_ENV=production
RUN npm ci


COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD npm start

FROM base AS dev
ENV NODE_ENV=development
RUN npm install 
COPY . .

EXPOSE 3000

CMD npm run dev