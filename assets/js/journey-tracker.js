/**
 * User Journey Progress Tracking System
 * Manages the complete user flow from service selection through booking confirmation
 */

class UserJourneyTracker {
    constructor() {
        this.currentStep = 'service-selection';
        this.completedSteps = [];
        this.journeyData = {};
        this.steps = [
            {
                id: 'service-selection',
                name: 'Choose Package',
                url: '../index.html#packages',
                description: 'Select your coaching package',
                icon: '📦'
            },
            {
                id: 'payment',
                name: 'Payment',
                url: 'payment.html',
                description: 'Complete secure payment',
                icon: '💳'
            },
            {
                id: 'booking',
                name: 'Schedule',
                url: 'booking.html',
                description: 'Choose your session times',
                icon: '📅'
            },
            {
                id: 'confirmation',
                name: 'Confirmation',
                url: 'payment-success.html',
                description: 'Booking confirmed',
                icon: '✅'
            }
        ];
        
        this.init();
    }

    init() {
        this.detectCurrentStep();
        this.loadJourneyData();
        this.setupEventListeners();
        this.renderProgressIndicator();
        this.setupStepNavigation();
    }

    /**
     * Detect which step user is currently on based on URL
     */
    detectCurrentStep() {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        
        if (currentPath.includes('payment.html')) {
            this.currentStep = 'payment';
        } else if (currentPath.includes('booking.html')) {
            this.currentStep = 'booking';
        } else if (currentPath.includes('payment-success.html')) {
            this.currentStep = 'confirmation';
            this.completedSteps = ['service-selection', 'payment', 'booking'];
        } else if (currentPath.includes('index.html') || currentPath === '/') {
            this.currentStep = 'service-selection';
        }
        
        console.log('🧭 Current step detected:', this.currentStep);
    }

    /**
     * Load persisted journey data from localStorage
     */
    loadJourneyData() {
        const savedData = localStorage.getItem('userJourneyData');
        if (savedData) {
            try {
                this.journeyData = JSON.parse(savedData);
                this.completedSteps = this.journeyData.completedSteps || [];
                console.log('📊 Journey data loaded:', this.journeyData);
            } catch (error) {
                console.warn('Failed to parse saved journey data:', error);
                this.journeyData = {};
            }
        }
    }

    /**
     * Save journey data to localStorage
     */
    saveJourneyData() {
        this.journeyData.completedSteps = this.completedSteps;
        this.journeyData.currentStep = this.currentStep;
        this.journeyData.lastUpdated = new Date().toISOString();
        
        localStorage.setItem('userJourneyData', JSON.stringify(this.journeyData));
        console.log('💾 Journey data saved');
    }

    /**
     * Update journey data with new information
     */
    updateJourneyData(stepId, data) {
        this.journeyData[stepId] = {
            ...this.journeyData[stepId],
            ...data,
            completedAt: new Date().toISOString()
        };
        
        // Mark step as completed if not already
        if (!this.completedSteps.includes(stepId)) {
            this.completedSteps.push(stepId);
        }
        
        this.saveJourneyData();
        this.renderProgressIndicator();
        
        console.log('📈 Journey data updated for step:', stepId);
    }

    /**
     * Get data for a specific step
     */
    getStepData(stepId) {
        return this.journeyData[stepId] || {};
    }

    /**
     * Check if user can access a specific step
     */
    canAccessStep(stepId) {
        const stepIndex = this.steps.findIndex(step => step.id === stepId);
        const currentStepIndex = this.steps.findIndex(step => step.id === this.currentStep);
        
        // Can access current step, previous steps, or next step if current is completed
        return stepIndex <= currentStepIndex || 
               (stepIndex === currentStepIndex + 1 && this.completedSteps.includes(this.currentStep));
    }

    /**
     * Navigate to a specific step
     */
    navigateToStep(stepId) {
        if (!this.canAccessStep(stepId)) {
            this.showNavigationError('Please complete the current step first');
            return false;
        }
        
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            // Add journey parameters to URL if needed
            let url = step.url;
            if (stepId === 'booking' && this.journeyData.payment) {
                const bookingToken = this.journeyData.payment.bookingToken;
                if (bookingToken) {
                    url += `?token=${encodeURIComponent(bookingToken)}`;
                }
            }
            
            console.log('🧭 Navigating to step:', stepId, url);
            window.location.href = url;
            return true;
        }
        
        return false;
    }

    /**
     * Render progress indicator in the UI
     */
    renderProgressIndicator() {
        const progressContainer = this.findOrCreateProgressContainer();
        if (!progressContainer) return;
        
        progressContainer.innerHTML = this.generateProgressHTML();
        this.setupProgressClickHandlers(progressContainer);
    }

    /**
     * Find existing progress container or create one
     */
    findOrCreateProgressContainer() {
        let container = document.getElementById('journey-progress');
        
        if (!container) {
            // Try to find navbar to insert after it
            const navbar = document.querySelector('.navbar, nav');
            if (navbar) {
                container = document.createElement('div');
                container.id = 'journey-progress';
                container.className = 'journey-progress-container';
                navbar.insertAdjacentElement('afterend', container);
            }
        }
        
        return container;
    }

    /**
     * Generate HTML for progress indicator
     */
    generateProgressHTML() {
        const currentStepIndex = this.steps.findIndex(step => step.id === this.currentStep);
        
        return `
            <div class="journey-progress">
                <div class="progress-header">
                    <h3>Booking Progress</h3>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${((currentStepIndex + 1) / this.steps.length) * 100}%"></div>
                    </div>
                </div>
                <div class="progress-steps">
                    ${this.steps.map((step, index) => this.generateStepHTML(step, index)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for individual step
     */
    generateStepHTML(step, index) {
        const isCompleted = this.completedSteps.includes(step.id);
        const isCurrent = this.currentStep === step.id;
        const canAccess = this.canAccessStep(step.id);
        
        let stepClass = 'progress-step';
        if (isCompleted) stepClass += ' completed';
        if (isCurrent) stepClass += ' current';
        if (!canAccess) stepClass += ' disabled';
        
        return `
            <div class="${stepClass}" data-step="${step.id}">
                <div class="step-indicator">
                    <div class="step-icon">${isCompleted ? '✓' : step.icon}</div>
                    <div class="step-number">${index + 1}</div>
                </div>
                <div class="step-content">
                    <div class="step-name">${step.name}</div>
                    <div class="step-description">${step.description}</div>
                </div>
                ${index < this.steps.length - 1 ? '<div class="step-connector"></div>' : ''}
            </div>
        `;
    }

    /**
     * Setup click handlers for progress steps
     */
    setupProgressClickHandlers(container) {
        const steps = container.querySelectorAll('.progress-step:not(.disabled)');
        steps.forEach(step => {
            step.addEventListener('click', (e) => {
                const stepId = step.dataset.step;
                if (stepId !== this.currentStep && this.canAccessStep(stepId)) {
                    this.navigateToStep(stepId);
                }
            });
        });
    }

    /**
     * Setup navigation between steps
     */
    setupStepNavigation() {
        // Add navigation buttons to forms
        this.addNavigationButtons();
        
        // Handle browser back button
        window.addEventListener('popstate', (e) => {
            this.detectCurrentStep();
            this.renderProgressIndicator();
        });
    }

    /**
     * Add next/previous navigation buttons
     */
    addNavigationButtons() {
        const currentStepIndex = this.steps.findIndex(step => step.id === this.currentStep);
        
        // Find form or main content area
        const targetContainer = document.querySelector('form, main, .container');
        if (!targetContainer) return;
        
        const navButtons = document.createElement('div');
        navButtons.className = 'journey-navigation';
        
        let buttonsHTML = '';
        
        // Previous button
        if (currentStepIndex > 0) {
            const prevStep = this.steps[currentStepIndex - 1];
            buttonsHTML += `
                <button type="button" class="btn btn-secondary journey-nav-btn" data-action="previous">
                    ← Back to ${prevStep.name}
                </button>
            `;
        }
        
        // Next button (if applicable)
        if (currentStepIndex < this.steps.length - 1 && this.currentStep !== 'confirmation') {
            const nextStep = this.steps[currentStepIndex + 1];
            buttonsHTML += `
                <button type="button" class="btn btn-primary journey-nav-btn" data-action="next">
                    Continue to ${nextStep.name} →
                </button>
            `;
        }
        
        navButtons.innerHTML = buttonsHTML;
        
        // Insert navigation buttons
        const existingNav = document.querySelector('.journey-navigation');
        if (existingNav) {
            existingNav.replaceWith(navButtons);
        } else {
            targetContainer.appendChild(navButtons);
        }
        
        // Setup click handlers
        navButtons.addEventListener('click', (e) => {
            if (e.target.classList.contains('journey-nav-btn')) {
                const action = e.target.dataset.action;
                this.handleNavigationClick(action);
            }
        });
    }

    /**
     * Handle navigation button clicks
     */
    handleNavigationClick(action) {
        const currentStepIndex = this.steps.findIndex(step => step.id === this.currentStep);
        
        if (action === 'previous' && currentStepIndex > 0) {
            const prevStep = this.steps[currentStepIndex - 1];
            this.navigateToStep(prevStep.id);
        } else if (action === 'next' && currentStepIndex < this.steps.length - 1) {
            const nextStep = this.steps[currentStepIndex + 1];
            
            // Check if current step is completed before allowing navigation
            if (this.completedSteps.includes(this.currentStep)) {
                this.navigateToStep(nextStep.id);
            } else {
                this.showNavigationError('Please complete the current step first');
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for journey events from other components
        window.addEventListener('journeyStepCompleted', (e) => {
            const { stepId, data } = e.detail;
            this.updateJourneyData(stepId, data);
        });
        
        window.addEventListener('journeyStepStarted', (e) => {
            const { stepId } = e.detail;
            this.currentStep = stepId;
            this.saveJourneyData();
            this.renderProgressIndicator();
        });
    }

    /**
     * Show navigation error message
     */
    showNavigationError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.journey-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'journey-error';
            const progressContainer = document.getElementById('journey-progress');
            if (progressContainer) {
                progressContainer.appendChild(errorDiv);
            }
        }
        
        errorDiv.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * Complete current step with data
     */
    completeCurrentStep(data = {}) {
        this.updateJourneyData(this.currentStep, data);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('journeyStepCompleted', {
            detail: { stepId: this.currentStep, data }
        }));
        
        console.log('✅ Step completed:', this.currentStep);
    }

    /**
     * Get journey summary for debugging
     */
    getSummary() {
        return {
            currentStep: this.currentStep,
            completedSteps: this.completedSteps,
            totalSteps: this.steps.length,
            progressPercentage: (this.completedSteps.length / this.steps.length) * 100,
            journeyData: this.journeyData
        };
    }

    /**
     * Reset journey (for testing or new sessions)
     */
    resetJourney() {
        localStorage.removeItem('userJourneyData');
        this.journeyData = {};
        this.completedSteps = [];
        this.currentStep = 'service-selection';
        this.renderProgressIndicator();
        console.log('🔄 Journey reset');
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.journeyTracker === 'undefined') {
        window.journeyTracker = new UserJourneyTracker();
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserJourneyTracker;
}