export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  address?: string;
  phone_number?: string;
  role?: string;
  user_type?: string;
  profile?: StudentProfile | null;
}

export interface StudentProfile {
  id: number;
  date_of_birth: string;
  gender: string;
  year_of_study: number;
  nationality: string;
  course: Course;
}

export interface Course {
  id: number;
  course_name: string;
  level: string;
  campus: string;
}

export interface Role {
  id: number;
  role_name: string;
  description?: string;
}
