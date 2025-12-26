FROM mcr.microsoft.com/devcontainers/javascript-node:24

# 安裝全域工具（視需要）
RUN su vscode -c "corepack enable" \
    && npm i -g pnpm

# 複製 package 檔並安裝相依，將結果層快取到 image
WORKDIR /workspace
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false