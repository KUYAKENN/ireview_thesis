import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { AuthService } from './auth.service';

// Add these new interfaces while keeping your existing ones
interface BaseItem {
  id: number;
  docId?: string;
  docTitle: string;
  dateCreated: Date;
  completed?: boolean;
}

interface BaseQuiz extends BaseItem {
  type: 'quiz';
  totalQuestions: number;
}

// Keep your existing Quiz interface
export interface Quiz {
  id: number;
  docId?: string;
  docTitle: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit: number;
  category: string;
  totalQuestions: number;
  dateCreated: Date;
  lastModified: Date;
  completed?: boolean;
  type?: 'quiz'; 
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizAttempt {
  quizId: number;
  startTime: Date;
  endTime?: Date;
  score?: number;
  answers: Map<number, number>;
  completed: boolean;
}

export interface AttemptData {
  id: string;
  quiz_id: number;
  totalQuestions: number;
  score: number;
  start_time: Date;
  end_time: Date;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  // Rest of your service code remains exactly the same
  private quizzes: Quiz[] = [];
  private currentQuiz = new BehaviorSubject<Quiz | null>(null);
  private quizAttempts = new Map<number, QuizAttempt[]>();

  private apiUrl = environment.apiUrl + '/quizzes';
  private attemptsUrl = environment.apiUrl + '/quiz-attempts';

  constructor(private http: HttpClient, private auth:AuthService) {
    this.loadInitialData();
  }

  private getHeaders(): HttpHeaders {
    const userId = this.auth.getCurrentUser()?.id; 
    return new HttpHeaders({
      'User-ID': userId || ''  // Use user ID from localStorage or AuthService
    });
  }

  private loadInitialData() {
    // Your existing loadInitialData code
    this.quizzes = [
      {
        id: 1,
        docTitle: 'Data Mining Fundamentals',
        description: 'Test your knowledge of basic data mining concepts',
        questions: [
          {
            id: 1,
            text: 'What is the primary purpose of data mining?',
            options: [
              'To extract meaningful patterns from data',
              'To store data securely',
              'To create databases',
              'To encrypt data'
            ],
            correctAnswer: 0,
            explanation: 'Data mining is primarily used to discover patterns and relationships in large datasets.'
          },
          // Add more questions
        ],
        timeLimit: 15,
        category: 'Database',
        totalQuestions: 10,
        dateCreated: new Date('2024-01-15'),
        lastModified: new Date('2024-01-20'),
        type: 'quiz' // Add the type here
      }
    ];
  }

  // ALL YOUR EXISTING METHODS REMAIN EXACTLY THE SAME
  getAll(): Observable<Quiz[]> {
    const headers = this.getHeaders();
    return this.http.get<Quiz[]>(this.apiUrl, {headers});
  }

  deleteMaterials(docId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(environment.apiUrl + '/materials/' + docId, {headers});
  }

  getQuizById(id: number): Quiz | undefined {
    return this.quizzes.find(quiz => quiz.id === id);
  }

  startQuiz(quiz: Quiz): void {
    if (quiz) {
      const attempt: QuizAttempt = {
        quizId: quiz.id,
        startTime: new Date(),
        answers: new Map(),
        completed: false
      };

      const attempts = this.quizAttempts.get(quiz.id) || [];
      this.quizAttempts.set(quiz.id, [...attempts, attempt]);
      this.currentQuiz.next(quiz);
    }
  }

  submitAnswer(questionId: number, answer: number): void {
    const quiz = this.currentQuiz.getValue();
    if (quiz) {
      const attempts = this.quizAttempts.get(quiz.id);
      if (attempts && attempts.length > 0) {
        const currentAttempt = attempts[attempts.length - 1];
        currentAttempt.answers.set(questionId, answer);
      }
    }
  }

  async completeQuiz(score: number, total_items: number): Promise<QuizAttempt | null> {
    const headers = this.getHeaders();
    const quiz = this.currentQuiz.getValue();
    if (quiz) {
      const attempts = this.quizAttempts.get(quiz.id);
      if (attempts && attempts.length > 0) {
        const currentAttempt = attempts[attempts.length - 1];
        currentAttempt.endTime = new Date();
        currentAttempt.completed = true;
        currentAttempt.score = score;
        await firstValueFrom(this.http.post(this.attemptsUrl, {
          start_time: new DatePipe('en-US').transform(currentAttempt.startTime, 'yyyy-MM-dd HH:mm:ss.SSSSSS'),
          end_time: new DatePipe('en-US').transform(currentAttempt.endTime, 'yyyy-MM-dd HH:mm:ss.SSSSSS'),
          score: score,
          totalQuestions: total_items,
          quiz_id: quiz.id
        }, {headers}))
        return currentAttempt;
      }
    }
    return null;
  }

  async getAllAttempts(): Promise<AttemptData[]> {
    const headers = this.getHeaders();
    return await firstValueFrom(this.http.get<AttemptData[]>(this.attemptsUrl, {headers}))
  }

  private calculateScore(quiz: Quiz, attempt: QuizAttempt): number {
    let correct = 0;
    quiz.questions.forEach(question => {
      const userAnswer = attempt.answers.get(question.id);
      if (userAnswer === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  }

  getCurrentQuiz(): Observable<Quiz | null> {
    return this.currentQuiz.asObservable();
  }

  getQuizAttempts(quizId: number): QuizAttempt[] {
    return this.quizAttempts.get(quizId) || [];
  }

  addQuiz(quiz: Omit<Quiz, 'id'>): Quiz {
    const newQuiz = {
      ...quiz,
      id: this.generateQuizId(),
      dateCreated: new Date(),
      lastModified: new Date()
    };
    this.quizzes.push(newQuiz);
    return newQuiz;
  }

  deleteQuiz(id: number): boolean {
    const initialLength = this.quizzes.length;
    this.quizzes = this.quizzes.filter(q => q.id !== id);
    return this.quizzes.length !== initialLength;
  }

  private generateQuizId(): number {
    return Math.max(0, ...this.quizzes.map(q => q.id)) + 1;
  }

  generate(file_id: string) {
    const headers = this.getHeaders();
    return this.http.post(environment.apiUrl + '/generate-quiz', {
      file_id: file_id
    }, {headers});
  }
}