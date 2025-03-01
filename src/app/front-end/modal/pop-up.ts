import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document, DocumentType } from './document.interface'; 

@Component({
  selector: 'app-upload-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="popup-overlay">
      <div class="popup-container">
        <div class="popup-header">
          <h3>Upload New Document</h3>
          <button class="close-btn" (click)="onClose()">×</button>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="popup-form">

          <!-- SELECT FILE -->
          <div class="form-group">
            <label for="fileUpload">Select File</label>
            <input
              type="file"
              id="fileUpload"
              (change)="onFileSelected($event)"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              required
            />
            <!-- We only display file details if selectedFile is not null -->
            <div class="file-info" *ngIf="selectedFile">
              <strong>Filename:</strong> {{ selectedFile.name }}<br />
              <strong>Size:</strong> {{ selectedFileSize }}<br />
              <strong>Type:</strong> {{ selectedFile.type }}
            </div>
          </div>

          <!-- TITLE -->
          <div class="form-group">
            <label for="title">Title</label>
            <input
              id="title"
              [(ngModel)]="documentTitle"
              name="documentTitle"
              type="text"
              placeholder="Document Title"
              required
            />
          </div>

          <!-- TAGS -->
          <div class="form-group">
            <label>Tags</label>
            <div class="tag-input">
              <input
                type="text"
                [(ngModel)]="newTag"
                (keyup.enter)="addTag()"
                placeholder="Enter a tag and press 'Add'"
                name="newTag"
              />
              <button type="button" (click)="addTag()">Add</button>
            </div>
            <div class="tag-list">
              <span class="tag-item" *ngFor="let tag of tags; let i = index">
                {{ tag }}
                <button
                  type="button"
                  class="remove-tag"
                  (click)="removeTag(i)"
                >
                  ×
                </button>
              </span>
            </div>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="form-actions">
            <button type="submit" class="submit-btn">Upload</button>
            <button type="button" class="cancel-btn" (click)="onClose()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .popup-container {
      background: #ffffff;
      border-radius: 8px;
      width: 400px;
      max-width: 90%;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      position: relative;
    }
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .popup-header h3 {
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #aaa;
    }
    .close-btn:hover {
      color: #333;
    }
    .popup-form .form-group {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
    }
    .popup-form label {
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .popup-form input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .tag-input {
      display: flex;
      gap: 0.5rem;
    }
    .tag-input input {
      flex: 1;
    }
    .tag-list {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .tag-item {
      background: #edf2f7;
      color: #4a5568;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
    }
    .remove-tag {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: #718096;
    }
    .remove-tag:hover {
      color: #e53e3e;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .submit-btn {
      padding: 0.5rem 1rem;
      background: #008b9b;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .cancel-btn {
      padding: 0.5rem 1rem;
      background: #e2e8f0;
      color: #4a5568;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .file-info {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #666;
      line-height: 1.4;
    }
  `]
})
export class PopUpComponent {
  // =======================================
  // Events emitted to parent
  // =======================================
  @Output() newDocument = new EventEmitter<Document>();
  @Output() close = new EventEmitter<void>();

  // =======================================
  // File selection
  // =======================================
  // Use File | null so it can be null initially.
  // Then use *ngIf="selectedFile" to avoid optional chaining warnings.
  selectedFile: File | null = null;
  selectedFileSize = ''; // e.g. "2.3 MB"

  // =======================================
  // Form fields
  // =======================================
  documentTitle = '';
  tags: string[] = [];
  newTag = '';

  // =======================================
  // Methods
  // =======================================

  /**
   * Triggered when user selects a file from <input type="file">
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.selectedFile = input.files[0];
    this.selectedFileSize = this.formatFileSize(this.selectedFile.size);
  }

  /**
   * Called when user submits the form ("Upload" button).
   * Builds a new Document and emits it to the parent.
   */
  onSubmit(): void {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const fileExt = this.getFileExtension(this.selectedFile.name);

    // Create a new Document object
    const newDoc: Document = {
      id: this.generateId(),
      title: this.documentTitle || this.selectedFile.name,
      type: this.mapExtensionToDocumentType(fileExt),
      size: this.selectedFileSize,
      // Automatically set current date/time
      modifiedDate: new Date().toLocaleString(),
      tags: [...this.tags]
    };

    // Emit the new document object to the parent
    this.newDocument.emit(newDoc);
  }

  /**
   * Fired when user clicks Cancel or the "×" close button
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Add a tag to the list
   */
  addTag(): void {
    if (this.newTag.trim()) {
      this.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  /**
   * Remove a tag by index
   */
  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  /**
   * Generate a random ID (demo usage)
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  /**
   * Returns substring after the last dot (e.g. 'pdf', 'docx')
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return filename.substring(lastDotIndex + 1).toLowerCase();
  }

  /**
   * Maps file extensions to the literal union type 'PDF' | 'DOCX' | 'PPT'
   */
  private mapExtensionToDocumentType(ext: string): DocumentType {
    switch (ext) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'DOCX';
      case 'ppt':
      case 'pptx':
        return 'PPT';
      default:
        // fallback if unknown extension
        return 'PDF';
    }
  }

  /**
   * Converts file size in bytes to human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  }
}
