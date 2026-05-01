/**
 * POST /api/create-transaction
 * Proxy para a WayMB API — mantém as credenciais seguras no servidor.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { method, amount, payer } = req.body;

  // Validações básicas
  if (!method || !amount || !payer) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  const validMethods = ["mbway", "multibanco"];
  if (!validMethods.includes(method)) {
    return res.status(400).json({ error: "Método de pagamento inválido." });
  }

  // Credenciais vindas das variáveis de ambiente (nunca expostas ao frontend)
  const client_id = process.env.WAYMB_CLIENT_ID;
  const client_secret = process.env.WAYMB_CLIENT_SECRET;
  const account_email = process.env.WAYMB_ACCOUNT_EMAIL;

  if (!client_id || !client_secret || !account_email) {
    console.error("WayMB: credenciais não configuradas nas variáveis de ambiente.");
    return res.status(500).json({ error: "Configuração do servidor incompleta." });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const payload = {
    client_id,
    client_secret,
    account_email,
    amount: parseFloat(amount),
    method,
    currency: "EUR",
    payer: {
      email: payer.email || account_email,
      name: payer.name || "Cliente",
      document: payer.document || "000000000",
      phone: payer.phone || "",
    },
    paymentDescription: `Pagamento ${process.env.NEXT_PUBLIC_PRODUCT_NAME || ""}`.slice(0, 50),
    ...(baseUrl && {
      callbackUrl: `${baseUrl}/api/webhook`,
      success_url: `${baseUrl}/sucesso`,
      failed_url: `${baseUrl}/falha`,
    }),
  };

  try {
    const waymb = await fetch("https://api.waymb.com/transactions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await waymb.json();

    if (!waymb.ok || data.statusCode !== 200) {
      console.error("WayMB error:", data);
      return res.status(waymb.status || 500).json({
        error: data.message || "Erro ao processar pagamento.",
      });
    }

    // Retorna apenas os campos necessários para o frontend
    return res.status(200).json({
      id: data.id || data.transactionID,
      method: data.method,
      amount: data.amount,
      referenceData: data.referenceData || null,
      generatedMBWay: data.generatedMBWay || false,
    });
  } catch (err) {
    console.error("WayMB fetch error:", err);
    return res.status(500).json({ error: "Erro de comunicação com o servidor de pagamento." });
  }
}
