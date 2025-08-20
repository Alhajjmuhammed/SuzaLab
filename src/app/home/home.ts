import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';
import { CompService } from '../services/comp-service';
import { Auth } from '../services/auth';
import { ComponentApplication } from '../models/component.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Dashboard], // CommonModule provides NgIf directive
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  applications: ComponentApplication[] = [];
  loading = true;

  constructor(
    private compService: CompService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading = true;
    this.compService.getApplications().subscribe({
      next: (applications) => {
        // Filter applications for current student only
        const currentUser = this.auth.getUser();
        if (currentUser?.profile?.id) {
          // Filter by student_id matching the current user's profile (student) ID
          this.applications = applications.filter(app => 
            app.student?.id === currentUser.profile.id
          );
        } else {
          this.applications = [];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading applications:', err);
        this.applications = [];
        this.loading = false;
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

  // Helper method to check if user is student
  isStudent(): boolean {
    return this.auth.getUser()?.role === 'Student';
  }
}
