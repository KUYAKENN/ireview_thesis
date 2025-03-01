import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      firstName: ['John', Validators.required],
      lastName: ['Doe', Validators.required],
      email: ['john.doe@example.com', [Validators.required, Validators.email]]
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
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    });
    this.profileForm.markAsPristine();
    this.profileForm.disable();
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      console.log('Profile updated:', this.profileForm.value);
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
