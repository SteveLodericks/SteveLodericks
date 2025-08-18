// Payment Integration Configuration
// This file contains configuration settings for payment processing

/**
 * Client-Side Payment Configuration
 * SECURITY NOTE: Only client-safe configuration should be stored here.
 * Secret keys must be stored server-side and accessed via environment variables.
 */
const PAYMENT_CONFIG = {
    // Stripe Configuration - Client-side only
    stripe: {
        // Only publishable key can be safely stored client-side
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
        // REMOVED: secretKey and webhookSecret (must be server-side only)
        
        // Supported payment methods for Dutch market
        paymentMethods: [
            'card',           // Credit/Debit cards
            'ideal',          // iDEAL (popular in Netherlands)
            'apple_pay',      // Apple Pay
            'google_pay',     // Google Pay
            'sepa_debit',     // SEPA Direct Debit
            'bancontact',     // Bancontact (Belgium/Netherlands)
            'sofort'          // Sofort (Europe)
        ],
        
        // Currency settings
        currency: 'eur',
        locale: 'nl',
        
        // Appearance customization
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#8fbc8f',
                colorBackground: '#ffffff',
                colorText: '#2c3e50',
                colorDanger: '#e74c3c',
                fontFamily: 'Inter, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px'
            }
        }
    },
    
    // Package Configuration
    packages: {
        'single': {
            id: 'single',
            name: 'Single Session',
            description: 'One 90-minute somatic coaching session',
            price: 120.00,
            currency: 'EUR',
            sessions: 1,
            features: [
                'One-on-one somatic coaching session',
                'Personalized assessment',
                'Trauma-informed approach',
                'In-person or online option',
                'Post-session summary and recommendations'
            ]
        },
        'three-session': {
            id: 'three-session',
            name: '3-Session Package',
            description: 'Three comprehensive 90-minute sessions with support',
            price: 320.00,
            currency: 'EUR',
            originalPrice: 360.00,
            sessions: 3,
            popular: true,
            features: [
                'Three comprehensive coaching sessions',
                'Personalized treatment plan',
                'Home practices and exercises',
                'Email support between sessions',
                'Resource materials included',
                'Progress tracking and adjustments'
            ]
        },
        'six-session': {
            id: 'six-session',
            name: '6-Session Intensive',
            description: 'Complete healing journey with ongoing support',
            price: 600.00,
            currency: 'EUR',
            originalPrice: 720.00,
            sessions: 6,
            features: [
                'Comprehensive healing journey',
                'Deep trauma integration work',
                'Weekly sessions for 6 weeks',
                'Ongoing support and guidance',
                'Complete resource library',
                'Integration practices and homework',
                'Final integration session'
            ]
        }
    },
    
    // Email Configuration
    email: {
        from: {
            name: 'Nicoline Thijssen',
            address: 'hello@nicolinethijssen.nl'
        },
        coach: {
            name: 'Nicoline Thijssen',
            email: 'hello@nicolinethijssen.nl'
        },
        templates: {
            confirmation: 'payment-confirmation',
            booking_instructions: 'booking-instructions',
            coach_notification: 'coach-notification',
            payment_failure: 'payment-failure'
        }
    },
    
    // Website Configuration
    website: {
        name: 'Nicoline Thijssen Somatic Coaching',
        url: 'https://nicolinethijssen.nl',
        supportEmail: 'hello@nicolinethijssen.nl',
        supportPhone: '+31 6 1234 5678'
    },
    
    // Security Settings
    security: {
        // CORS settings for payment forms
        allowedOrigins: [
            'https://nicolinethijssen.nl',
            'https://www.nicolinethijssen.nl'
        ],
        
        // Session timeout for booking links (in milliseconds)
        bookingLinkExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
        
        // Enable/disable payment methods
        enableApplePay: true,
        enableGooglePay: true,
        enableIdeal: true,
        enableCards: true
    },
    
    // Analytics and Tracking
    analytics: {
        // Google Analytics tracking ID
        googleAnalytics: 'GA_MEASUREMENT_ID',
        
        // Facebook Pixel ID
        facebookPixel: 'FB_PIXEL_ID',
        
        // Custom events to track
        events: {
            packageSelected: 'package_selected',
            paymentInitiated: 'payment_initiated',
            paymentCompleted: 'payment_completed',
            paymentFailed: 'payment_failed',
            bookingCompleted: 'booking_completed'
        }
    },
    
    // Environment Settings
    environment: {
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production',
        apiUrl: process.env.API_URL || 'https://api.nicolinethijssen.nl',
        webhookUrl: process.env.WEBHOOK_URL || 'https://nicolinethijssen.nl/webhook/stripe'
    }
};

/**
 * Get configuration for current environment
 * @returns {Object} Environment-specific configuration
 */
function getConfig() {
    if (PAYMENT_CONFIG.environment.isDevelopment) {
        return {
            ...PAYMENT_CONFIG,
            stripe: {
                ...PAYMENT_CONFIG.stripe,
                // Use test keys in development
                publishableKey: 'pk_test_your_test_key_here'
            }
        };
    }
    
    return PAYMENT_CONFIG;
}

/**
 * Get package configuration by ID
 * @param {string} packageId - Package identifier
 * @returns {Object|null} Package configuration
 */
function getPackageConfig(packageId) {
    return PAYMENT_CONFIG.packages[packageId] || null;
}

/**
 * Get all available packages
 * @returns {Array} Array of package configurations
 */
function getAllPackages() {
    return Object.values(PAYMENT_CONFIG.packages);
}

/**
 * Get supported payment methods
 * @returns {Array} Array of payment method identifiers
 */
function getSupportedPaymentMethods() {
    const methods = PAYMENT_CONFIG.stripe.paymentMethods.filter(method => {
        switch (method) {
            case 'apple_pay':
                return PAYMENT_CONFIG.security.enableApplePay;
            case 'google_pay':
                return PAYMENT_CONFIG.security.enableGooglePay;
            case 'ideal':
                return PAYMENT_CONFIG.security.enableIdeal;
            case 'card':
                return PAYMENT_CONFIG.security.enableCards;
            default:
                return true;
        }
    });
    
    return methods;
}

/**
 * Format price for display
 * @param {number} price - Price in euros
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
function formatPrice(price, currency = 'EUR') {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: currency
    }).format(price);
}

/**
 * Validate client-side configuration
 * @returns {Object} Validation results
 */
function validateConfig() {
    const errors = [];
    const warnings = [];
    
    // Check required Stripe publishable key (client-side only)
    if (!PAYMENT_CONFIG.stripe.publishableKey || 
        PAYMENT_CONFIG.stripe.publishableKey.includes('placeholder') ||
        PAYMENT_CONFIG.stripe.publishableKey.includes('your_')) {
        errors.push('Stripe publishable key not configured');
    }
    
    // Validate publishable key format
    if (PAYMENT_CONFIG.stripe.publishableKey && 
        !PAYMENT_CONFIG.stripe.publishableKey.startsWith('pk_')) {
        errors.push('Invalid Stripe publishable key format');
    }
    
    // Check email configuration
    if (!PAYMENT_CONFIG.email.from.address || 
        PAYMENT_CONFIG.email.from.address.includes('example')) {
        warnings.push('Email configuration incomplete');
    }
    
    // Check package pricing
    const packages = Object.values(PAYMENT_CONFIG.packages);
    if (packages.some(pkg => pkg.price <= 0)) {
        errors.push('Invalid package pricing detected');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

// Export configuration and utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PAYMENT_CONFIG,
        getConfig,
        getPackageConfig,
        getAllPackages,
        getSupportedPaymentMethods,
        formatPrice,
        validateConfig
    };
}

// Make config available globally for client-side use
if (typeof window !== 'undefined') {
    window.PAYMENT_CONFIG = getConfig();
}