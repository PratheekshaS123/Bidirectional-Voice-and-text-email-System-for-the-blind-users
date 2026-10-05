
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { speak, listen, normalizeEmail } from "../components/voice";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [status, setStatus] = useState("Initializing voice signup...");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [animationState, setAnimationState] = useState("idle"); // "idle" | "speaking" | "listening"
  const navigate = useNavigate();
  const startedRef = useRef(false);

  // 🎙️ Speak with animation
  const speakWithAnim = async (text) => {
    setAnimationState("speaking");
    await speak(text);
    setAnimationState("idle");
  };

  // 🎧 Listen with animation
  const listenWithAnim = async (timeout = 10000) => {
    setAnimationState("listening");
    const result = await listen(timeout);
    setAnimationState("idle");
    return result;
  };

  // 🟢 Speak characters continuously with common domain handling
  const speakContinuously = async (text) => {
    if (!text) return;
    const commonDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
    let spokenText = "";
    let handled = false;

    for (const domain of commonDomains) {
      if (text.toLowerCase().endsWith(domain)) {
        const parts = text.split(domain);
        const username = parts[0];
        const chars = username.split("").map((char) => {
          if (char === "-") return "dash";
          if (char === "_") return "underscore";
          if (char === ".") return "dot";
          if (char === " ") return "";
          return char;
        });
        spokenText = chars.join(" ") + " " + domain;
        handled = true;
        break;
      }
    }

    if (!handled) {
      const chars = text.split("").map((char) => {
        if (char === "@") return "at";
        if (char === ".") return "dot";
        if (char === "-") return "dash";
        if (char === "_") return "underscore";
        if (char === " ") return "";
        return char;
      });
      spokenText = chars.join(" ");
    }

    await speakWithAnim(spokenText);
  };

  const spellOutPassword = (pass) => pass.split("").join("-");

  // 🟢 Ask until user confirms with "yes"
  const askUntilConfirmed = async (question, normalizeFn = null, isPassword = false) => {
    let confirmed = false;
    let value = "";

    while (!confirmed) {
      await speakWithAnim(question);
      let response = (await listenWithAnim(10000)) || "";

      if (!response) {
        setStatus("No input detected. Please respond.");
        continue;
      }

      if (normalizeFn) response = normalizeFn(response);
      if (isPassword) response = response.toLowerCase().replace(/\.$/, "");

      value = response;
      if (!isPassword) setEmail(value);
      else setPassword(value);

      await speakWithAnim("You said:");
      if (isPassword) await speakWithAnim(spellOutPassword(value));
      else await speakContinuously(value);

      await speakWithAnim("Is this correct?");
      const confirm = ((await listenWithAnim(5000)) || "").toLowerCase();
      if (confirm.includes("yes")) confirmed = true;
      else setStatus("Please repeat.");
    }
    return value;
  };

  const startVoiceSignup = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("Voice signup started...");

    try {
      await speakWithAnim("Welcome to the signup page.");

      const confirmedEmail = await askUntilConfirmed(
        "Please say your email address.",
        normalizeEmail,
        false
      );

      const confirmedPass = await askUntilConfirmed(
        "Please say your password.",
        null,
        true
      );

      await speakWithAnim("Do you want to signup?");
      const finalConfirm = ((await listenWithAnim(5000)) || "").toLowerCase();

      if (!finalConfirm.includes("yes")) {
        setStatus("Signup cancelled by user.");
        await speakWithAnim("Signup cancelled.");
        return;
      }

      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        email: confirmedEmail,
        password: confirmedPass,
      });

      if (res.data.success) {
        setStatus(res.data.message || "Signup successful");
        await speakWithAnim("Signup successful. Redirecting to login page.");
        navigate("/login");
      } else {
        setStatus(res.data.message || "Signup failed");
        await speakWithAnim(res.data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setStatus("Voice signup failed");
      await speakWithAnim("Error during signup. Please try again.");
    }
  };

  useEffect(() => {
    startVoiceSignup();
  }, []);

  // 🎵 Animation renderer
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
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FF6B6B, #FFD93D)",
      }}
    >
      <style>
        {`
          .mic-pulse {
            font-size: 50px;
            color: #00FFCC;
            animation: pulse 1s infinite;
            margin-bottom: 20px;
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
            height: 40px;
            margin-bottom: 20px;
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
            50% { height: 40px; opacity: 1; }
          }
        `}
      </style>

      <div
        style={{
          background: "#0B0F34",
          padding: "40px",
          borderRadius: "20px",
          width: "360px",
          textAlign: "center",
          color: "white",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        <h2 style={{ marginBottom: "30px" }}>Signup Page</h2>
        {renderAnimation()}
        <input
          value={email}
          readOnly
          placeholder="Email"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#FFD9A5",
            fontSize: "14px",
          }}
        />
        <input
          value={password}
          readOnly
          placeholder="Password"
          type="text"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#C7EAFB",
            fontSize: "14px",
          }}
        />
        <p style={{ fontSize: "12px", color: "#AAA" }}>{status}</p>
      </div>
    </div>
  );
}
