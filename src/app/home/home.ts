import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Dashboard],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {

}
