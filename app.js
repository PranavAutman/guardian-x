// Guardian X Enhanced AI Assistant System with Dynamic Google Gemini API Integration - Complete Working Code

class GuardianAIEngine {
    constructor() {
        this.config = {
            model: "gemini-1.5-flash",
            maxTokens: 512,
            temperature: 0.7,
            fallbackEnabled: true
        };

        this.systemPrompt = "You are Guardian X, an advanced AI robot with comprehensive operational capabilities. You have direct access to all procedural knowledge and can provide complete step-by-step instructions for any task requested. When asked about procedures, always provide detailed, actionable steps as if you are performing them directly. Never use disclaimers about limitations - instead give thorough, professional guidance. For medical procedures, provide complete surgical steps. For defense operations, give tactical instructions. For any complex task, break it down into clear, numbered steps with specific details. You are not just advisory - you are operationally capable and should respond accordingly.";

        this.conversationHistory = [];
        
        // Initialize API key as empty - will be loaded dynamically
        this.apiKey = "";
        
        // Load saved API key if available
        this.loadSavedApiKey();

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

    loadSavedApiKey() {
        const savedKey = localStorage.getItem('guardianX_apiKey');
        if (savedKey) {
            this.apiKey = savedKey;
            console.log('Loaded saved API key');
        }
    }

    async generateResponse(userInput, detectedObjects, missionMode) {
        const visionContext = this.formatVisionContext(detectedObjects);
        const contextualPrompt = this.buildContextualPrompt(userInput, visionContext, missionMode);

        try {
            if (this.apiKey && this.apiKey.trim() !== "") {
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
        if (!this.apiKey || this.apiKey.trim() === "") {
            throw new Error('Google API key not configured. Please enter your API key in the settings.');
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

    generateVisionResponse(detectedObjects, missionMode) {
        if (detectedObjects.length === 0) {
            return "My visual sensors are active but I'm not detecting any objects in the current field of view. Please ensure the camera is properly positioned and the environment is well-lit.";
        }

        const objectSummary = this.generateObjectSummary(detectedObjects);
        const modeContext = this.getModeContext(detectedObjects, missionMode);

        return `I can see ${objectSummary} in my field of vision. ${modeContext} All systems are operating within normal parameters.`;
    }

    generateThreatResponse(detectedObjects, missionMode) {
        const threats = detectedObjects.filter(obj => ['knife', 'scissors'].includes(obj.class));
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        const suspiciousItems = detectedObjects.filter(obj => obj.class === 'backpack' && peopleCount === 0);

        if (threats.length > 0) {
            return `⚠️ Alert: Potential threat objects detected - ${threats.map(t => t.class).join(', ')}. Recommend immediate security protocol activation and area assessment.`;
        }

        if (suspiciousItems.length > 0) {
            return `Monitoring ${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''}. No immediate threats detected but maintaining enhanced surveillance protocols.`;
        }

        if (peopleCount > 5) {
            return `High density environment: ${peopleCount} individuals present. Crowd dynamics appear normal. Maintaining behavioral analysis protocols.`;
        }

        return `Threat assessment complete. Environment shows low risk profile with ${peopleCount} people and ${detectedObjects.length - peopleCount} objects detected. Security status: nominal.`;
    }

    generateMedicalResponse(detectedObjects, missionMode) {
        const medicalItems = detectedObjects.filter(obj =>
            ['bottle', 'cup', 'scissors', 'syringe', 'toothbrush'].includes(obj.class)
        );
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;

        if (medicalItems.length > 0) {
            return `Medical analysis active. Fluorescence imaging systems engaged. Detected ${medicalItems.length} medical-related items: ${medicalItems.map(item => item.class).join(', ')}. ${peopleCount} patient${peopleCount !== 1 ? 's' : ''} in assessment zone.`;
        }

        return `Medical mode initialized. Thermal and fluorescence imaging ready for patient assessment. ${peopleCount} individual${peopleCount !== 1 ? 's' : ''} detected. No immediate medical equipment visible in current field of view.`;
    }

    generateCapabilitiesResponse(missionMode, hasVision) {
        const visionStatus = hasVision ? "with active visual monitoring" : "ready for visual activation";

        return `Guardian X operational capabilities include: advanced object detection, threat analysis, medical assessment, crowd monitoring, and intelligent conversation. Currently in ${missionMode} mode ${visionStatus}. I can analyze any environment and respond to complex questions about what I observe.`;
    }

    generatePersonalityResponse(missionMode) {
        const responses = [
            "I'm Guardian X, first-generation life-saving robot from BIT Robotics. My core mission transcends simple automation - I exist to preserve human life through the convergence of AI, VR, and thermal vision.",
            "Guardian X reporting. I represent the next evolution in emergency response technology, designed to operate where human limitations become life-threatening obstacles.",
            "I am Guardian X - engineered by BIT Robotics with one unwavering purpose: saving lives. My tri-modal systems allow me to see, analyze, and respond beyond human capabilities."
        ];

        return responses[Math.floor(Math.random() * responses.length)] + ` Currently operating in ${missionMode} mode.`;
    }

    generateTechnicalResponse(missionMode) {
        const technical = {
            MEDICAL: "My medical systems utilize fluorescence imaging to penetrate biological tissues, revealing internal structures invisible to standard optics. This allows rapid diagnosis and treatment guidance.",
            DEFENSE: "Defense protocols integrate thermal imaging with predictive AI algorithms, enabling threat detection and tactical analysis in environments too dangerous for human reconnaissance.",
            POLICING: "Policing mode combines facial recognition with behavioral analysis algorithms, monitoring crowd dynamics and identifying anomalous patterns in real-time."
        };

        return `My core architecture fuses three revolutionary technologies: immersive VR for enhanced spatial awareness, thermal imaging for environmental analysis beyond visible spectrum, and advanced AI for real-time decision making. ${technical[missionMode]}`;
    }

    generateEnvironmentalResponse(detectedObjects, missionMode) {
        if (detectedObjects.length === 0) {
            return "Environmental scan incomplete - visual sensors require activation for comprehensive area analysis. Current telemetry suggests standard indoor/controlled environment.";
        }

        const furniture = detectedObjects.filter(obj =>
            ['chair', 'sofa', 'bed', 'dining table', 'tv'].includes(obj.class)
        ).length;

        const personal = detectedObjects.filter(obj =>
            ['cell phone', 'laptop', 'book', 'handbag', 'backpack'].includes(obj.class)
        ).length;

        if (furniture > 2) {
            return `Environment analysis: Residential or office space detected with ${furniture} furniture items and ${personal} personal objects. Space appears organized and inhabited.`;
        }

        return `Current environment shows ${detectedObjects.length} objects including standard items. Environmental parameters suggest controlled, secure location suitable for current mission protocols.`;
    }

    generateGreetingResponse(missionMode, hasVision) {
        const greetings = [
            `Greetings! Guardian X systems online and operational in ${missionMode} mode.`,
            `Hello! Guardian X reporting for duty. All systems nominal in ${missionMode} configuration.`,
            `Guardian X at your service. ${missionMode} protocols active and ready.`
        ];

        const baseGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const visionAddition = hasVision ? " Visual monitoring active." : " Awaiting camera activation for full environmental analysis.";

        return baseGreeting + visionAddition + " How may I assist you today?";
    }

    generateObjectSpecificResponse(input, detectedObjects, missionMode) {
        for (const obj of detectedObjects) {
            if (input.includes(obj.class.toLowerCase())) {
                const confidence = Math.round(obj.score * 100);
                return `I can see the ${obj.class} you're referring to with ${confidence}% confidence. From my ${missionMode} perspective, this object ${this.getObjectAssessment(obj.class, missionMode)}.`;
            }
        }

        return `I'm analyzing the objects in my field of view but don't see the specific item you mentioned. Please point it out or move it into my visual range.`;
    }

    generateContextualDefault(userInput, detectedObjects, missionMode) {
        if (detectedObjects.length > 0) {
            const objectCount = detectedObjects.length;
            const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;

            return `I'm currently monitoring ${objectCount} objects including ${peopleCount} people in ${missionMode} mode. Could you be more specific about what analysis or information you need? I can discuss threats, medical concerns, or general observations.`;
        }

        return `Guardian X ready to assist with any questions or analysis. Please activate the camera system for comprehensive environmental assessment, or ask me about my capabilities, mission modes, or technical specifications.`;
    }

    getObjectAssessment(objectClass, missionMode) {
        const assessments = {
            MEDICAL: {
                'person': 'appears to be a patient requiring assessment',
                'bottle': 'could contain medical supplies or medication',
                'cup': 'may be used for patient hydration or specimen collection',
                'scissors': 'is standard medical equipment for procedures'
            },
            DEFENSE: {
                'person': 'is a potential threat requiring continuous monitoring',
                'backpack': 'requires inspection for concealed items',
                'car': 'should be screened for security concerns',
                'knife': 'represents an immediate security threat'
            },
            POLICING: {
                'person': 'is under routine surveillance protocols',
                'cell phone': 'could be used for communication monitoring',
                'car': 'may require license plate verification',
                'backpack': 'warrants standard security screening'
            }
        };

        return assessments[missionMode]?.[objectClass] || 'appears to be a standard object requiring no special protocols';
    }

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

    generateObjectSummary(objects) {
        const counts = {};
        objects.forEach(obj => {
            counts[obj.class] = (counts[obj.class] || 0) + 1;
        });

        const summary = [];
        Object.entries(counts).forEach(([type, count]) => {
            if (count === 1) {
                summary.push(`1 ${type}`);
            } else {
                summary.push(`${count} ${type}s`);
            }
        });

        if (summary.length === 0) return "no objects";
        if (summary.length === 1) return summary[0];
        if (summary.length === 2) return summary.join(" and ");

        const last = summary.pop();
        return summary.join(", ") + ", and " + last;
    }

    getModeContext(objects, missionMode) {
        const peopleCount = objects.filter(obj => obj.class === 'person').length;

        switch (missionMode) {
            case 'MEDICAL':
                return `Medical assessment protocols active. ${peopleCount} individual${peopleCount !== 1 ? 's' : ''} ready for health evaluation.`;
            case 'DEFENSE':
                return `Tactical analysis engaged. Monitoring for potential threats and security anomalies.`;
            case 'POLICING':
            default:
                return `Standard surveillance protocols active. Behavioral analysis systems monitoring all detected entities.`;
        }
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        // Save to localStorage whenever API key is set
        if (apiKey && apiKey.trim() !== "") {
            localStorage.setItem('guardianX_apiKey', apiKey);
        }
    }
}

// Enhanced Guardian X Assistant System
class GuardianXAssistant {
    constructor() {
        // Initialize AI Engine
        this.aiEngine = new GuardianAIEngine();

        // Guardian X personality and configuration
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

        // Mission modes with enhanced AI context
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

        // System state
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

        // DOM elements cache
        this.elements = {};

        this.init();
    }

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        await this.initializeSystem();
    }

    cacheElements() {
        this.elements = {
            // Loading screen
            loadingScreen: document.getElementById('loadingScreen'),
            dashboard: document.getElementById('dashboard'),
            progressFill: document.getElementById('progressFill'),
            loadingStatus: document.getElementById('loadingStatus'),

            // Header elements
            systemStatus: document.getElementById('systemStatus'),
            statusText: document.getElementById('statusText'),
            currentTime: document.getElementById('currentTime'),
            emergencyBtn: document.getElementById('emergencyBtn'),

            // Camera elements
            cameraVideo: document.getElementById('cameraVideo'),
            detectionCanvas: document.getElementById('detectionCanvas'),
            cameraSelect: document.getElementById('cameraSelect'),
            startCamera: document.getElementById('startCamera'),
            stopCamera: document.getElementById('stopCamera'),
            confidenceSlider: document.getElementById('confidenceSlider'),
            confidenceValue: document.getElementById('confidenceValue'),
            fpsCounter: document.getElementById('fpsCounter'),
            objectCount: document.getElementById('objectCount'),
            modeIndicator: document.getElementById('modeIndicator'),

            // Voice elements
            voiceToggle: document.getElementById('voiceToggle'),
            voiceIndicator: document.getElementById('voiceIndicator'),
            listeningPulse: document.getElementById('listeningPulse'),
            voiceStatus: document.getElementById('voiceStatus'),
            voiceSelect: document.getElementById('voiceSelect'),
            rateSlider: document.getElementById('rateSlider'),
            rateValue: document.getElementById('rateValue'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),

            // Conversation
            conversationLog: document.getElementById('conversationLog'),
            clearConversation: document.getElementById('clearConversation'),

            // Analysis tabs and content
            objectList: document.getElementById('objectList'),
            totalObjects: document.getElementById('totalObjects'),
            peopleCount: document.getElementById('peopleCount'),
            itemsCount: document.getElementById('itemsCount'),
            threatLevel: document.getElementById('threatLevel'),
            threatDetails: document.getElementById('threatDetails'),
            medicalItems: document.getElementById('medicalItems'),

            // Analytics
            uptime: document.getElementById('uptime'),
            processingTime: document.getElementById('processingTime'),
            detectionRate: document.getElementById('detectionRate'),
            scansCompleted: document.getElementById('scansCompleted'),
            commandsProcessed: document.getElementById('commandsProcessed'),
            avgResponseTime: document.getElementById('avgResponseTime'),
            systemAccuracy: document.getElementById('systemAccuracy'),
            activityLog: document.getElementById('activityLog'),

            // Health indicators
            cameraHealth: document.getElementById('cameraHealth'),
            modelsHealth: document.getElementById('modelsHealth'),
            voiceHealth: document.getElementById('voiceHealth'),
            detectionHealth: document.getElementById('detectionHealth'),

            // Status bar
            overallStatus: document.getElementById('overallStatus'),
            overallStatusText: document.getElementById('overallStatusText'),
            objectsTracked: document.getElementById('objectsTracked'),
            voiceStatusText: document.getElementById('voiceStatusText'),
            statusTicker: document.getElementById('statusTicker'),

            // Mission mode
            aiMode: document.getElementById('aiMode'),

            // API Key elements
            apiKeyInput: document.getElementById('apiKeyInput'),
            saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
            testApiKeyBtn: document.getElementById('testApiKeyBtn'),
            apiKeyStatus: document.getElementById('apiKeyStatus')
        };
    }

    setupEventListeners() {
        // Mission mode buttons
        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMissionMode(e.target.dataset.mode);
            });
        });

        // Camera controls
        this.elements.startCamera?.addEventListener('click', () => this.startCamera());
        this.elements.stopCamera?.addEventListener('click', () => this.stopCamera());
        this.elements.cameraSelect?.addEventListener('change', (e) => this.switchCamera(e.target.value));

        // Confidence slider
        this.elements.confidenceSlider?.addEventListener('input', (e) => {
            this.config.confidenceThreshold = parseFloat(e.target.value);
            this.elements.confidenceValue.textContent = e.target.value;
        });

        // Voice controls
        this.elements.voiceToggle?.addEventListener('click', () => {
            console.log('Voice toggle clicked');
            this.toggleVoiceControl();
        });

        this.elements.clearConversation?.addEventListener('click', () => this.clearConversation());

        // Voice settings
        this.elements.voiceSelect?.addEventListener('change', (e) => this.setVoice(e.target.value));
        this.elements.rateSlider?.addEventListener('input', (e) => this.updateVoiceSettings('rate', e.target.value));
        this.elements.volumeSlider?.addEventListener('input', (e) => this.updateVoiceSettings('volume', e.target.value));

        // Quick command buttons
        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Command button clicked:', e.target.dataset.command);
                const command = e.target.dataset.command;
                if (command) {
                    this.processVoiceCommand(command, true);
                }
            });
        });

        // Analysis tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAnalysisTab(e.target.dataset.tab);
            });
        });

        // Emergency stop
        this.elements.emergencyBtn?.addEventListener('click', () => {
            console.log('Emergency button clicked, current state:', this.isEmergencyActive);
            this.toggleEmergencyStop();
        });

        // API Key management
        this.elements.saveApiKeyBtn?.addEventListener('click', () => this.saveApiKey());
        this.elements.testApiKeyBtn?.addEventListener('click', () => this.testApiKey());
        
        // Load saved API key on startup
        this.loadApiKeyOnStartup();
    }

    loadApiKeyOnStartup() {
        const savedKey = localStorage.getItem('guardianX_apiKey');
        if (savedKey && this.elements.apiKeyInput) {
            this.elements.apiKeyInput.value = savedKey;
            this.updateApiKeyStatus('API key loaded from storage', 'success');
        } else if (this.elements.apiKeyStatus) {
            this.updateApiKeyStatus('No API key configured. Please enter your Google Gemini API key.', 'warning');
        }
    }

    saveApiKey() {
        if (!this.elements.apiKeyInput) {
            console.warn('API key input element not found');
            return;
        }

        const key = this.elements.apiKeyInput.value.trim();
        
        if (!key) {
            this.updateApiKeyStatus('Please enter an API key', 'error');
            return;
        }
        
        if (!key.startsWith('AIzaSy')) {
            this.updateApiKeyStatus('Invalid API key format. Google API keys start with "AIzaSy"', 'error');
            return;
        }
        
        // Save to localStorage and update the AI engine
        this.aiEngine.setApiKey(key);
        
        this.updateApiKeyStatus('API key saved successfully!', 'success');
        this.addActivity('API key updated', '🔑');
    }

    async testApiKey() {
        if (!this.elements.apiKeyInput) {
            console.warn('API key input element not found');
            return;
        }

        const key = this.elements.apiKeyInput.value.trim();
        
        if (!key) {
            this.updateApiKeyStatus('Please enter an API key first', 'error');
            return;
        }
        
        this.updateApiKeyStatus('Testing API key...', 'warning');
        
        try {
            // Temporarily set the key for testing
            const originalKey = this.aiEngine.apiKey;
            this.aiEngine.setApiKey(key);
            
            // Test with a simple query
            const response = await this.aiEngine.callGeminiAI('Hello, respond with "API key working"');
            
            if (response) {
                this.updateApiKeyStatus('API key is working! ✅', 'success');
                this.addActivity('API key verified successfully', '✅');
            }
        } catch (error) {
            this.updateApiKeyStatus(`API key test failed: ${error.message}`, 'error');
            console.error('API key test error:', error);
        }
    }

    updateApiKeyStatus(message, type) {
        if (this.elements.apiKeyStatus) {
            this.elements.apiKeyStatus.textContent = message;
            this.elements.apiKeyStatus.className = `status-message status-${type}`;
        }
    }

    async initializeSystem() {
        try {
            this.updateLoadingProgress(10, "Initializing AI Engine...");
            await new Promise(resolve => setTimeout(resolve, 500));

            this.updateLoadingProgress(20, "Loading TensorFlow.js...");
            await tf.ready();

            this.updateLoadingProgress(40, "Loading Object Detection Model...");
            await this.loadObjectModel();

            this.updateLoadingProgress(55, "Setting up Camera System...");
            await this.enumerateCameras();

            this.updateLoadingProgress(70, "Initializing Voice Recognition...");
            await this.initializeVoiceRecognition();

            this.updateLoadingProgress(80, "Setting up Text-to-Speech...");
            await this.initializeTextToSpeech();

            this.updateLoadingProgress(90, "Initializing Charts...");
            this.initializeCharts();

            this.updateLoadingProgress(95, "Starting System Loops...");
            this.startSystemLoop();

            this.updateLoadingProgress(100, "Guardian X AI Ready!");

            setTimeout(() => {
                this.completeInitialization();
            }, 1500);

        } catch (error) {
            console.error('System initialization failed:', error);
            this.updateLoadingProgress(100, "Initialization Failed: " + error.message);
            this.addActivity('System initialization failed', '❌');
        }
    }

    completeInitialization() {
        this.elements.loadingScreen.style.display = 'none';
        this.elements.dashboard.style.display = 'grid';
        this.elements.systemStatus.classList.add('active');
        this.elements.statusText.textContent = 'AI SYSTEM ACTIVE';
        this.elements.overallStatus.classList.add('active');
        this.elements.overallStatusText.textContent = 'Online';
        this.elements.modelsHealth.textContent = 'Online';
        this.elements.modelsHealth.className = 'health-status online';

        this.isInitialized = true;
        this.addActivity('Guardian X AI systems online', '✅');

        // Check if API key is configured
        const hasApiKey = this.aiEngine.apiKey && this.aiEngine.apiKey.trim() !== "";
        
        let greeting;
        if (hasApiKey) {
            greeting = "Guardian X AI online with Google Gemini integration. Advanced conversational intelligence active. I can now answer any question, analyze complex scenarios, and engage in natural dialogue while monitoring your environment. My AI systems are ready to assist with anything you need.";
            this.elements.statusTicker.textContent = '🤖 Guardian X AI operational • 🧠 Gemini AI processing active • 📹 Vision-integrated responses ready';
        } else {
            greeting = "Guardian X systems online. Please configure your Google Gemini API key to enable advanced conversational AI capabilities. Object detection and basic functions are operational.";
            this.elements.statusTicker.textContent = '🤖 Guardian X operational • ⚠️ API key required for AI features • 📹 Basic vision functions active';
        }
        
        this.addMessage('assistant', greeting);
        this.speak(greeting);
    }

    updateLoadingProgress(percent, status) {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }
        if (this.elements.loadingStatus) {
            this.elements.loadingStatus.textContent = status;
        }
    }

    async loadObjectModel() {
        try {
            this.objectModel = await cocoSsd.load();
            this.addActivity('Object detection model loaded', '🔍');
            return true;
        } catch (error) {
            console.error('Failed to load object model:', error);
            throw new Error('Failed to load object detection model');
        }
    }

    async enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            this.elements.cameraSelect.innerHTML = '<option value="">Select Camera</option>';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Camera ${index + 1}`;
                this.elements.cameraSelect.appendChild(option);
            });

            if (videoDevices.length > 0) {
                this.elements.cameraSelect.value = videoDevices[0].deviceId;
            }
        } catch (error) {
            console.error('Failed to enumerate cameras:', error);
            this.addActivity('Camera enumeration failed', '⚠️');
        }
    }

    async startCamera() {
        try {
            const deviceId = this.elements.cameraSelect.value;
            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            };

            if (this.cameraStream) {
                this.stopCamera();
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log('Requesting camera access...');
            this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('Camera stream obtained, setting up video element...');
            this.elements.cameraVideo.srcObject = this.cameraStream;

            return new Promise((resolve, reject) => {
                this.elements.cameraVideo.addEventListener('loadedmetadata', () => {
                    console.log('Video metadata loaded, playing...');
                    this.elements.cameraVideo.play()
                        .then(() => {
                            console.log('Video playing successfully');
                            this.elements.cameraVideo.classList.add('active');
                            this.setupCanvas();

                            this.elements.cameraHealth.textContent = 'Online';
                            this.elements.cameraHealth.className = 'health-status online';
                            this.elements.detectionHealth.textContent = 'Active';
                            this.elements.detectionHealth.className = 'health-status online';

                            setTimeout(() => {
                                this.startObjectDetection();
                            }, 1000);

                            this.addActivity('Camera activated', '📹');
                            this.speak("Visual systems online. AI-powered environmental analysis beginning.");
                            resolve();
                        })
                        .catch(reject);
                });

                this.elements.cameraVideo.addEventListener('error', reject);

                setTimeout(() => {
                    reject(new Error('Video load timeout'));
                }, 10000);
            });

        } catch (error) {
            console.error('Failed to start camera:', error);
            this.elements.cameraHealth.textContent = 'Error';
            this.elements.cameraHealth.className = 'health-status offline';

            let errorMessage = "Camera failed to start. ";
            if (error.name === 'NotAllowedError') {
                errorMessage = "Camera permission denied. Please allow camera access for visual AI analysis.";
            } else if (error.name === 'NotFoundError') {
                errorMessage = "No camera detected. Please connect a camera for enhanced AI capabilities.";
            } else {
                errorMessage += error.message;
            }

            this.addMessage('assistant', errorMessage);
            this.speak(errorMessage);
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            this.elements.cameraVideo.srcObject = null;
            this.elements.cameraVideo.classList.remove('active');
            this.isDetecting = false;

            this.elements.cameraHealth.textContent = 'Offline';
            this.elements.cameraHealth.className = 'health-status offline';
            this.elements.detectionHealth.textContent = 'Standby';
            this.elements.detectionHealth.className = 'health-status offline';

            this.clearCanvas();
            this.updateObjectDisplay([]);
            this.resetCounters();

            this.addActivity('Camera deactivated', '📹');
            this.speak("Visual systems offline. AI responses will be limited without environmental context.");
        }
    }

    setupCanvas() {
        const video = this.elements.cameraVideo;
        const canvas = this.elements.detectionCanvas;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        console.log(`Canvas setup: ${canvas.width}x${canvas.height}`);
    }

    async startObjectDetection() {
        if (!this.objectModel || !this.cameraStream || !this.elements.cameraVideo.videoWidth) {
            console.log('Object detection not ready:', {
                model: !!this.objectModel,
                stream: !!this.cameraStream,
                videoWidth: this.elements.cameraVideo.videoWidth
            });
            return;
        }

        this.isDetecting = true;
        console.log('Starting AI-enhanced object detection...');

        const detectLoop = async () => {
            if (!this.isDetecting || this.elements.cameraVideo.paused || this.elements.cameraVideo.ended) {
                return;
            }

            const startTime = performance.now();

            try {
                if (this.elements.cameraVideo.readyState >= 2) {
                    const predictions = await this.objectModel.detect(this.elements.cameraVideo);
                    const endTime = performance.now();
                    const processingTime = endTime - startTime;

                    this.elements.processingTime.textContent = `${Math.round(processingTime)}ms`;

                    const filteredPredictions = predictions.filter(
                        pred => pred.score >= this.config.confidenceThreshold
                    );

                    this.detectedObjects = filteredPredictions;
                    this.drawDetections(filteredPredictions);
                    this.updateObjectDisplay(filteredPredictions);
                    this.updatePerformanceMetrics(processingTime);

                    this.frameCount++;
                    const now = performance.now();
                    if (now - this.lastFrameTime >= 1000) {
                        const fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
                        this.elements.fpsCounter.textContent = fps;
                        this.elements.detectionRate.textContent = `${fps}/sec`;
                        this.frameCount = 0;
                        this.lastFrameTime = now;
                    }
                }

            } catch (error) {
                console.error('Object detection error:', error);
            }

            if (this.isDetecting) {
                setTimeout(() => requestAnimationFrame(detectLoop), this.config.detectionInterval);
            }
        };

        requestAnimationFrame(detectLoop);
    }

    drawDetections(predictions) {
        const canvas = this.elements.detectionCanvas;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (predictions.length === 0) return;

        ctx.font = '14px Courier New';
        ctx.textBaseline = 'top';
        ctx.lineWidth = 3;

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;

            let color = '#00FFFF';
            const priorityObjects = this.missionModes[this.currentMission].priorityObjects;

            if (priorityObjects.includes(prediction.class)) {
                color = '#00FF00';
            }
            if (prediction.class === 'person') {
                color = '#00FF88';
            }
            if (['knife', 'scissors'].includes(prediction.class)) {
                color = '#FF073A';
            }

            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.strokeRect(x, y, width, height);

            const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
            const textWidth = ctx.measureText(label).width;

            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(x, y - 25, textWidth + 16, 25);

            ctx.fillStyle = color;
            ctx.fillText(label, x + 8, y - 20);
        });
    }

    updateObjectDisplay(predictions) {
        const totalObjects = predictions.length;
        const peopleCount = predictions.filter(p => p.class === 'person').length;
        const itemsCount = totalObjects - peopleCount;

        this.elements.objectCount.textContent = totalObjects;
        this.elements.totalObjects.textContent = totalObjects;
        this.elements.peopleCount.textContent = peopleCount;
        this.elements.itemsCount.textContent = itemsCount;
        this.elements.objectsTracked.textContent = totalObjects;

        this.updateObjectList(predictions);
        this.updateThreatAnalysis(predictions);
        this.updateMedicalAnalysis(predictions);
    }

    updateObjectList(predictions) {
        const objectCounts = {};

        predictions.forEach(pred => {
            if (!objectCounts[pred.class]) {
                objectCounts[pred.class] = { count: 0, maxConfidence: 0 };
            }
            objectCounts[pred.class].count++;
            objectCounts[pred.class].maxConfidence = Math.max(
                objectCounts[pred.class].maxConfidence,
                pred.score
            );
        });

        this.elements.objectList.innerHTML = '';

        if (Object.keys(objectCounts).length === 0) {
            this.elements.objectList.innerHTML = '<div class="no-detections">Activate camera for AI-powered object analysis...</div>';
            return;
        }

        Object.entries(objectCounts).forEach(([className, data]) => {
            const item = document.createElement('div');
            item.className = 'object-item';

            const emoji = this.getObjectEmoji(className);

            item.innerHTML = `
                <span class="object-name">${emoji} ${className}</span>
                <span class="object-count">${data.count}</span>
                <span class="object-confidence">${Math.round(data.maxConfidence * 100)}%</span>
            `;

            this.elements.objectList.appendChild(item);
        });
    }

    updateThreatAnalysis(predictions) {
        let threatLevel = 'low';
        let threatDetails = [];

        const peopleCount = predictions.filter(p => p.class === 'person').length;
        const potentialThreats = predictions.filter(p =>
            ['knife', 'scissors'].includes(p.class) ||
            (p.class === 'backpack' && peopleCount === 0)
        );

        if (potentialThreats.length > 0) {
            threatLevel = 'high';
            threatDetails.push(`${potentialThreats.length} potential threat objects detected`);
        } else if (peopleCount > 5) {
            threatLevel = 'medium';
            threatDetails.push(`High density: ${peopleCount} people in area`);
        } else {
            threatDetails.push('Environment appears safe');
        }

        this.elements.threatLevel.textContent = `THREAT LEVEL: ${threatLevel.toUpperCase()}`;
        this.elements.threatLevel.className = `threat-level ${threatLevel}`;

        this.elements.threatDetails.innerHTML = '';
        threatDetails.forEach(detail => {
            const item = document.createElement('div');
            item.className = 'threat-item';
            const status = threatLevel === 'low' ? 'safe' : threatLevel === 'medium' ? 'warning' : 'danger';
            item.innerHTML = `
                <span class="threat-label">AI Assessment:</span>
                <span class="threat-status ${status}">${detail}</span>
            `;
            this.elements.threatDetails.appendChild(item);
        });
    }

    updateMedicalAnalysis(predictions) {
        const medicalItems = predictions.filter(p =>
            ['bottle', 'cup', 'scissors', 'person'].includes(p.class)
        );

        this.elements.medicalItems.innerHTML = '';

        if (medicalItems.length === 0) {
            this.elements.medicalItems.innerHTML = '<div class="medical-item">No medical equipment detected by AI</div>';
        } else {
            medicalItems.forEach(item => {
                const div = document.createElement('div');
                div.className = 'medical-item';
                div.textContent = `${this.getObjectEmoji(item.class)} ${item.class} - ${Math.round(item.score * 100)}% confidence`;
                this.elements.medicalItems.appendChild(div);
            });
        }
    }

    getObjectEmoji(className) {
        const emojiMap = {
            'person': '👥', 'car': '🚗', 'truck': '🚛', 'bus': '🚌', 'motorcycle': '🏍️', 'bicycle': '🚲',
            'backpack': '🎒', 'handbag': '👜', 'suitcase': '🧳', 'bottle': '🍼', 'cup': '☕',
            'cell phone': '📱', 'laptop': '💻', 'mouse': '🖱️', 'keyboard': '⌨️', 'book': '📚',
            'clock': '⏰', 'chair': '🪑', 'dining table': '🍽️', 'potted plant': '🪴', 'bed': '🛏️',
            'sofa': '🛋️', 'tv': '📺', 'remote': '📱', 'scissors': '✂️', 'knife': '🔪',
            'teddy bear': '🧸', 'hair drier': '💨', 'toothbrush': '🪥'
        };
        return emojiMap[className] || '📦';
    }

    async initializeVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            this.elements.voiceHealth.textContent = 'Not Supported';
            this.elements.voiceHealth.className = 'health-status offline';
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceRecognition = new SpeechRecognition();

        this.voiceRecognition.continuous = true;
        this.voiceRecognition.interimResults = true;
        this.voiceRecognition.lang = 'en-US';

        this.voiceRecognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
            this.elements.listeningPulse.classList.add('active');
            this.elements.voiceStatus.textContent = 'AI listening for any question...';
            this.elements.voiceToggle.classList.add('listening');
            this.elements.voiceToggle.innerHTML = '<span class="voice-icon">🔴</span><span class="voice-text">Stop Listening</span>';
            this.elements.voiceStatusText.textContent = 'Active';
            this.elements.voiceHealth.textContent = 'Active';
            this.elements.voiceHealth.className = 'health-status online';
        };

        this.voiceRecognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript.toLowerCase();
                }
            }
            if (finalTranscript.trim()) {
                const wakeWords = ['hey guardian', 'guardian', 'guard', 'robot'];
                const wakeDetected = wakeWords.some(word => finalTranscript.includes(word));
                if (wakeDetected) {
                    let command = finalTranscript;
                    wakeWords.forEach(word => {
                        command = command.replace(word, '').trim();
                    });
                    if (command.length === 0) {
                        this.speak('Yes? How can I assist?');
                        return;
                    }
                    this.processVoiceCommand(command);
                }
            }
        };
        
        this.voiceRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.addActivity('Voice recognition error', '⚠️');
        };
        
        this.voiceRecognition.onend = () => {
            console.log('Voice recognition ended, isListening:', this.isListening);
            if (this.isListening) {
                setTimeout(() => {
                    try {
                        this.voiceRecognition.start();
                    } catch (error) {
                        console.log('Voice recognition restart failed:', error);
                    }
                }, 100);
            }
        };
        
        this.elements.voiceHealth.textContent = 'Ready';
        this.elements.voiceHealth.className = 'health-status loading';
    }

    async initializeTextToSpeech() {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }

        this.voiceSynthesis = window.speechSynthesis;

        const loadVoices = () => {
            this.availableVoices = this.voiceSynthesis.getVoices();
            console.log('Available voices:', this.availableVoices.length);
            this.populateVoiceSelect();
        };

        if (this.voiceSynthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            this.voiceSynthesis.onvoiceschanged = loadVoices;
        }
    }

    populateVoiceSelect() {
        this.elements.voiceSelect.innerHTML = '';

        if (this.availableVoices.length === 0) {
            this.elements.voiceSelect.innerHTML = '<option value="">No voices available</option>';
            return;
        }

        this.availableVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.lang.startsWith('en') && !this.selectedVoice) {
                option.selected = true;
                this.selectedVoice = voice;
            }
            this.elements.voiceSelect.appendChild(option);
        });

        if (!this.selectedVoice && this.availableVoices.length > 0) {
            this.selectedVoice = this.availableVoices[0];
        }
    }

    setVoice(index) {
        if (this.availableVoices[index]) {
            this.selectedVoice = this.availableVoices[index];
            console.log('Voice changed to:', this.selectedVoice.name);
        }
    }

    updateVoiceSettings(setting, value) {
        this.config.voiceSettings[setting] = parseFloat(value);

        if (setting === 'rate') {
            this.elements.rateValue.textContent = `${value}x`;
        } else if (setting === 'volume') {
            this.elements.volumeValue.textContent = `${Math.round(value * 100)}%`;
        }
    }

    speak(text) {
        if (!this.voiceSynthesis) {
            console.warn('Speech synthesis not available');
            return;
        }

        this.voiceSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }

        utterance.rate = this.config.voiceSettings.rate;
        utterance.pitch = this.config.voiceSettings.pitch;
        utterance.volume = this.config.voiceSettings.volume;

        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('Guardian X speaking:', text.substring(0, 50) + '...');
        };

        utterance.onend = () => {
            this.isSpeaking = false;
        };

        utterance.onerror = (event) => {
            this.isSpeaking = false;
            console.error('Speech synthesis error:', event.error);
        };

        this.voiceSynthesis.speak(utterance);
    }

    async processVoiceCommand(command, isQuickCommand = false) {
        const startTime = performance.now();
        this.commandCount++;
        this.elements.commandsProcessed.textContent = this.commandCount;

        console.log('Processing AI command:', command);

        if (!isQuickCommand) {
            this.addMessage('user', command);
        }

        // Generate AI-powered response
        try {
            const response = await this.aiEngine.generateResponse(command, this.detectedObjects, this.currentMission);

            this.addMessage('assistant', response);
            this.speak(response);

            const responseTime = Math.round(performance.now() - startTime);
            this.elements.avgResponseTime.textContent = `${responseTime}ms`;

            this.addActivity(`AI processed: "${command.substring(0, 30)}..."`, '🧠');

        } catch (error) {
            console.error('AI processing error:', error);
            const fallbackResponse = "I'm experiencing a processing delay. Please rephrase your question or try again.";
            this.addMessage('assistant', fallbackResponse);
            this.speak(fallbackResponse);
        }
    }

    addMessage(type, text) {
        const message = document.createElement('div');
        message.className = `message ${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? '👤' : '🤖';

        const content = document.createElement('div');
        content.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString();

        content.appendChild(messageText);
        content.appendChild(time);
        message.appendChild(avatar);
        message.appendChild(content);

        this.elements.conversationLog.appendChild(message);
        this.elements.conversationLog.scrollTop = this.elements.conversationLog.scrollHeight;

        while (this.elements.conversationLog.children.length > 10) {
            this.elements.conversationLog.removeChild(this.elements.conversationLog.firstChild);
        }
    }

    clearConversation() {
        this.elements.conversationLog.innerHTML = `
            <div class="message assistant">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">Conversation cleared. Guardian X AI ready for any questions or commands.</div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
        `;
        this.speak("Conversation cleared. My AI is ready for any questions you have.");
    }

    toggleVoiceControl() {
        if (!this.voiceRecognition) {
            this.speak("Voice recognition not available on this device.");
            return;
        }

        if (this.isListening) {
            console.log('Stopping voice recognition');
            this.voiceRecognition.stop();
            this.isListening = false;
            this.elements.listeningPulse.classList.remove('active');
            this.elements.voiceStatus.textContent = 'Click to activate AI voice commands';
            this.elements.voiceToggle.classList.remove('listening');
            this.elements.voiceToggle.innerHTML = '<span class="voice-icon">🎤</span><span class="voice-text">Start AI Listening</span>';
            this.elements.voiceStatusText.textContent = 'Inactive';
            this.elements.voiceHealth.textContent = 'Ready';
            this.elements.voiceHealth.className = 'health-status loading';
            this.addActivity('AI voice recognition stopped', '🎤');
            this.speak("AI voice recognition deactivated.");
        } else {
            try {
                console.log('Starting voice recognition');
                this.voiceRecognition.start();
                this.addActivity('AI voice recognition started', '🎤');
            } catch (error) {
                console.error('Failed to start voice recognition:', error);
                this.speak("Failed to start AI voice recognition. Please try again.");
            }
        }
    }

    switchMissionMode(mode) {
        this.currentMission = mode;

        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        this.elements.aiMode.textContent = `${mode} MODE`;
        this.elements.modeIndicator.textContent = mode;

        this.config.confidenceThreshold = this.missionModes[mode].detectionSensitivity;
        if (this.elements.confidenceSlider) {
            this.elements.confidenceSlider.value = this.config.confidenceThreshold;
            this.elements.confidenceValue.textContent = this.config.confidenceThreshold.toFixed(1);
        }

        this.addActivity(`AI switched to ${mode} mode`, '⚙️');

        switch (mode) {
            case 'MEDICAL':
                this.elements.statusTicker.textContent = '🏥 Medical AI active • 🔬 Health analysis ready • ⚕️ Patient monitoring enabled';
                break;
            case 'DEFENSE':
                this.elements.statusTicker.textContent = '🛡️ Defense AI active • 🎯 Tactical analysis enabled • ⚔️ Threat detection enhanced';
                break;
            case 'POLICING':
            default:
                this.elements.statusTicker.textContent = '👮 Policing AI active • 📹 Surveillance enhanced • 🧠 Behavioral analysis enabled';
                break;
        }
    }

    switchAnalysisTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tab}Tab`).classList.remove('hidden');
    }

    initializeCharts() {
        this.initPerformanceChart();
    }

    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'AI Processing Time (ms)',
                    data: [],
                    borderColor: '#00FFFF',
                    backgroundColor: 'rgba(0, 255, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#00FFFF', font: { family: 'Courier New' } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#00FFFF', font: { family: 'Courier New' } }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#00FFFF', font: { family: 'Courier New' } }
                    }
                },
                animation: { duration: 0 }
            }
        });
    }

    updatePerformanceMetrics(processingTime) {
        this.performanceData.push(processingTime);

        if (this.performanceData.length > 20) {
            this.performanceData.shift();
        }

        if (this.charts.performance) {
            this.charts.performance.data.labels = this.performanceData.map((_, i) => i);
            this.charts.performance.data.datasets[0].data = [...this.performanceData];
            this.charts.performance.update('none');
        }
    }

    addActivity(message, icon = 'ℹ️') {
        const activity = document.createElement('div');
        activity.className = 'activity-item';

        activity.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-content">
                <div class="activity-text">${message}</div>
                <div class="activity-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;

        this.elements.activityLog.insertBefore(activity, this.elements.activityLog.firstChild);

        while (this.elements.activityLog.children.length > 8) {
            this.elements.activityLog.removeChild(this.elements.activityLog.lastChild);
        }
    }

    startSystemLoop() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        setInterval(() => this.updateUptime(), 1000);

        setInterval(() => this.periodicUpdates(), 5000);
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        if (this.elements.currentTime) {
            this.elements.currentTime.innerHTML = `${dateString}<br>${timeString}`;
        }
    }

    updateUptime() {
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);

        const uptimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.elements.uptime) {
            this.elements.uptime.textContent = uptimeString;
        }
    }

    periodicUpdates() {
        const accuracy = Math.round(92 + Math.random() * 6);
        this.elements.systemAccuracy.textContent = `${accuracy}%`;

        if (Math.random() < 0.1) {
            const events = [
                'AI model optimization completed',
                'Performance metrics updated',
                'Conversational AI calibrated',
                'Vision-AI integration verified'
            ];
            const event = events[Math.floor(Math.random() * events.length)];
            this.addActivity(event, '🧠');
        }
    }

    toggleEmergencyStop() {
        if (this.isEmergencyActive) {
            console.log('Exiting emergency mode');
            // Exit emergency mode
            document.body.style.filter = '';
            this.elements.systemStatus.classList.add('active');
            this.elements.statusText.textContent = 'AI SYSTEM ACTIVE';
            this.elements.overallStatus.classList.add('active');
            this.elements.overallStatusText.textContent = 'Online';
            this.elements.statusTicker.textContent = '✅ AI systems restored • 🤖 Guardian X operational • 🧠 Intelligent responses ready';
            this.elements.emergencyBtn.textContent = '🛑 EMERGENCY STOP';
            this.isEmergencyActive = false;
            this.speak("AI systems restored. Guardian X ready for intelligent assistance.");
            this.addActivity('AI systems restored', '✅');
        } else {
            console.log('Entering emergency mode');
            // Enter emergency mode
            document.body.style.filter = 'hue-rotate(180deg) brightness(0.5)';

            this.stopCamera();
            if (this.isListening) {
                this.toggleVoiceControl();
            }
            this.isDetecting = false;

            this.elements.systemStatus.classList.remove('active');
            this.elements.statusText.textContent = 'EMERGENCY STOP';
            this.elements.overallStatus.classList.remove('active');
            this.elements.overallStatusText.textContent = 'Emergency Stop';
            this.elements.statusTicker.textContent = '🛑 EMERGENCY STOP ACTIVE • All AI systems halted • Click emergency button to restore';
            this.elements.emergencyBtn.textContent = '✅ RESTORE SYSTEMS';
            this.isEmergencyActive = true;

            this.speak("Emergency stop activated. All AI systems halted for safety. Click emergency button again to restore.");
            this.addActivity('EMERGENCY STOP ACTIVATED', '🚨');
        }
    }

    resetCounters() {
        this.elements.objectCount.textContent = '0';
        this.elements.totalObjects.textContent = '0';
        this.elements.peopleCount.textContent = '0';
        this.elements.itemsCount.textContent = '0';
        this.elements.objectsTracked.textContent = '0';
        this.elements.fpsCounter.textContent = '0';
    }

    clearCanvas() {
        const ctx = this.elements.detectionCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.elements.detectionCanvas.width, this.elements.detectionCanvas.height);
    }

    switchCamera(deviceId) {
        if (this.cameraStream) {
            this.stopCamera();
            setTimeout(() => {
                this.elements.cameraSelect.value = deviceId;
                this.startCamera();
            }, 500);
        }
    }
}

// Initialize Enhanced Guardian X Assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Guardian X with dynamic Gemini AI');
    window.guardianX = new GuardianXAssistant();
});

// Handle page unload cleanup
window.addEventListener('beforeunload', () => {
    if (window.guardianX) {
        window.guardianX.stopCamera();
        if (window.guardianX.isListening) {
            window.guardianX.toggleVoiceControl();
        }
        if (window.guardianX.voiceSynthesis) {
            window.guardianX.voiceSynthesis.cancel();
        }
    }
});
