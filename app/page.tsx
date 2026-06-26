"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Telescope, CircleDot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ONBOARDING_STEPS = [
  "INITIALIZING COSMIC RADAR...",
  "LOCATING CELESTIAL BODIES...",
  "ESTABLISHING ORBITAL UPLINK...",
  "SYSTEM READY."
];

const BACKGROUND_IMAGES = [
  "/nasa-yZygONrUBe8-unsplash.jpg",
  "/guillermo-ferla-QfLm-2AiJ_M-unsplash.jpg",
  "/gabriele-garanzelli-PzO_CitnJdI-unsplash.jpg"
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (step < ONBOARDING_STEPS.length) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    const bgTimer = setInterval(() => {
      setBgIndex(prev => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(bgTimer);
  }, []);

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length) {
      setStep(prev => prev + 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full px-5 sm:px-8 md:px-24">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
        <AnimatePresence>
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${BACKGROUND_IMAGES[bgIndex]})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Huge Outline Text "01" */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/4 pointer-events-none opacity-20 select-none z-0">
        <span className="font-heading font-bold text-[40vw] leading-none text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.8)" }}>
          01
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-2xl z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-[1px] bg-white/50" />
          <span className="font-heading text-xs tracking-[0.3em] uppercase text-white/80">
            OBSERVATION
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-heading mb-8 md:mb-10 leading-tight">
          TRACK<br />YOUR<br />ZENITH
        </h1>
        
        <div className="space-y-4 border-l border-white/20 pl-6 ml-2">
          <p className="text-sm md:text-base text-white/80 font-light tracking-wide max-w-sm leading-relaxed">
            With the most advanced real-time radar system,
          </p>
          <p className="text-sm md:text-base text-white/80 font-light tracking-wide max-w-sm leading-relaxed">
            Locate celestial bodies floating in the cosmos above you safely.
          </p>
        </div>

        <div className="mt-12 md:mt-16 ml-2 h-24">
          <AnimatePresence mode="wait">
            {step < ONBOARDING_STEPS.length ? (
              <motion.button
                key="step-button"
                onClick={handleNext}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="font-heading text-xs tracking-[0.2em] text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 hover:bg-cyan-500/20 transition-colors flex items-center gap-3"
              >
                {ONBOARDING_STEPS[step]} <span className="animate-pulse">_</span>
              </motion.button>
            ) : (
              <motion.div
                key="commence-link"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link 
                  href="/location"
                  className="inline-block relative overflow-hidden group border border-white/30 px-12 py-4"
                >
                  <span className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <span className="relative font-heading text-xs tracking-[0.3em] group-hover:text-black transition-colors duration-500 flex items-center gap-4">
                    COMMENCE LINK <Telescope className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Footer Elements */}
      <div className="absolute bottom-6 left-5 right-5 md:bottom-8 md:left-8 md:right-8 flex items-center justify-between z-10 pointer-events-none">
        <div className="hidden sm:flex w-12 h-12 rounded-full border border-white/30 items-center justify-center p-2 relative pointer-events-auto">
          <CircleDot className="w-full h-full text-white/50" strokeWidth={1} />
          <div className="absolute top-1/2 -right-2 w-1 h-1 bg-white rounded-full" />
        </div>
        
        <div className="flex flex-col items-start sm:items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center pointer-events-auto">
            <div className="w-3 h-[1px] bg-white/70" />
          </div>
          <span className="font-heading text-[10px] tracking-[0.2em] text-white/80">
            MISSION CONTROL
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 pointer-events-auto">
          <div className="w-16 h-8 rounded-full border border-white/30 flex items-center justify-center">
            <div className="w-6 h-[1px] bg-white/50" />
          </div>
          <span className="text-[10px] tracking-[0.1em] text-white/50 mt-1">
            system <span className="text-white">ready</span>
          </span>
        </div>
      </div>

      {/* Right Side Pagination Dots (Hidden on Mobile to prevent overlap) */}
      <div className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-6 items-center z-10">
        {BACKGROUND_IMAGES.map((_, i) => (
          <div key={i} onClick={() => setBgIndex(i)} className="cursor-pointer flex justify-center items-center h-3 w-3">
            {bgIndex === i ? (
              <div className="w-3 h-3 rounded-full border border-white/50 flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <div className="absolute top-1/2 right-full w-12 h-[1px] bg-white/50 mr-4 pointer-events-none" />
              </div>
            ) : (
              <div className="w-1.5 h-1.5 bg-white/30 rounded-full hover:bg-white/70 transition-colors" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
