'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { Camera, Zap, BrainCircuit, Activity, X, Volume2, VolumeX, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeScene } from '@/lib/gemini';
import clsx from 'clsx';
import BootSequence from './BootSequence';

interface ScanRecord {
    id: string;
    timestamp: Date;
    lens: string;
    imageSrc: string;
    result: any;
    mode: string;
}

export default function Scanner() {
    const router = useRouter();
    const webcamRef = useRef<Webcam>(null);
    const [booted, setBooted] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [mode, setMode] = useState<'reason' | 'detect'>('reason');
    const [activeLens, setActiveLens] = useState<'universal' | 'codex' | 'mechanic' | 'bio'>('universal');

    // Note: Persist history in localStorage so it survives navigation
    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioEnabled, setAudioEnabled] = useState(true); // Audio toggle state

    // Load history on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('aura_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Re-hydrate dates
                const hydrated = parsed.map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
                setHistory(hydrated);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    }, []);

    // Load audio preference and cleanup on unmount
    React.useEffect(() => {
        const savedAudioPref = localStorage.getItem('aura_audio_enabled');
        if (savedAudioPref !== null) {
            setAudioEnabled(savedAudioPref === 'true');
        }

        // Cleanup: Stop any playing audio when component unmounts
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    // Theme configuration based on active lens
    const lensThemes = {
        universal: { color: 'cyan', icon: BrainCircuit, label: 'Universal' },
        codex: { color: 'green', icon: Activity, label: 'Codex' },
        mechanic: { color: 'orange', icon: Camera, label: 'Mechanic' },
        bio: { color: 'emerald', icon: Zap, label: 'Bio-Scan' }
    };

    const currentTheme = lensThemes[activeLens];

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
    };

    const toggleAudio = () => {
        const newState = !audioEnabled;
        setAudioEnabled(newState);
        localStorage.setItem('aura_audio_enabled', String(newState));
        if (!newState) {
            stopSpeaking(); // Stop audio immediately when disabled
        }
    };

    const captureAndAnalyze = useCallback(async () => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setAnalyzing(true);
        setError(null);
        stopSpeaking();

        // Store lens for analyzing page theme
        sessionStorage.setItem('analyzing_lens', activeLens);

        // Redirect to analyzing page IMMEDIATELY
        // router.push('/analyzing'); // DISABLE: Keep user on page to show errors if they happen

        try {
            console.log("🚀 Starting analysis with:", { mode, activeLens });
            const response = await analyzeScene(imageSrc, "Analyze this scene.", mode, activeLens);
            console.log("✅ Received response:", response);

            // JSON Parsing Logic
            // cleaning the response
            const cleaned = response.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
            const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            let finalResult: any = { observation: response, reasoning: "Raw output", suggestion: "N/A" };

            if (match) {
                try {
                    const parsed = JSON.parse(match[0]);
                    if (Array.isArray(parsed)) {
                        finalResult = { detectionList: parsed, observation: "Scan Complete. Multiple targets identified." };
                    } else {
                        finalResult = parsed;
                    }
                } catch (e) {
                    console.warn("Failed to parse JSON from response:", e);
                    // Keep default
                }
            }

            // Create Record
            const record = {
                id: Date.now().toString(),
                timestamp: new Date(),
                lens: activeLens,
                imageSrc: imageSrc,
                result: finalResult,
                mode: mode
            };

            // Update History State & Persist
            setHistory(prev => {
                const newHistory = [record as ScanRecord, ...prev];
                localStorage.setItem('aura_history', JSON.stringify(newHistory));
                return newHistory;
            });

            // Save to Session & Redirect
            sessionStorage.setItem('currentAnalysis', JSON.stringify(record));

            // Speech Output (Only if audio is enabled)
            if (audioEnabled && finalResult.suggestion && typeof finalResult.suggestion === 'string') {
                const utterance = new SpeechSynthesisUtterance(finalResult.suggestion);
                utterance.rate = 1.1;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }

            router.push('/result');

        } catch (err: any) {
            const errorMessage = err?.message || "Unknown error occurred";
            console.error("❌ Analysis failed:", err);
            console.error("Error details:", errorMessage);
            setError(`Connection Lost: ${errorMessage}`);
            // Go back to scanner on error
            // router.push('/'); // DISABLE: Don't reload page, keep error visible
        } finally {
            setAnalyzing(false);
        }
    }, [mode, activeLens, audioEnabled, router]);

    const loadHistoryItem = (record: ScanRecord) => {
        sessionStorage.setItem('currentAnalysis', JSON.stringify(record));
        router.push('/result');
    };

    const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the item
        setHistory(prev => {
            const newHistory = prev.filter(item => item.id !== id);
            localStorage.setItem('aura_history', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearAllHistory = () => {
        if (confirm('Are you sure you want to delete all mission history?')) {
            setHistory([]);
            localStorage.removeItem('aura_history');
        }
    };

    // Color mappings
    const getThemeColors = () => {
        switch (activeLens) {
            case 'codex': return { text: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500' };
            case 'mechanic': return { text: 'text-orange-400', border: 'border-orange-500', bg: 'bg-orange-500' };
            case 'bio': return { text: 'text-emerald-400', border: 'border-emerald-500', bg: 'bg-emerald-500' };
            default: return { text: 'text-cyan-400', border: 'border-cyan-500', bg: 'bg-cyan-500' };
        }
    };
    const theme = getThemeColors();

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

            <div className="absolute inset-0 z-10 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="absolute top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
                    >
                        <div className="bg-red-500/90 backdrop-blur-md border border-red-400 rounded-lg p-4 shadow-lg pointer-events-auto">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-white text-sm mb-1">⚠️ SYSTEM ERROR</h3>
                                    <p className="text-white/90 text-xs font-mono">{error}</p>
                                </div>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-white hover:text-red-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="absolute top-0 w-full z-20 p-6 flex justify-between items-start pointer-events-none">

                {/* Left: Title & Lens Selector */}
                <div className="flex flex-col gap-4 pointer-events-auto">
                    <div className="flex flex-col">
                        <h1 className={`text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400`}>
                            AURA
                        </h1>
                        <span className={`text-xs font-mono ${theme.text} opacity-80 tracking-[0.2em] uppercase`}>
                            Lens // {currentTheme.label}
                        </span>
                    </div>
                    {/* Lens Selector */}
                    <div className="flex flex-row gap-2">
                        {Object.entries(lensThemes).map(([key, item]) => {
                            const isActive = key === activeLens;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveLens(key as any)}
                                    className={clsx(
                                        "flex items-center justify-center size-10 rounded-full border backdrop-blur-md transition-all duration-300",
                                        isActive
                                            ? `border-${item.color}-500 bg-${item.color}-500/20 text-${item.color}-300 shadow-[0_0_10px_rgba(0,0,0,0.5)]`
                                            : "border-white/10 bg-black/40 text-gray-500 hover:bg-white/10"
                                    )}
                                    title={item.label}
                                >
                                    <Icon size={18} />
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right: Audio Toggle & History Toggle */}
                <div className="pointer-events-auto flex items-center gap-2">
                    {/* Audio Toggle */}
                    <button
                        onClick={toggleAudio}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md transition-all",
                            audioEnabled
                                ? "border-green-500/50 bg-green-500/20 text-green-300 hover:bg-green-500/30"
                                : "border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        )}
                        title={audioEnabled ? "Audio Enabled - Click to Mute" : "Audio Muted - Click to Enable"}
                    >
                        {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {audioEnabled ? "Audio On" : "Muted"}
                        </span>
                    </button>

                    {/* History Toggle */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white hover:bg-white/10 transition-colors"
                    >
                        <Clock size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Mission Log</span>
                        <span className="bg-white/20 px-1.5 rounded text-[10px]">{history.length}</span>
                    </button>
                </div>

            </header>

            {/* Mission Log Sidebar */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        className="absolute top-0 right-0 h-full w-80 z-40 bg-black/90 backdrop-blur-xl border-l border-white/10 flex flex-col pointer-events-auto"
                    >
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Clock size={16} className="text-cyan-400" /> Mission Log
                                </h2>
                                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                                    <ChevronRight />
                                </button>
                            </div>
                            {history.length > 0 && (
                                <button
                                    onClick={clearAllHistory}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors text-xs font-bold uppercase"
                                >
                                    <Trash2 size={14} />
                                    Clear All History
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {history.length === 0 && (
                                <div className="text-gray-500 text-center text-xs mt-10">No scans recorded yet.</div>
                            )}
                            {history.map((record) => (
                                <div
                                    key={record.id}
                                    onClick={() => loadHistoryItem(record)}
                                    className="group p-3 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-white/10"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="size-10 rounded overflow-hidden bg-black/50">
                                            <img src={record.imageSrc} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-xs text-cyan-300 font-bold uppercase">{record.lens} Scan</span>
                                            <span className="text-[10px] text-gray-500">{record.timestamp.toLocaleTimeString()}</span>
                                        </div>
                                        <button
                                            onClick={(e) => deleteHistoryItem(record.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all"
                                            title="Delete this scan"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-gray-300 text-xs line-clamp-2">
                                        {typeof record.result.observation === 'object'
                                            ? "Detailed Analysis Data"
                                            : (record.result.observation || "Data Error")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center Reticle */}
            <div className={`z-20 relative size-64 border-2 border-white/20 rounded-lg flex items-center justify-center transition-all duration-500`}>
                <div className={`absolute top-0 left-0 size-4 border-t-2 border-l-2 ${theme.border} -mt-1 -ml-1 transition-colors duration-500`} />
                <div className={`absolute top-0 right-0 size-4 border-t-2 border-r-2 ${theme.border} -mt-1 -mr-1 transition-colors duration-500`} />
                <div className={`absolute bottom-0 left-0 size-4 border-b-2 border-l-2 ${theme.border} -mb-1 -ml-1 transition-colors duration-500`} />
                <div className={`absolute bottom-0 right-0 size-4 border-b-2 border-r-2 ${theme.border} -mb-1 -mr-1 transition-colors duration-500`} />

                {analyzing && (
                    <motion.div
                        className={`absolute w-full h-1 ${theme.bg} opacity-50 shadow-[0_0_10px_white]`}
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                )}

                {!analyzing && (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`size-2 rounded-full shadow-lg ${theme.bg}`}
                    />
                )}
            </div>

            {/* Mode Toggles */}
            <div className="absolute bottom-10 left-10 z-20 flex gap-2 pointer-events-auto">
                <button
                    onClick={() => setMode('detect')}
                    className={clsx(
                        "px-4 py-2 rounded-full border border-white/10 backdrop-blur-md text-xs font-bold uppercase transition-all",
                        mode === 'detect' ? "bg-white text-black" : "bg-black/60 text-white hover:bg-white/10"
                    )}
                >
                    <Activity className="size-4 inline mr-2" /> Detect
                </button>
                <button
                    onClick={() => setMode('reason')}
                    className={clsx(
                        "px-4 py-2 rounded-full border border-white/10 backdrop-blur-md text-xs font-bold uppercase transition-all",
                        mode === 'reason' ? `${theme.bg} text-white shadow-lg` : "bg-black/60 text-white hover:bg-white/10"
                    )}
                >
                    <BrainCircuit className="size-4 inline mr-2" /> Insight
                </button>
            </div>

            {/* Trigger Button */}
            <div className="absolute bottom-10 z-30 pointer-events-auto">
                <button
                    onClick={captureAndAnalyze}
                    disabled={analyzing}
                    className="group relative size-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:bg-white/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className={clsx(
                        "size-14 rounded-full transition-all duration-500",
                        analyzing ? "bg-red-500 animate-pulse" : `${theme.bg} group-hover:shadow-[0_0_30px_white]`
                    )} />
                    <Camera className="absolute text-white size-8" />
                </button>
            </div>

            {/* Analyzing Overlay (Inline) */}
            <AnimatePresence>
                {analyzing && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
                    >
                        {/* Animated Background Grid */}
                        <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-20 animate-pulse pointer-events-none" />

                        {/* Scanning Lines Effect */}
                        <motion.div
                            className={`absolute w-full h-1 ${theme.bg} opacity-50 shadow-[0_0_20px_rgba(0,255,255,0.5)]`}
                            animate={{ top: ['0%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative z-10 flex flex-col items-center gap-8">
                            {/* Animated Icon */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 180, 360]
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className={`relative`}
                            >
                                <div className={`absolute inset-0 rounded-full ${theme.bg} opacity-20 blur-xl`} />
                                <BrainCircuit className={`${theme.text} size-20 relative z-10`} />
                            </motion.div>

                            {/* Status Text */}
                            <div className="space-y-4">
                                <motion.h1
                                    className="text-4xl font-black tracking-tighter text-white"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    ANALYZING...
                                </motion.h1>

                                <div className="space-y-2">
                                    <motion.p
                                        className="text-gray-400 text-sm font-mono"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <Camera className="inline mr-2 size-4" />
                                        Processing visual data
                                    </motion.p>
                                    <motion.p
                                        className="text-gray-400 text-sm font-mono"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                    >
                                        <BrainCircuit className="inline mr-2 size-4" />
                                        Running neural analysis
                                    </motion.p>
                                    <motion.p
                                        className="text-gray-400 text-sm font-mono"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.5 }}
                                    >
                                        <Zap className="inline mr-2 size-4" />
                                        Generating insights
                                    </motion.p>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mt-8">
                                <motion.div
                                    className={`h-full ${theme.bg} shadow-[0_0_10px_rgba(0,255,255,0.5)]`}
                                    animate={{ width: ['0%', '100%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </div>

                            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mt-4">
                                {activeLens.toUpperCase()} LENS ACTIVE
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
