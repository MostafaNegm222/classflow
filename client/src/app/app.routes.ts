import { Routes } from '@angular/router';
import { QuizList } from './quiz-list';
import { QuizDetail } from './quiz-detail';

export const routes: Routes = [
  { path: '', component: QuizList },
  { path: 'quizzes/:slug', component: QuizDetail },
];
