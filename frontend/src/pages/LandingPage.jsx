import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../App.css";

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ─── */
const modules = [
  {
    id: "01",
    name: "Projects",
    label: "A clear view of the work",
    detail: "Keep priorities, ownership and progress visible across every project.",
    icon: "◫",
  },
  {
    id: "02",
    name: "Whiteboards",
    label: "Think out loud, together",
    detail: "Map systems, explore ideas and preserve the thinking behind decisions.",
    icon: "⌘",
  },
  {
    id: "03",
    name: "Development",
    label: "Move from plan to build",
    detail: "Bring tasks and implementation closer, without losing the why.",
    icon: "{ }",
  },
  {
    id: "04",
    name: "Meetings",
    label: "Turn talk into next steps",
    detail: "Shape conversations into notes, decisions and proposed action items.",
    icon: "◷",
  },
];

/* ─── Brand mark ─── */
function Brand() {
  return (
    <span className="cd-brand">
      <span className="cd-brand-mark">c<span>.</span></span>
      <span>converge<span className="cd-brand-light">desk</span></span>
    </span>
  );
}

/* ─── Product Window ─── */
function ProductWindow() {
  const [activeTab, setActiveTab] = useState("Overview");
  const tabs = ["Overview", "Decisions", "Tasks"];

  return (
    <div className="cd-product-shell" aria-label="Illustrative ConvergeDesk workspace preview">
      {/* Top bar */}
      <div className="cd-product-topbar">
        <div className="cd-window-controls"><i /><i /><i /></div>
        <div className="cd-product-breadcrumb">
          Workspace <span>/</span> Atlas Platform
        </div>
        <div className="cd-product-presence"><b /> TEAM SPACE</div>
      </div>

      {/* Layout */}
      <div className="cd-product-layout">
        {/* Sidebar */}
        <aside className="cd-product-sidebar">
          <div className="cd-sidebar-workspace">
            <span>AP</span>
            <div>
              <strong>Atlas Platform</strong>
              <small>Engineering team</small>
            </div>
            <i>⌄</i>
          </div>
          <div className="cd-sidebar-label">WORKSPACE</div>
          {["Overview", "Projects", "Whiteboards", "Documents", "Meetings"].map((item, i) => (
            <div
              className={`cd-sidebar-item${i === 0 ? " selected" : ""}`}
              key={item}
            >
              <span>{["◫", "▦", "◇", "▤", "◷"][i]}</span>
              {item}
            </div>
          ))}
          <div className="cd-sidebar-label cd-sidebar-bottom-label">YOUR SPACE</div>
          <div className="cd-sidebar-item"><span>⌘</span>My tasks</div>
        </aside>

        {/* Main */}
        <section className="cd-product-main">
          <div className="cd-product-heading">
            <div>
              <span className="cd-kicker">MONDAY, PROJECT OVERVIEW</span>
              <h3>Good work starts<br />with shared context.</h3>
            </div>
            <div className="cd-avatar-stack">
              <i>NK</i><i>AM</i><i>JD</i><span>+2</span>
            </div>
          </div>

          <div className="cd-product-tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <div className="cd-overview-grid">
              <div className="cd-product-card cd-progress-card">
                <div className="cd-card-label">PROJECT HEALTH <span>↗</span></div>
                <div className="cd-progress-number">On track<span>●</span></div>
                <div className="cd-progress-bar"><i /></div>
                <div className="cd-progress-meta">
                  <span>Milestones moving</span><b>4 active</b>
                </div>
              </div>
              <div className="cd-product-card cd-focus-card">
                <div className="cd-card-label">TEAM FOCUS</div>
                <strong>Make the next release count.</strong>
                <p>Shared priorities for the current sprint.</p>
                <div className="cd-focus-tags">
                  <span>API</span><span>Platform</span><span>Quality</span>
                </div>
              </div>
              <div className="cd-product-card cd-activity-card">
                <div className="cd-card-label">RECENT ACTIVITY <span>View all ↗</span></div>
                <div className="cd-activity-row">
                  <i className="activity-purple">D</i>
                  <div>
                    <b>Decision documented</b>
                    <small>Authentication approach · just now</small>
                  </div>
                  <em>↗</em>
                </div>
                <div className="cd-activity-row">
                  <i className="activity-blue">T</i>
                  <div>
                    <b>Task moved to review</b>
                    <small>Implement token refresh · 18m ago</small>
                  </div>
                  <em>↗</em>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Decisions" && (
            <div className="cd-tab-content">
              <div className="cd-decision-card">
                <span>DECISION · AUTHENTICATION</span>
                <strong>Use short-lived access tokens with refresh rotation.</strong>
                <p>Linked to the API security requirement and implementation tasks.</p>
                <small>OWNER · PLATFORM TEAM</small>
              </div>
              <div className="cd-decision-card muted">
                <span>DECISION · DATA LAYER</span>
                <strong>Keep workspace membership as the permission boundary.</strong>
                <p>Related project: Atlas Platform</p>
                <small>OWNER · BACKEND TEAM</small>
              </div>
            </div>
          )}

          {activeTab === "Tasks" && (
            <div className="cd-tab-content cd-task-list">
              <div>
                <span className="task-check">✓</span>
                <b>Document refresh-token flow</b>
                <small>DONE</small>
              </div>
              <div>
                <span className="task-progress">◌</span>
                <b>Implement token rotation</b>
                <small>IN PROGRESS</small>
              </div>
              <div>
                <span className="task-empty">○</span>
                <b>Add session-expiry tests</b>
                <small>TODO</small>
              </div>
            </div>
          )}

          <div className="cd-product-footer">
            <span><b /> Changes saved to workspace</span>
            <span>Illustrative preview</span>
          </div>
        </section>
      </div>

      {/* Floating notes */}
      <div className="cd-floating-note cd-note-one">
        <span>↗</span>
        <div><b>Context connected</b><small>Decision → task</small></div>
      </div>
      <div className="cd-floating-note cd-note-two">
        <span className="cd-note-spark">✳</span>
        <div><b>One shared space</b><small>Ideas stay attached to work</small></div>
      </div>
    </div>
  );
}

/* ─── Traceability Visual ─── */
function TraceabilityVisual() {
  return (
    <div className="cd-trace-visual">
      <div className="cd-trace-head">
        <span>LINKED WORK GRAPH</span>
        <span><i /> LIVE MODEL</span>
      </div>
      <div className="cd-trace-canvas">
        <div className="cd-trace-lines">
          <svg viewBox="0 0 600 250" preserveAspectRatio="none" aria-hidden="true">
            <path d="M105 125 C165 125 160 45 225 45 S290 125 350 125 S430 45 495 45" />
            <path d="M105 125 C165 125 160 205 225 205 S290 125 350 125 S430 205 495 205" />
            <path d="M350 125 C410 125 430 125 495 125" />
          </svg>
        </div>
        <div className="cd-node node-decision">
          <small>01 / SOURCE</small><b>Decision</b><span>Auth strategy</span>
        </div>
        <div className="cd-node node-requirement">
          <small>02 / SPEC</small><b>Requirement</b><span>Secure sessions</span>
        </div>
        <div className="cd-node node-task">
          <small>03 / ACTION</small><b>Task</b><span>Token rotation</span>
        </div>
        <div className="cd-node node-pr">
          <small>04 / CODE</small><b>Pull request</b><span>PR #128</span>
        </div>
        <div className="cd-node node-test">
          <small>05 / PROOF</small><b>Test</b><span>Session checks</span>
        </div>
      </div>
      <div className="cd-trace-legend">
        <span><i className="legend-violet" />Decision</span>
        <span><i className="legend-blue" />Work item</span>
        <span><i className="legend-green" />Verification</span>
      </div>
    </div>
  );
}

/* ─── Landing Page ─── */
function LandingPage() {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      /* ── Hero cinematic entrance ── */
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".cd-nav", { y: -32, opacity: 0, duration: 0.6 })
        .from(".cd-hero-kicker", { y: 24, opacity: 0, duration: 0.5 }, "-=0.2")
        .from(".cd-hero-title .line-inner", {
          yPercent: 110,
          rotate: 1.5,
          stagger: 0.1,
          duration: 1.1,
        }, "-=0.2")
        .from(".cd-hero-description", { y: 28, opacity: 0, duration: 0.65 }, "-=0.5")
        .from(".cd-hero-actions", { y: 24, opacity: 0, duration: 0.55 }, "-=0.4")
        .from(".cd-hero-meta", { y: 16, opacity: 0, duration: 0.5 }, "-=0.35")
        .from(".cd-hero-visual", { x: 60, opacity: 0, duration: 1.1, ease: "power3.out" }, "-=0.9")
        .from(".cd-hero-badge", {
          y: 20,
          opacity: 0,
          stagger: 0.12,
          duration: 0.6,
        }, "-=0.6");

      /* ── Orb float ── */
      gsap.to(".cd-hero-orb", {
        y: -30,
        x: 20,
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      /* ── Badge float ── */
      gsap.to(".badge-decision", {
        y: -12,
        duration: 3.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 0.5,
      });
      gsap.to(".badge-sync", {
        y: 10,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.2,
      });

      /* ── Scroll-triggered section reveals ── */
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 50,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });

      /* ── Traceability nodes ── */
      gsap.from(".cd-node", {
        scale: 0.8,
        opacity: 0,
        stagger: 0.1,
        duration: 0.65,
        ease: "back.out(1.5)",
        scrollTrigger: { trigger: ".cd-trace-visual", start: "top 80%", once: true },
      });

      /* ── Module cards ── */
      gsap.from(".cd-module-card", {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cd-modules-grid", start: "top 83%", once: true },
      });

      /* ── Nav glass on scroll ── */
      ScrollTrigger.create({
        start: "top -50",
        onUpdate: (self) => {
          document.querySelector(".cd-nav")?.classList.toggle("scrolled", self.scroll() > 50);
        },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <main className="cd-landing" ref={rootRef}>

      {/* ══ NAV ══ */}
      <nav className={`cd-nav${menuOpen ? " menu-open" : ""}`}>
        <Link to="/" aria-label="ConvergeDesk home"><Brand /></Link>
        <div className="cd-nav-links">
          <a href="#platform">Platform</a>
          <a href="#workflow">How it works</a>
          <a href="#modules">Workspace</a>
        </div>
        <div className="cd-nav-actions">
          <Link className="cd-nav-login" to="/login">Sign in</Link>
          <Link className="cd-nav-cta" to="/login">Get started <span>↗</span></Link>
        </div>
        <button
          className="cd-menu-toggle"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span /><span />
        </button>
        {menuOpen && (
          <div className="cd-mobile-menu">
            <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
            <a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#modules" onClick={() => setMenuOpen(false)}>Workspace</a>
            <Link to="/login">Sign in ↗</Link>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section className="cd-hero" id="top">
        {/* Background elements */}
        <div className="cd-hero-grid" />
        <div className="cd-hero-orb" />
        <div className="cd-hero-rail">
          ENGINEERING, IN ONE PLACE <span>—</span> 01 / 04
        </div>

        {/* Left: editorial copy */}
        <div className="cd-hero-copy">
          <div className="cd-hero-kicker">
            <i /> THE CONNECTED WORKSPACE FOR SOFTWARE TEAMS
          </div>

          <h1 className="cd-hero-title">
            <span className="line-wrap"><span className="line-inner">Build with</span></span>
            <span className="line-wrap"><span className="line-inner">the <em>whole</em></span></span>
            <span className="line-wrap"><span className="line-inner">picture.</span></span>
          </h1>

          <p className="cd-hero-description">
            Projects, decisions and development — connected in one workspace, so your
            team can move from the first idea to the finished work without losing context.
          </p>

          <div className="cd-hero-actions">
            <Link to="/login" className="cd-button-primary">
              Enter ConvergeDesk <span>↗</span>
            </Link>
            <a href="#platform" className="cd-button-quiet">
              <span className="cd-play-icon">↓</span> Explore the platform
            </a>
          </div>

          <div className="cd-hero-meta">
            <span><b />BUILT AROUND ENGINEERING WORK</span>
            <span>LESS FRAGMENTATION. MORE FLOW.</span>
          </div>
        </div>

        {/* Right: product visual + badge cards */}
        <div className="cd-hero-visual">
          {/* Floating badge — decision linked */}
          <div className="cd-hero-badge badge-decision">
            <span className="badge-dot" />
            <div>
              <strong>Decision linked</strong>
              <small>Auth strategy → Token task</small>
            </div>
          </div>

          <ProductWindow />

          {/* Floating badge — workspace synced */}
          <div className="cd-hero-badge badge-sync">
            <span>✳</span>
            <div>
              <strong>Workspace synced</strong>
              <small>3 members · live</small>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="cd-hero-bottom">
          <span>IDEAS → DECISIONS → EXECUTION</span>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>

      {/* ══ MARQUEE ══ */}
      <div className="cd-marquee" aria-hidden="true">
        <div className="cd-marquee-track">
          {[0, 1].map(i => (
            <span key={i} className="cd-marquee-group">
              <b>CONVERGEDESK</b><i>·</i>
              <b>ENGINEERING WORKSPACE</b><i>·</i>
              <b>REAL-TIME SYNC</b><i>·</i>
              <b>DECISIONS → EXECUTION</b><i>·</i>
              <b>CONNECTED TEAMS</b><i>·</i>
              <b>ONE PLATFORM</b><i>·</i>
            </span>
          ))}
        </div>
      </div>

      {/* ══ PROBLEM STATEMENT ══ */}
      <section className="cd-manifesto" id="platform">
        <div className="cd-section-label" data-reveal>
          <span>01 / THE PROBLEM</span>
          <span>CONTEXT IS THE CONNECTION</span>
        </div>
        <div className="cd-manifesto-layout">
          <h2 data-reveal>
            Your tools<br />should talk.<br />
            <em>Your work<br />should connect.</em>
          </h2>
          <div className="cd-manifesto-copy" data-reveal>
            <div className="cd-accent-rule" />
            <p>
              Engineering rarely happens in a straight line. A decision lives in a
              meeting, a requirement in a document, a task on a board and the
              implementation somewhere else.
            </p>
            <p>
              ConvergeDesk is built around the relationships between those pieces —
              keeping the reasoning close to the work it creates.
            </p>
            <a href="#workflow">See the connected workflow <span>↗</span></a>
          </div>
        </div>
      </section>

      {/* ══ TRACEABILITY ══ */}
      <section className="cd-trace-section" id="workflow">
        <div className="cd-section-label" data-reveal>
          <span>02 / THE DIFFERENCE</span>
          <span>TRACEABILITY FIRST</span>
        </div>
        <div className="cd-trace-heading" data-reveal>
          <div>
            <span className="cd-overline">NOT JUST ANOTHER PROJECT BOARD</span>
            <h2>Keep the <em>why</em><br />attached to the work.</h2>
          </div>
          <p>
            Follow the thread from the decision that started it to the test that
            verifies it. A connected model of how your team builds.
          </p>
        </div>
        <div className="cd-trace-visual-wrap" data-reveal>
          <TraceabilityVisual />
        </div>
        <div className="cd-trace-caption">
          <span>THE LINKED WORK GRAPH</span>
          <span>DECISION → REQUIREMENT → TASK → CODE → TEST</span>
        </div>
      </section>

      {/* ══ MODULES ══ */}
      <section className="cd-modules-section" id="modules">
        <div className="cd-section-label" data-reveal>
          <span>03 / ONE ENVIRONMENT</span>
          <span>TOOLS WITH SHARED CONTEXT</span>
        </div>
        <div className="cd-modules-heading" data-reveal>
          <h2>Everything has<br /><em>a place. A purpose.</em></h2>
          <p>
            Bring the essential parts of engineering collaboration into one
            considered workspace.
          </p>
        </div>
        <div className="cd-modules-grid">
          {modules.map((module, index) => (
            <article className={`cd-module-card module-${index + 1}`} key={module.id}>
              <div className="cd-module-top">
                <span>{module.id} / MODULE</span>
                <span className="cd-module-icon">{module.icon}</span>
              </div>
              <div className={`cd-module-art module-art-${index + 1}`} aria-hidden="true">
                {index === 0 && (
                  <><i /><i /><i /><b>PROJECT<br />OVERVIEW</b></>
                )}
                {index === 1 && (
                  <><span>IDEA</span><i>↗</i><span>FLOW</span><i>↗</i><span>DECISION</span></>
                )}
                {index === 2 && (
                  <>
                    <span>01</span>
                    <b>const work = &#123;</b>
                    <b>  context: true,</b>
                    <b>  progress: &quot;moving&quot;</b>
                    <b>&#125;</b>
                  </>
                )}
                {index === 3 && (
                  <><b>Meeting notes</b><span>Decision captured</span><span>+ 3 proposed actions</span><i>✳</i></>
                )}
              </div>
              <div className="cd-module-copy">
                <span>{module.label}</span>
                <h3>{module.name}</h3>
                <p>{module.detail}</p>
              </div>
              <div className="cd-module-foot">
                <span>CONVERGEDESK WORKSPACE</span>
                <span>↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══ PRINCIPLES ══ */}
      <section className="cd-principles">
        <div className="cd-section-label" data-reveal>
          <span>04 / HOW IT FEELS</span>
          <span>DESIGNED FOR THE WAY TEAMS BUILD</span>
        </div>
        <div className="cd-principles-grid">
          <div data-reveal>
            <span className="cd-principle-index">01</span>
            <h3>Shared<br /><em>understanding.</em></h3>
            <p>Make decisions, ownership and next steps visible to the people doing the work.</p>
          </div>
          <div data-reveal>
            <span className="cd-principle-index">02</span>
            <h3>Less context<br /><em>switching.</em></h3>
            <p>Keep project conversations and engineering artifacts close to one another.</p>
          </div>
          <div data-reveal>
            <span className="cd-principle-index">03</span>
            <h3>Progress with<br /><em>purpose.</em></h3>
            <p>Understand not only what is moving, but why it matters and what depends on it.</p>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="cd-final">
        <div className="cd-final-glow" />
        <div className="cd-final-content" data-reveal>
          <span className="cd-overline">MAKE THE CONNECTION</span>
          <h2>Make room for<br /><em>better building.</em></h2>
          <p>Bring your team's work into one connected space.</p>
          <Link to="/login" className="cd-button-primary">
            Get started with ConvergeDesk <span>↗</span>
          </Link>
        </div>
        <div className="cd-final-index">CONVERGEDESK / 2026</div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="cd-footer">
        <Link to="/"><Brand /></Link>
        <span>One connected workspace for engineering teams.</span>
        <div>
          <a href="#top">Back to top ↑</a>
          <Link to="/login">Sign in ↗</Link>
        </div>
        <small>© 2026 CONVERGEDESK</small>
      </footer>

    </main>
  );
}

export default LandingPage;
