import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Quiz } from './api';

@Component({
  selector: 'app-quiz-detail',
  imports: [RouterLink],
  template: `
    <p><a routerLink="/">&larr; All quizzes</a></p>
    @if (loading()) {
      <p>Loading quiz...</p>
    } @else if (quiz(); as q) {
      <h2>{{ q.title }}</h2>
      @if (q.description) {
        <p>{{ q.description }}</p>
      }
      <ol>
        @for (question of q.questions; track question.text) {
          <li>
            <p>{{ question.text }}</p>
            <ul>
              @for (option of question.options; track option) {
                <li>{{ option }}</li>
              }
            </ul>
          </li>
        }
      </ol>
      <p class="note">Answering and grading need login, which is the next step for this frontend.</p>
    } @else {
      <p class="error">Quiz not found.</p>
    }
  `,
  styles: `
    .error { color: #b91c1c; }
    .note { color: #666; font-style: italic; }
    ol ul { list-style: circle; }
  `,
})
export class QuizDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  protected readonly quiz = signal<Quiz | null>(null);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.api.getQuizBySlug(slug).subscribe({
      next: (q) => {
        this.quiz.set(q);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
