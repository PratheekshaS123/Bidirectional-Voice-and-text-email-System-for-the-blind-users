
// // const express = require("express");
// // const router = express.Router();
// // const Imap = require("imap");
// // const { simpleParser } = require("mailparser");

// // // ✅ Helper: open inbox
// // function openInbox(imap, cb) {
// //   imap.openBox("INBOX", false, cb);
// // }

// // // ✅ Universal Fetch Function
// // function fetchMessages(email, password, searchCriteria = ["ALL"], limit = 50, attempt = 1) {
// //   return new Promise((resolve, reject) => {
// //     const imap = new Imap({
// //       user: email,
// //       password,
// //       host: "imap.gmail.com",
// //       port: 993,
// //       tls: true,
// //       authTimeout: 20000,
// //       connTimeout: 20000,
// //       keepalive: true,
// //       tlsOptions: { servername: "imap.gmail.com" },
// //     });

// //     const messages = [];

// //     imap.once("ready", () => {
// //       openInbox(imap, (err, box) => {
// //         if (err) {
// //           imap.end();
// //           return reject(err);
// //         }

// //         // 🔍 Perform search (like UNSEEN or ALL)
// //         imap.search(searchCriteria, (err, results) => {
// //           if (err) {
// //             imap.end();
// //             return reject(err);
// //           }

// //           if (!results || results.length === 0) {
// //             imap.end();
// //             return resolve([]);
// //           }

// //           // ✅ Always get latest emails first
// //           const fetchList = results.slice(-limit);
// //           const f = imap.fetch(fetchList, { bodies: "", markSeen: false });

// //           f.on("message", (msg, seqno) => {
// //             let rawBuffers = [];
// //             let attributes = null;

// //             msg.on("body", (stream) => {
// //               stream.on("data", (chunk) => rawBuffers.push(chunk));
// //             });

// //             msg.once("attributes", (attrs) => {
// //               attributes = attrs;
// //             });

// //             msg.once("end", async () => {
// //               try {
// //                 const raw = Buffer.concat(rawBuffers);
// //                 const parsed = await simpleParser(raw);
// //                 messages.push({
// //                   seqno,
// //                   uid: attributes?.uid,
// //                   isRead: attributes?.flags?.includes("\\Seen") || false,
// //                   from: parsed.from?.text || "(Unknown Sender)",
// //                   subject: parsed.subject || "(No Subject)",
// //                   date: parsed.date || new Date(),
// //                   body: parsed.text || parsed.html || "(Empty message)",
// //                   flags: attributes?.flags || [],
// //                 });
// //               } catch (err) {
// //                 console.error("Parse error:", err);
// //                 messages.push({
// //                   seqno,
// //                   from: "(Unknown)",
// //                   subject: "(Parse error)",
// //                   date: new Date(),
// //                   body: "(Could not parse message)",
// //                 });
// //               }
// //             });
// //           });

// //           f.once("error", (err) => {
// //             imap.end();
// //             reject(err);
// //           });

// //           f.once("end", () => {
// //             imap.end();
// //             // ✅ Sort by newest date first
// //             messages.sort((a, b) => new Date(b.date) - new Date(a.date));
// //             resolve(messages);
// //           });
// //         });
// //       });
// //     });

// //     imap.once("error", async (err) => {
// //       console.error("IMAP Error:", err.message);
// //       imap.end();
// //       if (
// //         (err.message.includes("timed out") ||
// //           err.message.includes("authentication") ||
// //           err.source === "timeout-auth") &&
// //         attempt < 2
// //       ) {
// //         console.log("Retrying IMAP connection...");
// //         try {
// //           const retry = await fetchMessages(email, password, searchCriteria, limit, attempt + 1);
// //           return resolve(retry);
// //         } catch (retryErr) {
// //           return reject(retryErr);
// //         }
// //       }
// //       reject(err);
// //     });

// //     imap.connect();
// //   });
// // }

// // // 🔍 Search by sender
// // router.post("/search", async (req, res) => {
// //   const { email, password, sender } = req.body;
// //   if (!email || !password || !sender)
// //     return res.json({ success: false, message: "Missing parameters" });

// //   try {
// //     const msgs = await fetchMessages(email, password, ["ALL"], 100);
// //     const filtered = msgs.filter((m) =>
// //       m.from.toLowerCase().includes(sender.toLowerCase())
// //     );
// //     return res.json({ success: true, emails: filtered });
// //   } catch (err) {
// //     console.error("Error in /search:", err);
// //     return res.json({ success: false, message: err.message });
// //   }
// // });

// // // 📥 Fetch all emails
// // router.post("/fetch", async (req, res) => {
// //   const { email, password, limit } = req.body;
// //   if (!email || !password)
// //     return res.json({ success: false, message: "Missing credentials" });

// //   try {
// //     const msgs = await fetchMessages(email, password, ["ALL"], limit || 50);
// //     return res.json({ success: true, emails: msgs });
// //   } catch (err) {
// //     console.error("Error in /fetch:", err);
// //     return res.json({ success: false, message: err.message });
// //   }
// // });

// // // 📬 Fetch unread (UNSEEN) emails
// // router.post("/fetchUnread", async (req, res) => {
// //   const { email, password, limit } = req.body;
// //   if (!email || !password)
// //     return res.json({ success: false, message: "Missing credentials" });

// //   try {
// //     // ✅ Better UNSEEN search (more reliable)
// //     const msgs = await fetchMessages(email, password, ["UNSEEN", ["SINCE", "1-Jan-2020"]], limit || 50);
// //     return res.json({ success: true, emails: msgs });
// //   } catch (err) {
// //     console.error("Error in /fetchUnread:", err);
// //     return res.json({ success: false, message: err.message });
// //   }
// // });

// // // ✅ Mark as read
// // router.post("/markAsRead", async (req, res) => {
// //   const { email, password, seqnos } = req.body;
// //   if (!email || !password || !seqnos)
// //     return res.json({ success: false, message: "Missing parameters" });

// //   const imap = new Imap({
// //     user: email,
// //     password,
// //     host: "imap.gmail.com",
// //     port: 993,
// //     tls: true,
// //     authTimeout: 20000,
// //     connTimeout: 20000,
// //     tlsOptions: { servername: "imap.gmail.com" },
// //   });

// //   imap.once("ready", () => {
// //     openInbox(imap, (err) => {
// //       if (err) {
// //         imap.end();
// //         return res.json({ success: false, message: "Error opening inbox" });
// //       }

// //       const seqString = Array.isArray(seqnos) ? seqnos.join(",") : seqnos;
// //       imap.addFlags(seqString, "\\Seen", (err) => {
// //         imap.end();
// //         if (err) {
// //           console.error("addFlags error:", err);
// //           return res.json({ success: false, message: "Failed to mark as read" });
// //         }
// //         return res.json({ success: true, message: "Marked as read" });
// //       });
// //     });
// //   });

// //   imap.once("error", (err) => {
// //     console.error("markAsRead IMAP error:", err);
// //     return res.json({ success: false, message: "IMAP error", error: err.message });
// //   });

// //   imap.connect();
// // });


// // module.exports = router;
// // const express = require("express");
// // const router = express.Router();
// // const Imap = require("imap");
// // const { simpleParser } = require("mailparser");

// // // ✅ Helper: open inbox
// // function openInbox(imap, cb) {
// //   imap.openBox("INBOX", false, cb);
// // }

// // // ✅ Fetch messages
// // function fetchMessages(email, password, searchCriteria = ["ALL"], limit = 20, attempt = 1) {
// //   return new Promise((resolve, reject) => {
// //     const imap = new Imap({
// //       user: email,
// //       password,
// //       host: "imap.gmail.com",
// //       port: 993,
// //       tls: true,
// //       authTimeout: 20000,
// //       connTimeout: 20000,
// //       keepalive: true,
// //       tlsOptions: { servername: "imap.gmail.com" },
// //     });

// //     const messages = [];

// //     imap.once("ready", () => {
// //       openInbox(imap, (err, box) => {
// //         if (err) {
// //           imap.end();
// //           return reject(err);
// //         }

// //         imap.search(searchCriteria, (err, results) => {
// //           if (err) {
// //             imap.end();
// //             return reject(err);
// //           }

// //           if (!results || results.length === 0) {
// //             imap.end();
// //             return resolve([]);
// //           }

// //           const fetchList = results.slice(-limit);
// //           const f = imap.fetch(fetchList, { bodies: "", markSeen: false });

// //           f.on("message", (msg, seqno) => {
// //             let rawBuffers = [];
// //             let attrs = null;

// //             msg.on("body", (stream) => {
// //               stream.on("data", (chunk) => rawBuffers.push(chunk));
// //             });

// //             msg.once("attributes", (a) => (attrs = a));

// //             msg.once("end", async () => {
// //               try {
// //                 const raw = Buffer.concat(rawBuffers);
// //                 const parsed = await simpleParser(raw);
// //                 messages.push({
// //                   seqno,
// //                   uid: attrs?.uid,
// //                   from: parsed.from?.text || "(Unknown)",
// //                   subject: parsed.subject || "(No Subject)",
// //                   date: parsed.date || new Date(),
// //                   body: parsed.text || "",
// //                   isRead: attrs?.flags?.includes("\\Seen") || false,
// //                 });
// //               } catch (e) {
// //                 messages.push({
// //                   seqno,
// //                   from: "(Parse Error)",
// //                   subject: "(Unreadable Email)",
// //                   date: new Date(),
// //                   body: "",
// //                 });
// //               }
// //             });
// //           });

// //           f.once("error", (err) => {
// //             imap.end();
// //             reject(err);
// //           });

// //           f.once("end", () => {
// //             imap.end();
// //             messages.sort((a, b) => new Date(b.date) - new Date(a.date));
// //             resolve(messages);
// //           });
// //         });
// //       });
// //     });

// //     imap.once("error", (err) => {
// //       console.error("IMAP error:", err.message);
// //       imap.end();
// //       if (attempt < 2)
// //         return resolve(fetchMessages(email, password, searchCriteria, limit, attempt + 1));
// //       reject(err);
// //     });

// //     imap.connect();
// //   });
// // }

// // // 📥 FETCH EMAILS
// // router.post("/fetch", async (req, res) => {
// //   const { email, password, limit } = req.body;
// //   if (!email || !password)
// //     return res.json({ success: false, message: "Missing credentials" });

// //   try {
// //     const msgs = await fetchMessages(email, password, ["ALL"], limit || 20);
// //     res.json({ success: true, emails: msgs });
// //   } catch (err) {
// //     console.error("Fetch error:", err);
// //     res.json({ success: false, message: err.message });
// //   }
// // });

// // // 📬 REAL-TIME WATCHER (SSE)
// // router.get("/watch", async (req, res) => {
// //   const { email, password } = req.query;
// //   if (!email || !password) {
// //     res.writeHead(400);
// //     res.write("Missing credentials");
// //     res.end();
// //     return;
// //   }

// //   res.writeHead(200, {
// //     "Content-Type": "text/event-stream",
// //     "Cache-Control": "no-cache",
// //     Connection: "keep-alive",
// //   });

// //   const imap = new Imap({
// //     user: email,
// //     password,
// //     host: "imap.gmail.com",
// //     port: 993,
// //     tls: true,
// //     keepalive: true,
// //     tlsOptions: { servername: "imap.gmail.com" },
// //   });

// //   const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

// //   imap.once("ready", () => {
// //     openInbox(imap, (err) => {
// //       if (err) {
// //         sendEvent({ error: "Failed to open inbox" });
// //         return;
// //       }

// //       console.log(`👂 Watching inbox for ${email}`);
// //       sendEvent({ message: "Watching inbox..." });

// //       imap.on("mail", (numNewMsgs) => {
// //         console.log(`📩 New mail detected: ${numNewMsgs}`);
// //         // Fetch the latest message only
// //         const f = imap.seq.fetch("*", { bodies: "", markSeen: false });
// //         f.on("message", (msg) => {
// //           msg.on("body", async (stream) => {
// //             const parsed = await simpleParser(stream);
// //             sendEvent({
// //               newMail: true,
// //               from: parsed.from?.text || "Unknown",
// //               subject: parsed.subject || "No Subject",
// //               body: parsed.text || "",
// //               date: parsed.date || new Date(),
// //             });
// //           });
// //         });
// //       });
// //     });
// //   });

// //   imap.once("error", (err) => {
// //     console.error("IMAP watch error:", err);
// //     sendEvent({ error: err.message });
// //   });

// //   req.on("close", () => {
// //     console.log("🔴 Client closed SSE");
// //     imap.end();
// //   });

// //   imap.connect();
// // });
// // router.post("/search", async (req, res) => {
// //   const { email, password, sender } = req.body;
// //   if (!email || !password || !sender)
// //     return res.json({ success: false, message: "Missing parameters" });

// //   try {
// //     const msgs = await fetchMessages(email, password, ["ALL"], 100);
// //     const filtered = msgs.filter((m) =>
// //       m.from.toLowerCase().includes(sender.toLowerCase())
// //     );
// //     return res.json({ success: true, emails: filtered });
// //   } catch (err) {
// //     console.error("Error in /search:", err);
// //     return res.json({ success: false, message: err.message });
// //   }
// // });
// // router.post("/fetchUnread", async (req, res) => {
// //   const { email, password, limit } = req.body;
// //   if (!email || !password)
// //     return res.json({ success: false, message: "Missing credentials" });

// //   try {
// //     // ✅ Better UNSEEN search (more reliable)
// //     const msgs = await fetchMessages(email, password, ["UNSEEN", ["SINCE", "1-Jan-2020"]], limit || 50);
// //     return res.json({ success: true, emails: msgs });
// //   } catch (err) {
// //     console.error("Error in /fetchUnread:", err);
// //     return res.json({ success: false, message: err.message });
// //   }
// // });

// // // ✅ Mark as read
// // router.post("/markAsRead", async (req, res) => {
// //   const { email, password, seqnos } = req.body;
// //   if (!email || !password || !seqnos)
// //     return res.json({ success: false, message: "Missing parameters" });

// //   const imap = new Imap({
// //     user: email,
// //     password,
// //     host: "imap.gmail.com",
// //     port: 993,
// //     tls: true,
// //     authTimeout: 20000,
// //     connTimeout: 20000,
// //     tlsOptions: { servername: "imap.gmail.com" },
// //   });

// //   imap.once("ready", () => {
// //     openInbox(imap, (err) => {
// //       if (err) {
// //         imap.end();
// //         return res.json({ success: false, message: "Error opening inbox" });
// //       }

// //       const seqString = Array.isArray(seqnos) ? seqnos.join(",") : seqnos;
// //       imap.addFlags(seqString, "\\Seen", (err) => {
// //         imap.end();
// //         if (err) {
// //           console.error("addFlags error:", err);
// //           return res.json({ success: false, message: "Failed to mark as read" });
// //         }
// //         return res.json({ success: true, message: "Marked as read" });
// //       });
// //     });
// //   });

// //   imap.once("error", (err) => {
// //     console.error("markAsRead IMAP error:", err);
// //     return res.json({ success: false, message: "IMAP error", error: err.message });
// //   });

// //   imap.connect();
// // });


// // module.exports = router;

// // const express = require("express");
// // const router = express.Router();
// // const Imap = require("imap");
// // const { simpleParser } = require("mailparser");

// // // ✅ Helper: open inbox
// // function openInbox(imap, cb) {
// //   imap.openBox("INBOX", false, cb);
// // }

// // // ✅ Common IMAP Fetch function
// // function fetchMessages(email, password, searchCriteria = ["ALL"], limit = 20, attempt = 1) {
// //   return new Promise((resolve, reject) => {
// //     const imap = new Imap({
// //       user: email,
// //       password,
// //       host: "imap.gmail.com",
// //       port: 993,
// //       tls: true,
// //       authTimeout: 20000,
// //       connTimeout: 20000,
// //       keepalive: true,
// //       tlsOptions: { servername: "imap.gmail.com" },
// //     });

// //     const messages = [];

// //     imap.once("ready", () => {
// //       openInbox(imap, (err, box) => {
// //         if (err) {
// //           imap.end();
// //           return reject(err);
// //         }

// //         imap.search(searchCriteria, (err, results) => {
// //           if (err) {
// //             imap.end();
// //             return reject(err);
// //           }

// //           if (!results || results.length === 0) {
// //             imap.end();
// //             return resolve([]);
// //           }

// //           const fetchList = results.slice(-limit);
// //           const f = imap.fetch(fetchList, { bodies: "", markSeen: false });

// //           f.on("message", (msg, seqno) => {
// //             let rawBuffers = [];
// //             let attrs = null;

// //             msg.on("body", (stream) => {
// //               stream.on("data", (chunk) => rawBuffers.push(chunk));
// //             });

// //             msg.once("attributes", (a) => (attrs = a));

// //             msg.once("end", async () => {
// //               try {
// //                 const raw = Buffer.concat(rawBuffers);
// //                 const parsed = await simpleParser(raw);
// //                 messages.push({
// //                   seqno,
// //                   uid: attrs?.uid,
// //                   from: parsed.from?.text || "(Unknown)",
// //                   subject: parsed.subject || "(No Subject)",
// //                   date: parsed.date || new Date(),
// //                   body: parsed.text || "",
// //                   isRead: attrs?.flags?.includes("\\Seen") || false,
// //                 });
// //               } catch (e) {
// //                 messages.push({
// //                   seqno,
// //                   from: "(Parse Error)",
// //                   subject: "(Unreadable Email)",
// //                   date: new Date(),
// //                   body: "",
// //                 });
// //               }
// //             });
// //           });

// //           f.once("error", (err) => {
// //             imap.end();
// //             reject(err);
// //           });

// //           f.once("end", () => {
// //             imap.end();
// //             messages.sort((a, b) => new Date(b.date) - new Date(a.date));
// //             resolve(messages);
// //           });
// //         });
// //       });
// //     });

// //     imap.once("error", (err) => {
// //       console.error("IMAP error:", err.message);
// //       imap.end();
// //       if (attempt < 2)
// //         return resolve(fetchMessages(email, password, searchCriteria, limit, attempt + 1));
// //       reject(err);
// //     });

// //     imap.connect();
// //   });
// // }

// // // 📥 FETCH ALL EMAILS
// // router.post("/fetch", async (req, res) => {
// //   const { email, password, limit } = req.body;
// //   if (!email || !password)
// //     return res.json({ success: false, message: "Missing credentials" });

// //   try {
// //     const msgs = await fetchMessages(email, password, ["ALL"], limit || 20);
// //     res.json({ success: true, emails: msgs });
// //   } catch (err) {
// //     console.error("Fetch error:", err);
// //     res.json({ success: false, message: err.message });
// //   }
// // });

// // // 📬 FETCH UNREAD EMAILS
// // router.post("/fetchUnread", async (req, res) => {
// //   const { email, password, limit } = req.body;
// //   if (!email || !password)
// //     return res.json({ success: false, message: "Missing credentials" });

// //   try {
// //     const msgs = await fetchMessages(
// //       email,
// //       password,
// //       ["UNSEEN", ["SINCE", "1-Jan-2020"]],
// //       limit || 50
// //     );
// //     return res.json({ success: true, emails: msgs });
// //   } catch (err) {
// //     console.error("Error in /fetchUnread:", err);
// //     return res.json({ success: false, message: err.message });
// //   }
// // });

// // // 🔍 SEARCH EMAILS BY SENDER
// // router.post("/search", async (req, res) => {
// //   const { email, password, sender } = req.body;
// //   if (!email || !password || !sender)
// //     return res.json({ success: false, message: "Missing parameters" });

// //   try {
// //     const msgs = await fetchMessages(email, password, ["ALL"], 100);
// //     const filtered = msgs.filter((m) =>
// //       m.from.toLowerCase().includes(sender.toLowerCase())
// //     );
// //     return res.json({ success: true, emails: filtered });
// //   } catch (err) {
// //     console.error("Error in /search:", err);
// //     return res.json({ success: false, message: err.message });
// //   }
// // });

// // // ✅ MARK EMAILS AS READ
// // router.post("/markAsRead", async (req, res) => {
// //   const { email, password, seqnos } = req.body;
// //   if (!email || !password || !seqnos)
// //     return res.json({ success: false, message: "Missing parameters" });

// //   const imap = new Imap({
// //     user: email,
// //     password,
// //     host: "imap.gmail.com",
// //     port: 993,
// //     tls: true,
// //     authTimeout: 20000,
// //     connTimeout: 20000,
// //     tlsOptions: { servername: "imap.gmail.com" },
// //   });

// //   imap.once("ready", () => {
// //     openInbox(imap, (err) => {
// //       if (err) {
// //         imap.end();
// //         return res.json({ success: false, message: "Error opening inbox" });
// //       }

// //       const seqString = Array.isArray(seqnos) ? seqnos.join(",") : seqnos;
// //       imap.addFlags(seqString, "\\Seen", (err) => {
// //         imap.end();
// //         if (err) {
// //           console.error("addFlags error:", err);
// //           return res.json({ success: false, message: "Failed to mark as read" });
// //         }
// //         return res.json({ success: true, message: "Marked as read" });
// //       });
// //     });
// //   });

// //   imap.once("error", (err) => {
// //     console.error("markAsRead IMAP error:", err);
// //     return res.json({ success: false, message: "IMAP error", error: err.message });
// //   });

// //   imap.connect();
// // });

// // // 📡 WATCH REAL-TIME INCOMING MAIL (SSE)
// // router.get("/watch", async (req, res) => {
// //   const { email, password } = req.query;
// //   if (!email || !password) {
// //     res.writeHead(400);
// //     res.write("Missing credentials");
// //     res.end();
// //     return;
// //   }

// //   res.writeHead(200, {
// //     "Content-Type": "text/event-stream",
// //     "Cache-Control": "no-cache",
// //     Connection: "keep-alive",
// //   });

// //   const imap = new Imap({
// //     user: email,
// //     password,
// //     host: "imap.gmail.com",
// //     port: 993,
// //     tls: true,
// //     keepalive: true,
// //     tlsOptions: { servername: "imap.gmail.com" },
// //   });

// //   const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

// //   imap.once("ready", () => {
// //     openInbox(imap, (err) => {
// //       if (err) {
// //         sendEvent({ error: "Failed to open inbox" });
// //         return;
// //       }

// //       console.log(`👂 Watching inbox for ${email}`);
// //       sendEvent({ message: "Watching inbox..." });

// //       imap.on("mail", (numNewMsgs) => {
// //         console.log(`📩 New mail detected: ${numNewMsgs}`);
// //         const f = imap.seq.fetch("*", { bodies: "", markSeen: false });
// //         f.on("message", (msg) => {
// //           msg.on("body", async (stream) => {
// //             const parsed = await simpleParser(stream);
// //             sendEvent({
// //               newMail: true,
// //               from: parsed.from?.text || "Unknown",
// //               subject: parsed.subject || "No Subject",
// //               body: parsed.text || "",
// //               date: parsed.date || new Date(),
// //             });
// //           });
// //         });
// //       });
// //     });
// //   });

// //   imap.once("error", (err) => {
// //     console.error("IMAP watch error:", err);
// //     sendEvent({ error: err.message });
// //   });

// //   req.on("close", () => {
// //     console.log("🔴 Client closed SSE");
// //     imap.end();
// //   });

// //   imap.connect();
// // });

// // module.exports = router;
// const express = require("express");
// const router = express.Router();
// const Imap = require("imap");
// const { simpleParser } = require("mailparser");

// // ✅ Helper: open inbox
// function openInbox(imap, cb) {
//   imap.openBox("INBOX", false, cb);
// }

// // ✅ Common IMAP Fetch function
// function fetchMessages(email, password, searchCriteria = ["ALL"], limit = 20) {
//   return new Promise((resolve, reject) => {
//     const imap = new Imap({
//       user: email,
//       password,
//       host: "imap.gmail.com",
//       port: 993,
//       tls: true,
//       authTimeout: 20000,
//       connTimeout: 20000,
//       keepalive: true,
//       tlsOptions: { servername: "imap.gmail.com" },
//     });

//     const messages = [];

//     imap.once("ready", () => {
//       openInbox(imap, (err, box) => {
//         if (err) {
//           imap.end();
//           return reject(err);
//         }

//         imap.search(searchCriteria, (err, results) => {
//           if (err) {
//             imap.end();
//             return reject(err);
//           }

//           if (!results || results.length === 0) {
//             imap.end();
//             return resolve([]);
//           }

//           const fetchList = results.slice(-limit);
//           const f = imap.fetch(fetchList, { bodies: "", markSeen: false });

//           f.on("message", (msg, seqno) => {
//             let rawBuffers = [];
//             let attrs = null;

//             msg.on("body", (stream) => {
//               stream.on("data", (chunk) => rawBuffers.push(chunk));
//             });

//             msg.once("attributes", (a) => (attrs = a));

//             msg.once("end", async () => {
//               try {
//                 const raw = Buffer.concat(rawBuffers);
//                 const parsed = await simpleParser(raw);
//                 messages.push({
//                   seqno,
//                   uid: attrs?.uid,
//                   from: parsed.from?.text || "(Unknown)",
//                   subject: parsed.subject || "(No Subject)",
//                   date: parsed.date || new Date(),
//                   body: parsed.text || "",
//                   isRead: attrs?.flags?.includes("\\Seen") || false,
//                 });
//               } catch (e) {
//                 messages.push({
//                   seqno,
//                   from: "(Parse Error)",
//                   subject: "(Unreadable Email)",
//                   date: new Date(),
//                   body: "",
//                 });
//               }
//             });
//           });

//           f.once("error", (err) => {
//             imap.end();
//             reject(err);
//           });

//           f.once("end", () => {
//             imap.end();
//             messages.sort((a, b) => new Date(b.date) - new Date(a.date));
//             resolve(messages);
//           });
//         });
//       });
//     });

//     imap.once("error", (err) => {
//       console.error("IMAP error:", err.message);
//       imap.end();
//       reject(err);
//     });

//     imap.connect();
//   });
// }

// // 📥 FETCH ALL EMAILS
// router.post("/fetch", async (req, res) => {
//   const { email, password, limit } = req.body;
//   if (!email || !password) return res.json({ success: false, message: "Missing credentials" });

//   try {
//     const msgs = await fetchMessages(email, password, ["ALL"], limit || 20);
//     res.json({ success: true, emails: msgs });
//   } catch (err) {
//     console.error("Fetch error:", err);
//     res.json({ success: false, message: err.message });
//   }
// });

// // 📬 FETCH UNREAD EMAILS
// router.post("/fetchUnread", async (req, res) => {
//   const { email, password, limit } = req.body;
//   if (!email || !password) return res.json({ success: false, message: "Missing credentials" });

//   try {
//     const msgs = await fetchMessages(email, password, ["UNSEEN", ["SINCE", "1-Jan-2020"]], limit || 50);
//     return res.json({ success: true, emails: msgs });
//   } catch (err) {
//     console.error("Error in /fetchUnread:", err);
//     return res.json({ success: false, message: err.message });
//   }
// });

// // 🔍 SEARCH EMAILS BY SENDER
// router.post("/search", async (req, res) => {
//   const { email, password, sender } = req.body;
//   if (!email || !password || !sender) return res.json({ success: false, message: "Missing parameters" });

//   try {
//     const msgs = await fetchMessages(email, password, ["ALL"], 100);
//     const filtered = msgs.filter((m) => m.from.toLowerCase().includes(sender.toLowerCase()));
//     return res.json({ success: true, emails: filtered });
//   } catch (err) {
//     console.error("Error in /search:", err);
//     return res.json({ success: false, message: err.message });
//   }
// });

// // ✅ MARK EMAILS AS READ
// router.post("/markAsRead", async (req, res) => {
//   const { email, password, seqnos } = req.body;
//   if (!email || !password || !seqnos) return res.json({ success: false, message: "Missing parameters" });

//   const imap = new Imap({
//     user: email,
//     password,
//     host: "imap.gmail.com",
//     port: 993,
//     tls: true,
//     authTimeout: 20000,
//     connTimeout: 20000,
//     tlsOptions: { servername: "imap.gmail.com" },
//   });

//   imap.once("ready", () => {
//     openInbox(imap, (err) => {
//       if (err) {
//         imap.end();
//         return res.json({ success: false, message: "Error opening inbox" });
//       }

//       const seqString = Array.isArray(seqnos) ? seqnos.join(",") : seqnos;
//       imap.addFlags(seqString, "\\Seen", (err) => {
//         imap.end();
//         if (err) {
//           console.error("addFlags error:", err);
//           return res.json({ success: false, message: "Failed to mark as read" });
//         }
//         return res.json({ success: true, message: "Marked as read" });
//       });
//     });
//   });

//   imap.once("error", (err) => {
//     console.error("markAsRead IMAP error:", err);
//     return res.json({ success: false, message: "IMAP error", error: err.message });
//   });

//   imap.connect();
// });

// // 📡 WATCH REAL-TIME INCOMING MAIL (SSE)
// router.get("/watch", async (req, res) => {
//   const { email, password } = req.query;
//   if (!email || !password) {
//     res.writeHead(400);
//     res.write("Missing credentials");
//     res.end();
//     return;
//   }

//   res.writeHead(200, {
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache",
//     Connection: "keep-alive",
//   });

//   const imap = new Imap({
//     user: email,
//     password,
//     host: "imap.gmail.com",
//     port: 993,
//     tls: true,
//     keepalive: true,
//     tlsOptions: { servername: "imap.gmail.com" },
//   });

//   const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

//   imap.once("ready", () => {
//     openInbox(imap, (err) => {
//       if (err) {
//         sendEvent({ error: "Failed to open inbox" });
//         return;
//       }

//       console.log(`👂 Watching inbox for ${email}`);
//       sendEvent({ message: "Watching inbox..." });

//       imap.on("mail", (numNewMsgs) => {
//         const f = imap.seq.fetch(`${numNewMsgs}:*`, { bodies: "", markSeen: false });
//         f.on("message", (msg, seqno) => {
//           let rawBuffers = [];
//           msg.on("body", (stream) => {
//             stream.on("data", (chunk) => rawBuffers.push(chunk));
//           });
//           msg.once("end", async () => {
//             try {
//               const parsed = await simpleParser(Buffer.concat(rawBuffers));
//               sendEvent({
//                 newMail: true,
//                 seqno,
//                 from: parsed.from?.text || "Unknown",
//                 subject: parsed.subject || "No Subject",
//                 body: parsed.text || "",
//                 date: parsed.date || new Date(),
//               });
//             } catch (err) {
//               console.error("Parsing new email error:", err);
//             }
//           });
//         });
//       });
//     });
//   });

//   imap.once("error", (err) => {
//     console.error("IMAP watch error:", err);
//     sendEvent({ error: err.message });
//   });

//   req.on("close", () => {
//     console.log("🔴 Client closed SSE");
//     imap.end();
//   });

//   imap.connect();
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const Imap = require("imap");
const { simpleParser } = require("mailparser");

// ✅ Helper: open inbox
function openInbox(imap, cb) {
  imap.openBox("INBOX", false, cb);
}

// ✅ Common IMAP Fetch function
function fetchMessages(email, password, searchCriteria = ["ALL"], limit = 20) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email,
      password,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      authTimeout: 20000,
      connTimeout: 20000,
      keepalive: true,
      tlsOptions: { servername: "imap.gmail.com" },
    });

    const messages = [];

    imap.once("ready", () => {
      openInbox(imap, (err) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (!results || results.length === 0) {
            imap.end();
            return resolve([]);
          }

          const fetchList = results.slice(-limit);
          const f = imap.fetch(fetchList, { bodies: "", markSeen: false });

          f.on("message", (msg, seqno) => {
            let rawBuffers = [];
            let attrs = null;

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => rawBuffers.push(chunk));
            });

            msg.once("attributes", (a) => (attrs = a));

            msg.once("end", async () => {
              try {
                const raw = Buffer.concat(rawBuffers);
                const parsed = await simpleParser(raw);
                messages.push({
                  seqno,
                  uid: attrs?.uid,
                  from: parsed.from?.text || "(Unknown)",
                  subject: parsed.subject || "(No Subject)",
                  date: parsed.date || new Date(),
                  body: parsed.text || "",
                  isRead: attrs?.flags?.includes("\\Seen") || false,
                });
              } catch {
                messages.push({
                  seqno,
                  from: "(Parse Error)",
                  subject: "(Unreadable Email)",
                  date: new Date(),
                  body: "",
                  isRead: false,
                });
              }
            });
          });

          f.once("error", (err) => {
            imap.end();
            reject(err);
          });

          f.once("end", () => {
            imap.end();
            messages.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(messages);
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.error("IMAP error:", err.message);
      imap.end();
      reject(err);
    });

    imap.connect();
  });
}

// 📥 FETCH ALL EMAILS
router.post("/fetch", async (req, res) => {
  const { email, password, limit } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: "Missing credentials" });

  try {
    const msgs = await fetchMessages(email, password, ["ALL"], limit || 20);
    res.json({ success: true, emails: msgs });
  } catch (err) {
    console.error("Fetch error:", err);
    res.json({ success: false, message: err.message });
  }
});

// 📬 FETCH UNREAD EMAILS
router.post("/fetchUnread", async (req, res) => {
  const { email, password, limit } = req.body;
  if (!email || !password)
    return res.json({ success: false, message: "Missing credentials" });

  try {
    // ✅ FIX: only UNSEEN, no SINCE filter
    const msgs = await fetchMessages(email, password, ["UNSEEN"], limit || 50);
    return res.json({ success: true, emails: msgs });
  } catch (err) {
    console.error("Error in /fetchUnread:", err);
    return res.json({ success: false, message: err.message });
  }
});

// 🔍 SEARCH EMAILS BY SENDER
router.post("/search", async (req, res) => {
  const { email, password, sender } = req.body;
  if (!email || !password || !sender)
    return res.json({ success: false, message: "Missing parameters" });

  try {
    const msgs = await fetchMessages(email, password, ["ALL"], 100);
    const filtered = msgs.filter((m) =>
      m.from.toLowerCase().includes(sender.toLowerCase())
    );
    return res.json({ success: true, emails: filtered });
  } catch (err) {
    console.error("Error in /search:", err);
    return res.json({ success: false, message: err.message });
  }
});

// ✅ MARK EMAILS AS READ
router.post("/markAsRead", async (req, res) => {
  const { email, password, seqnos } = req.body;
  if (!email || !password || !seqnos)
    return res.json({ success: false, message: "Missing parameters" });

  const imap = new Imap({
    user: email,
    password,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 20000,
    connTimeout: 20000,
    tlsOptions: { servername: "imap.gmail.com" },
  });

  imap.once("ready", () => {
    openInbox(imap, (err) => {
      if (err) {
        imap.end();
        return res.json({ success: false, message: "Error opening inbox" });
      }

      const seqString = Array.isArray(seqnos) ? seqnos.join(",") : seqnos;
      imap.addFlags(seqString, "\\Seen", (err) => {
        imap.end();
        if (err) {
          console.error("addFlags error:", err);
          return res.json({ success: false, message: "Failed to mark as read" });
        }
        return res.json({ success: true, message: "Marked as read" });
      });
    });
  });

  imap.once("error", (err) => {
    console.error("markAsRead IMAP error:", err);
    return res.json({ success: false, message: "IMAP error", error: err.message });
  });

  imap.connect();
});
router.get("/watch", async (req, res) => {
  const { email, password } = req.query;
  if (!email || !password) {
    res.writeHead(400);
    res.write("Missing credentials");
    res.end();
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const imap = new Imap({
    user: email,
    password,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    keepalive: true,
    tlsOptions: { servername: "imap.gmail.com" },
  });

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  imap.once("ready", () => {
    openInbox(imap, (err) => {
      if (err) {
        sendEvent({ error: "Failed to open inbox" });
        return;
      }

      console.log(`👂 Watching inbox for ${email}`);
      sendEvent({ message: "Watching inbox..." });

      imap.on("mail", (numNewMsgs) => {
        const f = imap.seq.fetch(`${numNewMsgs}:*`, { bodies: "", markSeen: false });
        f.on("message", (msg, seqno) => {
          let rawBuffers = [];
          msg.on("body", (stream) => {
            stream.on("data", (chunk) => rawBuffers.push(chunk));
          });
          msg.once("end", async () => {
            try {
              const parsed = await simpleParser(Buffer.concat(rawBuffers));
              sendEvent({
                newMail: true,
                seqno,
                from: parsed.from?.text || "Unknown",
                subject: parsed.subject || "No Subject",
                body: parsed.text || "",
                date: parsed.date || new Date(),
              });
            } catch (err) {
              console.error("Parsing new email error:", err);
            }
          });
        });
      });
    });
  });

  imap.once("error", (err) => {
    console.error("IMAP watch error:", err);
    sendEvent({ error: err.message });
  });

  req.on("close", () => {
    console.log("🔴 Client closed SSE");
    imap.end();
  });

  imap.connect();
});

module.exports = router;
