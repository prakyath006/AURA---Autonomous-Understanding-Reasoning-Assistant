'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, Search, FileText, Target, Clock, TrendingUp, X } from 'lucide-react';
import { DeepInvestigator, InvestigationStep, InvestigationReport } from '@/lib/deepInvestigation';

interface DeepInvestigationPanelProps {
    imageSrc: string;
    lens: 'universal' | 'codex' | 'mechanic' | 'bio';
    onClose: () => void;
}

const stepIcons = {
    scan: Search,
    analyze: Brain,
    verify: CheckCircle,
    research: FileText,
    conclude: Target
};

const stepLabels = {
    scan: 'Initial Scan',
    analyze: 'Deep Analysis',
    verify: 'Verification',
    research: 'Research',
    conclude: 'Conclusion'
};

export default function DeepInvestigationPanel({ imageSrc, lens, onClose }: DeepInvestigationPanelProps) {
    const [investigating, setInvestigating] = useState(false);
    const [currentStep, setCurrentStep] = useState<InvestigationStep | null>(null);
    const [report, setReport] = useState<InvestigationReport | null>(null);
    const [allSteps, setAllSteps] = useState<InvestigationStep[]>([]);

    const startInvestigation = async () => {
        setInvestigating(true);
        setAllSteps([]);
        setReport(null);

        const investigator = new DeepInvestigator(
            imageSrc,
            lens,
            (step) => {
                setCurrentStep(step);
                setAllSteps(prev => [...prev, step]);
            }
        );

        const finalReport = await investigator.investigate();
        setReport(finalReport);
        setInvestigating(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-4xl bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-cyan-500/20 rounded-lg">
                                <Brain className="text-cyan-400" size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">
                                    DEEP INVESTIGATION MODE
                                </h2>
                                <p className="text-sm text-cyan-300/70 font-mono">
                                    Multi-Step Autonomous Reasoning Engine
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="text-gray-400 hover:text-white" size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {!investigating && !report && (
                        <div className="text-center py-12">
                            <div className="mb-6">
                                <img
                                    src={imageSrc}
                                    className="w-64 h-64 object-cover rounded-lg mx-auto border-2 border-cyan-500/30"
                                    alt="Investigation target"
                                />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Ready to Begin Deep Investigation
                            </h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                This autonomous agent will perform a 5-step analysis chain with self-verification and temporal reasoning.
                            </p>
                            <button
                                onClick={startInvestigation}
                                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                            >
                                <Brain className="inline mr-2" size={20} />
                                START INVESTIGATION
                            </button>
                        </div>
                    )}

                    {investigating && (
                        <div className="space-y-6">
                            {/* Progress Steps */}
                            <div className="grid grid-cols-5 gap-2 mb-8">
                                {(['scan', 'analyze', 'verify', 'research', 'conclude'] as const).map((stepType, idx) => {
                                    const Icon = stepIcons[stepType];
                                    const completed = allSteps.some(s => s.type === stepType);
                                    const active = currentStep?.type === stepType;

                                    return (
                                        <div
                                            key={stepType}
                                            className={`p-3 rounded-lg border-2 transition-all ${active
                                                    ? 'border-cyan-500 bg-cyan-500/20'
                                                    : completed
                                                        ? 'border-green-500/50 bg-green-500/10'
                                                        : 'border-gray-700 bg-gray-800/50'
                                                }`}
                                        >
                                            <Icon
                                                className={`mx-auto mb-2 ${active ? 'text-cyan-400 animate-pulse' :
                                                        completed ? 'text-green-400' :
                                                            'text-gray-600'
                                                    }`}
                                                size={24}
                                            />
                                            <p className={`text-xs text-center font-mono ${active || completed ? 'text-white' : 'text-gray-500'
                                                }`}>
                                                {stepLabels[stepType]}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Current Step Details */}
                            {currentStep && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-cyan-500/20 rounded">
                                            {React.createElement(stepIcons[currentStep.type], {
                                                className: 'text-cyan-400',
                                                size: 20
                                            })}
                                        </div>
                                        <h4 className="text-lg font-bold text-white">
                                            {stepLabels[currentStep.type]}
                                        </h4>
                                        <div className="ml-auto flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" />
                                            <span className="text-sm text-gray-400 font-mono">
                                                {currentStep.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-black/30 rounded p-4 border border-gray-700">
                                        <p className="text-sm text-gray-300 font-mono leading-relaxed">
                                            {currentStep.result.substring(0, 500)}
                                            {currentStep.result.length > 500 && '...'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Processing Indicator */}
                            <div className="flex items-center justify-center gap-3 text-cyan-400">
                                <TrendingUp className="animate-pulse" size={20} />
                                <span className="text-sm font-mono">Processing autonomous reasoning chain...</span>
                            </div>
                        </div>
                    )}

                    {report && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-4">
                                    <div className="text-3xl font-black text-green-400 mb-1">
                                        {report.confidence}%
                                    </div>
                                    <div className="text-xs text-green-300/70 font-mono uppercase">
                                        Confidence
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                                    <div className="text-3xl font-black text-blue-400 mb-1">
                                        {report.steps.length}
                                    </div>
                                    <div className="text-xs text-blue-300/70 font-mono uppercase">
                                        Steps Completed
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                                    <div className="text-3xl font-black text-purple-400 mb-1">
                                        {Math.round(report.duration / 1000)}s
                                    </div>
                                    <div className="text-xs text-purple-300/70 font-mono uppercase">
                                        Duration
                                    </div>
                                </div>
                            </div>

                            {/* Findings */}
                            <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Target className="text-cyan-400" size={20} />
                                    Key Findings
                                </h3>
                                <ul className="space-y-2">
                                    {report.findings.map((finding, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <CheckCircle className="text-green-400 mt-1 flex-shrink-0" size={16} />
                                            <span className="text-gray-300 text-sm">{finding}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="text-blue-400" size={20} />
                                    Recommendations
                                </h3>
                                <ol className="space-y-3">
                                    {report.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="bg-blue-500/20 text-blue-400 font-bold rounded-full size-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <span className="text-gray-300 text-sm">{rec}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* All Steps Accordion */}
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-4">
                                    Complete Investigation Chain
                                </h3>
                                <div className="space-y-3">
                                    {report.steps.map((step, idx) => (
                                        <details key={step.id} className="group">
                                            <summary className="cursor-pointer bg-gray-900/50 hover:bg-gray-900 p-3 rounded-lg border border-gray-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {React.createElement(stepIcons[step.type], {
                                                        className: 'text-cyan-400',
                                                        size: 16
                                                    })}
                                                    <span className="font-mono text-sm text-white">
                                                        Step {idx + 1}: {stepLabels[step.type]}
                                                    </span>
                                                    <span className="ml-auto text-xs text-gray-500">
                                                        {step.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </summary>
                                            <div className="mt-2 p-4 bg-black/30 rounded border border-gray-700">
                                                <p className="text-xs text-gray-400 font-mono mb-2">Prompt:</p>
                                                <p className="text-xs text-gray-500 mb-4 font-mono">
                                                    {step.prompt.substring(0, 200)}...
                                                </p>
                                                <p className="text-xs text-gray-400 font-mono mb-2">Result:</p>
                                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                                    {step.result}
                                                </p>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={startInvestigation}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                                >
                                    Run Again
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
