
import React, { useEffect, useState, useRef } from "react";
import { speak, listen } from "../components/voice";
import { useNavigate } from "react-router-dom";
import "./Logout.css";

export default function Logout() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Waiting...");
  const navigate = useNavigate();
  const processing = useRef(false);

  useEffect(() => {
    startFlow();
  }, []);

  // ---------------------------------------------------
  // CLEAN EMAIL
  // ---------------------------------------------------
  const cleanEmail = (txt) => {
    if (!txt) return "";
    let e = txt.toLowerCase();
    e = e.replace(/ at /g, "@");
    e = e.replace(/ dot /g, ".");
    e = e.replace(/\s+/g, "");
    return e;
  };

  // ---------------------------------------------------
  // SPELL EMAIL LETTER BY LETTER
  // ---------------------------------------------------
  const spellEmail = async (email) => {
    const spelled = email.split("").join(" ");
    await speak(`You said the email: ${spelled}`);
  };

  // ---------------------------------------------------
  // MAIN FLOW
  // ---------------------------------------------------
  const startFlow = async () => {
    if (processing.current) return;
    processing.current = true;

    // STEP 1: Ask user for email
    await speak("Please say your email address to logout");
    setStatus("Listening for your email...");

    const raw = await listen();

    if (!raw || raw.trim() === "") {
      await speak("Sorry, I did not hear anything. Please say your email address again.");
      processing.current = false;
      return startFlow();
    }

    const finalEmail = cleanEmail(raw);
    setEmail(finalEmail);

    // STEP 2: Spell email
    await spellEmail(finalEmail);

    // Important: WAIT before listening (browser cannot handle immediate listen)
    await new Promise((resolve) => setTimeout(resolve, 600));

    // STEP 3: Ask for confirmation
    await speak("Do you want to logout with this account? Please say yes or no.");
    setStatus("Waiting for confirmation...");

    const confirmation = await listen();

    console.log("User said:", confirmation); // DEBUG HELP

    if (!confirmation || confirmation.trim() === "") {
      await speak("I did not understand. Please say yes or no.");
      processing.current = false;
      return startFlow();
    }

    const ans = confirmation.toLowerCase();

    // Accept multiple confirmations
    const yesWords = ["yes", "s", "y", "yeah", "yup", "ok", "okay", "correct"];

    if (yesWords.some((w) => ans.includes(w))) {
      setStatus("Logout successful");
      await speak("Logout successful. Returning to login page.");

      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (ans.includes("no")) {
      await speak("Okay, let's try again. Please say your email address.");
      processing.current = false;
      return startFlow();
    }

    // If unclear
    await speak("Sorry, I did not understand. Please say yes or no.");
    processing.current = false;
    return startFlow();
  };

  return (
    <div className="logout-container">
      <h1 className="logout-title">Logout</h1>

      <div className="logout-box">
        <p className="logout-status">{status}</p>

        <p className="logout-email">
          <strong>Email:</strong> {email || "Listening..."}
        </p>
      </div>
    </div>
  );
}
