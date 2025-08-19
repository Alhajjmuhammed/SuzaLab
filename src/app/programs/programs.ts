import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [Dashboard, CommonModule],
  templateUrl: './programs.html',
  styleUrls: ['./programs.css']
})
export class Programs {

}
