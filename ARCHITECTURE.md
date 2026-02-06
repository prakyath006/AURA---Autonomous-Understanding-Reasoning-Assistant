# 🏗️ AURA - SYSTEM ARCHITECTURE

## 📐 **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                     (Next.js 16 + React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Scanner    │  │ Deep Invest  │  │    Result    │          │
│  │  Component   │  │    Panel     │  │    Page      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
├────────────────────────────┼──────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                          │
│                            │                                      │
│         ┌──────────────────┴──────────────────┐                 │
│         │                                      │                 │
│  ┌──────▼───────┐                  ┌──────────▼─────────┐       │
│  │   Gemini     │                  │  Deep Investigation│       │
│  │   API Client │                  │      Engine        │       │
│  │              │                  │                    │       │
│  │ • Model      │                  │ • 5-Step Chain    │       │
│  │   Selection  │                  │ • Self-Verify     │       │
│  │ • Retry      │                  │ • Temporal        │       │
│  │   Logic      │                  │   Analysis        │       │
│  │ • Error      │                  │                    │       │
│  │   Handling   │                  │                    │       │
│  └──────┬───────┘                  └──────────┬─────────┘       │
│         │                                      │                 │
├─────────┼──────────────────────────────────────┼─────────────────┤
│         │          EXTERNAL SERVICES           │                 │
│         │                                      │                 │
│  ┌──────▼──────────────────────────────────────▼─────────┐      │
│  │         Google Gemini 3 API                           │      │
│  │                                                        │      │
│  │  • gemini-3-pro-preview     (Primary)                │      │
│  │  • gemini-3-flash-preview   (Backup)                 │      │
│  │  • gemini-2.5-flash         (Fallback)               │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                      DATA PERSISTENCE                             │
│                                                                   │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │ LocalStorage │              │SessionStorage│                 │
│  │              │              │              │                 │
│  │ • History    │              │ • Current    │                 │
│  │ • Audio Pref │              │   Analysis   │                 │
│  └──────────────┘              │ • Navigation │                 │
│                                 └──────────────┘                 │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Data Flow Diagrams**

### **1. Single-Shot Analysis Flow**

```
┌─────────┐
│  USER   │
│ Clicks  │
│ Capture │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  ARScanner      │
│  Component      │
│                 │
│ 1. Capture      │
│    image from   │
│    webcam/file  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Redirect to     │
│ /analyzing      │
│ (Loading Page)  │
└────┬────────────┘
     │
     ▼
┌─────────────────────────┐
│  Gemini API Client      │
│                         │
│ 1. Try gemini-3-pro     │
│ 2. Retry if fails       │
│ 3. Try gemini-3-flash   │
│ 4. Fallback to 2.5      │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Parse Response         │
│                         │
│ • Extract JSON          │
│ • Format results        │
│ • Generate audio        │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Store in History       │
│  (LocalStorage)         │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Redirect to /result    │
│  (Show Analysis)        │
└─────────────────────────┘
```

---

### **2. Deep Investigation Flow** (Marathon Agent)

```
┌─────────┐
│  USER   │
│ Clicks  │
│  Deep   │
│  Invest │
└────┬────┘
     │
     ▼
┌──────────────────────────┐
│ DeepInvestigator Class   │
│                          │
│ investigate() method     │
└────┬─────────────────────┘
     │
     ├──► STEP 1: Initial Scan
     │    ├─► Gemini API Call
     │    └─► Store result
     │
     ├──► STEP 2: Deep Analysis
     │    ├─► Use Step 1 result
     │    ├─► Ask "WHY?"
     │    ├─► Gemini API Call
     │    └─► Store result
     │
     ├──► STEP 3: Verification
     │    ├─► Review Steps 1-2
     │    ├─► Self-check
     │    ├─► Gemini API Call
     │    └─► Store confidence
     │
     ├──► STEP 4: Research
     │    ├─► Broader context
     │    ├─► Best practices
     │    ├─► Gemini API Call
     │    └─► Store insights
     │
     └──► STEP 5: Conclusion
          ├─► Synthesize all steps
          ├─► Gemini API Call
          ├─► Parse JSON
          └─► Generate report
               │
               ▼
          ┌─────────────────┐
          │ Final Report    │
          │                 │
          │ • Findings      │
          │ • Recommend.    │
          │ • Confidence    │
          │ • Duration      │
          └─────────────────┘
```

---

### **3. AR Overlay Flow** (Real-Time)

```
┌─────────┐
│  USER   │
│ Enables │
│ AR Mode │
└────┬────┘
     │
     ▼
┌──────────────────────────┐
│  Start Interval Timer    │
│  (Every 3 seconds)       │
└────┬─────────────────────┘
     │
     │  ┌─────────────────────┐
     └─►│ Capture Frame       │
        └────┬────────────────┘
             │
             ▼
        ┌─────────────────────┐
        │ Gemini API Call     │
        │ (Object Detection)  │
        └────┬────────────────┘
             │
             ▼
        ┌─────────────────────┐
        │ Parse Objects       │
        │ [{label, x, y, w}]  │
        └────┬────────────────┘
             │
             ▼
        ┌─────────────────────┐
        │ Draw on Canvas      │
        │                     │
        │ • Bounding boxes    │
        │ • Labels            │
        │ • Confidence        │
        └────┬────────────────┘
             │
             ▼
        ┌─────────────────────┐
        │ Update UI           │
        │ (Live Overlay)      │
        └────┬────────────────┘
             │
             │ Wait 3 seconds
             │
             └─────► (Loop back)
```

---

## 🧩 **Component Architecture**

### **Component Hierarchy**

```
App (Next.js)
│
├── page.tsx (/)
│   └── ARScanner
│       ├── BootSequence
│       ├── Webcam (react-webcam)
│       ├── Canvas (AR Overlay)
│       ├── DeepInvestigationPanel
│       │   └── Progress Tracker
│       └── Mission Log Sidebar
│
├── analyzing/page.tsx
│   └── Loading Animation
│
└── result/page.tsx
    └── Analysis Card
        ├── Observation
        ├── Reasoning
        └── Suggestions
```

---

### **Key Components**

#### **1. ARScanner** (`src/components/ARScanner.tsx`)
**Purpose**: Main interface for capturing and analyzing images

**State Management:**
```typescript
// Input sources
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const webcamRef = useRef<Webcam>(null);

// Analysis modes
const [mode, setMode] = useState<'reason' | 'detect'>('reason');
const [activeLens, setActiveLens] = useState<'universal' | ...>('universal');
const [arMode, setArMode] = useState(false);

// Investigation
const [showDeepInvestigation, setShowDeepInvestigation] = useState(false);

// History
const [history, setHistory] = useState<ScanRecord[]>([]);
```

**Key Functions:**
- `captureAndAnalyze()` - Single-shot analysis
- `startDeepInvestigation()` - Launch Marathon Agent
- `handleFileUpload()` - Process uploaded images
- `toggleAudio()` - Control audio output

---

#### **2. DeepInvestigationPanel** (`src/components/DeepInvestigationPanel.tsx`)
**Purpose**: UI for multi-step autonomous reasoning

**Features:**
- 5-step progress tracker
- Real-time step updates
- Comprehensive final report
- Expandable step details

**State:**
```typescript
const [investigating, setInvestigating] = useState(false);
const [currentStep, setCurrentStep] = useState<InvestigationStep | null>(null);
const [report, setReport] = useState<InvestigationReport | null>(null);
const [allSteps, setAllSteps] = useState<InvestigationStep[]>([]);
```

---

## 🔧 **Core Libraries**

### **Business Logic**

#### **1. Gemini API Client** (`src/lib/gemini.ts`)

**Purpose**: Interface with Google Gemini 3 API

**Key Features:**
```typescript
// Model selection with fallback
const CANDIDATE_MODELS = [
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash"
];

// Retry logic
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
        const result = await model.generateContent(...);
        return result;
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            await delay(RATE_LIMIT_DELAY);
            continue;
        }
        // Try next model
    }
}
```

**Functions:**
- `analyzeScene()` - Main analysis function
- `getPromptForLens()` - Lens-specific prompts
- Error handling & retry logic

---

#### **2. Deep Investigation Engine** (`src/lib/deepInvestigation.ts`)

**Purpose**: Multi-step autonomous reasoning

**Classes:**

**DeepInvestigator:**
```typescript
class DeepInvestigator {
    async investigate(): Promise<InvestigationReport> {
        await this.performStep('scan', ...);
        await this.performStep('analyze', ...);
        await this.performStep('verify', ...);
        await this.performStep('research', ...);
        await this.performStep('conclude', ...);
        
        return comprehensiveReport;
    }
}
```

**TemporalAnalyzer:**
```typescript
class TemporalAnalyzer {
    async analyzeSequence(frames: string[]) {
        // Analyze each frame
        // Understand changes
        // Identify cause & effect
        // Predict next state
    }
}
```

---

## 💾 **Data Models**

### **ScanRecord**
```typescript
interface ScanRecord {
    id: string;              // Unique identifier
    timestamp: Date;         // When captured
    lens: string;            // Which lens used
    imageSrc: string;        // Base64 image
    result: any;             // Analysis result
    mode: string;            // 'reason' or 'detect'
}
```

### **InvestigationStep**
```typescript
interface InvestigationStep {
    id: string;
    type: 'scan' | 'analyze' | 'verify' | 'research' | 'conclude';
    prompt: string;
    result: string;
    timestamp: Date;
    confidence?: number;
}
```

### **InvestigationReport**
```typescript
interface InvestigationReport {
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
```

---

## 🔐 **Security & Privacy**

### **API Key Management**
```
.env.local (NOT committed to git)
├── NEXT_PUBLIC_GEMINI_API_KEY=xxx
└── (Loaded at runtime)
```

### **Data Storage**
- **LocalStorage**: Client-side only, no server transmission
- **SessionStorage**: Temporary, cleared on tab close
- **No Backend**: All processing client-side

### **Privacy**
- Images never uploaded to our servers
- Direct API calls to Google only
- User controls all data

---

## 🚀 **Deployment Architecture**

```
┌─────────────────────────────────────────┐
│         Vercel / Netlify                │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Next.js Application           │ │
│  │                                   │ │
│  │  • Static pages pre-rendered     │ │
│  │  • Client-side hydration         │ │
│  │  • API routes (if needed)        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  │
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────┐
│      Google Gemini 3 API                │
│      (generativelanguage.googleapis.com)│
└─────────────────────────────────────────┘
```

---

## 📊 **Performance Characteristics**

### **Latency**
- **Single Analysis**: 3-5 seconds
- **Deep Investigation**: 15-30 seconds (5 API calls)
- **AR Mode**: 3-second intervals

### **Scalability**
- **Client-side processing**: Scales with users
- **API rate limits**: Handled with retry logic
- **No server costs**: Serverless architecture

### **Optimization**
- **Code splitting**: Next.js automatic
- **Lazy loading**: Components load on demand
- **Caching**: LocalStorage for history

---

## 🎯 **Technology Stack Summary**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 | React framework, routing |
| **Language** | TypeScript | Type safety, better DX |
| **UI** | React 18 | Component-based UI |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Animation** | Framer Motion | Smooth transitions |
| **Webcam** | react-webcam | Camera access |
| **AI** | Gemini 3 API | Vision + reasoning |
| **State** | React Hooks | Local state management |
| **Storage** | Web Storage API | Persistence |

---

## ✅ **Architecture Highlights**

### **Strengths:**
1. ✅ **Clean Separation**: UI, logic, and API layers
2. ✅ **Type Safety**: TypeScript throughout
3. ✅ **Error Resilience**: Retry logic, fallbacks
4. ✅ **Performance**: Client-side, no server bottleneck
5. ✅ **Scalability**: Serverless, scales automatically
6. ✅ **Maintainability**: Modular, well-documented

### **Design Patterns:**
- **Strategy Pattern**: Lens-specific prompts
- **Chain of Responsibility**: Model fallback chain
- **Observer Pattern**: Real-time AR updates
- **Factory Pattern**: Investigation step creation

---

## 🎉 **Summary**

AURA's architecture is:
- ✅ **Modern**: Next.js 16, TypeScript, React 18
- ✅ **Scalable**: Serverless, client-side processing
- ✅ **Resilient**: Error handling, retry logic
- ✅ **Maintainable**: Clean code, good separation
- ✅ **Performant**: Optimized, lazy loading
- ✅ **Secure**: No backend, client-side only

**This is production-ready architecture!** 🏗️
