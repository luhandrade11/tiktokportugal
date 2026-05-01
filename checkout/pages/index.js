import Head from "next/head";
import { useState, useEffect, useRef } from "react";

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME || "TikTok";
const PRODUCT_DESC = process.env.NEXT_PUBLIC_PRODUCT_DESCRIPTION || "TikTok";
const AMOUNT = parseFloat(process.env.NEXT_PUBLIC_AMOUNT || "9.90");
const OFFER_MINUTES = parseInt(process.env.NEXT_PUBLIC_OFFER_MINUTES || "9");
const OFFER_SECONDS = parseInt(process.env.NEXT_PUBLIC_OFFER_SECONDS || "13");

// Format amount as € X,XX
function formatAmount(val) {
  return "€ " + val.toFixed(2).replace(".", ",");
}

// TikTok logo SVG
function TikTokLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.5 3h-3.6v17.2a3.9 3.9 0 01-3.9 3.8 3.9 3.9 0 01-3.9-3.8 3.9 3.9 0 013.9-3.8c.38 0 .75.06 1.1.16V12.7a8 8 0 00-1.1-.08 8.1 8.1 0 00-8.1 8.1A8.1 8.1 0 0015 28.8a8.1 8.1 0 008.1-8.1V11.7a10.4 10.4 0 006.1 1.96v-3.6a6.8 6.8 0 01-6.7-7.06z"
        fill="white"
      />
    </svg>
  );
}

// Countdown timer hook
function useCountdown(minutes, seconds) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60 + seconds);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Poll transaction status
function useTransactionPolling(transactionId, method, onComplete) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!transactionId || method !== "mbway") return;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/transaction-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: transactionId }),
        });
        const data = await res.json();
        if (data.status === "COMPLETED" || data.status === "DECLINED") {
          clearInterval(intervalRef.current);
          onComplete(data.status);
        }
      } catch (_) {}
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [transactionId, method, onComplete]);
}

export default function Checkout() {
  const timer = useCountdown(OFFER_MINUTES, OFFER_SECONDS);
  const [method, setMethod] = useState("mbway");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form"); // form | pending | success | failed
  const [txData, setTxData] = useState(null);

  useTransactionPolling(txData?.id, method, (status) => {
    setStep(status === "COMPLETED" ? "success" : "failed");
  });

  function handlePhoneInput(e) {
    // Only allow digits, spaces, hyphens
    const v = e.target.value.replace(/[^\d\s\-]/g, "");
    setPhone(v);
  }

  async function handleSubmit() {
    setError("");

    // Basic validation
    if (method === "mbway" && !phone.trim()) {
      setError("Por favor insira o número de telemóvel.");
      return;
    }
    if (method === "multibanco" && (!name.trim() || !email.trim() || !document.trim())) {
      setError("Por favor preencha todos os campos.");
      return;
    }
    if (!agreed) {
      setError("É necessário aceitar os Termos e Condições.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        method,
        amount: AMOUNT,
        payer: {
          name: name || "Cliente",
          email: email || "cliente@exemplo.com",
          document: document || "000000000",
          phone: method === "mbway" ? `+351${phone.trim().replace(/\s/g, "")}` : phone,
        },
      };

      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao criar transação.");
      }

      setTxData(data);
      setStep("pending");
    } catch (err) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Checkout — {PRODUCT_NAME}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content={`Pagamento seguro para ${PRODUCT_NAME} via WayMB`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="page-wrapper">
        {/* ── OFFER BANNER ── */}
        <div className="offer-banner">
          <span className="icon">🔔</span>
          Oferta expira em {timer}
        </div>

        {/* ── MERCHANT HEADER ── */}
        <div className="merchant-header">
          <div className="merchant-logo">
            <TikTokLogo />
          </div>
          <div className="merchant-name">{PRODUCT_NAME}</div>
          <div className="merchant-secure">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Pagamento seguro • WayMB
          </div>
        </div>

        {/* ── CHECKOUT CARD ── */}
        <div className="checkout-card">
          <h2>{PRODUCT_NAME}</h2>
          <p className="subtitle">{PRODUCT_DESC}</p>

          {/* Amount */}
          <div className="amount-box">
            <div className="amount-label">Total a pagar</div>
            <div className="amount-value">{formatAmount(AMOUNT)}</div>
          </div>

          {step === "form" && (
            <>
              {/* Method tabs */}
              <div className="method-tabs">
                <button
                  className={`method-tab ${method === "mbway" ? "active" : ""}`}
                  onClick={() => { setMethod("mbway"); setError(""); }}
                >
                  MB WAY
                </button>
                <button
                  className={`method-tab ${method === "multibanco" ? "active" : ""}`}
                  onClick={() => { setMethod("multibanco"); setError(""); }}
                >
                  Multibanco
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="error-message">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* MB WAY — phone input */}
              {method === "mbway" && (
                <div className="phone-input-wrapper">
                  <div className="phone-flag">
                    <span className="flag-emoji">🇵🇹</span>
                    <span>+351</span>
                  </div>
                  <div className="phone-divider" />
                  <input
                    className="phone-input"
                    type="tel"
                    placeholder="912 345 678"
                    value={phone}
                    onChange={handlePhoneInput}
                    maxLength={15}
                    autoComplete="tel"
                  />
                </div>
              )}

              {/* Multibanco — payer fields */}
              {method === "multibanco" && (
                <div className="multibanco-fields">
                  <div className="input-group">
                    <label>Nome completo</label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="João Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>E-mail</label>
                    <input
                      className="input-field"
                      type="email"
                      placeholder="joao@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>NIF</label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="123456789"
                      value={document}
                      onChange={(e) => setDocument(e.target.value.replace(/\D/g, ""))}
                      maxLength={9}
                    />
                  </div>
                </div>
              )}

              {/* Terms */}
              <label className="terms-row">
                <input
                  type="checkbox"
                  className="terms-checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span className="terms-text">
                  Li e aceito os{" "}
                  <a
                    href="#"
                    className="terms-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Termos e Condições
                  </a>
                </span>
              </label>

              {/* Pay button */}
              <button
                className="pay-button"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  "Pagar agora"
                )}
              </button>
            </>
          )}

          {/* ── PENDING STATE ── */}
          {step === "pending" && (
            <div className="status-screen">
              {method === "mbway" ? (
                <>
                  <div className="status-icon pending">⏳</div>
                  <div className="status-title">Aguardando confirmação</div>
                  <div className="status-desc">
                    Abrimos a notificação MB WAY no número:
                  </div>
                  <div className="mbway-pending-box">
                    <div className="mbway-phone-display">+351 {phone}</div>
                    <div className="mbway-hint">
                      <span className="pulse-dot" />
                      Aguardando aprovação no app MB WAY…
                    </div>
                  </div>
                  <div className="status-desc" style={{ marginTop: 8 }}>
                    Abra a app MB WAY e confirme o pagamento de{" "}
                    <strong>{formatAmount(AMOUNT)}</strong>.
                  </div>
                </>
              ) : (
                <>
                  <div className="status-icon pending">🏦</div>
                  <div className="status-title">Referência Multibanco</div>
                  <div className="status-desc">
                    Utilize os dados abaixo para efetuar o pagamento num ATM ou
                    Homebanking.
                  </div>
                  {txData?.referenceData && (
                    <div className="mb-reference-box">
                      <div className="mb-ref-row">
                        <span className="mb-ref-label">Entidade</span>
                        <span className="mb-ref-value">{txData.referenceData.entity}</span>
                      </div>
                      <div className="mb-ref-row">
                        <span className="mb-ref-label">Referência</span>
                        <span className="mb-ref-value">{txData.referenceData.reference}</span>
                      </div>
                      <div className="mb-ref-row">
                        <span className="mb-ref-label">Montante</span>
                        <span className="mb-ref-value">{formatAmount(AMOUNT)}</span>
                      </div>
                      {txData.referenceData.expiresAt && (
                        <div className="mb-ref-row">
                          <span className="mb-ref-label">Válido até</span>
                          <span className="mb-ref-value">{txData.referenceData.expiresAt}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── SUCCESS STATE ── */}
          {step === "success" && (
            <div className="status-screen">
              <div className="status-icon success">✅</div>
              <div className="status-title">Pagamento confirmado!</div>
              <div className="status-desc">
                O seu pagamento de <strong>{formatAmount(AMOUNT)}</strong> foi
                processado com sucesso.
              </div>
            </div>
          )}

          {/* ── FAILED STATE ── */}
          {step === "failed" && (
            <div className="status-screen">
              <div className="status-icon failed">❌</div>
              <div className="status-title">Pagamento recusado</div>
              <div className="status-desc">
                O pagamento não foi aprovado. Por favor tente novamente ou use
                outro método.
              </div>
              <button
                className="pay-button"
                style={{ marginTop: 16 }}
                onClick={() => { setStep("form"); setError(""); setTxData(null); }}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
