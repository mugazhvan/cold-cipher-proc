FROM node:20-alpine as build
WORKDIR /app
# Copy the workspace root package.json
COPY package*.json ./
# Copy the app and shared folder package.jsons
COPY farmer-app/package*.json ./farmer-app/
COPY shared/package*.json ./shared/

RUN npm install

# Copy all source files
COPY farmer-app/ ./farmer-app/
COPY shared/ ./shared/

RUN npm run build --workspace=farmer-app

FROM nginx:alpine
COPY --from=build /app/farmer-app/dist /usr/share/nginx/html
RUN echo 'server { \
    listen 80; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
