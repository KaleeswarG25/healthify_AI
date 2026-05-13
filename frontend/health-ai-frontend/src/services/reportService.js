// src/services/reportService.js
import { reportApi } from './api';

class ReportService {
  async generateUploadUrl(fileName, fileType, userId) {
    const response = await reportApi.get('/generate-upload-url', {
      params: { 
        file_name: fileName, 
        content_type: fileType, 
        user_id: userId 
      }
    });
    return response.data;
  }

  async uploadToS3(uploadUrl, file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  async saveReport(fileName, fileKey, userId) {
    const response = await reportApi.post('/save-report', {
      file_name: fileName,
      file_key: fileKey,
      user_id: userId
    });
    return response.data;
  }

  async getUserReports(userId) {
    const response = await reportApi.get('/reports', {
      params: { user_id: userId }
    });
    return response.data;
  }

  async deleteReport(reportId, userId) {
    const response = await reportApi.delete(`/reports/${reportId}`, {
      params: { user_id: userId }
    });
    return response.data;
  }
}

export default new ReportService();