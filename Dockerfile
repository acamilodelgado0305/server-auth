# Utiliza la imagen oficial de Node.js versión 21.7.1
FROM node:21.7.1

# Crear directorio de la aplicación
WORKDIR /src/index

# Instalar dependencias de la aplicación
COPY package*.json ./

RUN npm install

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto que usará la aplicación
EXPOSE 3000

# Comando para correr la aplicación
CMD ["npm", "start"]