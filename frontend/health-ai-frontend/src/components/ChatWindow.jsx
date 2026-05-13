// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaRobot, FaUser, FaPaperPlane, FaTimes, 
  FaTrash, FaCopy, FaCheck, FaDownload 
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import aiService from '../services/aiService';

const ChatWindow = ({ analysisId, analysis, onClose }) => {
  const { userId } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Add initial analysis message
    if (analysis) {
      setMessages([{
        id: 'analysis',
        type: 'ai',
        content: analysis,
        timestamp: new Date()
      }]);
    }
    
    // Focus input
    inputRef.current?.focus();
  }, [analysis]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setLoading(true);

    try {
      const response = await aiService.sendMessage(
        userId, 
        userMessage, 
        analysisId
      );

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: response.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: error.message || 'Failed to get response',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyAnalysis = () => {
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAnalysis = () => {
    const blob = new Blob([analysis], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-analysis-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewChat = () => {
    setMessages([{
      id: 'analysis',
      type: 'ai',
      content: analysis,
      timestamp: new Date()
    }]);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <FaRobot className="header-icon" />
          <div>
            <h3>AI Medical Assistant</h3>
            <p>Ask about your report</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-btn" 
            onClick={handleCopyAnalysis}
            title="Copy analysis"
          >
            {copied ? <FaCheck /> : <FaCopy />}
          </button>
          <button 
            className="icon-btn" 
            onClick={handleDownloadAnalysis}
            title="Download analysis"
          >
            <FaDownload />
          </button>
          <button 
            className="icon-btn" 
            onClick={handleNewChat}
            title="New chat"
          >
            <FaTrash />
          </button>
          <button 
            className="icon-btn close" 
            onClick={onClose}
            title="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={msg.id || index} 
            className={`message ${msg.type}`}
          >
            <div className="message-avatar">
              {msg.type === 'ai' ? <FaRobot /> : <FaUser />}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-sender">
                  {msg.type === 'ai' ? 'AI Assistant' : 'You'}
                </span>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-text">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message ai loading">
            <div className="message-avatar">
              <FaRobot />
            </div>
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

      <div className="chat-input">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your report (e.g., 'What is my hemoglobin?')"
          rows="1"
          disabled={loading}
        />
        <button 
          onClick={handleSend} 
          disabled={!input.trim() || loading}
          className="send-btn"
        >
          <FaPaperPlane />
        </button>
      </div>

      <style>{`
        .chat-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 450px;
          height: 600px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease;
          z-index: 1000;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-icon {
          font-size: 2rem;
        }

        .header-left h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .header-left p {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.9;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 35px;
          height: 35px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .icon-btn.close:hover {
          background: #f56565;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #f7fafc;
        }

        .message {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .message.ai .message-avatar {
          background: #667eea;
          color: white;
        }

        .message.user .message-avatar {
          background: #48bb78;
          color: white;
        }

        .message.error .message-avatar {
          background: #f56565;
          color: white;
        }

        .message-content {
          flex: 1;
          background: white;
          padding: 0.75rem;
          border-radius: 12px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .message.ai .message-content {
          background: white;
        }

        .message.user .message-content {
          background: #667eea;
          color: white;
        }

        .message.error .message-content {
          background: #fff5f5;
          color: #c53030;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }

        .message.user .message-header {
          color: rgba(255, 255, 255, 0.9);
        }

        .message-time {
          opacity: 0.7;
        }

        .message-text {
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .message-text p {
          margin: 0.5rem 0;
        }

        .typing-indicator {
          display: flex;
          gap: 0.3rem;
          padding: 0.5rem;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #a0aec0;
          border-radius: 50%;
          animation: typing 1s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .chat-input {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: white;
          border-top: 1px solid #e2e8f0;
        }

        .chat-input textarea {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          resize: none;
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.3s;
          max-height: 100px;
        }

        .chat-input textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        .send-btn {
          width: 45px;
          height: 45px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .send-btn:hover:not(:disabled) {
          background: #5a67d8;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .chat-container {
            width: 100%;
            height: 100%;
            bottom: 0;
            right: 0;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;