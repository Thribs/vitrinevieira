// controledochaveiro/index.js
import { enviarEventoControleChaveiroMeta } from "../rastreador_eventos.js"

function aoClicarWhatsapp() {
  const numeroTelefone = "5512992223481"
  const mensagem = encodeURIComponent(
    "Olá, Thiago! Quero instalar o programa Controle do Chaveiro da MyKey e estou ciente da taxa única de instalação de R$ 100,00",
  )
  const endereco = `https://wa.me/${numeroTelefone}?text=${mensagem}`
  window.open(endereco, "_blank")
  enviarEventoControleChaveiroMeta()
}

function aoCarregarPagina() {
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

  botaoWhatsapp.addEventListener("click", aoClicarWhatsapp)
}

document.addEventListener("DOMContentLoaded", aoCarregarPagina)
