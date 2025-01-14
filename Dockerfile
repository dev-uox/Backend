# Use Node.js version 22.13.0 as the base image
FROM node:22.13.0

# Set the working directory in the container
WORKDIR /app

# Copy only the package files first for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "src/server.js"]
