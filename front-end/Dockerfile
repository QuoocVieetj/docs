# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Biến VITE_* được nhúng vào bundle lúc build
ARG VITE_API_BASE_URL=http://localhost/api/v1
ARG VITE_CATEGORY_API_URL=http://localhost:8080/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CATEGORY_API_URL=$VITE_CATEGORY_API_URL

RUN npm run build

# Stage 2: Serve static files
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
