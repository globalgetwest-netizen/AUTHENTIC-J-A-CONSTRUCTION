# syntax=docker/dockerfile:1

# AUTHENTIC J.A. CONSTRUCTION LTD. — API service image (NestJS + Prisma).
#
# Builds the Turborepo monorepo and runs the compiled API from `dist`.
# Dev deps stay in the image on purpose: Render's preDeployCommand runs
# `prisma migrate deploy` + the seed inside this container.

FROM node:22-alpine

WORKDIR /repo

# Whole monorepo. The .dockerignore excludes node_modules/.next/dist/.git so
# the Linux (musl) Prisma engines are generated inside the image, not copied
# from a Windows host.
COPY . .

# Install all workspaces including dev deps.
RUN npm ci --no-audit --no-fund

# Compile the API and its workspace deps. turbo builds @ajac/database first
# (its build generates the Prisma client and copies it into dist), then
# @ajac/auth/@ajac/types, then the API itself.
RUN npx turbo run build --filter=@ajac/api

# Run as a non-root user; local uploads land in /repo/uploads (ephemeral on
# Render — switch STORAGE_PROVIDER to S3/R2 for durable storage later).
RUN mkdir -p /repo/uploads && addgroup -S ajac && adduser -S ajac -G ajac \
  && chown -R ajac:ajac /repo
USER ajac

ENV NODE_ENV=production
ENV UPLOADS_DIR=/repo/uploads
EXPOSE 4000

# main.ts reads API_PORT first, then PORT (Render injects PORT automatically).
CMD ["node", "services/api/dist/main.js"]
