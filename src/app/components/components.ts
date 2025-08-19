import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-components',
  standalone: true,
  imports: [Dashboard, CommonModule],
  templateUrl: './components.html',
  styleUrls: ['./components.css']
})
export class Components {

}
