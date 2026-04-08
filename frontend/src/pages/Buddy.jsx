import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

function SuggestionCard({ suggestion }) {
  return (
    <div className="suggestion-card">
      <div className="suggestion-activity">
        🎯 {suggestion.activity}
      </div>
      <div className="suggestion-row">
        <span className="icon">💡</span>
        <span>{suggestion.reason}</span>
      </div>
      <div className="suggestion-row">
        <span className="icon">⏰</span>
        <span>Best timing: <strong>{suggestion.timing}</strong></span>
      </div>
      <div className="suggestion-row">
        <span className="icon">✨</span>
        <span>{suggestion.tip}</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

export default function Buddy() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Auto-greet on first load
  useEffect(() => {
    if (user && messages.length === 0) {
      fetchSuggestion("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSuggestion = async (message) => {
    if (!user) return;
    setIsTyping(true);

    try {
      const res = await api.post("/api/buddy/suggest", {
        user_id: user.id,
        message,
      });

      const suggestion = res.data.suggestion;
      const weather = res.data.weather;

      // Simulate typing delay for polish
      await new Promise((r) => setTimeout(r, 800));

      const greeting = message
        ? "Here's what I think..."
        : `Hey! 👋 I've been looking at your taste profile${weather ? ` and it's ${weather.description} in ${weather.city}` : ""}. Here's my suggestion:`;

      setMessages((prev) => [
        ...prev,
        { type: "buddy", text: greeting },
        { type: "buddy", suggestion },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: "buddy", text: "Hmm, I'm having trouble thinking right now. Try again in a moment! 🤔" },
      ]);
    }
    setIsTyping(false);
  };

  const handleSend = (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { type: "user", text }]);
    setInput("");
    fetchSuggestion(text);
  };

  const quickActions = [
    "Give me another idea 🔄",
    "Something I can do in 1 hour ⏱️",
    "Indoor activity only 🏠",
    "Something adventurous 🌟",
  ];

  return (
    <div className="page buddy-page">
      <div className="buddy-header">
        <div className="buddy-avatar">🤖</div>
        <div>
          <h1>Buddy</h1>
          <span>Your AI hobby advisor</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.type}`}>
            {msg.text && <span>{msg.text}</span>}
            {msg.suggestion && <SuggestionCard suggestion={msg.suggestion} />}
          </div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="buddy-quick-actions">
        {quickActions.map((action) => (
          <button key={action} className="quick-action-btn" onClick={() => handleSend(action)}>
            {action}
          </button>
        ))}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Tell Buddy what you're looking for..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="chat-send-btn" onClick={() => handleSend()}>
          ↑
        </button>
      </div>
    </div>
  );
}
