FROM node:22.15.0-alpine

WORKDIR /app

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY ./package*.json ./

# Install dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy application code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

# Start the application
CMD ["npm", "start"]