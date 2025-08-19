import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dashboard } from '../dashboard/dashboard';
import { UsersService, User, Student, Campus, Level, Course, Role } from '../services/users-service';

interface CombinedUserData {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  type: 'user' | 'student';
  status: string;
  lastLogin?: string;
  additionalInfo?: string;
  originalData: any;
}

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Dashboard],
  templateUrl: './manage-users.html',
  styleUrls: ['./manage-users.css']
})
export class ManageUsers implements OnInit {
  activeTab: 'users' | 'students' | 'campuses' | 'levels' | 'courses' | 'roles' = 'users';

  allUsers: CombinedUserData[] = [];
  allStudents: CombinedUserData[] = [];
  filteredUsers: CombinedUserData[] = [];
  filteredStudents: CombinedUserData[] = [];

  allCampuses: Campus[] = [];
  allLevels: Level[] = [];
  allCourses: Course[] = [];
  allRoles: Role[] = [];

  filteredCampuses: Campus[] = [];
  filteredLevels: Level[] = [];
  filteredCourses: Course[] = [];
  filteredRoles: Role[] = [];

  loading = false;
  error: string | null = null;

  usersSearchTerm = '';
  selectedUserRole = '';
  selectedUserStatus = '';

  studentsSearchTerm = '';
  selectedStudentStatus = '';

  campusesSearchTerm = '';
  levelsSearchTerm = '';
  coursesSearchTerm = '';
  selectedCourseLevel = '';
  selectedCourseCampus = '';
  rolesSearchTerm = '';

  showCampusForm = false;
  showLevelForm = false;
  showCourseForm = false;
  showRoleForm = false;

  campusForm: FormGroup;
  levelForm: FormGroup;
  courseForm: FormGroup;
  roleForm: FormGroup;

  editingCampus: Campus | null = null;
  editingLevel: Level | null = null;
  editingCourse: Course | null = null;
  editingRole: Role | null = null;

  showUserForm = false;
  showUserView = false;
  editingUser: CombinedUserData | null = null;
  userForm: FormGroup;

  campusSubmitting = false;
  levelSubmitting = false;
  courseSubmitting = false;
  roleSubmitting = false;

  constructor(private usersService: UsersService, private fb: FormBuilder) {
    this.campusForm = this.fb.group({ campus_name: ['', [Validators.required, Validators.minLength(2)]] });
    this.levelForm = this.fb.group({ level_name: ['', [Validators.required, Validators.minLength(2)]] });
    this.courseForm = this.fb.group({ course_name: ['', [Validators.required, Validators.minLength(2)]], level_id: ['', Validators.required], campus_id: ['', Validators.required] });
    this.roleForm = this.fb.group({ role_name: ['', [Validators.required, Validators.minLength(2)]] });

    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required]],
      first_name: ['', []],
      middle_name: ['', []],
  last_name: ['', []],
  address: ['', []],
  phone_number: ['', []],
  // default password for new users as requested
  password: ['12345678', []],
      role_id: ['', []]
    });
  }

  ngOnInit() {
    this.testApiConnection();
    this.loadUsersData();
    this.loadCampusesData();
    this.loadLevelsData();
    this.loadCoursesData();
    this.loadRolesData();
  }

  testApiConnection() {
    this.usersService.getUsers().subscribe({ next: () => {}, error: (e) => console.error('Users API error', e) });
    this.usersService.getStudents().subscribe({ next: () => {}, error: (e) => console.error('Students API error', e) });
  }

  loadUsersData() {
    this.loading = true;
    this.usersService.getAllUsersData().subscribe({
      next: (data) => { this.processCombinedData(data); this.loading = false; },
      error: (error) => { this.error = 'Failed to load users data'; this.loading = false; console.error('Error loading users:', error); }
    });
  }

  private processCombinedData(data: { users: User[]; students: Student[] }) {
    this.allUsers = [];
    this.allStudents = [];

    data.users.forEach(user => {
      let roleName = 'user';
      if (typeof user.role === 'object' && user.role !== null) roleName = user.role.role_name || 'user';
      else if (typeof user.role === 'string') roleName = user.role;

      this.allUsers.push({ id: user.id!, name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A', username: user.username || 'N/A', email: user.email || 'N/A', role: roleName, type: 'user', status: user.is_active ? 'Active' : 'Inactive', lastLogin: user.last_login, additionalInfo: user.address || user.phone_number || '', originalData: user });
    });

    data.students.forEach(student => {
      const studentUser = student.user;
      let roleName = 'student';
      if (typeof studentUser.role === 'object' && studentUser.role !== null) roleName = studentUser.role.role_name || 'student';
      else if (typeof studentUser.role === 'string') roleName = studentUser.role;

      this.allStudents.push({ id: student.id!, name: `${studentUser.first_name || ''} ${studentUser.last_name || ''}`.trim() || 'N/A', username: studentUser.username || 'N/A', email: studentUser.email || 'N/A', role: roleName, type: 'student', status: studentUser.is_active ? 'Active' : 'Inactive', lastLogin: studentUser.last_login, additionalInfo: student.course ? `${student.course.course_name} - Year ${student.year_of_study}` : 'No course assigned', originalData: student });
    });

    this.applyUsersFilters();
    this.applyStudentsFilters();
  }

  applyUsersFilters() {
    const term = this.usersSearchTerm.trim().toLowerCase();
    this.filteredUsers = this.allUsers.filter(user => {
      const matchesSearch = !term || user.name.toLowerCase().includes(term) || user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
      const matchesRole = !this.selectedUserRole || user.role.toLowerCase() === this.selectedUserRole.toLowerCase() || user.role.toLowerCase().includes(this.selectedUserRole.toLowerCase());
      const matchesStatus = !this.selectedUserStatus || user.status === this.selectedUserStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  applyStudentsFilters() {
    const term = this.studentsSearchTerm.trim().toLowerCase();
    this.filteredStudents = this.allStudents.filter(student => {
      const matchesSearch = !term || student.name.toLowerCase().includes(term) || student.username.toLowerCase().includes(term) || student.email.toLowerCase().includes(term) || (student.additionalInfo && student.additionalInfo.toLowerCase().includes(term));
      const matchesStatus = !this.selectedStudentStatus || student.status === this.selectedStudentStatus;
      return matchesSearch && matchesStatus;
    });
  }

  onUsersSearchChange(event: any) { this.usersSearchTerm = event.target.value; this.applyUsersFilters(); }
  onUserRoleChange(event: any) { this.selectedUserRole = event.target.value; this.applyUsersFilters(); }
  onUserStatusChange(event: any) { this.selectedUserStatus = event.target.value; this.applyUsersFilters(); }
  onStudentsSearchChange(event: any) { this.studentsSearchTerm = event.target.value; this.applyStudentsFilters(); }
  onStudentStatusChange(event: any) { this.selectedStudentStatus = event.target.value; this.applyStudentsFilters(); }

  setActiveTab(tab: 'users' | 'students' | 'campuses' | 'levels' | 'courses' | 'roles') { this.activeTab = tab; }

  getAddButtonText(): string { switch (this.activeTab) { case 'students': return 'Add Student'; case 'campuses': return 'Add Campus'; case 'levels': return 'Add Level'; case 'courses': return 'Add Course'; case 'roles': return 'Add Role'; default: return 'Add User'; } }

  getUsersCount(): number { return this.allUsers.length; }
  getStudentsCount(): number { return this.allStudents.length; }
  getUniqueUserRoles(): string[] { return [...new Set(this.allUsers.map(u => u.role))].filter(r => r && r !== 'N/A').sort(); }

  // Users actions
  editUser(user: CombinedUserData) {
  this.editingUser = user;
  this.showUserForm = true;
  this.showUserView = false;
  const orig = user.originalData || {};
  // Clear password when editing so we don't accidentally send default password on update
  this.userForm.patchValue({ username: orig.username || '', email: orig.email || '', first_name: orig.first_name || '', middle_name: orig.middle_name || '', last_name: orig.last_name || '', address: orig.address || '', phone_number: orig.phone_number || '', password: '', role_id: (orig.role && orig.role.id) ? orig.role.id : (orig.role_id || '') });
  }

  viewUser(user: CombinedUserData) { this.editingUser = user; this.showUserView = true; this.showUserForm = false; }

  deleteUser(user: CombinedUserData) { if (!confirm(`Are you sure you want to delete ${user.name}?`)) return; this.loading = true; const op = user.type === 'student' ? this.usersService.deleteStudent(user.id) : this.usersService.deleteUser(user.id); op.subscribe({ next: () => { if (user.type === 'student') this.allStudents = this.allStudents.filter(s => s.id !== user.id); else this.allUsers = this.allUsers.filter(u => u.id !== user.id); this.applyUsersFilters(); this.applyStudentsFilters(); this.loading = false; }, error: (e) => { console.error('Delete error', e); this.loading = false; } }); }

  onUserSubmit() {
    if (!this.userForm.valid) return; const form = this.userForm.value; const payload: any = { username: form.username, email: form.email, first_name: form.first_name, middle_name: form.middle_name, last_name: form.last_name, address: form.address, phone_number: form.phone_number }; if (form.password) payload.password = form.password; if (form.role_id) payload.role = form.role_id; this.loading = true;

  if (this.editingUser) {
      if (this.editingUser.type === 'student') {
  const orig = this.editingUser.originalData as Student;
  this.usersService.updateStudent(orig.id!, payload).subscribe({ next: (updated) => { const idx = this.allStudents.findIndex(s => s.id === this.editingUser!.id); if (idx !== -1) { this.allStudents[idx] = { ...this.allStudents[idx], name: `${updated.user?.first_name || payload.first_name || ''} ${updated.user?.last_name || payload.last_name || ''}`.trim() || this.allStudents[idx].name, email: updated.user?.email || payload.email || this.allStudents[idx].email, username: updated.user?.username || payload.username || this.allStudents[idx].username, originalData: { ...this.allStudents[idx].originalData, ...updated } }; this.applyStudentsFilters(); } this.showUserForm = false; this.loading = false; }, error: (e) => { console.error('Update student error', e); this.error = e?.error || 'Update student failed'; this.loading = false; } });
      } else {
  const orig = this.editingUser.originalData as User;
  // If role_id is provided, send as role_id to backend
  if (form.role_id) payload.role_id = form.role_id;
  this.usersService.updateUser(orig.id!, payload).subscribe({ next: (updated) => { const idx = this.allUsers.findIndex(u => u.id === orig.id); if (idx !== -1) { const roleName = (typeof updated.role === 'object' && updated.role) ? (updated.role.role_name || '') : (updated.role || this.allUsers[idx].role); this.allUsers[idx] = { ...this.allUsers[idx], name: `${updated.first_name || payload.first_name || ''} ${updated.last_name || payload.last_name || ''}`.trim() || this.allUsers[idx].name, username: updated.username || this.allUsers[idx].username, email: updated.email || this.allUsers[idx].email, role: roleName, status: updated.is_active ? 'Active' : 'Inactive', lastLogin: updated.last_login || this.allUsers[idx].lastLogin, originalData: { ...this.allUsers[idx].originalData, ...updated } }; this.applyUsersFilters(); } this.showUserForm = false; this.loading = false; }, error: (e) => { console.error('Update user error', e); this.error = e?.error || 'Update user failed'; this.loading = false; } });
      }
    } else {
      // Regular user create: backend expects role_id field for writes
      if (form.role_id) payload.role_id = form.role_id;

      this.usersService.createUser(payload).subscribe({ next: (created) => { const roleName = (typeof created.role === 'object' && created.role) ? (created.role.role_name || '') : (created.role || 'user'); const newEntry: CombinedUserData = { id: created.id!, name: `${created.first_name || ''} ${created.last_name || ''}`.trim() || 'N/A', username: created.username || 'N/A', email: created.email || 'N/A', role: roleName, type: 'user', status: created.is_active ? 'Active' : 'Inactive', lastLogin: created.last_login, additionalInfo: created.address || created.phone_number || '', originalData: created }; this.allUsers.unshift(newEntry); this.applyUsersFilters(); this.showUserForm = false; this.loading = false; }, error: (e) => { console.error('Create user error', e); this.error = e?.error || 'Create user failed'; this.loading = false; } });
    }
  }

  cancelUserForm() { this.showUserForm = false; this.editingUser = null; this.userForm.reset({ password: '12345678' }); }
  closeUserView() { this.showUserView = false; this.editingUser = null; }

  addNewUser() {
    switch (this.activeTab) {
      case 'campuses':
        this.addNewCampus();
        break;
      case 'levels':
        this.addNewLevel();
        break;
      case 'courses':
        this.addNewCourse();
        break;
      case 'students':
        this.editingUser = null;
        this.showUserForm = true;
        // Reset form for create and preserve default password
        this.userForm.reset({ password: '12345678' });
        break;
      default:
        this.editingUser = null;
        this.showUserForm = true;
        this.userForm.reset({ password: '12345678' });
        break;
    }
  }

  formatDate(dateString?: string): string { if (!dateString) return 'Never'; return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  getUserTypeLabel(user: CombinedUserData): string { if (user.type === 'student') return 'Student'; return user.role.charAt(0).toUpperCase() + user.role.slice(1); }
  getUserTypeBadgeClass(user: CombinedUserData): string { if (user.type === 'student') return 'badge bg-info'; switch (user.role.toLowerCase()) { case 'admin': return 'badge bg-danger'; case 'super': return 'badge bg-warning'; default: return 'badge bg-secondary'; } }
  getCourseName(student: CombinedUserData): string { try { if (!student.additionalInfo || student.additionalInfo === '[object Object]') return 'N/A'; const parts = student.additionalInfo.split(' - '); return parts.length > 0 ? parts[0] : 'N/A'; } catch (e) { console.error(e); return 'N/A'; } }
  getYearOfStudy(student: CombinedUserData): string { try { if (!student.additionalInfo || student.additionalInfo === '[object Object]') return 'N/A'; const match = student.additionalInfo.match(/Year (\d+)/); return match ? match[1] : 'N/A'; } catch (e) { console.error(e); return 'N/A'; } }

  // Campuses/levels/courses/roles
  getCampusesCount(): number { return this.allCampuses.length; }
  getLevelsCount(): number { return this.allLevels.length; }
  getCoursesCount(): number { return this.allCourses.length; }
  getRolesCount(): number { return this.allRoles.length; }

  loadCampusesData() { this.loading = true; this.usersService.getCampuses().subscribe({ next: (campuses) => { this.allCampuses = campuses; this.applyCampusesFilters(); this.loading = false; }, error: (e) => { console.error('Error loading campuses', e); this.error = 'Failed to load campuses data'; this.loading = false; } }); }
  loadLevelsData() { this.loading = true; this.usersService.getLevels().subscribe({ next: (levels) => { this.allLevels = levels; this.applyLevelsFilters(); this.loading = false; }, error: (e) => { console.error('Error loading levels', e); this.error = 'Failed to load levels data'; this.loading = false; } }); }
  loadCoursesData() { this.loading = true; this.usersService.getCourses().subscribe({ next: (courses) => { this.allCourses = courses; this.applyCoursesFilters(); this.loading = false; }, error: (e) => { console.error('Error loading courses', e); this.error = 'Failed to load courses data'; this.loading = false; } }); }
  loadRolesData() { this.loading = true; this.usersService.getRoles().subscribe({ next: (roles) => { this.allRoles = roles; this.applyRolesFilters(); this.loading = false; }, error: (e) => { console.error('Error loading roles', e); this.error = 'Failed to load roles data'; this.loading = false; } }); }

  onCampusesSearchChange(e:any){ this.campusesSearchTerm = e.target.value; this.applyCampusesFilters(); }
  applyCampusesFilters(){ this.filteredCampuses = this.allCampuses.filter(c => c.campus_name.toLowerCase().includes(this.campusesSearchTerm.toLowerCase())); }

  onLevelsSearchChange(e:any){ this.levelsSearchTerm = e.target.value; this.applyLevelsFilters(); }
  applyLevelsFilters(){ this.filteredLevels = this.allLevels.filter(l => l.level_name.toLowerCase().includes(this.levelsSearchTerm.toLowerCase())); }

  onCoursesSearchChange(e:any){ this.coursesSearchTerm = e.target.value; this.applyCoursesFilters(); }
  onCourseLevelChange(e:any){ this.selectedCourseLevel = e.target.value; this.applyCoursesFilters(); }
  onCourseCampusChange(e:any){ this.selectedCourseCampus = e.target.value; this.applyCoursesFilters(); }
  applyCoursesFilters(){ this.filteredCourses = this.allCourses.filter(course => { const matchesSearch = course.course_name.toLowerCase().includes(this.coursesSearchTerm.toLowerCase()); const courseLevelId = course.level_id || (course.level && course.level.id); const matchesLevel = !this.selectedCourseLevel || courseLevelId?.toString() === this.selectedCourseLevel; const courseCampusId = course.campus_id || (course.campus && course.campus.id); const matchesCampus = !this.selectedCourseCampus || courseCampusId?.toString() === this.selectedCourseCampus; return matchesSearch && matchesLevel && matchesCampus; }); }

  onRolesSearchChange(e:any){ this.rolesSearchTerm = e.target.value; this.applyRolesFilters(); }
  applyRolesFilters(){ this.filteredRoles = this.allRoles.filter(r => r.role_name.toLowerCase().includes(this.rolesSearchTerm.toLowerCase())); }

  addNewCampus(){ this.showCampusForm = true; this.editingCampus = null; this.campusForm.reset(); }
  editCampus(c:Campus){ this.showCampusForm = true; this.editingCampus = c; this.campusForm.patchValue({ campus_name: c.campus_name }); }
  onCampusSubmit(){ if (!this.campusForm.valid) return; this.campusSubmitting = true; const campusData = this.campusForm.value; const op = this.editingCampus ? this.usersService.updateCampus(this.editingCampus.id!, campusData) : this.usersService.createCampus(campusData); op.subscribe({ next: (campus) => { if (this.editingCampus) { const idx = this.allCampuses.findIndex(x => x.id === this.editingCampus!.id); if (idx !== -1) this.allCampuses[idx] = campus; } else this.allCampuses.push(campus); this.applyCampusesFilters(); this.cancelCampusForm(); this.campusSubmitting = false; }, error: (e) => { console.error('Error saving campus', e); this.campusSubmitting = false; } }); }
  cancelCampusForm(){ this.showCampusForm = false; this.editingCampus = null; this.campusForm.reset(); }
  deleteCampus(c:Campus){ if (!confirm(`Delete ${c.campus_name}?`)) return; this.usersService.deleteCampus(c.id!).subscribe({ next: () => { this.allCampuses = this.allCampuses.filter(x => x.id !== c.id); this.applyCampusesFilters(); }, error: (e) => console.error('Delete campus error', e) }); }

  addNewLevel(){ this.showLevelForm = true; this.editingLevel = null; this.levelForm.reset(); }
  editLevel(l:Level){ this.showLevelForm = true; this.editingLevel = l; this.levelForm.patchValue({ level_name: l.level_name }); }
  onLevelSubmit(){ if (!this.levelForm.valid) return; this.levelSubmitting = true; const levelData = this.levelForm.value; const op = this.editingLevel ? this.usersService.updateLevel(this.editingLevel.id!, levelData) : this.usersService.createLevel(levelData); op.subscribe({ next: (level) => { if (this.editingLevel) { const idx = this.allLevels.findIndex(x => x.id === this.editingLevel!.id); if (idx !== -1) this.allLevels[idx] = level; } else this.allLevels.push(level); this.applyLevelsFilters(); this.cancelLevelForm(); this.levelSubmitting = false; }, error: (e) => { console.error('Error saving level', e); this.levelSubmitting = false; } }); }
  cancelLevelForm(){ this.showLevelForm = false; this.editingLevel = null; this.levelForm.reset(); }
  deleteLevel(l:Level){ if (!confirm(`Delete ${l.level_name}?`)) return; this.usersService.deleteLevel(l.id!).subscribe({ next: () => { this.allLevels = this.allLevels.filter(x => x.id !== l.id); this.applyLevelsFilters(); }, error: (e) => console.error('Delete level error', e) }); }

  addNewCourse(){ this.showCourseForm = true; this.editingCourse = null; this.courseForm.reset(); }
  editCourse(c:Course){ this.showCourseForm = true; this.editingCourse = c; this.courseForm.patchValue({ course_name: c.course_name, level_id: c.level_id, campus_id: c.campus_id }); }
  onCourseSubmit(){ if (!this.courseForm.valid) return; this.courseSubmitting = true; const data = this.courseForm.value; const op = this.editingCourse ? this.usersService.updateCourse(this.editingCourse.id!, data) : this.usersService.createCourse(data); op.subscribe({ next: (course) => { if (this.editingCourse) { const idx = this.allCourses.findIndex(x => x.id === this.editingCourse!.id); if (idx !== -1) this.allCourses[idx] = course; } else this.allCourses.push(course); this.applyCoursesFilters(); this.cancelCourseForm(); this.courseSubmitting = false; }, error: (e) => { console.error('Error saving course', e); this.courseSubmitting = false; } }); }
  cancelCourseForm(){ this.showCourseForm = false; this.editingCourse = null; this.courseForm.reset(); }
  deleteCourse(c:Course){ if (!confirm(`Delete ${c.course_name}?`)) return; this.usersService.deleteCourse(c.id!).subscribe({ next: () => { this.allCourses = this.allCourses.filter(x => x.id !== c.id); this.applyCoursesFilters(); }, error: (e) => console.error('Delete course error', e) }); }

  addNewRole(){ this.showRoleForm = true; this.editingRole = null; this.roleForm.reset(); }
  editRole(r:Role){ this.showRoleForm = true; this.editingRole = r; this.roleForm.patchValue({ role_name: r.role_name }); }
  onRoleSubmit(){ if (!this.roleForm.valid) return; this.roleSubmitting = true; const data = this.roleForm.value; const op = this.editingRole ? this.usersService.updateRole(this.editingRole.id!, data) : this.usersService.createRole(data); op.subscribe({ next: (role) => { if (this.editingRole) { const idx = this.allRoles.findIndex(x => x.id === this.editingRole!.id); if (idx !== -1) this.allRoles[idx] = role; } else this.allRoles.push(role); this.applyRolesFilters(); this.cancelRoleForm(); this.roleSubmitting = false; }, error: (e) => { console.error('Error saving role', e); this.roleSubmitting = false; } }); }
  cancelRoleForm(){ this.showRoleForm = false; this.editingRole = null; this.roleForm.reset(); }
  deleteRole(r:Role){ if (!confirm(`Delete ${r.role_name}?`)) return; this.usersService.deleteRole(r.id!).subscribe({ next: () => { this.allRoles = this.allRoles.filter(x => x.id !== r.id); this.applyRolesFilters(); }, error: (e) => console.error('Delete role error', e) }); }

  getCampusCoursesCount(campusId:number){ return this.allCourses.filter(course => { const coursesCampusId = course.campus_id || (course.campus && course.campus.id); return coursesCampusId === campusId; }).length; }
  getLevelCoursesCount(levelId:number){ return this.allCourses.filter(course => { const coursesLevelId = course.level_id || (course.level && course.level.id); return coursesLevelId === levelId; }).length; }
  getCourseStudentsCount(courseId:number){ return this.allStudents.filter(student => { const orig = student.originalData as Student; const studentsCourseId = orig.course_id || (orig.course && orig.course.id); return studentsCourseId === courseId; }).length; }
}
