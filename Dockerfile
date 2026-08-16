FROM node:22-alpine

LABEL org.opencontainers.image.source="https://github.com/wangganghj/stremio-chinese-subtitles"
LABEL org.opencontainers.image.description="Stremio Chinese subtitles addon for ASSRT, Zimuku and SubHD"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install --global pnpm@11.19.0 \
    && pnpm install --frozen-lockfile --prod \
    && pnpm store prune

COPY --chown=node:node src ./src

ENV NODE_ENV=production \
    PORT=7000

USER node
EXPOSE 7000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/manifest.json" >/dev/null || exit 1

CMD ["node", "src/server.js"]
