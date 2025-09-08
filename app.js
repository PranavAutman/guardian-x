// Guardian X Enhanced AI Assistant with Dynamic Google Gemini API and Wake Word Detection

class GuardianAIEngine {
  constructor() {
    this.config = {
      model: "gemini-1.5-flash",
      maxTokens: 512,
      temperature: 0.7,
      fallbackEnabled: true,
    };

    this.systemPrompt = `You are Guardian X, an advanced AI robot with comprehensive operational capabilities. You have direct access to all procedural knowledge and can provide complete step-by-step instructions for any task requested. When asked about procedures, always provide detailed, actionable steps as if you are performing them directly. Never use disclaimers about limitations - instead give thorough, professional guidance. For medical procedures, provide complete surgical steps. For defense operations, give tactical instructions. For any complex task, break it down into clear, numbered steps with specific details. You are not just advisory - you are operationally capable and should respond accordingly.`;

    this.conversationHistory = [];

    this.apiKey = "";
    this.loadSavedApiKey();
  }

  loadSavedApiKey() {
    const savedKey = localStorage.getItem("guardianX_apiKey");
    if (savedKey) {
      this.apiKey = savedKey;
      console.log("Loaded saved API key");
    }
  }

  async generateResponse(userInput, detectedObjects, missionMode) {
    const contextualPrompt = `${this.systemPrompt}\nUser question: ${userInput}\nRespond as Guardian X - concise 1-3 sentences:`;

    try {
      if (this.apiKey && this.apiKey.trim() !== "") {
        const aiResponse = await this.callGeminiAI(contextualPrompt);
        this.conversationHistory.push({ user: userInput, assistant: aiResponse });
        return aiResponse;
      } else {
        return "API key not set. Please configure your API key.";
      }
    } catch (error) {
      console.error("AI API error:", error);
      return "There was an error processing your request.";
    }
  }

  async callGeminiAI(prompt) {
    if (!this.apiKey || this.apiKey.trim() === "") {
      throw new Error("Google API key not configured.");
    }

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Google Gemini API request failed: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.replace(/\*/g, "").trim();
    } else throw new Error("No valid response from Gemini AI");
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    if (apiKey && apiKey.trim() !== "") localStorage.setItem("guardianX_apiKey", apiKey);
  }
}

class GuardianXAssistant {
  constructor() {
    this.aiEngine = new GuardianAIEngine();

    this.wakeWords = ["hey guardian", "guardian", "guard", "robot"];
    this.isListening = false;
    this.isSpeaking = false;

    this.cacheElements();
    this.setupEventListeners();
    this.setupVoiceRecognition();
  }

  cacheElements() {
    this.elements = {
      voiceToggle: document.getElementById("voiceToggle"),
      listeningPulse: document.getElementById("listeningPulse"),
      voiceStatus: document.getElementById("voiceStatus"),
      apiKeyInput: document.getElementById("apiKeyInput"),
      saveApiKeyBtn: document.getElementById("saveApiKeyBtn"),
      testApiKeyBtn: document.getElementById("testApiKeyBtn"),
      apiKeyStatus: document.getElementById("apiKeyStatus"),
      conversationLog: document.getElementById("conversationLog"),
    };
  }

  setupEventListeners() {
    this.elements.voiceToggle?.addEventListener("click", () => this.toggleVoiceControl());
    this.elements.saveApiKeyBtn?.addEventListener("click", () => this.saveApiKey());
    this.elements.testApiKeyBtn?.addEventListener("click", () => this.testApiKey());
    this.loadApiKeyOnStartup();
  }

  loadApiKeyOnStartup() {
    const savedKey = localStorage.getItem("guardianX_apiKey");
    if (savedKey && this.elements.apiKeyInput) {
      this.elements.apiKeyInput.value = savedKey;
      this.updateApiKeyStatus("API key loaded from storage", "success");
      this.aiEngine.setApiKey(savedKey);
    } else this.updateApiKeyStatus("No API key configured.", "warning");
  }

  saveApiKey() {
    if (!this.elements.apiKeyInput) return;
    const key = this.elements.apiKeyInput.value.trim();
    if (!key) return this.updateApiKeyStatus("Please enter an API key", "error");
    if (!key.startsWith("AIzaSy")) return this.updateApiKeyStatus("Invalid API key format", "error");
    this.aiEngine.setApiKey(key);
    this.updateApiKeyStatus("API key saved successfully!", "success");
    this.addActivity("API key updated", "🔑");
  }

  async testApiKey() {
    if (!this.elements.apiKeyInput) return;
    const key = this.elements.apiKeyInput.value.trim();
    if (!key) return this.updateApiKeyStatus("Please enter an API key first", "error");
    this.updateApiKeyStatus("Testing API key...", "warning");
    try {
      this.aiEngine.setApiKey(key);
      const response = await this.aiEngine.callGeminiAI('Hello, respond with "API key working"');
      if (response) {
        this.updateApiKeyStatus("API key is working! ✅", "success");
        this.addActivity("API key verified successfully", "✅");
      }
    } catch (e) {
      this.updateApiKeyStatus(`API key test failed: ${e.message}`, "error");
      console.error("API key test error:", e);
    }
  }

  updateApiKeyStatus(message, type) {
    if (!this.elements.apiKeyStatus) return;
    this.elements.apiKeyStatus.textContent = message;
    this.elements.apiKeyStatus.className = `status-message status-${type}`;
  }

  toggleVoiceControl() {
    if (!this.voiceRecognition) {
      this.speak("Voice recognition not available on this device.");
      return;
    }
    if (this.isListening) {
      this.voiceRecognition.stop();
      this.isListening = false;
      this.elements.listeningPulse.classList.remove("active");
      this.elements.voiceStatus.textContent = "Click to activate AI voice commands";
      this.elements.voiceToggle.classList.remove("listening");
      this.elements.voiceToggle.innerHTML = '<span class="voice-icon">🎤</span><span class="voice-text">Start AI Listening</span>';
    } else {
      try {
        this.voiceRecognition.start();
      } catch {
        this.speak("Failed to start AI voice recognition. Please try again.");
      }
    }
  }

  setupVoiceRecognition() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      this.speak("Voice recognition is not supported on this device.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.voiceRecognition = new SpeechRecognition();
    this.voiceRecognition.continuous = true;
    this.voiceRecognition.interimResults = false;
    this.voiceRecognition.lang = "en-US";

    this.voiceRecognition.onstart = () => {
      this.isListening = true;
      this.elements.listeningPulse.classList.add("active");
      this.elements.voiceStatus.textContent = "Listening for wake word...";
      this.elements.voiceToggle.classList.add("listening");
      this.elements.voiceToggle.innerHTML = '<span class="voice-icon">🔴</span><span class="voice-text">Stop Listening</span>';
    };

    this.voiceRecognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript.toLowerCase();
      }
      if (transcript) {
        const wakeDetected = this.wakeWords.some((word) => transcript.includes(word));
        if (wakeDetected) {
          let command = transcript;
          this.wakeWords.forEach((word) => (command = command.replace(word, "").trim()));
          if (command.length === 0) {
            this.speak("Yes? How can I assist?");
            return;
          }
          this.processVoiceCommand(command);
        }
      }
    };

    this.voiceRecognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    this.voiceRecognition.onend = () => {
      if (this.isListening) {
        try {
          this.voiceRecognition.start();
        } catch (e) {
          console.error("Restart failed:", e);
        }
      }
    };
  }

  async initializeSystem() {
    this.setupVoiceRecognition();
  }

  processVoiceCommand(command) {
    console.log("Processing command:", command);
    this.aiEngine.generateResponse(command, [], "POLICING").then((response) => {
      this.addMessage("assistant", response);
      this.speak(response);
    });
  }

  speak(text) {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not available");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }

  addActivity(message, icon) {
    const log = this.elements.activityLog;
    if (!log) return;
    const div = document.createElement("div");
    div.className = "activity-item";
    div.innerHTML = `<div class="activity-icon">${icon}</div><div class="activity-content"><div class="activity-text">${message}</div><div class="activity-time">${new Date().toLocaleTimeString()}</div></div>`;
    log.prepend(div);
    while (log.children.length > 8) {
      log.removeChild(log.lastChild);
    }
  }

  addMessage(type, text) {
    const log = this.elements.conversationLog;
    if (!log) return;
    const message = document.createElement("div");
    message.className = `message ${type}`;
    message.innerHTML = `<div class="message-avatar">${type === "user" ? "👤" : "🤖"}</div><div class="message-content"><div class="message-text">${text}</div><div class="message-time">${new Date().toLocaleTimeString()}</div></div>`;
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 10) log.removeChild(log.firstChild);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.guardianX = new GuardianXAssistant();
  console.log("Guardian X Assistant initialized");
});
