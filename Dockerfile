FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/lty-moe.db
ENV UPLOADS_DIR=/app/uploads

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/build ./build
COPY server.js ./

RUN mkdir -p /app/data /app/uploads \
  && chown -R node:node /app

USER node
EXPOSE 3000
VOLUME ["/app/data", "/app/uploads"]
CMD ["node", "server.js"]
