# Guia de Execução - IPOCARD Completo

O IPOCARD é composto por 3 módulos principais: A **Base de Dados/Backend**, a **Gestão Web** e a **Aplicação Mobile**.
Para correr o sistema de forma limpa e completa na tua máquina, segue as instruções abaixo.

---

## 1. Executar o Servidor Backend e a Base de Dados

O backend fornece as APIs que comunicam com a base de dados PostgreSQL.

1. Abre o teu terminal.
2. Navega até à pasta do backend:
   ```bash
   cd "/home/klaus/Klaus LInux/IPOCARD/backend"
   ```
3. Inicia o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
> **Nota:** O backend deve ficar a rodar no endereço `http://localhost:3000`. Não feches esta janela.

---

## 2. Executar o Painel de Administração Web (Admin)

Este painel serve para a Secretaria e permite a emissão de cartões, gestão de credenciais e lançamento de depósitos.

1. Abre um **novo** separador no teu terminal.
2. Navega até à pasta do admin-web:
   ```bash
   cd "/home/klaus/Klaus LInux/IPOCARD/admin-web"
   ```
3. Inicia a interface web:
   ```bash
   npm run dev
   ```
> **Nota:** O painel de gestão estará acessível no teu browser, geralmente através do endereço `http://localhost:5173`.

---

## 3. Executar a Aplicação Mobile (Expo Go)

A app mobile é para os estudantes usarem e para o operador da cantina (POS).

1. Abre um **terceiro** separador no teu terminal.
2. Navega até à pasta mobile-app:
   ```bash
   cd "/home/klaus/Klaus LInux/IPOCARD/mobile-app"
   ```
3. Instala as dependências se for a primeira vez (ou se houve alterações):
   ```bash
   npm install --legacy-peer-deps
   ```
4. Inicia o servidor Expo em modo rede local:
   ```bash
   npx expo start --lan
   ```

### 📱 Como Acessar a App no Telemóvel:
- Certifica-te de que o teu telemóvel está ligado ao **mesmo Wi-Fi** que o teu computador.
- Instala a aplicação **Expo Go** na Google Play Store (Android) ou App Store (iOS).
- Na app Expo Go, seleciona "Scan QR Code".
- Aponta a câmara para o **QR Code que apareceu no teu terminal**.

---

### Credenciais Padrão
Se estiveres a testar:
- **Cantina:** Username: `cantina` / Senha: `cant123`
- **Estudante Inicial:** Vais poder encontrar (ou atribuir) as senhas dos estudantes através da nova aba **Credenciais** na plataforma Web (Admin).
