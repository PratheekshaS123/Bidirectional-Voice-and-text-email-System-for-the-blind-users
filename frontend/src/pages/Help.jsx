
import React, { useEffect, useRef } from "react";
import "./Help.css";
import { useNavigate } from "react-router-dom";

export default function Help() {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  // 🔊 Speak function (with auto-stop + clean)
  const speak = (text, rate = 1) =>
    new Promise((resolve) => {
      window.speechSynthesis.cancel(); // prevent overlap

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-IN";
      utter.rate = rate;

      utter.onend = () => {
        resolve();
      };

      window.speechSynthesis.speak(utter);
    });

  // 🎤 Listen function (clean start)
  const listen = () =>
    new Promise((resolve) => {
      if (!("webkitSpeechRecognition" in window)) {
        alert("Speech recognition not supported");
        resolve("");
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript.toLowerCase();
        resolve(result);
      };

      recognition.onerror = () => resolve("");

      recognition.start();
      recognitionRef.current = recognition;
    });

  // 🔁 Ask next action
  const askNext = async () => {
    await speak("Do you want to read again or go to menu?");
    const response = await listen();

    if (response.includes("read again") || response.includes("again")) {
      await speak("Reading again.");
      playHelp();
    } else if (response.includes("menu")) {
      await speak("Returning to menu page.");
      navigate("/menu");
    } else {
      await speak("Sorry, I did not understand.");
      askNext();
    }
  };

  // 📢 Speak the help content
  const playHelp = async () => {
    const detailedInfo = `
      Welcome to the help page.

      Here are the details about all voice commands.

      Login: Use this command to log into your email account. The system will ask for your email and password. Use this when you already have an account.

      Signup: Use this command to create a new account. The system will ask for your  email and password.

      Compose: This command allows you to write a new email. You will speak recipient email, subject, and body of the message. The system will then ask if you want to send the email.

      Inbox: This command opens your inbox and reads your latest  emails. You can choose to read unread email by saying unread and search specific email by saying search.

      Unread: This command reads only your new unread emails. While reading, you can say stop, read again, menu, or logout.

      Sent: This command opens your sent emails so you can hear emails you have already sent.

      Search: Use this command to find an email by speaking a sender email address. The system will read all matching emails.

      Settings: This command opens the settings page. You can adjust volume and brightness by voice. The system will ask for percentage numbers.

      Logout: This command safely logs you out and takes you back to the login page.

      Thank you.
   `;
    await speak(detailedInfo);
    askNext();
  };

  // 🎧 Speak once on page load
  useEffect(() => {
    playHelp();
  }, []);

  return (
    <div className="help-page">
      <h2 className="help-title">Help - Voice Commands</h2>

      <div className="help-box">
        <h3>Available Commands</h3>

        <ul className="help-list">
          <li><span className="emoji">🔑</span> <strong>Login</strong> — Access your account</li>
          <li><span className="emoji">📝</span> <strong>Signup</strong> — Create a new account</li>
          <li><span className="emoji">✉️</span> <strong>Compose</strong> — Write & send an email</li>
          <li><span className="emoji">📥</span> <strong>Inbox</strong> — View all received emails</li>
          <li><span className="emoji">📥</span><strong>Unread</strong> -Reads only new unread emails</li>
          <li><span className="emoji">📤</span> <strong>Sent</strong> — View sent emails</li>
          <li><span className="emoji">⚙️</span> <strong>Settings</strong> — Adjust volume & brightness</li>
          <li><span className="emoji">📋</span> <strong>Logout</strong> — Exit your account</li>
          <li><span className="emoji">🏠</span> <strong>Home</strong> — Go to home page</li>
        </ul>
      </div>
    </div>
  );
}
