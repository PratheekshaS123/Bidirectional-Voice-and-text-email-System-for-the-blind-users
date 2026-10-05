
// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import "./Sent.css";

// // 🗣 Text-to-speech utility
// const speak = (text) =>
//   new Promise((resolve) => {
//     const msg = new SpeechSynthesisUtterance(text);
//     msg.lang = "en-IN";
//     msg.rate = 1;
//     msg.pitch = 1;
//     msg.onend = resolve;
//     window.speechSynthesis.speak(msg);
//   });

// // 🎤 Speech-to-text utility with timeout
// const listen = (timeoutMs = 10000) =>
//   new Promise((resolve) => {
//     const recognition =
//       new (window.SpeechRecognition || window.webkitSpeechRecognition)();
//     recognition.lang = "en-US";

//     let timeout = setTimeout(() => {
//       recognition.stop();
//       resolve(null);
//     }, timeoutMs);

//     recognition.onresult = (event) => {
//       clearTimeout(timeout);
//       recognition.stop();
//       resolve(event.results[0][0].transcript.toLowerCase());
//     };

//     recognition.onerror = () => {
//       clearTimeout(timeout);
//       recognition.stop();
//       resolve(null);
//     };

//     recognition.start();
//   });

// // 🟢 Spell email ID character-by-character
// const speakContinuously = async (text) => {
//   if (!text) return;
//   const chars = text.split("").map((char) => {
//     if (char === "@") return "at";
//     if (char === ".") return "dot";
//     if (char === "-") return "dash";
//     if (char === "_") return "underscore";
//     return char;
//   });
//   await speak(chars.join(" "));
// };

// // 🗓️ UI Display → "8 November 2025, 10:45 AM"
// const formatDateTimeForUI = (dateStr) => {
//   const date = new Date(dateStr);
//   return date.toLocaleString("en-GB", {
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// // 🔊 Speech format → "8 November 2025 at 10 45 AM"
// const formatDateForSpeech = (dateStr) => {
//   const date = new Date(dateStr);

//   const day = date.getDate();
//   const month = date.toLocaleString("en-GB", { month: "long" });
//   const year = date.getFullYear();

//   let hours = date.getHours();
//   const minutes = date.getMinutes();
//   const ampm = hours >= 12 ? "PM" : "AM";
//   if (hours > 12) hours -= 12;
//   if (hours === 0) hours = 12;

//   return `${day} ${month} ${year} at ${hours} ${minutes} ${ampm}`;
// };

// export default function Sent() {
//   const [emails, setEmails] = useState([]);
//   const ranOnce = useRef(false);

//   useEffect(() => {
//     if (ranOnce.current) return;
//     ranOnce.current = true;

//     const fetchAndRead = async () => {
//       try {
//         const res = await axios.get("http://localhost:5000/api/sent");
//         if (!res.data.success) {
//           await speak("Failed to fetch sent emails.");
//           return;
//         }

//         setEmails(res.data.emails);

//         await speak(
//           "Welcome to the Sent page. Say read latest to read the last sent email or say read all to read all emails."
//         );

//         const command = await listen(10000);
//         if (!command) {
//           await speak("No command detected. Reload the page to try again.");
//           return;
//         }

//         if (command.includes("latest")) {
//           const latest = res.data.emails[0];
//           if (latest) {
//             const dateSpeech = formatDateForSpeech(latest.date);

//             await speak("To:");
//             await speakContinuously(latest.to);

//             await speak(
//               `Subject: ${latest.subject}, Body: ${latest.body}, Sent on ${dateSpeech}.`
//             );
//           }
//         } else if (command.includes("all")) {
//           for (let i = 0; i < res.data.emails.length; i++) {
//             const e = res.data.emails[i];
//             const dateSpeech = formatDateForSpeech(e.date);

//             await speak(`Email ${i + 1}. To:`);
//             await speakContinuously(e.to);

//             await speak(
//               `Subject: ${e.subject}, Body: ${e.body}, Sent on ${dateSpeech}.`
//             );
//           }
//         } else {
//           await speak("Command not recognized.");
//         }

//         await afterReading(res.data.emails);
//       } catch (error) {
//         console.log(error);
//         await speak("Error fetching sent emails.");
//       }
//     };

//     const afterReading = async (emailsList) => {
//       await speak(
//         "Do you want me to read again, or go to Menu, Inbox, or Compose? Please say your choice."
//       );

//       const navCommand = await listen(10000);

//       if (!navCommand) {
//         await speak("No response detected. Staying on Sent page.");
//         return;
//       }

//       if (navCommand.includes("read again")) {
//         await speak("Say latest or say all.");

//         const cmd = await listen(10000);

//         if (cmd?.includes("latest")) {
//           const latest = emailsList[0];
//           const dateSpeech = formatDateForSpeech(latest.date);

//           await speak("To:");
//           await speakContinuously(latest.to);

//           await speak(
//             `Subject: ${latest.subject}, Body: ${latest.body}, Sent on ${dateSpeech}.`
//           );
//         } else if (cmd?.includes("all")) {
//           for (let i = 0; i < emailsList.length; i++) {
//             const e = emailsList[i];
//             const dateSpeech = formatDateForSpeech(e.date);

//             await speak(`Email ${i + 1}. To:`);
//             await speakContinuously(e.to);

//             await speak(
//               `Subject: ${e.subject}, Body: ${e.body}, Sent on ${dateSpeech}.`
//             );
//           }
//         } else {
//           await speak("Command not recognized.");
//         }

//         await afterReading(emailsList);
//       } else if (navCommand.includes("menu")) {
//         window.location.href = "/menu";
//       } else if (navCommand.includes("inbox")) {
//         window.location.href = "/inbox";
//       } else if (navCommand.includes("compose")) {
//         window.location.href = "/compose";
//       } else {
//         await speak("Command not recognized. Staying on Sent page.");
//       }
//     };

//     fetchAndRead();
//   }, []);

//   return (
//     <div className="container">
//       <div className="sidebar">
//         <div className="brand">VoiceMail</div>

//         <div className="menu">
//           <button onClick={() => (window.location.href = "/compose")}>
//             Compose
//           </button>
//           <button onClick={() => (window.location.href = "/inbox")}>
//             Inbox
//           </button>
//           <button onClick={() => (window.location.href = "/sent")}>Sent</button>
//         </div>
//       </div>

//       <div className="main">
//         <h1>Sent Emails</h1>

//         {emails.length === 0 ? (
//           <p>No sent emails yet.</p>
//         ) : (
//           emails.map((email) => (
//             <div className="email" key={email._id}>
//               <div>To: {email.to}</div>
//               <div>Subject: {email.subject}</div>
//               <div>{email.body}</div>

//               {/* 📅 UI Date + Time */}
//               <div>{formatDateTimeForUI(email.date)}</div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }
// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import "./Sent.css";

// // 🗣 Text-to-speech
// const speak = (text) =>
//   new Promise((resolve) => {
//     const msg = new SpeechSynthesisUtterance(text);
//     msg.lang = "en-IN";
//     msg.rate = 1;
//     msg.pitch = 1;
//     msg.onend = resolve;
//     window.speechSynthesis.speak(msg);
//   });

// // 🎤 Speech-to-text
// const listen = (timeoutMs = 10000) =>
//   new Promise((resolve) => {
//     const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const recognition = new Recognition();
//     recognition.lang = "en-US";

//     let timeout = setTimeout(() => {
//       recognition.stop();
//       resolve(null);
//     }, timeoutMs);

//     recognition.onresult = (event) => {
//       clearTimeout(timeout);
//       recognition.stop();
//       resolve(event.results[0][0].transcript.toLowerCase());
//     };

//     recognition.onerror = () => {
//       clearTimeout(timeout);
//       recognition.stop();
//       resolve(null);
//     };

//     recognition.start();
//   });

// // 🟢 NEW: Normal reading for common domains
// const speakEmailSmart = async (email) => {
//   if (!email) return;

//   const commonDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

//   const domain = email.split("@")[1];

//   if (commonDomains.includes(domain)) {
//     // example: "abc123@gmail.com"
//     const username = email.split("@")[0];

//     const processedDomain = domain.replace(".", " dot ");

//     await speak(`${username} at ${processedDomain}`);
//     return;
//   }

//   // fallback → spell uncommon domains
//   await speakEmailSpelled(email);
// };

// // 🔡 Spell uncommon email IDs character-by-character
// const speakEmailSpelled = async (text) => {
//   if (!text) return;

//   const chars = text.split("").map((char) => {
//     if (char === "@") return "at";
//     if (char === ".") return "dot";
//     if (char === "-") return "dash";
//     if (char === "_") return "underscore";
//     return char;
//   });

//   await speak(chars.join(" "));
// };

// // 📅 Format UI date
// const formatDateTimeForUI = (dateStr) => {
//   const date = new Date(dateStr);
//   return date.toLocaleString("en-GB", {
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// // 🔊 Format speech date
// const formatDateForSpeech = (dateStr) => {
//   const date = new Date(dateStr);
//   const day = date.getDate();
//   const month = date.toLocaleString("en-GB", { month: "long" });
//   const year = date.getFullYear();
//   let hours = date.getHours();
//   const minutes = date.getMinutes();
//   const ampm = hours >= 12 ? "PM" : "AM";
//   if (hours > 12) hours -= 12;
//   if (hours === 0) hours = 12;
//   return `${day} ${month} ${year} at ${hours} ${minutes} ${ampm}`;
// };

// export default function Sent() {
//   const [emails, setEmails] = useState([]);
//   const ranOnce = useRef(false);

//   useEffect(() => {
//     if (ranOnce.current) return;
//     ranOnce.current = true;

//     const fetchAndRead = async () => {
//       try {
//         const res = await axios.get("http://localhost:5000/api/sent");
//         if (!res.data.success) {
//           await speak("Failed to fetch sent emails.");
//           return;
//         }

//         setEmails(res.data.emails);

//         await speak(
//           "Welcome to the Sent page. Say read latest to read the last sent email or say read all to read all emails."
//         );

//         const command = await listen(10000);

//         if (!command) {
//           await speak("No command detected. Reload the page to try again.");
//           return;
//         }

//         if (command.includes("latest")) {
//           const latest = res.data.emails[0];
//           if (latest) {
//             const dateSpeech = formatDateForSpeech(latest.date);

//             await speak("To:");
//             await speakEmailSmart(latest.to);

//             await speak(
//               `Subject: ${latest.subject}, Body: ${latest.body}, Sent on ${dateSpeech}.`
//             );
//           }
//         } else if (command.includes("all")) {
//           for (let i = 0; i < res.data.emails.length; i++) {
//             const e = res.data.emails[i];
//             const dateSpeech = formatDateForSpeech(e.date);

//             await speak(`Email ${i + 1}. To:`);
//             await speakEmailSmart(e.to);

//             await speak(
//               `Subject: ${e.subject}, Body: ${e.body}, Sent on ${dateSpeech}.`
//             );
//           }
//         } else {
//           await speak("Command not recognized.");
//         }

//         await afterReading(res.data.emails);
//       } catch (error) {
//         console.log(error);
//         await speak("Error fetching sent emails.");
//       }
//     };

//     const afterReading = async (emailsList) => {
//       await speak(
//         "Do you want me to read again, or go to Menu, Inbox, or Compose? Please say your choice."
//       );

//       const navCommand = await listen(10000);

//       if (!navCommand) {
//         await speak("No response detected. Staying on Sent page.");
//         return;
//       }

//       if (navCommand.includes("read again")) {
//         await speak("Say latest or say all.");

//         const cmd = await listen(10000);

//         if (cmd?.includes("latest")) {
//           const latest = emailsList[0];
//           const dateSpeech = formatDateForSpeech(latest.date);

//           await speak("To:");
//           await speakEmailSmart(latest.to);

//           await speak(
//             `Subject: ${latest.subject}, Body: ${latest.body}, Sent on ${dateSpeech}.`
//           );
//         } else if (cmd?.includes("all")) {
//           for (let i = 0; i < emailsList.length; i++) {
//             const e = emailsList[i];
//             const dateSpeech = formatDateForSpeech(e.date);

//             await speak(`Email ${i + 1}. To:`);
//             await speakEmailSmart(e.to);

//             await speak(
//               `Subject: ${e.subject}, Body: ${e.body}, Sent on ${dateSpeech}.`
//             );
//           }
//         } else {
//           await speak("Command not recognized.");
//         }

//         await afterReading(emailsList);
//       } else if (navCommand.includes("menu")) {
//         window.location.href = "/menu";
//       } else if (navCommand.includes("inbox")) {
//         window.location.href = "/inbox";
//       } else if (navCommand.includes("compose")) {
//         window.location.href = "/compose";
//       } else {
//         await speak("Command not recognized. Staying on Sent page.");
//       }
//     };

//     fetchAndRead();
//   }, []);

//   return (
//     <div className="container">
//       <div className="sidebar">
//         <div className="brand">VoiceMail</div>

//         <div className="menu">
//           <button onClick={() => (window.location.href = "/compose")}>
//             Compose
//           </button>
//           <button onClick={() => (window.location.href = "/inbox")}>
//             Inbox
//           </button>
//           <button onClick={() => (window.location.href = "/sent")}>Sent</button>
//         </div>
//       </div>

//       <div className="main">
//         <h1>Sent Emails</h1>

//         {emails.length === 0 ? (
//           <p>No sent emails yet.</p>
//         ) : (
//           emails.map((email) => (
//             <div className="email" key={email._id}>
//               <div>To: {email.to}</div>
//               <div>Subject: {email.subject}</div>
//               <div>Body: {email.body}</div>
//               <div>Date and Time: {formatDateTimeForUI(email.date)}</div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Sent.css";

// 🗣 Text-to-speech
const speak = (text) =>
  new Promise((resolve) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "en-IN";
    msg.rate = 1;
    msg.pitch = 1;
    msg.onend = resolve;
    window.speechSynthesis.speak(msg);
  });

// 🎤 Speech-to-text
const listen = (timeoutMs = 10000) =>
  new Promise((resolve) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US";

    let timeout = setTimeout(() => {
      recognition.stop();
      resolve(null);
    }, timeoutMs);

    recognition.onresult = (event) => {
      clearTimeout(timeout);
      recognition.stop();
      resolve(event.results[0][0].transcript.toLowerCase());
    };

    recognition.onerror = () => {
      clearTimeout(timeout);
      recognition.stop();
      resolve(null);
    };

    recognition.start();
  });

// 🟢 NEW: Normal reading for common domains
const speakEmailSmart = async (email) => {
  if (!email) return;

  const commonDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

  const domain = email.split("@")[1];

  if (commonDomains.includes(domain)) {
    const username = email.split("@")[0];
    const processedDomain = domain.replace(".", " dot ");
    await speak(`${username} at ${processedDomain}`);
    return;
  }

  await speakEmailSpelled(email);
};

// 🔡 Spell uncommon email IDs
const speakEmailSpelled = async (text) => {
  if (!text) return;

  const chars = text.split("").map((char) => {
    if (char === "@") return "at";
    if (char === ".") return "dot";
    if (char === "-") return "dash";
    if (char === "_") return "underscore";
    return char;
  });

  await speak(chars.join(" "));
};

// 📅 UI date formatting
const formatDateTimeForUI = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// 🔊 Speech date formatting
const formatDateForSpeech = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "long" });
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${day} ${month} ${year} at ${hours} ${minutes} ${ampm}`;
};

export default function Sent() {
  const [emails, setEmails] = useState([]);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    const fetchAndRead = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/sent");
        if (!res.data.success) {
          await speak("Failed to fetch sent emails.");
          return;
        }

        setEmails(res.data.emails);

        await speak(
          "Welcome to the Sent page. Say read latest to read the last sent email or say read all to read all emails."
        );

        const command = await listen(10000);

        if (!command) {
          await speak("No command detected. Reload the page to try again.");
          return;
        }

        if (command.includes("latest")) {
          const latest = res.data.emails[0];
          if (latest) {
            const dateSpeech = formatDateForSpeech(latest.date);

            await speak("To:");
            await speakEmailSmart(latest.to);

            await speak(
              `Subject: ${latest.subject}, Body: ${latest.body}, Sent on ${dateSpeech}.`
            );
          }
        } else if (command.includes("all")) {
          for (let i = 0; i < res.data.emails.length; i++) {
            const e = res.data.emails[i];
            const dateSpeech = formatDateForSpeech(e.date);

            await speak(`Email ${i + 1}. To:`);
            await speakEmailSmart(e.to);

            await speak(
              `Subject: ${e.subject}, Body: ${e.body}, Sent on ${dateSpeech}.`
            );
          }
        } else {
          await speak("Command not recognized.");
        }

        await afterReading(res.data.emails);
      } catch (error) {
        console.log(error);
        await speak("Error fetching sent emails.");
      }
    };

    const afterReading = async (emailsList) => {
      await speak(
        "Do you want me to read again, or go to Menu, Inbox, or Compose? Please say your choice."
      );

      const navCommand = await listen(10000);

      if (!navCommand) {
        await speak("No response detected. Staying on Sent page.");
        return;
      }

      if (navCommand.includes("read again")) {
        await speak("Say latest or say all.");

        const cmd = await listen(10000);

        if (cmd?.includes("latest")) {
          const latest = emailsList[0];
          const dateSpeech = formatDateForSpeech(latest.date);

          await speak("To:");
          await speakEmailSmart(latest.to);

          await speak(
            `Subject: ${latest.subject}, Body: ${latest.body}, Sent on ${dateSpeech}.`
          );
        } else if (cmd?.includes("all")) {
          for (let i = 0; i < emailsList.length; i++) {
            const e = emailsList[i];
            const dateSpeech = formatDateForSpeech(e.date);

            await speak(`Email ${i + 1}. To:`);
            await speakEmailSmart(e.to);

            await speak(
              `Subject: ${e.subject}, Body: ${e.body}, Sent on ${dateSpeech}.`
            );
          }
        } else {
          await speak("Command not recognized.");
        }

        await afterReading(emailsList);
      } else if (navCommand.includes("menu")) {
        window.location.href = "/menu";
      } else if (navCommand.includes("inbox")) {
        window.location.href = "/inbox";
      } else if (navCommand.includes("compose")) {
        window.location.href = "/compose";
      } else {
        await speak("Command not recognized. Staying on Sent page.");
      }
    };

    fetchAndRead();
  }, []);

  return (
    <div className="container">
      <div className="sidebar">
        <div className="brand">VoiceMail</div>

        <div className="menu">
          <button onClick={() => (window.location.href = "/compose")}>
            Compose
          </button>
          <button onClick={() => (window.location.href = "/inbox")}>
            Inbox
          </button>
          <button onClick={() => (window.location.href = "/sent")}>Sent</button>
        </div>
      </div>

      <div className="main">
        <h1>Sent Emails</h1>

        {emails.length === 0 ? (
          <p>No sent emails yet.</p>
        ) : (
          emails.map((email) => (
            <div className="email" key={email._id}>
              <div><strong>To:</strong> {email.to}</div>
              <div><strong>Subject:</strong> {email.subject}</div>
              <div><strong>Body:</strong> {email.body}</div>
              <div><strong>Date and Time:</strong> {formatDateTimeForUI(email.date)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
