# WayMB Checkout — Next.js + Vercel

Checkout completo integrado com a **API WayMB**, suportando **MB WAY** e **Multibanco**.  
Pronto para deploy na Vercel com um clique.

---

## 🚀 Deploy rápido na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SEU_USUARIO/waymb-checkout)

---

## ⚙️ Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/waymb-checkout.git
cd waymb-checkout
npm install
```

### 2. Variáveis de ambiente

Copie o `.env.example` para `.env.local` e preencha as suas credenciais:

```bash
cp .env.example .env.local
```

```env
# Credenciais WayMB (obrigatórias)
WAYMB_CLIENT_ID=seu_client_id
WAYMB_CLIENT_SECRET=seu_client_secret
WAYMB_ACCOUNT_EMAIL=sua_conta@exemplo.com

# URL do seu site (para callbacks)
NEXT_PUBLIC_BASE_URL=https://seu-dominio.vercel.app

# Configurações do produto
NEXT_PUBLIC_PRODUCT_NAME=TikTok
NEXT_PUBLIC_PRODUCT_DESCRIPTION=TikTok
NEXT_PUBLIC_AMOUNT=9.90
NEXT_PUBLIC_OFFER_MINUTES=9
NEXT_PUBLIC_OFFER_SECONDS=13
```

> ⚠️ **Nunca** commite o `.env.local` no Git. Ele já está no `.gitignore`.

### 3. Desenvolvimento local

```bash
npm run dev
# Acesse: http://localhost:3000
```

### 4. Deploy na Vercel

1. Faça push para o seu repositório GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Adicione as variáveis de ambiente no painel da Vercel:  
   **Settings → Environment Variables**
4. Deploy automático ✅

---

## 🗂️ Estrutura do projeto

```
waymb-checkout/
├── pages/
│   ├── _app.js              # Entry point Next.js
│   ├── index.js             # Página de checkout
│   └── api/
│       ├── create-transaction.js   # Cria transação na WayMB
│       ├── transaction-info.js     # Verifica status (polling MB WAY)
│       └── webhook.js              # Recebe notificações WayMB
├── styles/
│   └── globals.css          # Estilos globais
├── .env.example             # Exemplo de variáveis de ambiente
├── next.config.js
└── package.json
```

---

## 💳 Fluxo de pagamento

### MB WAY
1. Utilizador insere número de telemóvel (+351)
2. API cria transação → notificação enviada para o app MB WAY
3. Frontend faz polling a cada 3 segundos em `/api/transaction-info`
4. Quando status muda para `COMPLETED` → tela de sucesso

### Multibanco
1. Utilizador preenche nome, e-mail e NIF
2. API retorna Entidade + Referência + Valor
3. Utilizador paga num ATM ou Homebanking
4. Webhook `/api/webhook` notifica quando `COMPLETED`

---

## 🔧 Personalização

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_PRODUCT_NAME` | Nome exibido no checkout |
| `NEXT_PUBLIC_AMOUNT` | Valor a cobrar (ex: `9.90`) |
| `NEXT_PUBLIC_OFFER_MINUTES` | Minutos do contador regressivo |
| `NEXT_PUBLIC_OFFER_SECONDS` | Segundos do contador regressivo |

---

## 🔐 Segurança

- As credenciais (`client_id`, `client_secret`) **nunca são expostas** ao browser
- Todas as chamadas à API WayMB são feitas server-side nas API Routes do Next.js
- O webhook confirma recebimento imediatamente (status 200) conforme exigido pela WayMB

---

## 📞 Suporte WayMB

- Documentação: [api.waymb.com](https://api.waymb.com)
- Base URL: `https://api.waymb.com`
