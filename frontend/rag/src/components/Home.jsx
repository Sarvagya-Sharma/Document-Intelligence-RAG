import earth from "../assets/earth.mp4";
import "./Home.css";
import Navbar from "./Navbar";

const Home = () => {

  return (
    <div className="hero-container">
      <Navbar />

      {/* Earth background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="bg-video"
        aria-hidden="true"
      >
        <source src={earth} type="video/mp4" />
      </video>

      {/* Layered overlays for depth */}
      <div className="overlay-gradient" />
      <div className="overlay-vignette" />

      {/* Animated star particles */}
      <div className="stars-layer" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      {/* Main hero content */}
      <div className="hero-content">



        {/* Main heading */}
        <h1 className="hero-heading">InstaDocs</h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          The AI that actually <em>understands</em> your documents.<br />
          Ask anything. Get precise, cited answers — instantly.
        </p>

      </div>

      <div className="scroll-hint" aria-hidden="true">
        <div className="scroll-dot" />
      </div>
    </div>
  );
};

export default Home;