import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  profileImage: string | ArrayBuffer | null = null;
  isEditing = false;

  constructor(private fb: FormBuilder, private authService:AuthService) {
    this.profileForm = this.fb.group({
      firstName: [this.authService.getCurrentUser()?.firstName, Validators.required],
      lastName: [this.authService.getCurrentUser()?.lastName, Validators.required],
      email: [this.authService.getCurrentUser()?.email, [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.profileForm.disable(); // Initially disable inputs
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.isEditing ? this.profileForm.enable() : this.profileForm.disable();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profileForm.reset({
      firstName: this.authService.getCurrentUser()?.firstName,
      lastName: this.authService.getCurrentUser()?.lastName,
      email: this.authService.getCurrentUser()?.email
    });
    this.profileForm.markAsPristine();
    this.profileForm.disable();
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      console.log('Profile updated:', this.profileForm.value);
      await firstValueFrom(this.authService.updateProfile({
          firstName: this.profileForm.value.firstName,
          lastName: this.profileForm.value.lastName,
        }))
      this.isEditing = false;
      this.profileForm.disable();
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
