/**
 * Package Selection Module - Handles direct payment flow from index.html
 * Senior Engineer Implementation - Direct routing without intermediate pages
 */

const PackageSelectionModule = {
    elements: {
        packageButtons: null,
        paymentModal: null
    },

    config: {
        stripePublicKey: 'pk_test_51JrEZHGxsrLq6nQNnAqUaEQ5u4n2nKe6n6c7G4L6bJ4M7O8v8f3N6vD7P9Z5Q4q2', // Replace with actual key
        apiEndpoint: '/api/create-payment-intent'
    },

    /**
     * Initialize package selection functionality
     */
    init() {
        try {
            this.elements.packageButtons = document.querySelectorAll('.package-select-btn');
            
            if (this.elements.packageButtons.length === 0) {
                console.warn('No package selection buttons found');
                return;
            }

            this.bindEvents();
            console.log('Package selection module initialized successfully');
        } catch (error) {
            console.error('Error initializing package selection:', error);
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        this.elements.packageButtons.forEach(button => {
            button.addEventListener('click', this.handlePackageSelection.bind(this));
            
            // Add hover effects for better UX
            button.addEventListener('mouseenter', this.handlePackageHover.bind(this));
            button.addEventListener('mouseleave', this.handlePackageLeave.bind(this));
            
            // Add keyboard support for accessibility
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handlePackageSelection(e);
                }
            });
        });
        
        // Add keyboard support for service cards
        document.querySelectorAll('.service-card[role="button"]').forEach(card => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const button = card.querySelector('.package-select-btn');
                    if (button && !button.disabled) {
                        button.click();
                    }
                }
            });
            
            // Add focus styles for keyboard navigation
            card.addEventListener('focus', () => {
                card.classList.add('selecting');
            });
            
            card.addEventListener('blur', () => {
                if (!card.classList.contains('selected')) {
                    card.classList.remove('selecting');
                }
            });
        });
    },

    /**
     * Handle package hover for visual feedback
     * @param {Event} event - Mouse enter event
     */
    handlePackageHover(event) {
        const serviceCard = event.currentTarget.closest('.service-card');
        if (serviceCard && !serviceCard.classList.contains('selected')) {
            serviceCard.classList.add('selecting');
            
            // Add subtle animation to the button text
            const button = event.currentTarget;
            if (button && !button.classList.contains('loading')) {
                button.style.transform = 'scale(1.05)';
            }
        }
    },

    /**
     * Handle package leave hover state
     * @param {Event} event - Mouse leave event
     */
    handlePackageLeave(event) {
        const serviceCard = event.currentTarget.closest('.service-card');
        if (serviceCard && !serviceCard.classList.contains('selected')) {
            serviceCard.classList.remove('selecting');
            
            // Reset button transform
            const button = event.currentTarget;
            if (button && !button.classList.contains('loading')) {
                button.style.transform = '';
            }
        }
    },

    /**
     * Handle package selection - directly initiate payment flow
     * @param {Event} event - Click event
     */
    async handlePackageSelection(event) {
        event.preventDefault();
        
        const button = event.currentTarget;
        const serviceCard = button.closest('.service-card');
        const packageData = this.extractPackageData(button);
        
        try {
            // Clear any existing selections
            this.clearAllSelections();
            
            // Mark this card as selected with animation
            this.markAsSelected(serviceCard, button);
            
            // Store package data for payment process
            this.storePackageData(packageData);
            
            // Show success feedback
            this.showSuccessMessage(`${packageData.name} selected! Redirecting to payment...`);
            
            // Add slight delay for user feedback before redirect
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Initialize payment flow directly
            await this.initiatePaymentFlow(packageData);
            
        } catch (error) {
            console.error('Error handling package selection:', error);
            this.clearAllSelections();
            this.showErrorMessage('Unable to process your selection. Please try again.');
        }
    },

    /**
     * Clear all package selections
     */
    clearAllSelections() {
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected', 'selecting');
        });
        
        document.querySelectorAll('.package-select-btn').forEach(btn => {
            btn.classList.remove('loading');
            btn.disabled = false;
        });
    },

    /**
     * Mark a service card as selected
     * @param {HTMLElement} serviceCard - The service card element
     * @param {HTMLElement} button - The selection button
     */
    markAsSelected(serviceCard, button) {
        if (serviceCard) {
            serviceCard.classList.add('selected');
            serviceCard.classList.remove('selecting');
        }
        
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
            
            // Add success animation
            this.addSuccessAnimation(serviceCard);
        }
    },

    /**
     * Add success animation to selected card
     * @param {HTMLElement} serviceCard - The service card element
     */
    addSuccessAnimation(serviceCard) {
        if (!serviceCard) return;
        
        // Create a temporary success indicator
        const successIndicator = document.createElement('div');
        successIndicator.className = 'selection-success-indicator';
        successIndicator.innerHTML = '✓ Selected';
        successIndicator.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: var(--color-sage-600);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10;
            animation: slideInFromRight 0.5s ease-out;
            box-shadow: 0 4px 12px rgba(122, 137, 102, 0.3);
        `;
        
        serviceCard.appendChild(successIndicator);
        
        // Remove the indicator after animation
        setTimeout(() => {
            if (successIndicator.parentNode) {
                successIndicator.remove();
            }
        }, 2000);
    },

    /**
     * Extract package data from button element
     * @param {HTMLElement} button - Package selection button
     * @returns {Object} Package data
     */
    extractPackageData(button) {
        return {
            id: button.dataset.package,
            name: button.dataset.name,
            price: parseInt(button.dataset.price),
            currency: 'eur',
            description: button.dataset.description,
            timestamp: Date.now()
        };
    },

    /**
     * Store package data in session/local storage
     * @param {Object} packageData - Package information
     */
    storePackageData(packageData) {
        try {
            // Store in sessionStorage for current session
            sessionStorage.setItem('selectedPackage', JSON.stringify(packageData));
            
            // Also store in localStorage as backup
            localStorage.setItem('lastSelectedPackage', JSON.stringify(packageData));
            
            // Trigger custom event for other modules
            window.dispatchEvent(new CustomEvent('packageSelected', {
                detail: packageData
            }));
        } catch (error) {
            console.error('Error storing package data:', error);
        }
    },

    /**
     * Initiate payment flow directly without intermediate page
     * @param {Object} packageData - Selected package information
     */
    async initiatePaymentFlow(packageData) {
        try {
            // Create payment intent on server
            const paymentIntent = await this.createPaymentIntent(packageData);
            
            if (!paymentIntent) {
                throw new Error('Failed to create payment intent');
            }
            
            // Redirect to payment page with package data
            const paymentUrl = new URL('pages/payment.html', window.location.origin);
            paymentUrl.searchParams.set('package', packageData.id);
            paymentUrl.searchParams.set('token', paymentIntent.token);
            
            // Navigate to payment page
            window.location.href = paymentUrl.toString();
            
        } catch (error) {
            console.error('Error initiating payment flow:', error);
            throw error;
        }
    },

    /**
     * Create payment intent on server
     * @param {Object} packageData - Package information
     * @returns {Object} Payment intent response
     */
    async createPaymentIntent(packageData) {
        try {
            // In production, this would call your backend API
            // For now, we'll simulate the payment intent creation
            
            const response = await this.simulatePaymentIntentCreation(packageData);
            return response;
            
            /* Production implementation:
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    package: packageData,
                    amount: packageData.price * 100, // Convert to cents
                    currency: packageData.currency
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }
            
            return await response.json();
            */
            
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    },

    /**
     * Simulate payment intent creation (for development)
     * @param {Object} packageData - Package information
     * @returns {Promise<Object>} Simulated payment intent
     */
    async simulatePaymentIntentCreation(packageData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            success: true,
            token: this.generatePaymentToken(),
            amount: packageData.price * 100,
            currency: packageData.currency,
            clientSecret: `pi_${this.generateRandomId()}_secret_${this.generateRandomId()}`
        };
    },

    /**
     * Generate secure payment token
     * @returns {string} Payment token
     */
    generatePaymentToken() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2);
        return `pt_${timestamp}_${randomPart}`;
    },

    /**
     * Generate random ID for simulation
     * @returns {string} Random ID
     */
    generateRandomId() {
        return Math.random().toString(36).substring(2, 15);
    },

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} isLoading - Loading state
     */
    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            button.setAttribute('data-original-text', button.textContent);
            button.textContent = 'Processing...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
                button.removeAttribute('data-original-text');
            }
        }
    },

    /**
     * Show error message to user
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    },

    /**
     * Show success message to user
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    },

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', 'info')
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.package-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `package-notification package-notification--${type}`;
        notification.innerHTML = `
            <div class="package-notification__icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
            </div>
            <div class="package-notification__message">${message}</div>
            <button class="package-notification__close" aria-label="Close notification">×</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--color-sage-600)' : type === 'error' ? '#e53e3e' : 'var(--color-neutral-600)'};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 320px;
            max-width: 400px;
            animation: slideInFromRight 0.3s ease-out;
            font-size: 14px;
            font-weight: 500;
        `;

        // Add close functionality
        const closeButton = notification.querySelector('.package-notification__close');
        closeButton.addEventListener('click', () => {
            notification.style.animation = 'slideOutToRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutToRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, type === 'error' ? 5000 : 3000);

        document.body.appendChild(notification);
    }
};

/**
 * Package Data Retrieval Module - Handles package data across pages
 */
const PackageDataModule = {
    /**
     * Get selected package data
     * @returns {Object|null} Package data or null if not found
     */
    getSelectedPackage() {
        try {
            // Try sessionStorage first (current session)
            const sessionData = sessionStorage.getItem('selectedPackage');
            if (sessionData) {
                return JSON.parse(sessionData);
            }
            
            // Fallback to localStorage
            const localData = localStorage.getItem('lastSelectedPackage');
            if (localData) {
                return JSON.parse(localData);
            }
            
            // Check URL parameters as final fallback
            return this.getPackageFromUrl();
            
        } catch (error) {
            console.error('Error retrieving package data:', error);
            return null;
        }
    },

    /**
     * Get package data from URL parameters
     * @returns {Object|null} Package data from URL or null
     */
    getPackageFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const packageId = urlParams.get('package');
            
            if (!packageId) {
                return null;
            }
            
            // Define package configurations
            const packageConfigs = {
                'single-session': {
                    id: 'single-session',
                    name: 'Individual Sessions',
                    price: 120,
                    currency: 'eur',
                    description: 'One-on-one somatic coaching sessions tailored to your unique needs.'
                },
                'three-session': {
                    id: 'three-session',
                    name: '3-Session Package',
                    price: 320,
                    currency: 'eur',
                    description: 'Dive deeper into your healing journey with this comprehensive package.'
                },
                'six-session': {
                    id: 'six-session',
                    name: '6-Session Intensive',
                    price: 600,
                    currency: 'eur',
                    description: 'A transformative journey for deep, lasting change.'
                }
            };
            
            return packageConfigs[packageId] || null;
            
        } catch (error) {
            console.error('Error parsing URL package data:', error);
            return null;
        }
    },

    /**
     * Clear stored package data
     */
    clearPackageData() {
        try {
            sessionStorage.removeItem('selectedPackage');
            localStorage.removeItem('lastSelectedPackage');
        } catch (error) {
            console.error('Error clearing package data:', error);
        }
    }
};

/**
 * Smooth Scrolling Module - Handles anchor link navigation
 */
const SmoothScrollModule = {
    /**
     * Initialize smooth scrolling for anchor links
     */
    init() {
        try {
            const anchorLinks = document.querySelectorAll('a[href*="#services"]');
            anchorLinks.forEach(link => {
                link.addEventListener('click', this.handleSmoothScroll.bind(this));
            });
        } catch (error) {
            console.error('Error initializing smooth scroll:', error);
        }
    },

    /**
     * Handle smooth scroll to services section
     * @param {Event} event - Click event
     */
    handleSmoothScroll(event) {
        const href = event.currentTarget.getAttribute('href');
        
        // Check if this is an anchor link to services section
        if (href.includes('#services')) {
            // If it's a link to index.html#services from another page, let it navigate normally
            if (href.includes('index.html') && window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
                return; // Let browser handle the navigation
            }
            
            // If we're on the same page, prevent default and scroll smoothly
            if (window.location.pathname === '/index.html' || window.location.pathname.endsWith('/') || window.location.pathname === '/') {
                event.preventDefault();
                
                const servicesSection = document.getElementById('services');
                if (servicesSection) {
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 80;
                    const offsetTop = servicesSection.offsetTop - navbarHeight;
                    
                    window.scrollTo({
                        top: Math.max(0, offsetTop),
                        behavior: 'smooth'
                    });
                    
                    // Update URL hash
                    if (history.pushState) {
                        history.pushState(null, null, '#services');
                    }
                }
            }
        }
    }
};

// Initialize modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    PackageSelectionModule.init();
    SmoothScrollModule.init();
});

// Export modules for use in other files
window.PackageSelectionModule = PackageSelectionModule;
window.PackageDataModule = PackageDataModule;