FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Clean install dependencies
RUN npm ci

# Copy the rest of the app
COPY . .

# Build the Next.js application for Production
RUN npm run build

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

# Start server
CMD ["npm", "start"]
