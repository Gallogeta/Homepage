
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { NES } from "jsnes";

// Games will be loaded from the backend /api/snes listing


export default function ArcadePage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [games, setGames] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef();
  const audioRef = useRef();
  const nesRef = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Always selected, only one game
  const selected = 0;

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      setError("You must be logged in to access the arcade.");
      return;
    }
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Play music on mount
    if (audioRef.current && isAuthenticated) {
      audioRef.current.volume = 0.25;
      audioRef.current.play().catch(() => {});
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isAuthenticated]);

  // Load list of ROMs from backend
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const token = localStorage.getItem("access_token");
    fetch(`/api/snes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setGames(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError("ROM list error: " + e.message));
  }, [isAuthenticated]);

  useEffect(() => {
    setError("");
    if (!isAuthenticated || !canvasRef.current || games.length === 0) return;
    const game = games[selected];
    if (!game) return;
    
    const token = localStorage.getItem("access_token");
    fetch(`/api/snes/${encodeURIComponent(game.file)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
        .then((res) => res.arrayBuffer())
        .then((romBuffer) => {
          if (nesRef.current && typeof nesRef.current.reset === 'function') nesRef.current.reset();
          const nes = new NES({
            onFrame: function(frameBuffer) {
              const ctx = canvasRef.current.getContext("2d");
              const imageData = ctx.getImageData(0, 0, 256, 240);
              for (let i = 0; i < frameBuffer.length; i++) {
                imageData.data[i] = frameBuffer[i];
              }
              ctx.putImageData(imageData, 0, 0);
            },
            onAudioSample: function() {}, // No audio for now
          });
          nesRef.current = nes;
          try {
            nes.loadROM(new Uint8Array(romBuffer));
            nes.start();
          } catch (e) {
            setError("ROM load error: " + e.message);
          }
        })
        .catch((e) => setError("Fetch error: " + e.message));
    // Cleanup on unmount
    return () => {
      if (nesRef.current && typeof nesRef.current.reset === 'function') nesRef.current.reset();
    };
  }, [games]);

  // Fullscreen handler
  const handleFullscreen = () => {
    if (canvasRef.current) {
      if (!document.fullscreenElement) {
        canvasRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[70vh] p-8 bg-black/90 rounded-lg border border-gold shadow-lg">
        <div className="text-gold text-2xl">Loading...</div>
      </div>
    );
  }

  // Show login required message
  if (!isAuthenticated) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[70vh] p-8 bg-black/90 rounded-lg border border-gold shadow-lg">
        <h2 className="text-4xl font-bold text-gold mb-6 tracking-widest">🎮 Arcade</h2>
        <div className="text-gold text-xl mb-6 text-center">
          You must be logged in to access the arcade.
        </div>
        <button
          onClick={() => navigate("/login")}
          className="bg-gold text-black px-8 py-3 rounded-lg font-bold text-lg hover:bg-yellow-400 transition shadow-lg"
        >
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-row items-start justify-center min-h-[70vh] p-8 bg-black/90 rounded-lg border border-gold shadow-lg relative">
      <audio ref={audioRef} src="/media/01.mp3" loop autoPlay style={{ display: 'none' }} />
      {/* Left: Game Canvas */}
      <div className="flex flex-col items-center flex-1">
        <h2 className="text-4xl font-bold text-gold mb-6 tracking-widest text-center">Arcade</h2>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={512}
            height={384}
            className="border-2 border-gold rounded-lg bg-black"
            style={{ imageRendering: 'pixelated', width: isFullscreen ? '100vw' : '512px', height: isFullscreen ? '75vw' : '384px', maxWidth: '100%', maxHeight: '80vh' }}
          />
          <button
            className="absolute top-2 right-2 bg-gold text-black px-3 py-1 rounded shadow hover:bg-yellow-400 transition"
            onClick={handleFullscreen}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
        {error && <div className="text-red-400 mt-4">{error}</div>}
      </div>
      {/* Right: Game Info/Menu */}
      <div className="flex flex-col items-start ml-8 w-72">
        <div className="bg-black bg-opacity-80 border border-gold rounded-lg p-6 flex flex-col items-center shadow-md min-h-[120px] w-full">
          {games.length > 0 ? (
            <>
              <div className="text-2xl font-semibold text-gold mb-2">{games[selected].name}</div>
              <div className="text-gold text-sm mb-2 text-center">NES - {games[selected].name}</div>
              <div className="text-xs text-gold/60">{games[selected].file}</div>
            </>
          ) : (
            <div className="text-gold">No ROMs found</div>
          )}
        </div>
      </div>
    </div>
  );
}
