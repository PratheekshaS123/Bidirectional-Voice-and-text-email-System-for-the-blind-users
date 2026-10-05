
// // import React, { useEffect, useState, useRef } from "react";
// // import axios from "axios";
// // import { useNavigate } from "react-router-dom";
// // import "./Inbox.css";

// // /* -------------------- TEXT TO SPEECH -------------------- */
// // const speak = (text) =>
// //   new Promise((resolve) => {
// //     const msg = new SpeechSynthesisUtterance(text);
// //     msg.lang = "en-IN";
// //     msg.rate = 1;
// //     msg.pitch = 1;
// //     msg.onend = resolve;
// //     window.speechSynthesis.cancel();
// //     window.speechSynthesis.speak(msg);
// //   });

// // /* -------------------- SPEECH TO TEXT -------------------- */
// // const listen = (timeoutMs = 10000) =>
// //   new Promise((resolve) => {
// //     const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
// //     if (!SR) return resolve("");

// //     const rec = new SR();
// //     rec.lang = "en-IN";

// //     const timeout = setTimeout(() => {
// //       try {
// //         rec.stop();
// //       } catch {}
// //       resolve("");
// //     }, timeoutMs);

// //     rec.onresult = (e) => {
// //       clearTimeout(timeout);
// //       try {
// //         rec.stop();
// //       } catch {}
// //       resolve(e.results[0][0].transcript.toLowerCase().trim());
// //     };

// //     rec.onerror = () => {
// //       clearTimeout(timeout);
// //       resolve("");
// //     };

// //     rec.start();
// //   });

// // export default function Unread() {
// //   const [emails, setEmails] = useState([]);
// //   const [fromEmail, setFromEmail] = useState("");
// //   const [loading, setLoading] = useState(true);

// //   const credsRef = useRef(null);
// //   const stopRequested = useRef(false);
// //   const stopListener = useRef(null);
// //   const ranOnce = useRef(false);
// //   const emailsRef = useRef([]);

// //   const navigate = useNavigate();

// //   /* -------------------- ASK FUNCTION -------------------- */
// //   const ask = async (q) => {
// //     await speak(q);
// //     let ans = "";
// //     for (let i = 0; i < 2 && !ans; i++) {
// //       ans = await listen(10000);
// //       if (!ans) await speak("Please say again.");
// //     }
// //     return ans;
// //   };

// //   /* -------------------- STOP LISTENER -------------------- */
// //   const startStopListener = () => {
// //     const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
// //     if (!SR) return;

// //     const rec = new SR();
// //     rec.lang = "en-IN";

// //     rec.onresult = async (e) => {
// //       const command = e.results[0][0].transcript.toLowerCase();
// //       if (command.includes("stop")) {
// //         stopRequested.current = true;
// //         window.speechSynthesis.cancel();
// //         rec.stop();
// //         stopStopListener();
// //         await speak("Reading stopped.");
// //         await afterStopMenu();
// //       }
// //     };

// //     rec.onerror = () => {
// //       rec.stop();
// //     };

// //     rec.start();
// //     stopListener.current = rec;
// //   };

// //   const stopStopListener = () => {
// //     if (stopListener.current) {
// //       try {
// //         stopListener.current.stop();
// //       } catch {}
// //       stopListener.current = null;
// //     }
// //   };

// //   /* -------------------- MARK AS READ -------------------- */
// //   const markMultipleAsRead = async (seqnos = []) => {
// //     if (!credsRef.current || seqnos.length === 0) return;
// //     try {
// //       await axios.post("http://localhost:5000/api/inbox/markAsRead", {
// //         email: credsRef.current.email,
// //         password: credsRef.current.password,
// //         seqnos,
// //       });
// //     } catch (e) {
// //       console.log("markAsRead error:", e);
// //     }
// //   };

// //   /* -------------------- REMOVE EMAIL FROM STATE -------------------- */
// //   const removeFromUnread = (seqno) => {
// //     setEmails((prev) => {
// //       const updated = prev.filter((mail) => mail.seqno !== seqno);
// //       emailsRef.current = updated;
// //       return updated;
// //     });
// //   };

// //   /* -------------------- READ EMAIL -------------------- */
// //   const readEmail = async (mail, index) => {
// //     stopRequested.current = false;
// //     startStopListener();

// //     const safeSpeak = async (text) => {
// //       if (!stopRequested.current) await speak(text);
// //     };

// //     const dateStr = new Date(mail.date).toLocaleString();

// //     await safeSpeak(`Reading email number ${index + 1}`);
// //     if (stopRequested.current) return;

// //     await safeSpeak(`From: ${mail.from}`);
// //     if (stopRequested.current) return;

// //     await safeSpeak(`Subject: ${mail.subject || "No subject"}`);
// //     if (stopRequested.current) return;

// //     await safeSpeak(`Date: ${dateStr}`);
// //     if (stopRequested.current) return;

// //     await safeSpeak(mail.body || "No content available");

// //     /* ---------------- STOP LISTENER & REMOVE EMAIL ---------------- */
// //     stopStopListener(); // microphone OFF
// //     await markMultipleAsRead([mail.seqno]);
// //     removeFromUnread(mail.seqno);

// //     /* ---------------- POST-READ MENU ---------------- */
// //     await afterFullReadMenu();
// //   };

// //   /* -------------------- MENU AFTER FULL READ -------------------- */
// //   const afterFullReadMenu = async () => {
// //     const ans = await ask(
// //       "Do you want to read another unread email, or go to inbox, menu or logout?"
// //     );

// //     if (ans.includes("another")) return readOptions();
// //     if (ans.includes("inbox")) return navigate("/inbox");
// //     if (ans.includes("menu")) return navigate("/menu");
// //     if (ans.includes("logout")) {
// //       await axios.get("http://localhost:5000/api/auth/logout");
// //       return navigate("/login");
// //     }

// //     await speak("Sorry, I did not understand.");
// //     await afterFullReadMenu();
// //   };

// //   /* -------------------- MENU WHEN STOP COMMAND -------------------- */
// //   const afterStopMenu = async () => {
// //     const ans = await ask(
// //       "Do you want to read again, go to inbox, menu or logout?"
// //     );

// //     if (ans.includes("read again")) return readOptions();
// //     if (ans.includes("inbox")) return navigate("/inbox");
// //     if (ans.includes("menu")) return navigate("/menu");
// //     if (ans.includes("logout")) {
// //       await axios.get("http://localhost:5000/api/auth/logout");
// //       return navigate("/login");
// //     }

// //     await speak("Sorry, please repeat.");
// //     await afterStopMenu();
// //   };

// //   /* -------------------- READ ALL / LATEST -------------------- */
// //   const readOptions = async () => {
// //     const ans = await ask("Do you want to read all or read latest?");
// //     if (ans.includes("all")) return readAllSummaries();
// //     if (ans.includes("latest")) return readLatest();

// //     await speak("Command not recognized.");
// //     return readOptions();
// //   };

// //   /* -------------------- READ ALL SUMMARIES -------------------- */
// //   const readAllSummaries = async () => {
// //     const list = emailsRef.current;
// //     if (!list.length) return speak("No unread emails.");

// //     await speak(`You have ${list.length} unread emails.`);

// //     for (let i = 0; i < list.length; i++) {
// //       await speak(`Email ${i + 1}, from ${list[i].from}`);
// //     }

// //     await speak("Please say the email number you want to read.");
// //     const ans = await listen(10000);
// //     const num = parseInt(ans.replace(/\D/g, ""));

// //     if (isNaN(num) || num < 1 || num > list.length) {
// //       await speak("Invalid number.");
// //       return readAllSummaries();
// //     }

// //     await readEmail(list[num - 1], num - 1);
// //   };

// //   /* -------------------- READ LATEST -------------------- */
// //   const readLatest = async () => {
// //     const list = emailsRef.current;
// //     if (!list.length) return speak("No unread emails.");

// //     await speak("Reading latest unread email.");
// //     await readEmail(list[0], 0);
// //   };

// //   /* -------------------- FETCH UNREAD -------------------- */
// //   useEffect(() => {
// //     if (ranOnce.current) return;
// //     ranOnce.current = true;

// //     const init = async () => {
// //       try {
// //         const res = await axios.get("http://localhost:5000/api/auth/loggedin");
// //         if (!res.data.success) {
// //           await speak("No logged-in user. Redirecting to login.");
// //           return navigate("/login");
// //         }

// //         const { email, password } = res.data;
// //         credsRef.current = { email, password };
// //         setFromEmail(email);

// //         const unread = await axios.post(
// //           "http://localhost:5000/api/inbox/fetchUnread",
// //           { email, password }
// //         );

// //         const list = (unread.data.emails || []).sort(
// //           (a, b) => new Date(b.date) - new Date(a.date)
// //         );

// //         setEmails(list);
// //         emailsRef.current = list;

// //         setLoading(false);

// //         if (list.length === 0) {
// //           await speak("You have no unread emails.");
// //         } else {
// //           await speak(`You have ${list.length} unread emails.`);
// //           await readOptions();
// //         }
// //       } catch (err) {
// //         console.log(err);
// //         await speak("Error fetching unread emails.");
// //         setLoading(false);
// //       }
// //     };

// //     init();
// //   }, [navigate]);

// //   /* -------------------- UI -------------------- */
// //   return (
// //     <div className="container">
// //       <aside className="sidebar">
// //         <div>
// //           <div className="brand">📧 VoiceMail</div>
// //           <nav className="nav">
// //             <button className="btn" onClick={() => navigate("/inbox")}>
// //               📥 Inbox
// //             </button>
// //             <button className="btn" onClick={() => navigate("/menu")}>
// //               📋 Menu
// //             </button>
// //             <button className="btn" onClick={() => navigate("/logout")}>
// //               🚪 Logout
// //             </button>
// //           </nav>
// //         </div>
// //         <div className="footer">Accessible | Voice Navigation</div>
// //       </aside>

// //       <main className="main">
// //         <h2 className="inbox-heading">📭 Unread Emails – {fromEmail}</h2>

// //         {loading ? (
// //           <p>Loading unread emails...</p>
// //         ) : emails.length === 0 ? (
// //           <p>No unread emails.</p>
// //         ) : (
// //           <div className="email-list">
// //             {emails.map((mail, i) => (
// //               <div key={mail.seqno || i} className="email-item unread">
// //                 <p>
// //                   <strong>Email {i + 1}</strong>
// //                 </p>
// //                 <p>
// //                   <strong>From:</strong> {mail.from}
// //                 </p>
// //                 <p>
// //                   <strong>Subject:</strong> {mail.subject}
// //                 </p>
// //                 <p>
// //                   <strong>Date:</strong>{" "}
// //                   {new Date(mail.date).toLocaleString()}
// //                 </p>
// //                 <p>
// //                   <strong>Preview:</strong>{" "}
// //                   {mail.body?.slice(0, 200) || "No content"}
// //                 </p>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </main>
// //     </div>
// //   );
// // }
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Inbox.css";

/* -------------------- TEXT TO SPEECH -------------------- */
const speak = (text) =>
  new Promise((resolve) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-IN";
    msg.rate = 1;
    msg.pitch = 1;
    msg.onend = resolve;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  });

/* -------------------- SPEECH TO TEXT (ASK FUNCTION) -------------------- */
const listen = (timeoutMs = 10000) =>
  new Promise((resolve) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return resolve("");

    const rec = new SR();
    rec.lang = "en-IN";

    const timeout = setTimeout(() => {
      try {
        rec.stop();
      } catch {}
      resolve("");
    }, timeoutMs);

    rec.onresult = (e) => {
      clearTimeout(timeout);
      try {
        rec.stop();
      } catch {}
      resolve(e.results[0][0].transcript.toLowerCase().trim());
    };

    rec.onerror = () => {
      clearTimeout(timeout);
      resolve("");
    };

    rec.start();
  });

export default function Unread() {
  const [emails, setEmails] = useState([]);
  const [fromEmail, setFromEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const credsRef = useRef(null);
  const stopRequested = useRef(false);
  const stopListener = useRef(null);
  const ranOnce = useRef(false);
  const emailsRef = useRef([]);

  const navigate = useNavigate();

  /* -------------------- ASK FUNCTION -------------------- */
  const ask = async (q) => {
    await speak(q);
    let ans = "";

    for (let i = 0; i < 2 && !ans; i++) {
      ans = await listen(10000);
      if (!ans) await speak("Please say again.");
    }
    return ans;
  };

  /* -------------------- CONTINUOUS STOP LISTENER -------------------- */
  const startStopListener = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = async (e) => {
      const command =
        e.results[e.results.length - 1][0].transcript.toLowerCase().trim();

      if (command.includes("stop")) {
        stopRequested.current = true;

        window.speechSynthesis.cancel(); // stop reading now
        try {
          rec.stop();
        } catch {}

        stopStopListener();

        await speak("Reading stopped.");

        await afterStopMenu();
      }
    };

    rec.onerror = () => {
      try {
        rec.stop();
      } catch {}
      startStopListener(); // keeps mic ON for full reading
    };

    stopListener.current = rec;
    rec.start();
  };

  const stopStopListener = () => {
    if (stopListener.current) {
      try {
        stopListener.current.stop();
      } catch {}
      stopListener.current = null;
    }
  };

  /* -------------------- MARK AS READ -------------------- */
  const markMultipleAsRead = async (seqnos = []) => {
    if (!credsRef.current || seqnos.length === 0) return;
    try {
      await axios.post("http://localhost:5000/api/inbox/markAsRead", {
        email: credsRef.current.email,
        password: credsRef.current.password,
        seqnos,
      });
    } catch (e) {
      console.log("markAsRead error:", e);
    }
  };

  /* -------------------- REMOVE EMAIL -------------------- */
  const removeFromUnread = (seqno) => {
    setEmails((prev) => {
      const updated = prev.filter((mail) => mail.seqno !== seqno);
      emailsRef.current = updated;
      return updated;
    });
  };

  /* -------------------- READ EMAIL -------------------- */
  const readEmail = async (mail, index) => {
    stopRequested.current = false;

    startStopListener(); // mic ON entire reading

    const safeSpeak = async (text) => {
      if (!stopRequested.current) await speak(text);
    };

    const dateStr = new Date(mail.date).toLocaleString();

    await safeSpeak(`Reading email number ${index + 1}`);
    if (stopRequested.current) return;

    await safeSpeak(`From: ${mail.from}`);
    if (stopRequested.current) return;

    await safeSpeak(`Subject: ${mail.subject || "No subject"}`);
    if (stopRequested.current) return;

    await safeSpeak(`Date: ${dateStr}`);
    if (stopRequested.current) return;

    await safeSpeak(mail.body || "No content available");
    if (stopRequested.current) return;

    stopStopListener();

    await markMultipleAsRead([mail.seqno]);
    removeFromUnread(mail.seqno);

    await afterFullReadMenu();
  };

  /* -------------------- MENU AFTER FULL READ -------------------- */
  const afterFullReadMenu = async () => {
    const ans = await ask(
      "Do you want to read another email, go to inbox, menu or logout?"
    );

    if (ans.includes("another")) return readOptions();
    if (ans.includes("inbox")) return navigate("/inbox");
    if (ans.includes("menu")) return navigate("/menu");
    if (ans.includes("logout")) {
      await axios.get("http://localhost:5000/api/auth/logout");
      return navigate("/login");
    }

    await speak("Sorry, I did not understand.");
    return afterFullReadMenu();
  };

  /* -------------------- MENU AFTER STOP -------------------- */
  const afterStopMenu = async () => {
    const ans = await ask(
      "Do you want to read another email, go to inbox, menu or logout?"
    );

    if (ans.includes("another")) return readOptions();
    if (ans.includes("inbox")) return navigate("/inbox");
    if (ans.includes("menu")) return navigate("/menu");
    if (ans.includes("logout")) {
      await axios.get("http://localhost:5000/api/auth/logout");
      return navigate("/login");
    }

    await speak("Sorry, please repeat.");
    return afterStopMenu();
  };

  /* -------------------- READ OPTION -------------------- */
  const readOptions = async () => {
    const ans = await ask("Do you want to read all or read latest?");
    if (ans.includes("all")) return readAllSummaries();
    if (ans.includes("latest")) return readLatest();

    await speak("Command not recognized.");
    return readOptions();
  };

  /* -------------------- READ ALL SUMMARIES -------------------- */
  const readAllSummaries = async () => {
    const list = emailsRef.current;
    if (!list.length) return speak("No unread emails.");

    await speak(`You have ${list.length} unread emails.`);

    for (let i = 0; i < list.length; i++) {
      await speak(`Email ${i + 1}, from ${list[i].from}`);
    }

    await speak("Please say the email number you want to read.");
    const ans = await listen(10000);
    const num = parseInt(ans.replace(/\D/g, ""));

    if (isNaN(num) || num < 1 || num > list.length) {
      await speak("Invalid number.");
      return readAllSummaries();
    }

    await readEmail(list[num - 1], num - 1);
  };

  /* -------------------- READ LATEST -------------------- */
  const readLatest = async () => {
    const list = emailsRef.current;
    if (!list.length) return speak("No unread emails.");

    await speak("Reading latest unread email.");
    await readEmail(list[0], 0);
  };

  /* -------------------- FETCH UNREAD EMAILS -------------------- */
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const init = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/loggedin");
        if (!res.data.success) {
          await speak("No logged-in user. Redirecting to login.");
          return navigate("/login");
        }

        const { email, password } = res.data;
        credsRef.current = { email, password };
        setFromEmail(email);

        const unread = await axios.post(
          "http://localhost:5000/api/inbox/fetchUnread",
          { email, password }
        );

        const list = (unread.data.emails || []).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setEmails(list);
        emailsRef.current = list;

        setLoading(false);

        if (!list.length) {
          await speak("You have no unread emails.");
        } else {
          await speak(`You have ${list.length} unread emails.`);
          await readOptions();
        }
      } catch (err) {
        console.log(err);
        await speak("Error fetching unread emails.");
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  /* -------------------- UI -------------------- */
  return (
    <div className="container">
      <aside className="sidebar">
        <div>
          <div className="brand">📧 VoiceMail</div>
          <nav className="nav">
            <button className="btn" onClick={() => navigate("/inbox")}>
              📥 Inbox
            </button>
            <button className="btn" onClick={() => navigate("/menu")}>
              📋 Menu
            </button>
            <button className="btn" onClick={() => navigate("/logout")}>
              🚪 Logout
            </button>
          </nav>
        </div>
        <div className="footer">Accessible | Voice Navigation</div>
      </aside>

      <main className="main">
        <h2 className="inbox-heading">📭 Unread Emails – {fromEmail}</h2>

        {loading ? (
          <p>Loading unread emails...</p>
        ) : emails.length === 0 ? (
          <p>No unread emails.</p>
        ) : (
          <div className="email-list">
            {emails.map((mail, i) => (
              <div key={mail.seqno || i} className="email-item unread">
                <p>
                  <strong>Email {i + 1}</strong>
                </p>
                <p>
                  <strong>From:</strong> {mail.from}
                </p>
                <p>
                  <strong>Subject:</strong> {mail.subject}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(mail.date).toLocaleString()}
                </p>
                <p>
                  <strong>Preview:</strong>{" "}
                  {mail.body?.slice(0, 200) || "No content"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


