FROM node:22-alpine AS build
WORKDIR /app

ARG DATABASE_URL="postgresql://x:x@localhost:5432/x"

COPY package*.json ./
RUN npm install

COPY . .
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src ./src

EXPOSE 8000
CMD ["sh", "-c", "DATABASE_URL=$DATABASE_URL npx prisma migrate deploy --schema prisma/schema.prisma --config prisma.config.ts && npm run start"]

