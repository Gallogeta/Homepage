// Debug version: show ROM size before loading
window.addEventListener('DOMContentLoaded', function() {
  const GAMES = [
    { name: "Super_mario_brothers.nes", file: "/api/snes/Super_mario_brothers.nes" },
    { name: "Super Mario Bros. 3 (Europe) (Virtual Console)", file: "/api/snes/Super Mario Bros. 3 (Europe) (Virtual Console).nes" },
    { name: "Super Mario Bros. 3 (USA) (Rev 1)", file: "/api/snes/Super Mario Bros. 3 (USA) (Rev 1).nes" },
    { name: "Casino Kid 2", file: "/api/snes/Casino Kid 2.nes" },
    { name: "Bomberman II", file: "/api/snes/Bomberman II.nes" },
    { name: "Mega Man", file: "/api/snes/Mega Man.nes" },
    { name: "Knight Rider", file: "/api/snes/Knight Rider.nes" },
  ];
  let selected = 0;
  let nes = null;
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const errorDiv = document.getElementById('arcade-error');
  const romInfoDiv = document.createElement('div');
  romInfoDiv.style.color = '#ffd700';
  romInfoDiv.style.marginTop = '0.5rem';
  errorDiv.parentNode.insertBefore(romInfoDiv, errorDiv);
  function renderFrame(frameBuffer) {
    const imageData = ctx.getImageData(0, 0, 256, 240);
    for (let i = 0; i < frameBuffer.length; i++) {
      imageData.data[i] = frameBuffer[i];
    }
    ctx.putImageData(imageData, 0, 0);
  }
  function loadGame(idx) {
    errorDiv.textContent = '';
    romInfoDiv.textContent = '';
    selected = idx;
    document.querySelectorAll('.game-btn').forEach((btn, i) => {
      btn.classList.toggle('selected', i === idx);
    });
    fetch(GAMES[idx].file)
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.arrayBuffer().then(buf => ({ buf, res }));
      })
      .then(({ buf, res }) => {
        romInfoDiv.textContent = `ROM size: ${buf.byteLength} bytes, Content-Type: ${res.headers.get('content-type')}`;
        if (nes) nes.reset();
        nes = new jsnes.NES({
          onFrame: renderFrame,
          onAudioSample: function() {},
        });
        try {
          nes.loadROM(new Uint8Array(buf));
          nes.start();
        } catch (e) {
          errorDiv.textContent = 'ROM load error: ' + e.message;
        }
      })
      .catch(e => {
        errorDiv.textContent = 'Fetch error: ' + e.message;
      });
  }
  // Build menu
  const gameListDiv = document.getElementById('game-list');
  GAMES.forEach((game, idx) => {
    const btn = document.createElement('button');
    btn.textContent = game.name;
    btn.className = 'game-btn' + (idx === selected ? ' selected' : '');
    btn.onclick = () => loadGame(idx);
    gameListDiv.appendChild(btn);
  });
  // Initial load
  loadGame(selected);
  // Fullscreen
  document.getElementById('fullscreen-btn').onclick = function() {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
});
