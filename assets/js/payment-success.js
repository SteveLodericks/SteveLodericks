/**
 * Payment Success Page - Display order details and next steps
 * Integrates with package selection data flow
 */

const PaymentSuccessModule = {
    /**
     * Initialize payment success page
     */
    init() {
        try {
            this.displayOrderDetails();
            this.setupNextSteps();
            this.clearStoredData();
            this.trackSuccessfulPayment();
        } catch (error) {
            console.error('Error initializing payment success page:', error);
        }
    },

    /**
     * Display order details from URL parameters or stored data
     */
    displayOrderDetails() {
        try {
            // Get data from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const paymentIntentId = urlParams.get('payment_intent');
            const packageId = urlParams.get('package');
            const amount = urlParams.get('amount');
            
            // Try to get package data from storage as fallback
            let packageData = null;
            if (window.PackageDataModule) {
                packageData = window.PackageDataModule.getSelectedPackage();
            }
            
            // Package configurations for reference
            const packages = {
                'single-session': {
                    name: 'Individual Sessions',
                    price: 120,
                    description: 'One-on-one somatic coaching sessions'
                },
                'three-session': {
                    name: '3-Session Package',
                    price: 320,
                    description: 'Comprehensive package with support'
                },
                'six-session': {
                    name: '6-Session Intensive',
                    price: 600,
                    description: 'Complete healing journey'
                }
            };
            
            // Determine package info
            let packageName = 'Unknown Package';
            let packageAmount = '€0';
            
            if (packageData) {
                packageName = packageData.name;
                packageAmount = `€${packageData.price}`;
            } else if (packageId && packages[packageId]) {
                packageName = packages[packageId].name;
                packageAmount = `€${packages[packageId].price}`;
            } else if (amount) {
                packageAmount = `€${amount}`;
            }
            
            // Update DOM elements
            this.updateElement('order-package', packageName);
            this.updateElement('order-amount', packageAmount);
            this.updateElement('order-id', paymentIntentId || this.generateOrderId());
            this.updateElement('order-date', new Date().toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));
            
        } catch (error) {
            console.error('Error displaying order details:', error);
            this.showFallbackOrderInfo();
        }
    },

    /**
     * Update DOM element with safe content
     * @param {string} elementId - Element ID to update
     * @param {string} content - Content to display
     */
    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    },

    /**
     * Generate a simple order ID for display
     * @returns {string} Order ID
     */
    generateOrderId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 8);
        return `NC-${timestamp}-${randomPart}`.toUpperCase();
    },

    /**
     * Show fallback order information
     */
    showFallbackOrderInfo() {
        this.updateElement('order-package', 'Somatic Coaching Session');
        this.updateElement('order-amount', 'Payment Received');
        this.updateElement('order-id', this.generateOrderId());
        this.updateElement('order-date', new Date().toLocaleDateString('en-GB'));
    },

    /**
     * Setup next steps and booking flow
     */
    setupNextSteps() {
        try {
            // Add booking button functionality
            const bookingButton = document.querySelector('.btn-book-sessions');
            if (bookingButton) {
                bookingButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Create booking token with payment data
                    const bookingData = this.createBookingData();
                    
                    // Navigate to booking page with token
                    const bookingUrl = new URL('booking.html', window.location.origin + '/pages/');
                    bookingUrl.searchParams.set('token', bookingData.token);
                    bookingUrl.searchParams.set('package', bookingData.packageId);
                    
                    window.location.href = bookingUrl.toString();
                });
            }
            
            // Setup email preferences
            const emailUpdatesCheckbox = document.getElementById('email-updates');
            if (emailUpdatesCheckbox) {
                emailUpdatesCheckbox.addEventListener('change', (e) => {
                    const preference = e.target.checked;
                    localStorage.setItem('emailUpdatesPreference', preference.toString());
                    
                    if (preference) {
                        console.log('User opted in for email updates');
                    }
                });
            }
            
        } catch (error) {
            console.error('Error setting up next steps:', error);
        }
    },

    /**
     * Create booking data for session scheduling
     * @returns {Object} Booking data
     */
    createBookingData() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            token: this.generateBookingToken(),
            packageId: urlParams.get('package') || 'single-session',
            paymentIntentId: urlParams.get('payment_intent'),
            timestamp: Date.now()
        };
    },

    /**
     * Generate booking token for session scheduling
     * @returns {string} Booking token
     */
    generateBookingToken() {
        const data = {
            paid: true,
            timestamp: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        // Simple encoding for demo (in production, use proper JWT)
        return btoa(JSON.stringify(data));
    },

    /**
     * Clear temporary stored data after successful processing
     */
    clearStoredData() {
        try {
            // Clear package selection data from session storage
            sessionStorage.removeItem('selectedPackage');
            
            // Keep user contact info for future use but clear payment-specific data
            const journeyData = sessionStorage.getItem('userJourneyData');
            if (journeyData) {
                sessionStorage.removeItem('userJourneyData');
            }
            
        } catch (error) {
            console.error('Error clearing stored data:', error);
        }
    },

    /**
     * Track successful payment for analytics
     */
    trackSuccessfulPayment() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const packageId = urlParams.get('package');
            const amount = urlParams.get('amount');
            
            // Track with Google Analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'purchase', {
                    transaction_id: urlParams.get('payment_intent'),
                    value: parseFloat(amount) || 0,
                    currency: 'EUR',
                    items: [{
                        item_id: packageId,
                        item_name: `Somatic Coaching - ${packageId}`,
                        category: 'Coaching Services',
                        quantity: 1,
                        price: parseFloat(amount) || 0
                    }]
                });
            }
            
            // Track conversion
            console.log('Payment successful:', {
                package: packageId,
                amount: amount,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error tracking successful payment:', error);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    PaymentSuccessModule.init();
});

// Export for testing
window.PaymentSuccessModule = PaymentSuccessModule;