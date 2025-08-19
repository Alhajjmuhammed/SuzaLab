import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  isLoading = false;
  showPassword = false;
  currentSlideIndex = 0;
  private isBrowser: boolean;
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit() {
    // Only run in browser environment
    if (this.isBrowser) {
      // Auto-advance slider every 4 seconds
      setInterval(() => {
        this.nextSlide();
      }, 4000);
    }
  }

  currentSlide(n: number) {
    this.showSlide(this.currentSlideIndex = n - 1);
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % 3;
    this.showSlide(this.currentSlideIndex);
  }

  showSlide(n: number) {
    // Only execute in browser environment
    if (!this.isBrowser) return;
    
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (!slides.length) return; // Safeguard if elements don't exist
    
    if (n >= slides.length) { this.currentSlideIndex = 0; }
    if (n < 0) { this.currentSlideIndex = slides.length - 1; }
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    if (slides[this.currentSlideIndex]) {
      slides[this.currentSlideIndex].classList.add('active');
    }
    if (dots[this.currentSlideIndex]) {
      dots[this.currentSlideIndex].classList.add('active');
    }
  }

  togglePasswordVisibility() {
    if (!this.isBrowser) return; // Only execute in browser environment
    
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.showPassword ? 'text' : 'password';
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const loginBtn = document.querySelector('.login-btn') as HTMLElement;
    if (loginBtn) {
      loginBtn.classList.add('loading');
    }

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (loginBtn) {
          loginBtn.classList.remove('loading');
        }
        console.log('Login successful:', response);
        // The auth service will handle navigation to /home
      },
      error: (error) => {
        this.isLoading = false;
        if (loginBtn) {
          loginBtn.classList.remove('loading');
        }
        console.error('Login failed:', error);
        
        // Better error message handling
        if (error.status === 401) {
          this.errorMessage = 'Invalid credentials. Please check your username and password.';
        } else if (error.status === 0) {
          this.errorMessage = 'Connection failed. Please check if the server is running.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = error.error?.detail || error.error?.non_field_errors?.[0] || 'Login failed. Please try again.';
        }
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getter methods for easy access in template
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
  get rememberMe() { return this.loginForm.get('rememberMe'); }

  socialLogin(provider: string) {
    console.log(`Login with ${provider}`);
    // Implement social login logic here
  }

  forgotPassword() {
    console.log('Forgot password clicked');
    // Implement forgot password logic here
  }

  createAccount() {
    console.log('Create account clicked');
    // Navigate to registration page
  }
}
