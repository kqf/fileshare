FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_CAPTCHA_SITE_KEY
ENV VITE_CAPTCHA_SITE_KEY=$VITE_CAPTCHA_SITE_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:alpine

# Install Node.js (needed for alert-worker)
RUN apk add --no-cache nodejs npm

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

# Copy alert worker + entrypoint
COPY alert-worker.js /app/alert-worker.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["/entrypoint.sh"]
