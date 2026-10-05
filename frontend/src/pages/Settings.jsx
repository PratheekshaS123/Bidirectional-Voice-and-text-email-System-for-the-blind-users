
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./Settings.css";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [status, setStatus] = useState("Waiting...");

  const [volumePercent, setVolumePercent] = useState(0);
  const [brightnessPercent, setBrightnessPercent] = useState(0);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasSpokenRef = useRef(false);

  const flowRef = useRef({
    step: "main",
  });

  const navigate = useNavigate(); // 👈 Redirect to menu

  // ---------- SPEAK ----------
  const speak = (text, callback) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";

    utter.onend = () => {
      if (callback) callback();
    };

    window.speechSynthesis.speak(utter);
  };

  // ---------- LISTEN ----------
  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.start();

    timeoutRef.current = setTimeout(() => {
      recognition.stop();
      hasSpokenRef.current = false;
      speakMainMenu();
    }, 10000);
  };

  const stopListening = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // ---------- MAIN MENU ----------
  const speakMainMenu = () => {
    if (hasSpokenRef.current) return;

    hasSpokenRef.current = true;

    speak(
      "Welcome to the settings page. Do you want to adjust volume or brightness? Please say volume or brightness.",
      () => {
        setStatus("Listening...");
        startListening();
      }
    );
  };

  // ---------- APPLY VOLUME ----------
  const applyVolume = async (percent) => {
    setVolumePercent(percent);
    setStatus("Applying volume...");

    await axios.post("http://localhost:5000/settings/set-volume", {
      volume: percent,
    });

    speak(`Volume set to ${percent} percent.`, () => {
      flowRef.current.step = "askBrightness";
      hasSpokenRef.current = false;

      speak("Do you want to adjust brightness? Please say yes or no.", () => {
        startListening();
      });
    });
  };

  // ---------- APPLY BRIGHTNESS ----------
  const applyBrightness = async (percent) => {
    setBrightnessPercent(percent);
    setStatus("Applying brightness...");

    await axios.post("http://localhost:5000/settings/set-brightness", {
      brightness: percent,
    });

    speak(
      `Brightness set to ${percent} percent. Settings updated successfully. Returning to menu.`,
      () => {
        setStatus("All settings applied.");
        navigate("/menu"); // 👈 Auto return to Menu Page
      }
    );
  };

  // ---------- HANDLE USER SPEECH ----------
  const handleSpeech = (text) => {
    const lower = text.toLowerCase().trim();
    setStatus("Heard: " + lower);

    const flow = flowRef.current;

    if (flow.step === "main") {
      if (lower.includes("volume")) {
        flow.step = "volumePercent";
        hasSpokenRef.current = false;

        speak("Please say the percentage for volume.", () => startListening());
        return;
      }

      if (lower.includes("brightness")) {
        flow.step = "brightnessPercent";
        hasSpokenRef.current = false;

        speak("Please say the percentage for brightness.", () =>
          startListening()
        );
        return;
      }

      speakMainMenu();
      return;
    }

    // Volume number
    if (flow.step === "volumePercent") {
      const number = parseInt(lower);

      if (!isNaN(number) && number >= 0 && number <= 100) {
        stopListening();
        applyVolume(number);
        return;
      }

      speak("Please say a number between 0 and 100 for volume.", () =>
        startListening()
      );
      return;
    }

    // Ask brightness?
    if (flow.step === "askBrightness") {
      if (lower.includes("yes")) {
        flow.step = "brightnessPercent";
        hasSpokenRef.current = false;

        speak("Please say the percentage for brightness.", () =>
          startListening()
        );
        return;
      }

      if (lower.includes("no")) {
        stopListening();
        speak("Okay. Settings updated successfully. Returning to menu.", () => {
          navigate("/menu"); // 👈 Go back if user says No
        });
        return;
      }

      speak("Please say yes or no.", () => startListening());
      return;
    }

    // Brightness number
    if (flow.step === "brightnessPercent") {
      const number = parseInt(lower);

      if (!isNaN(number) && number >= 0 && number <= 100) {
        stopListening();
        applyBrightness(number);
        return;
      }

      speak(
        "Please say a number between zero and one hundred for brightness.",
        () => startListening()
      );
      return;
    }
  };

  // ---------- INIT SPEECH ----------
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      stopListening();
      const text = event.results[0][0].transcript;
      handleSpeech(text);
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => stopListening();

    speakMainMenu();
  }, []);

  return (
    <div className="settings-page">
      <h2 className="center-title">Settings</h2>
      <p className="status-text">{status}</p>

      {/* UI SLIDERS */}
      <div className="settings-container">

        {/* Brightness */}
        <div className="setting-item">
          <div className="setting-icon">☀️</div>

          <div className="setting-slider-wrapper">
            <div className="setting-slider">
              <input
                type="range"
                min="0"
                max="100"
                value={brightnessPercent}
                disabled
              />
            </div>

            <div className="setting-percentage">{brightnessPercent}%</div>
          </div>
        </div>

        {/* Volume */}
        <div className="setting-item">
          <div className="setting-icon">🔊</div>

          <div className="setting-slider-wrapper">
            <div className="setting-slider">
              <input
                type="range"
                min="0"
                max="100"
                value={volumePercent}
                disabled
              />
            </div>

            <div className="setting-percentage">{volumePercent}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
