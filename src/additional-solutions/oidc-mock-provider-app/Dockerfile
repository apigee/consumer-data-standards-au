FROM node:14.18.1
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm install --production
COPY --chown=node:node . .

USER node

EXPOSE 9000
CMD ["npm", "start"]
