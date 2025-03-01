import { Component, OnInit } from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { FileUploadService } from '../../services/file-upload.service'
import { Document } from '../modal/document.interface'
import { HttpEventType } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import { DocumentsService } from '../../services/documents.service'
import { firstValueFrom } from 'rxjs'

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="documents-section">
      <!-- 📂 Header -->
      <div class="section-header">
        <h2 class="text-xl font-semibold text-gray-800">📁 Documents Library</h2>
        <label class="upload-btn">
          {{ uploading ? "Uploading..." : "+ Upload Document" }}
          <input 
            [disabled]="uploading" 
            type="file" 
            (change)="onFileSelected($event)" 
            accept=".pdf" 
            hidden />
        </label>
      </div>

      <!-- 🗂 Document Cards -->
      <div class="documents-grid">
        <div class="document-card" *ngFor="let doc of documents; trackBy: trackByDocId">
          
          <!-- ❌ Delete Button (Top Right) -->
          <button class="delete-btn" (click)="deleteDocument(doc.id)">✖</button>

          <!-- 📄 Document Type Badge -->
          <div class="document-icon">{{ doc.type }}</div>

          <!-- 📑 Document Info -->
          <div class="document-body">
            <h4 class="document-title">{{ doc.title }}</h4>
            <div class="document-meta">
              <span>📅 Modified: <strong>{{ doc.modifiedDate }}</strong></span>
              <span>📦 Size: <strong>{{ doc.size }}</strong></span>
            </div>
            <div class="document-tags">
              <span class="tag" *ngFor="let tag of doc.tags">{{ tag }}</span>
            </div>
          </div>

          <!-- 👁 Centered View Button -->
          <div class="document-actions">
            <button class="view-btn" (click)="viewDocument(getLink(doc.url ?? ''))">👁 View</button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* 🏗️ Container */
    .documents-section {
      padding: 1.5rem;
      background: #f9fafb;
    }

    /* 📂 Header */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .upload-btn {
      padding: 0.6rem 1rem;
      border-radius: 0.4rem;
      font-size: 0.9rem;
      cursor: pointer;
      background: #008b9b;
      color: #fff;
      font-weight: bold;
      border: none;
    }

    /* 🗂 Document Grid */
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    /* 📄 Document Card */
    .document-card {
      background: #fff;
      border-radius: 0.6rem;
      padding: 1.2rem;
      box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease-in-out;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      position: relative;
      align-items: flex-start;
      text-align: left;
    }
    .document-card:hover {
      transform: scale(1.02);
    }

    /* ❌ Delete Button (Top Right) */
    .delete-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 1rem;
      color: #e53e3e;
      cursor: pointer;
    }
    .delete-btn:hover {
      color: #c53030;
    }

    /* 📄 Document Type Badge */
    .document-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.3rem;
      font-size: 0.8rem;
      font-weight: bold;
      color: white;
      background: #ff6b6b;
    }

    /* 📑 Document Info */
    .document-body {
      flex-grow: 1;
      text-align: left;
    }
    .document-title {
      font-size: 1rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .document-meta {
      font-size: 0.85rem;
      color: #4a5568;
      line-height: 1.4;
    }

    /* 🏷️ Tags */
    .document-tags {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .tag {
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      background: #edf2f7;
      color: #4a5568;
      border-radius: 0.3rem;
    }

    /* 👁 Centered View Button */
    .document-actions {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .view-btn {
      padding: 0.7rem 1.4rem;
      border-radius: 0.3rem;
      font-size: 0.9rem;
      cursor: pointer;
      font-weight: bold;
      border: none;
      background: #38a169;
      color: #fff;
      width: 90%;
      text-align: center;
    }
  `]
})
export class DocumentsComponent implements OnInit {
  documents: Document[] = [
    { id: '1', title: 'Sample PDF', type: 'PDF', size: '1.2 MB', modifiedDate: '1 day ago', tags: ['Important'], url: '' }
  ]
  uploading: boolean = false

  constructor(
    private documentService: DocumentsService,
    private fileUploadService: FileUploadService) {}


  ngOnInit(): void {
    this.fetchData();
  }

  async fetchData(){
   try{
    const docs =(await firstValueFrom(this.documentService.getAllDocuments())).documents;
    this.documents =docs;
   }catch(e){}
   
  }

  trackByDocId(index: number, doc: Document): string {
    return doc.id
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      const selectedFile = input.files[0]
      this.uploading = true
      this.fileUploadService.uploadFile(selectedFile).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round((100 * event.loaded) / (event.total || 1))
          console.log(`Uploading: ${progress}%`)
        }
        if (event.type === HttpEventType.Response) {
          const response = event.body
          this.uploading = false
          // const fileURL = URL.createObjectURL(selectedFile)
          const newDoc: Document = {
            id: response.file_id,
            title: selectedFile.name,
            type: 'PDF',
            size: `${(selectedFile.size / 1024).toFixed(2)} KB`,
            modifiedDate:new DatePipe('en-US').transform(new Date(), 'yyyy-MM-dd HH:mm:ss.SSSSSS') ??'',
            tags: ['Reviewer'],
            url: response.file_id + '.' + response.ext
          }
          this.documentService.createDocument(newDoc).subscribe(
            (createdDocument) => {
              console.log('Document created successfully:', createdDocument);
              
              // After successful creation, add the document to the documents array
              this.documents.push(newDoc);
            },
            (error) => {
              console.error('Error creating document:', error);
            }
          );
        }
      })
    }
  }

  getLink(url:string){
    if(url.trim()==''){
      return '';
    }else{
      return environment.publicUrl + '/uploads/' + url
    }
  }

  deleteDocument(id: string): void {
    this.documentService.deleteDocument(id).subscribe(
      response => {
        console.log('Document deleted successfully', response);
        this.documents = this.documents.filter(doc => doc.id !== id)
      },
      error => {
        console.error('Error deleting document', error);
      }
    );
  }

  viewDocument(url: string): void {
    if (url.trim() !== '') {
      window.open(url, '_blank')
    } else {
      alert('Document URL is not available.')
    }
  }
}
