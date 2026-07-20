const ID_CONJUNTODADOS_CONTROLECHAVEIRO = 1036844912059449
function enviarEventoControleChaveiroMeta()
{
  const numero_cachebuster = Math.floor(Math.random() * 1000000000)

  if (typeof navigator === "undefined") {
    throw new Error(
      "parâmetro navigator ausente. Verifique se o programa está sendo executado em navegador de Internet",
    )
  }

  // dispara um sinalizador para a Meta
  const url = "https://www.facebook.com/tr" + "?id=" + ID_CONJUNTODADOS_CONTROLECHAVEIRO + "&ev=ButtonClick" + "&noscript=1" + "&cb=" + numero_cachebuster
  navigator.sendBeacon(url)
}