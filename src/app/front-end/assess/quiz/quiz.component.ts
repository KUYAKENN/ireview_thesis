import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { Quiz, QuizQuestion, QuizService } from '../../../services/quiz.service'

interface Question {
  question: string
  options: string[]
  correctIndex: number
  userAnswer?: number
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">{{ quizTitle }}</h1>
          <p class="mt-2 text-sm text-gray-600">Answer all questions to complete the quiz</p>
        </div>

        <!-- Progress Bar -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{{ answeredCount }}/{{ questions.length }} questions answered</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full">
            <div 
              class="h-full bg-blue-600 rounded-full transition-all duration-300"
              [style.width]="(answeredCount / questions.length * 100) + '%'">
            </div>
          </div>
        </div>

        <!-- Questions -->
        <div class="space-y-6">
          <div *ngFor="let q of questions; let i = index" 
               class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="p-6">
              <p class="text-lg font-medium text-gray-900 mb-4">
                {{ i + 1 }}. {{ q.question }}
              </p>
              
              <div class="space-y-2">
                <label *ngFor="let option of q.options; let optIndex = index"
                       class="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                       [ngClass]="{
                         'bg-green-50 border-green-200': isQuizSubmitted && optIndex === q.correctIndex,
                         'bg-red-50 border-red-200': isQuizSubmitted && q.userAnswer === optIndex && optIndex !== q.correctIndex,
                         'border-transparent': !isQuizSubmitted,
                         'border': isQuizSubmitted
                       }">
                  <input 
                    type="radio" 
                    [name]="'q' + i"
                    [value]="optIndex"
                    [(ngModel)]="q.userAnswer"
                    [disabled]="isQuizSubmitted"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-3 text-gray-700">{{ option }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex justify-center">
          <button 
            *ngIf="!isQuizSubmitted"
            (click)="submitQuiz()"
            [disabled]="answeredCount !== questions.length || loading"
            class="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            Submit Quiz
          </button>

          <!-- Results -->
          <div *ngIf="isQuizSubmitted" class="text-center">
            <p class="text-2xl font-bold text-gray-900">
              Your Score: {{ score }}/{{ questions.length }}
              ({{ (score / questions.length * 100).toFixed(1) }}%)
            </p>
            <button 
              (click)="closeQuiz()"
              class="mt-4 px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class QuizComponent implements OnInit {
  quizTitle = 'Sample Quiz'
  questions: Question[] = [
    { question: 'What is the capital of France?', options: ['London', 'Paris', 'Rome', 'Berlin'], correctIndex: 1 },
    { question: 'Which planet is known as the Red Planet?', options: ['Mars', 'Venus', 'Jupiter', 'Mercury'], correctIndex: 0 }
  ]

  isQuizSubmitted = false
  score = 0
  quizId: string | null = null

  constructor(private route: ActivatedRoute, private router: Router, private quizService: QuizService) {
    this.quizId = this.route.snapshot.paramMap.get('id')

    const quizData = localStorage.getItem('quizPreview')
    if (quizData) {
      const parsed = JSON.parse(quizData)
      this.quizTitle = parsed.title
      this.questions = parsed.questions
    }
  }

  quiz?: Quiz;
  ngOnInit(): void {
    this.fetchData();
  }

      async fetchData(){
        try{
          const quizId = this.route.snapshot.paramMap.get('id');
          const quizIds = this.route.snapshot.paramMap.get('ids');
          const quizzes =(await firstValueFrom(this.quizService.getAll()));

          if(quizIds){
            const quizArr = quizIds.split(',');
            this.quiz = quizzes.find(q=>q.id == Number(quizArr[0]))!;
            this.quiz.ids = [this.quiz.id]
            this.quiz.docTitle = 'Summative Test!';
            for(let i = 1 ; i < quizArr.length; i++) {
              const quiz = quizzes.find(q=>q.id == Number(quizArr[i]))!;
              this.quiz.ids.push(quiz.id);
              this.quiz.questions = [...this.quiz.questions, ...quiz.questions]
            }
          }else{
            this.quiz = quizzes.find(q=>q.id == Number(quizId));
          }

          

          this.quizService.startQuiz(this.quiz!);

          this.quizTitle = this.quiz?.docTitle?? 'Please Wait';
  
          this.questions = (this.quiz?.questions ?? []).reduce((acc:Question[],curr:QuizQuestion)=>
          {
            return [...acc,{
              question: curr.text,
              options: curr.options,
              correctIndex: curr.correctAnswer
            } as Question]
          }
            ,[] as Question[]).sort(() => Math.random() - 0.5);

          
    
        }catch(e){}
        
      }
  

  get answeredCount(): number {
    return this.questions.filter(q => typeof q.userAnswer !== 'undefined').length
  }

  loading:boolean = false;
  async submitQuiz() {
    if (this.answeredCount !== this.questions.length) {
      return
    }

    this.score = this.questions.filter(q => q.userAnswer === q.correctIndex).length
    this.loading = true;
    await this.quizService.completeQuiz(this.score, this.questions.length);
    this.loading = false;
    
    this.isQuizSubmitted = true

  }

  closeQuiz() {
    this.router.navigate(['/homepage/assess'])
  }
}
