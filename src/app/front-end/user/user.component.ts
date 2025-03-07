import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom, Subject, takeUntil, timer } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class UserComponent implements OnInit, OnDestroy {
  userForm: FormGroup = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    profile_picture: new FormControl(null)
  });

  user: UserProfile | null = null;
  isEditing = false;
  isLoading = false;
  isSubmitting = false;
  showSuccessMessage = false;
  imagePreview: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private authService:AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserData(): void {
    this.isLoading = true;
    const user = this.authService.getCurrentUser();
    if(!user) return;
    // Simulate API call with timeout
    setTimeout(() => {
      this.user = {
        id: 1,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        profile_picture: user.profilePictureUrl,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      this.initForm(); // Initialize form with data
      this.isLoading = false;
    }, 700);
  }

  initForm(): void {
    if (!this.user) return;
    
    this.userForm.setValue({
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      email: this.user.email,
      profile_picture: this.user.profile_picture
    });
  }

  getProfileLink(profile_path:string|null|undefined){
    if(!profile_path){
      return null;
    }
    return environment.publicUrl + '/uploads/profiles/' + profile_path
  }

  toggleEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    if (!this.user) return;
    
    this.isEditing = false;
    this.imagePreview = null;

    // Reset form to original values
    this.userForm.setValue({
      first_name: this.user.first_name,
      last_name: this.user.last_name,
      email: this.user.email,
      profile_picture: this.user.profile_picture
    });

    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();
  }

  onSubmit(): void {
    if (this.userForm.invalid || !this.user) return;
    
    this.isSubmitting = true;
    
    // Get form values
    const formValues = this.userForm.value;
    
    setTimeout(async() => {
      this.user = {
        ...this.user!,
        first_name: formValues.first_name,
        last_name: formValues.last_name,
        email: formValues.email,
        profile_picture: this.imagePreview || this.user!.profile_picture,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      this.isEditing = false;
      this.isSubmitting = false;
      await firstValueFrom(this.authService.updateProfile({
        firstName: formValues.first_name,
        lastName: formValues.last_name,
      }))
      this.showSuccessMessage = true;

      if(this.selectedFile){
        await firstValueFrom(this.authService.updateProfilePicture(this.selectedFile))
      }

      timer(4000).pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.showSuccessMessage = false;
      });
    }, 1000);
  }
  
  selectedFile?:File;

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSizeInBytes) {
      alert('File size exceeds 5MB limit.');
      return;
    }
    
    if (!file.type.match('image.*')) {
      alert('Only image files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      this.selectedFile = file
    };
    reader.readAsDataURL(file);
  }
}
