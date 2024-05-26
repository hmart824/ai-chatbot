FROM node:18-alpine

ENV NODE_ENV=development
# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY server/package*.json ./

# Install dependencies
RUN npm install --verbose

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 7070

# Command to run the application
CMD ["npm", "start"]