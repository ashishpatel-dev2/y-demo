FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY .sequelizerc ./
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
ENV PORT=5000
EXPOSE 5000
CMD ["node", "src/index.js"]
