import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { DocumentsService } from '../../services/documents.service'
import { firstValueFrom } from 'rxjs'
import { ReviewersService } from '../../services/reviewer.service'
import { FileUploadService } from '../../services/file-upload.service'
import { Document } from '../modal/document.interface'
import { environment } from '../../../environments/environment'

type DocumentType = 'PDF'

interface Toast {
  id:string
  type:'error'|'success'|'neutral'|'loader'
  message:string,
}
export interface DocReviewer {
  docId: string
  docTitle: string
  docUrl: string
  size: string
  modifiedDate: string
  createdAt: string;
  tags: string[]
}

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-background">
      <div class="toast-container">
        <div *ngFor="let toast of toasts" [ngClass]="{
          'toast-success': toast.type == 'success',
          'toast-loading': toast.type == 'loader',
          'toast-error': toast.type == 'error',
        }">
          {{toast.message}}
        </div>
      </div>
      <div class="container">
        <h1>Learn Page: Generate Reviewer</h1>
        <p class="subtitle">
          Select a <strong>PDF document</strong> to generate a reviewer entry. You can then
          <strong>view</strong> or <strong>download</strong> the file.
        </p>

        <!-- 📂 DOCUMENT SELECTION -->
        <div class="doc-selection">
          <label for="docSelect">📑 Choose Document:</label>
          <select id="docSelect" [(ngModel)]="selectedDocId" class="select-input">
            <option value="">-- Select a PDF Document --</option>
            <option *ngFor="let doc of pdfDocuments" [value]="doc.id">
              {{ doc.title }} ({{ doc.type }})
            </option>
          </select>
          <button class="btn btn-primary" (click)="createReviewer()" [disabled]="!selectedDocId">
            ⚡ {{generating? 'Generating...' : 'Generate Reviewer'}}
          </button >
        </div>

        <!-- 📄 REVIEWER ENTRIES (UPDATED DESIGN) -->
        <div class="reviewers-section" *ngIf="docReviewers.length > 0">
          <h2>Reviewer Entries</h2>
          <div class="reviewers-grid">
            <div class="reviewer-card" *ngFor="let reviewer of docReviewers; let i = index">
              <div class="card-header">
                <span class="doc-badge">PDF</span>
                <button class="close-btn" (click)="deleteReviewer(i)">×</button>
              </div>
              <h3 class="doc-title">{{ reviewer.docTitle }}</h3>
              <p class="metadata">
                📅 <strong>Modified:</strong> {{ reviewer.modifiedDate }} |
                📦 <strong>Size:</strong> {{ reviewer.size }}
              </p>
              <div class="tags-list">
                <span class="tag" *ngFor="let tag of reviewer.tags">{{ tag }}</span>
              </div>
              <a class="btn btn-view" [href]="getLink(reviewer.docUrl)" target="_blank" rel="noopener">
                👁 View
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
        /* Container for the toasts */
      .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        // max-width: 400px;
        display: flex;
        font-weight: 700;
        flex-direction: column;
        gap: 10px;
      }

      /* Common styling for all toasts */
      .toast-container div {
        user-select:none;
        background-color: white;
        color: #333;
        padding: 16px 40px;
        text-align:center;
        border-radius: 12px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }

      /* Toast success specific styles */
      .toast-success {
        border: 2px solid green;
        color: green!important;
        background-color: #e0f7e0 !important;
      }

      /* Toast loading specific styles */
      .toast-loading {
        border: 2px solid black;
        color: black;
      }
      .toast-error {
        border: 2px solid red!important;
        color: red!important;
        background-color: #f8d7da !important;
      }

      /* Optional: Toasts fading out when removed (you can add this if needed for animations) */
      .toast-container div.ng-leave {
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.3s, transform 0.3s;
      }

      .toast-container div.ng-enter {
        opacity: 1;
        transform: translateX(0);
        transition: opacity 0.3s, transform 0.3s;
      }

    /* Full-page styling */
    .page-background {
      min-height: 100vh;
      background: #f4f8fa;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2rem;
      position: relative;
    }

    /* Centered content */
    .container {
      background: #fff;
      border-radius: 8px;
      max-width: 1100px;
      width: 100%;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 2rem;
    }

    /* Titles */
    h1 {
      text-align: center;
      font-size: 1.75rem;
      color: #2d3748;
    }
    .subtitle {
      text-align: center;
      color: #4a5568;
      margin-bottom: 2rem;
    }

    /* Document Selection */
    .doc-selection {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 2rem;
    }
    .select-input {
      padding: 0.5rem;
      font-size: 0.9rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    /* Reviewer Entries */
    .reviewers-section {
      text-align: center;
      width: 100%;
    }
    .reviewers-section h2 {
      font-size: 1.25rem;
      color: #2d3748;
      margin-bottom: 1rem;
    }

    /* Reviewers Grid */
    .reviewers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    /* Reviewer Card */
    .reviewer-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      text-align: left;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      transition: all 0.2s ease-in-out;
      position: relative;
    }
    .reviewer-card:hover {
      transform: translateY(-3px);
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .doc-badge {
      background: #ff6b6b;
      color: white;
      padding: 5px 12px;
      font-size: 0.8rem;
      font-weight: bold;
      border-radius: 4px;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #a0aec0;
    }
    .close-btn:hover {
      color: #e53e3e;
    }

    /* Document Title */
    .doc-title {
      font-size: 1rem;
      font-weight: bold;
      color: #2d3748;
    }

    /* Metadata */
    .metadata {
      font-size: 0.9rem;
      color: #4a5568;
      margin: 0.5rem 0;
    }

    /* Tags */
    .tags-list {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .tag {
      background: #edf2f7;
      color: #4a5568;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    /* View Button */
    .btn-view {
      display: block;
      width: 100%;
      padding: 10px;
      text-align: center;
      background: #38a169;
      color: white;
      border-radius: 6px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 1rem;
    }
    .btn-view:hover {
      background: #2f855a;
    }
  `]
})
export class LearnComponent implements OnInit{
  documents: Document[] = [
    { id: '1', title: 'Natural Disasters', type: 'PDF', size: '2.4 MB', modifiedDate: '2 hours ago', tags: ['Reviewer'], url: '../../../assets/MSD.pdf' }
  ]

  selectedDocId = ''
  docReviewers: DocReviewer[] = []

  constructor(
    private fileUploadService:FileUploadService,
    private documentService:DocumentsService,
    private reviewerService:ReviewersService
  ){}

    ngOnInit(): void {
      this.fetchData();
    }
  
    async fetchData(){
     try{
      const docs =(await firstValueFrom(this.documentService.getAllDocuments())).documents as Document[];
      
      const revs =  await firstValueFrom(this.reviewerService.getAllReviewers())
      this.docReviewers = revs.reviewers;
      const filteredDocs = docs.filter(d=>!this.docReviewers.map(r=>r.docId).includes(d.id)
        &&!this.toasts.map(t=>t.id).includes(d.id)
      );
      this.documents = filteredDocs;
      for(let document of this.documents){
          this.checkReviewerStatus(document);
    
      }
     }catch(e){}
     
    }
  
  toasts:Toast[] = [];
  async checkReviewerStatus(doc:Document){
    try{
      await this.reviewerService.checkPendingReviewer(doc)
      this.documents = this.documents.filter(d=>d.id != doc.id)
      this.toasts.push({
        id: doc.id,
        type:'loader',
        message: `Generating reviewer for ${doc.title}...`
      })
      await this.reviewerService.waitForReviewer(doc);
      const index = this.toasts.findIndex(t => t.id == doc.id);
      this.toasts[index].message = `Reviewer for ${doc.title} is now ready!`
      this.toasts[index].type = 'success';
      const currentToast = this.toasts[index];
      setTimeout(()=>{
        this.toasts = this.toasts.filter(s=>s.id!= currentToast.id);
      },5000)
      this.fetchData();
    }catch(e){
      console.error(e)
    }
  }

  get pdfDocuments(): Document[] {
    return this.documents.filter(doc => doc.type === 'PDF')
  }

  get selectedDoc(): Document | null {
    return this.pdfDocuments.find(d => d.id === this.selectedDocId) ?? null
  }

  getLink(url:string){
      if(url.trim()==''){
        return '';
      }else{
        return environment.publicUrl + '/uploads/' + url
      }
    }

  generating = false;
  async createReviewer() {
    if (!this.selectedDocId || this.generating) return
    const doc = this.documents.find(d => d.id === this.selectedDocId);
    if (!doc) return
    // this.generating = true;

    this.documents = this.documents.filter(d => d.id != this.selectedDocId);
    
    this.selectedDocId == '';

    try{
      this.toasts.push({
        id: doc.id,
        type:'loader',
        message: `Generating reviewer for ${doc.title}...`
      })
      const gen_response = await this.reviewerService.generateReviewer(doc);
      await this.fileUploadService.generateReview(doc,gen_response.compiled_review);
      const index = this.toasts.findIndex(t => t.id == doc.id);
      this.toasts[index].message = `Reviewer for ${doc.title} is now ready!`
      this.toasts[index].type = 'success';
      const currentToast = this.toasts[index];
      setTimeout(()=>{
        this.toasts = this.toasts.filter(s=>s.id!= currentToast.id);
      },5000)
    }catch(e:any){  
      const index = this.toasts.findIndex(t => t.id == doc.id);
      const currentToast = this.toasts[index];
      this.toasts[index].message = `Wait a moment!`
      this.toasts[index].type = 'error',
      setTimeout(()=>{
        this.toasts = this.toasts.filter(s=>s.id!= currentToast.id);
        this.documents.push(doc)
      },5000)
    }
    await this.fetchData();
  
    // this.generating =false;
    this.selectedDocId = ''
  }

  deleteReviewer(index: number): void {
    const id = this.docReviewers[index].docId
    this.reviewerService.deleteReviewer(id).subscribe(
      response => {
        console.log('Document deleted successfully', response);
        this.fetchData();
      },
      error => {
        console.error('Error deleting document', error);
      }
    );
  }
}
