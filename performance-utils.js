/**
 * Performance Utilities
 * Provides performance optimization functions for loading, caching, and monitoring
 */

/**
 * Performance Module - Centralized performance optimization utilities
 */
const PerformanceModule = {
    
    /**
     * Resource loading optimization
     */
    loader: {
        /**
         * Lazy load images with intersection observer
         * @param {string} selector - CSS selector for images to lazy load
         */
        lazyLoadImages(selector = 'img[data-src]') {
            const images = document.querySelectorAll(selector);
            
            if (!images.length) return;

            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                            img.classList.remove('lazy');
                            img.classList.add('lazy-loaded');
                        }
                        
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            images.forEach(img => imageObserver.observe(img));
        },

        /**
         * Preload critical resources
         * @param {Array} resources - Array of resource URLs to preload
         * @param {string} type - Resource type ('script', 'style', 'font', etc.)
         */
        preloadResources(resources, type = 'script') {
            resources.forEach(url => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = url;
                link.as = type;
                
                if (type === 'font') {
                    link.crossOrigin = 'anonymous';
                }
                
                document.head.appendChild(link);
            });
        },

        /**
         * Load script asynchronously
         * @param {string} src - Script source URL
         * @param {Object} options - Loading options
         * @returns {Promise} Promise that resolves when script loads
         */
        loadScriptAsync(src, options = {}) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = options.async !== false;
                script.defer = options.defer === true;
                
                script.onload = resolve;
                script.onerror = reject;
                
                document.head.appendChild(script);
            });
        }
    },

    /**
     * Caching utilities
     */
    cache: {
        storage: new Map(),

        /**
         * Set item in memory cache with expiration
         * @param {string} key - Cache key
         * @param {*} value - Value to cache
         * @param {number} ttl - Time to live in milliseconds
         */
        set(key, value, ttl = 300000) { // 5 minutes default
            const expiry = Date.now() + ttl;
            this.storage.set(key, { value, expiry });
        },

        /**
         * Get item from memory cache
         * @param {string} key - Cache key
         * @returns {*} Cached value or null if expired/not found
         */
        get(key) {
            const item = this.storage.get(key);
            
            if (!item) return null;
            
            if (Date.now() > item.expiry) {
                this.storage.delete(key);
                return null;
            }
            
            return item.value;
        },

        /**
         * Clear expired cache entries
         */
        cleanup() {
            const now = Date.now();
            for (const [key, item] of this.storage.entries()) {
                if (now > item.expiry) {
                    this.storage.delete(key);
                }
            }
        },

        /**
         * Store data in localStorage with expiration
         * @param {string} key - Storage key
         * @param {*} value - Value to store
         * @param {number} ttl - Time to live in milliseconds
         */
        setLocal(key, value, ttl = 86400000) { // 24 hours default
            try {
                const item = {
                    value,
                    expiry: Date.now() + ttl
                };
                localStorage.setItem(key, JSON.stringify(item));
            } catch (error) {
                console.warn('LocalStorage not available or full:', error);
            }
        },

        /**
         * Get data from localStorage with expiration check
         * @param {string} key - Storage key
         * @returns {*} Stored value or null if expired/not found
         */
        getLocal(key) {
            try {
                const itemStr = localStorage.getItem(key);
                if (!itemStr) return null;

                const item = JSON.parse(itemStr);
                
                if (Date.now() > item.expiry) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return item.value;
            } catch (error) {
                console.warn('Error reading from localStorage:', error);
                return null;
            }
        }
    },

    /**
     * Function optimization utilities
     */
    optimize: {
        /**
         * Debounce function calls
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         * @param {boolean} immediate - Execute on leading edge
         * @returns {Function} Debounced function
         */
        debounce(func, wait, immediate = false) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func(...args);
                };
                
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                
                if (callNow) func(...args);
            };
        },

        /**
         * Throttle function calls
         * @param {Function} func - Function to throttle
         * @param {number} limit - Time limit in milliseconds
         * @returns {Function} Throttled function
         */
        throttle(func, limit) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Memoize function results
         * @param {Function} func - Function to memoize
         * @param {Function} keyGenerator - Custom key generator
         * @returns {Function} Memoized function
         */
        memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
            const cache = new Map();
            
            return function memoizedFunction(...args) {
                const key = keyGenerator(...args);
                
                if (cache.has(key)) {
                    return cache.get(key);
                }
                
                const result = func.apply(this, args);
                cache.set(key, result);
                return result;
            };
        }
    },

    /**
     * Performance monitoring utilities
     */
    monitor: {
        metrics: new Map(),

        /**
         * Start performance measurement
         * @param {string} name - Measurement name
         */
        start(name) {
            this.metrics.set(name, performance.now());
        },

        /**
         * End performance measurement and log result
         * @param {string} name - Measurement name
         * @returns {number} Duration in milliseconds
         */
        end(name) {
            const startTime = this.metrics.get(name);
            if (!startTime) {
                console.warn(`No start time found for measurement: ${name}`);
                return 0;
            }
            
            const duration = performance.now() - startTime;
            console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
            
            this.metrics.delete(name);
            return duration;
        },

        /**
         * Measure function execution time
         * @param {Function} func - Function to measure
         * @param {string} name - Measurement name
         * @returns {Function} Wrapped function
         */
        measure(func, name) {
            return (...args) => {
                this.start(name);
                const result = func.apply(this, args);
                this.end(name);
                return result;
            };
        },

        /**
         * Get Core Web Vitals
         * @returns {Promise} Promise with web vitals data
         */
        async getWebVitals() {
            const vitals = {};
            
            // Largest Contentful Paint
            if ('PerformanceObserver' in window) {
                return new Promise((resolve) => {
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        vitals.LCP = lastEntry.startTime;
                    });
                    
                    observer.observe({ entryTypes: ['largest-contentful-paint'] });
                    
                    // First Input Delay (approximate)
                    const navigation = performance.getEntriesByType('navigation')[0];
                    if (navigation) {
                        vitals.FCP = navigation.responseEnd - navigation.fetchStart;
                        vitals.TTFB = navigation.responseStart - navigation.requestStart;
                    }
                    
                    setTimeout(() => {
                        observer.disconnect();
                        resolve(vitals);
                    }, 5000);
                });
            }
            
            return Promise.resolve(vitals);
        }
    },

    /**
     * Initialize performance module
     */
    async init() {
        try {
            console.log('Initializing performance module...');
            
            // Set up periodic cache cleanup
            setInterval(() => {
                this.cache.cleanup();
            }, 300000); // Every 5 minutes
            
            // Initialize lazy loading for images
            this.loader.lazyLoadImages();
            
            // Log initial performance metrics
            if (typeof window !== 'undefined') {
                const vitals = await this.monitor.getWebVitals();
                console.log('Core Web Vitals:', vitals);
            }
            
            console.log('Performance module initialized');
        } catch (error) {
            console.error('Error initializing performance module:', error);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceModule;
}

// Make available globally for client-side use
if (typeof window !== 'undefined') {
    window.PerformanceModule = PerformanceModule;
}