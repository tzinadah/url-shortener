FROM node:23

WORKDIR /server

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=3000
ENV MONGO_URI="mongodb://mongo:27017/url-shortner"

EXPOSE 3000

CMD ["npm", "start"]