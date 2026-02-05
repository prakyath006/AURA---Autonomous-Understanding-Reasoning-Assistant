'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Zap, BrainCircuit, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeScene } from '@/lib/gemini';
import clsx from 'clsx';
import BootSequence from './BootSequence';

export default function Scanner() {
    const webcamRef = useRef<Webcam>(null);
    const [booted, setBooted] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [mode, setMode] = useState<'reason' | 'detect'>('reason');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const captureAndAnalyze = useCallback(async () => {
        if (!webcamRef.current) return;

        // Get screenshot
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setAnalyzing(true);
        setError(null);

        try {
            const response = await analyzeScene(imageSrc, "Analyze this scene.", mode);

            // Try to parse JSON strictly
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    setResult(parsed);

                    // Text to Speech for the suggestion
                    if (parsed.suggestion) {
                        const utterance = new SpeechSynthesisUtterance(parsed.suggestion);
                        utterance.rate = 1.1;
                        utterance.pitch = 1.0;
                        window.speechSynthesis.speak(utterance);
                    }
                } catch (e) {
                    setResult({ observation: response, reasoning: "Raw output", suggestion: "N/A" });
                }
            } else {
                setResult({ observation: response, reasoning: "Raw output", suggestion: "N/A" });
            }

        } catch (err) {
            setError("Connection Lost: Neural Link Unstable");
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    }, [mode]);

    return (
        <div className="relative w-full h-screen max-h-screen overflow-hidden bg-black flex flex-col items-center justify-center">

            <AnimatePresence>
                {!booted && <BootSequence onComplete={() => setBooted(true)} />}
            </AnimatePresence>

            {/* Background Cam */}
            <div className="absolute inset-0 z-0">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover opacity-60"
                    videoConstraints={{ facingMode: "environment" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
            </div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 z-10 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />

            {/* HUD Header */}
            <header className="absolute top-0 w-full z-20 p-6 flex justify-between items-start">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        AURA
                    </h1>
                    <span className="text-xs font-mono text-cyan-500/80 tracking-[0.2em] uppercase">
                        Augmented // Reasoning // Unit
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('detect')}
                        className={clsx(
                            "px-4 py-2 rounded-full border border-white/10 backdrop-blur-md text-xs font-bold uppercase transition-all",
                            mode === 'detect' ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "bg-black/40 text-cyan-400 hover:bg-white/5"
                        )}
                    >
                        <Activity className="size-4 inline mr-2" /> Detect
                    </button>
                    <button
                        onClick={() => setMode('reason')}
                        className={clsx(
                            "px-4 py-2 rounded-full border border-white/10 backdrop-blur-md text-xs font-bold uppercase transition-all",
                            mode === 'reason' ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "bg-black/40 text-purple-400 hover:bg-white/5"
                        )}
                    >
                        <BrainCircuit className="size-4 inline mr-2" /> Insight (Reason)
                    </button>
                </div>
            </header>

            {/* Center Reticle */}
            <div className="z-20 relative size-64 border-2 border-white/20 rounded-lg flex items-center justify-center">
                <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-cyan-400 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-cyan-400 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-cyan-400 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-cyan-400 -mb-1 -mr-1" />

                {analyzing && (
                    <motion.div
                        className="absolute w-full h-1 bg-cyan-500/50 shadow-[0_0_10px_#06b6d4]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                )}

                {!analyzing && (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="size-2 bg-red-500 rounded-full shadow-[0_0_10px_red]"
                    />
                )}
            </div>

            {/* Analysis Output */}
            <AnimatePresence>
                {result && !analyzing && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="absolute bottom-32 z-30 w-full max-w-lg px-6"
                    >
                        <div className="glass-panel rounded-2xl p-6 border-l-4 border-purple-500 bg-gradient-to-br from-gray-900/90 to-black/90">
                            <div className="flex items-center gap-2 mb-3">
                                <BrainCircuit className="text-purple-400 size-5" />
                                <h3 className="text-purple-100 font-bold uppercase tracking-wider text-sm">Analysis Complete</h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-500 uppercase tracking-widest">Observation</span>
                                    <p className="text-gray-200 text-sm leading-relaxed">{result.observation}</p>
                                </div>

                                {mode === 'reason' && (
                                    <>
                                        <div className="h-px bg-white/10" />
                                        <div>
                                            <span className="text-xs text-purple-400/80 uppercase tracking-widest flex items-center gap-2">
                                                <Zap size={10} /> Reasoning Kernel
                                            </span>
                                            <p className="text-purple-100 text-sm italic border-l-2 border-purple-500 pl-3 py-1 my-1">
                                                "{result.reasoning}"
                                            </p>
                                        </div>

                                        <div className="mt-3 p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/20">
                                            <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold">Suggested Action</span>
                                            <p className="text-cyan-100 font-medium">{result.suggestion}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            <div className="absolute bottom-10 z-30">
                <button
                    onClick={captureAndAnalyze}
                    disabled={analyzing}
                    className="group relative size-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:bg-white/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className={clsx(
                        "size-14 rounded-full transition-all duration-500",
                        analyzing ? "bg-red-500 animate-pulse" : "bg-cyan-500 group-hover:shadow-[0_0_30px_#06b6d4]"
                    )} />
                    <Camera className="absolute text-white size-8" />
                </button>
            </div>

        </div>
    );
}
