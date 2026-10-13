# ==========================================
# STAGE 1: Build Image
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.6.0 --activate

# Copy root workspace and config files
COPY pnpm-workspace.yaml package.json ./
COPY apps/backend-api/package.json ./apps/backend-api/
COPY apps/backend-api/prisma ./apps/backend-api/prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY apps/backend-api ./apps/backend-api
RUN pnpm --filter backend-api run prisma:generate
RUN pnpm --filter backend-api build

# ==========================================
# STAGE 2: Production Runner Image
# ==========================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Security: Run as non-root user
USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/apps/backend-api/node_modules ./apps/backend-api/node_modules
COPY --chown=node:node --from=builder /app/apps/backend-api/dist ./apps/backend-api/dist
COPY --chown=node:node --from=builder /app/apps/backend-api/prisma ./apps/backend-api/prisma
COPY --chown=node:node --from=builder /app/apps/backend-api/package.json ./apps/backend-api/

EXPOSE 4000

WORKDIR /app/apps/backend-api

CMD ["node", "dist/main"]

