FROM node:BASE_BUILD_IMAGE_VERSION AS builder
WORKDIR /app
COPY package*.json ./

RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:BASE_IMAGE_VERSION AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY docker/docker-entrypoint.sh /usr/local/bin/

RUN apk add --no-cache python3 py3-pip su-exec && \
    pip3 install pigpio
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    mkdir -p /app/state && \
    chown -R node:node /app/state

EXPOSE 3000
VOLUME ["/app/state"]

ENV NODE_ENV=production
USER node

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]
