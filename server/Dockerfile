# Use official Node.js image as base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY server/package.json server/package-lock.json ./
RUN npm install --production

# Copy server source code
COPY server/ ./

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
