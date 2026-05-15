FROM node:22-alpine
# Set the working directory in the container
WORKDIR /app 
# Copy package.json and package-lock.json to the container (./ is the current directory in the container)
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 20000
CMD ["npm", "start"]