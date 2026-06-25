import { motion, type Variants, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import './LandingPage.css';

// Asset Imports
import contestGif from '../../assets/gif4.gif';
import algoGif from '../../assets/hero.png';

const LandingPage = () => {
  const { scrollYProgress } = useScroll();

  const rawScale = useTransform(scrollYProgress, [0.01, 0.99], [1.15, 1]);
  const backgroundScale = useSpring(rawScale, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // REOPTIMIZED VARIANTS: Reduced interpolation range to save GPU cycle repaints
  const textSlideFromBehindLeft: Variants = {
    hidden: { 
      opacity: 0, 
      x: 280, // Reduced offset distance to keep memory footprint minimal during translation
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] } 
    }
  };

  const textSlideFromBehindRight: Variants = {
    hidden: { 
      opacity: 0, 
      x: -280, 
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.65, ease: [0.25, 1, 0.5, 1] }
    }
  };

  const cardFadeVariant: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.4, ease: "easeOut" } 
    }
  };

  return (
    <div className="codeforged-app">
      <motion.div className="ambient-bg-canvas" style={{ scale: backgroundScale }} />

      <main className="contests-page">
        {/* Hero Section */}
        <section id="home" className="hero-section">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hero-content">
            <h1 className="hero-title">Forge Your <span className="text-accent">Coding Legacy</span></h1>
            <p className="hero-subtitle">Compete in live contests, climb the global leaderboard, and master complex algorithms.</p>
            <div className="hero-actions">
              <Link to="/contests" className="btn-primary btn-large">Enter the Arena</Link>
              <Link to="/problems" className="btn-secondary btn-large">View Problems</Link>
            </div>
          </motion.div>
        </section>

        {/* Scroll Animated Features Section */}
        <section id="features" className="features-section">
          
          {/* Feature 1 */}
          <div className="feature-row slide-reveal-container">
            {/* Structural isolation: Text block handles its own transform layer */}
            <motion.div 
              className="feature-text sliding-panel" 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={textSlideFromBehindLeft}
            >
              <h2>Live Competitive Arena</h2>
              <p>
                Experience adrenaline-pumping live contests. Our real-time judging system ensures your submissions 
                are evaluated instantly, keeping the leaderboards constantly updated as the timer ticks down.
              </p>
            </motion.div>

            {/* Static structure container to avoid multi-layer heavy composition loops */}
            <motion.div 
              className="feature-image-wrapper physical-mask"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardFadeVariant}
            >
              <img src={contestGif} alt="Live Contest Dashboard" className="feature-image" />
            </motion.div>
          </div>

          {/* Feature 2 */}
          <div className="feature-row reverse slide-reveal-container">
            <motion.div 
              className="feature-text sliding-panel" 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={textSlideFromBehindRight}
            >
              <h2>Advanced Algorithm Support</h2>
              <p>
                From Disjoint Set Union (DSU) and Monotonic Stacks to Sieve of Eratosthenes and Interval DP, 
                our problemsets are designed to push your problem-solving limits to the next level.
              </p>
            </motion.div>

            <motion.div 
              className="feature-image-wrapper physical-mask"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardFadeVariant}
            >
              <img src={algoGif} alt="Algorithms Visualizer" className="feature-image" />
            </motion.div>
          </div>

        </section>

        {/* Upcoming Contests Teaser */}
        <section id="contests" className="upcoming-contests">
          <div className="contest-cards">
            <div className="contest-card">
              <span className="live-badge mono">UPCOMING</span>
              <h3>CodeForged Round #101 (Div. 2)</h3>
              <p className="text-secondary">Starts in: 2 days</p>
            </div>
            <div className="contest-card">
              <span className="live-badge mono" style={{ color: 'var(--success-accent)', backgroundColor: 'var(--success-bg)' }}>REGISTER</span>
              <h3>Educational Round: Dynamic Programming</h3>
              <p className="text-secondary">Starts in: 5 days</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;