import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Quiz } from './api';

@Component({
  selector: 'app-quiz-list',
  imports: [RouterLink],
  template: `
    <h2>Published quizzes</h2>
    @if (loading()) {
      <p>Loading quizzes...</p>
    } @else if (error()) {
      <p class="error">Could not load quizzes. Please try again later.</p>
    } @else if (quizzes().length === 0) {
      <p>No published quizzes yet.</p>
    } @else {
      <ul class="quiz-list">
        @for (quiz of quizzes(); track quiz._id) {
          <li>
            <a [routerLink]="['/quizzes', quiz.slug]">{{ quiz.title }}</a>
            @if (quiz.description) {
              <p>{{ quiz.description }}</p>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .quiz-list { list-style: none; padding: 0; }
    .quiz-list li { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; }
    .quiz-list a { font-weight: 600; text-decoration: none; color: #1a56db; }
    .error { color: #b91c1c; }
  `,
})
export class QuizList implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly quizzes = signal<Quiz[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.api.getQuizzes().subscribe({
      next: (response) => {
        this.quizzes.set(response.quizzes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
