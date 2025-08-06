/**
 * UI State Manager
 * Handles sidebar, topbar, and other UI components based on app context
 */

class UIManager {
    constructor() {
        this.initialized = false;
        this.currentUIState = null;
        
        // Subscribe to app context changes
        if (window.appContext) {
            window.appContext.subscribe((newState, oldState) => {
                this.handleContextChange(newState, oldState);
            });
        }
    }
    
    // Initialize UI components
    async initialize() {
        if (this.initialized) return;
        
        console.log('🎨 Initializing UI manager...');
        
        // Wait for app context to be ready
        if (!window.appContext?.state.initialized) {
            await new Promise(resolve => {
                const checkContext = () => {
                    if (window.appContext?.state.initialized) {
                        resolve();
                    } else {
                        setTimeout(checkContext, 50);
                    }
                };
                checkContext();
            });
        }
        
        // Initialize UI based on current context
        this.updateUI();
        this.initialized = true;
        
        // console.log('✅ UI manager initialized');
    }
    
    // Handle app context changes
    handleContextChange(newState, oldState) {
        if (!this.initialized) return;
        
        // Only update UI if relevant state changed
        const relevantStateChanged = 
            newState.sidebarMode !== oldState.sidebarMode ||
            newState.currentProject?.id !== oldState.currentProject?.id ||
            newState.user?.id !== oldState.user?.id;
            
        if (relevantStateChanged) {
            console.log('🔄 Context changed, updating UI');
            this.updateUI();
        }
    }
    
    // Update all UI components based on current context
    updateUI() {
        const state = window.appContext.state;
        
        // Update sidebar
        this.updateSidebar(state);
        
        // Update topbar
        this.updateTopbar(state);
        
        // Update project switcher
        this.updateProjectSwitcher(state);
    }
    
    // Update sidebar based on context
    updateSidebar(state) {
        const orgMenu = document.getElementById('org-menu');
        const projectMenu = document.getElementById('project-menu');
        
        if (!orgMenu || !projectMenu) return;
        
        if (state.sidebarMode === 'project' && state.currentProject) {
            // Show project sidebar
            orgMenu.style.display = 'none';
            projectMenu.style.display = 'block';
            
            // Update project title
            const projectTitle = document.getElementById('project-title');
            if (projectTitle) {
                projectTitle.textContent = state.currentProject.name;
            }
            
            // console.log('📋 Sidebar: Project mode -', state.currentProject.name);
        } else {
            // Show organization sidebar
            orgMenu.style.display = 'block';
            projectMenu.style.display = 'none';
            
            console.log('🏢 Sidebar: Organization mode');
        }
        
        // Set active menu item
        this.setActiveMenuItem();
    }
    
    // Update topbar based on context
    updateTopbar(state) {
        // Update user info
        if (state.user) {
            const userNameElements = document.querySelectorAll('.user-name, .topbar-user-name');
            userNameElements.forEach(el => {
                if (el.textContent !== state.user.name) {
                    el.textContent = state.user.name;
                }
            });
            
            const userEmailElements = document.querySelectorAll('.user-email');
            userEmailElements.forEach(el => {
                if (el.textContent !== state.user.email) {
                    el.textContent = state.user.email;
                }
            });
        }
        
        // Update greeting based on context
        const greetingElement = document.querySelector('.topbar-greeting, .dashboard-greeting');
        if (greetingElement && state.user) {
            const hour = new Date().getHours();
            let greeting = 'Good Morning';
            if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
            else if (hour >= 17) greeting = 'Good Evening';
            
            const newText = `${greeting}, ${state.user.name}`;
            if (greetingElement.textContent !== newText) {
                greetingElement.textContent = newText;
            }
        }
    }
    
    // Update project switcher
    updateProjectSwitcher(state) {
        const currentProjectName = document.getElementById('currentProjectName');
        const currentProjectType = document.getElementById('currentProjectType');
        
        if (currentProjectName && currentProjectType) {
            if (state.sidebarMode === 'project' && state.currentProject) {
                if (currentProjectName.textContent !== state.currentProject.name) {
                    currentProjectName.textContent = state.currentProject.name;
                }
                if (currentProjectType.textContent !== 'Project Dashboard') {
                    currentProjectType.textContent = 'Project Dashboard';
                }
            } else {
                if (currentProjectName.textContent !== 'Organization') {
                    currentProjectName.textContent = 'Organization';
                }
                if (currentProjectType.textContent !== 'Main Dashboard') {
                    currentProjectType.textContent = 'Main Dashboard';
                }
            }
        }
        
        // Update project dropdown
        this.updateProjectDropdown(state);
    }
    
    // Update project dropdown list
    updateProjectDropdown(state) {
        const dropdown = document.querySelector('.project-switcher-dropdown, #projectDropdown');
        if (!dropdown || !state.projects) return;
        
        // Clear existing items (except the current project display)
        const existingItems = dropdown.querySelectorAll('.project-item');
        existingItems.forEach(item => item.remove());
        
        // Add projects to dropdown
        state.projects.forEach(project => {
            const item = document.createElement('a');
            item.className = 'dropdown-item project-item';
            item.href = `/project-detail?id=${project.id}`;
            item.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0">
                        <div class="avatar-xs">
                            <div class="avatar-title bg-soft-primary text-primary rounded-circle">
                                ${project.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-2">
                        <h6 class="mb-0 font-size-14">${project.name}</h6>
                        <p class="text-muted mb-0 font-size-12">${project.status || 'Active'}</p>
                    </div>
                </div>
            `;
            dropdown.appendChild(item);
        });
    }
    
    // Set active menu item based on current page
    setActiveMenuItem() {
        // Remove all active classes
        document.querySelectorAll('.menu-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current page
        const path = window.location.pathname;
        const projectId = new URLSearchParams(window.location.search).get('id');
        
        // Organization menu items
        if (path === '/' || path === '/dashboard') {
            document.querySelector('.menu-link[href="/"]')?.classList.add('active');
        } else if (path === '/projects') {
            document.querySelector('.menu-link[href="/projects"]')?.classList.add('active');
        } else if (path === '/team') {
            document.querySelector('.menu-link[href="/team"]')?.classList.add('active');
        } else if (path === '/todolist' && !projectId) {
            document.querySelector('.menu-link[href="/todolist"]')?.classList.add('active');
        } else if (path === '/documents' && !projectId) {
            document.querySelector('.menu-link[href="/documents"]')?.classList.add('active');
        }
        
        // Project menu items
        if (projectId) {
            if (path.includes('project-detail')) {
                document.querySelector('#project-menu .menu-link[onclick*="goToProjectDashboard"]')?.classList.add('active');
            } else if (path.includes('todolist')) {
                document.querySelector('#project-menu .menu-link[onclick*="goToProjectTasks"]')?.classList.add('active');
            } else if (path.includes('creative-tracker')) {
                document.querySelector('#project-menu .menu-link[onclick*="goToCreativeTracker"]')?.classList.add('active');
            } else if (path.includes('customer-avatars')) {
                document.querySelector('#project-menu .menu-link[onclick*="goToCustomerAvatars"]')?.classList.add('active');
            } else if (path.includes('competitor-analysis')) {
                document.querySelector('#project-menu .menu-link[onclick*="goToCompetitorAnalysis"]')?.classList.add('active');
            } else if (path.includes('documents')) {
                document.querySelector('#project-menu .menu-link[onclick*="goToProjectDocuments"]')?.classList.add('active');
            }
        }
    }
    
    // Force refresh UI (useful for debugging)
    forceRefresh() {
        console.log('🔄 Force refreshing UI...');
        this.updateUI();
    }
}

// Create global instance
window.uiManager = new UIManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await window.uiManager.initialize();
});