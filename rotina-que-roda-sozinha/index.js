  // ============================================================
  // Contador regressivo de 15 minutos a partir da abertura da página
  // ============================================================
  (function initCountdown(){
    var totalSeconds = 15 * 60; // 15 minutos
    var display = document.getElementById('countdown');

    function tick(){
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = totalSeconds % 60;
      display.textContent =
        String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

      if (totalSeconds <= 0){
        display.textContent = '00:00';
        clearInterval(timerId);
        return;
      }
      totalSeconds--;
    }

    tick();
    var timerId = setInterval(tick, 1000);
  })();