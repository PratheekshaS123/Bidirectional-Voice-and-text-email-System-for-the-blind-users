
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/voiceimage.jpg";

export default function Home() {
  const navigate = useNavigate();
  const hasRun = useRef(false);
  const [animationState, setAnimationState] = useState("idle"); // "idle" | "speaking" | "listening"

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const speakAndListen = async () => {
      // 🎙️ Start speaking animation
      setAnimationState("speaking");
      const utter = new SpeechSynthesisUtterance(
        "Welcome to the Bidirectional Voice Based System. Do you want to signup or login?"
      );
      utter.lang = "en-US";

      speechSynthesis.speak(utter);

      utter.onend = () => {
        // Stop speaking animation, start listening
        setAnimationState("listening");

        const recognition =
          new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        let responded = false;
        recognition.start();

        // ⏱️ Stop after 10s if no input
        const timeoutId = setTimeout(() => {
          if (!responded) {
            recognition.stop();
            setAnimationState("idle");
            alert("No response detected. Please reload and try again.");
          }
        }, 10000);

        recognition.onresult = (event) => {
          responded = true;
          clearTimeout(timeoutId);
          setAnimationState("idle");

          const command = event.results[0][0].transcript.toLowerCase();

          if (command.includes("signup") || command.includes("sign up")) {
            navigate("/signup");
          } else if (command.includes("login")) {
            navigate("/login");
          } else {
            alert("Command not recognized. Please reload and try again.");
          }
        };

        recognition.onerror = (err) => {
          clearTimeout(timeoutId);
          console.error("Speech recognition error:", err);
          setAnimationState("idle");
          alert("Speech recognition error. Please reload the page.");
        };

        recognition.onend = () => {
          clearTimeout(timeoutId);
          setAnimationState("idle");
        };
      };
    };

    speakAndListen();
  }, [navigate]);

  const goToLogin = () => {
    navigate("/login");
  };

  // 🎵 Animation render helper
  const renderAnimation = () => {
    if (animationState === "listening") {
      return <div className="mic-pulse">🎤</div>;
    }
    if (animationState === "speaking") {
      return (
        <div className="voice-wave">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      onClick={goToLogin}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #6B73FF, #000DFF)",
        color: "white",
        textAlign: "center",
        cursor: "pointer",
        padding: "20px",
      }}
    >
      <style>
        {`
          .mic-pulse {
            font-size: 60px;
            color: #00FFCC;
            animation: pulse 1s infinite;
            margin-bottom: 30px;
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); opacity: 0.7; }
          }

          .voice-wave {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            gap: 5px;
            height: 50px;
            margin-bottom: 30px;
          }

          .voice-wave .bar {
            width: 6px;
            height: 10px;
            background: #00FFAA;
            border-radius: 3px;
            animation: wave 1s infinite ease-in-out;
          }

          .voice-wave .bar:nth-child(1) { animation-delay: 0s; }
          .voice-wave .bar:nth-child(2) { animation-delay: 0.1s; }
          .voice-wave .bar:nth-child(3) { animation-delay: 0.2s; }
          .voice-wave .bar:nth-child(4) { animation-delay: 0.3s; }
          .voice-wave .bar:nth-child(5) { animation-delay: 0.4s; }

          @keyframes wave {
            0%, 100% { height: 10px; opacity: 0.6; }
            50% { height: 45px; opacity: 1; }
          }
        `}
      </style>

      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        Welcome to the Bidirectional Voice Based System
      </h1>

      {renderAnimation()}

      <img
        src={logo}
        alt="VoiceMail"
        style={{
          width: "300px",
          height: "300px",
          borderRadius: "100%",
          marginBottom: "30px",
          border: "3px solid white",
          objectFit: "cover",
          boxShadow: "0 0 25px rgba(255,255,255,0.3)",
        }}
      />

      <p style={{ fontSize: "16px", color: "#EEE" }}>
        
      </p>
    </div>
  );
}
