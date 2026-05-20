# IPOCARD — Sistema Inteligente de Pagamentos da Cantina Escolar

> **Slogan:** *“O futuro dos pagamentos estudantis no IPOCET.”*

---

## 1. Descrição Geral

O **IPOCARD** é um ecossistema digital desenvolvido para modernizar, organizar e gerir as transações financeiras na cantina escolar da Escola Secundária IPOCET. O sistema elimina a necessidade de circulação de dinheiro físico na cantina, substituindo-o por **contas estudantis digitais com saldo virtual pré-pago**.

---

## 2. Objetivos Principais

*   **Agilidade e Conforto:** Reduzir o tempo de espera e as filas na cantina escolar durante os intervalos.
*   **Controlo Financeiro:** Permitir que os estudantes acompanhem em tempo real o seu extrato de consumo e recargas.
*   **Organização e Segurança:** Evitar perdas ou furtos de dinheiro em espécie e fornecer um histórico detalhado de todas as vendas para a administração escolar.

---

## 3. Funcionamento Lógico (Fluxo de Negócio)

O sistema opera com base na integração lógica entre três áreas funcionais:

```
                  +-----------------------------------+
                  |        DEPÓSITO BANCÁRIO          |
                  |  O encarregado deposita na conta  |
                  +-----------------+-----------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                       FLUXO DA SECRETARIA                             |
|  1. Aluno apresenta a fatura / comprovativo bancário                  |
|  2. Secretaria valida o depósito e credita o valor na conta digital    |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------+-----------------------------------+
|                       FLUXO DA CANTINA                                |
|  1. Trabalhador seleciona os alimentos no telemóvel da cantina        |
|  2. Escaneia o QR Code do cartão do aluno (impresso ou no ecrã)       |
|  3. O sistema desconta o saldo virtual e gera o recibo                |
+-----------------------------------------------------------------------+
```

### A. Secretaria (Administração Central)
É a entidade validadora e emissora do sistema.
*   **Cadastro:** A secretaria regista os alunos no sistema associando-os a uma turma e a uma referência de cartão exclusiva.
*   **Emissão de Cartão:** É impresso um cartão físico com a identificação do aluno na frente e uma grelha de carimbos com código QR no verso.
*   **Validação de Depósitos:** Para adicionar saldo virtual ao cartão, o aluno (ou encarregado de educação) realiza um depósito/transferência bancária real para a conta bancária da cantina e apresenta o comprovativo físico ou digital. A secretaria verifica a autenticidade e credita o saldo equivalente na conta do aluno.

### B. Portal do Aluno (Área Estudantil)
Um portal onde o estudante tem total controlo sobre a sua conta.
*   **Cartão Digital:** Exibição da versão digital do cartão (frente e verso com código QR), permitindo efetuar pagamentos diretamente pelo ecrã do smartphone caso se esqueça do cartão físico.
*   **Consulta de Saldo e Extrato:** Acompanhamento do saldo atualizado e histórico detalhado das compras na cantina.
*   **Envio de Comprovativos:** O aluno pode fotografar ou anexar comprovativos de depósito para que a secretaria os valide remotamente, agilizando o processo de carregamento.

### C. Cantina (Ponto de Venda - POS)
A estação de atendimento rápido gerida pelo funcionário da cantina.
*   **Seleção de Itens:** O trabalhador seleciona os alimentos comprados (sanduíches, sumos, água) no telemóvel da cantina.
*   **Identificação e Validação:** O telemóvel da cantina lê o código QR do cartão do estudante. O sistema valida instantaneamente se o cartão é ativo e se há saldo pré-pago suficiente.
*   **Dedução e Recibo:** O valor é descontado da conta digital do estudante e é emitida uma fatura térmica na ecrã da cantina. 
*   **Sistema de Carimbos:** Cada produto consumido preenche digitalmente um carimbo no verso do cartão, proporcionando uma forma de monitorização de consumo recorrente.

---

## 4. Regras de Negócio e Lógica de Segurança

1.  **Sem Saldo Negativo:** O sistema funciona estritamente em regime pré-pago. Se o saldo disponível for inferior ao total da compra, a transação é automaticamente recusada.
2.  **Transações Atómicas (Segurança de Saldo):** A transferência de saldo e a dedução de valores ocorrem numa única operação integrada. Se ocorrer uma falha de sinal ou de comunicação durante a compra, a operação é revertida na totalidade para garantir que o saldo do aluno nunca seja descontado indevidamente.
3.  **Cartão Pessoal:** Cada QR Code está exclusivamente vinculado ao ID único do estudante, impedindo a falsificação ou duplicação de saldo.
