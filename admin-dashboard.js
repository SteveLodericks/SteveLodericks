// Admin Dashboard Management System
// Handles dashboard data, analytics, client communication, and reporting

class AdminDashboard {
    constructor() {
        this.dashboardData = {
            todaySessions: 0,
            weekRevenue: 0,
            pendingBookings: 0,
            upcomingSessions: [],
            recentActivity: [],
            clientProgress: []
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateDateTime();
        await this.loadDashboardData();
        this.renderUpcomingSessions();
        this.renderRecentActivity();
        this.setupChartInteractions();
        this.setupModals();
        
        // Auto-refresh dashboard every 5 minutes
        setInterval(() => {
            this.refreshDashboardData();
        }, 5 * 60 * 1000);
    }

    setupEventListeners() {
        // Quick action buttons
        document.getElementById('view-reports')?.addEventListener('click', () => this.showReportsModal());
        document.getElementById('send-message')?.addEventListener('click', () => this.showMessageModal());
        
        // Modal controls
        this.setupModalControls();
        
        // Tab controls
        this.setupTabControls();
        
        // Export buttons
        document.getElementById('export-revenue')?.addEventListener('click', () => this.exportData('revenue'));
        document.getElementById('export-clients')?.addEventListener('click', () => this.exportData('clients'));
        document.getElementById('export-packages')?.addEventListener('click', () => this.exportData('packages'));
        
        // Activity link
        document.getElementById('view-all-activity')?.addEventListener('click', () => this.showAllActivity());
    }

    setupModalControls() {
        // Message Modal
        document.getElementById('close-message-modal')?.addEventListener('click', () => this.hideModal('message-modal'));
        document.getElementById('cancel-message')?.addEventListener('click', () => this.hideModal('message-modal'));
        document.getElementById('client-message-form')?.addEventListener('submit', (e) => this.handleSendMessage(e));
        
        // Reports Modal
        document.getElementById('close-reports-modal')?.addEventListener('click', () => this.hideModal('reports-modal'));
    }

    setupTabControls() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.showTab(tabName);
            });
        });
    }

    updateDateTime() {
        const now = new Date();
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    async loadDashboardData() {
        try {
            // In production, this would fetch from API
            // For demo purposes, simulate data loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.dashboardData = {
                todaySessions: 3,
                weekRevenue: 960,
                pendingBookings: 2,
                upcomingSessions: [
                    {
                        id: 'session-1',
                        clientName: 'Sarah M.',
                        time: '10:00 AM',
                        date: 'Today',
                        type: 'Individual Session',
                        status: 'confirmed'
                    },
                    {
                        id: 'session-2',
                        clientName: 'Marcus K.',
                        time: '2:00 PM',
                        date: 'Today',
                        type: '3-Session Package (2/3)',
                        status: 'confirmed'
                    },
                    {
                        id: 'session-3',
                        clientName: 'Emma D.',
                        time: '9:00 AM',
                        date: 'Tomorrow',
                        type: 'Individual Session',
                        status: 'pending'
                    },
                    {
                        id: 'session-4',
                        clientName: 'Lisa R.',
                        time: '11:00 AM',
                        date: 'Tomorrow',
                        type: '6-Session Intensive (1/6)',
                        status: 'confirmed'
                    }
                ],
                recentActivity: [
                    {
                        id: 'activity-1',
                        action: 'New booking received',
                        details: 'Emma D. booked Individual Session',
                        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                        type: 'booking'
                    },
                    {
                        id: 'activity-2',
                        action: 'Payment processed',
                        details: '€320 for Marcus K. - 3-Session Package',
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                        type: 'payment'
                    },
                    {
                        id: 'activity-3',
                        action: 'Session completed',
                        details: 'Sarah M. - Individual Session',
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
                        type: 'session'
                    },
                    {
                        id: 'activity-4',
                        action: 'Calendar synchronized',
                        details: 'Google Calendar sync completed',
                        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                        type: 'system'
                    }
                ]
            };
            
            this.updateDashboardStats();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    updateDashboardStats() {
        document.getElementById('today-sessions').textContent = this.dashboardData.todaySessions;
        document.getElementById('week-revenue').textContent = `€${this.dashboardData.weekRevenue}`;
        document.getElementById('pending-bookings').textContent = this.dashboardData.pendingBookings;
    }

    renderUpcomingSessions() {
        const container = document.getElementById('upcoming-sessions');
        if (!container) return;
        
        if (this.dashboardData.upcomingSessions.length === 0) {
            container.innerHTML = '<p class="empty-state">No upcoming sessions</p>';
            return;
        }
        
        container.innerHTML = this.dashboardData.upcomingSessions.slice(0, 4).map(session => `
            <div class="session-item ${session.status}">
                <div class="session-time">
                    <strong>${session.time}</strong>
                    <span>${session.date}</span>
                </div>
                <div class="session-details">
                    <strong>${session.clientName}</strong>
                    <span>${session.type}</span>
                    <span class="session-status status-${session.status}">${session.status}</span>
                </div>
                <div class="session-actions">
                    <button class="btn-icon" onclick="adminDashboard.editSession('${session.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="adminDashboard.contactClient('${session.id}')" title="Contact">📞</button>
                </div>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        if (this.dashboardData.recentActivity.length === 0) {
            container.innerHTML = '<p class="empty-state">No recent activity</p>';
            return;
        }
        
        container.innerHTML = this.dashboardData.recentActivity.slice(0, 5).map(activity => `
            <div class="activity-item ${activity.type}">
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <strong>${activity.action}</strong>
                    <p>${activity.details}</p>
                    <span class="activity-time">${this.formatRelativeTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            booking: '📅',
            payment: '💳',
            session: '🎯',
            system: '⚙️',
            client: '👤'
        };
        return icons[type] || '📋';
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const diff = now - new Date(timestamp);
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    setupChartInteractions() {
        // Add hover effects to chart bars
        const chartBars = document.querySelectorAll('.chart-bar');
        chartBars.forEach(bar => {
            bar.addEventListener('mouseenter', function() {
                this.style.opacity = '0.7';
                
                // Show tooltip with value
                const tooltip = document.createElement('div');
                tooltip.className = 'chart-tooltip';
                tooltip.textContent = this.dataset.value;
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            });
            
            bar.addEventListener('mouseleave', function() {
                this.style.opacity = '1';
                
                // Remove tooltip
                const tooltip = document.querySelector('.chart-tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    }

    showReportsModal() {
        const modal = document.getElementById('reports-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    showMessageModal() {
        const modal = document.getElementById('message-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Reset form
            document.getElementById('client-message-form').reset();
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showTab(tabName) {
        // Hide all tabs
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Remove active class from all buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // Add active class to selected button
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }

    async handleSendMessage(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const messageData = {
            recipient: document.getElementById('message-recipient').value,
            subject: document.getElementById('message-subject').value,
            body: document.getElementById('message-body').value,
            scheduled: document.getElementById('schedule-message').checked
        };
        
        try {
            const submitButton = event.target.querySelector('button[type="submit"]');
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('Sending message:', messageData);
            
            this.hideModal('message-modal');
            this.showNotification('Message sent successfully!', 'success');
            
            // Add to recent activity
            this.dashboardData.recentActivity.unshift({
                id: 'activity-' + Date.now(),
                action: 'Message sent',
                details: `To: ${messageData.recipient} - ${messageData.subject}`,
                timestamp: new Date(),
                type: 'client'
            });
            
            this.renderRecentActivity();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message', 'error');
        } finally {
            const submitButton = event.target.querySelector('button[type="submit"]');
            submitButton.textContent = 'Send Message';
            submitButton.disabled = false;
        }
    }

    async exportData(type) {
        try {
            // In production, this would generate and download actual data
            this.showNotification(`Exporting ${type} data...`, 'info');
            
            // Simulate export process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create mock CSV data
            const csvData = this.generateMockCSV(type);
            this.downloadCSV(csvData, `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
            
            this.showNotification(`${type} data exported successfully!`, 'success');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Export failed', 'error');
        }
    }

    generateMockCSV(type) {
        switch (type) {
            case 'revenue':
                return `Month,Revenue,Sessions,Average
January,€1200,15,€80
February,€1600,20,€80
March,€900,12,€75
April,€1800,24,€75
May,€1400,18,€78
June,€1700,22,€77`;
            
            case 'clients':
                return `Name,Email,Package,Sessions Completed,Total Spent
Sarah M.,sarah@example.com,3-Session Package,2,€320
Marcus K.,marcus@example.com,Individual Session,1,€120
Lisa R.,lisa@example.com,6-Session Intensive,6,€600
Emma D.,emma@example.com,3-Session Package,0,€320`;
            
            case 'packages':
                return `Package,Sales,Revenue,Completion Rate
Single Session,48,€5760,95%
3-Session Package,32,€10240,89%
6-Session Intensive,12,€7200,92%`;
            
            default:
                return 'No data available';
        }
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    editSession(sessionId) {
        // In production, this would open an edit modal
        console.log('Editing session:', sessionId);
        this.showNotification('Edit session functionality would be implemented here', 'info');
    }

    contactClient(sessionId) {
        // In production, this would open client contact options
        console.log('Contacting client for session:', sessionId);
        this.showMessageModal();
    }

    showAllActivity() {
        // In production, this would navigate to a full activity page
        console.log('Showing all activity');
        this.showNotification('Full activity page would be implemented here', 'info');
    }

    async refreshDashboardData() {
        try {
            await this.loadDashboardData();
            console.log('Dashboard data refreshed');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button type="button" class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
}

// Initialize admin dashboard when page loads
let adminDashboard;

document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}