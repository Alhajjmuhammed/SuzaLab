import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Dashboard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
