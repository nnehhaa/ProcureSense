import { motion } from "framer-motion";

function Hero() {
  return (
    <section className="hero">
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        ProcureSense
      </motion.h1>

      <h2 className="hero-subtitle">
        Analyze. Compare. Negotiate.
      </h2>

      <p className="hero-text">
        AI-Powered Procurement Contract Intelligence
      </p>
    </section>
  );
}

export default Hero;