import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http'
import { firstValueFrom, Observable, tap } from 'rxjs'
import {marked} from 'marked'
import {jsPDF} from 'jspdf'
import { environment } from '../../environments/environment'
import { Document } from '../front-end/modal/document.interface'
import { ReviewersService } from './reviewer.service'
import { DatePipe } from '@angular/common'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiUrl + '/upload' // Flask Server URL

  constructor(
    private reviewerService: ReviewersService,
    private http: HttpClient, private auth:AuthService) {}

    private getHeaders(): HttpHeaders {
      const userId = this.auth.getCurrentUser()?.id; 
      return new HttpHeaders({
        'User-ID': userId || ''  // Use user ID from localStorage or AuthService
      });
    }

  uploadFile(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData()
    formData.append('file', file, file.name)
    const headers = this.getHeaders();

    return this.http.post(this.apiUrl, formData, {
      headers:  headers,
      reportProgress: true,
      observe: 'events' // ✅ Allows tracking upload progress
    }).pipe(
      tap(event => {
        if (event.type === HttpEventType.Sent) {
          console.warn(`🚀 Uploading file: ${file.name}...`)
          // alert(`🚀 Uploading: ${file.name}... Please wait.`)
        }
        if (event.type === HttpEventType.Response) {
          console.warn(`✅ Upload complete: ${file.name}`)
          // alert(`✅ Upload complete: ${file.name}`)
        }
      })
    )
  }

  async generateReview(document: Document, htmls: string) {
    const htmlContent = await marked(htmls);
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
    const headers = this.getHeaders()
    const styled = `
    <div>${htmlContent}</div>
    <style>
        * {
          background-color: transparent !important;
          font-size: 5px !important;
          margin-top: 0 !important;
        }
        table, th, td {
            border: none!important;
            border-collapse: collapse!important; /* Optional: Ensures the table borders are not collapsed */
            padding: 0 !important; /* Minimizes the padding */
            padding-left: 3px !important;
            padding-right: 3px !important;
            padding-top: 3px !important;
        }

        td{
          vertical-align: top !important;
        }
    </style>
    `;
  
    // Wrap the callback function in a promise
    await new Promise<void>((resolve, reject) => {
      doc.html(styled, {
        callback: async (doc) => {
          try {
            // Automatically save the PDF after generation
            doc.save(`${document.title}-reviewer.pdf`);
            const pdfData = doc.output('blob'); // Get the PDF as a Blob
  
            // Create a FormData instance and append the PDF Blob
            const formData = new FormData();
            formData.append('file', pdfData, `${document.title}-reviewer.pdf`);
  
            const response = await firstValueFrom(this.http.post<any>(this.apiUrl, formData, { headers }));
  
            // Handle server response
            if (response) {
              console.log('File uploaded successfully. File ID:', response.file_id);
              const res = await this.reviewerService.createReviewer({
                docId: document.id,
                docTitle: "Reviewer for "+ document.title,
                docUrl: response.file_id + '.' + response.ext,
                size: document.size,
                modifiedDate: document.modifiedDate,
                createdAt: new DatePipe('en-US').transform(new Date(), 'yyyy-MM-dd HH:mm:ss.SSSSSS') ?? '',
                tags: document.tags,
              });
            } else {
              console.error('File upload failed');
            }
  
            // Resolve the promise after everything is done
            resolve();
          } catch (error) {
            console.error('Error uploading file:', error);
            reject(error);
          }
        },
        margin: [10,10,10,10],
        width: 180,
        windowWidth: 210,
        autoPaging: true, // Enable automatic paging to create new pages when needed
      });
    });
  
    // Now you can continue with the code after the callback has finished
    console.log('Callback completed, continue processing.');
  }
  
}
