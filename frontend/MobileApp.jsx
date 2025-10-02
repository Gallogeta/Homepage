import React, { useState, useEffect, Suspense } from "react";
import "./mobile.css";

// Import existing components but use mobile-optimized versions where needed
const MobileContactForm = React.lazy(() => import("./MobileContactForm"));
const MobileWhatsAppWidget = React.lazy(() => import("./MobileWhatsAppWidget"));
const MobileArcade = React.lazy(() => import("./MobileArcade"));

// Mobile Auth Form component
const MobileAuthForm = ({ mode, onAuth, onClose }) => {
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === 'login') {
        // Use OAuth2 password flow for login
        const formData = new URLSearchParams();
        formData.append('username', form.username);
        formData.append('password', form.password);

        const response = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('token', data.access_token);
          onAuth({ username: form.username });
        } else {
          setError(data.detail || 'Login failed');
        }
      } else {
        // Register
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        const data = await response.json();
        
        if (response.ok) {
          setError('');
          alert('Registration successful! Please login.');
          onClose();
        } else {
          setError(data.detail || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mobile-form">
      <input
        type="text"
        placeholder="Username"
        className="mobile-input"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        required
      />
      
      {mode === 'register' && (
        <input
          type="email"
          placeholder="Email"
          className="mobile-input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      )}
      
      <input
        type="password"
        placeholder="Password"
        className="mobile-input"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />

      {error && (
        <div className="mobile-error">{error}</div>
      )}

      <button
        type="submit"
        className="mobile-btn"
        disabled={loading}
      >
        {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}
      </button>
      
      <button
        type="button"
        className="mobile-btn-outline"
        onClick={onClose}
      >
        Cancel
      </button>
    </form>
  );
};

export default function MobileApp() {
  const [user, setUser] = useState(null);
  const [active, setActive] = useState(() => localStorage.getItem("activePage") || "home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Mobile-specific navigation items
  const mobileNavItems = [
    { key: "home", label: "Home", icon: "🏠" },
    { key: "creations", label: "Work", icon: "💼" },
    { key: "contact", label: "Contact", icon: "📞" },
    { key: "arcade", label: "Games", icon: "🎮" },
  ];

  // Updated mobile sidebar items based on available pages
  const mobileSidebarItems = [
    { key: "home", label: "🏠 Home" },
    { key: "prices", label: "💰 Prices" },
    { key: "creations", label: "🎨 Creations" },
    { key: "education", label: "🎓 Education" },
    { key: "work", label: "💼 Work History" },
    { key: "gallery", label: "🖼️ Gallery" },
    { key: "contact", label: "📞 Contact" },
    { key: "arcade", label: "🎮 Arcade", external: "/arcade.html" },
  ];

  // User authentication check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token with backend
      fetch("/api/verify", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => data ? setUser(data) : null)
      .catch(() => null);
    }
  }, []);

  const handleNavigation = (key) => {
    if (key !== active) {
      setAnimating(true);
      setTimeout(() => {
        setActive(key);
        localStorage.setItem("activePage", key);
        setAnimating(false);
      }, 200);
    }
    setSidebarOpen(false);
  };

  const handleAuth = (userData) => {
    setUser(userData);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setSidebarOpen(false);
  };

  // Mobile-optimized content components
  const MobilePageContent = ({ pageKey }) => {
    const [blocks, setBlocks] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let isMounted = true;
      async function fetchPage() {
        setLoading(true);
        try {
          const res = await fetch(`/api/pages/${pageKey}`);
          if (res.ok) {
            const data = await res.json();
            if (data.content) {
              const parsed = JSON.parse(data.content);
              if (isMounted) setBlocks(parsed);
            }
          }
        } catch (err) {
          console.error('Error fetching page:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
      
      fetchPage();
      return () => { isMounted = false; };
    }, [pageKey]);

    if (loading) {
      return <div className="mobile-text-content">Loading...</div>;
    }

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return (
        <div className="mobile-page-content">
          <div className="mobile-page-title">Welcome</div>
          <div className="mobile-text-content">
            Professional IT portfolio and projects showcase.
          </div>
        </div>
      );
    }

    return (
      <div className="mobile-page-content">
        {blocks.map((block, idx) => (
          <MobileBlock key={idx} block={block} />
        ))}
      </div>
    );
  };

  const MobileBlock = ({ block }) => {
    if (block.type === "text") {
      return (
        <div 
          className="mobile-text-content" 
          dangerouslySetInnerHTML={{ __html: block.content }} 
        />
      );
    } else if (block.type === "image") {
      return (
        <img 
          src={block.url} 
          alt="" 
          className="mobile-image"
          style={{ width: block.width ? `${Math.min(block.width, 350)}px` : '100%' }}
        />
      );
    } else if (block.type === "gallery") {
      return (
        <div className="mobile-gallery">
          {(block.images || []).map((url, i) => url && (
            <div key={i} className="mobile-gallery-item">
              <img src={url} alt="" />
            </div>
          ))}
        </div>
      );
    } else if (block.type === "button") {
      return (
        <button 
          className="mobile-btn"
          onClick={() => {
            if (block.action === 'url' && block.url) {
              window.open(block.url, block.newTab ? '_blank' : '_self');
            }
          }}
        >
          {block.label || 'Button'}
        </button>
      );
    }
    return null;
  };

  // Content mapping for different pages
  const mobileContentMap = {
    home: <MobilePageContent pageKey="home" />,
    prices: <MobilePageContent pageKey="prices" />,
    creations: <MobilePageContent pageKey="creations" />,
    education: <MobilePageContent pageKey="education" />,
    work: <MobilePageContent pageKey="work" />,
    gallery: <MobilePageContent pageKey="gallery" />,
    contact: (
      <Suspense fallback={<div className="mobile-text-content">Loading...</div>}>
        <MobileContactForm />
      </Suspense>
    ),
    arcade: (
      <Suspense fallback={<div className="mobile-text-content">Loading arcade...</div>}>
        <MobileArcade />
      </Suspense>
    ),
  };

  return (
    <div className="mobile-app">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="mobile-menu-toggle"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
        <img 
          src="/media/pics/logo.png" 
          alt="ItSusi" 
          className="mobile-logo"
        />
      </header>

      {/* New Simple Mobile Dropdown Menu */}
      {sidebarOpen && (
        <div className="mobile-menu-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="mobile-menu-container" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3>Navigation Menu</h3>
              <button className="mobile-menu-close" onClick={() => setSidebarOpen(false)}>×</button>
            </div>
            
            <div className="mobile-menu-content">
              {!user && (
                <div className="mobile-menu-section">
                  <button 
                    className="mobile-menu-item auth-btn"
                    onClick={() => { setShowAuth(true); setAuthMode("login"); setSidebarOpen(false); }}
                  >
                    🔑 Login
                  </button>
                  <button 
                    className="mobile-menu-item auth-btn"
                    onClick={() => { setShowAuth(true); setAuthMode("register"); setSidebarOpen(false); }}
                  >
                    📝 Register
                  </button>
                </div>
              )}
              
              <div className="mobile-menu-section">
                <h4>Pages</h4>
                {mobileSidebarItems.map(item => {
                  // Hide arcade if not logged in
                  if (item.key === "arcade" && !user) {
                    return null;
                  }
                  
                  return item.external ? (
                    <a
                      key={item.key}
                      className="mobile-menu-item"
                      href={item.external}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      key={item.key}
                      className={`mobile-menu-item ${active === item.key ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.key)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              
              {user && (
                <div className="mobile-menu-section">
                  <h4>Services</h4>
                  <a
                    className="mobile-menu-item"
                    href="https://jellyfin.itsusi.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSidebarOpen(false)}
                    style={{ color: '#7f5fff', borderColor: '#7f5fff' }}
                  >
                    🎬 Jellyfin
                  </a>
                </div>
              )}
              
              {user && (
                <div className="mobile-menu-section">
                  <button 
                    className="mobile-menu-item logout-btn"
                    onClick={handleLogout}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Content */}
      <main className="mobile-content">
        <div className={`mobile-fade-in ${animating ? '' : 'mobile-slide-up'}`}>
          {mobileContentMap[active] || (
            <div className="mobile-page-content">
              <div className="mobile-page-title">Page Not Found</div>
              <div className="mobile-text-content">
                The page you're looking for doesn't exist.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map(item => {
          // Hide arcade button if not logged in
          if (item.key === "arcade" && !user) {
            return null;
          }
          
          return (
            <button
              key={item.key}
              className={`mobile-nav-btn ${active === item.key ? 'active' : ''}`}
              onClick={() => handleNavigation(item.key)}
            >
              <div className="mobile-nav-icon">{item.icon}</div>
              <div>{item.label}</div>
            </button>
          );
        })}
      </nav>

      {/* Mobile WhatsApp Widget */}
      <Suspense fallback={null}>
        <MobileWhatsAppWidget />
      </Suspense>

      {/* Auth Modal */}
      {showAuth && (
        <div className="mobile-auth-overlay">
          <div className="mobile-auth-modal">
            <div className="mobile-page-title">
              {authMode === 'login' ? 'Login' : 'Register'}
            </div>
            <MobileAuthForm 
              mode={authMode} 
              onAuth={handleAuth}
              onClose={() => setShowAuth(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}