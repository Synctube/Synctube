FROM node:8

WORKDIR /app

COPY package.json .

RUN npm install

COPY bower.json .

RUN npm install -g bower && bower install --allow-root

COPY . .

RUN npm run build

EXPOSE 3000
CMD [ "npm", "start", "3000" ]