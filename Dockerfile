FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_ADMIN_LOGIN_URL
ARG VITE_API_TIMEOUT_MS=120000
ARG VITE_API_LONG_TIMEOUT_MS=600000

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ADMIN_LOGIN_URL=${VITE_ADMIN_LOGIN_URL}
ENV VITE_API_TIMEOUT_MS=${VITE_API_TIMEOUT_MS}
ENV VITE_API_LONG_TIMEOUT_MS=${VITE_API_LONG_TIMEOUT_MS}

RUN pnpm build:h5

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/build/h5 /usr/share/nginx/html

EXPOSE 80
