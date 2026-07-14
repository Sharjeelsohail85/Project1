# Multi-stage build for production-ready, high-performance static hosting

# Step 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install packages
RUN npm ci

# Copy codebase
COPY . .

# Run compilation
RUN npm run build

# Step 2: Production release stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx configuration for SPA routing & security headers
RUN echo 'server { \
    listen 3000; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN"; \
    add_header X-XSS-Protection "1; mode=block"; \
    add_header X-Content-Type-Options "nosniff"; \
    add_header Referrer-Policy "strict-origin-when-cross-origin"; \
    add_header Content-Security-Policy "default-src \x27self\x27 https: data: \x27unsafe-inline\x27 \x27unsafe-eval\x27; img-src \x27self\x27 https: data: blob:; media-src \x27self\x27 https: data: blob:;"; \
}' > /etc/nginx/conf.d/default.conf

# Expose the standard external ingress port
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
