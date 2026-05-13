// src/services/aiService.js
import { aiApi } from './api';

class AIService {
  async analyzeText(userId, reportText, filename = null) {
    const response = await aiApi.post('/analyze-text', {
      user_id: userId,
      report_text: reportText,
      filename: filename
    });
    return response.data;
  }

  async analyzePdf(userId, file) {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('file', file);
    
    const response = await aiApi.post('/analyze-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async sendMessage(userId, message, analysisId) {
    const response = await aiApi.post('/chat', {
      user_id: userId,
      message: message,
      analysis_id: analysisId
    });
    return response.data;
  }

  async getActiveAnalysis(userId) {
    const response = await aiApi.get(`/active/${userId}`);
    return response.data;
  }

  async getAnalysisHistory(userId) {
    const response = await aiApi.get(`/history/${userId}`);
    return response.data;
  }

  async getAnalysisById(analysisId, userId) {
    const response = await aiApi.get(`/analysis/${analysisId}?user_id=${userId}`);
    return response.data;
  }

  async clearSession(userId) {
    const response = await aiApi.delete(`/session/${userId}`);
    return response.data;
  }
}

export default new AIService();