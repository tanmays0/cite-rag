FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/rag/package.json ./packages/rag/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY . .
RUN pnpm --filter @cite-rag/rag build && pnpm --filter @cite-rag/web build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=build /app /app
EXPOSE 3000
CMD ["pnpm", "--filter", "@cite-rag/web", "start"]
