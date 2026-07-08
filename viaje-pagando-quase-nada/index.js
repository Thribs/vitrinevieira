/* ============================================================
   1) CONTADOR REGRESSIVO — 15 min a partir da abertura da página
   ============================================================ */
(function(){
  var total = 15 * 60; // segundos
  var el = document.getElementById('timer');
  function tick(){
    var m = Math.floor(total / 60);
    var s = total % 60;
    el.textContent = (m<10?'0':'')+m + ':' + (s<10?'0':'')+s;
    if(total > 0){ total--; }
  }
  tick();
  setInterval(tick, 1000);
})();

/* ============================================================
   2) BULLETS DE BENEFÍCIOS — injetados p/ manter HTML enxuto
   ============================================================ */
(function(){
  var items = [
    ["Como saber, em 10 minutos, exatamente quanto você tem de milhas","mesmo espalhadas em cartões e programas que você nem lembra que tem."],
    ["O segredo para enxergar as passagens que valem a pena de verdade","que quem entende de milhas usa todo dia, mas quase ninguém explica pra iniciante."],
    ["Como impedir que suas milhas vençam","sem precisar entender de tecnologia nem virar especialista."],
    ["Por que a passagem aparece \"cara\"","e o ajuste simples que faz o preço em milhas despencar na sua frente."],
    ["Como emitir sua primeira viagem gastando quase nada","mesmo começando com pouca milha e do absoluto zero."],
    ["O jeito de escolher o destino que \"rende mais\"","pra você sentir o gostinho da vitória logo na primeira viagem."],
    ["Como transformar as contas que você já paga","(luz, internet, streaming) em milhas — sem gastar um centavo a mais."],
    ["O hábito de 5 minutos por mês","que separa quem perde milhas todo ano de quem viaja de graça com a família."]
  ];
  var plane = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" fill="currentColor"/></svg>';
  var html = items.map(function(it){
    return '<div class="benefit"><div class="ico">'+plane+'</div><p><b>'+it[0]+'</b> — '+it[1]+'</p></div>';
  }).join('');
  document.getElementById('benefits').innerHTML = html;
})();

/* ============================================================
   3) OBJEÇÕES / FAQ — acordeão acessível
   ============================================================ */
(function(){
  var qa = [
    ["\"Já gastei dinheiro com curso e não deu em nada…\"","Eu te entendo, e é justamente por isso que este guia não é mais um curso gigante e cansativo que você nunca termina. É direto ao ponto: você lê, faz o passo a passo e já começa a agir na mesma semana. Nada de horas de vídeo pra decorar teoria — é feito pra sair do papel."],
    ["\"Será que funciona pra mim? Sou leigo e não tenho tantas milhas…\"","Este guia foi escrito exatamente pra você que é iniciante e acha que \"não tem o suficiente\". A verdade é que a maioria das pessoas tem muito mais milhas do que imagina — e você não precisa de uma montanha delas pra começar. Tudo é explicado em português claro, do jeito que se explica pra um amigo."],
    ["\"E se for complicado demais e eu não conseguir seguir sozinho?\"","Cada passo é tão simples que dá pra fazer sentado no sofá, só com o celular na mão. Não tem planilha maluca, não tem programa pra instalar. Se você sabe abrir o aplicativo do seu cartão, você já sabe o suficiente pra começar hoje."]
  ];
  var box = document.getElementById('faq');
  box.innerHTML = qa.map(function(it,i){
    return '<div class="qa"><button aria-expanded="false" aria-controls="ans'+i+'"><span>'+it[0]+'</span><span class="plus" aria-hidden="true">+</span></button><div class="ans" id="ans'+i+'"><p>'+it[1]+'</p></div></div>';
  }).join('');
  box.querySelectorAll('.qa button').forEach(function(btn){
    btn.addEventListener('click', function(){
      var card = btn.parentElement;
      var ans = card.querySelector('.ans');
      var open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true':'false');
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : null;
    });
  });
})();

/* ============================================================
   4) Ano do rodapé
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();
