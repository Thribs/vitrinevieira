// testes/evento-meta.test.js — roda com: node testes/evento-meta.test.js
// ESM (o projeto é "type": "module"). Fica FORA de /api de propósito (a Vercel
// publicaria qualquer .js de /api como função); o .vercelignore também exclui.
import assert from "node:assert"
import receberEvento, { montarEvento, analisarCookies } from "../api/evento-meta.js"

// analisarCookies extrai _fbp / _fbc do cabeçalho Cookie
{
  const cookies = analisarCookies("_fbp=fb.1.123.456; _fbc=fb.1.789.abc; outro=x")
  assert.strictEqual(cookies._fbp, "fb.1.123.456")
  assert.strictEqual(cookies._fbc, "fb.1.789.abc")
  assert.strictEqual(cookies.outro, "x")
  console.log("OK: analisarCookies")
}

// montarEvento pega IP/agente/cookies dos cabeçalhos e o event_id do corpo
{
  const requisicao = {
    headers: {
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "user-agent": "Mozilla/5.0 Teste",
      referer: "https://www.vitrinevieira.com.br/controledochaveiro",
      cookie: "_fbp=fb.1.1.1",
    },
  }
  const evento = montarEvento(requisicao, { event_id: "abc-123" })
  assert.strictEqual(evento.event_name, "Lead")
  assert.strictEqual(evento.action_source, "website")
  assert.strictEqual(evento.event_id, "abc-123")
  assert.strictEqual(evento.user_data.client_ip_address, "203.0.113.7") // 1º IP da lista
  assert.strictEqual(evento.user_data.client_user_agent, "Mozilla/5.0 Teste")
  assert.strictEqual(evento.user_data.fbp, "fb.1.1.1")
  assert.strictEqual(evento.event_source_url, "https://www.vitrinevieira.com.br/controledochaveiro")
  assert.ok(evento.event_time > 0)
  console.log("OK: montarEvento")
}

// Resposta falsa que grava o status e o corpo enviados
function respostaFalsa() {
  return {
    status(codigo) { this._status = codigo; return this },
    send(texto) { this._enviado = texto },
    json(objeto) { this._enviado = JSON.stringify(objeto) },
  }
}

// receberEvento chama a Graph API com o corpo certo e devolve 200
async function testeReceberEvento() {
  process.env.META_CAPI_TOKEN = "TOKEN_TESTE"
  process.env.META_DATASET_ID = "1036844912059449"

  let capturado = null
  global.fetch = async (endereco, opcoes) => {
    capturado = { endereco, corpo: JSON.parse(opcoes.body) }
    return { ok: true, text: async () => '{"events_received":1}' }
  }

  const requisicao = {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "UA" },
    body: { event_id: "e1", test_event_code: "TEST123", event_source_url: "https://x/y" },
  }
  const resposta = respostaFalsa()
  await receberEvento(requisicao, resposta)

  assert.strictEqual(resposta._status, 200)
  assert.strictEqual(resposta._enviado, '{"events_received":1}')
  assert.ok(capturado.endereco.includes("/1036844912059449/events"), "conjunto do ambiente")
  assert.ok(capturado.endereco.includes("access_token=TOKEN_TESTE"), "token do ambiente")
  assert.strictEqual(capturado.corpo.data[0].event_name, "Lead")
  assert.strictEqual(capturado.corpo.data[0].event_id, "e1")
  assert.strictEqual(capturado.corpo.data[0].user_data.client_ip_address, "1.2.3.4")
  assert.strictEqual(capturado.corpo.test_event_code, "TEST123")
  console.log("OK: receberEvento -> Graph API")
}

// Sem token OU sem conjunto -> 500 (não vaza, não chama a Meta)
async function testeConfigAusente() {
  delete process.env.META_CAPI_TOKEN
  process.env.META_DATASET_ID = "1036844912059449"
  const semToken = respostaFalsa()
  await receberEvento({ method: "POST", headers: {}, body: {} }, semToken)
  assert.strictEqual(semToken._status, 500)

  process.env.META_CAPI_TOKEN = "TOKEN_TESTE"
  delete process.env.META_DATASET_ID
  const semConjunto = respostaFalsa()
  await receberEvento({ method: "POST", headers: {}, body: {} }, semConjunto)
  assert.strictEqual(semConjunto._status, 500)
  console.log("OK: config ausente -> 500")
}

await testeReceberEvento()
await testeConfigAusente()
console.log("\nTODOS OS TESTES PASSARAM ✅")
