import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CompService } from '../services/comp-service';
import { Auth } from '../services/auth';
import { Category, Component as LabComponent, ComponentApplication, CodeExplanation } from '../models/component.model';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-view-components',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Dashboard],
  templateUrl: './view-components.html',
  styleUrl: './view-components.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewComponents implements OnInit {
  components: LabComponent[] = [];
  categories: Category[] = [];
  filteredComponents: LabComponent[] = [];
  selectedCategory: string = '';
  searchTerm: string = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // Application form
  showApplicationForm = false;
  selectedComponent: LabComponent | null = null;
  applicationForm: FormGroup;
  submitting = false;

  // Arduino code modal
  showCodeModal = false;
  selectedComponentCode: LabComponent | null = null;
  componentCodeExamples: CodeExplanation[] = [];
  loadingCode = false;

  // Overview and Specification modals
  showOverviewModalFlag = false;
  showSpecificationModalFlag = false;
  selectedComponentForModal: LabComponent | null = null;

  constructor(
    private compService: CompService, 
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef,
    public sanitizer: DomSanitizer,
    private auth: Auth
  ) {
    this.applicationForm = this.fb.group({
      qty: [1, [Validators.required, Validators.min(1)]],
      purpose: ['', [Validators.required]],
      how_many_date: [7, [Validators.required, Validators.min(1), Validators.max(30)]],
      request_code: [false] // Add option to request Arduino code
    });
  }

  ngOnInit() {
    this.loadComponents();
    this.loadCategories();
    
    // Set up days remaining update interval (once per day)
    // Safer to initialize this here rather than in the constructor
    setTimeout(() => this.updateDaysRemainingDisplay(), 0); // Run after initialization
    setInterval(() => this.updateDaysRemainingDisplay(), 86400000); // Update every 24 hours
  }

  private showError(message: string) {
    this.error = message;
    this.success = null;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.error = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  private showSuccess(message: string) {
    this.success = message;
    this.error = null;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.success = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  loadComponents() {
    this.loading = true;
    this.compService.getComponents().subscribe({
      next: (components) => {
        this.components = components;
        this.filteredComponents = components;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading components:', err);
        this.showError('Failed to load components');
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.compService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event.target.value;
    this.applyFilters();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.components];

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(comp => 
        comp.category?.id?.toString() === this.selectedCategory
      );
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(comp =>
        comp.title.toLowerCase().includes(term) ||
        comp.description?.toLowerCase().includes(term) ||
        comp.category?.name.toLowerCase().includes(term)
      );
    }

    this.filteredComponents = filtered;
    this.cdr.detectChanges();
  }

  requestComponent(component: LabComponent) {
    this.selectedComponent = component;
    this.showApplicationForm = true;
    
    // Update quantity validation based on component stock
    const qtyControl = this.applicationForm.get('qty');
    if (qtyControl) {
      qtyControl.setValidators([
        Validators.required, 
        Validators.min(1), 
        Validators.max(component.in_stock || 1)
      ]);
      qtyControl.updateValueAndValidity();
    }
    
    this.applicationForm.reset({
      qty: 1,
      purpose: '',
      how_many_date: 7
    });
    this.cdr.detectChanges();
  }

  submitApplication() {
    if (this.applicationForm.invalid || !this.selectedComponent) {
      this.showError('Please fill in all required fields correctly');
      return;
    }

    this.submitting = true;
    const formValue = this.applicationForm.value;
    
    // Get current user from auth service
    const currentUser = this.auth.getUser();
    
    if (!currentUser) {
      this.showError('Please log in to submit an application.');
      this.submitting = false;
      return;
    }

    // Get student ID from the profile data - Student model ID, not User ID
    const studentId = currentUser.profile?.id;
    
    if (!studentId) {
      this.showError('Student profile not found. Please contact support.');
      this.submitting = false;
      return;
    }
    
    const applicationData = {
      student_id: studentId,
      component_id: this.selectedComponent.id,
      qty: formValue.qty,
      purpose: formValue.purpose,
      how_many_date: formValue.how_many_date
    };

    console.log('Current user:', currentUser); // Debug log
    console.log('Submitting application data:', applicationData); // Debug log

    this.compService.createApplication(applicationData).subscribe({
      next: (result) => {
        this.showSuccess('Application submitted successfully! You can track its status in "My Applications".');
        this.cancelApplication();
      },
      error: (err) => {
        console.error('Error submitting application:', err);
        this.showError('Failed to submit application. Please try again.');
        this.submitting = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelApplication() {
    this.showApplicationForm = false;
    this.selectedComponent = null;
    this.applicationForm.reset();
    this.submitting = false;
    this.cdr.detectChanges();
  }

  trackByComponentId(index: number, component: LabComponent): number {
    return component.id;
  }
  
  // Days remaining functionality
  updateDaysRemainingDisplay() {
    // If an application was submitted, update the remaining days based on today's date
    // This would automatically decrease as days pass
    const daysRemaining = this.applicationForm.get('how_many_date')?.value || 7;
    
    // This is where you could subtract days based on how many days have passed since application
    console.log('Days remaining updated:', daysRemaining);
    
    // Use markForCheck instead of detectChanges to be safer
    // This will mark the component to be checked in the next change detection cycle
    // rather than forcing an immediate check
    this.cdr.markForCheck();
  }
  
  getDaysRemaining(): number {
    const selectedDays = this.applicationForm.get('how_many_date')?.value || 7;
    return selectedDays;
  }
  
  calculateDaysRemaining(startDate: Date, totalDays: number): number {
    const today = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    
    const remainingMs = endDate.getTime() - today.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, remainingDays);
  }
  
  // This method will be called periodically (e.g., daily) to update remaining days in the backend
  updateRemainingDaysInBackend(applicationId: number) {
    this.compService.updateRemainingDays(applicationId).subscribe({
      next: (updatedApplication) => {
        console.log('Remaining days updated in backend:', updatedApplication);
        // You could update the local application data here if needed
      },
      error: (err) => {
        console.error('Error updating remaining days:', err);
      }
    });
  }
  
  onDaysChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value);
    if (!isNaN(value) && value >= 1 && value <= 30) {
      this.applicationForm.get('how_many_date')?.setValue(value);
      this.updateDaysRemainingDisplay();
    }
  }

  onImageError(event: any) {
    if (event.target) {
      event.target.src = 'assets/images/default-component.jpg';
    }
  }

  // Arduino code modal methods
  viewArduinoCode(component: LabComponent) {
    // Clear previous data to avoid showing old data
    this.componentCodeExamples = [];
    
    this.selectedComponentCode = component;
    this.loadingCode = true;
    this.showCodeModal = true;
    this.cdr.detectChanges();

    // Force stop loading after 5 seconds as backup
    const timeoutId = setTimeout(() => {
      if (this.loadingCode) {
        this.loadingCode = false;
        this.componentCodeExamples = [];
        this.showError('Request timed out. The server may be unavailable.');
        this.cdr.detectChanges();
      }
    }, 5000); // 5 second timeout
    
    this.compService.getCodeExplanations(component.id).subscribe({
      next: (codes) => {
        clearTimeout(timeoutId);
        
        // Filter codes to only show ones that match the requested component
        const filteredCodes = codes?.filter(codeExample => 
          codeExample.component?.id === component.id
        ) || [];
        
        this.componentCodeExamples = filteredCodes;
        this.loadingCode = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        clearTimeout(timeoutId);
        this.componentCodeExamples = [];
        this.loadingCode = false;
        this.showError('Failed to load Arduino code examples: ' + (err.statusText || err.message));
        this.cdr.detectChanges();
      },
      complete: () => {
        clearTimeout(timeoutId);
        this.loadingCode = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeCodeModal() {
    this.showCodeModal = false;
    this.selectedComponentCode = null;
    this.componentCodeExamples = [];
    this.cdr.detectChanges();
  }

  hasArduinoCode(component: LabComponent): boolean {
    // You can add a property to the component model to indicate if it has code
    // For now, we'll assume all components might have code
    return true;
  }

  copyCodeToClipboard(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.showSuccess('Code copied to clipboard!');
    }).catch(() => {
      this.showError('Failed to copy code to clipboard');
    });
  }

  copyAllComponentCode() {
    if (!this.componentCodeExamples || this.componentCodeExamples.length === 0) {
      this.showError('No code available to copy');
      return;
    }

    // Combine all code examples for this component
    let allCode = '';
    this.componentCodeExamples.forEach((codeExample, index) => {
      if (index > 0) {
        allCode += '\n\n// ====== Additional Example ' + (index + 1) + ' ======\n';
        if (codeExample.description) {
          allCode += '// ' + this.stripHtml(codeExample.description) + '\n';
        }
      }
      allCode += codeExample.code || '';
    });

    navigator.clipboard.writeText(allCode).then(() => {
      this.showSuccess('All component code copied to clipboard!');
    }).catch(() => {
      this.showError('Failed to copy code to clipboard');
    });
  }

  // Arduino IDE helper methods
  getCodeLines(code: string | undefined): string[] {
    return code ? code.split('\n') : [];
  }

  stripHtml(html: string | undefined): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  getLimitedDescription(description: string | undefined): string {
    if (!description) return '';
    
    // Strip HTML tags first
    const cleanText = this.stripHtml(description);
    
    // Split into words and limit to 8 words
    const words = cleanText.split(' ').filter(word => word.trim().length > 0);
    const maxWords = 8;
    
    if (words.length <= maxWords) {
      return cleanText;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  }

  sanitizeHtml(html: string | undefined): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  highlightArduinoCode(code: string | undefined): SafeHtml {
    if (!code) return this.sanitizer.bypassSecurityTrustHtml('');
    
    // Escape HTML first
    let highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Apply syntax highlighting
    highlighted = highlighted
      // Comments (single line)
      .replace(/(\/\/.*$)/gm, '<span style="color: #6a9955;">$1</span>')
      // Comments (multi-line)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a9955;">$1</span>')
      // Arduino keywords
      .replace(/\b(void|int|float|char|boolean|byte|String|setup|loop|if|else|for|while|do|switch|case|break|continue|return|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|const)\b/g, '<span style="color: #0000ff;">$1</span>')
      // Arduino functions
      .replace(/\b(pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|delayMicroseconds|Serial|print|println|begin|available|read|write|tone|noTone|map|constrain|random|randomSeed|millis|micros)\b/g, '<span style="color: #795e26;">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span style="color: #098658;">$1</span>')
      // Preprocessor directives
      .replace(/^(#\w+.*$)/gm, '<span style="color: #af00db;">$1</span>');
    
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  // Overview modal methods
  showOverviewModal(component: LabComponent): void {
    this.selectedComponentForModal = component;
    this.showOverviewModalFlag = true;
    this.cdr.detectChanges();
  }

  closeOverviewModal(): void {
    this.showOverviewModalFlag = false;
    this.selectedComponentForModal = null;
    this.cdr.detectChanges();
  }

  // Specification modal methods
  showSpecificationModal(component: LabComponent): void {
    this.selectedComponentForModal = component;
    this.showSpecificationModalFlag = true;
    this.cdr.detectChanges();
  }

  closeSpecificationModal(): void {
    this.showSpecificationModalFlag = false;
    this.selectedComponentForModal = null;
    this.cdr.detectChanges();
  }

  // Application form methods
  closeApplicationForm(): void {
    this.showApplicationForm = false;
    this.selectedComponent = null;
    this.cdr.detectChanges();
  }

  // Arduino code methods
  showArduinoCode(component: LabComponent): void {
    this.selectedComponentCode = component;
    this.showCodeModal = true;
    this.cdr.detectChanges();
  }
}
