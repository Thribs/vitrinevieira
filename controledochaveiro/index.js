// controledochaveiro/index.js
import { enviarEventoMeta } from "../rastreador_eventos.js"

// Evento que este clique representa. "Contact" é o evento padrão da Meta para
// "alguém entrou em contato com a empresa" — que é o que abrir o WhatsApp é.
// Troque aqui se quiser outro nome (padrão ou personalizado).
const EVENTO_CLIQUE_WHATSAPP = "Contact"

function aoClicarWhatsapp() {
  const numeroTelefone = "5512992223481"
  const mensagem = encodeURIComponent(
    "Olá, Thiago! Quero instalar o programa Controle do Chaveiro da MyKey e estou ciente da taxa única de instalação de R$ 100,00",
  )
  const endereco = `https://wa.me/${numeroTelefone}?text=${mensagem}`
  window.open(endereco, "_blank")
  enviarEventoMeta(EVENTO_CLIQUE_WHATSAPP)
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
