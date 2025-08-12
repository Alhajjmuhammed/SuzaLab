import { Routes } from '@angular/router';
import { Login } from './login/login';
import { PageNotFound } from './page-not-found/page-not-found';
import { Home } from './home/home';
import { Components } from './components/components';
import { Programs } from './programs/programs';
import { Courses } from './courses/courses';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'login', component: Login },
    { path: 'home', component: Home, canActivate: [AuthGuard] },
    { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
    { path: 'components', component: Components, canActivate: [AuthGuard] },
    { path: 'programs', component: Programs, canActivate: [AuthGuard] },
    { path: 'courses', component: Courses, canActivate: [AuthGuard] },
    { path: '**', component: PageNotFound }
];
