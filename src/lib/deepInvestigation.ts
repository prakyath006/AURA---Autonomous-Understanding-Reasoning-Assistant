/**
 * AURA - Deep Investigation Engine
 * 
 * Multi-step autonomous reasoning system for the "Action Era"
 * Implements Marathon Agent pattern with self-correction and verification
 */

import { analyzeScene } from './gemini';

export interface InvestigationStep {
    id: string;
    type: 'scan' | 'analyze' | 'verify' | 'research' | 'conclude';
    prompt: string;
    result: string;
    timestamp: Date;
    confidence?: number;
}

export interface InvestigationReport {
    id: string;
    imageSrc: string;
    lens: string;
    steps: InvestigationStep[];
    findings: string[];
    recommendations: string[];
    confidence: number;
    duration: number;
    status: 'running' | 'completed' | 'failed';
}

/**
 * Deep Investigation Mode - Marathon Agent
 * 
 * This autonomous system performs multi-step reasoning:
 * 1. Initial Scan - What do we see?
 * 2. Deep Analysis - Why is it this way?
 * 3. Verification - Are we correct?
 * 4. Research - What else should we know?
 * 5. Conclusion - What should be done?
 */
export class DeepInvestigator {
    private steps: InvestigationStep[] = [];
    private startTime: number = 0;

    constructor(
        private imageSrc: string,
        private lens: 'universal' | 'codex' | 'mechanic' | 'bio',
        private onProgress?: (step: InvestigationStep) => void
    ) { }

    /**
     * Run the complete investigation
     */
    async investigate(): Promise<InvestigationReport> {
        this.startTime = Date.now();
        this.steps = [];

        try {
            // Step 1: Initial Scan
            await this.performStep('scan',
                'Perform an initial scan. Identify all visible objects, their states, and any anomalies. Be specific and detailed.'
            );

            // Step 2: Deep Analysis - Ask "Why?"
            const scanResult = this.steps[0].result;
            await this.performStep('analyze',
                `Based on this initial observation: "${scanResult.substring(0, 200)}..."
                
                Now perform deep analysis:
                1. WHY are things in this state?
                2. What CAUSED this situation?
                3. What are the IMPLICATIONS?
                4. What PATTERNS do you see?
                
                Think step-by-step and explain your reasoning.`
            );

            // Step 3: Verification - Self-Check
            await this.performStep('verify',
                `Review your previous analysis. 
                
                Self-verification checklist:
                1. Did I miss any important details?
                2. Are my conclusions logically sound?
                3. What assumptions did I make?
                4. What alternative explanations exist?
                
                Provide a confidence score (0-100) and list any corrections needed.`
            );

            // Step 4: Research - Broader Context
            await this.performStep('research',
                `Now think about the broader context:
                
                1. What additional information would be helpful?
                2. What are the best practices for this situation?
                3. What are common mistakes people make here?
                4. What expert knowledge applies?
                
                Synthesize this into actionable insights.`
            );

            // Step 5: Final Conclusion
            await this.performStep('conclude',
                `Based on all previous steps, provide:
                
                1. SUMMARY: Key findings (3-5 bullet points)
                2. RECOMMENDATIONS: Specific action steps (prioritized)
                3. CONFIDENCE: Overall confidence in this analysis (0-100)
                4. NEXT STEPS: What should happen next?
                
                Format as JSON:
                {
                    "findings": ["finding1", "finding2", ...],
                    "recommendations": ["rec1", "rec2", ...],
                    "confidence": 85,
                    "nextSteps": ["step1", "step2", ...]
                }`
            );

            // Parse final conclusion
            const conclusion = this.parseConclusion(this.steps[4].result);

            return {
                id: Date.now().toString(),
                imageSrc: this.imageSrc,
                lens: this.lens,
                steps: this.steps,
                findings: conclusion.findings,
                recommendations: conclusion.recommendations,
                confidence: conclusion.confidence,
                duration: Date.now() - this.startTime,
                status: 'completed'
            };

        } catch (error) {
            console.error('Investigation failed:', error);
            return {
                id: Date.now().toString(),
                imageSrc: this.imageSrc,
                lens: this.lens,
                steps: this.steps,
                findings: ['Investigation failed'],
                recommendations: ['Retry analysis'],
                confidence: 0,
                duration: Date.now() - this.startTime,
                status: 'failed'
            };
        }
    }

    /**
     * Perform a single investigation step
     */
    private async performStep(
        type: InvestigationStep['type'],
        prompt: string
    ): Promise<void> {
        console.log(`🔍 Investigation Step: ${type.toUpperCase()}`);

        const result = await analyzeScene(
            this.imageSrc,
            prompt,
            'reason',
            this.lens
        );

        const step: InvestigationStep = {
            id: `${type}-${Date.now()}`,
            type,
            prompt,
            result,
            timestamp: new Date()
        };

        this.steps.push(step);

        if (this.onProgress) {
            this.onProgress(step);
        }
    }

    /**
     * Parse the final conclusion JSON
     */
    private parseConclusion(text: string): {
        findings: string[];
        recommendations: string[];
        confidence: number;
        nextSteps: string[];
    } {
        try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                return {
                    findings: parsed.findings || [],
                    recommendations: parsed.recommendations || [],
                    confidence: parsed.confidence || 50,
                    nextSteps: parsed.nextSteps || []
                };
            }
        } catch (e) {
            console.warn('Failed to parse conclusion:', e);
        }

        // Fallback parsing
        return {
            findings: ['Analysis completed'],
            recommendations: ['Review results'],
            confidence: 50,
            nextSteps: ['Take action based on findings']
        };
    }
}

/**
 * Temporal Analysis - Understand changes over time
 * 
 * Analyzes multiple frames to understand cause & effect
 */
export class TemporalAnalyzer {
    constructor(
        private frames: string[], // Array of base64 images
        private lens: 'universal' | 'codex' | 'mechanic' | 'bio'
    ) { }

    /**
     * Analyze sequence of frames to understand temporal patterns
     */
    async analyzeSequence(): Promise<{
        changes: string[];
        causality: string;
        prediction: string;
    }> {
        if (this.frames.length < 2) {
            throw new Error('Need at least 2 frames for temporal analysis');
        }

        // Analyze each frame
        const frameAnalyses: string[] = [];
        for (let i = 0; i < this.frames.length; i++) {
            const analysis = await analyzeScene(
                this.frames[i],
                `This is frame ${i + 1} of ${this.frames.length}. Describe what you see in detail.`,
                'reason',
                this.lens
            );
            frameAnalyses.push(analysis);
        }

        // Synthesize temporal understanding
        const synthesis = await analyzeScene(
            this.frames[this.frames.length - 1], // Use last frame as context
            `I've analyzed ${this.frames.length} frames in sequence. Here are the observations:

${frameAnalyses.map((a, i) => `Frame ${i + 1}: ${a.substring(0, 150)}...`).join('\n\n')}

Now perform TEMPORAL ANALYSIS:
1. What CHANGED between frames?
2. What is the CAUSE of these changes?
3. What will likely happen NEXT?
4. What PATTERNS emerge over time?

Return JSON:
{
    "changes": ["change1", "change2", ...],
    "causality": "explanation of cause and effect",
    "prediction": "what will happen next"
}`,
            'reason',
            this.lens
        );

        // Parse result
        try {
            const match = synthesis.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
        } catch (e) {
            console.warn('Failed to parse temporal analysis:', e);
        }

        return {
            changes: ['Unable to detect changes'],
            causality: 'Analysis incomplete',
            prediction: 'Unknown'
        };
    }
}
