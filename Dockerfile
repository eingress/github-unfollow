ARG BUN_VERSION

FROM oven/bun:${BUN_VERSION:-alpine}

LABEL maintainer="Scott Mathieson <scott@eingress.io>"

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production

COPY src/ ./src/

ENTRYPOINT ["bun"]
CMD ["run", "src/index.ts"]
