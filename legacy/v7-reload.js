// AUD-11: resgate de quem ainda tem o SW de maio (unicorn-v7). O index.html
// velho pede game.js?v=4.5 pela rede; o netlify.toml reescreve só essa URL
// para cá. O game.js de verdade é ES module e quebraria como script clássico
// (menu aparece, "Começar Aventura!" não responde). Aqui: força a checagem do
// SW, espera o cache v7 sumir (SW novo ativo) e recarrega — uma vez só.
(function () {
  try {
    if (sessionStorage.getItem('v7Rescue') === '1') return;
    sessionStorage.setItem('v7Rescue', '1');
  } catch (_) { return; }

  var done = false;
  function go() { if (done) return; done = true; location.reload(); }

  var sw = navigator.serviceWorker;
  if (!sw || !window.caches) return go();
  sw.getRegistration().then(function (r) { if (r) r.update(); }).catch(function () {});

  var tries = 0;
  (function poll() {
    caches.keys().then(function (keys) {
      if (keys.indexOf('unicorn-v7') === -1 || ++tries > 20) go();
      else setTimeout(poll, 400);
    }, go);
  })();
})();
