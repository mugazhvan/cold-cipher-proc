FROM node:20-alpine as build
WORKDIR /app
# Copy the workspace root package.json
COPY package*.json ./
# Copy the app and shared folder package.jsons
COPY management-app/package*.json ./management-app/
COPY shared/package*.json ./shared/

RUN npm install

# Copy all source files
COPY management-app/ ./management-app/
COPY shared/ ./shared/

RUN npm run build --workspace=management-app

FROM nginx:alpine
COPY --from=build /app/management-app/dist /usr/share/nginx/html
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
