// Arcade custom menu for EmulatorJS integration
window.addEventListener('DOMContentLoaded', function() {
  // NES Games
  const NES_GAMES = [
    { name: "100 in 1", file: "/api/snes/100in1.nes", system: "NES" },
    { name: "Bomberman 2", file: "/api/snes/Bomberman-2.nes", system: "NES" },
    { name: "Casino Kid 2", file: "/api/snes/Casino-Kid-2.nes", system: "NES" },
    { name: "Contra", file: "/api/snes/contra.nes", system: "NES" },
    { name: "Darkwing Duck", file: "/api/snes/Darkwing_duck.nes", system: "NES" },
    { name: "Dragon Ball", file: "/api/snes/Dragon Ball.nes", system: "NES" },
    { name: "Flintstones", file: "/api/snes/flintstones.nes", system: "NES" },
    { name: "Hot Slot", file: "/api/snes/Hot Slot.nes", system: "NES" },
    { name: "Ice Climber", file: "/api/snes/Ice Climber.nes", system: "NES" },
    { name: "Kick Master", file: "/api/snes/KickMaster.nes", system: "NES" },
    { name: "Knight Rider", file: "/api/snes/Knight-Rider.nes", system: "NES" },
    { name: "Mega Man", file: "/api/snes/Mega-Man.nes", system: "NES" },
    { name: "Mortal Kombat 4", file: "/api/snes/Mortal Kombat 4.nes", system: "NES" },
    { name: "Naughty Kokkun's Gourmet World", file: "/api/snes/NaughtyKokkunsGourmetWorld.nes", system: "NES" },
    { name: "Nekketsu Soccer", file: "/api/snes/Nekketsu soccer.nes", system: "NES" },
    { name: "Nekketsu! Street Basket", file: "/api/snes/Nekketsu! Street Basket.nes", system: "NES" },
    { name: "Ninja Gaiden 3", file: "/api/snes/Ninja_gaiden3.nes", system: "NES" },
    { name: "Rescue Rangers 2", file: "/api/snes/rescue_rangers2.nes", system: "NES" },
    { name: "River City Ransom", file: "/api/snes/River City Ransom.nes", system: "NES" },
    { name: "Super Mario Bros 3", file: "/api/snes/Super-Mario-Bros-3.nes", system: "NES" },
    { name: "Super Mario Brothers", file: "/api/snes/Super_mario_brothers.nes", system: "NES" },
    { name: "Teenage Mutant Ninja Turtles", file: "/api/snes/Teenage_mutant_ninja_turtles.nes", system: "NES" },
    { name: "Teenage Mutant Ninja Turtles 3", file: "/api/snes/Teenage_mutant_ninja_turtles3.nes", system: "NES" },
    { name: "Track & Field 2", file: "/api/snes/Track_&_field2.nes", system: "NES" },
  ];
  
  // GBA Games
  const GBA_GAMES = [
    { name: "Doom", file: "/api/gba/Doom.gba", system: "GBA" },
    { name: "Doom II", file: "/api/gba/Doom II.gba", system: "GBA" },
    { name: "Dragon Ball - Advanced Adventure", file: "/api/gba/Dragon Ball - Advanced Adventure.gba", system: "GBA" },
    { name: "Dragon Ball Z - Supersonic Warriors", file: "/api/gba/Dragon Ball Z - Supersonic Warriors.gba", system: "GBA" },
    { name: "Grand Theft Auto Advance", file: "/api/gba/Grand Theft Auto Advance.gba", system: "GBA" },
    { name: "Need for Speed - Most Wanted", file: "/api/gba/Need for Speed - Most Wanted.gba", system: "GBA" },
    { name: "Need for Speed - Underground 2", file: "/api/gba/Need for Speed - Underground 2.gba", system: "GBA" },
    { name: "Pokemon - Emerald Version", file: "/api/gba/Pokemon - Emerald Version.gba", system: "GBA" },
    { name: "Pokemon - Leaf Green Version", file: "/api/gba/Pokemon - Leaf Green Version.gba", system: "GBA" },
    { name: "Super Mario Advance 4", file: "/api/gba/Super Mario Advance 4.gba", system: "GBA" },
  ];
  
  // Combine all games for compatibility
  const GAMES = [...NES_GAMES, ...GBA_GAMES];
  const MEDIA = [
    "01.mp3","02.mp3","03.mp3","04.mp3","05.mp3","06.mp3","07.mp3","08.mp3","09.mp3","010.mp3","011.mp3"
  ];
  let selectedGame = 0;
  const gameFrame = document.getElementById('emulator-frame');
  const nesGameListDiv = document.getElementById('game-list');
  const gbaGameListDiv = document.getElementById('gba-game-list');
  
  // Mobile elements
  const mobileNesListDiv = document.getElementById('mobile-game-list');
  const mobileGbaListDiv = document.getElementById('mobile-gba-list');
  const mobileControls = document.querySelector('.mobile-controls');
  
  // Check if mobile
  const isMobile = window.innerWidth <= 768;
  
  // Show mobile controls on mobile devices
  if (isMobile && mobileControls) {
    mobileControls.style.display = 'block';
  }

  // Get authentication token from localStorage
  function getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  }
  
  // Build ROM URL with authentication token
  function buildRomUrl(gameFile) {
    const token = getAuthToken();
    if (token) {
      return `${gameFile}?token=${encodeURIComponent(token)}`;
    }
    return gameFile;
  }

  // Build game menu (desktop and mobile)
  function createGameButton(game, container, globalIdx) {
    const btn = document.createElement('button');
    btn.textContent = game.name;
    btn.className = 'order-btn menu-btn' + (globalIdx === selectedGame ? ' active' : '');
    btn.onclick = () => {
      selectedGame = globalIdx;
      document.querySelectorAll('.menu-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const romUrl = buildRomUrl(game.file);
      gameFrame.src = `/emulatorjs/indexe.html?rom=${encodeURIComponent(romUrl)}`;
      // Close mobile dropdown after selection
      if (isMobile && document.getElementById('games-dropdown')) {
        document.getElementById('games-dropdown').classList.remove('show');
        document.querySelector('#games-toggle span').textContent = '▼';
      }
    };
    container.appendChild(btn);
  }

  // Create NES game list (desktop and mobile)
  let globalIdx = 0;
  NES_GAMES.forEach((game) => {
    createGameButton(game, nesGameListDiv, globalIdx);
    if (mobileNesListDiv) {
      createGameButton(game, mobileNesListDiv, globalIdx);
    }
    globalIdx++;
  });
  
  // Create GBA game list (desktop and mobile)
  if (gbaGameListDiv) {
    GBA_GAMES.forEach((game) => {
      createGameButton(game, gbaGameListDiv, globalIdx);
      if (mobileGbaListDiv) {
        createGameButton(game, mobileGbaListDiv, globalIdx);
      }
      globalIdx++;
    });
  }
  
    // Initial game load: load iframe with first ROM
  const initialRomUrl = buildRomUrl(NES_GAMES[0].file);
  gameFrame.src = `/emulatorjs/indexe.html?rom=${encodeURIComponent(initialRomUrl)}`;

  // Mobile dropdown toggle functionality for games
  if (isMobile) {
    const gamesToggle = document.getElementById('games-toggle');
    const gamesDropdown = document.getElementById('games-dropdown');

    if (gamesToggle && gamesDropdown) {
      gamesToggle.onclick = () => {
        const isOpen = gamesDropdown.classList.contains('show');
        gamesDropdown.classList.toggle('show');
        gamesToggle.classList.toggle('open');
        const arrow = gamesToggle.querySelector('.dropdown-arrow');
        if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
      };
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!gamesToggle.contains(e.target) && !gamesDropdown.contains(e.target)) {
          gamesDropdown.classList.remove('show');
          gamesToggle.classList.remove('open');
          const arrow = gamesToggle.querySelector('.dropdown-arrow');
          if (arrow) arrow.textContent = '▼';
        }
      });
    }
  }
});
