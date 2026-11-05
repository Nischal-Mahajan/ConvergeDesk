import { Link } from "react-router-dom";

/**
 * Editorial HTML overlay positioned over the 3D Canvas.
 * Structured with strict spatial separation so typography never obstructs the character or panels.
 */
export function HeroOverlay() {
  return (
    <div className="hero-overlay">
      {/* ── 1. FIXED/STICKY TOP NAVIGATION ── */}
      <nav className="cd-nav scrolled" aria-label="Main Navigation">
        <Link to="/" className="cd-brand">
          <span className="cd-brand-symbol">C.</span>
          converge<span>desk</span>
        </Link>

        <div className="cd-nav-pill">
          <a href="#platform">Platform</a>
          <a href="#workflow">Workflow</a>
          <a href="#features">Features</a>
        </div>

        <div className="cd-nav-actions">
          <Link to="/login" className="cd-signin">
            Sign in
          </Link>
          <Link to="/login" className="cd-nav-cta">
            Get started <span>→</span>
          </Link>
        </div>
      </nav>

      {/* ── 2. INITIAL EDITORIAL HEADLINE ZONE (Dedicated Non-Obstructing Space) ── */}
      <div className="hero-copy">
        <div className="hero-eyebrow">
          <span className="live-dot" />
          <span>ONE CONNECTED ENGINEERING SYSTEM</span>
        </div>

        <h1 className="hero-h1">
          <span className="hero-line">DRAG EVERYTHING.</span>
          <span className="hero-line accent">CONNECT EVERYTHING.</span>
        </h1>

        <p className="hero-desc">
          Projects, tasks, whiteboards, code, and meetings.
          Watch fragmented software tools assemble into one unified workspace.
        </p>

        <div className="hero-actions">
          <Link to="/login" className="cd-primary-button">
            Explore Workspace <span>→</span>
          </Link>
          <a href="#platform" className="cd-text-link">
            Learn more ↓
          </a>
        </div>
      </div>

      {/* ── 3. PHASE STATUS INDICATORS (Top Right) ── */}
      <div className="hero-phase-container">
        <div className="hero-phase-label phase-1">
          <span className="phase-num">01</span>
          <span className="phase-text">FRAGMENTED TOOLS</span>
        </div>
        <div className="hero-phase-label phase-2">
          <span className="phase-num">02</span>
          <span className="phase-text">ACTIVE ASSEMBLY</span>
        </div>
        <div className="hero-phase-label phase-3">
          <span className="phase-num">03</span>
          <span className="phase-text">UNIFIED WORKSPACE</span>
        </div>
      </div>

      {/* ── 4. STAGE D FINAL REVEAL (Appears after all 8 panels lock) ── */}
      <div className="hero-reveal">
        <div className="hero-reveal-pill">CONVERGEDESK ASSEMBLED</div>
        <h2 className="hero-reveal-h2 hero-reveal-text">
          Work moves <span>as one.</span>
        </h2>
        <p className="hero-reveal-desc hero-reveal-text">
          Your team's ideas, decisions, projects and code. Connected in one
          intelligent workspace.
        </p>
        <div className="hero-reveal-actions hero-reveal-text">
          <Link to="/login" className="cd-primary-button">
            Explore Workspace <span>→</span>
          </Link>
          <Link to="/login" className="cd-nav-cta">
            Get Started
          </Link>
        </div>
      </div>

      {/* ── 5. SCROLL INTERACTION HINT ── */}
      <div className="hero-scroll-hint">
        <div className="scroll-indicator-bar" />
        <span>SCROLL TO ASSEMBLE WORKSPACE</span>
      </div>
    </div>
  );
}

export default HeroOverlay;
