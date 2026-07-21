// lib/http.js
// Erro tipado (carrega o status HTTP) e um middleware que traduz os erros
// lançados pelas cláusulas de guarda em respostas HTTP.
// Estilo da casa: sem try/catch e sem .catch — a rejeição da promessa é tratada
// como valor via .then(aoOk, aoFalhar) com funções nomeadas; sem arrow.

export class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem)
    this.name = "ErroHttp"
    this.status = status
    this.mensagem = mensagem
  }
}

// Recebe um manipulador de rota e devolve outro que responde o erro certo
// quando uma guarda lança (síncrono) ou quando a promessa do manipulador
// rejeita (assíncrono). Promise.resolve().then(executar) transforma um throw
// síncrono em rejeição, então tudo cai no mesmo tratador — sem try/catch.
export function comTratamentoDeErros(manipulador) {
  return function manipuladorProtegido(requisicao, resposta) {
    function executar() {
      return manipulador(requisicao, resposta)
    }
    function aoFalhar(erro) {
      const status = erro && erro.status ? erro.status : 500
      const mensagem = (erro && (erro.mensagem || erro.message)) || String(erro)
      resposta.status(status).json({ erro: mensagem })
    }
    return Promise.resolve().then(executar).then(undefined, aoFalhar)
  }
}
