// api/evento-meta.js
// Função serverless (Vercel) que recebe o clique do site — first-party, então
// bloqueadores de anúncio NÃO alcançam — e repassa o evento para a Conversions
// API da Meta (server-side). Configuração sensível vem de variáveis de ambiente
// (META_CAPI_TOKEN e META_DATASET_ID), NUNCA do repositório.
//
// Estilo da casa: sem try/catch, sem .catch, sem arrow. As cláusulas de guarda
// LANÇAM erro tipado (ErroHttp), que o middleware comTratamentoDeErros traduz
// em resposta HTTP. A rejeição da chamada à Meta é tratada como valor com
// funções nomeadas.

import { ErroHttp, comTratamentoDeErros } from "../lib/http.js"

const VERSAO_GRAPH = "v21.0"

// Lê o cabeçalho Cookie ("a=1; b=2") num objeto { a: "1", b: "2" }.
export function analisarCookies(cabecalho) {
  const mapa = {}
  for (const parte of (cabecalho || "").split(";")) {
    const igual = parte.indexOf("=")
    if (igual < 0) continue
    const nome = parte.slice(0, igual).trim()
    mapa[nome] = decodeURIComponent(parte.slice(igual + 1).trim())
  }
  return mapa
}

// Monta o objeto de evento no formato da Conversions API. Sem dados pessoais:
// só sinais técnicos (IP, agente do usuário e os cookies _fbp/_fbc do próprio
// pixel, se houver), que a Meta usa para a qualidade de correspondência.
export function montarEvento(requisicao, corpo) {
  const cookies = analisarCookies(requisicao.headers.cookie)
  const ip = String(requisicao.headers["x-forwarded-for"] || "").split(",")[0].trim()
  const agenteUsuario = requisicao.headers["user-agent"] || ""
  return {
    event_name: "Lead",
    // event_time em UTC: Date.now() são milissegundos desde a época Unix (sempre
    // UTC, independe do fuso do servidor); dividir por 1000 dá os segundos que a
    // Conversions API exige.
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: corpo.event_source_url || requisicao.headers.referer || undefined,
    event_id: corpo.event_id || undefined, // mesmo id do pixel -> deduplicação
    user_data: {
      client_ip_address: ip || undefined,
      client_user_agent: agenteUsuario || undefined,
      fbp: cookies._fbp || undefined,
      fbc: cookies._fbc || undefined,
    },
  }
}

function receberEvento(requisicao, resposta) {
  // Guarda: só POST.
  if (requisicao.method !== "POST") {
    throw new ErroHttp(405, "método não permitido")
  }

  // Guarda: configuração obrigatória no ambiente.
  const token = process.env.META_CAPI_TOKEN
  const idConjunto = process.env.META_DATASET_ID
  if (!token || !idConjunto) {
    throw new ErroHttp(500, "META_CAPI_TOKEN e/ou META_DATASET_ID ausentes no ambiente")
  }

  // A Vercel já entrega o corpo JSON como objeto; se não vier objeto, ignora.
  let corpo = requisicao.body
  if (!corpo || typeof corpo !== "object") corpo = {}

  const corpoParaMeta = { data: [montarEvento(requisicao, corpo)] }
  // Só em teste: o corpo pode trazer test_event_code para o evento aparecer no
  // "Testar Eventos" da Meta em tempo real (a CAPI honra esse campo).
  if (corpo.test_event_code) corpoParaMeta.test_event_code = corpo.test_event_code

  const endereco =
    `https://graph.facebook.com/${VERSAO_GRAPH}/${idConjunto}` +
    `/events?access_token=${encodeURIComponent(token)}`

  // Resposta da Meta tratada como valor (checa .ok); a rejeição de rede sobe
  // para o middleware. Funções nomeadas, sem arrow.
  function aoResponderMeta(respostaMeta) {
    function aoLerCorpo(texto) {
      resposta.status(respostaMeta.ok ? 200 : 502).send(texto)
    }
    return respostaMeta.text().then(aoLerCorpo)
  }

  return fetch(endereco, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpoParaMeta),
  }).then(aoResponderMeta)
}

export default comTratamentoDeErros(receberEvento)
