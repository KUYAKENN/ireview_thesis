// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export const environment = {
    production: false,
    appName: 'iReview',
    version: '1.0.0',

    // API Configuration
    apiUrl: 'http://localhost:5000/api',
    publicUrl: 'http://localhost:5000',

    // Authentication Configuration
    authConfig: {
      tokenKey: 'ireview_token',
      refreshTokenKey: 'ireview_refresh_token',
      tokenExpiryKey: 'ireview_token_expiry'
    },

    // File Upload Configuration
    fileUpload: {
      maxSize: 5242880, // 5MB in bytes
      allowedTypes: ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'],
      uploadUrl: 'http://localhost:3000/api/upload'
    },

    // AI Feature APIs ✅ Includes reviewer & flashcards generation endpoints
    aiFeatures: {
      generateReviewerUrl: 'http://192.168.1.54:5000/generate_reviewer',
      generateFlashcardsUrl: 'http://192.168.1.54:5000/generate_flashcards'
    },

    // Pagination Configuration
    pagination: {
      defaultPageSize: 10,
      maxPageSize: 50
    },

    // Feature Flags
    features: {
      enableGoogleLogin: true,
      enablePasswordReset: true,
      enableRegistration: true,
      enableFileUpload: true
    },

    // Timeouts and Intervals (in milliseconds)
    timeouts: {
      apiRequest: 30000,      // 30 seconds
      sessionExpiry: 3600000, // 1 hour
      carouselInterval: 5000  // 5 seconds
    },

    // Error Handling Configuration
    errorConfig: {
      maxRetries: 3,
      retryDelay: 1000 // 1 second
    },

    // Analytics Configuration (if needed)
    analytics: {
      enabled: false,
      trackingId: ''
    }
};

@Injectable({
  providedIn: 'root'
})
export class AIService {
  constructor(private http: HttpClient) {}

  /**
   * Generate a reviewer from the uploaded file.
   * @param fileId - The ID of the uploaded file.
   * @returns Observable with the generated reviewer response.
   */
  generateReviewer(fileId: string): Observable<any> {
    const body = { file_id: fileId };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(environment.aiFeatures.generateReviewerUrl, body, { headers });
  }

  /**
   * Generate flashcards from the uploaded file.
   * @param fileId - The ID of the uploaded file.
   * @returns Observable with the generated flashcards response.
   */
  generateFlashcards(fileId: string): Observable<any> {
    const requestBody = { file_id: fileId };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(environment.aiFeatures.generateFlashcardsUrl, requestBody, { headers });
  }
}
