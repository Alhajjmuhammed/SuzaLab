import { Component, OnInit, OnDestroy, AfterViewInit, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  // Component properties
  isCollapsed = false;
  isProfilePanelOpen = false;
  isUserDropdownOpen = false;
  private resizeListener?: () => void;
  private clickListener?: (event: Event) => void;
  private keydownListener?: (event: KeyboardEvent) => void;
  private isBrowser: boolean;
  
  // User properties
  currentUser: any = null;

  @ViewChild('userDropdownMenu', { static: false }) userDropdownMenu!: ElementRef;
  @ViewChild('userDropdownToggle', { static: false }) userDropdownToggle!: ElementRef;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: Auth
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Helper methods for template
  hasAdminPrivileges(): boolean {
    return this.authService.hasAdminPrivileges();
  }

  isStudent(): boolean {
    return this.authService.isStudent();
  }

  getUserRole(): string {
    return this.authService.getUserRole();
  }

  ngOnInit(): void {
    // Get current user information
    this.currentUser = this.authService.getUser();
    
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Component initialization - only run in browser
    if (this.isBrowser) {
      this.setupEventListeners();
    }
  }

  ngAfterViewInit(): void {
    // Initialize UI after view is ready - only in browser
    if (this.isBrowser) {
      this.initializeUI();
    }
  }

  ngOnDestroy(): void {
    // Cleanup event listeners - only in browser
    if (this.isBrowser) {
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener);
      }
      if (this.clickListener) {
        document.removeEventListener('click', this.clickListener);
      }
      if (this.keydownListener) {
        document.removeEventListener('keydown', this.keydownListener);
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.isBrowser) return;
    
    // User dropdown functionality
    this.setupUserDropdown();
    
    // Search functionality
    this.setupSearch();
    
    // Window resize handling
    this.resizeListener = () => this.handleWindowResize();
    window.addEventListener('resize', this.resizeListener);
    
    // Touch gestures for mobile sidebar
    this.setupTouchGestures();
    
    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private initializeUI(): void {
    if (!this.isBrowser) return;
    
    // Set initial UI state
    this.handleWindowResize();
    
    // Create overlay element for mobile sidebar
    this.createSidebarOverlay();
  }

  // Create sidebar overlay element
  private createSidebarOverlay(): void {
    if (!this.isBrowser) return;
    
    // Overlay is now in HTML template, just ensure it has proper event handling
    const overlay = document.querySelector('.sidebar-overlay') as HTMLElement;
    if (overlay) {
      // Additional click handler for programmatic clicks
      overlay.addEventListener('click', (e) => {
        console.log('Overlay clicked via addEventListener'); // Debug log
        e.preventDefault();
        e.stopPropagation();
        this.closeSidebarOnMobile();
      });
    }
  }

  // Close sidebar when clicking overlay (mobile)
  closeSidebarOnMobile(): void {
    if (!this.isBrowser) return;
    
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 991 && sidebar && sidebar.classList.contains('active')) {
      console.log('Closing sidebar via overlay click'); // Debug log
      this.toggleSidebar();
    }
  }

  // Sidebar toggle functionality
  toggleSidebar(): void {
    if (!this.isBrowser) return;
    
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    
    if (!sidebar || !mainContent) return;

    const windowWidth = window.innerWidth;

    if (windowWidth <= 991) {
      // Mobile and tablet: slide sidebar in/out
      sidebar.classList.toggle("active");
      
      // Get overlay element
      const overlay = document.querySelector('.sidebar-overlay') as HTMLElement;
      
      if (overlay) {
        if (sidebar.classList.contains('active')) {
          overlay.classList.add('active');
          // Prevent body scroll when sidebar is open on mobile
          document.body.style.overflow = 'hidden';
          console.log('Sidebar opened, overlay activated'); // Debug log
        } else {
          overlay.classList.remove('active');
          // Restore body scroll
          document.body.style.overflow = '';
          console.log('Sidebar closed, overlay deactivated'); // Debug log
        }
      }
    } else {
      // Desktop: collapse/expand sidebar
      sidebar.classList.toggle("collapsed");
      mainContent.classList.toggle("expanded");
      this.isCollapsed = sidebar.classList.contains("collapsed");
    }
  }

  // Adjust topbar layout based on screen size
  private adjustTopbarLayout(windowWidth: number): void {
    const topbar = document.querySelector('.topbar') as HTMLElement;
    const searchBox = document.querySelector('.search-box') as HTMLElement;
    const topbarTitle = document.querySelector('.topbar h1') as HTMLElement;
    const topbarRight = document.querySelector('.topbar-right') as HTMLElement;
    const topbarBtn = document.querySelector('.topbar .btn') as HTMLElement;
    
    if (!topbar) return;

    if (windowWidth <= 767) {
      // Show search-only topbar on small devices
      topbar.style.display = 'flex';
      topbar.style.justifyContent = 'center';
      topbar.style.alignItems = 'center';
      topbar.style.flexDirection = 'row';
      topbar.style.gap = '0';
      
      // Hide other elements
      if (topbarBtn) topbarBtn.style.display = 'none';
      if (topbarTitle) topbarTitle.style.display = 'none';
      if (topbarRight) topbarRight.style.display = 'none';
      
      // Show and style search box
      if (searchBox) {
        searchBox.style.display = 'flex';
        searchBox.style.width = '100%';
        searchBox.style.maxWidth = windowWidth <= 575 ? 'none' : '400px';
        searchBox.style.margin = '0';
      }
    } else if (windowWidth <= 991) {
      // Show full topbar on tablets
      topbar.style.display = 'flex';
      topbar.style.flexDirection = 'row';
      topbar.style.flexWrap = 'wrap';
      topbar.style.gap = '8px';
      topbar.style.justifyContent = 'space-between';
      
      // Show all elements
      if (topbarBtn) topbarBtn.style.display = 'block';
      if (topbarTitle) {
        topbarTitle.style.display = 'block';
        topbarTitle.style.fontSize = '1.6rem';
      }
      if (topbarRight) topbarRight.style.display = 'flex';
      if (searchBox) {
        searchBox.style.display = 'flex';
        searchBox.style.width = 'auto';
        searchBox.style.maxWidth = '280px';
      }
    } else {
      // Medium and large devices - normal layout
      topbar.style.display = 'flex';
      topbar.style.flexDirection = 'row';
      topbar.style.flexWrap = 'wrap';
      topbar.style.gap = '';
      topbar.style.justifyContent = 'space-between';
      
      // Reset all styles
      if (topbarTitle) topbarTitle.style.fontSize = '';
      if (searchBox) {
        searchBox.style.order = '';
        searchBox.style.width = '';
        searchBox.style.maxWidth = '';
        searchBox.style.margin = '';
      }
      if (topbarTitle) topbarTitle.style.order = '';
      if (topbarRight) topbarRight.style.order = '';
      if (topbarBtn) topbarBtn.style.display = '';
      if (topbarTitle) topbarTitle.style.display = '';
      if (topbarRight) topbarRight.style.display = '';
    }
  }

  // User dropdown functionality
  private setupUserDropdown(): void {
    if (!this.isBrowser) return;
    
    // Close dropdown when clicking outside
    this.clickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown') && this.isUserDropdownOpen) {
        this.closeAllDropdowns();
      }
    };
    document.addEventListener('click', this.clickListener);

    // Close dropdown when pressing Escape key
    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isUserDropdownOpen) {
        this.closeAllDropdowns();
      }
    };
    document.addEventListener('keydown', this.keydownListener);
  }

  // Helper function to close all dropdowns
  private closeAllDropdowns(): void {
    this.isUserDropdownOpen = false;
    
    if (this.isBrowser && this.userDropdownMenu && this.userDropdownToggle) {
      const dropdownMenu = this.userDropdownMenu.nativeElement;
      const dropdownToggle = this.userDropdownToggle.nativeElement;
      const chevronIcon = dropdownToggle.querySelector('.fa-chevron-down') as HTMLElement;
      
      dropdownMenu.classList.remove('show');
      dropdownToggle.setAttribute('aria-expanded', 'false');
      if (chevronIcon) {
        chevronIcon.style.transform = 'rotate(0deg)';
      }
    }
  }

  // Toggle user dropdown
  toggleUserDropdown(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    
    if (this.isBrowser && this.userDropdownMenu && this.userDropdownToggle) {
      const dropdownMenu = this.userDropdownMenu.nativeElement;
      const dropdownToggle = this.userDropdownToggle.nativeElement;
      const chevronIcon = dropdownToggle.querySelector('.fa-chevron-down') as HTMLElement;
      
      if (this.isUserDropdownOpen) {
        // Open dropdown
        dropdownMenu.classList.add('show');
        dropdownToggle.setAttribute('aria-expanded', 'true');
        if (chevronIcon) {
          chevronIcon.style.transform = 'rotate(180deg)';
        }
      } else {
        // Close dropdown
        dropdownMenu.classList.remove('show');
        dropdownToggle.setAttribute('aria-expanded', 'false');
        if (chevronIcon) {
          chevronIcon.style.transform = 'rotate(0deg)';
        }
      }
    }
  }

  // Search functionality
  private setupSearch(): void {
    if (!this.isBrowser) return;
    
    const searchInput = document.querySelector('.search-box input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const searchTerm = target.value.toLowerCase();
        // Search functionality can be implemented here
        console.log('Searching for:', searchTerm);
      });
    }
  }

  // Handle window resize
  private handleWindowResize(): void {
    if (!this.isBrowser) return;
    
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.querySelector('.sidebar-overlay') as HTMLElement;
    
    if (!sidebar || !mainContent) return;
    
    // Get current window width
    const windowWidth = window.innerWidth;
    
    // Remove any existing classes first
    sidebar.classList.remove('active');
    if (overlay) {
      overlay.classList.remove('active');
    }

    if (windowWidth <= 575) {
      // Extra small devices (phones) - full width sidebar
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('expanded');
      // Hide sidebar by default on mobile
    } else if (windowWidth <= 767) {
      // Small devices (landscape phones) - overlay sidebar
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('expanded');
    } else if (windowWidth <= 991) {
      // Medium devices (tablets) - normal sidebar
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('expanded');
    } else {
      // Large devices and up (desktops) - collapsible sidebar
      if (this.isCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
      } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
      }
    }
    
    // Adjust topbar layout based on screen size
    this.adjustTopbarLayout(windowWidth);
  }

  // Notification system
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Touch gestures for mobile sidebar
  private setupTouchGestures(): void {
    if (!this.isBrowser) return;
    
    // Add global click listener for closing sidebar on mobile
    document.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const sidebar = document.getElementById('sidebar');
      
      // Only handle clicks on mobile/tablet devices
      if (window.innerWidth <= 991 && sidebar && sidebar.classList.contains('active')) {
        // Check if click is on toggle button (anywhere in the button)
        const isToggleButton = target.closest('.menu-toggle-btn') !== null;
        
        // Check if click is on sidebar or any element inside sidebar
        const isSidebarClick = target.closest('#sidebar') !== null || target.id === 'sidebar';
        
        // If click is NOT on toggle button and NOT on sidebar, close the sidebar
        if (!isToggleButton && !isSidebarClick) {
          console.log('Closing sidebar - clicked outside'); // Debug log
          this.toggleSidebar();
        }
      }
    }, { passive: true });

    // Enhanced touch gestures for mobile devices
    if (window.innerWidth <= 991) {
      const mainContent = document.getElementById('mainContent');
      const sidebar = document.getElementById('sidebar');
      
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      
      if (mainContent) {
        mainContent.addEventListener('touchstart', (e: TouchEvent) => {
          startX = e.touches[0].clientX;
          isDragging = true;
        }, { passive: true });
        
        mainContent.addEventListener('touchmove', (e: TouchEvent) => {
          if (!isDragging) return;
          currentX = e.touches[0].clientX;
          const diffX = currentX - startX;
          
          // If swiping right from left edge (open sidebar)
          if (startX < 20 && diffX > 50) {
            if (sidebar && !sidebar.classList.contains('active')) {
              this.toggleSidebar();
              isDragging = false;
            }
          }
        }, { passive: true });
        
        mainContent.addEventListener('touchend', () => {
          isDragging = false;
        }, { passive: true });
      }
      
      // Swipe left to close sidebar
      if (sidebar) {
        sidebar.addEventListener('touchstart', (e: TouchEvent) => {
          startX = e.touches[0].clientX;
          isDragging = true;
        }, { passive: true });
        
        sidebar.addEventListener('touchmove', (e: TouchEvent) => {
          if (!isDragging) return;
          currentX = e.touches[0].clientX;
          const diffX = startX - currentX;
          
          // If swiping left (close sidebar)
          if (diffX > 50 && sidebar.classList.contains('active')) {
            this.toggleSidebar();
            isDragging = false;
          }
        }, { passive: true });
        
        sidebar.addEventListener('touchend', () => {
          isDragging = false;
        }, { passive: true });
      }
    }
  }

  // Keyboard shortcuts
  private setupKeyboardShortcuts(): void {
    if (!this.isBrowser) return;
    
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Ctrl/Cmd + M to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        this.toggleSidebar();
      }
      
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && window.innerWidth <= 991) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
          this.toggleSidebar();
        }
      }
      
      // Alt + S to focus search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-box input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  }

  // Profile Panel functionality
  toggleProfilePanel(): void {
    if (!this.isBrowser) return;
    
    const panel = document.getElementById('profilePanel');
    const overlay = document.getElementById('panelOverlay');
    
    if (panel && overlay) {
      if (this.isProfilePanelOpen) {
        this.closeProfilePanel();
      } else {
        this.openProfilePanel();
      }
    }
  }

  private openProfilePanel(): void {
    if (!this.isBrowser) return;
    
    const panel = document.getElementById('profilePanel');
    const overlay = document.getElementById('panelOverlay');
    
    if (panel && overlay) {
      panel.classList.add('active');
      overlay.classList.add('active');
      this.isProfilePanelOpen = true;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Setup close events
      overlay.addEventListener('click', () => this.closeProfilePanel());
      
      const closeBtn = document.getElementById('closeProfilePanel');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeProfilePanel());
      }
    }
  }

  private closeProfilePanel(): void {
    if (!this.isBrowser) return;
    
    const panel = document.getElementById('profilePanel');
    const overlay = document.getElementById('panelOverlay');
    
    if (panel && overlay) {
      panel.classList.remove('active');
      overlay.classList.remove('active');
      this.isProfilePanelOpen = false;
      
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  clearAllNotifications(event: Event): void {
    if (this.isBrowser) {
      event.preventDefault();
      
      // Clear all notification items
      const notificationList = document.querySelector('.notification-list') as HTMLElement;
      if (notificationList) {
        notificationList.innerHTML = '<div class="text-center text-muted py-3"><i class="fas fa-check-circle me-2"></i>All notifications cleared!</div>';
      }
      
      // Update notification count
      const notificationCount = document.querySelector('.notification-count') as HTMLElement;
      if (notificationCount) {
        notificationCount.textContent = '0';
      }
      
      // Update notification badge in topbar
      const notificationBadge = document.querySelector('.notification-badge') as HTMLElement;
      if (notificationBadge) {
        notificationBadge.style.display = 'none';
      }
      
      console.log('All notifications cleared');
    }
  }

  // Logout method
  logout(): void {
    this.authService.logout();
  }
}
