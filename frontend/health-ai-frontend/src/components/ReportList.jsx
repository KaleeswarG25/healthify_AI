// src/components/ReportList.jsx
import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileImage, FaTrash, FaEye, FaRobot } from 'react-icons/fa';
import { format } from 'date-fns';
import reportService from '../services/reportService';
import aiService from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ChatWindow from './ChatWindow';

const ReportList = ({ refreshTrigger }) => {
  const { userId } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [userId, refreshTrigger]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getUserReports(userId);
      setReports(data);
      setError(null);
    } catch (err) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    setDeleting(reportId);
    try {
      await reportService.deleteReport(reportId, userId);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      alert('Failed to delete report: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleAnalyze = async (report) => {
    setAnalyzing(true);
    try {
      // In a real app, you would download the report from S3
      // For now, we'll just show a message
      alert('This would download and analyze the report. In production, you would fetch the PDF from S3 and send to AI service.');
      
      // Simulate AI analysis
      setTimeout(() => {
        setAnalysisId('sample-analysis-id');
        setAnalysis(`Analysis for ${report.file_name}\n\nThis is a sample analysis. In production, this would be the actual AI analysis of your medical report.`);
        setShowChat(true);
        setAnalyzing(false);
      }, 2000);
      
    } catch (err) {
      alert('Analysis failed: ' + err.message);
      setAnalyzing(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FaFilePdf className="file-icon pdf" />;
    return <FaFileImage className="file-icon image" />;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error">{error}</p>
        <button onClick={fetchReports} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <h2>My Medical Reports</h2>
      
      {reports.length === 0 ? (
        <div className="empty-state">
          <p>No reports uploaded yet</p>
          <small>Upload your first medical report to get started</small>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                {getFileIcon(report.file_name)}
                <span className="report-id">#{report.id}</span>
              </div>
              
              <div className="report-body">
                <h3 className="report-title" title={report.file_name}>
                  {report.file_name.length > 30 
                    ? report.file_name.substring(0, 30) + '...' 
                    : report.file_name}
                </h3>
                <p className="report-date">
                  {format(new Date(report.uploaded_at), 'MMM dd, yyyy')}
                </p>
              </div>
              
              <div className="report-actions">
                <a 
                  href={report.s3_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-btn view"
                  title="View"
                >
                  <FaEye />
                </a>
                <button 
                  onClick={() => handleAnalyze(report)}
                  disabled={analyzing}
                  className="action-btn analyze"
                  title="Analyze with AI"
                >
                  <FaRobot />
                </button>
                <button 
                  onClick={() => handleDelete(report.id)}
                  disabled={deleting === report.id}
                  className="action-btn delete"
                  title="Delete"
                >
                  {deleting === report.id ? <LoadingSpinner size="small" /> : <FaTrash />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showChat && (
        <ChatWindow 
          analysisId={analysisId}
          analysis={analysis}
          onClose={() => setShowChat(false)}
        />
      )}

      <style>{`
        .reports-container {
          padding: 2rem;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        h2 {
          color: #333;
          margin-bottom: 2rem;
        }

        .loading-container,
        .error-container {
          text-align: center;
          padding: 3rem;
        }

        .error {
          color: #e53e3e;
          margin-bottom: 1rem;
        }

        .retry-btn {
          padding: 0.5rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: #f7fafc;
          border-radius: 12px;
          color: #718096;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .report-card {
          background: #f7fafc;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .report-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }

        .report-header {
          padding: 1rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .file-icon {
          font-size: 1.5rem;
        }

        .file-icon.pdf {
          color: #fff;
        }

        .file-icon.image {
          color: #fff;
        }

        .report-id {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }

        .report-body {
          padding: 1rem;
        }

        .report-title {
          margin: 0 0 0.5rem;
          font-size: 1rem;
          color: #2d3748;
        }

        .report-date {
          margin: 0;
          font-size: 0.85rem;
          color: #718096;
        }

        .report-actions {
          display: flex;
          border-top: 1px solid #e2e8f0;
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem;
          text-align: center;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.3s;
          color: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .action-btn:hover {
          background: #edf2f7;
        }

        .action-btn.view:hover {
          color: #667eea;
        }

        .action-btn.analyze:hover {
          color: #9f7aea;
        }

        .action-btn.delete:hover {
          color: #f56565;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ReportList;