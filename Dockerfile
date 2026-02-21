FROM texlive/texlive:latest

RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    fonts-hosny-amiri \
    fonts-arabeyes \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

EXPOSE 8080
CMD ["node", "server.js"]
