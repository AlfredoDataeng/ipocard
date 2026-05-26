# Como Executar o Ecossistema IPOCARD

O projeto IPOCARD é constituído por três partes principais que precisam estar a correr em simultâneo:
1. **Base de Dados & Backend** (PostgreSQL via Docker e Fastify)
2. **Admin Web** (React / Vite)
3. **Mobile App** (React Native / Expo Go)

---

## 1. Base de Dados
A base de dados é gerida via Docker e foi configurada no ficheiro `docker-compose.yml`.

```bash
cd "/home/klaus/Klaus LInux/IPOCARD"
docker compose up -d
```
*(Nota: Certifica-te de que o serviço Docker no teu sistema operativo está ligado)*

## 2. Iniciar o Backend API (Fastify)
O backend fornece todos os endpoints para o painel admin e app mobile.

Abra uma janela de terminal:
```bash
cd "/home/klaus/Klaus LInux/IPOCARD/backend"
# Instala as dependências, caso não tenhas feito antes
npm install
# Inicia o servidor em modo desenvolvimento
npm run dev
```
*(O servidor irá correr em `http://localhost:3000`)*

## 3. Iniciar o Painel de Administração (Web)
O admin web é onde a secretaria faz toda a gestão.

Abra uma nova janela de terminal:
```bash
cd "/home/klaus/Klaus LInux/IPOCARD/admin-web"
# Instala dependências, caso necessário
npm install
# Inicia a aplicação web
npm run dev
```
*(A aplicação web geralmente vai correr em `http://localhost:5173`)*

## 4. Iniciar a App Mobile (Expo Go)
Para a aplicação móvel, usamos a plataforma Expo.

Abra uma terceira janela de terminal:
```bash
cd "/home/klaus/Klaus LInux/IPOCARD/mobile-app"
# Instala as dependências de forma segura
npm install --legacy-peer-deps
# Inicia o servidor Expo no teu computador
npx expo start --lan
```

### Como testar no telemóvel físico:
1. Certifica-te que o teu telemóvel e o computador estão ligados à **mesma rede Wi-Fi**.
2. Descarrega a aplicação **Expo Go** no teu telemóvel (pela Google Play Store ou App Store).
3. No terminal onde executaste o Expo, aparecerá um QR Code.
4. Abre o Expo Go no telemóvel e seleciona **Scan QR Code**, aponta a câmara, e a aplicação será transferida em tempo real!
