FROM oven/bun:1.1-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat nodejs
COPY packages/db/prisma/ ./prisma/
COPY services/api/package.json ./
RUN bun install
RUN ./node_modules/.bin/prisma generate
COPY services/api/src/ ./src/
RUN bun build src/index.ts --outdir dist --target bun --minify

FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
COPY --from=base /app/dist          ./dist
COPY --from=base /app/node_modules  ./node_modules
EXPOSE 4000
CMD ["bun", "run", "dist/index.js"]
