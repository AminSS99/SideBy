import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LoadingPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 mb-8 relative"
        >
          <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-t-transparent border-r-cyan-400 border-b-transparent border-l-pink-500 rounded-full animate-spin-slow" />
        </motion.div>

        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent italic uppercase">
          SIDEBY
        </h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase mb-8">
          Gathering Intel from the Web
        </p>

        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <span className="mt-4 text-xs font-mono text-gray-500">
          {progress}% COMPLETE
        </span>
      </motion.div>

      {/* Floating particles or something extra */}
      <AnimatePresence>
        {progress > 80 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-12 text-blue-400 text-xs font-medium animate-pulse"
          >
            Almost ready...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoadingPage;
