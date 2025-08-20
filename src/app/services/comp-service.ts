


import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Category, Component as LabComponent, CodeExplanation, ComponentApplication } from '../models/component.model';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CompService {
  private baseApiUrl = environment.apiBaseUrl; // e.g. http://localhost:8095/api
  private componentApiUrl = `${this.baseApiUrl}/components`;

  private getHeaders(includeContentType: boolean = true): HttpHeaders {
    let headers = new HttpHeaders();
    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private getFormDataHeaders(): HttpHeaders {
    // For file uploads, don't set Content-Type - let the browser set it with boundary
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  constructor(private http: HttpClient) {}

  // ===== CATEGORY OPERATIONS =====

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.componentApiUrl}/categories/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.componentApiUrl}/categories/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${this.componentApiUrl}/categories/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  updateCategory(id: number, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${this.componentApiUrl}/categories/${id}/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.componentApiUrl}/categories/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // ===== COMPONENT OPERATIONS =====

  getComponents(): Observable<LabComponent[]> {
    return this.http.get<LabComponent[]>(`${this.componentApiUrl}/components/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  getComponent(id: number): Observable<LabComponent> {
    return this.http.get<LabComponent>(`${this.componentApiUrl}/components/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  createComponent(data: Partial<LabComponent>): Observable<LabComponent> {
    return this.http.post<LabComponent>(`${this.componentApiUrl}/components/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  createComponentWithFile(formData: FormData): Observable<LabComponent> {
    return this.http.post<LabComponent>(`${this.componentApiUrl}/components/`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      timeout(15000), // Longer timeout for file uploads
      catchError(this.handleError)
    );
  }

  updateComponent(id: number, data: Partial<LabComponent>): Observable<LabComponent> {
    return this.http.put<LabComponent>(`${this.componentApiUrl}/components/${id}/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  updateComponentWithFile(id: number, formData: FormData): Observable<LabComponent> {
    return this.http.put<LabComponent>(`${this.componentApiUrl}/components/${id}/`, formData, {
      headers: this.getFormDataHeaders()
    }).pipe(
      timeout(15000), // Longer timeout for file uploads
      catchError(this.handleError)
    );
  }

  deleteComponent(id: number): Observable<any> {
    return this.http.delete(`${this.componentApiUrl}/components/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // ===== CODE EXPLANATION OPERATIONS =====

  getCodeExplanations(componentId: number): Observable<CodeExplanation[]> {
    return this.http.get<CodeExplanation[]>(`${this.componentApiUrl}/components/${componentId}/code/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  getCodeExplanation(id: number): Observable<CodeExplanation> {
    return this.http.get<CodeExplanation>(`${this.componentApiUrl}/code/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  createCodeExplanation(componentId: number, data: Partial<CodeExplanation>): Observable<CodeExplanation> {
    return this.http.post<CodeExplanation>(`${this.componentApiUrl}/components/${componentId}/code/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  updateCodeExplanation(id: number, data: Partial<CodeExplanation>): Observable<CodeExplanation> {
    return this.http.put<CodeExplanation>(`${this.componentApiUrl}/code/${id}/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  deleteCodeExplanation(id: number): Observable<any> {
    return this.http.delete(`${this.componentApiUrl}/code/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // ===== COMPONENT APPLICATION OPERATIONS =====

  getApplications(): Observable<ComponentApplication[]> {
    return this.http.get<ComponentApplication[]>(`${this.componentApiUrl}/applications/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  getApplication(id: number): Observable<ComponentApplication> {
    return this.http.get<ComponentApplication>(`${this.componentApiUrl}/applications/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  createApplication(data: Partial<ComponentApplication>): Observable<ComponentApplication> {
    return this.http.post<ComponentApplication>(`${this.componentApiUrl}/applications/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  updateApplication(id: number, data: Partial<ComponentApplication>): Observable<ComponentApplication> {
    return this.http.put<ComponentApplication>(`${this.componentApiUrl}/applications/${id}/`, data, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  deleteApplication(id: number): Observable<any> {
    return this.http.delete(`${this.componentApiUrl}/applications/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  approveApplication(id: number): Observable<ComponentApplication> {
    return this.http.post<ComponentApplication>(`${this.componentApiUrl}/applications/${id}/approve/`, {}, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  updateRemainingDays(id: number): Observable<ComponentApplication> {
    return this.http.post<ComponentApplication>(`${this.componentApiUrl}/applications/${id}/update_remaining/`, {}, {
      headers: this.getHeaders()
    }).pipe(
      timeout(10000),
      catchError(this.handleError)
    );
  }

  // ===== UTILITY METHODS =====

  /**
   * Helper method to create FormData for component with file upload
   */
  createComponentFormData(component: Partial<LabComponent>, imageFile?: File): FormData {
    const formData = new FormData();
    
    if (component.title) formData.append('title', component.title);
    if (component.description) formData.append('description', component.description);
    if (component.in_stock !== undefined) formData.append('in_stock', component.in_stock.toString());
    if (component.overview) formData.append('overview', component.overview);
    if (component.specification) formData.append('specification', component.specification);
    if (component.category_id) formData.append('category_id', component.category_id.toString());
    
    if (imageFile) {
      formData.append('feature', imageFile);
    }
    
    return formData;
  }
}
