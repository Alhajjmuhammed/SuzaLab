import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

// Interfaces for your backend models
export interface User {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: any; // Can be string or object
  user_type?: string;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
  address?: string;
  phone_number?: string;
}

export interface Campus {
  id?: number;
  campus_name: string;
}

export interface Level {
  id?: number;
  level_name: string;
}

export interface Role {
  id?: number;
  role_name: string;
}

export interface Course {
  id?: number;
  course_name: string;
  level: Level;
  campus: Campus;
  level_id?: number;
  campus_id?: number;
}

export interface Student {
  id?: number;
  user: User;
  date_of_birth: string;
  gender: 'M' | 'F';
  course: Course;
  year_of_study: number;
  nationality: string;
  course_id?: number;
}

export interface CreateStudentRequest {
  user: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
  };
  date_of_birth: string;
  gender: 'M' | 'F';
  course_id: number;
  year_of_study: number;
  nationality: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiBaseUrl;
  private isBrowser: boolean;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private getHeaders(): HttpHeaders {
    // Build headers and only include Authorization when a token exists.
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    if (this.isBrowser) {
      // Try a few common localStorage keys for the token to be robust.
      const token = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  // ==================== USER MANAGEMENT ====================
  
  /**
   * Get all users (admin/super users)
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Get user by ID
   */
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Create new user (admin/super)
   */
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/`, user, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Update user
   */
  updateUser(id: number, user: Partial<User>): Observable<User> {
  return this.http.patch<User>(`${this.apiUrl}/users/${id}/`, user, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Delete user
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  // ==================== STUDENT MANAGEMENT ====================
  
  /**
   * Get all students (users with student profile)
   */
  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/students/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Get student by ID
   */
  getStudent(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/students/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Create new student (creates both User and Student)
   */
  createStudent(student: CreateStudentRequest): Observable<Student> {
    return this.http.post<Student>(`${this.apiUrl}/students/`, student, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Update student
   */
  updateStudent(id: number, student: Partial<Student>): Observable<Student> {
  return this.http.patch<Student>(`${this.apiUrl}/students/${id}/`, student, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Delete student
   */
  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/students/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  // ==================== REFERENCE DATA ====================
  
  /**
   * Get all courses (with optional filtering)
   */
  getCourses(levelId?: number, campusId?: number): Observable<Course[]> {
    let url = `${this.apiUrl}/students/course/`;
    const params: string[] = [];
    
    if (levelId) params.push(`level_id=${levelId}`);
    if (campusId) params.push(`campus_id=${campusId}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<Course[]>(url, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Get courses by level
   */
  getCoursesByLevel(levelId: number): Observable<Course[]> {
    return this.getCourses(levelId);
  }

  /**
   * Get courses by campus
   */
  getCoursesByCampus(campusId: number): Observable<Course[]> {
    return this.getCourses(undefined, campusId);
  }

  // ==================== CAMPUS CRUD OPERATIONS ====================
  
  /**
   * Get all campuses
   */
  getCampuses(): Observable<Campus[]> {
    return this.http.get<Campus[]>(`${this.apiUrl}/students/campus/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Create new campus
   */
  createCampus(campus: Partial<Campus>): Observable<Campus> {
    return this.http.post<Campus>(`${this.apiUrl}/students/campus/`, campus, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Update campus
   */
  updateCampus(id: number, campus: Partial<Campus>): Observable<Campus> {
  return this.http.patch<Campus>(`${this.apiUrl}/students/campus/${id}/`, campus, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Delete campus
   */
  deleteCampus(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/students/campus/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  // ==================== LEVEL CRUD OPERATIONS ====================

  /**
   * Get all levels
   */
  getLevels(): Observable<Level[]> {
    return this.http.get<Level[]>(`${this.apiUrl}/students/level/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Create new level
   */
  createLevel(level: Partial<Level>): Observable<Level> {
    return this.http.post<Level>(`${this.apiUrl}/students/level/`, level, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Update level
   */
  updateLevel(id: number, level: Partial<Level>): Observable<Level> {
  return this.http.patch<Level>(`${this.apiUrl}/students/level/${id}/`, level, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Delete level
   */
  deleteLevel(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/students/level/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  // ==================== COURSE CRUD OPERATIONS ====================

  /**
   * Create new course
   */
  createCourse(course: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/students/course/`, course, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Update course
   */
  updateCourse(id: number, course: Partial<Course>): Observable<Course> {
  return this.http.patch<Course>(`${this.apiUrl}/students/course/${id}/`, course, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  /**
   * Delete course
   */
  deleteCourse(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/students/course/${id}/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  // ==================== COMBINED USER DATA ====================
  
  /**
   * Get all users (both regular users and students combined)
   */
  getAllUsersData(): Observable<{users: User[], students: Student[]}> {
    const users$ = this.getUsers();
    const students$ = this.getStudents();
    
    return new Observable(observer => {
      let usersData: User[] = [];
      let studentsData: Student[] = [];
      let completed = 0;

      users$.subscribe({
        next: (users) => {
          usersData = users;
          completed++;
          if (completed === 2) {
            observer.next({ users: usersData, students: studentsData });
            observer.complete();
          }
        },
        error: (error) => observer.error(error)
      });

      students$.subscribe({
        next: (students) => {
          studentsData = students;
          completed++;
          if (completed === 2) {
            observer.next({ users: usersData, students: studentsData });
            observer.complete();
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // ==================== ROLE CRUD METHODS ====================
  
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles/`, {
      headers: this.getHeaders()
    }).pipe(
      timeout(3000),
      catchError(this.handleError)
    );
  }

  createRole(role: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}/roles/`, role, {
      headers: this.getHeaders()
    });
  }

  updateRole(id: number, role: Partial<Role>): Observable<Role> {
  return this.http.patch<Role>(`${this.apiUrl}/roles/${id}/`, role, {
      headers: this.getHeaders()
    });
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/roles/${id}/`, {
      headers: this.getHeaders()
    });
  }
}
