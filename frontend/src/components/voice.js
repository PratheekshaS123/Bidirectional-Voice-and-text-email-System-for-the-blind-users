
export const speak = (text) => {
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = resolve;
    utter.onerror = resolve;
    window.speechSynthesis.speak(utter);
  });
};

export const listen = (timeout = 10000) => {
  return new Promise((resolve) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      resolve("");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let timer = setTimeout(() => {
      recognition.stop();
      resolve("");
    }, timeout);

    recognition.onresult = (event) => {
      clearTimeout(timer);
      resolve(event.results[0][0].transcript);
    };

    recognition.onerror = () => {
      clearTimeout(timer);
      resolve("");
    };

    recognition.start();
  });
};

export const normalizeEmail = (spoken) => {
  return spoken
    .toLowerCase()
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+dot\s+/g, ".")
    .replace(/[-\s]/g, "")
    .replace(/[^a-z0-9@._]/g, "")
    .replace(/\.$/, "");
};
