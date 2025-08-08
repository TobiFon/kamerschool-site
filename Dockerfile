# Build stage
FROM node:22.15.0-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --silent
COPY . .
RUN npm run build

# Production stage
FROM node:22.15.0-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci --legacy-peer-deps --only=production --silent

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]

# FROM node:22.15.0-alpine

# WORKDIR /app

# # Set environment variables for development
# ENV NODE_ENV=development
# ENV NEXT_TELEMETRY_DISABLED=1

# # Copy package files
# COPY ./package*.json ./

# # # Install ALL dependencies (including devDependencies)
# # RUN npm ci --legacy-peer-deps

# # Copy application code
# COPY . .

# EXPOSE 3000

# # Start the application in development mode
# CMD ["npm", "run", "dev"]
