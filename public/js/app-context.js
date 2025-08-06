/**
 * Global App Context Management
 * Handles persistent state across page navigation like modern SaaS apps
 */

class AppContext {
    constructor() {
        this.state = {
            user: null,
            currentProject: null,
            projects: [],
            sidebarMode: 'organization', // 'organization' | 'project'
            initialized: false
        };
        
        this.cache = {
            projects: { data: null, timestamp: null, ttl: 5 * 60 * 1000 }, // 5 min
            user: { data: null, timestamp: null, ttl: 10 * 60 * 1000 }      // 10 min
        };
        
        this.subscribers = new Set();
        this.loadFromStorage();
    }
    
    // Load persisted state from sessionStorage
    loadFromStorage() {
        try {
            const stored = sessionStorage.getItem('appContext');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.state = { ...this.state, ...parsed.state };
                this.cache = { ...this.cache, ...parsed.cache };
            }
        } catch (e) {
            console.warn('Failed to load app context from storage');
        }
    }
    
    // Persist state to sessionStorage
    saveToStorage() {
        try {
            sessionStorage.setItem('appContext', JSON.stringify({
                state: this.state,
                cache: this.cache,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save app context to storage');
        }
    }
    
    // Check if cached data is valid
    isCacheValid(key) {
        const cache = this.cache[key];
        return cache && cache.data && cache.timestamp && 
               (Date.now() - cache.timestamp) < cache.ttl;
    }
    
    // Set cached data
    setCache(key, data) {
        this.cache[key] = {
            data: data,
            timestamp: Date.now(),
            ttl: this.cache[key]?.ttl || 5 * 60 * 1000
        };
        this.saveToStorage();
    }
    
    // Get cached data
    getCache(key) {
        return this.isCacheValid(key) ? this.cache[key].data : null;
    }
    
    // Set state and notify subscribers
    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.saveToStorage();
        
        // Notify subscribers of changes
        this.subscribers.forEach(callback => {
            try {
                callback(this.state, oldState);
            } catch (e) {
                console.error('Error in state subscriber:', e);
            }
        });
    }
    
    // Subscribe to state changes
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback); // Return unsubscribe function
    }
    
    // Initialize app context (called once per session)
    async initialize() {
        if (this.state.initialized) return;
        
        console.log('🚀 Initializing app context...');
        
        // Load projects if not cached
        if (!this.isCacheValid('projects')) {
            await this.loadProjects();
        } else {
            this.setState({ projects: this.getCache('projects') });
        }
        
        // Load user if not cached
        if (!this.isCacheValid('user')) {
            await this.loadUser();
        } else {
            this.setState({ user: this.getCache('user') });
        }
        
        this.setState({ initialized: true });
        console.log('✅ App context initialized');
    }
    
    // Load projects from API
    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const projects = await response.json();
                this.setCache('projects', projects);
                this.setState({ projects });
                return projects;
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
        return [];
    }
    
    // Load user from API
    async loadUser() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const user = await response.json();
                this.setCache('user', user);
                this.setState({ user });
                return user;
            }
        } catch (error) {
            console.error('Failed to load user:', error);
        }
        return null;
    }
    
    // Set current project context
    setCurrentProject(projectId) {
        const project = this.state.projects.find(p => p.id === projectId);
        if (project) {
            this.setState({ 
                currentProject: project,
                sidebarMode: 'project'
            });
        }
    }
    
    // Switch to organization context
    setOrganizationMode() {
        this.setState({ 
            currentProject: null,
            sidebarMode: 'organization'
        });
    }
    
    // Get current context based on URL
    getCurrentContext() {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');
        const isProjectPage = window.location.pathname.includes('project-detail') || 
                              window.location.pathname.includes('creative-tracker') || 
                              window.location.pathname.includes('customer-avatars') || 
                              window.location.pathname.includes('competitor-analysis') ||
                              (window.location.pathname.includes('todolist') && projectId) ||
                              (window.location.pathname.includes('documents') && projectId);
        
        return {
            projectId,
            isProjectPage,
            shouldBeInProjectMode: isProjectPage && projectId
        };
    }
    
    // Sync context with current page (called on every page load)
    syncWithCurrentPage() {
        const { projectId, shouldBeInProjectMode } = this.getCurrentContext();
        
        if (shouldBeInProjectMode) {
            if (!this.state.currentProject || this.state.currentProject.id !== projectId) {
                console.log('🔄 Syncing to project context:', projectId);
                this.setCurrentProject(projectId);
                return true; // State changed
            }
        } else {
            if (this.state.sidebarMode !== 'organization') {
                console.log('🔄 Syncing to organization context');
                this.setOrganizationMode();
                return true; // State changed
            }
        }
        
        console.log('✅ Context already in sync');
        return false; // No state change
    }
    
    // Refresh data (force reload from API)
    async refresh() {
        await this.loadProjects();
        await this.loadUser();
    }
    
    // Clear all cached data
    clearCache() {
        this.cache = {
            projects: { data: null, timestamp: null, ttl: 5 * 60 * 1000 },
            user: { data: null, timestamp: null, ttl: 10 * 60 * 1000 }
        };
        sessionStorage.removeItem('appContext');
    }
}

// Create global instance
window.appContext = new AppContext();

// Auto-initialize on first load
document.addEventListener('DOMContentLoaded', async () => {
    await window.appContext.initialize();
    window.appContext.syncWithCurrentPage();
});