/**
 * Comprehensive User Feedback and Error Handling System
 * Provides consistent user feedback mechanisms across the entire application
 */

class UserFeedbackSystem {
    constructor() {
        this.notifications = [];
        this.loadingStates = new Map();
        this.retryAttempts = new Map();
        this.maxRetryAttempts = 3;
        
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.setupGlobalErrorHandler();
        this.setupNetworkErrorHandler();
        this.setupUnhandledRejectionHandler();
        
        console.log('🔔 User feedback system initialized');
    }

    /**
     * Create notification container in DOM
     */
    createNotificationContainer() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            container.setAttribute('role', 'region');
            container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(container);
        }
    }

    /**
     * Show notification to user
     * @param {string} message - The message to display
     * @param {string} type - success, error, warning, info
     * @param {Object} options - Additional options
     */
    showNotification(message, type = 'info', options = {}) {
        const {
            duration = this.getDefaultDuration(type),
            persistent = false,
            actions = [],
            icon = this.getDefaultIcon(type),
            id = null
        } = options;

        // Remove existing notification with same ID
        if (id) {
            this.removeNotification(id);
        }

        const notification = {
            id: id || this.generateId(),
            message,
            type,
            timestamp: Date.now(),
            persistent,
            actions,
            icon
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto-remove after duration (unless persistent)
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }

        // Log for debugging
        this.logNotification(notification);

        return notification.id;
    }

    /**
     * Show success message
     */
    showSuccess(message, options = {}) {
        return this.showNotification(message, 'success', options);
    }

    /**
     * Show error message
     */
    showError(message, options = {}) {
        return this.showNotification(message, 'error', {
            persistent: true,
            actions: [
                {
                    text: 'Dismiss',
                    action: (id) => this.removeNotification(id),
                    type: 'secondary'
                }
            ],
            ...options
        });
    }

    /**
     * Show warning message
     */
    showWarning(message, options = {}) {
        return this.showNotification(message, 'warning', options);
    }

    /**
     * Show info message
     */
    showInfo(message, options = {}) {
        return this.showNotification(message, 'info', options);
    }

    /**
     * Show loading state for an action
     */
    showLoading(actionId, message = 'Loading...', options = {}) {
        const loadingId = `loading-${actionId}`;
        
        this.loadingStates.set(actionId, {
            id: loadingId,
            startTime: Date.now()
        });

        return this.showNotification(message, 'loading', {
            id: loadingId,
            persistent: true,
            icon: '⏳',
            ...options
        });
    }

    /**
     * Hide loading state
     */
    hideLoading(actionId) {
        const loading = this.loadingStates.get(actionId);
        if (loading) {
            this.removeNotification(loading.id);
            this.loadingStates.delete(actionId);
        }
    }

    /**
     * Show retry mechanism for failed actions
     */
    showRetryOption(actionId, message, retryCallback, options = {}) {
        const currentAttempts = this.retryAttempts.get(actionId) || 0;
        const canRetry = currentAttempts < this.maxRetryAttempts;

        const actions = [];
        if (canRetry) {
            actions.push({
                text: `Retry (${this.maxRetryAttempts - currentAttempts} left)`,
                action: () => {
                    this.retryAttempts.set(actionId, currentAttempts + 1);
                    this.removeNotification(`retry-${actionId}`);
                    retryCallback();
                },
                type: 'primary'
            });
        }

        actions.push({
            text: 'Dismiss',
            action: () => {
                this.removeNotification(`retry-${actionId}`);
                this.retryAttempts.delete(actionId);
            },
            type: 'secondary'
        });

        return this.showNotification(
            canRetry ? message : `${message} (Maximum retry attempts reached)`,
            canRetry ? 'warning' : 'error',
            {
                id: `retry-${actionId}`,
                persistent: true,
                actions,
                ...options
            }
        );
    }

    /**
     * Show connection error with offline handling
     */
    showConnectionError(options = {}) {
        const isOffline = !navigator.onLine;
        const message = isOffline 
            ? 'You appear to be offline. Please check your internet connection.'
            : 'Connection failed. Please check your internet connection and try again.';

        return this.showError(message, {
            id: 'connection-error',
            actions: [
                {
                    text: 'Retry',
                    action: () => {
                        this.removeNotification('connection-error');
                        window.location.reload();
                    },
                    type: 'primary'
                },
                {
                    text: 'Dismiss',
                    action: () => this.removeNotification('connection-error'),
                    type: 'secondary'
                }
            ],
            ...options
        });
    }

    /**
     * Show payment error with specific guidance
     */
    showPaymentError(errorType, details = {}) {
        const errorMessages = {
            'card_declined': 'Your card was declined. Please try a different payment method or contact your bank.',
            'insufficient_funds': 'Insufficient funds. Please check your account balance or use a different card.',
            'expired_card': 'Your card has expired. Please use a different payment method.',
            'incorrect_cvc': 'The security code is incorrect. Please check and try again.',
            'processing_error': 'Payment processing failed. Please try again in a few moments.',
            'network_error': 'Connection issue during payment. Your card was not charged. Please try again.',
            'generic': 'Payment failed. Please try again or contact support if the problem persists.'
        };

        const message = errorMessages[errorType] || errorMessages.generic;
        
        const actions = [
            {
                text: 'Try Again',
                action: () => {
                    this.removeNotification('payment-error');
                    // Trigger retry logic if available
                    if (details.retryCallback) {
                        details.retryCallback();
                    }
                },
                type: 'primary'
            },
            {
                text: 'Contact Support',
                action: () => {
                    window.open('mailto:hello@nicolinethijssen.nl?subject=Payment Issue', '_blank');
                },
                type: 'secondary'
            }
        ];

        return this.showError(message, {
            id: 'payment-error',
            actions,
            icon: '💳'
        });
    }

    /**
     * Show booking conflict error
     */
    showBookingConflict(conflictDetails) {
        const message = 'The selected time slot is no longer available. Please choose a different time.';
        
        return this.showWarning(message, {
            id: 'booking-conflict',
            actions: [
                {
                    text: 'Choose Different Time',
                    action: () => {
                        this.removeNotification('booking-conflict');
                        // Scroll to calendar if available
                        const calendar = document.getElementById('calendar');
                        if (calendar) {
                            calendar.scrollIntoView({ behavior: 'smooth' });
                        }
                    },
                    type: 'primary'
                }
            ],
            icon: '📅'
        });
    }

    /**
     * Show form validation errors
     */
    showValidationErrors(errors) {
        const errorList = Array.isArray(errors) ? errors : [errors];
        const message = `Please correct the following:\n${errorList.map(err => `• ${err}`).join('\n')}`;
        
        return this.showError(message, {
            id: 'validation-errors',
            icon: '📝'
        });
    }

    /**
     * Show session expiry warning
     */
    showSessionExpiry(options = {}) {
        const message = 'Your session is about to expire. Would you like to extend it?';
        
        return this.showWarning(message, {
            id: 'session-expiry',
            persistent: true,
            actions: [
                {
                    text: 'Extend Session',
                    action: () => {
                        this.removeNotification('session-expiry');
                        if (options.extendCallback) {
                            options.extendCallback();
                        }
                    },
                    type: 'primary'
                },
                {
                    text: 'Sign Out',
                    action: () => {
                        if (options.signOutCallback) {
                            options.signOutCallback();
                        }
                    },
                    type: 'secondary'
                }
            ],
            icon: '⏰'
        });
    }

    /**
     * Remove notification by ID
     */
    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.classList.add('notification-exit');
            setTimeout(() => {
                element.remove();
            }, 300);
        }
    }

    /**
     * Remove all notifications
     */
    clearAllNotifications() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification.id);
        });
        this.notifications = [];
    }

    /**
     * Render notification in DOM
     */
    renderNotification(notification) {
        const container = document.getElementById('notification-container');
        const element = document.createElement('div');
        
        element.id = `notification-${notification.id}`;
        element.className = `notification notification-${notification.type}`;
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'polite');

        const actionsHTML = notification.actions.map(action => 
            `<button class="notification-action btn-${action.type || 'primary'}" data-action="${action.text}">
                ${action.text}
            </button>`
        ).join('');

        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${notification.icon}</div>
                <div class="notification-message">${notification.message.replace(/\n/g, '<br>')}</div>
                ${!notification.persistent && notification.type !== 'loading' ? 
                    '<button class="notification-close" aria-label="Close notification">&times;</button>' : 
                    ''
                }
            </div>
            ${notification.actions.length > 0 ? 
                `<div class="notification-actions">${actionsHTML}</div>` : 
                ''
            }
        `;

        // Add event listeners
        element.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                this.removeNotification(notification.id);
            } else if (e.target.classList.contains('notification-action')) {
                const actionText = e.target.dataset.action;
                const action = notification.actions.find(a => a.text === actionText);
                if (action) {
                    action.action(notification.id);
                }
            }
        });

        container.appendChild(element);

        // Trigger entrance animation
        setTimeout(() => {
            element.classList.add('notification-enter');
        }, 10);
    }

    /**
     * Setup global error handler
     */
    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            
            // Don't show notification for script loading errors
            if (event.filename && event.filename.includes('.js')) {
                return;
            }

            this.showError('An unexpected error occurred. Please refresh the page if problems persist.', {
                id: 'global-error',
                actions: [
                    {
                        text: 'Refresh Page',
                        action: () => window.location.reload(),
                        type: 'primary'
                    }
                ]
            });
        });
    }

    /**
     * Setup network error handler
     */
    setupNetworkErrorHandler() {
        window.addEventListener('online', () => {
            this.removeNotification('connection-error');
            this.showSuccess('Connection restored', { duration: 3000 });
        });

        window.addEventListener('offline', () => {
            this.showConnectionError();
        });
    }

    /**
     * Setup unhandled promise rejection handler
     */
    setupUnhandledRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Don't show notification for known errors that are handled elsewhere
            if (event.reason?.name === 'AbortError') {
                return;
            }

            this.showError('An unexpected error occurred. Please try again.', {
                id: 'promise-rejection'
            });
        });
    }

    /**
     * Get default duration for notification type
     */
    getDefaultDuration(type) {
        const durations = {
            'success': 5000,
            'info': 7000,
            'warning': 10000,
            'error': 0, // Persistent by default
            'loading': 0 // Persistent
        };
        return durations[type] || 5000;
    }

    /**
     * Get default icon for notification type
     */
    getDefaultIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'loading': '⏳'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Log notification for debugging
     */
    logNotification(notification) {
        const logLevel = {
            'success': 'log',
            'info': 'info',
            'warning': 'warn',
            'error': 'error',
            'loading': 'info'
        }[notification.type] || 'log';

        console[logLevel](`🔔 ${notification.type.toUpperCase()}: ${notification.message}`);
    }

    /**
     * Get current notifications summary
     */
    getSummary() {
        return {
            total: this.notifications.length,
            byType: this.notifications.reduce((acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            }, {}),
            loadingStates: this.loadingStates.size,
            retryAttempts: this.retryAttempts.size
        };
    }
}

// Initialize global feedback system
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.userFeedback === 'undefined') {
        window.userFeedback = new UserFeedbackSystem();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserFeedbackSystem;
}