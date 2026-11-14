import axios from 'axios';

// Central API base URL from Vite environment variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to normalize error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let normalizedError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
      status: error.response?.status || 500,
      retryable: false,
    };

    if (error.response?.data?.error) {
      normalizedError = {
        code: error.response.data.error.code || 'API_ERROR',
        message: error.response.data.error.message || 'Request failed',
        status: error.response.status,
        retryable: Boolean(error.response.data.error.retryable),
        details: error.response.data.error.details,
      };
    } else if (error.code === 'ECONNABORTED') {
      normalizedError = {
        code: 'TIMEOUT',
        message: 'The request timed out. Please try again.',
        status: 408,
        retryable: true,
      };
    } else if (!error.response) {
      normalizedError = {
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the backend server. Is FastAPI running on port 8000?',
        status: 0,
        retryable: true,
      };
    } else {
      normalizedError = {
        code: `HTTP_${error.response.status}`,
        message: error.response.statusText || 'Request failed',
        status: error.response.status,
        retryable: error.response.status >= 500,
      };
    }

    return Promise.reject(normalizedError);
  }
);

// ── Service Endpoints ─────────────────────────────────────────────────────────

export const api = {
  /**
   * Health check and AI provider configuration
   */
  checkHealth: () => apiClient.get('/health'),

  /**
   * Upload an audio/video file and create job
   */
  createUploadJob: (file, language = 'auto') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    return apiClient.post('/jobs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  submitUploadJob: (file, language = 'auto') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    return apiClient.post('/jobs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Poll status, stage, and progress of a job
   */
  getJobStatus: (jobId) => apiClient.get(`/jobs/${jobId}`),

  /**
   * Get structured analysis results (Title, Summary, Actions, Decisions, Questions, Mindmap)
   */
  getJobResults: (jobId) => apiClient.get(`/jobs/${jobId}/results`),

  /**
   * Get raw speech transcript
   */
  getJobTranscript: (jobId) => apiClient.get(`/jobs/${jobId}/transcript`),

  /**
   * Get sanitized Mermaid mind map string
   */
  getJobMindmap: (jobId) => apiClient.get(`/jobs/${jobId}/mindmap`),

  /**
   * Download transcript file
   */
  downloadTranscriptUrl: (jobId) => `${BASE_URL}/jobs/${jobId}/download/transcript`,

  /**
   * Delete a job and its vector records from server
   */
  deleteJob: (jobId) => apiClient.delete(`/jobs/${jobId}`),

  /**
   * Ask question grounded in active job context
   */
  askQuestion: (jobId, question, metadata = {}) =>
    apiClient.post(`/jobs/${jobId}/chat`, {
      question,
      workspace_id: metadata.workspaceId || metadata.workspace_id,
      analysis_id: metadata.analysisId || metadata.analysis_id,
    }),
};

export default api;

