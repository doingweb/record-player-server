FROM arm32v7/node:current-alpine

WORKDIR /opt/record-player-server

COPY package.json yarn.lock ./
RUN yarn install --production

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

CMD ["node", "."]
