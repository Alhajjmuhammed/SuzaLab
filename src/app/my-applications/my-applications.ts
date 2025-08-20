import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIf, NgFor } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';
import { CompService } from '../services/comp-service';
import { Auth } from '../services/auth';
import { ComponentApplication } from '../models/component.model';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [Dashboard, CommonModule, NgIf, NgFor],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyApplications implements OnInit {
  applications: ComponentApplication[] = [];
  loading = false;
  error: string | null = null;
  updatingIds: Set<number> = new Set(); // Track which applications are being updated

  constructor(
    private compService: CompService, 
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadMyApplications();
    
    // Schedule daily update for remaining days
    this.updateAllRemainingDays();
    
    // Set up a timer to update remaining days once per day
    // In a real app, you might want to move this to a service
    const millisecondsUntilMidnight = this.getMillisecondsUntilMidnight();
    setTimeout(() => {
      this.updateAllRemainingDays();
      // Then set it to run daily
      setInterval(() => this.updateAllRemainingDays(), 24 * 60 * 60 * 1000);
    }, millisecondsUntilMidnight);
  }
  
  // Calculate milliseconds until midnight for proper scheduling
  private getMillisecondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
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
    
    this.compService.getApplications().subscribe({
      next: (applications) => {
        console.log('Raw applications from API:', applications);
        console.log('First application student data:', applications[0]?.student);
        // Filter applications for current student only
        const currentUser = this.auth.getUser();
        console.log('Current user:', currentUser);
        console.log('Current user profile ID:', currentUser?.profile?.id);
        if (currentUser?.profile?.id) {
          // Filter by student_id matching the current user's profile (student) ID
          this.applications = applications.filter(app => 
            app.student?.id === currentUser.profile.id
          );
        } else {
          this.applications = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading applications:', err);
        this.applications = [];
        this.loading = false;
        this.showError('Failed to load your applications');
        this.cdr.detectChanges();
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
  
  // Update remaining days for all in-progress applications in the backend
  updateAllRemainingDays() {
    console.log('Updating all remaining days in the backend...');
    
    // Filter only in-progress applications that haven't been returned
    const activeApplications = this.applications.filter(app => 
      app.on_progress && !app.return_day
    );
    
    if (activeApplications.length === 0) {
      console.log('No active applications to update');
      return;
    }
    
    // Update each application's remaining days in the backend
    activeApplications.forEach(app => {
      if (app.id) {
        this.updateDaysRemaining(app);
      }
    });
  }
  
  // Update remaining days for a specific application
  updateDaysRemaining(application: ComponentApplication) {
    if (!application.id) return;
    
    // Show loading indicator
    this.updatingIds.add(application.id);
    this.cdr.detectChanges();
    
    this.compService.updateRemainingDays(application.id).subscribe({
      next: (updatedApp) => {
        console.log(`Updated days for application ${application.id}:`, updatedApp);
        
        // Update the application in our local array
        const index = this.applications.findIndex(a => a.id === updatedApp.id);
        if (index !== -1) {
          this.applications[index] = updatedApp;
        }
        
        // Remove loading indicator
        this.updatingIds.delete(application.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`Error updating days for application ${application.id}:`, err);
        // Remove loading indicator even on error
        this.updatingIds.delete(application.id);
        this.cdr.detectChanges();
      }
    });
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
