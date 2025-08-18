/**
 * Main Website Functionality
 * Enhanced with modern JavaScript practices and error handling
 */

/**
 * Navigation Module - Handles mobile navigation and interactions
 */
const NavigationModule = {
    elements: {
        hamburger: null,
        navMenu: null,
        navLinks: []
    },

    /**
     * Initialize navigation functionality
     */
    init() {
        try {
            this.elements.hamburger = document.getElementById('hamburger');
            this.elements.navMenu = document.getElementById('nav-menu');
            this.elements.navLinks = document.querySelectorAll('.nav-link');

            if (!this.elements.hamburger || !this.elements.navMenu) {
                console.warn('Navigation elements not found');
                return;
            }

            this.bindEvents();
        } catch (error) {
            console.error('Error initializing navigation:', error);
        }
    },

    /**
     * Bind navigation event listeners
     */
    bindEvents() {
        // Mobile menu toggle
        this.elements.hamburger.addEventListener('click', this.toggleMobileMenu.bind(this));

        // Close mobile menu when clicking on links
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', this.closeMobileMenu.bind(this));
        });

        // Close menu on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Close menu on escape key
        document.addEventListener('keydown', this.handleEscapeKey.bind(this));
    },

    /**
     * Toggle mobile navigation menu
     * @param {Event} event - Click event
     */
    toggleMobileMenu(event) {
        event.stopPropagation();
        this.elements.hamburger.classList.toggle('active');
        this.elements.navMenu.classList.toggle('active');
        
        // Update ARIA attributes for accessibility
        const isExpanded = this.elements.navMenu.classList.contains('active');
        this.elements.hamburger.setAttribute('aria-expanded', isExpanded);
    },

    /**
     * Close mobile navigation menu
     */
    closeMobileMenu() {
        this.elements.hamburger.classList.remove('active');
        this.elements.navMenu.classList.remove('active');
        this.elements.hamburger.setAttribute('aria-expanded', 'false');
    },

    /**
     * Handle clicks outside navigation menu
     * @param {Event} event - Click event
     */
    handleOutsideClick(event) {
        if (!this.elements.navMenu.contains(event.target) && 
            !this.elements.hamburger.contains(event.target)) {
            this.closeMobileMenu();
        }
    },

    /**
     * Handle escape key press
     * @param {Event} event - Keyboard event
     */
    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.elements.navMenu.classList.contains('active')) {
            this.closeMobileMenu();
        }
    }
};

/**
 * Scroll Module - Handles smooth scrolling and scroll effects
 */
const ScrollModule = {
    elements: {
        navbar: null
    },
    
    config: {
        navbarOffset: 80,
        scrollThreshold: 100
    },

    /**
     * Initialize scroll functionality
     */
    init() {
        try {
            this.elements.navbar = document.querySelector('.navbar');
            this.bindEvents();
            this.setupSmoothScrolling();
        } catch (error) {
            console.error('Error initializing scroll module:', error);
        }
    },

    /**
     * Bind scroll event listeners
     */
    bindEvents() {
        // Throttled scroll event for performance
        let scrollTimer = null;
        window.addEventListener('scroll', () => {
            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }
            scrollTimer = setTimeout(this.handleScroll.bind(this), 10);
        });
    },

    /**
     * Handle window scroll events
     */
    handleScroll() {
        this.updateNavbarAppearance();
    },

    /**
     * Update navbar appearance based on scroll position
     */
    updateNavbarAppearance() {
        if (!this.elements.navbar) return;

        const scrollY = window.scrollY;
        const isScrolled = scrollY > this.config.scrollThreshold;

        if (isScrolled) {
            this.elements.navbar.classList.add('navbar--scrolled');
        } else {
            this.elements.navbar.classList.remove('navbar--scrolled');
        }
    },

    /**
     * Setup smooth scrolling for anchor links
     */
    setupSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(anchor => {
            anchor.addEventListener('click', this.handleAnchorClick.bind(this));
        });
    },

    /**
     * Handle anchor link clicks with smooth scrolling
     * @param {Event} event - Click event
     */
    handleAnchorClick(event) {
        event.preventDefault();
        
        const href = event.currentTarget.getAttribute('href');
        const target = document.querySelector(href);
        
        if (!target) {
            console.warn(`Target element not found for href: ${href}`);
            return;
        }

        const offsetTop = target.offsetTop - this.config.navbarOffset;
        
        window.scrollTo({
            top: Math.max(0, offsetTop),
            behavior: 'smooth'
        });

        // Update URL hash without jumping
        if (history.pushState) {
            history.pushState(null, null, href);
        }
    }
};

/**
 * Form Module - Handles form validation and submission
 */
const FormModule = {
    elements: {
        contactForm: null
    },

    /**
     * Initialize form functionality
     */
    init() {
        try {
            this.elements.contactForm = document.getElementById('contactForm');
            
            if (this.elements.contactForm) {
                this.bindEvents();
            }
        } catch (error) {
            console.error('Error initializing form module:', error);
        }
    },

    /**
     * Bind form event listeners
     */
    bindEvents() {
        this.elements.contactForm.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Add real-time validation
        const inputs = this.elements.contactForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this));
            input.addEventListener('input', this.clearFieldError.bind(this));
        });
    },

    /**
     * Handle form submission with rate limiting and security
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        // Check rate limiting if SecurityModule is available
        if (typeof SecurityModule !== 'undefined') {
            const rateLimitResult = SecurityModule.rateLimit.checkLimit('contact-form', 3, 300000); // 3 attempts per 5 minutes
            if (rateLimitResult.isLimited) {
                const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000 / 60);
                this.showErrorMessage(`Too many attempts. Please wait ${waitTime} minutes before trying again.`);
                return;
            }
        }
        
        const formData = new FormData(event.target);
        const data = {
            name: formData.get('name')?.trim(),
            email: formData.get('email')?.trim(),
            message: formData.get('message')?.trim()
        };

        // Validate all fields
        if (!this.validateForm(data)) {
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        await this.submitForm(data, submitButton, event.target);
    },

    /**
     * Validate entire form using SecurityModule
     * @param {Object} data - Form data
     * @returns {boolean} Validation result
     */
    validateForm(data) {
        let isValid = true;

        // Use SecurityModule for validation if available
        if (typeof SecurityModule !== 'undefined') {
            // Validate name
            const nameValidation = SecurityModule.input.validateName(data.name);
            if (!nameValidation.isValid) {
                this.showFieldError('name', nameValidation.error);
                isValid = false;
            } else {
                data.name = nameValidation.sanitized;
            }

            // Validate email
            const emailValidation = SecurityModule.input.validateEmail(data.email);
            if (!emailValidation.isValid) {
                this.showFieldError('email', emailValidation.error);
                isValid = false;
            } else {
                data.email = emailValidation.sanitized;
            }

            // Validate message
            const messageValidation = SecurityModule.input.validateMessage(data.message);
            if (!messageValidation.isValid) {
                this.showFieldError('message', messageValidation.error);
                isValid = false;
            } else {
                data.message = messageValidation.sanitized;
            }
        } else {
            // Fallback validation
            if (!data.name) {
                this.showFieldError('name', 'Name is required');
                isValid = false;
            }

            if (!data.email) {
                this.showFieldError('email', 'Email is required');
                isValid = false;
            } else if (!this.isValidEmail(data.email)) {
                this.showFieldError('email', 'Please enter a valid email address');
                isValid = false;
            }

            if (!data.message) {
                this.showFieldError('message', 'Message is required');
                isValid = false;
            } else if (data.message.length < 10) {
                this.showFieldError('message', 'Message must be at least 10 characters long');
                isValid = false;
            }
        }

        return isValid;
    },

    /**
     * Validate individual field
     * @param {Event} event - Blur event
     */
    validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        const name = field.name;

        this.clearFieldError(event);

        switch (name) {
            case 'name':
                if (!value) {
                    this.showFieldError(name, 'Name is required');
                }
                break;
            case 'email':
                if (!value) {
                    this.showFieldError(name, 'Email is required');
                } else if (!this.isValidEmail(value)) {
                    this.showFieldError(name, 'Please enter a valid email address');
                }
                break;
            case 'message':
                if (!value) {
                    this.showFieldError(name, 'Message is required');
                } else if (value.length < 10) {
                    this.showFieldError(name, 'Message must be at least 10 characters long');
                }
                break;
        }
    },

    /**
     * Show field error
     * @param {string} fieldName - Field name
     * @param {string} message - Error message
     */
    showFieldError(fieldName, message) {
        const field = this.elements.contactForm.querySelector(`[name="${fieldName}"]`);
        if (!field) return;

        field.classList.add('form__input--error');
        
        let errorElement = field.parentNode.querySelector('.form__error-text');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form__error-text';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    },

    /**
     * Clear field error
     * @param {Event} event - Input event
     */
    clearFieldError(event) {
        const field = event.target;
        field.classList.remove('form__input--error');
        
        const errorElement = field.parentNode.querySelector('.form__error-text');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },

    /**
     * Submit form data
     * @param {Object} data - Form data
     * @param {HTMLElement} submitButton - Submit button
     * @param {HTMLFormElement} form - Form element
     */
    async submitForm(data, submitButton, form) {
        const originalText = submitButton.textContent;
        
        try {
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            // In production, replace with actual API call
            await this.simulateFormSubmission(data);
            
            this.showSuccessMessage('Thank you for your message! I will get back to you within 24 hours.');
            form.reset();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showErrorMessage('Sorry, there was an error sending your message. Please try again.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    },

    /**
     * Simulate form submission (replace with actual API call)
     * @param {Object} data - Form data
     * @returns {Promise} Promise that resolves after delay
     */
    simulateFormSubmission(data) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                // Simulate random failure (5% chance)
                if (Math.random() < 0.05) {
                    reject(new Error('Network error'));
                } else {
                    resolve({ success: true });
                }
            }, 1500);
        });
    },

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccessMessage(message) {
        // You could implement a toast notification system here
        alert(message);
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        // You could implement a toast notification system here
        alert(message);
    },

    /**
     * Validate email format
     * @param {string} email - Email address
     * @returns {boolean} Validation result
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};

/**
 * Animation Module - Handles scroll-based animations and effects
 */
const AnimationModule = {
    observer: null,
    
    config: {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    },

    /**
     * Initialize animation system
     */
    init() {
        try {
            this.setupIntersectionObserver();
            this.prepareAnimatedElements();
        } catch (error) {
            console.error('Error initializing animation module:', error);
        }
    },

    /**
     * Setup intersection observer for scroll animations
     */
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            this.config
        );
    },

    /**
     * Handle intersection observer entries
     * @param {IntersectionObserverEntry[]} entries - Observed entries
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.animateElementIn(entry.target);
                // Stop observing once animated (performance optimization)
                this.observer.unobserve(entry.target);
            }
        });
    },

    /**
     * Animate element into view
     * @param {HTMLElement} element - Element to animate
     */
    animateElementIn(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        element.classList.add('animated');
    },

    /**
     * Prepare elements for animation
     */
    prepareAnimatedElements() {
        const selectors = [
            '.card',
            '.service-card',
            '.testimonial-card',
            '.step',
            '.hero__content',
            '.hero__image'
        ];

        const animatedElements = document.querySelectorAll(selectors.join(', '));
        
        animatedElements.forEach((element, index) => {
            // Set initial animation state
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            
            // Start observing
            this.observer.observe(element);
        });
    },

    /**
     * Clean up animation observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
};

/**
 * Main Application - Initialize all modules
 */
const App = {
    modules: [
        NavigationModule,
        ScrollModule,
        FormModule,
        AnimationModule
    ],

    /**
     * Initialize the application
     */
    init() {
        try {
            console.log('Initializing website application...');
            
            this.modules.forEach(module => {
                if (module && typeof module.init === 'function') {
                    module.init();
                }
            });

            console.log('Website application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    },

    /**
     * Clean up application resources
     */
    destroy() {
        this.modules.forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
    }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', App.init.bind(App));

// Clean up on page unload
window.addEventListener('beforeunload', App.destroy.bind(App));

// Service card hover effects
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Testimonial carousel functionality (for future enhancement)
class TestimonialCarousel {
    constructor() {
        this.currentIndex = 0;
        this.testimonials = document.querySelectorAll('.testimonial-card');
        this.init();
    }
    
    init() {
        // Add carousel functionality if needed
        // This is a placeholder for future enhancement
    }
}

// Loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Animate hero elements on load
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroButtons = document.querySelector('.hero-buttons');
    
    if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(30px)';
        heroTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 300);
    }
    
    if (heroSubtitle) {
        heroSubtitle.style.opacity = '0';
        heroSubtitle.style.transform = 'translateY(30px)';
        heroSubtitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            heroSubtitle.style.opacity = '1';
            heroSubtitle.style.transform = 'translateY(0)';
        }, 600);
    }
    
    if (heroButtons) {
        heroButtons.style.opacity = '0';
        heroButtons.style.transform = 'translateY(30px)';
        heroButtons.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            heroButtons.style.opacity = '1';
            heroButtons.style.transform = 'translateY(0)';
        }, 900);
    }
});

// Booking system placeholder (will be integrated in next phase)
document.querySelectorAll('a[href="#book"]').forEach(link => {
    link.addEventListener('click', (e) => {
        // For now, just scroll to the booking section
        // Payment and booking integration will be added in the next task
        console.log('Booking system will be integrated in the next development phase');
    });
});

// Form input focus effects
document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

// Lazy loading for images (when professional photos are added)
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);

// SEO and Analytics placeholder
function initializeAnalytics() {
    // Google Analytics will be added here
    console.log('Analytics integration ready');
}

// Cookie consent (basic implementation)
function showCookieConsent() {
    // Basic cookie consent implementation
    if (!localStorage.getItem('cookieConsent')) {
        // Create cookie consent banner (can be enhanced later)
        console.log('Cookie consent system ready for implementation');
    }
}

// Initialize all functions
document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
    showCookieConsent();
});

// Performance optimization
if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
        // Non-critical initialization
        console.log('Performance optimizations loaded');
    });
}