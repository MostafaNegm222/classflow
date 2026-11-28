import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

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

// Development points at the local Express server; the production build
// swaps in environment.prod.ts with the deployed API URL.
const API_URL = environment.apiUrl;

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
