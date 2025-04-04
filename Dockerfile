#Step 1: Make a base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest
RUN corepack enable
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY . /app

#Step 2: Install dependencies only for production and generate prisma client
# This is needed to reduce the size of the final image
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm add -D prisma
RUN pnpm prisma generate

#Step 3: Build the app
# Since we need to dev dependencies to build the app, we need to install all dependencies
FROM base AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm prisma generate
RUN pnpm run build

#Step 4: Copy the files from the previous steps and run the app
FROM base 
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
EXPOSE 3000
CMD ["pnpm", "run", "start:prod"]
