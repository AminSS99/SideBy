import React from "react";
import { motion } from "framer-motion";
import GlassCard from "../GlassCard";

/**
 * Premium Loading Skeleton for Comparison Results
 * Shows animated placeholder cards while AI processes
 */

// Animated shimmer effect
const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// Skeleton bar component
const SkeletonBar = ({ width = "100%", height = "h-4" }: { width?: string; height?: string }) => (
  <div 
    className={`${height} rounded-full bg-white/10 relative overflow-hidden`}
    style={{ width }}
  >
    <Shimmer className="absolute inset-0" />
  </div>
);

// Skeleton circle component
const SkeletonCircle = ({ size = "w-12 h-12" }: { size?: string }) => (
  <div className={`${size} rounded-full bg-white/10 relative overflow-hidden`}>
    <Shimmer className="absolute inset-0" />
  </div>
);

// Main comparison skeleton
export const ComparisonSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Winner Badge Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-8"
      >
        <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4">
            <SkeletonCircle size="w-8 h-8" />
            <div className="space-y-2">
              <SkeletonBar width="60px" height="h-3" />
              <SkeletonBar width="120px" height="h-6" />
            </div>
            <div className="ml-4 space-y-1 text-right">
              <SkeletonBar width="50px" height="h-8" />
              <SkeletonBar width="70px" height="h-2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Battle Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,100px,1fr] gap-4 mb-8">
        {/* Card A */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 rounded-3xl">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-purple-500/20 relative overflow-hidden">
                <Shimmer className="absolute inset-0" />
              </div>
              <SkeletonBar width="60%" height="h-6" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5">
                    <SkeletonCircle size="w-4 h-4 mx-auto" />
                    <div className="mt-2">
                      <SkeletonBar width="50px" height="h-6" />
                    </div>
                    <SkeletonBar width="40px" height="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* VS Column */}
        <div className="flex flex-col items-center justify-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/50 to-emerald-600/50 relative overflow-hidden"
          >
            <Shimmer className="absolute inset-0" />
          </motion.div>
        </div>

        {/* Card B */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 rounded-3xl">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-emerald-500/20 relative overflow-hidden">
                <Shimmer className="absolute inset-0" />
              </div>
              <SkeletonBar width="60%" height="h-6" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5">
                    <SkeletonCircle size="w-4 h-4 mx-auto" />
                    <div className="mt-2">
                      <SkeletonBar width="50px" height="h-6" />
                    </div>
                    <SkeletonBar width="40px" height="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Category Breakdown Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <GlassCard className="p-6 rounded-3xl">
          <SkeletonBar width="200px" height="h-4" />
          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <SkeletonBar width="50px" height="h-6" />
                <div className="flex-1 h-10 rounded-xl bg-white/5 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-purple-500/30 rounded-xl"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.random() * 40 + 30}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  />
                </div>
                <SkeletonBar width="60px" height="h-4" />
                <div className="flex-1 h-10 rounded-xl bg-white/5 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-emerald-500/30 rounded-xl"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.random() * 40 + 30}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  />
                </div>
                <SkeletonBar width="50px" height="h-6" />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* AI Insights Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[1, 2, 3].map((i) => (
          <GlassCard key={i} className="p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <SkeletonCircle size="w-12 h-12" />
              <SkeletonBar width="80px" height="h-4" />
            </div>
            <div className="space-y-2">
              <SkeletonBar width="100%" height="h-3" />
              <SkeletonBar width="80%" height="h-3" />
            </div>
          </GlassCard>
        ))}
      </motion.div>
    </div>
  );
};

/**
 * Loading message with animated dots
 */
export const LoadingMessage: React.FC<{ message?: string }> = ({ 
  message = "AI is analyzing your comparison" 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-4"
    >
      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-500/20 border border-purple-500/30">
        <motion.div
          className="w-2 h-2 rounded-full bg-purple-400"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-purple-400"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-purple-400"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
        <span className="ml-2 text-sm font-medium text-purple-300">{message}</span>
      </div>
    </motion.div>
  );
};

export default ComparisonSkeleton;
