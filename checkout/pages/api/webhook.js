/**
 * POST /api/webhook
 * Recebe notificações de status da WayMB.
 *
 * Status possíveis: PENDING | COMPLETED | DECLINED
 *
 * IMPORTANTE: Sempre retornar 200 para confirmar recebimento,
 * independentemente do processamento interno.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  // Confirmar recebimento IMEDIATAMENTE (exigido pela WayMB)
  res.status(200).json({ received: true });

  const {
    transactionId,
    id,
    status,
    amount,
    currency,
    email,
    account_email,
    payer,
    updatedAt,
  } = req.body;

  const txId = transactionId || id;

  try {
    switch (status) {
      case "COMPLETED":
        console.log(
          `[WayMB] ✅ Pagamento confirmado — ID: ${txId} | Valor: ${amount} ${currency} | E-mail: ${email || account_email}`
        );
        // TODO: Atualizar estado no banco de dados, enviar e-mail de confirmação, etc.
        break;

      case "DECLINED":
        console.log(
          `[WayMB] ❌ Pagamento recusado — ID: ${txId} | Pagador: ${payer?.name || "N/A"}`
        );
        // TODO: Notificar utilizador, reverter reserva, etc.
        break;

      case "PENDING":
        console.log(`[WayMB] ⏳ Pagamento pendente — ID: ${txId}`);
        // Aguardar próxima notificação
        break;

      default:
        console.log(`[WayMB] Status desconhecido: ${status} — ID: ${txId}`);
    }
  } catch (err) {
    // Erros internos nunca devem impedir o 200 já enviado
    console.error("[WayMB] Erro ao processar webhook:", err);
  }
}
