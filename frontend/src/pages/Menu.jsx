

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

export default function Menu() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Status: Waiting for input…");
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasSpokenRef = useRef(false);

  const options = [
    { name: "Inbox", emoji: "📥", commands: ["inbox"], page: "/inbox" },
    { name: "Compose", emoji: "✉️", commands: ["compose"], page: "/compose" },
    { name: "Settings", emoji: "⚙️", commands: ["settings"], page: "/settings" },
    { name: "Help", emoji: "❓", commands: ["help"], page: "/help" },
    { name: "Sent", emoji: "📤", commands: ["sent", "send"], page: "/sent" },
    { name: "Login", emoji: "🔑", commands: ["login"], page: "/login" },
    { name: "Logout", emoji: "📋", commands: ["logout"], page: "/logout" },
    { name: "Signup", emoji: "📝", commands: ["signup"], page: "/signup" },
    { name: "Home", emoji: "🏠", commands: ["home"], page: "/" },
  ];

  const speak = (text, callback) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";

    const wave = document.getElementById("voiceWave");
    if (wave) wave.style.display = "flex";

    utter.onend = () => {
      if (wave) wave.style.display = "none";
      if (callback) callback();
    };

    speechSynthesis.speak(utter);
  };

  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const mic = document.getElementById("micPulse");
    if (mic) mic.style.display = "flex";

    recognition.start();
    timeoutRef.current = setTimeout(() => {
      recognition.stop();
      if (mic) mic.style.display = "none";
      setStatus("⏳ No response detected. Repeating options...");
      hasSpokenRef.current = false;
      speakOptionsOnce();
    }, 10000);
  };

  const stopListening = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const mic = document.getElementById("micPulse");
    if (mic) mic.style.display = "none";
  };

  const goTo = (page) => {
    stopListening();
    navigate(page);
  };

  const speakOptionsOnce = () => {
    if (!hasSpokenRef.current) {
      const optionsText =
        "Welcome to the Voice Based Email System. Available options are: Inbox, Compose, Settings, Help, Sent, Login, Signup, and Logout. Please say your choice.";
      hasSpokenRef.current = true;
      speak(optionsText, () => {
        setStatus("🎙️ Listening for your command...");
        startListening();
      });
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("❌ Speech Recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => setStatus("🎤 Listening...");
    recognition.onresult = (event) => {
      stopListening();
      const command = event.results[0][0].transcript.toLowerCase().trim();
      setStatus("Heard: " + command);

      const match = options.find((opt) =>
        opt.commands.some((word) => command.includes(word))
      );

      if (match) {
        goTo(match.page);
      } else {
        setStatus("Command not recognized. Please try again.");
        hasSpokenRef.current = false;
        speakOptionsOnce();
      }
    };

    recognition.onerror = (event) => {
      stopListening();
      setStatus("❌ Voice recognition error: " + event.error);
    };

    recognition.onend = () => stopListening();

    speakOptionsOnce();
  }, []);

  return (
    <div>
      <aside className="sidebar">
        <div>
          <div className="brand">📧 VoiceMail</div>
          <nav className="nav">
            {options.map((opt) => (
              <button
                key={opt.name}
                className="btn"
                onClick={() => goTo(opt.page)}
              >
                <span>{opt.emoji}</span>
                {opt.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="footer">Accessible | Voice-only navigation</div>
      </aside>

      <main className="content">
        <div className="center-message">Welcome to the Voice Based Email.</div>

        {/* 🎙️ Pulsating Mic when Listening */}
        <div id="micPulse" className="mic-pulse">
          <div className="mic-icon">🎙️</div>
        </div>

        {/* 🗣️ Voice Wave when Speaking */}
        <div id="voiceWave" className="voice-wave">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* ✨ Smooth Status */}
        <p id="status" className="status-text">{status}</p>
      </main>
    </div>
  );
}
