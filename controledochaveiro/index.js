// controledochaveiro/index.js
import { enviarEventoControleChaveiroMeta } from "../rastreador_eventos.js"

document.addEventListener("DOMContentLoaded", () => {
  if (typeof document === "undefined") {
    throw new Error(
      "parâmetro document ausente. Verifique se o programa está sendo executado em navegador de Internet",
    )
  }

  const botaoWhatsapp = document.getElementById("btn-whatsapp-chaveiro")

  if (botaoWhatsapp?.nodeType !== 1) {
    throw new Error(
      "elemento btn-whatsapp-chaveiro inválido. Verifique se o elemento existe no corpo da página",
    )
  }

  if (typeof window === "undefined") {
    throw new Error(
      "parâmetro window ausente. Verifique se o programa está sendo executado em navegador de Internet",
    )
  }

  botaoWhatsapp.addEventListener("click", () => {
    const numeroTelefone = "5512992223481"
    const mensagem = encodeURIComponent(
      "Olá, Thiago! Quero instalar o programa Controle do Chaveiro da MyKey e estou ciente da taxa única de instalação de R$ 100,00",
    )

    const url = `https://wa.me/${numeroTelefone}?text=${mensagem}`

    window.open(url, "_blank")

    // O rastreamento nunca deve quebrar o clique (por isso o try/catch).
    try {
      enviarEventoControleChaveiroMeta()
    } catch (erro) {
      console.warn("falha ao sinalizar evento para a Meta:", erro)
    }
  })
})
