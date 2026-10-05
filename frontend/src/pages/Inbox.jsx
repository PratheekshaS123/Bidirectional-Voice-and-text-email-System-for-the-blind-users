
// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import "./Inbox.css";

// // 🔊 Speak text
// const speak = (text) =>
//   new Promise((resolve) => {
//     const msg = new SpeechSynthesisUtterance(text);
//     msg.lang = "en-IN";
//     msg.rate = 1;
//     msg.pitch = 1;
//     msg.onend = resolve;
//     window.speechSynthesis.speak(msg);
//   });

// // 🎙 Listen for voice commands
// const listen = (timeoutMs = 8000) =>
//   new Promise((resolve) => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) return resolve(null);

//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-IN";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     let done = false;
//     const timer = setTimeout(() => {
//       if (!done) {
//         done = true;
//         try { recognition.stop(); } catch {}
//         resolve(null);
//       }
//     }, timeoutMs);

//     recognition.onresult = (event) => {
//       if (done) return;
//       done = true;
//       clearTimeout(timer);
//       const transcript = event.results[0][0].transcript.toLowerCase();
//       try { recognition.stop(); } catch {}
//       resolve(transcript);
//     };

//     recognition.onerror = () => {
//       if (!done) {
//         done = true;
//         clearTimeout(timer);
//         try { recognition.stop(); } catch {}
//         resolve(null);
//       }
//     };

//     recognition.start();
//   });

// // 🔔 Beep for new email
// const beep = () => {
//   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//   const oscillator = audioCtx.createOscillator();
//   oscillator.type = "square";
//   oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
//   oscillator.connect(audioCtx.destination);
//   oscillator.start();
//   setTimeout(() => oscillator.stop(), 200);
// };

// export default function Inbox() {
//   const [emails, setEmails] = useState([]);
//   const [fromEmail, setFromEmail] = useState("");
//   const [appPassword, setAppPassword] = useState("");
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const ranOnce = useRef(false);

//   // 🗣 Initial menu voice prompt
//   const initialMenu = async () => {
//     await speak(
//       "Do you want to read unread emails? Please say 'unread'. " +
//       "Do you want to search specific email? Say 'search'. " +
//       "Do you want to go to menu or logout?"
//     );
//     const cmd = await listen(8000);
//     if (!cmd) {
//       await speak("No command received. Staying in inbox.");
//       return;
//     }
//     if (cmd.includes("unread")) navigate("/unread");
//     else if (cmd.includes("search")) navigate("/search");
//     else if (cmd.includes("menu")) navigate("/menu");
//     else if (cmd.includes("logout")) navigate("/logout");
//     else await speak("Command not recognized.");
//   };

//   // 📥 Initial fetch
//   useEffect(() => {
//     if (ranOnce.current) return;
//     ranOnce.current = true;

//     const loadInbox = async () => {
//       try {
//         const who = await axios.get("http://localhost:5000/api/auth/loggedin");
//         if (!who.data || !who.data.success) {
//           await speak("No logged in user. Redirecting to login.");
//           navigate("/login");
//           return;
//         }

//         const { email, password } = who.data;
//         setFromEmail(email);
//         setAppPassword(password);

//         const resp = await axios.post("http://localhost:5000/api/inbox/fetch", {
//           email,
//           password,
//           limit: 20,
//         });

//         if (!resp.data.success) {
//           await speak("Error fetching inbox.");
//           setLoading(false);
//           return;
//         }

//         const fetched = (resp.data.emails || []).sort(
//           (a, b) => new Date(b.date) - new Date(a.date)
//         );
//         setEmails(fetched);
//         setLoading(false);

//         await initialMenu();
//       } catch (err) {
//         console.error("Inbox fetch error:", err);
//         await speak("Error fetching inbox. Check your connection.");
//         setLoading(false);
//       }
//     };

//     loadInbox();
//   }, [navigate]);

//   // 📡 Real-time email watcher
//   useEffect(() => {
//     if (!fromEmail || !appPassword) return;

//     const url = `http://localhost:5000/api/inbox/watch?email=${fromEmail}&password=${appPassword}`;
//     const eventSource = new EventSource(url);

//     eventSource.onmessage = async (event) => {
//       const data = JSON.parse(event.data);
//       if (data.newMail) {
//         beep(); // 🔔 beep for new email

//         const newMail = {
//           from: data.from,
//           subject: data.subject,
//           body: data.body,
//           date: data.date,
//           seqno: data.seqno || null,
//           isRead: false,
//         };

//         setEmails((prev) => [newMail, ...prev]);

//         await speak(
//           `New email received from ${newMail.from}. Subject: ${newMail.subject}. Do you want to read it?`
//         );
//         const cmd = await listen(8000);
//         if (cmd && cmd.includes("yes")) {
//           await speak(`Reading email from ${newMail.from}. Subject: ${newMail.subject}. Date: ${new Date(newMail.date).toLocaleString()}`);
//           await speak(`Message body: ${newMail.body || "No content"}`);

//           if (newMail.seqno && Number.isInteger(Number(newMail.seqno))) {
//             try {
//               await axios.post("http://localhost:5000/api/inbox/markAsRead", {
//                 email: fromEmail,
//                 password: appPassword,
//                 seqnos: [Number(newMail.seqno)],
//               });
//               setEmails((prev) =>
//                 prev.map((m) =>
//                   m.seqno === newMail.seqno ? { ...m, isRead: true } : m
//                 )
//               );
//             } catch (err) {
//               console.error("markAsRead failed:", err);
//               await speak("Unable to mark email as read.");
//             }
//           }
//         } else {
//           await speak("Skipping this email.");
//         }
//       }
//     };

//     eventSource.onerror = (err) => console.error("SSE error:", err);

//     return () => eventSource.close();
//   }, [fromEmail, appPassword]);

//   return (
//     <div className="container">
//       <div className="sidebar">
//         <h2>Inbox</h2>
//         <ul>
//           <li onClick={() => navigate("/unread")}>Unread</li>
//           <li onClick={() => navigate("/search")}>Search</li>
//           <li onClick={() => navigate("/menu")}>Menu</li>
//           <li onClick={() => navigate("/logout")}>Logout</li>
//         </ul>
//       </div>

//       <div className="main">
//         <h2>📥 Inbox - {fromEmail}</h2>
//         {loading ? (
//           <p>Loading emails...</p>
//         ) : emails.length === 0 ? (
//           <p>No emails found.</p>
//         ) : (
//           <div className="email-list">
//             {emails.map((mail, idx) => (
//               <div
//                 key={idx}
//                 className={`email-item ${mail.isRead ? "read" : "unread"}`}
//               >
//                 <p><strong>From:</strong> {mail.from}</p>
//                 <p><strong>Subject:</strong> {mail.subject || "No Subject"}</p>
//                 <p><strong>Date:</strong> {new Date(mail.date).toLocaleString()}</p>
//                 <p><strong>Body:</strong> {mail.body ? mail.body.slice(0, 200) : "No content"}</p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import "./Inbox.css";

// // 🔊 Speak text
// const speak = (text) =>
//   new Promise((resolve) => {
//     const msg = new SpeechSynthesisUtterance(text);
//     msg.lang = "en-IN";
//     msg.rate = 1;
//     msg.pitch = 1;
//     msg.onend = resolve;
//     window.speechSynthesis.speak(msg);
//   });

// // 🎙 Listen for voice commands
// const listen = (timeoutMs = 8000) =>
//   new Promise((resolve) => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) return resolve(null);

//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-IN";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     let done = false;
//     const timer = setTimeout(() => {
//       if (!done) {
//         done = true;
//         try { recognition.stop(); } catch {}
//         resolve(null);
//       }
//     }, timeoutMs);

//     recognition.onresult = (event) => {
//       if (done) return;
//       done = true;
//       clearTimeout(timer);
//       const transcript = event.results[0][0].transcript.toLowerCase();
//       try { recognition.stop(); } catch {}
//       resolve(transcript);
//     };

//     recognition.onerror = () => {
//       if (!done) {
//         done = true;
//         clearTimeout(timer);
//         try { recognition.stop(); } catch {}
//         resolve(null);
//       }
//     };

//     recognition.start();
//   });

// // 🔔 beep for new email
// const beep = () => {
//   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//   const oscillator = audioCtx.createOscillator();
//   oscillator.type = "square";
//   oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
//   oscillator.connect(audioCtx.destination);
//   oscillator.start();
//   setTimeout(() => oscillator.stop(), 200);
// };

// export default function Inbox() {
//   const [emails, setEmails] = useState([]);
//   const [fromEmail, setFromEmail] = useState("");
//   const [appPassword, setAppPassword] = useState("");
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const ranOnce = useRef(false);

//   // 🗣 Initial menu voice
//   const initialMenu = async () => {
//     await speak(
//       "Do you want to read unread emails please say unread. " +
//       "Do you want to search specific email please say search. " +
//       "Do you want to go to menu or logout."
//     );

//     const cmd = await listen(8000);
//     if (!cmd) return;

//     if (cmd.includes("unread")) navigate("/unread");
//     else if (cmd.includes("search")) navigate("/search");
//     else if (cmd.includes("menu")) navigate("/menu");
//     else if (cmd.includes("logout")) navigate("/logout");
//     else await speak("Command not recognized.");
//   };

//   // 📥 Load inbox initially
//   useEffect(() => {
//     if (ranOnce.current) return;
//     ranOnce.current = true;

//     const loadInbox = async () => {
//       try {
//         const who = await axios.get("http://localhost:5000/api/auth/loggedin");
//         if (!who.data || !who.data.success) {
//           await speak("No logged in user. Redirecting to login.");
//           navigate("/login");
//           return;
//         }

//         const { email, password } = who.data;
//         setFromEmail(email);
//         setAppPassword(password);

//         const resp = await axios.post("http://localhost:5000/api/inbox/fetch", {
//           email,
//           password,
//           limit: 20,
//         });

//         if (!resp.data.success) {
//           await speak("Error fetching inbox.");
//           setLoading(false);
//           return;
//         }

//         const sorted = (resp.data.emails || []).sort(
//           (a, b) => new Date(b.date) - new Date(a.date)
//         );

//         setEmails(sorted);
//         setLoading(false);

//         await initialMenu();
//       } catch (err) {
//         console.error("Inbox fetch error:", err);
//         await speak("Error fetching inbox. Check your connection.");
//         setLoading(false);
//       }
//     };

//     loadInbox();
//   }, [navigate]);

//   // 📡 Real-time email watcher
//   useEffect(() => {
//     if (!fromEmail || !appPassword) return;

//     const url = `http://localhost:5000/api/inbox/watch?email=${fromEmail}&password=${appPassword}`;
//     const eventSource = new EventSource(url);

//     eventSource.onmessage = async (event) => {
//       const data = JSON.parse(event.data);

//       if (data.newMail) {
//         beep();

//         const newMail = {
//           from: data.from,
//           subject: data.subject,
//           body: data.body,
//           date: data.date,
//           seqno: data.seqno || null,
//           isRead: false,
//         };

//         // 🔥 Show newest first
//         setEmails((prev) => [newMail, ...prev]);

//         // 🔥 Calculate unread count
//         const unreadCount = (emails.filter((e) => !e.isRead).length || 0) + 1;

//         await speak(
//           `You have ${unreadCount} new emails. ` +
//           "Do you want to read unread emails please say unread. " +
//           "Do you want to search specific email please say search."
//         );

//         const cmd = await listen(8000);
//         if (!cmd) return;

//         if (cmd.includes("unread")) navigate("/unread");
//         else if (cmd.includes("search")) navigate("/search");
//         else await speak("Command not recognized.");
//       }
//     };

//     eventSource.onerror = (err) => console.error("SSE error:", err);

//     return () => eventSource.close();
//   }, [fromEmail, appPassword, emails]);

//   return (
//     <div className="container">
//       <div className="sidebar">
//         <h2>Inbox</h2>
//         <ul>
//           <li onClick={() => navigate("/unread")}>Unread</li>
//           <li onClick={() => navigate("/search")}>Search</li>
//           <li onClick={() => navigate("/menu")}>Menu</li>
//           <li onClick={() => navigate("/logout")}>Logout</li>
//         </ul>
//       </div>

//       <div className="main">
//         <h2>📥 Inbox - {fromEmail}</h2>

//         {loading ? (
//           <p>Loading emails...</p>
//         ) : emails.length === 0 ? (
//           <p>No emails found.</p>
//         ) : (
//           <div className="email-list">
//             {emails.map((mail, idx) => (
//               <div
//                 key={idx}
//                 className={`email-item ${mail.isRead ? "read" : "unread"}`}
//               >
//                 <p><strong>From:</strong> {mail.from}</p>
//                 <p><strong>Subject:</strong> {mail.subject || "No Subject"}</p>
//                 <p><strong>Date:</strong> {new Date(mail.date).toLocaleString()}</p>
//                 <p><strong>Body:</strong> {mail.body ? mail.body.slice(0, 200) : "No content"}</p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import "./Inbox.css";

// /* ---------------- TTS ---------------- */
// const speak = (text) =>
//   new Promise((resolve) => {
//     try {
//       window.speechSynthesis.cancel();
//     } catch {}
//     const u = new SpeechSynthesisUtterance(text);
//     u.lang = "en-IN";
//     u.rate = 1;
//     u.pitch = 1;
//     u.onend = resolve;
//     try {
//       window.speechSynthesis.speak(u);
//     } catch (e) {
//       // ignore
//       resolve();
//     }
//   });

// /* ---------------- STT (single-shot) ---------------- */
// const listen = (timeoutMs = 8000) =>
//   new Promise((resolve) => {
//     const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SR) return resolve("");
//     const rec = new SR();
//     rec.lang = "en-IN";
//     rec.interimResults = false;
//     rec.maxAlternatives = 1;

//     let done = false;
//     const timer = setTimeout(() => {
//       if (done) return;
//       done = true;
//       try {
//         rec.stop();
//       } catch {}
//       resolve("");
//     }, timeoutMs);

//     rec.onresult = (e) => {
//       if (done) return;
//       done = true;
//       clearTimeout(timer);
//       try {
//         rec.stop();
//       } catch {}
//       resolve(e.results[0][0].transcript.toLowerCase().trim());
//     };

//     rec.onerror = () => {
//       if (done) return;
//       done = true;
//       clearTimeout(timer);
//       try {
//         rec.stop();
//       } catch {}
//       resolve("");
//     };

//     try {
//       rec.start();
//     } catch (e) {
//       clearTimeout(timer);
//       resolve("");
//     }
//   });

// /* ---------------- BEEP ---------------- */
// const beep = () => {
//   try {
//     const actx = new (window.AudioContext || window.webkitAudioContext)();
//     const osc = actx.createOscillator();
//     osc.type = "square";
//     osc.frequency.setValueAtTime(1000, actx.currentTime);
//     osc.connect(actx.destination);
//     osc.start();
//     setTimeout(() => osc.stop(), 200);
//   } catch (e) {
//     // ignore
//   }
// };

// export default function Inbox() {
//   const [fromEmail, setFromEmail] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [unread, setUnread] = useState([]); // unread emails (should match /unread)
//   const [read, setRead] = useState([]); // read emails
//   const [creds, setCreds] = useState(null);
//   const navigate = useNavigate();
//   const ranOnce = useRef(false);
//   const eventSourceRef = useRef(null);

//   /* -------------- API helpers -------------- */
//   const fetchAll = async (email, password) => {
//     const resp = await axios.post("http://localhost:5000/api/inbox/fetch", {
//       email,
//       password,
//       limit: 50,
//     });
//     return resp.data;
//   };

//   const fetchUnread = async (email, password) => {
//     const resp = await axios.post("http://localhost:5000/api/inbox/fetchUnread", {
//       email,
//       password,
//     });
//     return resp.data;
//   };

//   const reloadInboxLists = async (emailArg = null, passArg = null) => {
//     const email = emailArg || (creds && creds.email);
//     const password = passArg || (creds && creds.password);
//     if (!email || !password) return;

//     try {
//       const [allRes, unreadRes] = await Promise.all([
//         fetchAll(email, password),
//         fetchUnread(email, password),
//       ]);

//       const unreadList = (unreadRes && unreadRes.emails) || [];
//       const allList = (allRes && allRes.emails) || [];

//       // dedupe by seqno if available; sort descending by date
//       const sortByDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

//       const sortedUnread = [...unreadList].sort(sortByDateDesc);
//       // read = all emails that are NOT in unread (using seqno if present otherwise compare subject+date+from)
//       const unreadKeys = new Set(
//         sortedUnread.map((m) => (m.seqno ? `s:${m.seqno}` : `k:${m.from}|${m.subject}|${m.date}`))
//       );
//       const readList = allList.filter((m) => {
//         const key = m.seqno ? `s:${m.seqno}` : `k:${m.from}|${m.subject}|${m.date}`;
//         return !unreadKeys.has(key);
//       });

//       setUnread(sortedUnread);
//       setRead([...readList].sort(sortByDateDesc));
//     } catch (err) {
//       console.error("reloadInboxLists error:", err);
//     }
//   };

//   /* -------------- initial load -------------- */
//   useEffect(() => {
//     if (ranOnce.current) return;
//     ranOnce.current = true;

//     const init = async () => {
//       try {
//         const who = await axios.get("http://localhost:5000/api/auth/loggedin");
//         if (!who.data || !who.data.success) {
//           await speak("No logged in user. Redirecting to login.");
//           navigate("/login");
//           return;
//         }
//         const { email, password } = who.data;
//         setFromEmail(email);
//         setCreds({ email, password });

//         await reloadInboxLists(email, password);
//         setLoading(false);

//         await speak(
//           "Do you want to read unread emails please say unread. " +
//             "Do you want to search specific email please say search. " +
//             "Do you want to go to menu or logout."
//         );

//         const cmd = await listen(8000);
//         if (!cmd) return;
//         if (cmd.includes("unread")) navigate("/unread");
//         else if (cmd.includes("search")) navigate("/search");
//         else if (cmd.includes("menu")) navigate("/menu");
//         else if (cmd.includes("logout")) navigate("/logout");
//       } catch (err) {
//         console.error("Inbox init error:", err);
//         await speak("Error fetching inbox. Check your connection.");
//         setLoading(false);
//       }
//     };

//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [navigate]);

//   /* -------------- watch for refresh flag or window focus -------------- */
//   useEffect(() => {
//     const checkRefresh = async () => {
//       if (sessionStorage.getItem("refreshInbox") === "1") {
//         sessionStorage.removeItem("refreshInbox");
//         await reloadInboxLists();
//       }
//     };

//     checkRefresh();

//     const onFocus = () => {
//       checkRefresh();
//     };
//     window.addEventListener("focus", onFocus);
//     return () => window.removeEventListener("focus", onFocus);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [creds]);

//   /* -------------- SSE new-mail watcher -------------- */
//   useEffect(() => {
//     if (!creds || !creds.email || !creds.password) return;

//     const url = `http://localhost:5000/api/inbox/watch?email=${encodeURIComponent(
//       creds.email
//     )}&password=${encodeURIComponent(creds.password)}`;

//     // close existing
//     if (eventSourceRef.current) {
//       try {
//         eventSourceRef.current.close();
//       } catch {}
//       eventSourceRef.current = null;
//     }

//     const es = new EventSource(url);
//     eventSourceRef.current = es;

//     es.onmessage = async (evt) => {
//       try {
//         const data = JSON.parse(evt.data);
//         if (data.newMail) {
//           beep();

//           const newMail = {
//             from: data.from,
//             subject: data.subject,
//             body: data.body,
//             date: data.date,
//             seqno: data.seqno || null,
//           };

//           // Add to unread (dedupe using seqno or fallback key)
//           setUnread((prev) => {
//             const keyFor = (m) => (m.seqno ? `s:${m.seqno}` : `k:${m.from}|${m.subject}|${m.date}`);
//             const existing = prev.some((p) => keyFor(p) === keyFor(newMail));
//             if (existing) return prev;
//             return [newMail, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date));
//           });

//           // Speak prompt
//           await speak(
//             `You have a new email from ${newMail.from}. Do you want to read unread emails, search, or go to menu?`
//           );
//           const cmd = await listen(8000);
//           if (!cmd) return;
//           if (cmd.includes("unread")) navigate("/unread");
//           else if (cmd.includes("search")) navigate("/search");
//           else if (cmd.includes("menu")) navigate("/menu");
//         }
//       } catch (e) {
//         console.error("SSE parse error:", e);
//       }
//     };

//     es.onerror = (err) => {
//       console.error("SSE error:", err);
//       // EventSource auto-reconnects; keep logs only
//     };

//     return () => {
//       try {
//         if (es) es.close();
//       } catch {}
//       eventSourceRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [creds, navigate]);

//   /* -------------- render -------------- */
//   return (
//     <div className="container">
//       <div className="sidebar">
//         <h2>Inbox</h2>
//         <ul>
//           <li onClick={() => navigate("/unread")}>Unread</li>
//           <li onClick={() => navigate("/search")}>Search</li>
//           <li onClick={() => navigate("/menu")}>Menu</li>
//           <li onClick={() => navigate("/logout")}>Logout</li>
//         </ul>
//       </div>

//       <div className="main">
//         <h2>📥 Inbox - {fromEmail}</h2>

//         {loading ? (
//           <p>Loading emails...</p>
//         ) : (
//           <>
//             <section>
//               <h3>🔵 Unread</h3>
//               {unread.length === 0 ? (
//                 <p>No unread emails.</p>
//               ) : (
//                 <div className="email-list">
//                   {unread.map((mail, idx) => (
//                     <div key={mail.seqno || `${idx}-u`} className="email-item unread">
//                       <p><strong>From:</strong> {mail.from}</p>
//                       <p><strong>Subject:</strong> {mail.subject || "No Subject"}</p>
//                       <p><strong>Date:</strong> {mail.date ? new Date(mail.date).toLocaleString() : "Unknown"}</p>
//                       <p><strong>Preview:</strong> {mail.body ? mail.body.slice(0, 200) : "No content"}</p>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </section>

//             <section style={{ marginTop: 20 }}>
//               <h3>⚪ Read</h3>
//               {read.length === 0 ? (
//                 <p>No read emails.</p>
//               ) : (
//                 <div className="email-list">
//                   {read.map((mail, idx) => (
//                     <div key={mail.seqno || `${idx}-r`} className="email-item read">
//                       <p><strong>From:</strong> {mail.from}</p>
//                       <p><strong>Subject:</strong> {mail.subject || "No Subject"}</p>
//                       <p><strong>Date:</strong> {mail.date ? new Date(mail.date).toLocaleString() : "Unknown"}</p>
//                       <p><strong>Preview:</strong> {mail.body ? mail.body.slice(0, 200) : "No content"}</p>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </section>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Inbox.css";

const speak = (text) => new Promise((resolve)=>{
  try{window.speechSynthesis.cancel();}catch{}
  const u = new SpeechSynthesisUtterance(text);
  u.lang="en-IN"; u.rate=1; u.pitch=1; u.onend=resolve;
  try{window.speechSynthesis.speak(u);}catch{resolve();}
});

const listen = (timeoutMs=8000)=>new Promise((resolve)=>{
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return resolve("");
  const rec = new SR(); rec.lang="en-IN"; rec.interimResults=false; rec.maxAlternatives=1;
  let done=false;
  const timer = setTimeout(()=>{ if(!done){done=true; try{rec.stop();}catch{} resolve(""); } },timeoutMs);
  rec.onresult = (e)=>{ if(done) return; done=true; clearTimeout(timer); try{rec.stop();}catch{} resolve(e.results[0][0].transcript.toLowerCase().trim()); };
  rec.onerror = ()=>{ if(!done){ done=true; clearTimeout(timer); try{rec.stop();}catch{} resolve(""); } };
  try{rec.start();}catch{ clearTimeout(timer); resolve(""); }
});

const beep = ()=>{ try{ const actx=new (window.AudioContext||window.webkitAudioContext)(); const osc=actx.createOscillator(); osc.type="square"; osc.frequency.setValueAtTime(1000,actx.currentTime); osc.connect(actx.destination); osc.start(); setTimeout(()=>osc.stop(),200);}catch{} };

export default function Inbox(){
  const [fromEmail,setFromEmail]=useState("");
  const [loading,setLoading]=useState(true);
  const [unread,setUnread]=useState([]);
  const [read,setRead]=useState([]);
  const [creds,setCreds]=useState(null);
  const navigate=useNavigate();
  const ranOnce=useRef(false);
  const eventSourceRef=useRef(null);

  const fetchAll=async(email,password)=>{ const resp=await axios.post("http://localhost:5000/api/inbox/fetch",{email,password,limit:50}); return resp.data; };
  const fetchUnread=async(email,password)=>{ const resp=await axios.post("http://localhost:5000/api/inbox/fetchUnread",{email,password}); return resp.data; };

  const reloadInboxLists=async(emailArg=null,passArg=null)=>{
    const email=emailArg||(creds&&creds.email);
    const password=passArg||(creds&&creds.password);
    if(!email||!password) return;
    try{
      const [allRes,unreadRes]=await Promise.all([fetchAll(email,password),fetchUnread(email,password)]);
      const unreadList=(unreadRes && unreadRes.emails)||[];
      const allList=(allRes && allRes.emails)||[];
      const sortByDateDesc=(a,b)=>new Date(b.date)-new Date(a.date);
      const sortedUnread=[...unreadList].sort(sortByDateDesc);

      const unreadKeys=new Set(sortedUnread.map(m=>(m.seqno?`s:${m.seqno}`:`k:${m.from}|${m.subject}|${m.date}`)));
      const readList = allList.filter(m=>{ const key=m.seqno?`s:${m.seqno}`:`k:${m.from}|${m.subject}|${m.date}`; return !unreadKeys.has(key); });

      setUnread(sortedUnread);
      setRead([...readList].sort(sortByDateDesc));
    }catch(err){ console.error(err); }
  };

  useEffect(()=>{
    if(ranOnce.current) return;
    ranOnce.current=true;
    const init=async()=>{
      try{
        const who=await axios.get("http://localhost:5000/api/auth/loggedin");
        if(!who.data||!who.data.success){ await speak("No logged in user. Redirecting to login."); navigate("/login"); return; }
        const {email,password}=who.data; setFromEmail(email); setCreds({email,password});
        await reloadInboxLists(email,password);
        setLoading(false);
        await speak("Do you want to read unread emails please say unread. Do you want to search specific email please say search. Do you want to go to menu or logout.");
        const cmd=await listen(8000);
        if(!cmd) return;
        if(cmd.includes("unread")) navigate("/unread");
        else if(cmd.includes("search")) navigate("/search");
        else if(cmd.includes("menu")) navigate("/menu");
        else if(cmd.includes("logout")) navigate("/logout");
      }catch(err){ console.error(err); await speak("Error fetching inbox."); setLoading(false);}
    };
    init();
  },[navigate]);

  useEffect(()=>{
    const checkRefresh = async()=>{
      if(sessionStorage.getItem("refreshInbox")==="1"){
        sessionStorage.removeItem("refreshInbox");
        await reloadInboxLists();
      }
    };
    checkRefresh();
    const onFocus=()=>{ checkRefresh(); };
    window.addEventListener("focus",onFocus);
    return ()=> window.removeEventListener("focus",onFocus);
  },[creds]);

  useEffect(()=>{
    if(!creds||!creds.email||!creds.password) return;
    const url=`http://localhost:5000/api/inbox/watch?email=${encodeURIComponent(creds.email)}&password=${encodeURIComponent(creds.password)}`;
    if(eventSourceRef.current){ try{eventSourceRef.current.close(); }catch{} eventSourceRef.current=null; }

    const es=new EventSource(url);
    eventSourceRef.current=es;
    es.onmessage=async(evt)=>{
      try{
        const data=JSON.parse(evt.data);
        if(data.newMail){
          beep();
          const newMail={ from:data.from, subject:data.subject, body:data.body, date:data.date, seqno:data.seqno||null };
          setUnread(prev=>{ const keyFor=m=>m.seqno?`s:${m.seqno}`:`k:${m.from}|${m.subject}|${m.date}`; if(prev.some(p=>keyFor(p)===keyFor(newMail))) return prev; return [newMail,...prev].sort((a,b)=>new Date(b.date)-new Date(a.date)); });
          await speak(`You have a new email from ${newMail.from}. Do you want to read unread emails, search, or go to menu?`);
          const cmd=await listen(8000);
          if(!cmd) return;
          if(cmd.includes("unread")) navigate("/unread");
          else if(cmd.includes("search")) navigate("/search");
          else if(cmd.includes("menu")) navigate("/menu");
        }
      }catch(e){ console.error("SSE parse error:",e); }
    };
    es.onerror=(err)=>{ console.error("SSE error:",err); };
    return ()=>{ try{ if(es) es.close(); }catch{} eventSourceRef.current=null; };
  },[creds,navigate]);

  return (
    <div className="container">
      <div className="sidebar">
        <h2>Inbox</h2>
        <ul>
          <li onClick={()=>navigate("/unread")}>Unread</li>
          <li onClick={()=>navigate("/search")}>Search</li>
          <li onClick={()=>navigate("/menu")}>Menu</li>
          <li onClick={()=>navigate("/logout")}>Logout</li>
        </ul>
      </div>

      <div className="main">
  <h2>📥 Inbox - {fromEmail}</h2>
  {loading ? <p>Loading emails...</p> :
  <>
    <section>
      <h3>🔵 Unread</h3>
      {unread.length===0?<p>No unread emails.</p>:
      <div className="email-list">
        {unread.map((mail,idx)=>(
          <div key={mail.seqno||`${idx}-u`} className="email-item unread">
            <p><strong>From:</strong> {mail.from}</p>
            <p><strong>Subject:</strong> {mail.subject||"No Subject"}</p>
            <p><strong>Date:</strong> {mail.date? new Date(mail.date).toLocaleString():"Unknown"}</p>
            <p><strong>Preview:</strong> {mail.body?.slice(0,200)||"No content"}</p>
          </div>
        ))}
      </div>}
    </section>

    <section>
      <h3>⚪ Read</h3>
      {read.length===0?<p>No read emails.</p>:
      <div className="email-list">
        {read.map((mail,idx)=>(
          <div key={mail.seqno||`${idx}-r`} className="email-item read">
            <p><strong>From:</strong> {mail.from}</p>
            <p><strong>Subject:</strong> {mail.subject||"No Subject"}</p>
            <p><strong>Date:</strong> {mail.date? new Date(mail.date).toLocaleString():"Unknown"}</p>
            <p><strong>Preview:</strong> {mail.body?.slice(0,200)||"No content"}</p>
          </div>
        ))}
      </div>}
    </section>
  </>}
</div>
</div>
  );
}
