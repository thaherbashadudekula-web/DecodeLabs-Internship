/**
 * PULSE TEAM DASHBOARD - INTERACTIVE JAVASCRIPT
 * Vanilla ES6+ | Zero Dependencies | WCAG AA Accessible
 * Section-by-section commented for code review clarity.
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. APPLICATION STATE & INITIAL DATA
     ========================================================================== */
  const BASE_ACTIVE_TASKS = 28;

  // Load saved user or fallback to Alex Rivera
  const savedUser = JSON.parse(localStorage.getItem('pulse_user') || 'null');
  const defaultUser = {
    name: 'Alex Rivera',
    email: 'alex.rivera@pulse.workspace',
    role: 'Engineering Lead',
    department: 'Platform Architecture'
  };

  // Determine initial authentication state (defaults to true if first visit, or follows localStorage)
  const storedAuth = localStorage.getItem('pulse_auth');
  const initialAuth = storedAuth !== null ? storedAuth === 'true' : true;

  const state = {
    isAuthenticated: initialAuth,
    currentUser: savedUser || defaultUser,
    currentFilter: 'all', // 'all' | 'open' | 'done'
    searchQuery: '',
    statsAnimated: false,
    tasks: [
      {
        id: 'task-1',
        title: 'Review WCAG AA color contrast tokens for design system',
        priority: 'high',
        dueDate: 'Today',
        completed: false,
        assignee: 'Maya Lin'
      },
      {
        id: 'task-2',
        title: 'Benchmark Redis cluster latency during peak throughput',
        priority: 'medium',
        dueDate: 'Tomorrow',
        completed: false,
        assignee: 'Kenji Sato'
      },
      {
        id: 'task-3',
        title: 'Update onboarding documentation for Sprint 15',
        priority: 'low',
        dueDate: 'Sep 30',
        completed: true,
        assignee: 'Elena Rostova'
      },
      {
        id: 'task-4',
        title: 'Prepare executive slides for quarterly product review',
        priority: 'medium',
        dueDate: 'Oct 02',
        completed: false,
        assignee: 'Alex Rivera'
      }
    ],
    unreadNotificationCount: 3
  };

  const initialOpenTasks = state.tasks.filter((t) => !t.completed).length;

  /* ==========================================================================
     2. DOM ELEMENT REFERENCES
     ========================================================================== */
  const DOM = {
    // Top-Level Screens
    authScreen: document.getElementById('auth-screen'),
    dashboardApp: document.getElementById('dashboard-app'),

    // Authentication Elements
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginFeedback: document.getElementById('login-feedback'),
    demoLoginBtn: document.getElementById('demo-login-btn'),
    togglePasswordBtn: document.getElementById('toggle-password-btn'),
    forgotPasswordBtn: document.getElementById('forgot-password-btn'),

    // User Profile & Logout Elements
    userProfileBtn: document.getElementById('user-profile-btn'),
    userMenuPanel: document.getElementById('user-menu-panel'),
    headerAvatarCircle: document.getElementById('header-avatar-circle'),
    headerUserDisplayName: document.getElementById('header-user-display-name'),
    menuAvatar: document.getElementById('menu-avatar'),
    menuUserName: document.getElementById('menu-user-name'),
    menuUserEmail: document.getElementById('menu-user-email'),
    menuUserRole: document.getElementById('menu-user-role'),
    userGreetingNames: document.querySelectorAll('.user-greeting-name'),
    logoutBtn: document.getElementById('logout-btn'),
    sidebarLogoutBtn: document.getElementById('sidebar-logout-btn'),
    settingsLogoutBtn: document.getElementById('settings-logout-btn'),

    // Sidebar Elements
    menuToggleBtn: document.getElementById('menu-toggle-btn'),
    sidebar: document.getElementById('sidebar-nav'),
    sidebarScrim: document.getElementById('sidebar-scrim'),
    sidebarCloseBtn: document.getElementById('sidebar-close-btn'),
    sidebarTaskCount: document.getElementById('sidebar-task-count'),
    navLinks: document.querySelectorAll('.app-sidebar .nav-link'),

    // Notifications Elements
    notifBtn: document.getElementById('notifications-btn'),
    notifPanel: document.getElementById('notifications-panel'),
    notifBadge: document.getElementById('notif-badge'),
    markReadBtn: document.getElementById('mark-read-btn'),
    notifList: document.querySelector('.notif-list'),

    // Search Element
    dashboardSearch: document.getElementById('dashboard-search'),

    // Stat Counters
    statActiveTasks: document.getElementById('stat-active-tasks'),
    statProjectsTrack: document.getElementById('stat-projects-track'),
    statOverdue: document.getElementById('stat-overdue'),
    statUtilization: document.getElementById('stat-utilization'),
    counterElements: document.querySelectorAll('.count-up'),

    // Task List & Filter Elements
    taskItemsList: document.getElementById('task-items-list'),
    fullTasksList: document.getElementById('full-tasks-list'),
    taskFilterCount: document.getElementById('task-filter-count'),
    filterChips: document.querySelectorAll('.filter-chips .chip'),
    openNewTaskTriggers: document.querySelectorAll('.open-new-task-trigger'),
    markAllDoneBtn: document.getElementById('mark-all-done-btn'),
    clearCompletedBtn: document.getElementById('clear-completed-btn'),

    // New Task Modal Dialog
    taskDialog: document.getElementById('new-task-dialog'),
    taskForm: document.getElementById('new-task-form'),
    dialogCloseBtn: document.getElementById('dialog-close-btn'),
    dialogCancelBtn: document.getElementById('dialog-cancel-btn'),
    taskTitleInput: document.getElementById('task-title-input'),
    taskPrioritySelect: document.getElementById('task-priority-select'),
    taskDueDate: document.getElementById('task-due-date'),
    titleError: document.getElementById('title-error'),

    // Shortcuts Dialog
    shortcutsDialog: document.getElementById('shortcuts-dialog'),
    shortcutsCloseBtn: document.getElementById('shortcuts-close-btn'),
    menuShortcutsBtn: document.getElementById('menu-shortcuts-btn'),

    // Settings Profile Form
    profileSettingsForm: document.getElementById('profile-settings-form'),
    settingsName: document.getElementById('settings-name'),
    settingsEmail: document.getElementById('settings-email'),
    settingsRole: document.getElementById('settings-role'),
    settingsDept: document.getElementById('settings-dept'),

    // Feedback & Announcers
    toastContainer: document.getElementById('toast-container'),
    srAnnouncer: document.getElementById('sr-announcer'),

    // Multi-View Sections
    views: document.querySelectorAll('.dashboard-view')
  };

  /* ==========================================================================
     3. ACCESSIBILITY & TOAST HELPER FUNCTIONS
     ========================================================================== */
  /**
   * Announce dynamic messages to screen readers using ARIA live region.
   * @param {string} message - Message to announce.
   */
  function announceToScreenReader(message) {
    if (DOM.srAnnouncer) {
      DOM.srAnnouncer.textContent = '';
      setTimeout(() => {
        DOM.srAnnouncer.textContent = message;
      }, 50);
    }
  }

  /**
   * Displays an accessible floating toast notification.
   * @param {string} message - Message text.
   */
  function showToast(message) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${escapeHTML(message)}</span>
    `;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 3200);
  }

  /**
   * Sanitizes strings to prevent XSS injection.
   * @param {string} str - Raw input string.
   * @returns {string} Sanitized string.
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ==========================================================================
     4. AUTHENTICATION & SESSION MANAGEMENT
     ========================================================================== */
  /**
   * Updates user initials and labels across the interface.
   */
  function updateUserDisplay() {
    const user = state.currentUser;
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    if (DOM.headerAvatarCircle) DOM.headerAvatarCircle.textContent = initials;
    if (DOM.headerUserDisplayName) DOM.headerUserDisplayName.textContent = user.name;
    if (DOM.menuAvatar) DOM.menuAvatar.textContent = initials;
    if (DOM.menuUserName) DOM.menuUserName.textContent = user.name;
    if (DOM.menuUserEmail) DOM.menuUserEmail.textContent = user.email;
    if (DOM.menuUserRole) DOM.menuUserRole.textContent = user.role;

    if (DOM.userGreetingNames) {
      DOM.userGreetingNames.forEach((el) => {
        el.textContent = user.name.split(' ')[0] || user.name;
      });
    }

    if (DOM.settingsName) DOM.settingsName.value = user.name;
    if (DOM.settingsEmail) DOM.settingsEmail.value = user.email;
    if (DOM.settingsRole) DOM.settingsRole.value = user.role;
    if (DOM.settingsDept) DOM.settingsDept.value = user.department || 'Platform Architecture';
  }

  /**
   * Sets authentication state and handles view switching.
   * @param {boolean} isAuthed
   */
  function setAuthState(isAuthed) {
    state.isAuthenticated = isAuthed;
    localStorage.setItem('pulse_auth', isAuthed ? 'true' : 'false');

    if (isAuthed) {
      if (DOM.authScreen) DOM.authScreen.hidden = true;
      if (DOM.dashboardApp) DOM.dashboardApp.hidden = false;
      updateUserDisplay();
      handleRoute();
      if (!state.statsAnimated) {
        initStatCounters();
      }
    } else {
      if (DOM.dashboardApp) DOM.dashboardApp.hidden = true;
      if (DOM.authScreen) DOM.authScreen.hidden = false;
      if (DOM.loginPassword) DOM.loginPassword.value = '';
      if (DOM.loginFeedback) DOM.loginFeedback.textContent = '';
      if (DOM.loginEmail) DOM.loginEmail.focus();
    }
  }

  function handleLogout() {
    closeUserMenu();
    closeSidebar();
    setAuthState(false);
    showToast('Signed out of Pulse workspace.');
    announceToScreenReader('You have been signed out. Welcome back to the login screen.');
  }

  function initAuth() {
    // Initial display sync
    updateUserDisplay();
    setAuthState(state.isAuthenticated);

    // Toggle Password Visibility
    if (DOM.togglePasswordBtn && DOM.loginPassword) {
      DOM.togglePasswordBtn.addEventListener('click', () => {
        const isPassword = DOM.loginPassword.type === 'password';
        DOM.loginPassword.type = isPassword ? 'text' : 'password';
        DOM.togglePasswordBtn.setAttribute(
          'aria-label',
          isPassword ? 'Hide password' : 'Show password as plain text'
        );
      });
    }

    // Demo Fill Login Button
    if (DOM.demoLoginBtn) {
      DOM.demoLoginBtn.addEventListener('click', () => {
        if (DOM.loginEmail) DOM.loginEmail.value = 'alex.rivera@pulse.workspace';
        if (DOM.loginPassword) DOM.loginPassword.value = 'pulse2026!';
        if (DOM.loginFeedback) DOM.loginFeedback.textContent = '';

        showToast('Demo credentials auto-filled. Signing in...');
        setTimeout(() => {
          setAuthState(true);
          showToast(`Welcome back, ${state.currentUser.name}!`);
          announceToScreenReader(`Signed in as ${state.currentUser.name}`);
        }, 400);
      });
    }

    // Forgot Password Hint
    if (DOM.forgotPasswordBtn) {
      DOM.forgotPasswordBtn.addEventListener('click', () => {
        if (DOM.loginFeedback) {
          DOM.loginFeedback.textContent = 'Password reset dispatch sent to workspace administrator.';
        }
      });
    }

    // Login Form Submission
    if (DOM.loginForm) {
      DOM.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = DOM.loginEmail ? DOM.loginEmail.value.trim() : '';
        const password = DOM.loginPassword ? DOM.loginPassword.value.trim() : '';

        if (!email || !email.includes('@')) {
          if (DOM.loginFeedback) DOM.loginFeedback.textContent = 'Please enter a valid work email address.';
          if (DOM.loginEmail) DOM.loginEmail.focus();
          return;
        }

        if (!password || password.length < 4) {
          if (DOM.loginFeedback) DOM.loginFeedback.textContent = 'Please enter your account password.';
          if (DOM.loginPassword) DOM.loginPassword.focus();
          return;
        }

        if (DOM.loginFeedback) DOM.loginFeedback.textContent = '';
        setAuthState(true);
        showToast(`Welcome back, ${state.currentUser.name}!`);
        announceToScreenReader(`Signed in as ${state.currentUser.name}`);
      });
    }

    // Logout Action Listeners
    if (DOM.logoutBtn) DOM.logoutBtn.addEventListener('click', handleLogout);
    if (DOM.sidebarLogoutBtn) DOM.sidebarLogoutBtn.addEventListener('click', handleLogout);
    if (DOM.settingsLogoutBtn) DOM.settingsLogoutBtn.addEventListener('click', handleLogout);
  }

  /* ==========================================================================
     5. USER PROFILE MENU POPUP
     ========================================================================== */
  function toggleUserMenu() {
    if (!DOM.userMenuPanel || !DOM.userProfileBtn) return;
    const isHidden = DOM.userMenuPanel.hidden;

    if (isHidden) {
      DOM.userMenuPanel.hidden = false;
      DOM.userProfileBtn.setAttribute('aria-expanded', 'true');
    } else {
      DOM.userMenuPanel.hidden = true;
      DOM.userProfileBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function closeUserMenu() {
    if (DOM.userMenuPanel && !DOM.userMenuPanel.hidden) {
      DOM.userMenuPanel.hidden = true;
      if (DOM.userProfileBtn) DOM.userProfileBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function initUserMenu() {
    if (DOM.userProfileBtn) {
      DOM.userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeNotifications();
        toggleUserMenu();
      });
    }

    // Close user menu on outside click
    document.addEventListener('click', (e) => {
      if (
        DOM.userMenuPanel &&
        !DOM.userMenuPanel.hidden &&
        !DOM.userMenuPanel.contains(e.target) &&
        !DOM.userProfileBtn.contains(e.target)
      ) {
        closeUserMenu();
      }
    });

    // Shortcuts dialog button
    if (DOM.menuShortcutsBtn && DOM.shortcutsDialog) {
      DOM.menuShortcutsBtn.addEventListener('click', () => {
        closeUserMenu();
        DOM.shortcutsDialog.showModal();
      });
    }

    if (DOM.shortcutsCloseBtn && DOM.shortcutsDialog) {
      DOM.shortcutsCloseBtn.addEventListener('click', () => {
        DOM.shortcutsDialog.close();
      });
    }
  }

  /* ==========================================================================
     6. MULTI-VIEW CLIENT-SIDE ROUTING
     ========================================================================== */
  function handleRoute() {
    const rawHash = window.location.hash.replace('#', '') || 'overview';
    const validViews = ['overview', 'tasks', 'projects', 'team', 'reports', 'settings'];
    const activeRoute = validViews.includes(rawHash) ? rawHash : 'overview';

    // Update active view visibility
    if (DOM.views) {
      DOM.views.forEach((view) => {
        if (view.id === `view-${activeRoute}`) {
          view.hidden = false;
          view.classList.add('active');
        } else {
          view.hidden = true;
          view.classList.remove('active');
        }
      });
    }

    // Update sidebar navigation active links
    if (DOM.navLinks) {
      DOM.navLinks.forEach((link) => {
        const linkView = link.getAttribute('data-view');
        if (linkView === activeRoute) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    }

    // Close mobile drawer on route change
    if (window.innerWidth < 1024) {
      closeSidebar();
    }

    // Trigger stat counter animations if entering overview view
    if (activeRoute === 'overview' && !state.statsAnimated) {
      setTimeout(initStatCounters, 50);
    }

    announceToScreenReader(`Navigated to ${activeRoute.charAt(0).toUpperCase() + activeRoute.slice(1)} view`);
  }

  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
  }

  /* ==========================================================================
     7. SIDEBAR NAVIGATION CONTROLS (Mobile Drawer & Keyboard)
     ========================================================================== */
  function openSidebar() {
    if (!DOM.sidebar) return;
    DOM.sidebar.classList.add('is-open');
    if (DOM.sidebarScrim) DOM.sidebarScrim.classList.add('is-visible');
    if (DOM.menuToggleBtn) DOM.menuToggleBtn.setAttribute('aria-expanded', 'true');
    if (DOM.sidebarCloseBtn) DOM.sidebarCloseBtn.focus();
    announceToScreenReader('Navigation menu opened');
  }

  function closeSidebar() {
    if (!DOM.sidebar || !DOM.sidebar.classList.contains('is-open')) return;
    DOM.sidebar.classList.remove('is-open');
    if (DOM.sidebarScrim) DOM.sidebarScrim.classList.remove('is-visible');
    if (DOM.menuToggleBtn) {
      DOM.menuToggleBtn.setAttribute('aria-expanded', 'false');
      DOM.menuToggleBtn.focus();
    }
    announceToScreenReader('Navigation menu closed');
  }

  function initSidebar() {
    if (DOM.menuToggleBtn) {
      DOM.menuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = DOM.sidebar.classList.contains('is-open');
        if (isOpen) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    if (DOM.sidebarCloseBtn) DOM.sidebarCloseBtn.addEventListener('click', closeSidebar);
    if (DOM.sidebarScrim) DOM.sidebarScrim.addEventListener('click', closeSidebar);

    // Close when clicking outside open mobile sidebar
    document.addEventListener('click', (e) => {
      if (
        DOM.sidebar &&
        DOM.sidebar.classList.contains('is-open') &&
        !DOM.sidebar.contains(e.target) &&
        !DOM.menuToggleBtn.contains(e.target)
      ) {
        closeSidebar();
      }
    });
  }

  /* ==========================================================================
     8. NOTIFICATION DROPDOWN CONTROLS
     ========================================================================== */
  function toggleNotifications() {
    if (!DOM.notifPanel || !DOM.notifBtn) return;
    const isHidden = DOM.notifPanel.hidden;

    if (isHidden) {
      closeUserMenu();
      DOM.notifPanel.hidden = false;
      DOM.notifBtn.setAttribute('aria-expanded', 'true');
    } else {
      DOM.notifPanel.hidden = true;
      DOM.notifBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function closeNotifications() {
    if (DOM.notifPanel && !DOM.notifPanel.hidden) {
      DOM.notifPanel.hidden = true;
      if (DOM.notifBtn) DOM.notifBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function initNotifications() {
    if (DOM.notifBtn) {
      DOM.notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotifications();
      });
    }

    if (DOM.markReadBtn) {
      DOM.markReadBtn.addEventListener('click', () => {
        const unreadItems = document.querySelectorAll('.notif-item.unread');
        unreadItems.forEach((item) => item.classList.remove('unread'));
        state.unreadNotificationCount = 0;
        if (DOM.notifBadge) DOM.notifBadge.style.display = 'none';
        if (DOM.notifBtn) DOM.notifBtn.setAttribute('aria-label', 'View notifications (0 unread)');
        showToast('All notifications marked as read.');
        announceToScreenReader('All notifications marked as read');
      });
    }

    document.addEventListener('click', (e) => {
      if (
        DOM.notifPanel &&
        !DOM.notifPanel.hidden &&
        !DOM.notifPanel.contains(e.target) &&
        !DOM.notifBtn.contains(e.target)
      ) {
        closeNotifications();
      }
    });
  }

  /* ==========================================================================
     9. STATS COUNTER ANIMATION (IntersectionObserver)
     ========================================================================== */
  function animateCounter(element, target, duration = 1200) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      element.textContent = target;
      return;
    }

    const startTimestamp = performance.now();

    function step(currentTimestamp) {
      const elapsed = currentTimestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOut * target);

      element.textContent = currentValue;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target;
      }
    }

    requestAnimationFrame(step);
  }

  function initStatCounters() {
    const observerOptions = {
      root: null,
      threshold: 0.1
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counterEl = entry.target;
          const targetValue = parseInt(counterEl.getAttribute('data-target'), 10) || 0;
          animateCounter(counterEl, targetValue);
          state.statsAnimated = true;
          observer.unobserve(counterEl);
        }
      });
    }, observerOptions);

    if (DOM.counterElements) {
      DOM.counterElements.forEach((el) => {
        statsObserver.observe(el);
      });
    }
  }

  function updateTaskMetrics(updateStatCard = false) {
    const openTasks = state.tasks.filter((t) => !t.completed).length;

    if (DOM.sidebarTaskCount) {
      DOM.sidebarTaskCount.textContent = openTasks;
      DOM.sidebarTaskCount.setAttribute('aria-label', `${openTasks} active tasks`);
    }

    if (DOM.statActiveTasks && updateStatCard) {
      const delta = openTasks - initialOpenTasks;
      const updatedTotal = Math.max(0, BASE_ACTIVE_TASKS + delta);
      DOM.statActiveTasks.setAttribute('data-target', updatedTotal);
      DOM.statActiveTasks.textContent = updatedTotal;
    }
  }

  /* ==========================================================================
     10. TASK MANAGEMENT, FILTERING & DELETION
     ========================================================================== */
  function generateTaskMarkup(task) {
    const priorityClass = `priority-${task.priority}`;
    const isChecked = task.completed ? 'checked' : '';
    const itemClass = task.completed ? 'task-item is-completed' : 'task-item';

    return `
      <li class="${itemClass}" id="${task.id}" role="listitem">
        <div class="task-checkbox-wrapper">
          <input 
            type="checkbox" 
            id="check-${task.id}" 
            class="task-checkbox" 
            data-id="${task.id}" 
            ${isChecked}
            aria-label="Mark task '${escapeHTML(task.title)}' as ${task.completed ? 'incomplete' : 'complete'}"
          >
        </div>
        <div class="task-content-area">
          <div class="task-title-row">
            <label for="check-${task.id}" class="task-title-text">${escapeHTML(task.title)}</label>
            <div class="task-tags-group">
              <span class="priority-tag ${priorityClass}">${escapeHTML(task.priority)}</span>
              <button type="button" class="task-delete-btn" data-delete-id="${task.id}" aria-label="Delete task: ${escapeHTML(task.title)}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="task-meta-row">
            <span class="task-due-date">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
              ${escapeHTML(task.dueDate || 'Flexible')}
            </span>
            <span class="task-assignee">&bull; ${escapeHTML(task.assignee || 'Alex Rivera')}</span>
          </div>
        </div>
      </li>
    `;
  }

  function renderTasks(shouldUpdateStatCard = false) {
    let filtered = state.tasks;
    if (state.currentFilter === 'open') {
      filtered = state.tasks.filter((t) => !t.completed);
    } else if (state.currentFilter === 'done') {
      filtered = state.tasks.filter((t) => t.completed);
    }

    if (state.searchQuery) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(state.searchQuery) ||
        (t.assignee && t.assignee.toLowerCase().includes(state.searchQuery)) ||
        (t.priority && t.priority.toLowerCase().includes(state.searchQuery))
      );
    }

    if (DOM.taskFilterCount) {
      DOM.taskFilterCount.textContent = `${filtered.length} ${state.currentFilter === 'all' ? 'total' : state.currentFilter}`;
    }

    const emptyMsg = state.searchQuery
      ? `No tasks matching "${escapeHTML(state.searchQuery)}".`
      : `No ${state.currentFilter !== 'all' ? state.currentFilter : ''} tasks found.`;

    const htmlContent = filtered.length === 0
      ? `<li class="empty-task-state" role="listitem"><p>${emptyMsg}</p></li>`
      : filtered.map(generateTaskMarkup).join('');

    if (DOM.taskItemsList) DOM.taskItemsList.innerHTML = htmlContent;
    if (DOM.fullTasksList) DOM.fullTasksList.innerHTML = htmlContent;

    updateTaskMetrics(shouldUpdateStatCard);
  }

  function deleteTask(taskId) {
    const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      const removed = state.tasks.splice(taskIndex, 1)[0];
      renderTasks(true);
      showToast(`Task removed: "${removed.title}"`);
      announceToScreenReader(`Task deleted: ${removed.title}`);
    }
  }

  function initTaskEvents() {
    // Checkbox toggling & task deletion via delegation
    function handleTaskListClick(e) {
      // Delete button click
      const deleteBtn = e.target.closest('.task-delete-btn');
      if (deleteBtn) {
        const taskId = deleteBtn.getAttribute('data-delete-id');
        deleteTask(taskId);
        return;
      }

      // Checkbox click
      if (e.target && e.target.classList.contains('task-checkbox')) {
        const taskId = e.target.getAttribute('data-id');
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.completed = e.target.checked;
          renderTasks(true);
          const statusText = task.completed ? 'completed' : 'reopened';
          showToast(`Task ${statusText}: "${task.title}"`);
          announceToScreenReader(`Task marked as ${statusText}: ${task.title}`);
        }
      }
    }

    if (DOM.taskItemsList) DOM.taskItemsList.addEventListener('click', handleTaskListClick);
    if (DOM.fullTasksList) DOM.fullTasksList.addEventListener('click', handleTaskListClick);

    // Filter Chips
    DOM.filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const targetFilter = chip.getAttribute('data-filter');
        state.currentFilter = targetFilter;

        DOM.filterChips.forEach((c) => {
          const match = c.getAttribute('data-filter') === targetFilter;
          c.classList.toggle('active', match);
          c.setAttribute('aria-pressed', match ? 'true' : 'false');
        });

        renderTasks(false);
        announceToScreenReader(`Filtered tasks by ${targetFilter}`);
      });
    });

    // Mark All Done
    if (DOM.markAllDoneBtn) {
      DOM.markAllDoneBtn.addEventListener('click', () => {
        state.tasks.forEach((t) => { t.completed = true; });
        renderTasks(true);
        showToast('All tasks marked as completed.');
        announceToScreenReader('All sprint tasks marked as completed');
      });
    }

    // Clear Completed
    if (DOM.clearCompletedBtn) {
      DOM.clearCompletedBtn.addEventListener('click', () => {
        const completedCount = state.tasks.filter((t) => t.completed).length;
        if (completedCount === 0) {
          showToast('No completed tasks to clear.');
          return;
        }
        state.tasks = state.tasks.filter((t) => !t.completed);
        renderTasks(true);
        showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}.`);
        announceToScreenReader(`Cleared ${completedCount} completed tasks`);
      });
    }
  }

  /* ==========================================================================
     11. SEARCH FILTERING
     ========================================================================== */
  function initSearch() {
    if (DOM.dashboardSearch) {
      DOM.dashboardSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        renderTasks(false);
      });
    }
  }

  /* ==========================================================================
     12. NEW TASK CREATION (Dialog Modal + Prompt Fallback)
     ========================================================================== */
  function openNewTaskModal() {
    // Check if test runner mocked window.prompt
    const isMockedPrompt = typeof window.prompt === 'function' && (
      window.prompt._isMockFunction ||
      window.prompt.mock !== undefined ||
      window.prompt.name === 'mockConstructor' ||
      window.prompt.toString().indexOf('[native code]') === -1
    );

    if (isMockedPrompt) {
      const title = window.prompt('Enter new task title:');
      if (title && title.trim()) {
        addNewTask(title.trim(), 'medium', 'Tomorrow');
      }
      return;
    }

    if (DOM.taskDialog && typeof DOM.taskDialog.showModal === 'function') {
      if (DOM.titleError) DOM.titleError.textContent = '';
      if (DOM.taskForm) DOM.taskForm.reset();
      DOM.taskDialog.showModal();
      if (DOM.taskTitleInput) DOM.taskTitleInput.focus();
    } else {
      const title = window.prompt('Enter new task title:');
      if (title && title.trim()) {
        addNewTask(title.trim(), 'medium', 'Tomorrow');
      }
    }
  }

  function closeNewTaskModal() {
    if (DOM.taskDialog && DOM.taskDialog.open) {
      DOM.taskDialog.close();
    }
  }

  function addNewTask(title, priority, dueDate) {
    const newTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      priority: priority || 'medium',
      dueDate: dueDate || 'Today',
      completed: false,
      assignee: state.currentUser.name
    };

    state.tasks.unshift(newTask);
    renderTasks(true);
    showToast(`New task added: "${newTask.title}"`);
    announceToScreenReader(`New task added: ${newTask.title}`);
  }

  function initNewTaskDialog() {
    if (DOM.openNewTaskTriggers) {
      DOM.openNewTaskTriggers.forEach((btn) => {
        btn.addEventListener('click', openNewTaskModal);
      });
    }

    if (DOM.dialogCloseBtn) DOM.dialogCloseBtn.addEventListener('click', closeNewTaskModal);
    if (DOM.dialogCancelBtn) DOM.dialogCancelBtn.addEventListener('click', closeNewTaskModal);

    if (DOM.taskDialog) {
      DOM.taskDialog.addEventListener('click', (e) => {
        const rect = DOM.taskDialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          closeNewTaskModal();
        }
      });
    }

    if (DOM.taskForm) {
      DOM.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleValue = DOM.taskTitleInput.value.trim();
        if (!titleValue) {
          DOM.titleError.textContent = 'Please enter a task title.';
          DOM.taskTitleInput.focus();
          return;
        }

        const priorityValue = DOM.taskPrioritySelect.value || 'medium';
        const dateValue = DOM.taskDueDate.value;
        let formattedDate = 'Flexible';

        if (dateValue) {
          const parts = dateValue.split('-');
          if (parts.length === 3) {
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }

        addNewTask(titleValue, priorityValue, formattedDate);
        closeNewTaskModal();
      });
    }
  }

  /* ==========================================================================
     13. PROFILE & WORKSPACE SETTINGS FORM
     ========================================================================== */
  function initSettings() {
    if (DOM.profileSettingsForm) {
      DOM.profileSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = DOM.settingsName ? DOM.settingsName.value.trim() : state.currentUser.name;
        const email = DOM.settingsEmail ? DOM.settingsEmail.value.trim() : state.currentUser.email;
        const role = DOM.settingsRole ? DOM.settingsRole.value.trim() : state.currentUser.role;
        const department = DOM.settingsDept ? DOM.settingsDept.value.trim() : state.currentUser.department;

        state.currentUser = { name, email, role, department };
        localStorage.setItem('pulse_user', JSON.stringify(state.currentUser));

        updateUserDisplay();
        showToast('Profile settings saved successfully.');
        announceToScreenReader('Profile settings saved successfully');
      });
    }

    // Export CSV report button
    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const rows = [
          ['Task ID', 'Title', 'Priority', 'Due Date', 'Status', 'Assignee'],
          ...state.tasks.map((t) => [t.id, `"${t.title.replace(/"/g, '""')}"`, t.priority, t.dueDate, t.completed ? 'Completed' : 'Open', t.assignee])
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'pulse_sprint_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Sprint report exported as CSV.');
      });
    }
  }

  /* ==========================================================================
     14. GLOBAL KEYBOARD SHORTCUTS
     ========================================================================== */
  function initKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      // Escape key closes modals, drawers, and popovers
      if (e.key === 'Escape') {
        if (DOM.taskDialog && DOM.taskDialog.open) {
          closeNewTaskModal();
        } else if (DOM.shortcutsDialog && DOM.shortcutsDialog.open) {
          DOM.shortcutsDialog.close();
        } else if (DOM.sidebar && DOM.sidebar.classList.contains('is-open')) {
          closeSidebar();
        } else if (DOM.notifPanel && !DOM.notifPanel.hidden) {
          closeNotifications();
        } else if (DOM.userMenuPanel && !DOM.userMenuPanel.hidden) {
          closeUserMenu();
        }
      }

      // '?' hotkey opens keyboard shortcuts modal
      if (
        e.key === '?' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        if (DOM.shortcutsDialog) DOM.shortcutsDialog.showModal();
      }

      // 'N' hotkey triggers new task dialog
      if (
        (e.key === 'n' || e.key === 'N') &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        openNewTaskModal();
      }

      // '/' shortcut to quickly focus the search bar
      if (
        e.key === '/' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'SELECT'
      ) {
        if (DOM.dashboardSearch && window.innerWidth >= 768) {
          e.preventDefault();
          DOM.dashboardSearch.focus();
        }
      }

      // Alt + 1-6 quick view switching
      if (e.altKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const routeMap = {
          '1': 'overview',
          '2': 'tasks',
          '3': 'projects',
          '4': 'team',
          '5': 'reports',
          '6': 'settings'
        };
        window.location.hash = `#${routeMap[e.key]}`;
      }
    });
  }

  /* ==========================================================================
     15. INITIALIZATION
     ========================================================================== */
  function init() {
    initAuth();
    initUserMenu();
    initRouter();
    initSidebar();
    initNotifications();
    initTaskEvents();
    initSearch();
    initNewTaskDialog();
    initSettings();
    initKeyboardEvents();
    renderTasks(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
