'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Brain, Zap, Eye } from 'lucide-react';

export default function AnalyzingPage() {
    const router = useRouter();
    const [dots, setDots] = useState('');

    useEffect(() => {
        // Animated dots
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        return () => clearInterval(interval);
    }, []);

    // Get lens from session storage for theming
    const [lens, setLens] = useState('universal');
    useEffect(() => {
        const stored = sessionStorage.getItem('analyzing_lens');
        if (stored) {
            setLens(stored);
        }
    }, []);

    const getThemeColor = (l: string) => {
        switch (l) {
            case 'codex': return 'text-green-400 border-green-500';
            case 'mechanic': return 'text-orange-400 border-orange-500';
            case 'bio': return 'text-emerald-400 border-emerald-500';
            default: return 'text-cyan-400 border-cyan-500';
        }
    };

    const theme = getThemeColor(lens);

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-20 animate-pulse" />

            {/* Scanning Lines Effect */}
            <motion.div
                className={`absolute w-full h-1 ${theme.split(' ')[1].replace('border-', 'bg-')} opacity-50 shadow-[0_0_20px_rgba(0,255,255,0.5)]`}
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex flex-col items-center gap-8 px-6">
                {/* Animated Icon */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={`relative`}
                >
                    <div className={`absolute inset-0 rounded-full ${theme.split(' ')[1].replace('border-', 'bg-')} opacity-20 blur-xl`} />
                    <Brain className={`${theme.split(' ')[0]} size-20 relative z-10`} />
                </motion.div>

                {/* Status Text */}
                <div className="text-center space-y-4">
                    <motion.h1
                        className="text-4xl font-black tracking-tighter"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ANALYZING{dots}
                    </motion.h1>

                    <div className="space-y-2">
                        <motion.p
                            className="text-gray-400 text-sm font-mono"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Eye className="inline mr-2 size-4" />
                            Processing visual data
                        </motion.p>
                        <motion.p
                            className="text-gray-400 text-sm font-mono"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Brain className="inline mr-2 size-4" />
                            Running neural analysis
                        </motion.p>
                        <motion.p
                            className="text-gray-400 text-sm font-mono"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                        >
                            <Zap className="inline mr-2 size-4" />
                            Generating insights
                        </motion.p>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${theme.split(' ')[1].replace('border-', 'bg-')} shadow-[0_0_10px_rgba(0,255,255,0.5)]`}
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                    {lens.toUpperCase()} LENS ACTIVE
                </p>
            </div>
        </div>
    );
}
