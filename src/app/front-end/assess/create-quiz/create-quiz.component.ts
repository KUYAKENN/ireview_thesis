import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ReviewersService } from '../../../services/reviewer.service';
import { DocReviewer } from '../../learn/learn.component';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-3xl mx-auto px-4">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Create New Quiz</h1>
          <p class="mt-2 text-sm text-gray-600">Add questions and options for your quiz</p>
        </div>

        <!-- Quiz Details Form -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
              <input 
                type="text" 
                [(ngModel)]="quizTitle" 
                placeholder="Enter a descriptive title" 
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Select Document</label>
              <select 
                [(ngModel)]="selectedDocId" 
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option value="">-- Select a document --</option>
                <option *ngFor="let doc of documents" [value]="doc.id">{{ doc.title }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Questions Section -->
        <div class="space-y-6">
          <div *ngFor="let q of questions; let i = index" 
               class="bg-white rounded-lg shadow-sm p-6 relative">
            <button 
              *ngIf="questions.length > 1"
              (click)="removeQuestion(i)" 
              class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
              ×
            </button>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Question {{ i + 1 }}
                </label>
                <input 
                  [(ngModel)]="q.question" 
                  placeholder="Enter your question" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div class="space-y-3">
                <label class="block text-sm font-medium text-gray-700">Options</label>
                <div *ngFor="let opt of q.options; let optIndex = index" 
                     class="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    [name]="'correct' + i" 
                    [(ngModel)]="q.correctIndex" 
                    [value]="optIndex"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <input 
                    [(ngModel)]="q.options[optIndex]" 
                    [placeholder]="'Option ' + (optIndex + 1)"
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button 
                    *ngIf="q.options.length > 2"
                    (click)="removeOption(q, optIndex)" 
                    class="text-gray-400 hover:text-red-500 transition-colors">
                    ×
                  </button>
                </div>
                
                <button 
                  *ngIf="q.options.length < 5"
                  (click)="addOption(q)"
                  class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  + Add Option
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-between items-center">
          <button 
            (click)="addQuestion()"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            + Add Question
          </button>

          <div class="space-x-3">
            <button 
              (click)="previewQuiz()"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Preview
            </button>
            <button 
              (click)="saveQuiz()"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Save Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CreateQuizComponent implements OnInit{
  quizTitle = '';
  selectedDocId = '';
  questions: Question[] = [
    { question: '', options: ['', ''], correctIndex: 0 }
  ];

  documents = [
    { id: 'doc1', title: 'Natural Disasters' },
    { id: 'doc2', title: 'Quality Assurance' },
    { id: 'doc3', title: 'Data Mining' }
  ];

  docReviewers:DocReviewer[] = [];

  constructor(private router: Router, private reviwerService:ReviewersService) {}
  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData(){
    const revs =  await firstValueFrom(this.reviwerService.getAllReviewers())
    this.docReviewers = revs.reviewers;
  }


  addQuestion() {
    this.questions.push({ question: '', options: ['', ''], correctIndex: 0 });
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  addOption(question: Question) {
    if (question.options.length < 5) {
      question.options.push('');
    }
  }

  removeOption(question: Question, index: number) {
    if (question.options.length > 2) {
      question.options.splice(index, 1);
      if (question.correctIndex >= index) {
        question.correctIndex = Math.max(0, question.correctIndex - 1);
      }
    }
  }

  previewQuiz() {
    // Save current state to localStorage for preview
    localStorage.setItem('quizPreview', JSON.stringify({
      title: this.quizTitle,
      docId: this.selectedDocId,
      questions: this.questions
    }));
    this.router.navigate(['/quiz-preview']);
  }

  saveQuiz() {
    if (!this.validateQuiz()) {
      return;
    }

    localStorage.setItem('createdQuiz', JSON.stringify({
      title: this.quizTitle,
      docId: this.selectedDocId,
      questions: this.questions
    }));
    
    alert('Quiz saved successfully!');
    this.router.navigate(['/quiz']);
  }

  private validateQuiz(): boolean {
    if (!this.quizTitle.trim()) {
      alert('Please enter a quiz title');
      return false;
    }

    if (!this.selectedDocId) {
      alert('Please select a document');
      return false;
    }

    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      if (!q.question.trim()) {
        alert(`Question ${i + 1} is empty`);
        return false;
      }

      if (q.options.some(opt => !opt.trim())) {
        alert(`All options in question ${i + 1} must be filled`);
        return false;
      }
    }

    return true;
  }
}