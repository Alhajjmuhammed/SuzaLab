
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dashboard } from '../dashboard/dashboard';
import { CompService } from '../services/comp-service';
import { Category, Component as LabComponent } from '../models/component.model';

@Component({
  selector: 'app-components',
  standalone: true,
  imports: [Dashboard, CommonModule, ReactiveFormsModule],
  templateUrl: './components.html',
  styleUrls: ['./components.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Components implements OnInit {
  // Tab state
  activeTab: 'components' | 'categories' = 'components';
  
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
  
  // File upload properties
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress = 0;
  isUploading = false;

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
  }

  ngOnInit() {
    this.loadComponents();
    this.loadCategories();
  }

  setActiveTab(tab: 'components' | 'categories') {
    this.activeTab = tab;
    this.cancelForm();
    this.cancelCategoryForm();
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

  // TrackBy functions for better performance and immediate updates
  trackByComponentId(index: number, component: LabComponent): number {
    return component.id;
  }

  trackByCategoryId(index: number, category: Category): number {
    return category.id;
  }
}
