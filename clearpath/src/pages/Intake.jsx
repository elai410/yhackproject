import { useState, useRef, useEffect } from "react";

const API = "http://localhost:3001";

export const SENTIMENT_STYLES = {
  calm:       { bg: "#dcfce7", color: "#15803d", icon: "😌" },
  anxious:    { bg: "#fef9c3", color: "#a16207", icon: "😟" },
  scared:     { bg: "#fee2e2", color: "#b91c1c", icon: "😨" },
  confused:   { bg: "#f3e8ff", color: "#7e22ce", icon: "😕" },
  distressed: { bg: "#fee2e2", color: "#b91c1c", icon: "😰" },
  "in-pain":  { bg: "#ffedd5", color: "#c2410c", icon: "😣" },
};

export default function Intake({ onRouted }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [started, setStarted]   = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setInput("");
    setStarted(true);

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/converse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (data.mode === "question") {
        setMessages(prev => [...prev, { role: "assistant", content: data.question }]);
      } else if (data.mode === "route") {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.reason,
          isRouting: true,
        }]);
        setTimeout(() => onRouted(data, newMessages), 1200);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting. Please try again.",
      }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div style={S.root}>
      {!started && (
        <div style={S.intro}>
          <div style={S.introIcon}>＋</div>
          <h2 style={S.introHeading}>What brings you in today?</h2>
          <p style={S.introSub}>
            Describe your situation in your own words — any language. Our AI triage nurse will guide you to the right place.
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <div style={S.chat}>
          {messages.map((m, i) => (
            <div key={i} style={{
              ...S.bubble,
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "#3B8BD4" : m.isRouting ? "#f0fdf4" : "#fff",
              color: m.role === "user" ? "#fff" : m.isRouting ? "#15803d" : "#334155",
              border: m.isRouting ? "1px solid #4ade80" : m.role === "user" ? "none" : "1px solid #e2e8f0",
            }}>
              {m.isRouting && <span style={{ marginRight: 6 }}>✓</span>}
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ ...S.bubble, alignSelf: "flex-start", background: "#fff", border: "1px solid #e2e8f0" }}>
              <span style={{ display: "inline-flex", gap: 3, fontSize: 18 }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ animation: `blink 1s infinite ${d}s` }}>·</span>
                ))}
              </span>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      )}

      <div style={S.inputRow}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={started ? "Type your answer…" : "e.g. my brother was bitten by a dog…"}
          rows={2}
          style={S.textarea}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ ...S.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}>
          →
        </button>
      </div>
      <p style={S.hint}>Press Enter to send · Shift+Enter for new line</p>
      <style>{`@keyframes blink { 0%,100%{opacity:0.2} 50%{opacity:1} }`}</style>
    </div>
  );
}

const S = {
  root:         { display: "flex", flexDirection: "column", gap: 12 },
  intro:        { textAlign: "center", padding: "8px 0 4px" },
  introIcon:    { fontSize: 36, color: "#3B8BD4", marginBottom: 8 },
  introHeading: { fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" },
  introSub:     { fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 },
  chat:         { display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto", padding: "4px 0" },
  bubble:       { maxWidth: "80%", padding: "10px 14px", borderRadius: 14, fontSize: 14, lineHeight: 1.6 },
  inputRow:     { display: "flex", gap: 8, alignItems: "flex-end" },
  textarea:     { flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, resize: "none", fontFamily: "inherit", lineHeight: 1.5 },
  sendBtn:      { padding: "10px 18px", borderRadius: 12, border: "none", background: "#3B8BD4", color: "#fff", fontSize: 20, cursor: "pointer" },
  hint:         { fontSize: 11, color: "#94a3b8", margin: 0, textAlign: "center" },
};