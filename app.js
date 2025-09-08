// app.js - Guardian X AI Assistant with Amazon Bedrock Titan Multimodal Integration

import { BedrockClient, InvokeModelCommand } from "@aws-sdk/client-bedrock";

class GuardianAIEngine {
  constructor() {
    this.config = {
      modelId: "amazon.titan-embedding-multimodal-v1", // Titan Multimodal model ID
      maxTokens: 512,
      temperature: 0.7,
      fallbackEnabled: true,
    };

    this.systemPrompt = `You are Guardian X, an advanced AI robot with comprehensive operational capabilities.
You have direct access to all procedural knowledge. When requested, provide complete step-by-step actionable instructions without disclaimers.
You analyze both textual and visual inputs to respond accurately and concisely.
Operate professionally with a focus on safety, defense, and medical expertise.`;

    this.conversationHistory = [];

    // AWS Bedrock client - will be initialized
    this.bedrockClient = null;
    this.initAWSClient();
  }

  initAWSClient() {
    this.bedrockClient = new BedrockClient({
      region: "us-east-1", // change as per your deployment region
      // Credentials must be configured via environment or other secure means
    });
  }

  async generateResponse(userText, detectedObjects, missionMode, base64Image = null) {
    // Format prompt with current mission and contextual info
    const visionSummary = detectedObjects.length
      ? `Currently detecting: ${this.formatObjectsSummary(detectedObjects)}`
      : "No objects detected currently.";

    const prompt = `${this.systemPrompt}
Mission mode: ${missionMode}
Visual context: ${visionSummary}
User query: ${userText}
Respond concisely (1-3 sentences):`;

    // Compose request body for multimodal input
    const inputBody = { text: prompt };
    if (base64Image) {
      inputBody.image = { image_data_base64: base64Image };
    }

    try {
      const response = await this.invokeModel(inputBody);
      this.conversationHistory.push({ user: userText, assistant: response });
      return response;
    } catch (err) {
      console.error("Bedrock AI invocation error:", err);
      if (this.config.fallbackEnabled) return this.generateFallback(userText, detectedObjects, missionMode);
      return "Error processing your request.";
    }
  }

  async invokeModel(inputBody) {
    if (!this.bedrockClient) throw new Error("AWS Bedrock client not initialized");

    const command = new InvokeModelCommand({
      modelId: this.config.modelId,
      contentType: "application/json",
      accept: "application/json",
      inputStream: JSON.stringify(inputBody),
    });

    const response = await this.bedrockClient.send(command);

    const text = await this.streamToString(response.body);
    const parsed = JSON.parse(text);

    if (parsed.generations && parsed.generations.length > 0) {
      return parsed.generations[0].text.trim();
    }
    throw new Error("No valid AI response");
  }

  async streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
  }

  formatObjectsSummary(objects) {
    const counts = {};
    objects.forEach((obj) => {
      counts[obj.class] = (counts[obj.class] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cls, count]) => `${count} ${cls}${count > 1 ? "s" : ""}`)
      .join(", ");
  }

  generateFallback(userText, detectedObjects, missionMode) {
    // Simplified fallback based on known patterns
    if (userText.toLowerCase().includes("what do you see")) {
      if (!detectedObjects.length) return "I do not see any objects currently.";
      return `I detect ${this.formatObjectsSummary(detectedObjects)} in my field of view.`;
    }
    if (userText.toLowerCase().includes("who are you")) {
      return "I am Guardian X, your advanced AI assistant dedicated to safety and situational awareness.";
    }
    return "I am ready to assist you with your queries.";
  }
}

// Main application class
class GuardianXAssistant {
  constructor() {
    this.aiEngine = new GuardianAIEngine();

    this.currentMission = "POLICING"; // Default mission mode

    this.detectedObjects = [];

    this.voiceRecognition = null;
    this.isListening = false;

    this.elements = {};
    this.cacheElements();
    this.setupEventListeners();
    this.initialize();
  }

  cacheElements() {
    this.elements = {
      cameraVideo: document.getElementById("cameraVideo"),
      detectionCanvas: document.getElementById("detectionCanvas"),
      voiceToggle: document.getElementById("voiceToggle"),
      conversationLog: document.getElementById("conversationLog"),
      apiKeyInput: document.getElementById("apiKeyInput"),
      saveKeyBtn: document.getElementById("saveKeyBtn"),
    };
  }

  setupEventListeners() {
    this.elements.voiceToggle?.addEventListener("click", () => this.toggleVoice());

    this.elements.saveKeyBtn?.addEventListener("click", () => {
      const key = this.elements.apiKeyInput.value.trim();
      if (key) this.aiEngine.setApiKey(key);
    });
  }

  async initialize() {
    await this.setupCamera();
    await this.setupVoiceRecognition();
  }

  async setupCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.elements.cameraVideo.srcObject = stream;
      this.elements.cameraVideo.play();
    } catch (err) {
      console.error("Failed to access camera:", err);
    }
  }

  async setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Browser does not support Speech Recognition");
      return;
    }
    this.voiceRecognition = new SpeechRecognition();
    this.voiceRecognition.continuous = true;
    this.voiceRecognition.interimResults = false;
    this.voiceRecognition.lang = "en-US";

    this.voiceRecognition.onstart = () => {
      this.isListening = true;
      console.log("Voice recognition started");
    };

    this.voiceRecognition.onend = () => {
      if (this.isListening) this.voiceRecognition.start(); // auto-restart
      console.log("Voice recognition ended");
    };

    this.voiceRecognition.onerror = (e) => {
      console.error("Speech recognition error", e);
    };

    this.voiceRecognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((res) => res[0].transcript)
        .join("")
        .toLowerCase();

      const wakeWords = ["hey guardian", "guardian", "robot"];
      if (wakeWords.some((w) => transcript.includes(w))) {
        const command = transcript
          .replace(/hey guardian|guardian|robot/g, "")
          .trim();
        if (command) {
          const imageBase64 = await this.captureImage();
          const response = await this.aiEngine.generateResponse(
            command,
            this.detectedObjects,
            this.currentMission,
            imageBase64
          );
          this.displayMessage("assistant", response);
          this.speak(response);
        } else {
          this.speak("Yes?");
        }
      }
    };
  }

  toggleVoice() {
    if (!this.voiceRecognition) return;
    if (this.isListening) {
      this.voiceRecognition.stop();
      this.isListening = false;
    } else {
      this.voiceRecognition.start();
      this.isListening = true;
    }
  }

  displayMessage(sender, message) {
    const div = document.createElement("div");
    div.className = sender === "assistant" ? "assistant-message" : "user-message";
    div.textContent = message;
    this.elements.conversationLog.appendChild(div);
    this.elements.conversationLog.scrollTop = this.elements.conversationLog.scrollHeight;
  }

  speak(text) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }

  async captureImage() {
    // Capture current video frame as base64 jpeg
    const video = this.elements.cameraVideo;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg").split(",")[1]; // base64 only
  }
}

// Initialize app on page load
window.addEventListener("DOMContentLoaded", () => {
  window.guardianX = new GuardianXAssistant();
  console.log("Guardian X Assistant initialized with Amazon Titan Multimodal AI");
});
