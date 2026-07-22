import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Background glow overlay */}
      <div className="home-bg-glow"></div>

      <nav className="home-navbar">
        <div className="home-logo">
          <span className="blood-icon">🩸</span>
          <span className="logo-text">LifeFlow Blood System</span>
        </div>
      </nav>

      <main className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot"></span> Saving Lives Together
          </div>

          <h1 className="hero-title">
            Welcome to Blood donation management system
          </h1>

          <p className="hero-description">
            Connecting generous blood donors with patients in urgent need.
            Fast, secure, and life-saving management at your fingertips.
          </p>

          {/* Centered Action Buttons: Only Register and Log in */}
          <div className="hero-center-actions">
            <button
              className="hero-btn register-btn"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
            <button
              className="hero-btn login-btn"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="home-features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Admin Management</h3>
            <p>Full control over donors, patients, requests, and complete system metrics.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3>Become a Donor</h3>
            <p>Register as a blood donor and make a direct life-saving impact in your community.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏥</div>
            <h3>Request Blood</h3>
            <p>Patients and hospitals can request critical blood groups quickly with real-time tracking.</p>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        <p>© 2026 Blood Donation Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
