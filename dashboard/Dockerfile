# Kira Dashboard — React + Vite + Nginx
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json ./
COPY dashboard/package.json ./dashboard/
RUN cd dashboard && npm install

COPY dashboard ./dashboard
WORKDIR /app/dashboard

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production — Nginx serving static
FROM nginx:alpine

COPY --from=build /app/dashboard/dist /usr/share/nginx/html
COPY dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
