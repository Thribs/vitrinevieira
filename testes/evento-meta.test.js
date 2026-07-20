// testes/evento-meta.test.js — roda com: node testes/evento-meta.test.js
// Fica FORA de /api de propósito (a Vercel publicaria qualquer .js de /api
// como função). O .vercelignore também exclui esta pasta do deploy.
const assert = require("node:assert")

// analisarCookies extrai _fbp / _fbc do cabeçalho Cookie
{
  const { analisarCookies } = require("../api/evento-meta.js")
  const c = analisarCookies("_fbp=fb.1.123.456; _fbc=fb.1.789.abc; outro=x")
  assert.strictEqual(c._fbp, "fb.1.123.456")
  assert.strictEqual(c._fbc, "fb.1.789.abc")
  assert.strictEqual(c.outro, "x")
  console.log("OK: analisarCookies")
}

// montarEvento pega IP/UA/cookies dos headers e o event_id do corpo
{
  const { montarEvento } = require("../api/evento-meta.js")
  const req = {
    headers: {
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "user-agent": "Mozilla/5.0 Teste",
      referer: "https://www.vitrinevieira.com.br/controledochaveiro",
      cookie: "_fbp=fb.1.1.1",
    },
  }
  const ev = montarEvento(req, { event_id: "abc-123" })
  assert.strictEqual(ev.event_name, "Lead")
  assert.strictEqual(ev.action_source, "website")
  assert.strictEqual(ev.event_id, "abc-123")
  assert.strictEqual(ev.user_data.client_ip_address, "203.0.113.7") // 1º IP da lista
  assert.strictEqual(ev.user_data.client_user_agent, "Mozilla/5.0 Teste")
  assert.strictEqual(ev.user_data.fbp, "fb.1.1.1")
  assert.strictEqual(ev.event_source_url, "https://www.vitrinevieira.com.br/controledochaveiro")
  assert.ok(ev.event_time > 0)
  console.log("OK: montarEvento")
}

// handler chama a Graph API com o payload certo e devolve 200
async function testeHandler() {
  process.env.META_CAPI_TOKEN = "TOKEN_FAKE"
  delete require.cache[require.resolve("../api/evento-meta.js")]
  const handler = require("../api/evento-meta.js")

  let capturado = null
  global.fetch = async (url, opts) => {
    capturado = { url, body: JSON.parse(opts.body) }
    return { ok: true, text: async () => '{"events_received":1}' }
  }

  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "UA" },
    body: { event_id: "e1", test_event_code: "TEST123", event_source_url: "https://x/y" },
  }
  let status = 0
  let enviado = ""
  const res = {
    status(s) { status = s; return this },
    send(t) { enviado = t },
    json(o) { enviado = JSON.stringify(o) },
  }

  await handler(req, res)
  assert.strictEqual(status, 200)
  assert.strictEqual(enviado, '{"events_received":1}')
  assert.ok(capturado.url.includes("/1036844912059449/events"), "URL do conjunto")
  assert.ok(capturado.url.includes("access_token=TOKEN_FAKE"), "token do ambiente")
  assert.strictEqual(capturado.body.data[0].event_name, "Lead")
  assert.strictEqual(capturado.body.data[0].event_id, "e1")
  assert.strictEqual(capturado.body.data[0].user_data.client_ip_address, "1.2.3.4")
  assert.strictEqual(capturado.body.test_event_code, "TEST123")
  console.log("OK: handler -> Graph API")
}

// handler sem token responde 500 (não vaza, não chama a Meta)
async function testeSemToken() {
  delete process.env.META_CAPI_TOKEN
  delete require.cache[require.resolve("../api/evento-meta.js")]
  const handler = require("../api/evento-meta.js")
  let status = 0
  const res = { status(s) { status = s; return this }, send() {}, json() {} }
  await handler({ method: "POST", headers: {}, body: {} }, res)
  assert.strictEqual(status, 500)
  console.log("OK: sem token -> 500")
}

;(async () => {
  await testeHandler()
  await testeSemToken()
  console.log("\nTODOS OS TESTES PASSARAM ✅")
})().catch((e) => { console.error("FALHOU:", e); process.exit(1) })
