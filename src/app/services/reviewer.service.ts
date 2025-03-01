import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FileUploadService } from './file-upload.service';
import { Document } from '../front-end/modal/document.interface';
import { DatePipe } from '@angular/common';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewersService {

  private apiUrl = environment.apiUrl + '/reviewers';  // Your Flask backend URL

  constructor(private http: HttpClient, private auth: AuthService) { }

  // Helper method to get headers with user ID
  private getHeaders(): HttpHeaders {
    const userId = this.auth.getCurrentUser()?.id;
    return new HttpHeaders({
      'User-ID': userId || '',  // Add the user ID in the headers
    });
  }

  // Create a new reviewer
  async createReviewer(document: any) {
    const headers = this.getHeaders();
    return firstValueFrom(this.http.post(this.apiUrl, document, { headers }));
  }

  // Generate a reviewer for a specific document
  async generateReviewer(doc?: Document) {
    if (!doc) {
      throw new Error('Invalid Document ID');
    }
    const headers = this.getHeaders();
    const gen_response = await firstValueFrom(this.http.post(environment.apiUrl + '/generate-reviewer', {
      file_id: doc.id
    }, { headers })) as any;

    return gen_response;
  }

  async checkPendingReviewer(doc?: Document) {
    if (!doc) {
      throw new Error('Invalid Document ID');
    }
    const headers = this.getHeaders();
    
    try {
      const response = await firstValueFrom(this.http.put(environment.apiUrl + '/pending-reviewer',{
        file_id: doc.id
      }, { headers, observe:'response' }));
  
      if (response.status === 200) {
        // Handle the successful response
        return response;
      } else {
        console.error(response.body)
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: any) {
      if (error.status === 404) {
        // Handle 404 error
        console.error(error)
        throw new Error(error.message);
      } else {
        // Handle other errors
        throw new Error(`Error p: ${error.message}`);
      }
    }
  }
  async waitForReviewer(doc?: Document) {
    if (!doc) {
      throw new Error('Invalid Document ID');
    }
    const headers = this.getHeaders();
    
    try {
      const response = await firstValueFrom(this.http.post(environment.apiUrl + '/pending-reviewer', {
      file_id: doc.id
    } ,{ headers, observe:'response' }));
  
      if (response.status === 200) {
        // Handle the successful response
        return response;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: any) {
      if (error.status === 404) {
        // Handle 404 error
        throw new Error('Document not found');
      } else {
        // Handle other errors
        throw new Error(`Error w: ${error.message}`);
      }
    }
  }
  

  // Get all reviewers (documents)
  getAllReviewers(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(this.apiUrl, { headers });
  }

  // Get a specific reviewer by id
  getReviewerById(docId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/${docId}`, { headers });
  }

  // Update a reviewer document
  updateReviewer(docId: string, document: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/${docId}`, document, { headers });
  }

  // Delete a reviewer document
  deleteReviewer(docId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${docId}`, { headers });
  }
}