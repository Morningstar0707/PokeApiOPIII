FROM node:22.23.3-bookworm-slim AS base

WORKDIR /usr/src/app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY scripts/seed-if-empty.cjs ./scripts/seed-if-empty.cjs

EXPOSE 3000
USER node

CMD ["sh", "-c", "npm run prisma:deploy && npm run seed:if-empty && exec npm run start"]
