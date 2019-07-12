FROM node:10 as builder

ADD . /app

WORKDIR /app

RUN npm install \
 && npm run build \
 && cp package.json /app/dist/

ENV NODE_ENV=production

RUN cd /app/dist && npm install

FROM node:10-alpine

COPY --from=builder /app/dist/ /app

WORKDIR /app

ENV PORT=3000 \
    NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"]
