import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuizQuestion {
  text: string;
  options: string[];
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  slug: string;
  questions: QuizQuestion[];
  instructor?: { headline?: string; slug?: string };
}

interface QuizListResponse {
  count: number;
  quizzes: Quiz[];
}

// The Express API runs locally on port 5000 (see server/src/index.js).
const API_URL = 'http://localhost:5000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getQuizzes(): Observable<QuizListResponse> {
    return this.http.get<QuizListResponse>(`${API_URL}/quizzes`);
  }

  getQuizBySlug(slug: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${API_URL}/quizzes/${slug}`);
  }
}
