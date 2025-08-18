// Admin Calendar Management Interface
// Handles the admin interface for calendar management and availability settings

class AdminCalendarManager {
    constructor() {
        this.calendarIntegration = null;
        this.weeklySchedule = this.getDefaultSchedule();
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.renderWeeklySchedule();
        this.loadCalendarStatus();
        this.loadRecentActivity();
        this.loadSettings();
        
        // Initialize calendar integration
        if (typeof CalendarIntegration !== 'undefined') {
            this.calendarIntegration = new CalendarIntegration();
        }
        
        this.isInitialized = true;
    }

    setupEventListeners() {
        // Calendar connection buttons
        document.getElementById('connect-google')?.addEventListener('click', () => this.connectCalendar('google'));
        document.getElementById('connect-outlook')?.addEventListener('click', () => this.connectCalendar('outlook'));
        
        // Sync buttons
        document.getElementById('sync-calendar')?.addEventListener('click', () => this.syncCalendar());
        document.getElementById('force-sync')?.addEventListener('click', () => this.syncCalendar(true));
        
        // Schedule management
        document.getElementById('save-schedule')?.addEventListener('click', () => this.saveSchedule());
        document.getElementById('reset-schedule')?.addEventListener('click', () => this.resetSchedule());
        
        // Quick actions
        document.getElementById('block-time')?.addEventListener('click', () => this.showBlockTimeModal());
        document.getElementById('vacation-mode')?.addEventListener('click', () => this.showVacationModal());
        document.getElementById('emergency-block')?.addEventListener('click', () => this.emergencyBlock());
        
        // Availability settings
        document.getElementById('set-availability')?.addEventListener('click', () => this.showAvailabilityModal());
        
        // Modal controls
        this.setupModalControls();
        
        // Settings
        this.setupSettingsControls();
    }

    setupModalControls() {
        // Block Time Modal
        document.getElementById('close-block-modal')?.addEventListener('click', () => this.hideModal('block-time-modal'));
        document.getElementById('cancel-block')?.addEventListener('click', () => this.hideModal('block-time-modal'));
        document.getElementById('block-time-form')?.addEventListener('submit', (e) => this.handleBlockTime(e));
        
        // Vacation Modal
        document.getElementById('close-vacation-modal')?.addEventListener('click', () => this.hideModal('vacation-modal'));
        document.getElementById('cancel-vacation')?.addEventListener('click', () => this.hideModal('vacation-modal'));
        document.getElementById('vacation-form')?.addEventListener('submit', (e) => this.handleVacationMode(e));
    }

    setupSettingsControls() {
        // Settings toggles
        const settings = ['auto-sync', 'two-way-sync', 'conflict-detection'];
        settings.forEach(setting => {
            const element = document.getElementById(setting);
            if (element) {
                element.addEventListener('change', () => this.updateSetting(setting, element.checked));
            }
        });
        
        // Buffer settings
        const bufferSettings = ['buffer-before', 'buffer-after', 'max-daily-sessions'];
        bufferSettings.forEach(setting => {
            const element = document.getElementById(setting);
            if (element) {
                element.addEventListener('change', () => this.updateSetting(setting, element.value));
            }
        });
    }

    async connectCalendar(provider) {
        try {
            // In production, this would handle OAuth flow
            // For demo purposes, we'll simulate the connection
            
            const statusElement = document.getElementById(`${provider}-status`);
            const textElement = document.getElementById(`${provider}-status-text`);
            const buttonElement = document.getElementById(`connect-${provider}`);
            
            buttonElement.textContent = 'Connecting...';
            buttonElement.disabled = true;
            
            // Simulate OAuth flow
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update UI to show connected status
            statusElement.classList.add('connected');
            textElement.textContent = 'Connected';
            buttonElement.textContent = 'Disconnect';
            buttonElement.disabled = false;
            
            // Initialize calendar integration
            if (this.calendarIntegration) {
                await this.calendarIntegration.initialize(provider, { 
                    primaryCalendarId: 'primary' 
                });
            }
            
            this.showNotification(`${provider} Calendar connected successfully!`, 'success');
            this.addActivity(`Connected ${provider} Calendar`);
            
        } catch (error) {
            console.error(`Error connecting ${provider} calendar:`, error);
            this.showNotification(`Failed to connect ${provider} Calendar`, 'error');
        }
    }

    async syncCalendar(force = false) {
        try {
            const syncButton = document.getElementById('sync-calendar');
            const forceSyncButton = document.getElementById('force-sync');
            
            syncButton.textContent = '🔄 Syncing...';
            syncButton.disabled = true;
            
            if (forceSyncButton) {
                forceSyncButton.textContent = 'Syncing...';
                forceSyncButton.disabled = true;
            }
            
            // Simulate sync process
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Update last sync time
            const lastSyncText = document.getElementById('last-sync-text');
            if (lastSyncText) {
                lastSyncText.textContent = new Date().toLocaleString();
            }
            
            syncButton.textContent = '🔄 Sync Calendar';
            syncButton.disabled = false;
            
            if (forceSyncButton) {
                forceSyncButton.textContent = 'Sync Now';
                forceSyncButton.disabled = false;
            }
            
            this.showNotification('Calendar synchronized successfully!', 'success');
            this.addActivity('Calendar synchronized');
            
        } catch (error) {
            console.error('Error syncing calendar:', error);
            this.showNotification('Calendar sync failed', 'error');
        }
    }

    renderWeeklySchedule() {
        const scheduleContainer = document.getElementById('weekly-schedule');
        if (!scheduleContainer) return;
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        scheduleContainer.innerHTML = '';
        
        days.forEach((day, index) => {
            const daySchedule = this.weeklySchedule[index];
            const dayElement = document.createElement('div');
            dayElement.className = 'schedule-day';
            
            dayElement.innerHTML = `
                <div class="day-header">
                    <h4>${day}</h4>
                    <label class="switch">
                        <input type="checkbox" ${daySchedule.enabled ? 'checked' : ''} 
                               onchange="adminCalendarManager.toggleDay(${index}, this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="day-times ${daySchedule.enabled ? '' : 'disabled'}">
                    <div class="time-input-group">
                        <label>Start:</label>
                        <input type="time" value="${daySchedule.start}" 
                               onchange="adminCalendarManager.updateDayTime(${index}, 'start', this.value)"
                               ${daySchedule.enabled ? '' : 'disabled'}>
                    </div>
                    <div class="time-input-group">
                        <label>End:</label>
                        <input type="time" value="${daySchedule.end}" 
                               onchange="adminCalendarManager.updateDayTime(${index}, 'end', this.value)"
                               ${daySchedule.enabled ? '' : 'disabled'}>
                    </div>
                    <div class="lunch-break">
                        <label class="checkbox-container">
                            <input type="checkbox" ${daySchedule.lunchBreak ? 'checked' : ''} 
                                   onchange="adminCalendarManager.toggleLunchBreak(${index}, this.checked)"
                                   ${daySchedule.enabled ? '' : 'disabled'}>
                            <span class="checkmark"></span>
                            Lunch break (12-2 PM)
                        </label>
                    </div>
                </div>
            `;
            
            scheduleContainer.appendChild(dayElement);
        });
    }

    toggleDay(dayIndex, enabled) {
        this.weeklySchedule[dayIndex].enabled = enabled;
        this.renderWeeklySchedule();
    }

    updateDayTime(dayIndex, timeType, value) {
        this.weeklySchedule[dayIndex][timeType] = value;
    }

    toggleLunchBreak(dayIndex, enabled) {
        this.weeklySchedule[dayIndex].lunchBreak = enabled;
    }

    async saveSchedule() {
        try {
            // In production, this would save to backend
            localStorage.setItem('weeklySchedule', JSON.stringify(this.weeklySchedule));
            
            // If calendar integration is available, update availability pattern
            if (this.calendarIntegration) {
                await this.calendarIntegration.setAvailabilityPattern(this.weeklySchedule);
            }
            
            this.showNotification('Schedule saved successfully!', 'success');
            this.addActivity('Weekly schedule updated');
            
        } catch (error) {
            console.error('Error saving schedule:', error);
            this.showNotification('Failed to save schedule', 'error');
        }
    }

    resetSchedule() {
        this.weeklySchedule = this.getDefaultSchedule();
        this.renderWeeklySchedule();
        this.showNotification('Schedule reset to default', 'info');
    }

    getDefaultSchedule() {
        return [
            { enabled: false, start: '09:00', end: '17:00', lunchBreak: true }, // Monday
            { enabled: true, start: '09:00', end: '17:00', lunchBreak: true },  // Tuesday
            { enabled: true, start: '09:00', end: '17:00', lunchBreak: true },  // Wednesday
            { enabled: true, start: '09:00', end: '17:00', lunchBreak: true },  // Thursday
            { enabled: true, start: '09:00', end: '17:00', lunchBreak: true },  // Friday
            { enabled: true, start: '09:00', end: '15:00', lunchBreak: false }, // Saturday
            { enabled: false, start: '09:00', end: '17:00', lunchBreak: true }  // Sunday
        ];
    }

    showBlockTimeModal() {
        const modal = document.getElementById('block-time-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Set default date to today
            const dateInput = document.getElementById('block-date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
                dateInput.min = new Date().toISOString().split('T')[0];
            }
        }
    }

    showVacationModal() {
        const modal = document.getElementById('vacation-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Set default dates
            const startInput = document.getElementById('vacation-start');
            const endInput = document.getElementById('vacation-end');
            
            if (startInput && endInput) {
                const today = new Date().toISOString().split('T')[0];
                startInput.value = today;
                startInput.min = today;
                
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                endInput.value = nextWeek.toISOString().split('T')[0];
                endInput.min = today;
            }
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleBlockTime(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const blockData = {
            date: formData.get('block-date') || document.getElementById('block-date').value,
            startTime: formData.get('block-start-time') || document.getElementById('block-start-time').value,
            endTime: formData.get('block-end-time') || document.getElementById('block-end-time').value,
            reason: formData.get('block-reason') || document.getElementById('block-reason').value,
            recurring: document.getElementById('recurring-block').checked
        };
        
        try {
            // In production, this would create a blocking event
            console.log('Blocking time:', blockData);
            
            this.hideModal('block-time-modal');
            this.showNotification('Time blocked successfully!', 'success');
            this.addActivity(`Blocked time: ${blockData.date} ${blockData.startTime}-${blockData.endTime}`);
            
            // Reset form
            event.target.reset();
            
        } catch (error) {
            console.error('Error blocking time:', error);
            this.showNotification('Failed to block time', 'error');
        }
    }

    async handleVacationMode(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const vacationData = {
            startDate: formData.get('vacation-start') || document.getElementById('vacation-start').value,
            endDate: formData.get('vacation-end') || document.getElementById('vacation-end').value,
            title: formData.get('vacation-title') || document.getElementById('vacation-title').value,
            message: formData.get('vacation-message') || document.getElementById('vacation-message').value,
            cancelExisting: document.getElementById('cancel-existing').checked
        };
        
        try {
            // In production, this would create vacation blocking events
            console.log('Setting vacation mode:', vacationData);
            
            this.hideModal('vacation-modal');
            this.showNotification('Vacation period set successfully!', 'success');
            this.addActivity(`Vacation set: ${vacationData.startDate} to ${vacationData.endDate}`);
            
            // Reset form
            event.target.reset();
            
        } catch (error) {
            console.error('Error setting vacation mode:', error);
            this.showNotification('Failed to set vacation period', 'error');
        }
    }

    async emergencyBlock() {
        const confirmed = confirm('This will block all remaining appointments for today. Are you sure?');
        
        if (confirmed) {
            try {
                // In production, this would block all today's remaining slots
                console.log('Emergency block activated for today');
                
                this.showNotification('Emergency block activated - all remaining today\'s slots blocked', 'warning');
                this.addActivity('Emergency block activated');
                
            } catch (error) {
                console.error('Error activating emergency block:', error);
                this.showNotification('Failed to activate emergency block', 'error');
            }
        }
    }

    loadCalendarStatus() {
        // In production, this would load actual connection status from backend
        const savedStatus = localStorage.getItem('calendarConnections');
        
        if (savedStatus) {
            const connections = JSON.parse(savedStatus);
            
            Object.keys(connections).forEach(provider => {
                if (connections[provider]) {
                    const statusElement = document.getElementById(`${provider}-status`);
                    const textElement = document.getElementById(`${provider}-status-text`);
                    const buttonElement = document.getElementById(`connect-${provider}`);
                    
                    if (statusElement) statusElement.classList.add('connected');
                    if (textElement) textElement.textContent = 'Connected';
                    if (buttonElement) buttonElement.textContent = 'Disconnect';
                }
            });
        }
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        // In production, this would load from backend
        const savedActivity = localStorage.getItem('calendarActivity');
        let activities = savedActivity ? JSON.parse(savedActivity) : [
            { action: 'Calendar sync completed', timestamp: new Date(Date.now() - 3600000) },
            { action: 'Weekly schedule updated', timestamp: new Date(Date.now() - 7200000) },
            { action: 'Google Calendar connected', timestamp: new Date(Date.now() - 86400000) }
        ];
        
        activities = activities.slice(0, 10); // Show latest 10 activities
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-content">
                    <span class="activity-action">${activity.action}</span>
                    <span class="activity-time">${this.formatRelativeTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    loadSettings() {
        // In production, this would load from backend
        const savedSettings = localStorage.getItem('calendarSettings');
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            Object.keys(settings).forEach(setting => {
                const element = document.getElementById(setting);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = settings[setting];
                    } else {
                        element.value = settings[setting];
                    }
                }
            });
        }
        
        // Load weekly schedule
        const savedSchedule = localStorage.getItem('weeklySchedule');
        if (savedSchedule) {
            this.weeklySchedule = JSON.parse(savedSchedule);
        }
    }

    updateSetting(setting, value) {
        // In production, this would save to backend
        const savedSettings = localStorage.getItem('calendarSettings');
        const settings = savedSettings ? JSON.parse(savedSettings) : {};
        
        settings[setting] = value;
        localStorage.setItem('calendarSettings', JSON.stringify(settings));
        
        this.addActivity(`Setting updated: ${setting}`);
    }

    addActivity(action) {
        const savedActivity = localStorage.getItem('calendarActivity');
        const activities = savedActivity ? JSON.parse(savedActivity) : [];
        
        activities.unshift({
            action: action,
            timestamp: new Date()
        });
        
        // Keep only latest 50 activities
        activities.splice(50);
        
        localStorage.setItem('calendarActivity', JSON.stringify(activities));
        this.loadRecentActivity();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button type="button" class="notification-close">&times;</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
}

// Initialize admin calendar manager when page loads
let adminCalendarManager;

document.addEventListener('DOMContentLoaded', () => {
    adminCalendarManager = new AdminCalendarManager();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminCalendarManager;
}