import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getBuddySuggestion } from '../api';
import './BuddyChat.css';

function TypingText({ text, speed = 20, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed('');
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);

  return <span>{displayed}<span className="cursor-blink">|</span></span>;
}

export default function BuddyChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    setMessages([{
      type: 'buddy',
      text: "Hey there! 👋 I'm Buddy, your personal hobby advisor. Let me find the perfect activity for you today!",
      isGreeting: true,
    }]);

    // Auto-fetch first suggestion
    fetchSuggestion('');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSuggestion = async (msg) => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const res = await getBuddySuggestion(user.id, msg);
      const { suggestion, weather: w } = res.data;
      setWeather(w);

      setMessages((prev) => [
        ...prev,
        {
          type: 'suggestion',
          data: suggestion,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type: 'buddy',
          text: "Hmm, I'm having trouble connecting. Try again in a moment! 🔄",
        },
      ]);
    }
    setIsLoading(false);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() && !e) return;
    const msg = input.trim() || '';

    if (msg) {
      setMessages((prev) => [
        ...prev,
        { type: 'user', text: msg, timestamp: new Date() },
      ]);
      setInput('');
    }

    fetchSuggestion(msg);
  };

  const handleAnother = () => {
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: '✨ Give me another idea!', timestamp: new Date() },
    ]);
    fetchSuggestion('Give me a different suggestion');
  };

  const getTimingEmoji = (timing) => {
    switch (timing) {
      case 'today': return '📅';
      case 'tomorrow': return '🌅';
      case 'weekend': return '🎉';
      default: return '📅';
    }
  };

  return (
    <div className="buddy-page">
      {/* Header */}
      <div className="buddy-header">
        <div className="buddy-avatar-wrap">
          <div className="buddy-avatar">🤖</div>
          <div className="buddy-status" />
        </div>
        <div className="buddy-info">
          <h2>Buddy</h2>
          <p>Your AI hobby advisor</p>
        </div>
        {weather && (
          <div className="weather-pill">
            <span>{weather.temp}°C</span>
            <span className="weather-desc">{weather.description}</span>
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`chat-msg ${msg.type}`}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: msg.isGreeting ? 0.3 : 0 }}
            >
              {msg.type === 'buddy' && (
                <div className="msg-bubble buddy-bubble">
                  <p>{msg.text}</p>
                </div>
              )}

              {msg.type === 'user' && (
                <div className="msg-bubble user-bubble">
                  <p>{msg.text}</p>
                </div>
              )}

              {msg.type === 'suggestion' && (
                <div className="suggestion-card glass">
                  <div className="suggestion-header">
                    <span className="suggestion-icon">💡</span>
                    <h3>{msg.data.activity}</h3>
                  </div>
                  <p className="suggestion-reason">{msg.data.reason}</p>
                  <div className="suggestion-meta">
                    <span className="timing-badge">
                      {getTimingEmoji(msg.data.timing)} {msg.data.timing}
                    </span>
                  </div>
                  {msg.data.tip && (
                    <div className="suggestion-tip">
                      <span className="tip-icon">💡</span>
                      <p>{msg.data.tip}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            className="chat-msg buddy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="msg-bubble buddy-bubble typing-bubble">
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area glass-heavy">
        <button className="btn-another" onClick={handleAnother} disabled={isLoading}>
          ✨ Another idea
        </button>
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            placeholder="e.g., 'I only have 1 hour'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn-send" disabled={isLoading || !input.trim()}>
            →
          </button>
        </form>
      </div>
    </div>
  );
}
