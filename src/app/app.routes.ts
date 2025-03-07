import { Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AboutComponent } from './front-end/about/about.component';
import { AssessComponent } from './front-end/assess/assess.component';
import { DocumentsComponent } from './front-end/documents/documents.component';
import { HomepageComponent } from './front-end/homepage/homepage.component';
import { LearnComponent } from './front-end/learn/learn.component';
import { LoginComponent } from './front-end/login/login.component';
import { ProgressComponent } from './front-end/progress/progress.component';
import { SignupComponent } from './front-end/signup/signup.component';
import { UserComponent } from './front-end/user/user.component';
import { FlashcardComponent } from './front-end/assess/flashcard/flashcard.component';
import { QuizComponent } from './front-end/assess/quiz/quiz.component';
import { CreateQuizComponent } from './front-end/assess/create-quiz/create-quiz.component';
import { ProfileComponent } from './front-end/user/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'homepage', component: HomepageComponent, children: [  
    { path: '', redirectTo: 'documents', pathMatch: 'full' },  
    { path: 'about', component: AboutComponent },
    { path: 'assess', component: AssessComponent },
    { path: 'assess/create-quiz', component: CreateQuizComponent },
    { path: 'documents', component: DocumentsComponent },
    { path: 'progress', component: ProgressComponent },
    { path: 'user', component: UserComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'learn', component: LearnComponent, children: [
      { path: 'flashcard', component: FlashcardComponent }
    ]}
  ]},


  { path: 'quiz/:id', component: QuizComponent },
  { path: 'summative/:ids', component: QuizComponent },
  { path: 'flashcard/:id', component: FlashcardComponent },

  // Keep wildcard route at the end
  { path: '**', redirectTo: 'login' }
];

