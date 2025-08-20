import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';
import { CompService } from '../services/comp-service';
import { ComponentApplication } from '../models/component.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [Dashboard, CommonModule],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyApplications implements OnInit {
  applications: ComponentApplication[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private compService: CompService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMyApplications();
  }

  private showError(message: string) {
    this.error = message;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.error = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  loadMyApplications() {
    this.loading = true;
    
    // For now, we'll load all applications and filter by current user
    // In a real app, you'd have an endpoint like getMyApplications()
    this.compService.getApplications().subscribe({
      next: (applications) => {
        // In production, this should be filtered by the current user ID on the backend
        this.applications = applications;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading applications:', err);
        this.showError('Failed to load your applications');
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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

  getApplicationStatusIcon(application: ComponentApplication): string {
    if (application.pending) return 'fas fa-clock';
    if (application.on_progress && !application.return_day) return 'fas fa-spinner fa-spin';
    if (application.return_day) return 'fas fa-check-circle';
    if (application.overdue) return 'fas fa-exclamation-triangle';
    return 'fas fa-question-circle';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysRemaining(application: ComponentApplication): number | null {
    if (!application.issued_at || !application.how_many_date) return null;
    
    const issuedDate = new Date(application.issued_at);
    const dueDate = new Date(issuedDate.getTime() + (application.how_many_date * 24 * 60 * 60 * 1000));
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getDaysRemainingText(application: ComponentApplication): string {
    const days = this.getDaysRemaining(application);
    if (days === null) return 'N/A';
    
    if (days > 0) {
      return `${days} days remaining`;
    } else {
      return `Overdue by ${Math.abs(days)} days`;
    }
  }

  getPendingCount(): number {
    return this.applications.filter(app => app.pending).length;
  }

  getInProgressCount(): number {
    return this.applications.filter(app => app.on_progress && !app.return_day).length;
  }

  getCompletedCount(): number {
    return this.applications.filter(app => app.return_day).length;
  }

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
