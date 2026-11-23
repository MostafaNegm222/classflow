# Start from the official Node.js 20 image (alpine = very small Linux).
FROM node:20-alpine

# Set the working directory inside the container; every next command runs here.
WORKDIR /app

# Copy only the dependency lists first, so Docker can cache the install step
# and skip it when only our code changes.
COPY package*.json ./

# Install production dependencies inside the image.
RUN npm install --omit=dev

# Now copy the rest of the server source code.
COPY . .

# Document that the API listens on port 5000 inside the container.
EXPOSE 5000

# The command that starts the server when a container runs.
CMD ["node", "src/index.js"]
