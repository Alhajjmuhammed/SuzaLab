export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Component {
  id: number;
  feature?: string; // image URL
  title: string;
  description?: string;
  in_stock: number;
  overview?: string;
  specification?: string;
  category?: Category;
  category_id?: number;
  created_by?: number;
  created_at?: string;
}

export interface CodeExplanation {
  id: number;
  component: Component;
  component_id?: number;
  description?: string;
  code?: string;
  created_at?: string;
}

export interface ComponentApplication {
  id: number;
  student?: {
    id: number;
    user?: {
      id: number;
      username: string;
      email: string;
      first_name?: string;
      last_name?: string;
    };
    course?: {
      id: number;
      course_name: string;
    };
    year_of_study?: number;
  };
  student_id?: number;
  component?: Component;
  component_id?: number;
  qty: number;
  purpose: string;
  how_many_date: number;
  pending?: boolean;
  on_progress?: boolean;
  enrolled?: boolean;
  remaining_day?: number;
  return_day?: boolean;
  overdue?: boolean;
  requested_at?: string;
  issued_at?: string;
  updated_at?: string;
  created_by?: number;
  approved_by?: number;
}
