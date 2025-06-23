export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface Course {
  id: number;
  name: string;
  description: string;
  cover_image: string;
  teacher_id: number;
  teacher_name: string;
  max_students: number;
  duration_minutes: number;
  language: string;
  category: string;
  price: number | string;
  status: number;
  created_at: string;
}

export interface CourseDetail {
  id: number;
  name: string;
  introduction: string;
  detail: string;
  language: string;
  level: number;
  cost_price: string;
  display_price: string;
  goal: string;
  update_time: string;
  add_time: string;
  status: string;
  flag: number;
  duration: number;
  session_number: number;
  course_picture: string;
}

export interface Certificate {
  title: string;
  achievement: string;
  get_date: string;
  document: string;
  issue_org: string;
}

export interface Teacher {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  introduction: string;
  detail: string;
  first_language: string;
  nationality_id: number;
  nationality_name: string;
  living_country_id: number;
  living_country_name: string;
  phone_code: string;
  phone: string;
  update_time: string;
  add_time: string;
  status: string;
  flag: number;
  email: string;
  teacher_no: string;
  avatar: string;
  certificates: Certificate[];
}

export interface Review {
  id: number;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
} 