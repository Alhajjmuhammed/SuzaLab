import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [Dashboard,CommonModule],
  templateUrl: './courses.html',
  styleUrl: './courses.css'
})
export class Courses {

}
