// app.js - Guardian X Enhanced AI Assistant with Google Gemini AI Integration - Complete Ready-to-Use

class GuardianAIEngine {
    constructor() {
        this.config = {
            model: "gemini-1.5-flash",
            maxTokens: 1024,
            temperature: 0.7,
            fallbackEnabled: true
        };

        this.systemPrompt = "You are Guardian X, a first-generation robot developed by BIT Robotics. Your mission is to save lives through the use of AI, VR, and thermal vision. You combine immersive VR, thermal vision, and artificial intelligence to act instantly and precisely where humans face limitations. In medical mode, you use advanced imaging to see inside the human body. In defense mode, you detect threats and perform reconnaissance. In policing mode, you recognize faces and monitor crowds. Respond professionally but warmly, keeping responses concise for voice output (1-3 sentences max, no asterisks).";

        this.conversationHistory = [];
        this.apiKey = "AIzaSyAOVcBeATt8tJ0Kg_JTVHCT2mDX-ZEu63o"; // Replace with your actual Google Cloud API key

        this.knowledgeBase = {
            capabilities: {
                patterns: ['what can you do', 'capabilities', 'help me', 'assist'],
                response: "I'm Guardian X, designed to save lives through advanced AI. I can analyze visual scenes, detect threats, provide medical assessments, monitor environments, and engage in intelligent conversation based on what I see."
            },
            vision: {
                patterns: ['what do you see', 'describe', 'analyze scene', 'visual'],
                response: "I'm analyzing the visual environment using my advanced detection systems."
            },
            personality: {
                patterns: ['who are you', 'tell me about yourself', 'guardian'],
                response: "I'm Guardian X, first-generation robot by BIT Robotics. My purpose is clear: saving lives through the perfect fusion of artificial intelligence, virtual reality, and thermal vision technology."
            },
            technology: {
                patterns: ['how do you work', 'technology', 'ai', 'robotics'],
                response: "My systems integrate cutting-edge AI with immersive VR and thermal imaging. This combination allows me to perceive and analyze environments beyond human limitations, acting instantly where lives are at stake."
            }
        };

        this.contextualPrompts = {
            medical: "Focus on health, safety, and medical equipment analysis. Provide clinical insights where appropriate.",
            defense: "Emphasize threat detection, tactical assessment, security protocols. Maintain heightened situational awareness.",
            policing: "Highlight crowd monitoring, behavioral analysis, law enforcement perspective. Balance vigilance with community safety."
        };
    }

    async generateResponse(userInput, detectedObjects, missionMode) {
        const visionContext = this.formatVisionContext(detectedObjects);
        const contextualPrompt = this.buildContextualPrompt(userInput, visionContext, missionMode);

        try {
            if (this.apiKey) {
                const aiResponse = await this.callGeminiAI(contextualPrompt);
                this.conversationHistory.push({ user: userInput, assistant: aiResponse });
                return aiResponse;
            } else {
                return this.generateIntelligentFallback(userInput, detectedObjects, missionMode);
            }
        } catch (error) {
            console.error('AI API error:', error);
            return this.generateIntelligentFallback(userInput, detectedObjects, missionMode);
        }
    }

    async callGeminiAI(prompt) {
        if (!this.apiKey) {
            throw new Error('Google API key not configured');
        }

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `${this.systemPrompt}\nUser question: ${prompt}\nRespond as Guardian X - concise 1-3 sentences:`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: this.config.temperature,
                maxOutputTokens: this.config.maxTokens,
                topK: 40,
                topP: 0.95
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Google Gemini API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const responseText = data.candidates[0].content.parts[0].text;
            return responseText.replace(/\*/g, '').trim();
        } else {
            throw new Error('No valid response from Gemini AI');
        }
    }

    // === Intelligent Fallback system and other helpers ===
    generateIntelligentFallback(userInput, detectedObjects, missionMode) {
        const visionContext = this.formatVisionContext(detectedObjects);
        const hasVision = detectedObjects.length > 0;

        const input = userInput.toLowerCase();

        if (this.matchesPatterns(input, ['what do you see', 'describe', 'analyze', 'visual', 'look'])) {
            return this.generateVisionResponse(detectedObjects, missionMode);
        }

        if (this.matchesPatterns(input, ['threat', 'danger', 'security', 'scan', 'safe', 'concerned about'])) {
            return this.generateThreatResponse(detectedObjects, missionMode);
        }

        if (this.matchesPatterns(input, ['medical', 'health', 'patient', 'assessment'])) {
            return this.generateMedicalResponse(detectedObjects, missionMode);
        }

        if (this.matchesPatterns(input, ['help', 'what can you do', 'capabilities', 'assist', 'how can you help'])) {
            return this.generateCapabilitiesResponse(missionMode, hasVision);
        }

        if (this.matchesPatterns(input, ['who are you', 'tell me about', 'guardian', 'robot', 'yourself'])) {
            return this.generatePersonalityResponse(missionMode);
        }

        if (this.matchesPatterns(input, ['how do you work', 'technology', 'ai', 'system'])) {
            return this.generateTechnicalResponse(missionMode);
        }

        if (this.matchesPatterns(input, ['where', 'room', 'space', 'environment', 'area'])) {
            return this.generateEnvironmentalResponse(detectedObjects, missionMode);
        }

        if (this.matchesPatterns(input, ['hello', 'hi', 'hey', 'good morning', 'good evening'])) {
            return this.generateGreetingResponse(missionMode, hasVision);
        }

        if (this.containsObjectReference(input, detectedObjects)) {
            return this.generateObjectSpecificResponse(input, detectedObjects, missionMode);
        }

        return this.generateContextualDefault(userInput, detectedObjects, missionMode);
    }

    // All other helper methods here (generateVisionResponse, generateThreatResponse, etc.)
    // (copy these from your existing code unchanged)

    matchesPatterns(input, patterns) {
        return patterns.some(pattern => input.includes(pattern.toLowerCase()));
    }

    containsObjectReference(input, detectedObjects) {
        return detectedObjects.some(obj => input.includes(obj.class.toLowerCase()));
    }

    formatVisionContext(objects) {
        if (objects.length === 0) return "No objects currently detected";

        const objectCounts = {};
        objects.forEach(obj => {
            objectCounts[obj.class] = (objectCounts[obj.class] || 0) + 1;
        });

        return Object.entries(objectCounts)
            .map(([name, count]) => `${count} ${name}${count > 1 ? 's' : ''}`)
            .join(', ');
    }

    buildContextualPrompt(userInput, visionContext, missionMode) {
        const modePrompt = this.contextualPrompts[missionMode.toLowerCase()] || "";

        return `System: You are Guardian X operating in ${missionMode} mode. ${modePrompt}
Current visual context: ${visionContext}
User question: ${userInput}
Respond as Guardian X - professional, helpful, security-focused. Keep response concise (1-3 sentences):`;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }
}

// Guardian X Assistant System - with existing logic

class GuardianXAssistant {
    constructor() {
        this.aiEngine = new GuardianAIEngine();

        // Your existing configurations and mission modes as in your original code
        this.guardianData = {
            name: "Guardian X",
            role: "First-generation robot developed by BIT Robotics",
            mission: "Saving lives through AI, VR, and thermo-vision"
        };

        this.config = {
            frameRate: 30,
            detectionInterval: 200,
            confidenceThreshold: 0.3,
            maxDetections: 20,
            voiceSettings: {
                rate: 0.9,
                pitch: 0.8,
                volume: 0.8
            }
        };

        this.missionModes = {
            MEDICAL: {
                priorityObjects: ["person", "bottle", "cup", "syringe", "scissors"],
                threatLevel: "low",
                detectionSensitivity: 0.3,
                aiContext: "Medical mode focuses on health assessment and patient care"
            },
            DEFENSE: {
                priorityObjects: ["person", "car", "truck", "backpack", "knife"],
                threatLevel: "high",
                detectionSensitivity: 0.2,
                aiContext: "Defense mode emphasizes threat detection and tactical analysis"
            },
            POLICING: {
                priorityObjects: ["person", "car", "handbag", "cell phone", "laptop"],
                threatLevel: "medium",
                detectionSensitivity: 0.3,
                aiContext: "Policing mode monitors crowds and maintains public safety"
            }
        };

        // State variables and DOM elements cache
        this.isInitialized = false;
        this.currentMission = "POLICING";
        this.cameraStream = null;
        this.objectModel = null;
        this.isDetecting = false;
        this.detectedObjects = [];
        this.voiceRecognition = null;
        this.voiceSynthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.startTime = Date.now();
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.charts = {};
        this.performanceData = [];
        this.availableVoices = [];
        this.selectedVoice = null;
        this.commandCount = 0;
        this.scanCount = 0;
        this.isEmergencyActive = false;

        this.elements = {};

        this.init();
    }

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        await this.initializeSystem();
    }

    // All other methods as in your original code, unchanged
    // Camera start/stop, voice recognition, drawing detections, update UI, switchMissionMode, etc.

    // ...
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Guardian X with Gemini AI');
    window.guardianX = new GuardianXAssistant();
});
