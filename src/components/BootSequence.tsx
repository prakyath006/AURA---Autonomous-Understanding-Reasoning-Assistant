'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((s) => s + 1);
        }, 800);

        if (step > 4) {
            clearInterval(timer);
            setTimeout(onComplete, 500);
        }

        return () => clearInterval(timer);
    }, [step, onComplete]);

    const steps = [
        "INITIALIZING_NEURAL_CORE...",
        "CONNECTING_TO_SATELLITE_UPLINK...",
        "CALIBRATING_OPTICAL_SENSORS...",
        "ESTABLISHING_SECURE_HANDSHAKE...",
        "SYSTEM_READY"
    ];

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono"
        >
            <div className="w-64">
                {steps.map((text, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: step >= i ? 1 : 0, x: 0 }}
                        className={`text-xs my-1 ${step === i ? 'text-cyan-400 animate-pulse' : 'text-cyan-900'}`}
                    >
                        {step > i ? `[ OK ] ${text}` : `> ${text}`}
                    </motion.div>
                ))}
            </div>

            <motion.div
                className="mt-8 h-1 bg-cyan-900 w-64 rounded-full overflow-hidden"
            >
                <motion.div
                    className="h-full bg-cyan-400"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min((step / 4) * 100, 100)}%` }}
                />
            </motion.div>
        </motion.div>
    );
}
