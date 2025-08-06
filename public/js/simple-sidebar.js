/**
 * Dead Simple Sidebar Context Switcher
 * No complex state management - just show/hide based on URL
 */

function initSimpleSidebar() {
    // Get current page info
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const path = window.location.pathname;
    
    // Determine if this is a project page
    const isProjectPage = projectId && (
        path.includes('project-detail') ||
        path.includes('creative-tracker') ||
        path.includes('customer-avatars') ||
        path.includes('competitor-analysis') ||
        path.includes('todolist') ||
        path.includes('documents')
    );
    
    // Get sidebar elements
    const orgMenu = document.getElementById('org-menu');
    const projectMenu = document.getElementById('project-menu');
    
    if (!orgMenu || !projectMenu) return;
    
    // Simple show/hide logic
    if (isProjectPage) {
        // Show project sidebar
        orgMenu.style.display = 'none';
        projectMenu.style.display = 'block';
        
        // Update project switcher
        updateProjectSwitcher(projectId);
        
        console.log('📋 Showing project sidebar for:', projectId);
    } else {
        // Show organization sidebar
        orgMenu.style.display = 'block';
        projectMenu.style.display = 'none';
        
        // Update switcher to organization
        const currentProjectName = document.getElementById('currentProjectName');
        const currentProjectType = document.getElementById('currentProjectType');
        if (currentProjectName) currentProjectName.textContent = 'Organization';
        if (currentProjectType) currentProjectType.textContent = 'Main Dashboard';
        
        console.log('🏢 Showing organization sidebar');
    }
    
    // Set active menu item
    setActiveMenuItem();
}

function updateProjectSwitcher(projectId) {
    // Simple project name update - load from API if needed
    loadProjectName(projectId);
}

async function loadProjectName(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
            const project = await response.json();
            
            // Update switcher display
            const currentProjectName = document.getElementById('currentProjectName');
            const currentProjectType = document.getElementById('currentProjectType');
            const projectTitle = document.getElementById('project-title');
            
            if (currentProjectName) currentProjectName.textContent = project.name;
            if (currentProjectType) currentProjectType.textContent = 'Project Dashboard';
            if (projectTitle) projectTitle.textContent = project.name;
        }
    } catch (error) {
        console.error('Failed to load project name:', error);
    }
}

function setActiveMenuItem() {
    // Remove all active classes
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class based on current page
    const path = window.location.pathname;
    const projectId = new URLSearchParams(window.location.search).get('id');
    
    // Organization menu
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
    
    // Project menu
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

// Set sidebar state IMMEDIATELY before DOM loads to prevent flicker
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const path = window.location.pathname;
    
    const isProjectPage = projectId && (
        path.includes('project-detail') ||
        path.includes('creative-tracker') ||
        path.includes('customer-avatars') ||
        path.includes('competitor-analysis') ||
        path.includes('todolist') ||
        path.includes('documents')
    );
    
    // Store the sidebar state in sessionStorage for instant access
    if (isProjectPage) {
        sessionStorage.setItem('sidebarMode', 'project');
        sessionStorage.setItem('currentProjectId', projectId);
    } else {
        sessionStorage.setItem('sidebarMode', 'organization');
        sessionStorage.removeItem('currentProjectId');
    }
})();

// Initialize on page load (but sidebar state is already set)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Simple sidebar initializing...');
    initSimpleSidebar();
});