FROM node:9.11.1
ADD . /code
WORKDIR /code
RUN npm install
CMD ["npm", "start"]