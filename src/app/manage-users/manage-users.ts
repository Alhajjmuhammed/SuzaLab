import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dashboard } from '../dashboard/dashboard';
import { UsersService, User, Student, Campus, Level, Course, Role } from '../services/users-service';
import { environment } from '../../environments/environment';

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
  originalData: User | Student;
}

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Dashboard],
  templateUrl: './manage-users.html',
  styleUrls: ['./manage-users.css']
})
export class ManageUsers implements OnInit {
  // Active tab tracking
  activeTab: 'users' | 'students' | 'campuses' | 'levels' | 'courses' | 'roles' = 'users';
  
  // All data for existing tabs
  allUsers: CombinedUserData[] = [];
  allStudents: CombinedUserData[] = [];
  
  // Filtered data for each tab
  filteredUsers: CombinedUserData[] = [];
  filteredStudents: CombinedUserData[] = [];

  // New data for the additional tabs
  allCampuses: Campus[] = [];
  allLevels: Level[] = [];
  allCourses: Course[] = [];
  allRoles: Role[] = [];
  
  // Filtered data for new tabs
  filteredCampuses: Campus[] = [];
  filteredLevels: Level[] = [];
  filteredCourses: Course[] = [];
  filteredRoles: Role[] = [];
  
  loading = false;
  error: string | null = null;

  // Filter properties for Users tab
  usersSearchTerm = '';
  selectedUserRole = '';
  selectedUserStatus = '';

  // Filter properties for Students tab
  studentsSearchTerm = '';
  selectedStudentStatus = '';

  // Filter properties for new tabs
  campusesSearchTerm = '';
  levelsSearchTerm = '';
  coursesSearchTerm = '';
  selectedCourseLevel = '';
  selectedCourseCampus = '';
  rolesSearchTerm = '';

  // Form states for new entities
  showCampusForm = false;
  showLevelForm = false;
  showCourseForm = false;
  showRoleForm = false;
  
  // Forms for new entities
  campusForm: FormGroup;
  levelForm: FormGroup;
  courseForm: FormGroup;
  roleForm: FormGroup;
  
  // Edit states
  editingCampus: Campus | null = null;
  editingLevel: Level | null = null;
  editingCourse: Course | null = null;
  editingRole: Role | null = null;
  
  // Submission states
  campusSubmitting = false;
  levelSubmitting = false;
  courseSubmitting = false;
  roleSubmitting = false;

  constructor(
    private usersService: UsersService,
    private fb: FormBuilder
  ) {
    // Initialize reactive forms
    this.campusForm = this.fb.group({
      campus_name: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.levelForm = this.fb.group({
      level_name: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.courseForm = this.fb.group({
      course_name: ['', [Validators.required, Validators.minLength(2)]],
      level_id: ['', [Validators.required]],
      campus_id: ['', [Validators.required]]
    });

    this.roleForm = this.fb.group({
      role_name: ['', [Validators.required, Validators.minLength(2)]]
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

  loadUsersData() {
    this.loading = true;
    this.error = null;

    this.usersService.getAllUsersData().subscribe({
      next: (data) => {
        this.processCombinedData(data);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users data';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  private processCombinedData(data: {users: User[], students: Student[]}) {
    this.allUsers = [];
    this.allStudents = [];

    // Process regular users (admin/super)
    data.users.forEach(user => {
      
      // Handle role - it might be an object or string
      let roleName = 'user';
      if (typeof user.role === 'object' && user.role !== null) {
        roleName = user.role.role_name || 'user';
      } else if (typeof user.role === 'string') {
        roleName = user.role;
      }

      this.allUsers.push({
        id: user.id!,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
        username: user.username || 'N/A',
        email: user.email || 'N/A',
        role: roleName,
        type: 'user',
        status: user.is_active ? 'Active' : 'Inactive',
        lastLogin: user.last_login,
        additionalInfo: user.address || user.phone_number || user.user_type || '',
        originalData: user
      });
    });

    // Process students (they also have user data)
    data.students.forEach(student => {
      const studentUser = student.user;
      
      // Handle role for student user
      let roleName = 'student';
      if (typeof studentUser.role === 'object' && studentUser.role !== null) {
        roleName = studentUser.role.role_name || 'student';
      } else if (typeof studentUser.role === 'string') {
        roleName = studentUser.role;
      }

      this.allStudents.push({
        id: student.id!,
        name: `${studentUser.first_name || ''} ${studentUser.last_name || ''}`.trim() || 'N/A',
        username: studentUser.username || 'N/A',
        email: studentUser.email || 'N/A',
        role: roleName,
        type: 'student',
        status: studentUser.is_active ? 'Active' : 'Inactive',
        lastLogin: studentUser.last_login,
        additionalInfo: student.course ? `${student.course.course_name} - Year ${student.year_of_study}` : 'No course assigned',
        originalData: student
      });
    });

    this.applyUsersFilters();
    this.applyStudentsFilters();
  }

  // Users tab filtering
  applyUsersFilters() {
    this.filteredUsers = this.allUsers.filter(user => {
      const matchesSearch = !this.usersSearchTerm || 
        user.name.toLowerCase().includes(this.usersSearchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(this.usersSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.usersSearchTerm.toLowerCase());

      // Make role comparison case-insensitive and handle potential variations
      const matchesRole = !this.selectedUserRole || 
        user.role.toLowerCase() === this.selectedUserRole.toLowerCase() ||
        user.role.toLowerCase().includes(this.selectedUserRole.toLowerCase());
        
      const matchesStatus = !this.selectedUserStatus || user.status === this.selectedUserStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // Students tab filtering
  applyStudentsFilters() {
    this.filteredStudents = this.allStudents.filter(student => {
      const matchesSearch = !this.studentsSearchTerm || 
        student.name.toLowerCase().includes(this.studentsSearchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(this.studentsSearchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(this.studentsSearchTerm.toLowerCase()) ||
        (student.additionalInfo && student.additionalInfo.toLowerCase().includes(this.studentsSearchTerm.toLowerCase()));

      const matchesStatus = !this.selectedStudentStatus || student.status === this.selectedStudentStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Users tab event handlers
  onUsersSearchChange(event: any) {
    this.usersSearchTerm = event.target.value;
    this.applyUsersFilters();
  }

  onUserRoleChange(event: any) {
    this.selectedUserRole = event.target.value;
    this.applyUsersFilters();
  }

  onUserStatusChange(event: any) {
    this.selectedUserStatus = event.target.value;
    this.applyUsersFilters();
  }

  // Students tab event handlers
  onStudentsSearchChange(event: any) {
    this.studentsSearchTerm = event.target.value;
    this.applyStudentsFilters();
  }

  onStudentStatusChange(event: any) {
    this.selectedStudentStatus = event.target.value;
    this.applyStudentsFilters();
  }

  setActiveTab(tab: 'users' | 'students' | 'campuses' | 'levels' | 'courses' | 'roles') {
    this.activeTab = tab;
    // All data is loaded immediately on component init - no lazy loading
  }

  getAddButtonText(): string {
    switch(this.activeTab) {
      case 'students': return 'Add Student';
      case 'campuses': return 'Add Campus';
      case 'levels': return 'Add Level';
      case 'courses': return 'Add Course';
      case 'roles': return 'Add Role';
      default: return 'Add User';
    }
  }

  // Count methods for tab labels
  getUsersCount(): number {
    return this.allUsers.length;
  }

  getStudentsCount(): number {
    return this.allStudents.length;
  }

  // Get unique roles from actual user data
  getUniqueUserRoles(): string[] {
    const roles = this.allUsers.map(user => user.role);
    return [...new Set(roles)].filter(role => role && role !== 'N/A').sort();
  }

  // Action methods
  editUser(user: CombinedUserData) {
    // TODO: Implement edit functionality
  }

  viewUser(user: CombinedUserData) {
    // TODO: Implement view functionality
  }

  deleteUser(user: CombinedUserData) {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.loading = true;
      
      if (user.type === 'student') {
        this.usersService.deleteStudent(user.id).subscribe({
          next: () => {
            this.loadUsersData();
          },
          error: (error) => {
            this.error = 'Failed to delete student';
            this.loading = false;
            console.error('Error deleting student:', error);
          }
        });
      } else {
        this.usersService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsersData();
          },
          error: (error) => {
            this.error = 'Failed to delete user';
            this.loading = false;
            console.error('Error deleting user:', error);
          }
        });
      }
    }
  }

  addNewUser() {
    switch(this.activeTab) {
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
        // TODO: Implement add student functionality
        break;
      default:
        // TODO: Implement add user functionality
        break;
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  getUserTypeLabel(user: CombinedUserData): string {
    if (user.type === 'student') {
      return 'Student';
    }
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  }

  getUserTypeBadgeClass(user: CombinedUserData): string {
    if (user.type === 'student') {
      return 'badge bg-info';
    }
    switch (user.role.toLowerCase()) {
      case 'admin':
        return 'badge bg-danger';
      case 'super':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  // Helper methods for safe string extraction
  getCourseName(student: CombinedUserData): string {
    try {
      if (!student.additionalInfo || student.additionalInfo === '[object Object]') return 'N/A';
      const parts = student.additionalInfo.split(' - ');
      return parts.length > 0 ? parts[0] : 'N/A';
    } catch (error) {
      console.error('Error extracting course name:', error);
      return 'N/A';
    }
  }

  getYearOfStudy(student: CombinedUserData): string {
    try {
      if (!student.additionalInfo || student.additionalInfo === '[object Object]') return 'N/A';
      const match = student.additionalInfo.match(/Year (\d+)/);
      return match ? match[1] : 'N/A';
    } catch (error) {
      console.error('Error extracting year of study:', error);
      return 'N/A';
    }
  }

  // Check if API is reachable
  testApiConnection() {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        // API connection successful
      },
      error: (error) => {
        console.error('❌ Users API error:', error);
      }
    });

    this.usersService.getStudents().subscribe({
      next: (students) => {
        // API connection successful
      },
      error: (error) => {
        console.error('❌ Students API error:', error);
      }
    });
  }

  // ==================== NEW TAB COUNT METHODS ====================
  
  getCampusesCount(): number {
    return this.allCampuses.length;
  }

  getLevelsCount(): number {
    return this.allLevels.length;
  }

  getCoursesCount(): number {
    return this.allCourses.length;
  }

  getRolesCount(): number {
    return this.allRoles.length;
  }

  // ==================== NEW TAB DATA LOADING METHODS ====================
  
  loadCampusesData() {
    this.loading = true;
    this.usersService.getCampuses().subscribe({
      next: (campuses) => {
        this.allCampuses = campuses;
        this.applyCampusesFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading campuses:', error);
        this.error = 'Failed to load campuses data';
        this.loading = false;
      }
    });
  }

  loadLevelsData() {
    this.loading = true;
    this.usersService.getLevels().subscribe({
      next: (levels) => {
        this.allLevels = levels;
        this.applyLevelsFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading levels:', error);
        this.error = 'Failed to load levels data';
        this.loading = false;
      }
    });
  }

  loadCoursesData() {
    this.loading = true;
    this.usersService.getCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;
        this.applyCoursesFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.error = 'Failed to load courses data';
        this.loading = false;
      }
    });
  }

  loadRolesData() {
    this.loading = true;
    this.usersService.getRoles().subscribe({
      next: (roles) => {
        this.allRoles = roles;
        this.applyRolesFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.error = 'Failed to load roles data';
        this.loading = false;
      }
    });
  }

  // ==================== NEW TAB FILTER METHODS ====================
  
  onCampusesSearchChange(event: any) {
    this.campusesSearchTerm = event.target.value;
    this.applyCampusesFilters();
  }

  applyCampusesFilters() {
    this.filteredCampuses = this.allCampuses.filter(campus => {
      const matchesSearch = campus.campus_name.toLowerCase().includes(this.campusesSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  onLevelsSearchChange(event: any) {
    this.levelsSearchTerm = event.target.value;
    this.applyLevelsFilters();
  }

  applyLevelsFilters() {
    this.filteredLevels = this.allLevels.filter(level => {
      const matchesSearch = level.level_name.toLowerCase().includes(this.levelsSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  onCoursesSearchChange(event: any) {
    this.coursesSearchTerm = event.target.value;
    this.applyCoursesFilters();
  }

  onCourseLevelChange(event: any) {
    this.selectedCourseLevel = event.target.value;
    this.applyCoursesFilters();
  }

  onCourseCampusChange(event: any) {
    this.selectedCourseCampus = event.target.value;
    this.applyCoursesFilters();
  }

  applyCoursesFilters() {
    this.filteredCourses = this.allCourses.filter(course => {
      const matchesSearch = course.course_name.toLowerCase().includes(this.coursesSearchTerm.toLowerCase());
      
      // Handle both direct level_id and nested level.id
      const courseLevelId = course.level_id || (course.level && course.level.id);
      const matchesLevel = !this.selectedCourseLevel || courseLevelId?.toString() === this.selectedCourseLevel;
      
      // Handle both direct campus_id and nested campus.id
      const courseCampusId = course.campus_id || (course.campus && course.campus.id);
      const matchesCampus = !this.selectedCourseCampus || courseCampusId?.toString() === this.selectedCourseCampus;
      
      return matchesSearch && matchesLevel && matchesCampus;
    });
  }

  onRolesSearchChange(event: any) {
    this.rolesSearchTerm = event.target.value;
    this.applyRolesFilters();
  }

  applyRolesFilters() {
    this.filteredRoles = this.allRoles.filter(role => {
      const matchesSearch = role.role_name.toLowerCase().includes(this.rolesSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  // ==================== CAMPUS CRUD METHODS ====================
  
  addNewCampus() {
    this.showCampusForm = true;
    this.editingCampus = null;
    this.campusForm.reset();
  }

  editCampus(campus: Campus) {
    this.showCampusForm = true;
    this.editingCampus = campus;
    this.campusForm.patchValue({
      campus_name: campus.campus_name
    });
  }

  onCampusSubmit() {
    if (this.campusForm.valid) {
      this.campusSubmitting = true;
      const campusData = this.campusForm.value;

      const operation = this.editingCampus 
        ? this.usersService.updateCampus(this.editingCampus.id!, campusData)
        : this.usersService.createCampus(campusData);

      operation.subscribe({
        next: (campus) => {
          if (this.editingCampus) {
            const index = this.allCampuses.findIndex(c => c.id === this.editingCampus!.id);
            if (index !== -1) this.allCampuses[index] = campus;
          } else {
            this.allCampuses.push(campus);
          }
          this.applyCampusesFilters();
          this.cancelCampusForm();
          this.campusSubmitting = false;
        },
        error: (error) => {
          console.error('Error saving campus:', error);
          this.campusSubmitting = false;
        }
      });
    }
  }

  cancelCampusForm() {
    this.showCampusForm = false;
    this.editingCampus = null;
    this.campusForm.reset();
  }

  deleteCampus(campus: Campus) {
    if (confirm(`Are you sure you want to delete ${campus.campus_name}?`)) {
      this.usersService.deleteCampus(campus.id!).subscribe({
        next: () => {
          this.allCampuses = this.allCampuses.filter(c => c.id !== campus.id);
          this.applyCampusesFilters();
        },
        error: (error) => {
          console.error('Error deleting campus:', error);
        }
      });
    }
  }

  // ==================== LEVEL CRUD METHODS ====================
  
  addNewLevel() {
    this.showLevelForm = true;
    this.editingLevel = null;
    this.levelForm.reset();
  }

  editLevel(level: Level) {
    this.showLevelForm = true;
    this.editingLevel = level;
    this.levelForm.patchValue({
      level_name: level.level_name
    });
  }

  onLevelSubmit() {
    if (this.levelForm.valid) {
      this.levelSubmitting = true;
      const levelData = this.levelForm.value;

      const operation = this.editingLevel 
        ? this.usersService.updateLevel(this.editingLevel.id!, levelData)
        : this.usersService.createLevel(levelData);

      operation.subscribe({
        next: (level) => {
          if (this.editingLevel) {
            const index = this.allLevels.findIndex(l => l.id === this.editingLevel!.id);
            if (index !== -1) this.allLevels[index] = level;
          } else {
            this.allLevels.push(level);
          }
          this.applyLevelsFilters();
          this.cancelLevelForm();
          this.levelSubmitting = false;
        },
        error: (error) => {
          console.error('Error saving level:', error);
          this.levelSubmitting = false;
        }
      });
    }
  }

  cancelLevelForm() {
    this.showLevelForm = false;
    this.editingLevel = null;
    this.levelForm.reset();
  }

  deleteLevel(level: Level) {
    if (confirm(`Are you sure you want to delete ${level.level_name}?`)) {
      this.usersService.deleteLevel(level.id!).subscribe({
        next: () => {
          this.allLevels = this.allLevels.filter(l => l.id !== level.id);
          this.applyLevelsFilters();
        },
        error: (error) => {
          console.error('Error deleting level:', error);
        }
      });
    }
  }

  // ==================== COURSE CRUD METHODS ====================
  
  addNewCourse() {
    this.showCourseForm = true;
    this.editingCourse = null;
    this.courseForm.reset();
    
    // All reference data is already loaded on component init
  }

  editCourse(course: Course) {
    this.showCourseForm = true;
    this.editingCourse = course;
    this.courseForm.patchValue({
      course_name: course.course_name,
      level_id: course.level_id,
      campus_id: course.campus_id
    });
  }

  onCourseSubmit() {
    if (this.courseForm.valid) {
      this.courseSubmitting = true;
      const courseData = this.courseForm.value;

      const operation = this.editingCourse 
        ? this.usersService.updateCourse(this.editingCourse.id!, courseData)
        : this.usersService.createCourse(courseData);

      operation.subscribe({
        next: (course) => {
          if (this.editingCourse) {
            const index = this.allCourses.findIndex(c => c.id === this.editingCourse!.id);
            if (index !== -1) this.allCourses[index] = course;
          } else {
            this.allCourses.push(course);
          }
          this.applyCoursesFilters();
          this.cancelCourseForm();
          this.courseSubmitting = false;
        },
        error: (error) => {
          console.error('Error saving course:', error);
          this.courseSubmitting = false;
        }
      });
    }
  }

  cancelCourseForm() {
    this.showCourseForm = false;
    this.editingCourse = null;
    this.courseForm.reset();
  }

  deleteCourse(course: Course) {
    if (confirm(`Are you sure you want to delete ${course.course_name}?`)) {
      this.usersService.deleteCourse(course.id!).subscribe({
        next: () => {
          this.allCourses = this.allCourses.filter(c => c.id !== course.id);
          this.applyCoursesFilters();
        },
        error: (error) => {
          console.error('Error deleting course:', error);
        }
      });
    }
  }

  // ==================== ROLE CRUD METHODS ====================
  
  addNewRole() {
    this.showRoleForm = true;
    this.editingRole = null;
    this.roleForm.reset();
  }

  editRole(role: Role) {
    this.showRoleForm = true;
    this.editingRole = role;
    this.roleForm.patchValue({
      role_name: role.role_name
    });
  }

  onRoleSubmit() {
    if (this.roleForm.valid) {
      this.roleSubmitting = true;
      const roleData = this.roleForm.value;

      const operation = this.editingRole 
        ? this.usersService.updateRole(this.editingRole.id!, roleData)
        : this.usersService.createRole(roleData);

      operation.subscribe({
        next: (role) => {
          if (this.editingRole) {
            const index = this.allRoles.findIndex(r => r.id === this.editingRole!.id);
            if (index !== -1) this.allRoles[index] = role;
          } else {
            this.allRoles.push(role);
          }
          this.applyRolesFilters();
          this.cancelRoleForm();
          this.roleSubmitting = false;
        },
        error: (error) => {
          console.error('Error saving role:', error);
          this.roleSubmitting = false;
        }
      });
    }
  }

  cancelRoleForm() {
    this.showRoleForm = false;
    this.editingRole = null;
    this.roleForm.reset();
  }

  deleteRole(role: Role) {
    if (confirm(`Are you sure you want to delete ${role.role_name}?`)) {
      this.usersService.deleteRole(role.id!).subscribe({
        next: () => {
          this.allRoles = this.allRoles.filter(r => r.id !== role.id);
          this.applyRolesFilters();
        },
        error: (error) => {
          console.error('Error deleting role:', error);
        }
      });
    }
  }

  // ==================== HELPER METHODS FOR COUNTS ====================
  
  getCampusCoursesCount(campusId: number): number {
    return this.allCourses.filter(course => {
      // Handle both direct campus_id and nested campus.id
      const coursesCampusId = course.campus_id || (course.campus && course.campus.id);
      return coursesCampusId === campusId;
    }).length;
  }

  getLevelCoursesCount(levelId: number): number {
    return this.allCourses.filter(course => {
      // Handle both direct level_id and nested level.id
      const coursesLevelId = course.level_id || (course.level && course.level.id);
      return coursesLevelId === levelId;
    }).length;
  }

  getCourseStudentsCount(courseId: number): number {
    return this.allStudents.filter(student => {
      const originalStudent = student.originalData as Student;
      // Handle both direct course_id and nested course.id
      const studentsCourseId = originalStudent.course_id || (originalStudent.course && originalStudent.course.id);
      return studentsCourseId === courseId;
    }).length;
  }
}
