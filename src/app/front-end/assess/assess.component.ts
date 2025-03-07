import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { DocumentsService } from '../../services/documents.service'
import { Document } from '../modal/document.interface'
import { ReviewersService } from '../../services/reviewer.service'
import { DocReviewer } from '../learn/learn.component'
import { Quiz, QuizService } from '../../services/quiz.service'
import { Flashcard, FlashcardService } from '../../services/flashcard.service'

interface DocumentFile {
  id: number
  name: string
  size: string
  type: string
  uploadedAt: Date
}

type FilterType = 'all' | 'quiz' | 'flashcard'

@Component({
  selector: 'app-assessment-center',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Enhanced Header with Gradient -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800">
        <div class="max-w-7xl mx-auto px-4 py-12">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2">Assessment Center</h1>
              <p class="text-blue-100">Create and manage your learning materials</p>
            </div>
            <div class='flex gap-2'>
              <button (click)="openCreateModal()" 
                      class="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                <span class="text-lg">+</span>
                Create New
              </button>
              <button (click)="openSummativeModal()" 
                      class="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                <!-- <span class="text-lg">+</span> -->
                Take Summative
              </button>
            </div>
          </div>
        </div>
      </div>

      <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- Improved Filter Section -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold text-gray-800">My Creations</h2>
            <div class="flex bg-gray-100 p-1 rounded-lg">
              <button *ngFor="let filterOption of filterOptions"
                      (click)="setFilterType(filterOption)"
                      [ngClass]="{
                        'bg-blue-600 text-white': filterType === filterOption,
                        'text-gray-600 hover:bg-gray-200': filterType !== filterOption
                      }"
                      class="px-6 py-2 rounded-md font-medium transition-all">
                {{ filterOption | titlecase }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredCreations.length === 0" 
             class="text-center py-12 bg-white rounded-lg shadow-sm">
          <div class="text-gray-400 mb-4">No assessments created yet</div>
          <button (click)="openCreateModal()" 
                  class="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
            Create your first assessment
          </button>
        </div>

        <!-- Enhanced Grid Layout -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let item of filteredCreations"
               class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100">
            <div class="p-6">
              <!-- Item Header -->
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center"
                     [ngClass]="{
                       'bg-red-100': isQuiz(item),
                       'bg-blue-100': !isQuiz(item)
                     }">
                  <span [ngClass]="{
                          'text-red-600': isQuiz(item),
                          'text-blue-600': !isQuiz(item)
                        }" 
                        class="text-xl font-bold">
                    {{ isQuiz(item) ? 'Q' : 'F' }}
                  </span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-800">{{ item.docTitle }}</h3>
                  <p class="text-sm text-gray-500">Created {{ item.dateCreated | date:'mediumDate' }}</p>
                </div>
              </div>
              
            
                <div class="flex items-center gap-2 mb-4">
                  <span class="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                    Important
                  </span>
                  <span *ngIf="isQuiz(item)" 
                        class="px-3 py-1 bg-green-100 text-green-600 text-sm font-medium rounded-full">
                    {{ item.questions.length || 0 }} Questions
                  </span>
                  <span *ngIf="!isQuiz(item)"
                        class="px-3 py-1 bg-purple-100 text-purple-600 text-sm font-medium rounded-full">
                    {{ item.items.length || 0 }} Cards
                  </span>
                </div>

              <!-- Action Buttons -->
              <div class="flex gap-2 mt-4">
                <button (click)="startItem(item)" 
                        class="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        [ngClass]="{
                          'bg-blue-600 hover:bg-blue-700': !item.completed,
                          'bg-green-600 hover:bg-green-700': item.completed
                        }">
                  <span>{{ item.completed ? '🔄' : '▶️' }}</span>
                  {{ item.completed ? 'Retake' : 'Start' }}
                </button>
                <button (click)="deleteItem(item.docId??'')" 
                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  ❌
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Improved Modal -->
<!-- Improved Modal with Multiple Select Dropdown -->
<div *ngIf="showCreateModal" 
     class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
  <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-semibold text-gray-800">Create New Assessment</h3>
      <button (click)="closeCreateModal()" 
              class="text-gray-400 hover:text-gray-600">
        ✕
      </button>
    </div>
    
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select Document
      </label>
      <select [(ngModel)]="selectedDocIds" 
              multiple
              size="5"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <option *ngFor="let doc of documents" [value]="doc.docUrl">
          {{ doc.docTitle }}
        </option>
      </select>
      <p class="mt-2 text-sm text-gray-500">Hold Ctrl/Cmd key to select multiple documents</p>
    </div>

    <div class="flex justify-end gap-3">
      <button (click)="closeCreateModal()" 
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all">
        Cancel
      </button>
      <button (click)="createItems()" 
              [disabled]="loading || selectedDocIds.length === 0"
              class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all flex items-center gap-2">
        <span *ngIf="loading" class="animate-spin">🔄</span>
        {{loading ? 'Creating...' : 'Create Assessment'}}
      </button>
    </div>
  </div>
</div>

<div *ngIf="showSummativeModal" 
     class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
  <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-semibold text-gray-800">Combine your Summative Test</h3>
      <button (click)="closeSummativeModal()" 
              class="text-gray-400 hover:text-gray-600">
        ✕
      </button>
    </div>
    
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select Quizzes
      </label>
      <select [(ngModel)]="selectedQuizIds" 
              multiple
              size="5"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        <option *ngFor="let quiz of quizzes" [value]="quiz.id">
          {{ quiz.docTitle }}
        </option>
      </select>
      <p class="mt-2 text-sm text-gray-500">Hold Ctrl/Cmd key to select multiple quizzes</p>
    </div>

    <div class="flex justify-end gap-3">
      <button (click)="closeSummativeModal()" 
              class="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all">
        Cancel
      </button>
      <button (click)="startQuizMerged()" 
              [disabled]="loading || selectedQuizIds.length <= 1"
              class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all flex items-center gap-2">
        <span *ngIf="loading" class="animate-spin">🔄</span>
        {{loading ? 'Creating...' : 'Take Summative'}}
      </button>
    </div>
  </div>
</div>
    </div>
  `,
})
export class AssessComponent implements OnInit {
  uploadedDocuments: DocumentFile[] = []
  documents: DocReviewer[] = [];
  quizzes: Quiz[] = [];
  flashcards: Flashcard[] = []
  allCreations: (Quiz|Flashcard)[] = [];
  
  showCreateModal = false
  selectedDocIds: string[] = [];
  newType: 'quiz' | 'flashcard' = 'quiz'
  filterType: FilterType = 'all'
  filterOptions: FilterType[] = ['all', 'quiz', 'flashcard']
  loading = false
  private nextId = 1
  selectedDocId!: string

  constructor(
    private reviewerService: ReviewersService,
    private quizService: QuizService,
    private flashcardService: FlashcardService,
    private router: Router
  ) {}

  isQuiz(item: Quiz | Flashcard): item is Quiz {
    return 'totalQuestions' in item;
  }

  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData() {
    try {
      const docs = (await firstValueFrom(this.reviewerService.getAllReviewers())).reviewers;
      this.documents = docs;
      const flashcards = await firstValueFrom(this.flashcardService.getAll());
      const quizzes = await firstValueFrom(this.quizService.getAll());
      this.quizzes = quizzes;
      this.allCreations = [...flashcards, ...quizzes].sort(
        (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
      );
      
      // Filter out documents that already have assessments
      this.documents = this.documents.filter(
        d => !this.allCreations.map(c => c.docId).includes(d.docId)
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  get filteredCreations(): (Quiz|Flashcard)[] {
    if (this.filterType === 'all') {
      return this.allCreations;
    }
    return this.allCreations.filter(item => 
      this.filterType === 'flashcard' ? !('totalQuestions' in item) : 'totalQuestions' in item
    );
  }

  setFilterType(type: FilterType) {
    this.filterType = type;
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  showSummativeModal:boolean = false;
  openSummativeModal() {
    this.showSummativeModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.selectedDocIds = [];
  }

  selectedQuizIds:string[] = [];
  closeSummativeModal() {
    this.showSummativeModal = false;
    this.selectedQuizIds = [];
  }

  async createItem() {
    if (this.loading) return;
    
    if (!this.selectedDocIds) {
      alert('Please select a document.');
      return;
    }

    const selectedDoc = this.documents.find(doc => doc.docUrl === this.selectedDocId);
    if (!selectedDoc) return;

    this.loading = true;

    try {
      // Generate both quiz and flashcard
      await Promise.all([
        firstValueFrom(this.quizService.generate(this.selectedDocId)),
        firstValueFrom(this.flashcardService.generate(this.selectedDocId))
      ]);
      
      await this.fetchData();
      this.closeCreateModal();
    } catch (error) {
      console.error('Error creating assessment:', error);
    } finally {
      this.loading = false;
    }
  }

  startItem(item: Quiz | Flashcard) {
    const route = 'totalQuestions' in item ? 'quiz' : 'flashcard';
    this.router.navigate([route, item.id]);
  }

  startQuizMerged() {
    this.router.navigate(['summative',  this.selectedQuizIds.join(',')]);
  }

  async createItems() {
    if (this.loading || this.selectedDocIds.length === 0) return;
    
    this.loading = true;
    
    try {
      // Process each selected document
      const promises = [];
      
      for (const docId of this.selectedDocIds) {
        const selectedDoc = this.documents.find(doc => doc.docUrl === docId);
        if (selectedDoc) {
          // Generate both quiz and flashcard
          promises.push(
            Promise.all([
              firstValueFrom(this.quizService.generate(docId)),
              firstValueFrom(this.flashcardService.generate(docId))
            ])
          );
        }
      }
      
      await Promise.all(promises);
      await this.fetchData();
      this.closeCreateModal();
    } catch (error) {
      console.error('Error creating assessments:', error);
    } finally {
      this.loading = false;
    }
  }
  

  async deleteItem(id: string) {
    if (!id) return;
    
    try {
      await firstValueFrom(this.quizService.deleteMaterials(id));
      await this.fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      // You could add error handling/user notification here
    }
  }
}