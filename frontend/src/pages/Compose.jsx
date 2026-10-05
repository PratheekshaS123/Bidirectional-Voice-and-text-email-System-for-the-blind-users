
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { speak, listen } from "../components/voice";
import "./Compose.css";

export default function Compose() {
  const [fromEmail, setFromEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const running = useRef(false);

  const normalizeEmail = (spoken) => {
    if (!spoken) return "";
    let email = spoken
      .toLowerCase()
      .replace(/\s+at\s+/g, "@")
      .replace(/\s+dot\s+/g, ".")
      .replace(/[-\s]/g, "")
      .replace(/[^a-z0-9@._]/g, "");
    return email.endsWith(".") ? email.slice(0, -1) : email;
  };

  // 🟢 Speak characters continuously with domain handling
  const speakContinuously = async (text) => {
    if (!text) return;
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    let spokenText = '';
    let handled = false;

    for (const domain of commonDomains) {
      if (text.toLowerCase().endsWith(domain)) {
        const parts = text.split(domain);
        const username = parts[0];
        const chars = username.split('').map((char) => {
          if (char === '-') return 'dash';
          if (char === '_') return 'underscore';
          if (char === '.') return 'dot';
          if (char === ' ') return '';
          return char;
        });
        spokenText = chars.join(' ') + ' ' + domain;
        handled = true;
        break;
      }
    }

    if (!handled) {
      const chars = text.split('').map((char) => {
        if (char === '@') return 'at';
        if (char === '.') return 'dot';
        if (char === '-') return 'dash';
        if (char === '_') return 'underscore';
        if (char === ' ') return '';
        return char;
      });
      spokenText = chars.join(' ');
    }

    await speak(spokenText);
  };

  const listenWithTimeout = async (timeoutMs = 10000) =>
    await Promise.race([listen(), new Promise((r) => setTimeout(() => r(null), timeoutMs))]);

  const askAndConfirm = async (question, updateFn, normalizeFn = (x) => x, isEmail = false) => {
    await speak(question);
    let answer = await listenWithTimeout(15000);
    if (!answer) return null;

    answer = normalizeFn(answer.trim());
    updateFn(answer);

    await speak("You said:");
    if (isEmail) await speakContinuously(answer);
    else await speak(answer);

    await speak("Say yes to confirm or no to repeat.");
    const confirm = (await listenWithTimeout(10000))?.toLowerCase();
    if (confirm?.includes("yes")) return answer;
    else return await askAndConfirm(question, updateFn, normalizeFn, isEmail);
  };

  const askRecipients = async () => {
    let allRecipients = [];
    let addMore = true;

    while (addMore) {
      const rec = await askAndConfirm(
        "Please say recipient email.",
        (val) => setRecipients([...allRecipients, val]),
        normalizeEmail,
        true // email flag
      );
      allRecipients.push(rec);
      setRecipients([...allRecipients]);

      await speak(`You said ${rec}. Do you want to add another recipient? Say yes or no.`);
      const more = (await listenWithTimeout(10000))?.toLowerCase();
      addMore = more?.includes("yes");
    }

    return allRecipients;
  };

  const askSubject = async () => {
    const subj = await askAndConfirm("Please say subject.", setSubject);
    return subj;
  };

  const askBody = async () => {
    let fullBody = "";
    let addMore = true;

    while (addMore) {
      const part = await askAndConfirm(
        "Please say body of the email.",
        (val) => setBody(fullBody + (fullBody ? " " : "") + val)
      );
      fullBody += (fullBody ? " " : "") + part;
      setBody(fullBody);

      await speak("Do you want to add more to the body? Say yes or no.");
      const more = (await listenWithTimeout(10000))?.toLowerCase();
      addMore = more?.includes("yes");
    }

    return fullBody;
  };

  const sendEmail = async (toList, subjectVal, bodyVal) => {
    if (!toList.length || !subjectVal || !bodyVal) {
      await speak("Recipient, subject, or body missing. Cannot send email.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/compose/send", {
        fromEmail,
        password: appPassword,
        to: toList.join(","),
        subject: subjectVal,
        body: bodyVal,
      });

      if (res.data.success) {
        await speak(`Email sent successfully to ${toList.join(", ")}`);
        window.location.href = "/sent";
      } else {
        await speak("Failed to send email. " + (res.data.message || ""));
      }
    } catch (err) {
      console.error(err);
      await speak("Error sending email. Please check credentials or internet.");
    }
  };

  const composeEmail = async () => {
    if (running.current) return;
    running.current = true;

    const recList = await askRecipients();
    const subjectVal = await askSubject();
    const bodyVal = await askBody();

    let sendConfirmed = false;
    while (!sendConfirmed) {
      await speak("Do you want to send the email now? Say yes or no.");
      const ans = (await listenWithTimeout(10000))?.toLowerCase();
      if (!ans) continue;
      if (ans.includes("yes")) {
        await sendEmail(recList, subjectVal, bodyVal);
        sendConfirmed = true;
      } else if (ans.includes("no")) {
        await speak("Email not sent.");
        sendConfirmed = true;
      }
    }

    running.current = false;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/loggedin");
        if (!res.data.success) {
          await speak("No logged-in user. Redirecting to login.");
          window.location.href = "/login";
          return;
        }
        setFromEmail(res.data.email);
        setAppPassword(res.data.password);
        await composeEmail();
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  return (
    <div className="container">
      <div className="sidebar">
        <div className="menu">
          <button onClick={() => (window.location.href = "/menu")}>Menu</button>
          <button onClick={() => (window.location.href = "/inbox")}>Inbox</button>
          <button onClick={() => (window.location.href = "/sent")}>Sent</button>
        </div>
      </div>

      <div className="main">
        <div className="compose-box">
          <h2 className="compose-heading">📧 Compose Email</h2>

          <label>From:</label>
          <input value={fromEmail} readOnly />

          <label>App Password:</label>
          <input value={appPassword} readOnly type="password" />

          <label>Recipients:</label>
          <textarea value={recipients.join(", ")} readOnly />

          <label>Subject:</label>
          <input value={subject} readOnly />

          <label>Body:</label>
          <textarea value={body} readOnly />
        </div>
      </div>
    </div>
  );
}
