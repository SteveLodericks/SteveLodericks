/**
 * Security Utilities
 * Provides security functions for input validation, sanitization, and protection
 * against common web vulnerabilities
 */

/**
 * Security Module - Centralized security utilities
 */
const SecurityModule = {
    
    /**
     * Input sanitization and validation utilities
     */
    input: {
        /**
         * Sanitize HTML input to prevent XSS attacks
         * @param {string} input - Raw user input
         * @returns {string} Sanitized input
         */
        sanitizeHtml(input) {
            if (typeof input !== 'string') return '';
            
            const element = document.createElement('div');
            element.textContent = input;
            return element.innerHTML;
        },

        /**
         * Validate and sanitize email address
         * @param {string} email - Email address to validate
         * @returns {Object} Validation result with sanitized email
         */
        validateEmail(email) {
            if (typeof email !== 'string') {
                return { isValid: false, sanitized: '', error: 'Email must be a string' };
            }

            const sanitized = email.trim().toLowerCase();
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            
            const isValid = emailRegex.test(sanitized) && sanitized.length <= 254;
            
            return {
                isValid,
                sanitized: isValid ? sanitized : '',
                error: isValid ? null : 'Invalid email format'
            };
        },

        /**
         * Validate and sanitize name input
         * @param {string} name - Name to validate
         * @returns {Object} Validation result
         */
        validateName(name) {
            if (typeof name !== 'string') {
                return { isValid: false, sanitized: '', error: 'Name must be a string' };
            }

            const sanitized = this.sanitizeHtml(name.trim());
            const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
            const isValid = nameRegex.test(sanitized) && sanitized.length >= 2;

            return {
                isValid,
                sanitized: isValid ? sanitized : '',
                error: isValid ? null : 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
            };
        },

        /**
         * Validate and sanitize message input
         * @param {string} message - Message to validate
         * @returns {Object} Validation result
         */
        validateMessage(message) {
            if (typeof message !== 'string') {
                return { isValid: false, sanitized: '', error: 'Message must be a string' };
            }

            const sanitized = this.sanitizeHtml(message.trim());
            const isValid = sanitized.length >= 10 && sanitized.length <= 2000;

            return {
                isValid,
                sanitized: isValid ? sanitized : '',
                error: isValid ? null : 'Message must be between 10 and 2000 characters'
            };
        }
    },

    /**
     * CSRF protection utilities
     */
    csrf: {
        /**
         * Generate CSRF token
         * @returns {string} CSRF token
         */
        generateToken() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },

        /**
         * Set CSRF token in session storage
         * @param {string} token - CSRF token
         */
        setToken(token) {
            try {
                sessionStorage.setItem('csrf_token', token);
            } catch (error) {
                console.warn('Could not store CSRF token:', error);
            }
        },

        /**
         * Get CSRF token from session storage
         * @returns {string|null} CSRF token
         */
        getToken() {
            try {
                return sessionStorage.getItem('csrf_token');
            } catch (error) {
                console.warn('Could not retrieve CSRF token:', error);
                return null;
            }
        },

        /**
         * Initialize CSRF protection
         * @returns {string} Generated token
         */
        init() {
            const token = this.generateToken();
            this.setToken(token);
            return token;
        }
    },

    /**
     * Rate limiting utilities
     */
    rateLimit: {
        attempts: new Map(),

        /**
         * Check if action is rate limited
         * @param {string} action - Action identifier
         * @param {number} maxAttempts - Maximum attempts allowed
         * @param {number} windowMs - Time window in milliseconds
         * @returns {Object} Rate limit status
         */
        checkLimit(action, maxAttempts = 5, windowMs = 60000) {
            const now = Date.now();
            const key = action;
            
            if (!this.attempts.has(key)) {
                this.attempts.set(key, []);
            }

            const attempts = this.attempts.get(key);
            
            // Remove old attempts outside the time window
            const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
            this.attempts.set(key, validAttempts);

            const isLimited = validAttempts.length >= maxAttempts;
            
            if (!isLimited) {
                validAttempts.push(now);
                this.attempts.set(key, validAttempts);
            }

            return {
                isLimited,
                remainingAttempts: Math.max(0, maxAttempts - validAttempts.length),
                resetTime: validAttempts.length > 0 ? validAttempts[0] + windowMs : now
            };
        }
    },

    /**
     * Content Security Policy utilities
     */
    csp: {
        /**
         * Check if current page has CSP headers
         * @returns {boolean} CSP status
         */
        hasCSP() {
            const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
            return metaTags.length > 0;
        },

        /**
         * Log CSP violations (if any)
         */
        logViolations() {
            document.addEventListener('securitypolicyviolation', (event) => {
                console.warn('CSP Violation:', {
                    directive: event.violatedDirective,
                    blockedURI: event.blockedURI,
                    source: event.sourceFile,
                    line: event.lineNumber
                });
                
                // In production, you could send this to your logging service
                // this.sendViolationReport(event);
            });
        }
    },

    /**
     * Initialize security module
     */
    init() {
        try {
            // Initialize CSRF protection
            this.csrf.init();
            
            // Set up CSP violation logging
            this.csp.logViolations();
            
            // Warn about missing security headers
            if (!this.csp.hasCSP()) {
                console.warn('Content Security Policy not detected. Consider adding CSP headers for enhanced security.');
            }

            console.log('Security module initialized');
        } catch (error) {
            console.error('Error initializing security module:', error);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityModule;
}

// Make available globally for client-side use
if (typeof window !== 'undefined') {
    window.SecurityModule = SecurityModule;
}