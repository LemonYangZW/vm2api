# 仅构建本机离线差分环境，不包含项目源码、凭据或生产配置。
FROM node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 qemu-user-static \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json /opt/parity-deps/
RUN cd /opt/parity-deps \
    && npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && ln -s /opt/parity-deps/node_modules /node_modules
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /work
ENTRYPOINT ["python3"]
