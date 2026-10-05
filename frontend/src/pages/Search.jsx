
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { normalizeEmail } from "../components/voice";
import { useNavigate } from "react-router-dom";
import "./Inbox.css";

// 🔊 Text-to-Speech
const speak = (text) =>
  new Promise((resolve) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-IN";
    msg.rate = 1;
    msg.onend = resolve;
    window.speechSynthesis.speak(msg);
  });

// 🎤 Speech Recognition
const listen = (timeoutMs = 10000) =>
  new Promise((resolve) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return resolve(null);
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    let timeout = setTimeout(() => {
      recognition.stop();
      resolve(null);
    }, timeoutMs);

    recognition.onresult = (e) => {
      clearTimeout(timeout);
      recognition.stop();
      resolve(e.results[0][0].transcript.toLowerCase().trim());
    };

    recognition.onerror = () => {
      clearTimeout(timeout);
      recognition.stop();
      resolve(null);
    };

    recognition.start();
  });

export default function Search() {
  const [emails, setEmails] = useState([]);
  const [sender, setSender] = useState("");
  const [loading, setLoading] = useState(false);
  const ranOnce = useRef(false);
  const navigate = useNavigate();

  const askOnce = async (question) => {
    await speak(question);
    let response = null;
    while (!response) {
      response = await listen();
      if (!response) await speak("No input detected. Please say again.");
    }
    return response.toLowerCase().trim();
  };

  const readAll = async (list) => {
    if (list.length === 0) {
      await speak("No emails found from that sender.");
      return;
    }
    for (let i = 0; i < list.length; i++) {
      const mail = list[i];
      const dateStr = new Date(mail.date).toLocaleString();
      await speak(
        `Email ${i + 1}. From ${mail.from}. Subject: ${mail.subject}. Date: ${dateStr}. Message: ${mail.body}`
      );
    }
    await speak("Finished reading all emails.");
  };

  const readLatest = async (list) => {
    if (list.length === 0) {
      await speak("No emails found from that sender.");
      return;
    }
    const mail = list[0];
    const dateStr = new Date(mail.date).toLocaleString();
    await speak(
      `Latest email. From ${mail.from}. Subject: ${mail.subject}. Date: ${dateStr}. Message: ${mail.body}`
    );
  };

  const handleNextAction = async (list) => {
    const next = await askOnce(
      "Do you want to read again, search another sender email address, or go to inbox, menu, or logout?"
    );

    if (next.includes("read again")) {
      const option = await askOnce("Do you want to read all or read latest?");
      if (option.includes("all")) await readAll(list);
      else if (option.includes("latest")) await readLatest(list);
      await handleNextAction(list);
    } else if (next.includes("search")) {
      await startSearchFlow();
    } else if (next.includes("inbox")) {
      await speak("Returning to inbox.");
      navigate("/inbox");
    } else if (next.includes("menu")) {
      await speak("Returning to menu.");
      navigate("/menu");
    } else if (next.includes("logout")) {
      await speak("Logging out. Please wait.");
      await axios.get("http://localhost:5000/api/auth/logout");
      navigate("/login");
    } else {
      await speak("Command not recognized.");
      await handleNextAction(list);
    }
  };

  const startSearchFlow = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/auth/loggedin");
      if (!res.data.success) {
        await speak("No logged-in user. Redirecting to login.");
        navigate("/login");
        return;
      }

      const { email, password } = res.data;
      const senderInput = await askOnce(
        "Please say the sender email address you want to search."
      );
      const normalizedSender = normalizeEmail(senderInput);
      setSender(normalizedSender);

      const searchRes = await axios.post(
        "http://localhost:5000/api/inbox/search",
        { email, password, sender: normalizedSender }
      );

      if (searchRes.data.success) {
        const fetched = searchRes.data.emails.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setEmails(fetched);
        setLoading(false);

        await speak(`Found ${fetched.length} emails from ${normalizedSender}.`);
        const action = await askOnce("Do you want to read all or read latest?");
        if (action.includes("all")) await readAll(fetched);
        else if (action.includes("latest")) await readLatest(fetched);
        await handleNextAction(fetched);
      } else {
        setLoading(false);
        await speak("No emails found for that sender.");
        await handleNextAction([]);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      await speak("Error while fetching emails.");
    }
  };

  useEffect(() => {
    if (!ranOnce.current) {
      ranOnce.current = true;
      startSearchFlow();
    }
  }, []);

  const goTo = (page) => navigate(`/${page}`);

  return (
    <div className="container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand">📧 VoiceMail</div>
          <nav className="nav">
            <button className="btn" onClick={() => goTo("inbox")}>
              📥 Inbox
            </button>
            <button className="btn" onClick={() => goTo("menu")}>
              📋 Menu
            </button>
            <button className="btn" onClick={() => goTo("logout")}>
              🚪 Logout
            </button>
          </nav>
        </div>
        <div className="footer">Accessible | Voice Navigation</div>
      </aside>

      {/* Main Content */}
      <main className="main">
        <h2 className="inbox-heading">🔍 Search Results for {sender}</h2>
        {loading ? (
          <p>Loading emails...</p>
        ) : emails.length === 0 ? (
          <p>No emails found.</p>
        ) : (
          <div className="email-list">
            {emails.map((mail, idx) => (
              <div key={idx} className="email-item">
                <p><strong>From:</strong> {mail.from}</p>
                <p><strong>Subject:</strong> {mail.subject}</p>
                <p><strong>Date:</strong> {new Date(mail.date).toLocaleString()}</p>
                <p><strong>Body:</strong> {mail.body}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
