'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BrainCircuit, Activity, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ResultPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        // Load data from session storage
        const stored = sessionStorage.getItem('currentAnalysis');
        if (stored) {
            setData(JSON.parse(stored));
        } else {
            router.push('/'); // Go back if no data
        }
    }, [router]);

    // Cleanup: Stop audio when leaving the page
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    if (!data) return <div className="bg-black text-white h-screen flex items-center justify-center">Loading Mission Data...</div>;

    const { imageSrc, result, mode, lens } = data;

    // Theme colors based on lens (matching Scanner)
    const getThemeColor = (l: string) => {
        switch (l) {
            case 'codex': return 'text-green-400 border-green-500 bg-green-500';
            case 'mechanic': return 'text-orange-400 border-orange-500 bg-orange-500';
            case 'bio': return 'text-emerald-400 border-emerald-500 bg-emerald-500';
            default: return 'text-cyan-400 border-cyan-500 bg-cyan-500';
        }
    };

    const colors = getThemeColor(lens);
    const textColor = colors.split(' ')[0];
    const borderColor = colors.split(' ')[1];

    return (
        <div className="min-h-screen bg-black text-white p-6 font-sans relative overflow-hidden">
            {/* Grid Overlay */}
            <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            MISSION REPORT
                        </h1>
                        <span className={`text-xs font-mono ${textColor} opacity-80 uppercase tracking-widest`}>
                            {lens} // {mode} SEQUENCE
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/10">
                    <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Live Link Inactive</span>
                </div>
            </header>

            <main className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto h-[80vh]">

                {/* Left: The Visual Evidence */}
                <div className="flex flex-col gap-2">
                    <div className={`relative rounded-xl overflow-hidden border-2 ${borderColor} shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-gray-900 group`}>
                        <img src={imageSrc} className="w-full h-full object-cover max-h-[70vh]" alt="Scanned Evidence" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />

                        {/* Image HUD */}
                        <div className="absolute bottom-4 left-4 flex flex-col">
                            <span className="text-[10px] text-gray-400 font-mono">CAPTURED AT</span>
                            <span className="text-sm font-bold text-white font-mono">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right: The Analysis Data */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2">

                    {/* Status Card */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <BrainCircuit className={`size-5 ${textColor}`} />
                            <h3 className="font-bold text-sm tracking-widest uppercase">Analysis Core</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {typeof result.observation === 'string' ? result.observation : "See detailed logs below."}
                        </p>
                    </div>

                    {/* Array Results (Detect Mode) */}
                    {result.detectionList && (
                        <div className="space-y-2">
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Detected Entities</span>
                            {result.detectionList.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex flex-col">
                                        <span className={`${textColor} font-bold text-sm`}>{item.item}</span>
                                        <span className="text-[10px] text-gray-500 uppercase">{item.type}</span>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-black/50 text-gray-300 font-mono">
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Standard Results (Reason/Insight Mode) */}
                    {!result.detectionList && result.observation && typeof result.observation !== 'string' && (
                        <div className="space-y-6">

                            {/* Observation Block */}
                            <div>
                                <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Visual Observation</span>
                                <div className="p-4 rounded-lg bg-black/40 border border-white/10 text-gray-200 text-sm">
                                    {Object.entries(result.observation).map(([key, value]) => (
                                        <div key={key} className="mb-2 last:mb-0">
                                            <span className="text-gray-500 uppercase text-xs font-bold mr-2">{key.replace(/_/g, ' ')}:</span>
                                            <span className="text-gray-300">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reasoning Block */}
                            {result.reasoning && (
                                <div>
                                    <span className={`text-xs ${textColor} uppercase tracking-widest block mb-1 flex items-center gap-2`}>
                                        <Zap size={12} /> Neural Reasoning
                                    </span>
                                    <div className={`p-4 rounded-lg bg-${colors.split(' ')[2]}/10 border ${borderColor} border-l-4 text-white text-sm italic`}>
                                        {typeof result.reasoning === 'object' ? (
                                            <div className="flex flex-col gap-2 not-italic">
                                                {Object.entries(result.reasoning).map(([k, v]) => (
                                                    <div key={k}>
                                                        <span className="font-bold opacity-70">{k.replace(/_/g, ' ')}:</span> <span className="opacity-90">{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            `"${result.reasoning}"`
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Suggestion Block */}
                            {result.suggestion && (
                                <div>
                                    <span className="text-xs text-blue-400 uppercase tracking-widest block mb-1 flex items-center gap-2">
                                        <ShieldCheck size={12} /> Tactical Suggestion
                                    </span>
                                    <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30 text-blue-100 text-sm font-medium">
                                        {typeof result.suggestion === 'object' ? JSON.stringify(result.suggestion) : result.suggestion}
                                    </div>
                                </div>
                            )}

                            {/* Fixed Code Block (Codex Only) */}
                            {result.fixed_code && (
                                <div>
                                    <span className="text-xs text-green-400 uppercase tracking-widest block mb-1 flex items-center gap-2">
                                        <BrainCircuit size={12} /> Optimized Code Solution
                                    </span>
                                    <div className="relative group">
                                        <pre className="p-4 rounded-lg bg-gray-950 border border-green-500/30 text-green-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                            {result.fixed_code}
                                        </pre>
                                        <div className="absolute top-2 right-2 text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800 opacity-50">
                                            CODEX_V1
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
