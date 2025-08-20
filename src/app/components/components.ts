
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { Dashboard } from '../dashboard/dashboard';
import { CompService } from '../services/comp-service';
import { Category, Component as LabComponent, CodeExplanation, ComponentApplication } from '../models/component.model';

@Component({
  selector: 'app-components',
  standalone: true,
  imports: [Dashboard, CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './components.html',
  styleUrls: ['./components.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Components implements OnInit {
  // Tab state
  activeTab: 'components' | 'categories' | 'code' | 'applications' = 'components';
  
  // Category form and state
  showCategoryForm = false;
  isEditCategory = false;
  selectedCategory: Category | null = null;
  categoryForm: FormGroup;
  
  // Component form and state
  components: LabComponent[] = [];
  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  selectedComponent: LabComponent | null = null;
  showForm = false;
  isEdit = false;
  componentForm: FormGroup;
  
  // Details view
  showDetailsModal = false;
  detailsComponent: LabComponent | null = null;
  
  // Code management
  codeExplanations: CodeExplanation[] = [];
  showCodeForm = false;
  isEditCode = false;
  selectedCodeExplanation: CodeExplanation | null = null;
  codeForm: FormGroup;
  selectedComponentForCode: LabComponent | null = null;
  
  // Applications management
  applications: ComponentApplication[] = [];
  selectedApplication: ComponentApplication | null = null;
  
  // File upload properties
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress = 0;
  isUploading = false;

  // Quill editor configuration
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],                                         // remove formatting button
      ['link', 'image']                                 // link and image, video
    ]
  };

  // Code editor configuration (focused on code editing)
  quillCodeConfig = {
    toolbar: [
      ['bold', 'italic'],
      ['code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean'],
      ['link']
    ]
  };

  constructor(private compService: CompService, private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.componentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      category_id: [null],
      in_stock: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      overview: [''],
      specification: ['']
    });
    
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
    
    this.codeForm = this.fb.group({
      component_id: [null, [Validators.required]],
      description: ['', [Validators.required]],
      code: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadComponents();
    this.loadCategories();
  }

  setActiveTab(tab: 'components' | 'categories' | 'code' | 'applications') {
    this.activeTab = tab;
    this.cancelForm();
    this.cancelCategoryForm();
    this.cancelCodeForm();
    if (tab === 'code') {
      // Only load if we don't have data or if we have components but no code explanations
      if (this.codeExplanations.length === 0 && this.components.length > 0) {
        this.loadCodeExplanations();
      }
    } else if (tab === 'applications') {
      this.loadApplications();
    }
    this.forceUpdate(); // Force immediate update
  }

  // ===== UTILITY METHODS =====

  private showError(message: string) {
    this.error = message;
    this.cdr.detectChanges(); // Force immediate update
    setTimeout(() => {
      this.error = null;
      this.cdr.detectChanges(); // Force update when clearing error
    }, 5000);
  }

  private showSuccess(message: string) {
    // You can implement toast notification here
    console.log('Success:', message);
    this.cdr.detectChanges(); // Force immediate update
  }

  private forceUpdate() {
    this.cdr.detectChanges();
  }

  // ===== FILE UPLOAD METHODS =====

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.showError('File size must be less than 5MB');
        return;
      }

      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.forceUpdate(); // Force immediate update
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    // Reset file input
    const fileInput = document.getElementById('featureImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.forceUpdate(); // Force immediate update
  }

  // ===== COMPONENT CRUD METHODS =====

  loadComponents() {
    this.loading = true;
    this.error = null;
    this.forceUpdate();
    
    this.compService.getComponents().subscribe({
      next: (data) => {
        this.components = data;
        this.loading = false;
        this.forceUpdate(); // Force immediate update
        console.log('Components loaded:', data);
      },
      error: (err) => {
        console.error('Error loading components:', err);
        this.showError('Failed to load components. Please try again.');
        this.loading = false;
        this.forceUpdate(); // Force update on error
      }
    });
  }

  addComponent() {
    this.componentForm.reset({ in_stock: 0 });
    this.isEdit = false;
    this.showForm = true;
    this.selectedComponent = null;
    this.selectedFile = null;
    this.imagePreview = null;
    this.forceUpdate(); // Force immediate update
  }

  editComponent(component: LabComponent) {
    this.selectedComponent = component;
    this.isEdit = true;
    this.showForm = true;
    this.selectedFile = null;
    this.imagePreview = component.feature || null;
    
    this.componentForm.patchValue({
      title: component.title,
      category_id: component.category?.id || null,
      in_stock: component.in_stock,
      description: component.description,
      overview: component.overview,
      specification: component.specification
    });
    
    this.forceUpdate(); // Force immediate update
  }

  saveComponent() {
    if (this.componentForm.invalid) {
      this.showError('Please fill in all required fields correctly');
      return;
    }

    const formValue = this.componentForm.value;
    this.isUploading = true;

      if (this.selectedFile) {
        // Use file upload method
        const formData = this.compService.createComponentFormData(formValue, this.selectedFile);
        
        if (this.isEdit && this.selectedComponent) {
          this.compService.updateComponentWithFile(this.selectedComponent.id, formData).subscribe({
            next: (result) => {
              this.showSuccess('Component updated successfully');
              // Update the component in the array immediately
              const index = this.components.findIndex(c => c.id === this.selectedComponent!.id);
              if (index !== -1) {
                this.components[index] = result;
              }
              this.cancelForm();
              this.isUploading = false;
              this.forceUpdate(); // Force immediate update
            },
            error: (err) => {
              console.error('Error updating component:', err);
              this.showError('Failed to update component. Please try again.');
              this.isUploading = false;
              this.forceUpdate();
            }
          });
        } else {
          this.compService.createComponentWithFile(formData).subscribe({
            next: (result) => {
              this.showSuccess('Component created successfully');
              // Add the new component to the array immediately
              this.components.unshift(result);
              this.cancelForm();
              this.isUploading = false;
              this.forceUpdate(); // Force immediate update
            },
            error: (err) => {
              console.error('Error creating component:', err);
              this.showError('Failed to create component. Please try again.');
              this.isUploading = false;
              this.forceUpdate();
            }
          });
        }
      } else {
        // Use regular JSON method
        if (this.isEdit && this.selectedComponent) {
          this.compService.updateComponent(this.selectedComponent.id, formValue).subscribe({
            next: (result) => {
              this.showSuccess('Component updated successfully');
              // Update the component in the array immediately
              const index = this.components.findIndex(c => c.id === this.selectedComponent!.id);
              if (index !== -1) {
                this.components[index] = result;
              }
              this.cancelForm();
              this.isUploading = false;
              this.forceUpdate(); // Force immediate update
            },
            error: (err) => {
              console.error('Error updating component:', err);
              this.showError('Failed to update component. Please try again.');
              this.isUploading = false;
              this.forceUpdate();
            }
          });
        } else {
          this.compService.createComponent(formValue).subscribe({
            next: (result) => {
              this.showSuccess('Component created successfully');
              // Add the new component to the array immediately
              this.components.unshift(result);
              this.cancelForm();
              this.isUploading = false;
              this.forceUpdate(); // Force immediate update
            },
            error: (err) => {
              console.error('Error creating component:', err);
              this.showError('Failed to create component. Please try again.');
              this.isUploading = false;
              this.forceUpdate();
            }
          });
        }
      }
  }

  deleteComponent(component: LabComponent) {
    if (!confirm(`Are you sure you want to delete "${component.title}"? This action cannot be undone.`)) return;
    
    this.compService.deleteComponent(component.id).subscribe({
      next: () => {
        this.showSuccess('Component deleted successfully');
        // Remove the component from the array immediately
        this.components = this.components.filter(c => c.id !== component.id);
        this.forceUpdate(); // Force immediate update
      },
      error: (err) => {
        console.error('Error deleting component:', err);
        this.showError('Failed to delete component. Please try again.');
        this.forceUpdate();
      }
    });
  }

  cancelForm() {
    this.showForm = false;
    this.selectedComponent = null;
    this.isEdit = false;
    this.selectedFile = null;
    this.imagePreview = null;
    this.isUploading = false;
    this.componentForm.reset({ in_stock: 0 });
    this.forceUpdate(); // Force immediate update
  }

  // ===== CATEGORY CRUD METHODS =====

  loadCategories() {
    this.compService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.forceUpdate(); // Force immediate update
        console.log('Categories loaded:', data);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.showError('Failed to load categories');
        this.forceUpdate();
      }
    });
  }

  addCategory() {
    this.categoryForm.reset();
    this.isEditCategory = false;
    this.showCategoryForm = true;
    this.selectedCategory = null;
    this.forceUpdate(); // Force immediate update
  }

  editCategory(category: Category) {
    this.selectedCategory = category;
    this.isEditCategory = true;
    this.showCategoryForm = true;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
    this.forceUpdate(); // Force immediate update
  }

  saveCategory() {
    if (this.categoryForm.invalid) {
      this.showError('Please fill in all required fields correctly');
      return;
    }

    const formValue = this.categoryForm.value;
    
    if (this.isEditCategory && this.selectedCategory) {
      this.compService.updateCategory(this.selectedCategory.id, formValue).subscribe({
        next: (result) => {
          this.showSuccess('Category updated successfully');
          // Update the category in the array immediately
          const index = this.categories.findIndex(c => c.id === this.selectedCategory!.id);
          if (index !== -1) {
            this.categories[index] = result;
          }
          this.cancelCategoryForm();
          this.forceUpdate(); // Force immediate update
        },
        error: (err) => {
          console.error('Error updating category:', err);
          this.showError('Failed to update category. Please try again.');
          this.forceUpdate();
        }
      });
    } else {
      this.compService.createCategory(formValue).subscribe({
        next: (result) => {
          this.showSuccess('Category created successfully');
          // Add the new category to the array immediately
          this.categories.unshift(result);
          this.cancelCategoryForm();
          this.forceUpdate(); // Force immediate update
        },
        error: (err) => {
          console.error('Error creating category:', err);
          this.showError('Failed to create category. Please try again.');
          this.forceUpdate();
        }
      });
    }
  }

  deleteCategory(category: Category) {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) return;
    
    this.compService.deleteCategory(category.id).subscribe({
      next: () => {
        this.showSuccess('Category deleted successfully');
        // Remove the category from the array immediately
        this.categories = this.categories.filter(c => c.id !== category.id);
        this.forceUpdate(); // Force immediate update
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        this.showError('Failed to delete category. Please try again.');
        this.forceUpdate();
      }
    });
  }

  cancelCategoryForm() {
    this.showCategoryForm = false;
    this.selectedCategory = null;
    this.isEditCategory = false;
    this.categoryForm.reset();
    this.forceUpdate(); // Force immediate update
  }

  // ===== HELPER METHODS =====

  getComponentCountForCategory(categoryId: number): number {
    return this.components.filter(comp => comp.category?.id === categoryId).length;
  }

  // Helper method to strip HTML tags for display in table (if needed)
  stripHtml(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // Helper method to truncate rich text content for table display
  truncateHtml(html: string, maxLength: number = 150): string {
    if (!html) return '';
    const text = this.stripHtml(html);
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // TrackBy functions for better performance and immediate updates
  trackByComponentId(index: number, component: LabComponent): number {
    return component.id;
  }

  trackByCategoryId(index: number, category: Category): number {
    return category.id;
  }

  // ===== DETAILS VIEW METHODS =====

  viewDetails(component: LabComponent) {
    this.detailsComponent = component;
    this.showDetailsModal = true;
    this.forceUpdate();
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.detailsComponent = null;
    this.forceUpdate();
  }

  // ===== CODE MANAGEMENT METHODS =====

  loadCodeExplanations() {
    this.codeExplanations = []; // Reset the array
    this.loading = true;
    
    // Check if we have components loaded
    if (this.components.length === 0) {
      this.loading = false;
      this.forceUpdate();
      return;
    }
    
    // Use forkJoin to wait for all requests to complete
    const codeRequests = this.components.map(component => 
      this.compService.getCodeExplanations(component.id)
    );
    
    // If no components, complete immediately
    if (codeRequests.length === 0) {
      this.loading = false;
      this.forceUpdate();
      return;
    }
    
    // Use Promise.allSettled to handle all requests, even if some fail
    Promise.allSettled(codeRequests.map(req => req.toPromise())).then(results => {
      // Use a Set to prevent duplicates based on code explanation ID
      const uniqueCodeExplanations = new Map<number, any>();
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          result.value.forEach((codeExplanation: any) => {
            // Only add if we haven't seen this ID before
            if (!uniqueCodeExplanations.has(codeExplanation.id)) {
              uniqueCodeExplanations.set(codeExplanation.id, codeExplanation);
            }
          });
        } else if (result.status === 'rejected') {
          console.error(`Error loading code explanations for component ${this.components[index].id}:`, result.reason);
        }
      });
      
      // Convert Map values back to array
      this.codeExplanations = Array.from(uniqueCodeExplanations.values());
      this.loading = false;
      this.forceUpdate();
    }).catch(err => {
      console.error('Error loading code explanations:', err);
      this.loading = false;
      this.forceUpdate();
    });
  }

  refreshCodeExplanations() {
    console.log('Refreshing code explanations...');
    this.loadCodeExplanations();
  }

  addCodeExplanation(component?: LabComponent) {
    // Reset form state first
    this.codeForm.reset();
    this.isEditCode = false;
    this.selectedCodeExplanation = null;
    this.selectedComponentForCode = component || null;
    
    // Switch to Arduino Code tab
    this.activeTab = 'code';
    this.cancelForm();
    this.cancelCategoryForm();
    // Don't call cancelCodeForm() here as we want to show the form
    // loadCodeExplanations() is not needed here - data is already loaded when tab is switched
    
    // Now show the form
    this.showCodeForm = true;
    
    // Enable the component_id field when adding new code
    this.codeForm.get('component_id')?.enable();
    
    if (component) {
      this.codeForm.patchValue({
        component_id: component.id
      });
    }
    this.forceUpdate();
  }

  editCodeExplanation(codeExplanation: CodeExplanation) {
    this.selectedCodeExplanation = codeExplanation;
    this.isEditCode = true;
    this.showCodeForm = true;
    this.selectedComponentForCode = codeExplanation.component;
    
    this.codeForm.patchValue({
      component_id: codeExplanation.component.id,
      description: codeExplanation.description,
      code: codeExplanation.code
    });
    
    // Disable the component_id field when editing
    this.codeForm.get('component_id')?.disable();
    
    this.forceUpdate();
  }

  saveCodeExplanation() {
    if (this.codeForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.codeForm.controls).forEach(key => {
        this.codeForm.get(key)?.markAsTouched();
      });
      this.showError('Please fill in all required fields correctly');
      this.forceUpdate();
      return;
    }

    const formValue = this.codeForm.value;
    
    // Re-enable component_id for submission if it was disabled
    if (this.codeForm.get('component_id')?.disabled) {
      this.codeForm.get('component_id')?.enable();
      formValue.component_id = this.selectedCodeExplanation?.component.id;
    }
    
    if (this.isEditCode && this.selectedCodeExplanation) {
      this.compService.updateCodeExplanation(this.selectedCodeExplanation.id, formValue).subscribe({
        next: (result) => {
          this.showSuccess('Arduino code updated successfully');
          // Update the code in the array immediately
          const index = this.codeExplanations.findIndex(c => c.id === this.selectedCodeExplanation!.id);
          if (index !== -1) {
            this.codeExplanations[index] = result;
          }
          this.cancelCodeForm();
          this.forceUpdate();
        },
        error: (err) => {
          console.error('Error updating code explanation:', err);
          this.showError('Failed to update Arduino code. Please try again.');
          this.forceUpdate();
        }
      });
    } else {
      this.compService.createCodeExplanation(formValue.component_id, formValue).subscribe({
        next: (result) => {
          this.showSuccess('Arduino code added successfully');
          // Add the new code to the array immediately
          this.codeExplanations.unshift(result);
          this.cancelCodeForm();
          this.forceUpdate();
        },
        error: (err) => {
          console.error('Error creating code explanation:', err);
          this.showError('Failed to add Arduino code. Please try again.');
          this.forceUpdate();
        }
      });
    }
  }

  deleteCodeExplanation(codeExplanation: CodeExplanation) {
    if (!confirm(`Are you sure you want to delete this Arduino code for "${codeExplanation.component.title}"? This action cannot be undone.`)) return;
    
    this.compService.deleteCodeExplanation(codeExplanation.id).subscribe({
      next: () => {
        this.showSuccess('Arduino code deleted successfully');
        // Remove the code from the array immediately
        this.codeExplanations = this.codeExplanations.filter(c => c.id !== codeExplanation.id);
        this.forceUpdate();
      },
      error: (err) => {
        console.error('Error deleting code explanation:', err);
        this.showError('Failed to delete Arduino code. Please try again.');
        this.forceUpdate();
      }
    });
  }

  cancelCodeForm() {
    this.showCodeForm = false;
    this.selectedCodeExplanation = null;
    this.isEditCode = false;
    this.selectedComponentForCode = null;
    this.codeForm.reset();
    
    // Ensure the component_id field is enabled when canceling
    this.codeForm.get('component_id')?.enable();
    
    this.forceUpdate();
  }

  // Helper method to get component by ID
  getComponentById(componentId: number): LabComponent | null {
    return this.components.find(c => c.id === componentId) || null;
  }

  // ===== APPLICATIONS MANAGEMENT METHODS =====
  
  loadApplications() {
    this.applications = [];
    this.loading = true;
    
    this.compService.getApplications().subscribe({
      next: (applications) => {
        this.applications = applications;
        this.forceUpdate();
      },
      error: (err) => {
        console.error('Error loading applications:', err);
        this.showError('Failed to load applications');
      },
      complete: () => {
        this.loading = false;
        this.forceUpdate();
      }
    });
  }

  approveApplication(application: ComponentApplication) {
    const studentName = this.getStudentDisplayName(application.student);
    const componentTitle = application.component?.title || 'Unknown Component';
    if (!confirm(`Approve application by ${studentName} for ${componentTitle}?`)) return;
    
    const updateData = {
      pending: false,
      on_progress: true,
      enrolled: true,
      issued_at: new Date().toISOString()
    };
    
    this.compService.updateApplication(application.id, updateData).subscribe({
      next: (updated) => {
        this.showSuccess('Application approved successfully');
        const index = this.applications.findIndex(a => a.id === application.id);
        if (index !== -1) {
          this.applications[index] = updated;
        }
        this.forceUpdate();
      },
      error: (err) => {
        console.error('Error approving application:', err);
        this.showError('Failed to approve application');
      }
    });
  }

  rejectApplication(application: ComponentApplication) {
    const studentName = this.getStudentDisplayName(application.student);
    const componentTitle = application.component?.title || 'Unknown Component';
    if (!confirm(`Reject application by ${studentName} for ${componentTitle}?`)) return;
    
    this.compService.deleteApplication(application.id).subscribe({
      next: () => {
        this.showSuccess('Application rejected and removed');
        this.applications = this.applications.filter(a => a.id !== application.id);
        this.forceUpdate();
      },
      error: (err) => {
        console.error('Error rejecting application:', err);
        this.showError('Failed to reject application');
      }
    });
  }

  markAsCompleted(application: ComponentApplication) {
    if (!confirm(`Mark application as completed and returned by ${this.getStudentDisplayName(application.student)}?`)) return;
    
    const updateData = {
      on_progress: false,
      return_day: true,
      updated_at: new Date().toISOString()
    };
    
    this.compService.updateApplication(application.id, updateData).subscribe({
      next: (updated) => {
        this.showSuccess('Application marked as completed');
        const index = this.applications.findIndex(a => a.id === application.id);
        if (index !== -1) {
          this.applications[index] = updated;
        }
        this.forceUpdate();
      },
      error: (err) => {
        console.error('Error updating application:', err);
        this.showError('Failed to update application');
      }
    });
  }

  getStudentDisplayName(student?: ComponentApplication['student']): string {
    if (student?.user) {
      const firstName = student.user.first_name || '';
      const lastName = student.user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || student.user.username || student.user.email || 'Unknown Student';
    }
    return 'Unknown Student';
  }

  getApplicationStatus(application: ComponentApplication): string {
    if (application.pending) return 'Pending Approval';
    if (application.on_progress && !application.return_day) return 'In Progress';
    if (application.return_day) return 'Completed';
    if (application.overdue) return 'Overdue';
    return 'Unknown';
  }

  getApplicationStatusClass(application: ComponentApplication): string {
    if (application.pending) return 'badge bg-warning text-dark';
    if (application.on_progress && !application.return_day) return 'badge bg-primary';
    if (application.return_day) return 'badge bg-success';
    if (application.overdue) return 'badge bg-danger';
    return 'badge bg-secondary';
  }

  formatApplicationDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // TrackBy function for code explanations
  trackByCodeId(index: number, code: CodeExplanation): number {
    return code.id;
  }

  // TrackBy function for applications
  trackByApplicationId(index: number, application: ComponentApplication): number {
    return application.id;
  }

  // Helper method to display purpose in user-friendly format
  getPurposeDisplay(purpose: string): string {
    const purposeMap: { [key: string]: string } = {
      'field': 'Field Work',
      'training': 'Training'
    };
    return purposeMap[purpose] || purpose;
  }
}
