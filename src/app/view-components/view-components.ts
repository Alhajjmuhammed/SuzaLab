import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Dashboard } from '../dashboard/dashboard';
import { CompService } from '../services/comp-service';
import { Category, Component as LabComponent, ComponentApplication, CodeExplanation } from '../models/component.model';

@Component({
  selector: 'app-view-components',
  standalone: true,
  imports: [Dashboard, CommonModule, ReactiveFormsModule],
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

  constructor(
    private compService: CompService, 
    private fb: FormBuilder, 
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    this.applicationForm = this.fb.group({
      qty: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      purpose: ['', [Validators.required]],
      how_many_date: [7, [Validators.required, Validators.min(1), Validators.max(30)]],
      request_code: [false] // Add option to request Arduino code
    });
  }

  ngOnInit() {
    this.loadComponents();
    this.loadCategories();
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
    
    const applicationData: Partial<ComponentApplication> = {
      component_id: this.selectedComponent.id,
      qty: formValue.qty,
      purpose: formValue.purpose,
      how_many_date: formValue.how_many_date,
      pending: true,
      on_progress: false,
      enrolled: false,
      requested_at: new Date().toISOString()
    };

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

  onImageError(event: any) {
    if (event.target) {
      event.target.src = 'assets/images/default-component.jpg';
    }
  }

  // Arduino code modal methods
  viewArduinoCode(component: LabComponent) {
    console.log('=== DEBUG: Starting viewArduinoCode ===');
    console.log('Component:', component);
    console.log('Component ID:', component.id);
    
    this.selectedComponentCode = component;
    this.loadingCode = true;
    this.showCodeModal = true;
    this.cdr.detectChanges();

    // Force stop loading after 5 seconds as backup
    const timeoutId = setTimeout(() => {
      if (this.loadingCode) {
        console.error('TIMEOUT: API call took too long - forcing stop');
        this.loadingCode = false;
        this.componentCodeExamples = [];
        this.showError('Request timed out. The server may be unavailable.');
        this.cdr.detectChanges();
      }
    }, 5000); // 5 second timeout

    console.log('Making API call to:', `${this.compService['componentApiUrl']}/components/${component.id}/code/`);
    
    this.compService.getCodeExplanations(component.id).subscribe({
      next: (codes) => {
        clearTimeout(timeoutId);
        console.log('✅ SUCCESS: Received code explanations:', codes);
        this.componentCodeExamples = codes;
        this.loadingCode = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        clearTimeout(timeoutId);
        console.error('❌ ERROR: Failed to load code examples:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          message: err.message
        });
        this.componentCodeExamples = [];
        this.loadingCode = false;
        this.showError('Failed to load Arduino code examples: ' + (err.statusText || err.message));
        this.cdr.detectChanges();
      },
      complete: () => {
        clearTimeout(timeoutId);
        console.log('🏁 COMPLETE: API call finished');
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
}
