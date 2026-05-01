/**
 * POST /api/transaction-info
 * Verifica o status atual de uma transação WayMB.
 * Usado para polling no frontend (MB WAY pending state).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID da transação é obrigatório." });
  }

  try {
    const waymb = await fetch("https://api.waymb.com/transactions/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await waymb.json();

    if (!waymb.ok) {
      return res.status(waymb.status || 500).json({
        error: data.message || "Erro ao obter informações da transação.",
      });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      amount: data.amount,
      method: data.method,
      referenceData: data.referenceData || null,
    });
  } catch (err) {
    console.error("WayMB info error:", err);
    return res.status(500).json({ error: "Erro de comunicação." });
  }
}
