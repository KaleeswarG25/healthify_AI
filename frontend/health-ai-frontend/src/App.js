// src/App.js
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ReportUpload from './components/ReportUpload';
import ReportList from './components/ReportList';
import Login from './components/Login';
import Register from './components/Register';
import AnalysisHistory from './components/AnalysisHistory';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import './styles/App.css';

function App() {
  const { loading, isAuthenticated } = useAuth();
  const [refreshList, setRefreshList] = useState(0);

  const handleUploadComplete = () => {
    setRefreshList(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            isAuthenticated ? (
              <div className="dashboard">
                <div className="dashboard-header">
                  <h1>Welcome to AI Health</h1>
                  <p>Upload medical reports for AI-powered analysis</p>
                </div>
                <ReportUpload onUploadComplete={handleUploadComplete} />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          <Route path="/upload" element={
            isAuthenticated ? (
              <ReportUpload onUploadComplete={handleUploadComplete} />
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          <Route path="/reports" element={
            isAuthenticated ? (
              <ReportList refreshTrigger={refreshList} />
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          <Route path="/analysis" element={
            isAuthenticated ? (
              <AnalysisHistory />
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;