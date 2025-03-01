import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate, state, keyframes, group } from '@angular/animations';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service'  

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(-100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition(':enter', [
        style({ 
          transform: 'translateX(-100%)', 
          opacity: 0
        }),
        group([
          animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
            style({ 
              transform: 'translateX(0)'
            })
          ),
          animate('300ms ease-out', 
            style({ 
              opacity: 1
            })
          )
        ])
      ]),
      transition(':leave', [
        group([
          animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
            style({ 
              transform: 'translateX(100%)'
            })
          ),
          animate('300ms ease-in', 
            style({ 
              opacity: 0
            })
          )
        ])
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('contentAnimation', [
      transition(':enter', [
        style({ 
          transform: 'translateX(20px)',
          opacity: 0
        }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ 
            transform: 'translateX(0)',
            opacity: 1
          })
        )
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  @ViewChild('loginCard') loginCard!: ElementRef;
  @ViewChild('rightPanel') rightPanel!: ElementRef;

  isLoginMode = true;
  showForgotPassword = false;
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  showPassword = false;
  showSignupPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  isSuccessful = false;
  formError = '';
  shakeError = false;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupFormValidation();
  }

  private initializeForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$')
      ]]
    });

    this.signupForm = this.fb.group({
      firstName: ['', Validators.required],  // Add this
      lastName: ['', Validators.required],   // Add this
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$')
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator })
    

    this.forgotPasswordForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]]
    });
  }

  private setupFormValidation(): void {
    this.loginForm.valueChanges.subscribe(() => {
      this.formError = '';
      this.shakeError = false;
    });

    this.signupForm.valueChanges.subscribe(() => {
      this.formError = '';
      this.shakeError = false;
      if (this.signupForm.get('password')?.value !== this.signupForm.get('confirmPassword')?.value) {
        this.signupForm.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      }
    });

    this.forgotPasswordForm.valueChanges.subscribe(() => {
      this.formError = '';
      this.shakeError = false;
    });
  }

  validateForm(form: FormGroup): boolean {
    const isValid = form.valid && form.dirty;
    const emailControl = form.get('email');
    
    if (!emailControl?.dirty) {
      return false;
    }

    if (form !== this.forgotPasswordForm) {
      const passwordControl = form.get('password');
      if (!passwordControl?.dirty) {
        return false;
      }

      if (form === this.signupForm) {
        const confirmPasswordControl = form.get('confirmPassword');
        if (!confirmPasswordControl?.dirty) {
          return false;
        }
      }
    }

    return isValid;
  }

  toggleMode(event?: Event): void {
    event?.preventDefault();
    this.isLoginMode = !this.isLoginMode;
    this.showForgotPassword = false;
    this.formError = '';
    this.shakeError = false;
    this.isLoading = false;
    this.isSuccessful = false;
    
    if (this.isLoginMode) {
      this.loginForm.reset();
    } else {
      this.signupForm.reset();
    }
  }

  togglePassword(field: string): void {
    switch(field) {
      case 'login':
        this.showPassword = !this.showPassword;
        break;
      case 'signup':
        this.showSignupPassword = !this.showSignupPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  toggleForgotPassword(event?: Event): void {
    event?.preventDefault();
    this.showForgotPassword = !this.showForgotPassword;
    this.formError = '';
    this.shakeError = false;
    this.isLoading = false;
    this.isSuccessful = false;
    
    if (!this.showForgotPassword) {
      this.forgotPasswordForm.reset();
    }
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password');
    const confirmPassword = g.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value ? null : { 'passwordMismatch': true };
  }

  async handleForgotPassword(): Promise<void> {
    if (this.validateForm(this.forgotPasswordForm)) {
      this.isLoading = true;
      this.formError = '';
      this.shakeError = false;

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.isSuccessful = true;

        // Show success state briefly
        setTimeout(() => {
          this.isSuccessful = false;
          this.isLoading = false;
          this.showForgotPassword = false;
          this.forgotPasswordForm.reset();
        }, 1500);

      } catch (error) {
        this.formError = 'An error occurred. Please try again.'; 
        this.shakeError = true;
        this.isLoading = false;
      }
    } else {
      this.shakeError = true;
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        const control = this.forgotPasswordForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        } 
      });
    }
  }

  async onSubmit(): Promise<void> {
    const form = this.isLoginMode ? this.loginForm : this.signupForm
    
    if (this.validateForm(form)) {
      this.isLoading = true
      this.formError = ''
      this.shakeError = false
  
      try {
        if (this.isLoginMode) {
          // Actual login API call
          this.authService.login({
            email: form.get('email')?.value,
            password: form.get('password')?.value
          }).subscribe(
            res => {
              this.isSuccessful = true
              setTimeout(() => {
                this.isSuccessful = false
                this.isLoading = false
                form.reset()
                this.router.navigate(['/homepage'])
              }, 1500)
            },
            err => {
              this.formError = err.message || 'Login failed'
              this.shakeError = true
              this.isLoading = false
            }
          )
        } else {
          // Actual registration API call
          this.authService.register(
            this.signupForm.get('firstName')?.value,
            this.signupForm.get('lastName')?.value,
            this.signupForm.get('email')?.value,
            this.signupForm.get('password')?.value
          ).subscribe(
            res => {
              this.isSuccessful = true
              setTimeout(() => {
                this.isSuccessful = false
                this.isLoading = false
                this.toggleMode()
              }, 1500)
            },
            err => {
              this.formError = err.message || 'Registration failed'
              this.shakeError = true
              this.isLoading = false
            }
          )
          
        }          
      } catch (error: any) {
        this.formError = error.message || 'An unexpected error occurred'
        this.shakeError = true
        this.isLoading = false
      }
    } else {
      this.shakeError = true
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key)
        if (control?.invalid) {
          control.markAsTouched()
        }
      })
    }
  }
  

  get emailError(): string {
    const email = this.isLoginMode ? 
      this.loginForm.get('email') : 
      this.signupForm.get('email');
    
    if (email?.errors && email.touched) {
      if (email.errors['required']) return 'Email is required';
      if (email.errors['email'] || email.errors['pattern']) return 'Please enter a valid email';
    }
    return '';
  }

  get passwordError(): string {
    const password = this.isLoginMode ? 
      this.loginForm.get('password') : 
      this.signupForm.get('password');
    
    if (password?.errors && password.touched) {
      if (password.errors['required']) return 'Password is required';
      if (password.errors['minlength']) return 'Password must be at least 6 characters';
      if (password.errors['pattern']) return 'Password must contain both letters and numbers';
    }
    return '';
  }

  get confirmPasswordError(): string {
    const confirmPassword = this.signupForm.get('confirmPassword');
    
    if (confirmPassword?.errors && confirmPassword.touched) {
      if (confirmPassword.errors['required']) return 'Please confirm your password';
      if (confirmPassword.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }
}