import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Add BaseItem interface
interface BaseItem {
  id: string;
  docId: string;
  docTitle: string;
  dateCreated: Date;
  completed?: boolean;
}

export interface FlashcardItem {
  id?: string;
  flashcard_id?: string;
  front: string;
  back: string;
  showBack?: boolean;
}

// Update Flashcard interface to extend BaseItem
export interface Flashcard extends BaseItem {
  type: 'flashcard';
  items: FlashcardItem[];
}

@Injectable({
  providedIn: 'root'
})
export class FlashcardService {
  private apiUrl = environment.apiUrl + '/flashcards';

  constructor(private http: HttpClient, private auth:AuthService) { }

   private getHeaders(): HttpHeaders {
      const userId = this.auth.getCurrentUser()?.id;
      return new HttpHeaders({
        'User-ID': userId || '',  // Add the user ID in the headers
      });
    }

  getAll(): Observable<Flashcard[]> {
    const headers = this.getHeaders();
    return this.http.get<Flashcard[]>(this.apiUrl, {headers});
  }
  
  generate(file_id: string) {
    const headers = this.getHeaders();
    return this.http.post(environment.apiUrl + '/generate-flashcards', {
      file_id: file_id
    }, { headers });
  }
}