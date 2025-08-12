import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, timeout, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private accessToken: string | null = null;
  private apiBaseUrl = environment.apiBaseUrl;
  private isBrowser: boolean;
  
  constructor(
    private http: HttpClient, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.initializeFromLocalStorage();
  }

  // Initialize user data from local storage if token exists
  private initializeFromLocalStorage(): void {
    // Skip for server-side rendering
    if (!this.isBrowser) {
      return;
    }
    
    const token = this.getToken();
    const storedUser = localStorage.getItem('current_user');
    
    // If we have stored user data, load it into memory first
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('current_user');
      }
    }
    
    // If we have a token, fetch fresh user data from the server
    if (token) {
      this.fetchCurrentUser(token).subscribe({
        error: (error) => {
          // If the token is invalid or expired, clear it
          if (error.status === 401) {
            this.logout();
          }
        }
      });
    }
  }

  login(username: string, password: string): Observable<any> {
    const loginData = {
      username: username,
      password
    };
    
    return this.http.post<any>(`${this.apiBaseUrl}/users/token/`, loginData).pipe(
      timeout(3000), // 3 second timeout for faster response
      tap(tokens => {
        this.accessToken = tokens.access;
        if (this.isBrowser) {
          localStorage.setItem('access_token', tokens.access);
        }
        this.fetchCurrentUser(tokens.access).subscribe();
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }
  
  fetchCurrentUser(token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiBaseUrl}/users/current_user/`, { headers })
      .pipe(
        timeout(3000), // 3 second timeout for faster response
        tap(user => {
          // Save user in memory
          this.currentUserSubject.next(user);
          
          // Save user in local storage (only in browser)
          if (this.isBrowser) {
            localStorage.setItem('current_user', JSON.stringify(user));
            
            // Only navigate if we're not already on /home
            if (window.location.pathname !== '/home') {
              this.router.navigate(['/home']);
            }
          }
        }),
        catchError(error => {
          console.error('Fetch user error:', error);
          return throwError(() => error);
        })
      );
  }
  
  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  getUser(): any {
    // First try to get from memory
    if (this.currentUserSubject.value) {
      return this.currentUserSubject.value;
    }
    
    // If not in memory and in browser, try from local storage
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user); // Update the behavior subject
          return user;
        } catch (e) {
          localStorage.removeItem('current_user');
        }
      }
    }
    
    return null;
  }

  logout(): void {
    // Clear local storage (only in browser)
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
    }
    
    // Clear memory
    this.currentUserSubject.next(null);
    this.accessToken = null;
    
    // Redirect to login page
    this.router.navigate(['/']);
  }
}
