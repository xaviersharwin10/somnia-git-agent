# Use Node.js 18 as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install PM2 globally
RUN npm install -g pm2

# Copy the rest of the application code
COPY . .

# Create agents directory
RUN mkdir -p agents

# Expose port 3000
EXPOSE 3000

# Use PM2 runtime to start the application
CMD ["pm2-runtime", "index.js"]
