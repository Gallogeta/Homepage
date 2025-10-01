import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MobileArcade() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
    { name: "Super Mario Brothers", file: "/api/snes/Super_mario_brothers.nes" },
    { name: "Teenage Mutant Ninja Turtles", file: "/api/snes/Teenage_mutant_ninja_turtles.nes" },
    { name: "Teenage Mutant Ninja Turtles 3", file: "/api/snes/Teenage_mutant_ninja_turtles3.nes" },
    { name: "Track & Field 2", file: "/api/snes/Track_&_field2.nes" },
  ];

  const MUSIC = [
    "01.mp3", "02.mp3", "03.mp3", "04.mp3", "05.mp3", "06.mp3", 
    "07.mp3", "08.mp3", "09.mp3", "010.mp3", "011.mp3"
  ];

  const [selectedGame, setSelectedGame] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState(0);
  const [gameUrl, setGameUrl] = useState("");
  const [showGames, setShowGames] = useState(false);
  const [showMusic, setShowMusic] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Load initial game only if authenticated
    if (isAuthenticated) {
      loadGame(0);
    }
  }, [isAuthenticated]);

  const loadGame = (index) => {
    const game = GAMES[index];
    const url = `/emulatorjs/indexe.html?rom=${encodeURIComponent(game.file)}`;
    setGameUrl(url);
    setSelectedGame(index);
    setShowGames(false);
  };

  const loadMusic = (index) => {
    const audioPlayer = document.getElementById('mobile-music-player');
    if (audioPlayer) {
      audioPlayer.src = `/media/${MUSIC[index]}`;
      audioPlayer.play();
    }
    setSelectedMusic(index);
    setShowMusic(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#ffd700',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  // Show login required message
  if (!isAuthenticated) {
    return (
      <div style={{
        width: '100%',
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#ffd700',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>🎮 Mobile Arcade</h2>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          You must be logged in to access the arcade.
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: '#ffd700',
            color: '#000',
            padding: '12px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="mobile-arcade-wrapper" style={{
      width: '100%',
      height: 'calc(100vh - 120px)',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
      color: '#ffd700'
    }}>
      {/* Game Selection Dropdown */}
      <div style={{
        background: '#181818',
        borderBottom: '2px solid #ffd700',
        padding: '0.75rem'
      }}>
        <button
          onClick={() => {
            setShowGames(!showGames);
            setShowMusic(false);
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#222',
            color: '#ffd700',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>🎮 {GAMES[selectedGame].name}</span>
          <span>{showGames ? '▲' : '▼'}</span>
        </button>
        
        {showGames && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '0.5rem',
            background: '#1a1a1a',
            border: '2px solid #ffd700',
            borderRadius: '8px'
          }}>
            {GAMES.map((game, idx) => (
              <button
                key={idx}
                onClick={() => loadGame(idx)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: idx === selectedGame ? '#ffd700' : 'transparent',
                  color: idx === selectedGame ? '#000' : '#ffd700',
                  border: 'none',
                  borderBottom: idx < GAMES.length - 1 ? '1px solid #ffd700' : 'none',
                  textAlign: 'left',
                  fontSize: '0.95rem'
                }}
              >
                {game.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Emulator Frame */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#000'
      }}>
        {gameUrl && (
          <iframe
            src={gameUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allowFullScreen
            title="Emulator"
          />
        )}
      </div>

      {/* Music Player */}
      <div style={{
        background: '#181818',
        borderTop: '2px solid #ffd700',
        padding: '0.75rem'
      }}>
        <button
          onClick={() => {
            setShowMusic(!showMusic);
            setShowGames(false);
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#222',
            color: '#ffd700',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}
        >
          <span>🎵 Music: {MUSIC[selectedMusic]}</span>
          <span>{showMusic ? '▲' : '▼'}</span>
        </button>

        {showMusic && (
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            marginBottom: '0.5rem',
            background: '#1a1a1a',
            border: '2px solid #ffd700',
            borderRadius: '8px'
          }}>
            {MUSIC.map((track, idx) => (
              <button
                key={idx}
                onClick={() => loadMusic(idx)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: idx === selectedMusic ? '#ffd700' : 'transparent',
                  color: idx === selectedMusic ? '#000' : '#ffd700',
                  border: 'none',
                  borderBottom: idx < MUSIC.length - 1 ? '1px solid #ffd700' : 'none',
                  textAlign: 'left',
                  fontSize: '0.95rem'
                }}
              >
                {track}
              </button>
            ))}
          </div>
        )}

        <audio
          id="mobile-music-player"
          controls
          style={{
            width: '100%',
            height: '40px'
          }}
        >
          <source src={`/media/${MUSIC[selectedMusic]}`} type="audio/mpeg" />
        </audio>
      </div>

      {/* Helpful Tip */}
      <div style={{
        background: 'rgba(255, 215, 0, 0.1)',
        borderTop: '1px solid #ffd700',
        padding: '0.5rem',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
        💡 Rotate device horizontally for better gaming!
      </div>
    </div>
  );
}
