# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_AI_AGENT_MODE=api
ARG VITE_API_URL=
ENV VITE_AI_AGENT_MODE=${VITE_AI_AGENT_MODE}
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS runtime
USER root
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
