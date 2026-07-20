// api/evento-meta.js
// Função serverless (Vercel) que recebe o clique do site — first-party, então
// bloqueadores de anúncio NÃO alcançam — e repassa o evento para a Conversions
// API da Meta (server-side). O token de acesso fica em variável de ambiente na
// Vercel (META_CAPI_TOKEN) e NUNCA no repositório.

const ID_CONJUNTODADOS = "1036844912059449"
const VERSAO_GRAPH = "v21.0"

// Lê o cabeçalho Cookie ("a=1; b=2") num objeto { a: "1", b: "2" }.
function analisarCookies(cabecalho) {
  const mapa = {}
  ;(cabecalho || "").split(";").forEach((parte) => {
    const igual = parte.indexOf("=")
    if (igual > -1) {
      const nome = parte.slice(0, igual).trim()
      mapa[nome] = decodeURIComponent(parte.slice(igual + 1).trim())
    }
  })
  return mapa
}

// Monta o objeto de evento no formato da Conversions API. Sem PII: só sinais
// técnicos (IP, user agent e os cookies _fbp/_fbc do próprio pixel, se houver),
// que a Meta usa para a qualidade de correspondência.
function montarEvento(req, corpo) {
  const cookies = analisarCookies(req.headers.cookie)
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()
  const userAgent = req.headers["user-agent"] || ""
  return {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: corpo.event_source_url || req.headers.referer || undefined,
    event_id: corpo.event_id || undefined, // mesmo id do pixel -> deduplicação
    user_data: {
      client_ip_address: ip || undefined,
      client_user_agent: userAgent || undefined,
      fbp: cookies._fbp || undefined,
      fbc: cookies._fbc || undefined,
    },
  }
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "método não permitido" })
    return
  }
  const token = process.env.META_CAPI_TOKEN
  if (!token) {
    res.status(500).json({ erro: "META_CAPI_TOKEN ausente no ambiente" })
    return
  }

  let corpo = req.body
  if (typeof corpo === "string") {
    try { corpo = JSON.parse(corpo) } catch { corpo = {} }
  }
  corpo = corpo || {}

  const payload = { data: [montarEvento(req, corpo)] }
  // Só em teste: o corpo pode trazer test_event_code para aparecer no
  // "Testar Eventos" da Meta em tempo real (a CAPI honra esse campo).
  if (corpo.test_event_code) payload.test_event_code = corpo.test_event_code

  const url =
    "https://graph.facebook.com/" + VERSAO_GRAPH + "/" + ID_CONJUNTODADOS +
    "/events?access_token=" + encodeURIComponent(token)

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const texto = await resposta.text()
    res.status(resposta.ok ? 200 : 502).send(texto)
  } catch (erro) {
    res.status(502).json({ erro: "falha ao falar com a Meta", detalhe: String(erro) })
  }
}

module.exports = handler
module.exports.montarEvento = montarEvento
module.exports.analisarCookies = analisarCookies
