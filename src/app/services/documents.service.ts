import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {

  private apiUrl = environment.apiUrl +  '/documents';  // Your Flask backend URL

  constructor(private http: HttpClient, private auth:AuthService) { }
  
    private getHeaders(): HttpHeaders {
      const userId = this.auth.getCurrentUser()?.id; 
      return new HttpHeaders({
        'User-ID': userId || ''  // Use user ID from localStorage or AuthService
      });
    }

  // Create a new document
  createDocument(document: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, document, {headers});
  }

  // Get all documents
  getAllDocuments(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(this.apiUrl, {headers});
  }

  // Get a specific document by id
  getDocumentById(docId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/${docId}`, {headers});
  }

  // Update an existing document
  updateDocument(docId: string, document: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/${docId}`, document, {headers});
  }

  // Delete a document by id
  deleteDocument(docId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${docId}`, {headers});
  }
}
