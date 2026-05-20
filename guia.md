# Guia de Execução em Modo Offline - IPOCARD

O sistema **IPOCARD** possui um modo de simulação offline integrado no painel web. Neste modo, todas as operações (criar contas, gerir saldos, escanear o cartão com efeito 3D, simular compras na cantina e emitir recibos) funcionam localmente no navegador utilizando o **LocalStorage** para armazenamento. 

**Nenhuma ligação ao Docker, banco de dados PostgreSQL ou API backend externa é necessária.**

---

## Passos para Executar a Aplicação Offline

### 1. Aceder ao Diretório do Painel Web
Abra o terminal na raiz do projeto e navegue para a pasta da aplicação web:
```bash
cd admin-web
```

### 2. Instalar as Dependências
Instale as bibliotecas necessárias para a execução do painel:
```bash
npm install
```

### 3. Iniciar o Servidor de Desenvolvimento
Inicie o servidor local do Vite:
```bash
npm run dev
```

### 4. Aceder ao Painel no Navegador
Após iniciar o servidor, abra o seu navegador e aceda ao endereço:
* **URL:** [http://localhost:5173](http://localhost:5173)

---

## Funcionalidades Disponíveis no Modo Offline

Quando o backend está indisponível, o painel ativa automaticamente o **Modo de Contingência/Offline** na barra de status superior. As seguintes ações podem ser realizadas localmente:

1. **Gestão de Contas (CRUD):** Criar novos cartões com IDs sequenciais automáticos (`IC-IPOCET-2026-***`), atualizar dados e remover contas.
2. **Lançamento de Depósitos:** Pesquise pelo estudante, defina o valor do depósito e adicione saldo instantaneamente.
3. **Simulador de Dispositivos (Cantina & Aluno):**
   * **Phone 1 (Estudante):** Veja o cartão estudantil 3D, clique para girá-lo e consulte o extrato live de movimentações.
   * **Phone 2 (Cantina):** Adicione produtos ao carrinho, limpe a venda ou escaneie o QR Code do estudante (virando o cartão 3D para trás primeiro) para efetuar o débito e emitir o recibo.
4. **Monitor de Transações:** Visualize o histórico de vendas/depósitos e emita/imprima segundas vias em PDF dos recibos.
