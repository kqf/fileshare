FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_CAPTCHA_SITE_KEY
ENV VITE_CAPTCHA_SITE_KEY=$VITE_CAPTCHA_SITE_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:alpine

# Install Python (instead of Node)
RUN apk add --no-cache python3
RUN pip3 install --no-cache-dir aiohttp

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

COPY alert.py /app/alert.py
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["/entrypoint.sh"]
