'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { Camera, Zap, BrainCircuit, Activity, X, Volume2, VolumeX, Clock, ChevronRight, Trash2, Scan, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeScene } from '@/lib/gemini';
import clsx from 'clsx';
import BootSequence from './BootSequence';
import DeepInvestigationPanel from './DeepInvestigationPanel';

interface ScanRecord {
    id: string;
    timestamp: Date;
    lens: string;
    imageSrc: string;
    result: any;
    mode: string;
}

interface DetectedObject {
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
}

export default function ARScanner() {
    const router = useRouter();
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [booted, setBooted] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [mode, setMode] = useState<'reason' | 'detect'>('reason');
    const [activeLens, setActiveLens] = useState<'universal' | 'codex' | 'mechanic' | 'bio'>('universal');
    const [arMode, setArMode] = useState(false); // NEW: AR Mode toggle
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]); // NEW: AR objects
    const [arAnalyzing, setArAnalyzing] = useState(false); // NEW: AR analysis state
    const [showDeepInvestigation, setShowDeepInvestigation] = useState(false); // NEW: Deep Investigation
    const [deepInvestigationImage, setDeepInvestigationImage] = useState<string | null>(null); // NEW
    const [uploadedImage, setUploadedImage] = useState<string | null>(null); // NEW: Uploaded image
    const fileInputRef = useRef<HTMLInputElement>(null); // NEW: File input ref

    // Note: Persist history in localStorage so it survives navigation
    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioEnabled, setAudioEnabled] = useState(true); // Audio toggle state

    // Load history on mount
    useEffect(() => {
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
    useEffect(() => {
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

    // NEW: Start Deep Investigation
    const startDeepInvestigation = () => {
        let imageSrc: string | null = null;

        // Use uploaded image if available, otherwise use webcam
        if (uploadedImage) {
            imageSrc = uploadedImage;
        } else if (webcamRef.current) {
            imageSrc = webcamRef.current.getScreenshot();
        }

        if (!imageSrc) return;

        setDeepInvestigationImage(imageSrc);
        setShowDeepInvestigation(true);
    };

    // NEW: Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setUploadedImage(result);
            setArMode(false); // Disable AR mode when using uploaded image
        };
        reader.readAsDataURL(file);
    };

    // NEW: Trigger file input
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // NEW: Clear uploaded image
    const clearUploadedImage = () => {
        setUploadedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // NEW: AR Mode continuous analysis
    useEffect(() => {
        if (!arMode) {
            setDetectedObjects([]);
            return;
        }

        const analyzeInterval = setInterval(async () => {
            if (!webcamRef.current || arAnalyzing) return;

            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            setArAnalyzing(true);

            try {
                // Special AR detection prompt
                const arPrompt = `Detect all visible objects in this image. For each object, provide:
1. Label (what it is)
2. Approximate position as percentage (x, y, width, height where 0-100)

Return ONLY a JSON array like:
[{"label": "laptop", "x": 20, "y": 30, "width": 40, "height": 35, "confidence": 0.9}]`;

                const response = await analyzeScene(imageSrc, arPrompt, 'detect', activeLens);

                // Parse AR detection results
                const match = response.match(/(\[[\s\S]*\])/);
                if (match) {
                    try {
                        const objects = JSON.parse(match[0]);
                        setDetectedObjects(objects);
                    } catch (e) {
                        console.warn("Failed to parse AR objects:", e);
                    }
                }
            } catch (err) {
                console.error("AR analysis error:", err);
            } finally {
                setArAnalyzing(false);
            }
        }, 3000); // Analyze every 3 seconds

        return () => clearInterval(analyzeInterval);
    }, [arMode, activeLens, arAnalyzing]);

    // NEW: Draw AR overlays on canvas
    useEffect(() => {
        if (!arMode || !canvasRef.current || !webcamRef.current) return;

        const canvas = canvasRef.current;
        const video = webcamRef.current.video;
        if (!video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding boxes
        detectedObjects.forEach(obj => {
            const x = (obj.x / 100) * canvas.width;
            const y = (obj.y / 100) * canvas.height;
            const w = (obj.width / 100) * canvas.width;
            const h = (obj.height / 100) * canvas.height;

            // Draw box
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            // Draw label background
            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            const labelHeight = 25;
            ctx.fillRect(x, y - labelHeight, w, labelHeight);

            // Draw label text
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(obj.label.toUpperCase(), x + 5, y - 7);

            // Draw confidence if available
            if (obj.confidence) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.fillText(`${Math.round(obj.confidence * 100)}%`, x + w - 35, y - 7);
            }
        });
    }, [detectedObjects, arMode]);

    const captureAndAnalyze = useCallback(async () => {
        let imageSrc: string | null = null;

        // Use uploaded image if available, otherwise use webcam
        if (uploadedImage) {
            imageSrc = uploadedImage;
        } else if (webcamRef.current) {
            imageSrc = webcamRef.current.getScreenshot();
        }

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
            let finalResult: any = { observation: response, reasoning: "Raw output", suggestion: "N/A" };

            try {
                // 1. Cleaner: Remove Markdown code blocks (```json ... ```)
                let cleanResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();

                // 2. Extractor: Find the first '{' and last '}' to handle preamble text
                const firstOpen = cleanResponse.indexOf('{');
                const lastClose = cleanResponse.lastIndexOf('}');

                if (firstOpen !== -1 && lastClose !== -1) {
                    cleanResponse = cleanResponse.substring(firstOpen, lastClose + 1);

                    const parsed = JSON.parse(cleanResponse);

                    if (Array.isArray(parsed)) {
                        finalResult = { detectionList: parsed, observation: "Scan Complete. Multiple targets identified." };
                    } else {
                        finalResult = parsed;
                    }
                }
            } catch (e) {
                console.warn("Failed to parse JSON from response:", e);
                // Fallback: If parse fails, still try to structure it somewhat if possible, 
                // but for now keeping Raw Output is safer than crashing.
                // We'll leave finalResult as the raw response text so the user at least sees the content.
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

            // Save to Session & Redirect to RESULT
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
    }, [mode, activeLens, audioEnabled, router, uploadedImage]);

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

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            <AnimatePresence>
                {!booted && <BootSequence onComplete={() => setBooted(true)} />}
            </AnimatePresence>

            {/* Background - Webcam or Uploaded Image */}
            <div className="absolute inset-0 z-0">
                {uploadedImage ? (
                    // Show uploaded image
                    <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-full h-full object-contain opacity-60"
                    />
                ) : (
                    // Show webcam
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover opacity-60"
                        videoConstraints={{ facingMode: "environment" }}
                    />
                )}
                {/* AR Canvas Overlay */}
                {arMode && !uploadedImage && (
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ mixBlendMode: 'screen' }}
                    />
                )}
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
                            AURA {arMode && <span className={`${theme.text} text-2xl`}>// AR</span>}
                            {uploadedImage && <span className="text-blue-400 text-2xl"> // FILE</span>}
                        </h1>
                        <span className={`text-xs font-mono ${theme.text} opacity-80 tracking-[0.2em] uppercase`}>
                            Lens // {currentTheme.label} {uploadedImage && "• Uploaded Image"}
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

            {/* Mission Log Sidebar - keeping existing code */}
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

                {!analyzing && !arMode && (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`size-2 rounded-full shadow-lg ${theme.bg}`}
                    />
                )}

                {arMode && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className={`${theme.text}`}
                    >
                        <Eye size={32} />
                    </motion.div>
                )}
            </div>

            {/* Mode Toggles */}
            <div className="absolute bottom-10 left-10 z-20 flex gap-2 pointer-events-auto">
                {/* Deep Investigation - MARATHON AGENT */}
                <button
                    onClick={startDeepInvestigation}
                    className="px-4 py-2 rounded-full border-2 border-purple-500/50 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md text-xs font-bold uppercase transition-all hover:shadow-lg hover:shadow-purple-500/50 text-white"
                >
                    <Sparkles className="size-4 inline mr-2 animate-pulse" /> Deep Investigation
                </button>

                {/* AR Mode Toggle */}
                <button
                    onClick={() => setArMode(!arMode)}
                    className={clsx(
                        "px-4 py-2 rounded-full border backdrop-blur-md text-xs font-bold uppercase transition-all",
                        arMode ? `${theme.bg} text-white shadow-lg border-white/30` : "bg-black/60 text-white border-white/10 hover:bg-white/10"
                    )}
                >
                    <Scan className="size-4 inline mr-2" /> AR Mode
                </button>

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
                    disabled={analyzing || arMode}
                    className="group relative size-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:bg-white/20 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className={clsx(
                        "size-14 rounded-full transition-all duration-500",
                        analyzing ? "bg-red-500 animate-pulse" : `${theme.bg} group-hover:shadow-[0_0_30px_white]`
                    )} />
                    <Camera className="absolute text-white size-8" />
                </button>
                {arMode && (
                    <p className="text-center text-xs text-gray-400 mt-2 font-mono">
                        AR MODE ACTIVE
                    </p>
                )}
            </div>

            {/* Upload / Clear Image Buttons */}
            <div className="absolute bottom-10 right-10 z-30 flex gap-2 pointer-events-auto">
                {uploadedImage ? (
                    <button
                        onClick={clearUploadedImage}
                        className="px-4 py-2 rounded-full border-2 border-red-500/50 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-md text-xs font-bold uppercase transition-all hover:shadow-lg hover:shadow-red-500/50 text-white"
                    >
                        <X className="size-4 inline mr-2" /> Clear Image
                    </button>
                ) : (
                    <button
                        onClick={triggerFileUpload}
                        className="px-4 py-2 rounded-full border-2 border-blue-500/50 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-md text-xs font-bold uppercase transition-all hover:shadow-lg hover:shadow-blue-500/50 text-white"
                    >
                        <Camera className="size-4 inline mr-2" /> Upload Image
                    </button>
                )}
            </div>

            {/* AR Status Indicator */}
            {arMode && (
                <div className="absolute top-24 left-6 z-30 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`size-2 rounded-full ${arAnalyzing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                            <span className="text-xs font-mono text-white uppercase">
                                {arAnalyzing ? 'Analyzing...' : 'Tracking'}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                            Objects: {detectedObjects.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Deep Investigation Panel */}
            {showDeepInvestigation && deepInvestigationImage && (
                <DeepInvestigationPanel
                    imageSrc={deepInvestigationImage}
                    lens={activeLens}
                    onClose={() => {
                        setShowDeepInvestigation(false);
                        setDeepInvestigationImage(null);
                    }}
                />
            )}

        </div>
    );
}
