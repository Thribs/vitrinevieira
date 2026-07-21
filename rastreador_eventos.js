// rastreador_eventos.js
// Envia um evento genérico para a Meta, por dois caminhos com o MESMO event_id
// (a Meta deduplica):
//   1) /api/evento-meta  -> Conversions API no servidor (first-party, NÃO é
//      bloqueado por ad blocker). É o caminho confiável.
//   2) pixel /tr no navegador -> bônus quando não há bloqueador.
//
// Genérico: o nome do evento vem de quem chama. O ID do pixel é público (fica no
// navegador de qualquer forma); a config sensível (token, dataset da CAPI) mora
// no servidor, em variáveis de ambiente.

const ID_CONJUNTODADOS_CONTROLECHAVEIRO = 1036844912059449

export function enviarEventoMeta(nomeEvento) {
  if (typeof navigator === "undefined") {
    throw new Error(
      "parâmetro navigator ausente. Verifique se o programa está sendo executado em navegador de Internet",
    )
  }
  if (!nomeEvento) {
    throw new Error("nomeEvento é obrigatório para registrar o evento na Meta")
  }

  const idEvento =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + "-" + Math.floor(Math.random() * 1000000000)

  // 1) Servidor (CAPI) — first-party, não bloqueável
  const corpo = JSON.stringify({
    event_name: nomeEvento,
    event_id: idEvento,
    event_source_url: location.href,
  })
  navigator.sendBeacon(
    "/api/evento-meta",
    new Blob([corpo], { type: "application/json" }),
  )

  // 2) Pixel no navegador (bônus) — mesmo event_id p/ deduplicar
  const numero_cachebuster = Math.floor(Math.random() * 1000000000)
  const endereco =
    "https://www.facebook.com/tr?id=" + ID_CONJUNTODADOS_CONTROLECHAVEIRO +
    "&ev=" + encodeURIComponent(nomeEvento) + "&eid=" + idEvento +
    "&cb=" + numero_cachebuster
  navigator.sendBeacon(endereco)
}
