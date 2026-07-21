// testes/evento-meta.test.js — roda com: node testes/evento-meta.test.js
// ESM (o projeto é "type": "module"). Fica FORA de /api de propósito (a Vercel
// publicaria qualquer .js de /api como função); o .vercelignore também exclui.
// O export default já vem embrulhado pelo middleware comTratamentoDeErros, então
// os testes verificam a resposta HTTP final (200 / 405 / 500).
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
  const evento = montarEvento(requisicao, { event_name: "Contact", event_id: "abc-123" })
  assert.strictEqual(evento.event_name, "Contact") // veio do corpo, não imposto
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

// POST válido -> 200 e chamada à Graph API com o corpo certo
async function testeValido() {
  process.env.META_CAPI_TOKEN = "TOKEN_TESTE"
  process.env.META_DATASET_ID = "1036844912059449"

  let capturado = null
  function fetchFalso(endereco, opcoes) {
    capturado = { endereco, corpo: JSON.parse(opcoes.body) }
    function lerTexto() { return Promise.resolve('{"events_received":1}') }
    return Promise.resolve({ ok: true, text: lerTexto })
  }
  global.fetch = fetchFalso

  const requisicao = {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "UA" },
    body: { event_name: "Contact", event_id: "e1", test_event_code: "TEST123" },
  }
  const resposta = respostaFalsa()
  await receberEvento(requisicao, resposta)

  assert.strictEqual(resposta._status, 200)
  assert.strictEqual(resposta._enviado, '{"events_received":1}')
  assert.ok(capturado.endereco.includes("/1036844912059449/events"), "conjunto do ambiente")
  assert.ok(capturado.endereco.includes("access_token=TOKEN_TESTE"), "token do ambiente")
  assert.strictEqual(capturado.corpo.data[0].event_name, "Contact")
  assert.strictEqual(capturado.corpo.data[0].event_id, "e1")
  assert.strictEqual(capturado.corpo.data[0].user_data.client_ip_address, "1.2.3.4")
  assert.strictEqual(capturado.corpo.test_event_code, "TEST123")
  console.log("OK: POST válido -> 200 + Graph API")
}

// Método diferente de POST -> 405 (a guarda lança, o middleware traduz)
async function testeMetodoErrado() {
  process.env.META_CAPI_TOKEN = "TOKEN_TESTE"
  process.env.META_DATASET_ID = "1036844912059449"
  const resposta = respostaFalsa()
  await receberEvento({ method: "GET", headers: {}, body: {} }, resposta)
  assert.strictEqual(resposta._status, 405)
  console.log("OK: método errado -> 405")
}

// Sem token ou sem conjunto -> 500 (a guarda lança, o middleware traduz)
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

// POST sem event_name -> 400 (evento é genérico, mas o nome é obrigatório)
async function testeSemEvento() {
  process.env.META_CAPI_TOKEN = "TOKEN_TESTE"
  process.env.META_DATASET_ID = "1036844912059449"
  const resposta = respostaFalsa()
  await receberEvento({ method: "POST", headers: {}, body: { event_id: "e1" } }, resposta)
  assert.strictEqual(resposta._status, 400)
  console.log("OK: sem event_name -> 400")
}

await testeValido()
await testeMetodoErrado()
await testeConfigAusente()
await testeSemEvento()
console.log("\nTODOS OS TESTES PASSARAM ✅")
