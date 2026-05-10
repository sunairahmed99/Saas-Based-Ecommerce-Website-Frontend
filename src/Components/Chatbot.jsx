import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';;
import { API_BASE_URL } from '../config';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi! I'm your AI assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chatbot/message`, {
        message: inputMessage
      });

      let botMessage;

      if (response.data.success) {
        botMessage = {
          id: Date.now() + 1,
          text: response.data.data.answer || '👋 I\'m currently learning more about our store. While my advanced AI features are calibrating, I can tell you that we offer premium products, fast shipping, and secure checkout.',
          sender: 'bot',
          timestamp: new Date(),
          confidence: response.data.data.confidence
        };
      } else {
        botMessage = {
          id: Date.now() + 1,
          text: response.data.data?.answer || "I'm sorry, I'm having trouble responding right now. Please try again later.",
          sender: 'bot',
          timestamp: new Date(),
          error: true
        };
      }

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chatbot service error:', error);

      const errorMessage = {
        id: Date.now() + 1,
        text: "👋 I'm currently learning more about our store. While my advanced AI features are calibrating, I can tell you that we offer premium products, fast shipping, and secure checkout.\n\nHow can I assist you with your shopping today?",
        sender: 'bot',
        timestamp: new Date(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="chatbot-toggle" onClick={toggleChatbot} style={{ position: 'fixed', bottom: '25px', right: '25px' }}>
        {isOpen ? (
          <span className="close-icon">✕</span>
        ) : (
          <span className="chat-icon">🤖</span>
        )}
        {!isOpen && <div className="chatbot-label">AI</div>}
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-container" style={{ position: 'fixed', bottom: '100px', right: '25px' }}>
          <div className="chatbot-header">
            <div className="chatbot-avatar">
              <span>🤖</span>
            </div>
            <div className="chatbot-info">
              <h4>AI Assistant</h4>
              <span className="status">● Online</span>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.error ? 'error-message' : ''}`}
              >
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                  {message.confidence && (
                    <span className="confidence-score">
                      Confidence: {(message.confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message bot-message typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="send-button"
            >
              {isTyping ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
