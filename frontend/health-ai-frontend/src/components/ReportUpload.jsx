// src/components/ReportUpload.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FaCloudUploadAlt, FaFile, FaCheckCircle, 
  FaTimesCircle, FaSpinner, FaRobot 
} from 'react-icons/fa';
import reportService from '../services/reportService';
import aiService from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from './ChatWindow';

const ReportUpload = ({ onUploadComplete }) => {
  const { userId } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [analysis, setAnalysis] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('File type not allowed. Please upload PDF, JPEG, or PNG');
      return;
    }
    
    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    }
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Upload to report service
      const { upload_url, file_key } = await reportService.generateUploadUrl(
        file.name, file.type, userId
      );

      await reportService.uploadToS3(upload_url, file, (percent) => {
        setProgress(percent);
      });

      const savedReport = await reportService.saveReport(file.name, file_key, userId);
      
      setSuccess('Report uploaded successfully!');
      
      // Step 2: Analyze with AI
      setAnalyzing(true);
      setProgress(0);
      
      const aiResult = await aiService.analyzePdf(userId, file);
      
      setAnalysisId(aiResult.analysis_id);
      setAnalysis(aiResult.analysis);
      setShowChat(true);
      setSuccess('Report uploaded and analyzed!');
      
      if (onUploadComplete) {
        onUploadComplete(savedReport);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-wrapper">
      <div className="upload-card">
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
        >
          <input {...getInputProps()} />
          <FaCloudUploadAlt className="upload-icon" />
          
          {isDragActive ? (
            <p className="drop-text">Drop your file here...</p>
          ) : (
            <>
              <p className="drop-text">Drag & drop your medical report</p>
              <p className="drop-subtext">or <span className="browse-text">browse files</span></p>
            </>
          )}
          
          <div className="file-types">
            <span className="type-badge">PDF</span>
            <span className="type-badge">JPEG</span>
            <span className="type-badge">PNG</span>
            <span className="type-badge">Max 10MB</span>
          </div>
        </div>

        {file && !showChat && (
          <div className="file-preview">
            <div className="file-info">
              <div className="file-icon-wrapper">
                <FaFile />
              </div>
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={uploading || analyzing}
              className="upload-btn"
            >
              {uploading ? (
                <>
                  <FaSpinner className="spinner" />
                  <span>Uploading... {progress}%</span>
                </>
              ) : analyzing ? (
                <>
                  <FaSpinner className="spinner" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <FaRobot />
                  <span>Upload & Analyze</span>
                </>
              )}
            </button>
          </div>
        )}

        {(uploading || analyzing) && (
          <div className="progress-section">
            <div className="progress-info">
              <span>{uploading ? 'Uploading...' : 'AI Analyzing...'}</span>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="message error">
            <FaTimesCircle />
            <span>{error}</span>
          </div>
        )}

        {success && !showChat && (
          <div className="message success">
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}
      </div>

      {showChat && (
        <ChatWindow 
          analysisId={analysisId}
          analysis={analysis}
          onClose={() => {
            setShowChat(false);
            setFile(null);
            setSuccess(null);
          }}
        />
      )}

      <style>{`
        .upload-wrapper {
          max-width: 600px;
          margin: 0 auto;
        }

        .upload-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .dropzone {
          border: 2px dashed #cbd5e0;
          border-radius: 15px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #f7fafc;
        }

        .dropzone:hover {
          border-color: #667eea;
          background: #ebf4ff;
        }

        .dropzone.active {
          border-color: #667eea;
          background: #e6f0ff;
          transform: scale(1.02);
        }

        .dropzone.has-file {
          border-color: #48bb78;
          background: #f0fff4;
        }

        .upload-icon {
          font-size: 3rem;
          color: #667eea;
          margin-bottom: 1rem;
        }

        .drop-text {
          font-size: 1.1rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .drop-subtext {
          color: #718096;
          margin-bottom: 1rem;
        }

        .browse-text {
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
        }

        .file-types {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .type-badge {
          padding: 0.25rem 0.75rem;
          background: white;
          border-radius: 20px;
          font-size: 0.85rem;
          color: #4a5568;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .file-preview {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f7fafc;
          border-radius: 12px;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .file-icon-wrapper {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }

        .file-size {
          font-size: 0.85rem;
          color: #718096;
        }

        .upload-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .upload-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .progress-section {
          margin-top: 1.5rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }

        .progress-percentage {
          font-weight: 600;
          color: #667eea;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s;
        }

        .message {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: slideIn 0.3s;
        }

        .message.error {
          background: #fee;
          color: #e53e3e;
        }

        .message.success {
          background: #f0fff4;
          color: #38a169;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ReportUpload;