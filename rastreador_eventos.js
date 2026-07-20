// rastreador_eventos.js
// Sinaliza o clique do botão de WhatsApp para a Meta, por dois caminhos com o
// MESMO event_id (a Meta deduplica):
//   1) /api/evento-meta  -> Conversions API no servidor (first-party, NÃO é
//      bloqueado por ad blocker). É o caminho confiável.
//   2) pixel /tr no navegador -> bônus quando não há bloqueador.
//
// O ID do pixel é público (fica no navegador de qualquer forma); a config
// sensível (token, dataset da CAPI) mora no servidor, em variáveis de ambiente.

const ID_CONJUNTODADOS_CONTROLECHAVEIRO = 1036844912059449

export function enviarEventoControleChaveiroMeta() {
  if (typeof navigator === "undefined") {
    throw new Error(
      "parâmetro navigator ausente. Verifique se o programa está sendo executado em navegador de Internet",
    )
  }

  const idEvento =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + "-" + Math.floor(Math.random() * 1000000000)

  // 1) Servidor (CAPI) — first-party, não bloqueável
  const corpo = JSON.stringify({
    event_id: idEvento,
    event_source_url: location.href,
  })
  navigator.sendBeacon(
    "/api/evento-meta",
    new Blob([corpo], { type: "application/json" }),
  )

  // 2) Pixel no navegador (bônus) — mesmo event_id p/ deduplicar; evento padrão Lead
  const numero_cachebuster = Math.floor(Math.random() * 1000000000)
  const url =
    "https://www.facebook.com/tr?id=" + ID_CONJUNTODADOS_CONTROLECHAVEIRO +
    "&ev=Lead&eid=" + idEvento + "&cb=" + numero_cachebuster
  navigator.sendBeacon(url)
}
