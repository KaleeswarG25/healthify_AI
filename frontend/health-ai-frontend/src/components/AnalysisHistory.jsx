// src/components/AnalysisHistory.jsx
import React, { useState, useEffect } from 'react';
import { FaRobot, FaCalendar, FaFile, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import aiService from '../services/aiService';
import LoadingSpinner from './LoadingSpinner';
import ChatWindow from './ChatWindow';

const AnalysisHistory = () => {
  const { userId } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, [userId]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const data = await aiService.getAnalysisHistory(userId);
      setAnalyses(data);
    } catch (err) {
      setError('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = async (analysisId) => {
    try {
      const data = await aiService.getAnalysisById(analysisId, userId);
      setSelectedAnalysis(data);
      setShowChat(true);
    } catch (err) {
      alert('Failed to load analysis');
    }
  };

  const handleClearSession = async () => {
    if (window.confirm('Clear your current AI session?')) {
      await aiService.clearSession(userId);
      alert('Session cleared');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>AI Analysis History</h2>
        <button onClick={handleClearSession} className="clear-btn">
          <FaTrash /> Clear Session
        </button>
      </div>

      {analyses.length === 0 ? (
        <div className="empty-state">
          <FaRobot className="empty-icon" />
          <p>No AI analyses yet</p>
          <small>Upload a report to get AI analysis</small>
        </div>
      ) : (
        <div className="analyses-list">
          {analyses.map((analysis) => (
            <div 
              key={analysis.id} 
              className="analysis-card"
              onClick={() => handleViewAnalysis(analysis.id)}
            >
              <div className="analysis-icon">
                <FaRobot />
              </div>
              <div className="analysis-info">
                <h3>{analysis.filename || 'Medical Report'}</h3>
                <p className="analysis-summary">{analysis.summary}</p>
                <div className="analysis-meta">
                  <span>
                    <FaCalendar /> {new Date(analysis.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    <FaFile /> {analysis.chat_count || 0} messages
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showChat && selectedAnalysis && (
        <ChatWindow
          analysisId={selectedAnalysis.id}
          analysis={selectedAnalysis.analysis}
          onClose={() => {
            setShowChat(false);
            setSelectedAnalysis(null);
          }}
        />
      )}

      <style>{`
        .history-container {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .history-header h2 {
          color: #333;
        }

        .clear-btn {
          background: #f56565;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }

        .clear-btn:hover {
          background: #e53e3e;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #a0aec0;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .analyses-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .analysis-card {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .analysis-card:hover {
          background: #edf2f7;
          transform: translateX(5px);
        }

        .analysis-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .analysis-info {
          flex: 1;
        }

        .analysis-info h3 {
          margin: 0 0 0.5rem;
          color: #2d3748;
        }

        .analysis-summary {
          color: #718096;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .analysis-meta {
          display: flex;
          gap: 1rem;
          color: #a0aec0;
          font-size: 0.85rem;
        }

        .analysis-meta span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default AnalysisHistory;