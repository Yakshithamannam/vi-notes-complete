import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';

const features = [
  { icon: '⌨', title: 'Keystroke intelligence', desc: 'Every pause, hesitation and correction is captured as timing metadata — never the keys themselves.' },
  { icon: '⏱', title: 'Pause pattern analysis', desc: 'Human writers pause before complex sentences. AI-generated text appears without these natural gaps.' },
  { icon: '✂', title: 'Paste detection', desc: 'Externally inserted text blocks are flagged instantly — no keystroke data, sudden content jump.' },
  { icon: '📈', title: 'Statistical signatures', desc: 'Sentence length variance, vocabulary diversity and stylistic rhythm reveal true authorship.' },
  { icon: '🔗', title: 'Shareable reports', desc: 'Generate a verified authenticity report and share a public link with educators or publishers.' },
  { icon: '🔒', title: 'Privacy first', desc: 'Raw key content is never stored. Only timing and behavioral metadata, encrypted at rest.' },
];

const steps = [
  { num: '01', title: 'Start a session', desc: 'Open the editor and begin writing. Monitoring starts silently in the background.' },
  { num: '02', title: 'Write naturally', desc: 'Type, pause, revise — exactly as you normally would. No changes to your workflow.' },
  { num: '03', title: 'Get your report', desc: 'Click Complete & Analyze. Receive a scored authenticity report in seconds.' },
  { num: '04', title: 'Share & prove', desc: 'Share a verified report link to prove genuine authorship to anyone.' },
];

const navItems = [
  { label: 'Editor', path: '/editor' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Educator', path: '/educator' },
  { label: 'Profile', path: '/profile' },
  { label: 'Forgot password', path: '/forgot-password' },
];

const exploreCards = [
  { icon: '✎', label: 'Start writing', desc: 'Open the editor and start a monitored writing session', path: '/editor', color: 'rgba(74,222,128,0.1)', textColor: '#4ade80' },
  { icon: '⊞', label: 'Dashboard', desc: 'View all your writing sessions and authenticity scores', path: '/dashboard', color: 'rgba(96,165,250,0.1)', textColor: '#60a5fa' },
  { icon: '📊', label: 'Analytics', desc: 'View score trends, charts and writing statistics', path: '/analytics', color: 'rgba(251,191,36,0.1)', textColor: '#fbbf24' },
  { icon: '🎓', label: 'Educator dashboard', desc: 'Review all student submissions and flag suspicious writing', path: '/educator', color: 'rgba(167,139,250,0.1)', textColor: '#a78bfa' },
  { icon: '👤', label: 'Profile', desc: 'Edit your name, change password and manage your account', path: '/profile', color: 'rgba(52,211,153,0.1)', textColor: '#34d399' },
  { icon: '📄', label: 'Authenticity reports', desc: 'View behavioral, textual scores with PDF export', path: '/dashboard', color: 'rgba(251,113,133,0.1)', textColor: '#fb7185' },
  { icon: '🔑', label: 'Forgot password', desc: 'Reset your password via email verification link', path: '/forgot-password', color: 'rgba(234,179,8,0.1)', textColor: '#eab308' },
  { icon: '🌙', label: 'Dark mode', desc: 'Toggle between light and dark theme', path: '/dashboard', color: 'rgba(148,163,184,0.1)', textColor: '#94a3b8' },
  { icon: '📥', label: 'Export CSV', desc: 'Download all your session data as a spreadsheet', path: '/analytics', color: 'rgba(34,211,238,0.1)', textColor: '#22d3ee' },
  { icon: '🔔', label: 'Notifications', desc: 'Get alerts for reports, paste detection and session updates', path: '/dashboard', color: 'rgba(74,222,128,0.1)', textColor: '#4ade80' },
  { icon: '🤖', label: 'AI analysis', desc: 'OpenAI powered text analysis for higher accuracy detection', path: '/dashboard', color: 'rgba(167,139,250,0.1)', textColor: '#a78bfa' },
  { icon: '👤', label: 'Create account', desc: 'Register as a writer or educator to get started', path: '/login', color: 'rgba(96,165,250,0.1)', textColor: '#60a5fa' },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add(styles.visible);
      }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(`.${styles.reveal}`).forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navBrand} onClick={() => navigate('/')}>
          <span className={styles.brandPsi}>Ψ</span>
          <span className={styles.brandName}>Vi-Notes</span>
        </div>

        <div className={styles.navLinks}>
          <a href="#how-it-works" className={styles.navLink}>How it works</a>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#explore" className={styles.navLink}>Explore</a>

          <div className={styles.navDropdown} onClick={e => { e.stopPropagation(); setDropdownOpen(v => !v); }}>
            <span className={styles.navLink}>
              Pages <span className={styles.dropArrow}>{dropdownOpen ? '▲' : '▼'}</span>
            </span>
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                {navItems.map((item, i) => (
                  <div key={i} className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); navigate(item.path); }}>
                    <span className={styles.dropdownLabel}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className={styles.navLogin} onClick={() => navigate('/login')}>Sign in</button>
          <button className={styles.navCta} onClick={() => navigate('/login')}>Get started</button>
        </div>

        <button className={styles.hamburger} onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <a href="#how-it-works" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#features" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#explore" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Explore</a>
          <div className={styles.mobileDivider} />
          {navItems.map((item, i) => (
            <div key={i} className={styles.mobileLink} onClick={() => { setMenuOpen(false); navigate(item.path); }}>
              {item.label}
            </div>
          ))}
          <div className={styles.mobileDivider} />
          <button className={styles.mobileCtaBtn} onClick={() => { setMenuOpen(false); navigate('/login'); }}>
            Get started
          </button>
        </div>
      )}

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgGrid} />
          <div className={styles.heroBgGlow} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Authenticity verification platform
          </div>
          <h1 className={styles.heroTitle}>
            Prove your writing<br />
            <span className={styles.heroTitleAccent}>is genuinely yours</span>
          </h1>
          <p className={styles.heroDesc}>
            Vi-Notes monitors how you write — not what you write — to generate
            tamper-proof authenticity reports that distinguish human authorship
            from AI-generated or AI-assisted content.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/login')}>Start writing free</button>
            <a href="#how-it-works" className={styles.ctaSecondary}>See how it works →</a>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>5</span>
              <span className={styles.heroStatLabel}>detection signals</span>
            </div>
            <div className={styles.heroStatDiv} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>0</span>
              <span className={styles.heroStatLabel}>keystrokes stored</span>
            </div>
            <div className={styles.heroStatDiv} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>100%</span>
              <span className={styles.heroStatLabel}>privacy safe</span>
            </div>
          </div>
        </div>

        <div className={styles.heroPreview}>
          <div className={styles.previewBar}>
            <span className={styles.previewDot} style={{ background: '#ff5f57' }} />
            <span className={styles.previewDot} style={{ background: '#febc2e' }} />
            <span className={styles.previewDot} style={{ background: '#28c840' }} />
            <span className={styles.previewTitle}>My Essay — Vi-Notes</span>
          </div>
          <div className={styles.previewBody}>
            <div className={styles.previewStatus}>
              <span className={styles.recDot} />
              <span>Recording</span>
              <span className={styles.previewSep}>·</span>
              <span>247 words</span>
              <span className={styles.previewSep}>·</span>
              <span>42 WPM</span>
            </div>
            <div className={styles.previewText}>
              <span>The impact of artificial intelligence on modern education has been profound and far-reaching. Students today face unprecedented challenges in demonstrating genuine understanding</span>
              <span className={styles.cursor} />
            </div>
            <div className={styles.previewFlag}>
              <span className={styles.flagIcon}>⚑</span>
              <span>Paste detected — 312 chars flagged</span>
            </div>
          </div>
          <div className={styles.previewScore}>
            <div className={styles.scoreRing}>
              <svg viewBox="0 0 60 60" className={styles.scoreRingSvg}>
                <circle cx="30" cy="30" r="24" fill="none" stroke="#333" strokeWidth="4" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="#4ade80" strokeWidth="4"
                  strokeDasharray="150.8" strokeDashoffset="45" strokeLinecap="round"
                  transform="rotate(-90 30 30)" />
              </svg>
              <span className={styles.scoreNum}>74</span>
            </div>
            <div>
              <div className={styles.scoreLabel}>Likely Human</div>
              <div className={styles.scoreConf}>82% confidence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick nav pills */}
      <section className={styles.pillsSection}>
        <div className={styles.pillsInner}>
          <span className={styles.pillsLabel}>Quick access:</span>
          {navItems.map((item, i) => (
            <button key={i} className={styles.pill} onClick={() => navigate(item.path)}>
              {item.label} →
            </button>
          ))}
        </div>
      </section>

      {/* Explore */}
      <section className={styles.exploreSection} id="explore">
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.reveal}`}>
            <div className={styles.sectionEyebrow}>Explore</div>
            <h2 className={styles.sectionTitle}>Everything in Vi-Notes</h2>
            <p className={styles.sectionSubtitle}>Click any card to go directly to that feature</p>
          </div>
          <div className={styles.exploreGrid}>
            {exploreCards.map((card, i) => (
              <div key={i} className={`${styles.exploreCard} ${styles.reveal}`} onClick={() => navigate(card.path)}>
                <div className={styles.exploreIcon} style={{ background: card.color, color: card.textColor }}>{card.icon}</div>
                <div className={styles.exploreCardBody}>
                  <div className={styles.exploreCardTitle}>{card.label}</div>
                  <div className={styles.exploreCardDesc}>{card.desc}</div>
                </div>
                <div className={styles.exploreArrow}>→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howSection} id="how-it-works">
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.reveal}`}>
            <div className={styles.sectionEyebrow}>How it works</div>
            <h2 className={styles.sectionTitle}>From first keystroke to verified report</h2>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((step, i) => (
              <div key={i} className={`${styles.stepCard} ${styles.reveal}`}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionInner}>
          <div className={`${styles.sectionHeader} ${styles.reveal}`}>
            <div className={styles.sectionEyebrow}>Features</div>
            <h2 className={styles.sectionTitle}>Everything you need to prove authorship</h2>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div key={i} className={`${styles.featureCard} ${styles.reveal}`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className={styles.privacySection}>
        <div className={styles.sectionInner}>
          <div className={`${styles.privacyCard} ${styles.reveal}`}>
            <div className={styles.privacyLeft}>
              <div className={styles.sectionEyebrow}>Privacy & ethics</div>
              <h2 className={styles.privacyTitle}>We monitor behavior, not content</h2>
              <p className={styles.privacyDesc}>
                Vi-Notes is built on a privacy-first foundation. We never store what keys you press —
                only when you press them. Your writing content is encrypted at rest.
              </p>
              <ul className={styles.privacyList}>
                <li>✓ No raw keystroke content ever stored</li>
                <li>✓ AES-256 encrypted document storage</li>
                <li>✓ You can delete your sessions anytime</li>
                <li>✓ Monitoring only during active sessions</li>
              </ul>
            </div>
            <div className={styles.privacyRight}>
              {[
                { icon: '🔒', title: 'Privacy guaranteed', desc: 'Keystroke content never leaves your device' },
                { icon: '🛡', title: 'Encrypted storage', desc: 'AES-256 encryption for all session data' },
                { icon: '👤', title: 'You own your data', desc: 'Delete sessions and reports anytime' },
              ].map((b, i) => (
                <div key={i} className={styles.privacyBadge}>
                  <div className={styles.privacyBadgeIcon}>{b.icon}</div>
                  <div className={styles.privacyBadgeText}>
                    <div className={styles.privacyBadgeTitle}>{b.title}</div>
                    <div className={styles.privacyBadgeDesc}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={`${styles.ctaCard} ${styles.reveal}`}>
          <h2 className={styles.ctaTitle}>Ready to verify your writing?</h2>
          <p className={styles.ctaDesc}>Create a free account and generate your first authenticity report in minutes.</p>
          <button className={styles.ctaPrimary} onClick={() => navigate('/login')}>Get started for free</button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <span className={styles.brandPsi}>Ψ</span>
            <span className={styles.brandName}>Vi-Notes</span>
          </div>
          <div className={styles.footerLinks}>
            {navItems.map((item, i) => (
              <span key={i} className={styles.footerLink} onClick={() => navigate(item.path)}>{item.label}</span>
            ))}
            <span className={styles.footerLink} onClick={() => navigate('/login')}>Sign in</span>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.footerDesc}>Authenticity verification through behavioral biometrics.</p>
          <p className={styles.footerCredit}>Built by Vicharanashala · Mentored by Jinal Gupta</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
