
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Volume2, VolumeX } from "lucide-react";
import "./App.css";

type Message = {
  text: string;
  sender: "minmin" | "you";
};

type Mode = "companion" | "tutor";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function Minmin({
  mood,
  onPoke,
}: {
  mood: string;
  onPoke: () => void;
}) {
  return (
    <motion.button
      type="button"
      className={`creature ${mood}`}
      onClick={onPoke}
      animate={{
        y: [0, -13, 0],
        rotate: [-2, 2, -2],
        scale: mood === "excited" ? [1, 1.06, 1] : [1, 1.02, 1],
      }}
      transition={{
        duration: mood === "excited" ? 0.55 : 3.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      whileTap={{ scale: 0.9, rotate: 5 }}
      aria-label="Poke Minmin"
    >
      <img
        src="/minmin.png"
        alt="Minmin, your Korean learning companion"
        className="minmin-image"
        draggable="false"
      />
    </motion.button>
  );
}

function App() {
  const [input, setInput] = useState("");
  const [mood, setMood] = useState("happy");
  const [mode, setMode] = useState<Mode>("companion");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "minmin",
      text: "Oh. You're here. I was having a very important staring-at-the-universe session. Anyway, 안녕.",
    },
  ]);

  const [xp, setXp] = useState(120);
  const [streak] = useState(3);

  // Load the voices available in the browser.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Find Minmin's most recent reply, not the user's last message.
  const latestMinminMessage = [...messages]
    .reverse()
    .find((message) => message.sender === "minmin");

  function speakMinmin() {
    if (!latestMinminMessage || !("speechSynthesis" in window)) {
      return;
    }

    // Clicking again stops Minmin.
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const text = latestMinminMessage.text;
    const isKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);

    const utterance = new SpeechSynthesisUtterance(text);

    // Choose a voice matching the language of the reply.
    const preferredLanguage = isKorean ? "ko" : "en";

    const matchingVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(preferredLanguage)
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      utterance.lang = matchingVoice.lang;
    } else {
      utterance.lang = isKorean ? "ko-KR" : "en-US";
    }

    // A softer, slightly slower delivery.
    utterance.pitch = isKorean ? 0.95 : 0.82;
    utterance.rate = 0.92;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);

    utterance.onend = () => setIsSpeaking(false);

    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    // Stop any previous speech when starting a new conversation.
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const userMessage = input.trim();

    setInput("");
    setIsLoading(true);
    setMood("excited");

    setMessages((previous) => [
      ...previous,
      { sender: "you", text: userMessage },
    ]);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          mode: mode,
        }),
      });

      if (!response.ok) {
        throw new Error("The backend returned an error.");
      }

      const data = await response.json();

      setMessages((previous) => [
        ...previous,
        { sender: "minmin", text: data.reply },
      ]);

      setXp((previous) => previous + 5);
    } catch (error) {
      console.error("Minmin connection error:", error);

      setMessages((previous) => [
        ...previous,
        {
          sender: "minmin",
          text: "Hmm. I can't reach my brain right now. Is my backend running?",
        },
      ]);
    } finally {
      setIsLoading(false);
      window.setTimeout(() => setMood("happy"), 1600);
    }
  }

  function changeMode(nextMode: Mode) {
    if (nextMode === mode) return;

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setMode(nextMode);

    setMessages((previous) => [
      ...previous,
      {
        sender: "minmin",
        text:
          nextMode === "tutor"
            ? "Tutor mode activated. Alright, let's put that Korean knowledge to work. What are we studying?"
            : "Back to companion mode. Finally, some peace. So, what are we talking about?",
      },
    ]);

    setMood("excited");
    window.setTimeout(() => setMood("happy"), 1300);
  }

  function pokeMinmin() {
    const reactions = [
      "EXCUSE YOU. I was floating.",
      "Boop?! I did NOT consent to being booped.",
      "Stop poking me. ...Again.",
      "Do you need something or are you just obsessed with me?",
      "I am a sophisticated magical being. Behave.",
    ];

    const reaction =
      reactions[Math.floor(Math.random() * reactions.length)];

    setMessages((previous) => [
      ...previous,
      { sender: "minmin", text: reaction },
    ]);

    setMood("excited");
    window.setTimeout(() => setMood("happy"), 1300);
  }

  return (
    <main className="world">
      <div className="nebula nebula-one" />
      <div className="nebula nebula-two" />
      <div className="moon" />

      <div className="stars">
        {Array.from({ length: 35 }, (_, index) => (
          <span
            key={index}
            className="star"
            style={{
              left: `${(index * 37) % 100}%`,
              top: `${(index * 61) % 100}%`,
              animationDelay: `${(index % 7) * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="island island-back">
        <span className="island-tree" />
      </div>

      <div className="island island-front">
        <span className="island-plant" />
      </div>

      <header className="topbar">
        <div className="brand">
          minmin<span>.</span>
        </div>

        <div className="world-label">
          A LITTLE WORLD OF KOREAN
        </div>

        <div className="stats">
          <span>{streak} day streak</span>
          <span>{xp} XP</span>
        </div>
      </header>

      <section className="experience">
        <div className="welcome">
          <span className="eyebrow">YOUR LITTLE UNIVERSE</span>
          <h1>
            You've entered <em>my</em> world.
          </h1>
          <p>Try not to break anything. Especially my patience.</p>
        </div>

        <div className="character-area">
          <div className="character-glow" />

          <AnimatePresence mode="wait">
            <motion.div
              key={messages.length}
              className="speech-bubble"
              initial={{ opacity: 0, y: 10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              {isLoading
                ? "Hmm... let me think."
                : messages[messages.length - 1].text}
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            className="voice-button"
            onClick={speakMinmin}
            disabled={!latestMinminMessage || isLoading}
            title={isSpeaking ? "Stop Minmin speaking" : "Let Minmin speak"}
            aria-label={isSpeaking ? "Stop speaking" : "Speak reply"}
          >
            {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span>{isSpeaking ? "STOP" : "LET ME HEAR YOU"}</span>
          </button>

          <Minmin mood={mood} onPoke={pokeMinmin} />

          <div className="ground-shadow" />
          <span className="poke-hint">psst... you can poke me</span>
        </div>

        <div className="conversation">
          <div className="conversation-label">
            <span>YOUR TURN</span>
            <span className="online">
              <i /> {isLoading ? "MINMIN IS THINKING" : "MINMIN IS LISTENING"}
            </span>
          </div>

          <div className="mode-switch">
            <button
              type="button"
              className={mode === "companion" ? "active" : ""}
              onClick={() => changeMode("companion")}
              aria-pressed={mode === "companion"}
            >
              Companion
            </button>

            <button
              type="button"
              className={mode === "tutor" ? "active" : ""}
              onClick={() => changeMode("tutor")}
              aria-pressed={mode === "tutor"}
            >
              Tutor
            </button>
          </div>

          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === "tutor"
                  ? "Ask about Korean grammar, vocabulary..."
                  : "Say something in Korean... or English. I guess."
              }
              aria-label="Message Minmin"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </form>

          <div className="quick-actions">
            <button onClick={() => setInput("안녕하세요!")}>
              안녕하세요
            </button>
            <button onClick={() => setInput("도와주세요")}>
              Help me
            </button>
            <button onClick={() => setInput("I'm bored")}>
              I'm bored
            </button>
            <button onClick={() => setInput("학교에 가요")}>
              Test my Korean
            </button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>
          somewhere between the stars and your next Korean lesson
        </span>
        <span>
          <Volume2 size={13} /> VOICE EXPERIMENTAL
        </span>
      </footer>
    </main>
  );
}

export default App;
