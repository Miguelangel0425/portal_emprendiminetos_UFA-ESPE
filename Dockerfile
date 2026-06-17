#Oficial Nginx base image
FROM nginx:alpine

#eliminar config por defecto (opcional pero recomendalbe)

RUN rm -rf /usr/share/nginx/html/*

#copiar el sitio HTML al container

COPY . /usr/share/nginx/html

#Exponer el puerto 80
EXPOSE 80

#Ejecutar Ngingx en primer plano 

CMD ["nginx", "-g","daemon off;"]