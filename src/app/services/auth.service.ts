import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginCredentials {
  email: string;
  password: string;
}
export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
}
export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  created_at:string | null;
  updated_at:string | null;
}
export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  [x: string]: any;
  private apiUrl = `${environment.apiUrl}`;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  private currentUserSubject: BehaviorSubject<UserProfile | null>;
  public currentUser$: Observable<UserProfile | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getUserFromStorage());
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

    private getHeaders(): HttpHeaders {
      const userId = this.getCurrentUser()?.id;
      return new HttpHeaders({
        'User-ID': userId || '',  // Add the user ID in the headers
      });
    }
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthenticationResponse(response)),
      catchError(this.handleError)
    );
  }

  register(firstName: string, lastName: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      firstName,
      lastName,
      email,
      password
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(profileData: ProfileUpdateData | FormData): Observable<UserProfile> {
    const userId = this.currentUserSubject.value?.id;
    const user = this.currentUserSubject.value!;
    if (!userId) {
      return throwError(() => new Error('No user logged in'));
    }
  
    return this.http.put<UserProfile>(`${this.apiUrl}/profile/${userId}`, profileData).pipe(
      tap(() => {
        const updatedUser = {...user, ...profileData}
        this.currentUserSubject.next(updatedUser);
        localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
      }),
      catchError(this.handleError)
    );
  }

  forgetPassword(email:string): Observable<UserProfile> {
  
    return this.http.put<UserProfile>(`${this.apiUrl}/profile/${email}/reset-password`, {}).pipe(
      tap(() => {

      }),
      catchError(this.handleError)
    );
  }

  updateProfilePicture(file: File): Observable<{ profilePictureUrl: string }> {
    const userId = this.currentUserSubject.value?.id;
    if (!userId) {
      return throwError(() => new Error('No user logged in'));
    }

    const formData = new FormData();
    formData.append('profile_picture', file);

    return this.http.post<{ profilePictureUrl: string }>(
      `${this.apiUrl}/profile/${userId}/picture`,
      formData
    ).pipe(
      tap(response => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const updatedUser: UserProfile = {
            ...currentUser,
            profilePictureUrl: response.profilePictureUrl
          };
          this.currentUserSubject.next(updatedUser);
          localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): UserProfile | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return this.validateUserProfile(user);
    } catch {
      return null;
    }
  }

  private validateUserProfile(user: any): UserProfile | null {
    if (user && 
        typeof user.id === 'number' && 
        typeof user.email === 'string' &&
        typeof user.firstName === 'string' &&
        typeof user.lastName === 'string') {
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl || null,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    }
    return null;
  }

  private handleAuthenticationResponse(response: AuthResponse): void {
    if (response && response.user) {
      const validatedUser = this.validateUserProfile(response.user);
      if (validatedUser) {
        localStorage.setItem(this.userKey, JSON.stringify(validatedUser));
        this.currentUserSubject.next(validatedUser);
      }
    }
  }
  updatePassword(passwordData: PasswordUpdateData): Observable<any> {
    const userId = this.currentUserSubject.value?.id;
    if (!userId) {
      return throwError(() => new Error('No user logged in'));
    }
  
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/profile/${userId}/password`,
      passwordData
    ).pipe(
      catchError(this.handleError)
    );
  }
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid credentials';
          break;
        case 400:
          errorMessage = 'Invalid input data';
          break;
        case 500:
          errorMessage = 'Server error';
          break;
        default:
          errorMessage = 'Something went wrong';
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}