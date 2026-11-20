FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN npm install --workspace=@partyverse/shared --workspace=@partyverse/server

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY package.json ./
COPY packages/shared packages/shared
COPY apps/server apps/server
RUN npm run build -w @partyverse/shared && npm run build -w @partyverse/server

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/shared /app/packages/shared
COPY --from=build /app/apps/server/dist /app/apps/server/dist
COPY --from=build /app/apps/server/package.json /app/apps/server/package.json
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
WORKDIR /app/apps/server
EXPOSE 4000
CMD ["node", "dist/index.js"]
