# Stage 1: Build the Angular app
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# --- ADD THIS DEBUGGING COMMAND ---
RUN ls -R dist
# --- END OF DEBUGGING COMMAND ---

# Stage 2: Serve the app from Nginx
FROM nginx:alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/intellinspectabb-frontend /usr/share/nginx/html
