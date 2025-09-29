// Arcade custom menu for EmulatorJS integration
window.addEventListener('DOMContentLoaded', function() {
  // List NES ROMs in SNES dir (update as needed)
  // List of SNES games, alphabetically
  const GAMES = [
    { name: "Bomberman 2", file: "/api/snes/Bomberman-2.nes" },
    { name: "Casino Kid 2", file: "/api/snes/Casino-Kid-2.nes" },
    { name: "Contra", file: "/api/snes/contra.nes" },
    { name: "Darkwing Duck", file: "/api/snes/Darkwing_duck.nes" },
    { name: "Flintstones", file: "/api/snes/flintstones.nes" },
    { name: "Kick Master", file: "/api/snes/KickMaster.nes" },
    { name: "Knight Rider", file: "/api/snes/Knight-Rider.nes" },
    { name: "Mega Man", file: "/api/snes/Mega-Man.nes" },
    { name: "Ninja Gaiden 3", file: "/api/snes/Ninja_gaiden3.nes" },
    { name: "Rescue Rangers 2", file: "/api/snes/rescue_rangers2.nes" },
    { name: "Super Mario Bros 3", file: "/api/snes/Super-Mario-Bros-3.nes" },
    { name: "Super Mario Brothers", file: "/api/snes/Super_mario_brothers.nes" },
    { name: "Teenage Mutant Ninja Turtles", file: "/api/snes/Teenage_mutant_ninja_turtles.nes" },
    { name: "Teenage Mutant Ninja Turtles 3", file: "/api/snes/Teenage_mutant_ninja_turtles3.nes" },
    { name: "Track & Field 2", file: "/api/snes/Track_&_field2.nes" },
  ];
  const MEDIA = [
    "01.mp3","02.mp3","03.mp3","04.mp3","05.mp3","06.mp3","07.mp3","08.mp3","09.mp3","010.mp3","011.mp3"
  ];
  let selectedGame = 0;
  let selectedMusic = 0;
  const gameFrame = document.getElementById('emulator-frame');
  const gameListDiv = document.getElementById('game-list');
  const musicListDiv = document.getElementById('music-list');
  const musicPlayer = document.getElementById('arcade-music');
  
  // Mobile elements
  const mobileGameListDiv = document.getElementById('mobile-game-list');
  const mobileMusicListDiv = document.getElementById('mobile-music-list');
  const mobileMusicPlayer = document.getElementById('mobile-arcade-music');
  const mobileControls = document.querySelector('.mobile-controls');
  
  // Check if mobile
  const isMobile = window.innerWidth <= 768;
  
  // Show mobile controls on mobile devices
  if (isMobile && mobileControls) {
    mobileControls.style.display = 'block';
  }

  // Build game menu (desktop and mobile)
  function createGameButton(game, idx, container) {
    const btn = document.createElement('button');
    btn.textContent = game.name;
    btn.className = 'order-btn menu-btn' + (idx === selectedGame ? ' active' : '');
    btn.onclick = () => {
      selectedGame = idx;
      document.querySelectorAll('.menu-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
      gameFrame.src = `/emulatorjs/indexe.html?rom=${encodeURIComponent(game.file)}`;
      // Close mobile dropdown after selection
      if (isMobile) {
        document.getElementById('games-dropdown').classList.remove('show');
        document.querySelector('#games-toggle span').textContent = '▼';
      }
    };
    container.appendChild(btn);
  }

  // Create game lists for both desktop and mobile
  GAMES.forEach((game, idx) => {
    createGameButton(game, idx, gameListDiv);
    if (mobileGameListDiv) {
      createGameButton(game, idx, mobileGameListDiv);
    }
  });
  // Initial game load: load iframe with first ROM
  gameFrame.src = `/emulatorjs/indexe.html?rom=${encodeURIComponent(GAMES[selectedGame].file)}`;

  // Build music menu (desktop and mobile)
  function createMusicButton(file, idx, container) {
    const btn = document.createElement('button');
    btn.textContent = file;
    btn.className = 'order-btn menu-btn' + (idx === selectedMusic ? ' active' : '');
    btn.onclick = () => {
      selectedMusic = idx;
      document.querySelectorAll('.menu-btn').forEach((b, i) => {
        if (b.parentNode === musicListDiv || b.parentNode === mobileMusicListDiv) {
          b.classList.toggle('active', i === idx);
        }
      });
      const currentPlayer = isMobile && mobileMusicPlayer ? mobileMusicPlayer : musicPlayer;
      currentPlayer.src = `/media/${file}`;
      currentPlayer.play();
      // Close mobile dropdown after selection
      if (isMobile) {
        const dropdown = document.getElementById('music-dropdown');
        if (dropdown) {
          dropdown.classList.remove('show');
          const toggle = document.querySelector('#music-toggle span');
          if (toggle) toggle.textContent = '▼';
        }
      }
    };
    container.appendChild(btn);
  }

  // Create music lists for both desktop and mobile
  MEDIA.forEach((file, idx) => {
    createMusicButton(file, idx, musicListDiv);
    if (mobileMusicListDiv) {
      createMusicButton(file, idx, mobileMusicListDiv);
    }
  });

  // Initial music load for both players
  musicPlayer.src = `/media/${MEDIA[selectedMusic]}`;
  if (mobileMusicPlayer) {
    mobileMusicPlayer.src = `/media/${MEDIA[selectedMusic]}`;
  }

  // Mobile dropdown toggle functionality
  if (isMobile) {
    const gamesToggle = document.getElementById('games-toggle');
    const musicToggle = document.getElementById('music-toggle');
    const gamesDropdown = document.getElementById('games-dropdown');
    const musicDropdown = document.getElementById('music-dropdown');

    if (gamesToggle && gamesDropdown) {
      gamesToggle.onclick = () => {
        const isOpen = gamesDropdown.classList.contains('show');
        gamesDropdown.classList.toggle('show');
        const arrow = gamesToggle.querySelector('span');
        if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
        // Close music dropdown
        if (musicDropdown) musicDropdown.classList.remove('show');
        const musicArrow = musicToggle.querySelector('span');
        if (musicArrow) musicArrow.textContent = '▼';
      };
    }

    if (musicToggle && musicDropdown) {
      musicToggle.onclick = () => {
        const isOpen = musicDropdown.classList.contains('show');
        musicDropdown.classList.toggle('show');
        const arrow = musicToggle.querySelector('span');
        if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
        // Close games dropdown
        if (gamesDropdown) gamesDropdown.classList.remove('show');
        const gamesArrow = gamesToggle.querySelector('span');
        if (gamesArrow) gamesArrow.textContent = '▼';
      };
    }
  }
});
