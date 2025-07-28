/**
 * MediaBay Performance Optimization System
 * Comprehensive performance monitoring and optimization
 */

class MediaBayPerformance {
    constructor() {
        this.config = {
            lazyLoading: {
                enabled: true,
                rootMargin: '50px',
                threshold: 0.1
            },
            imageOptimization: {
                enabled: true,
                webpSupport: this.supportsWebP(),
                compressionQuality: 0.8
            },
            caching: {
                enabled: true,
                version: '1.0.0',
                cacheName: 'mediabay-cache-v1'
            },
            preloading: {
                enabled: true,
                criticalResources: [
                    '/assets/css/styles.css',
                    '/assets/js/main.js',
                    '/assets/images/logo.jpeg'
                ]
            },
            monitoring: {
                enabled: true,
                reportInterval: 30000, // 30 seconds
                thresholds: {
                    fcp: 2500, // First Contentful Paint
                    lcp: 4000, // Largest Contentful Paint
                    fid: 100,  // First Input Delay
                    cls: 0.1   // Cumulative Layout Shift
                }
            }
        };

        this.metrics = {
            pageLoadTime: 0,
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0,
            resourceLoadTimes: new Map(),
            memoryUsage: null
        };

        this.observers = {
            intersection: null,
            performance: null,
            mutation: null
        };

        this.init();
    }

    /**
     * Initialize performance optimization system
     */
    init() {
        console.log('⚡ Initializing MediaBay Performance System...');

        // Set up lazy loading
        if (this.config.lazyLoading.enabled) {
            this.initLazyLoading();
        }

        // Set up image optimization
        if (this.config.imageOptimization.enabled) {
            this.initImageOptimization();
        }

        // Set up performance monitoring
        if (this.config.monitoring.enabled) {
            this.initPerformanceMonitoring();
        }

        // Set up resource preloading
        if (this.config.preloading.enabled) {
            this.initResourcePreloading();
        }

        // Set up caching
        if (this.config.caching.enabled) {
            this.initCaching();
        }

        // Optimize existing content
        this.optimizeExistingContent();

        console.log('✅ Performance system initialized');
    }

    /**
     * Initialize lazy loading for images and iframes
     */
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.observers.intersection = new IntersectionObserver(
                this.handleIntersection.bind(this),
                {
                    rootMargin: this.config.lazyLoading.rootMargin,
                    threshold: this.config.lazyLoading.threshold
                }
            );

            // Observe all lazy-loadable elements
            this.observeLazyElements();

            // Set up observer for dynamically added elements
            this.setupDynamicLazyLoading();
        } else {
            // Fallback for browsers without IntersectionObserver
            this.loadAllLazyElements();
        }
    }

    /**
     * Observe lazy-loadable elements
     */
    observeLazyElements() {
        const lazyElements = document.querySelectorAll('[data-lazy], img[loading="lazy"], iframe[loading="lazy"]');
        lazyElements.forEach(element => {
            this.observers.intersection.observe(element);
        });
    }

    /**
     * Handle intersection observer callback
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadLazyElement(entry.target);
                this.observers.intersection.unobserve(entry.target);
            }
        });
    }

    /**
     * Load lazy element
     */
    loadLazyElement(element) {
        const startTime = performance.now();

        if (element.tagName === 'IMG') {
            this.loadLazyImage(element);
        } else if (element.tagName === 'IFRAME') {
            this.loadLazyIframe(element);
        } else if (element.dataset.lazy) {
            this.loadLazyContent(element);
        }

        // Track loading time
        element.addEventListener('load', () => {
            const loadTime = performance.now() - startTime;
            this.metrics.resourceLoadTimes.set(element.src || element.dataset.src, loadTime);
        });
    }

    /**
     * Load lazy image
     */
    loadLazyImage(img) {
        const src = img.dataset.src || img.src;
        const srcset = img.dataset.srcset;

        if (src) {
            // Create optimized image if WebP is supported
            if (this.config.imageOptimization.webpSupport && !src.includes('.webp')) {
                const webpSrc = this.getWebPVersion(src);
                if (webpSrc) {
                    img.src = webpSrc;
                } else {
                    img.src = src;
                }
            } else {
                img.src = src;
            }
        }

        if (srcset) {
            img.srcset = srcset;
        }

        img.classList.add('lazy-loaded');
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
    }

    /**
     * Load lazy iframe
     */
    loadLazyIframe(iframe) {
        const src = iframe.dataset.src;
        if (src) {
            iframe.src = src;
            iframe.classList.add('lazy-loaded');
            iframe.removeAttribute('data-src');
        }
    }

    /**
     * Load lazy content
     */
    loadLazyContent(element) {
        const content = element.dataset.lazy;
        if (content) {
            element.innerHTML = content;
            element.classList.add('lazy-loaded');
            element.removeAttribute('data-lazy');
        }
    }

    /**
     * Set up dynamic lazy loading for new elements
     */
    setupDynamicLazyLoading() {
        this.observers.mutation = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const lazyElements = node.querySelectorAll ? 
                            node.querySelectorAll('[data-lazy], img[loading="lazy"], iframe[loading="lazy"]') : [];
                        
                        lazyElements.forEach(element => {
                            this.observers.intersection.observe(element);
                        });

                        if (node.matches && node.matches('[data-lazy], img[loading="lazy"], iframe[loading="lazy"]')) {
                            this.observers.intersection.observe(node);
                        }
                    }
                });
            });
        });

        this.observers.mutation.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Initialize image optimization
     */
    initImageOptimization() {
        // Convert images to WebP if supported
        if (this.config.imageOptimization.webpSupport) {
            this.convertImagesToWebP();
        }

        // Set up responsive images
        this.setupResponsiveImages();

        // Optimize image loading
        this.optimizeImageLoading();
    }

    /**
     * Convert images to WebP format
     */
    convertImagesToWebP() {
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            const webpSrc = this.getWebPVersion(img.src);
            if (webpSrc) {
                // Create a new image to test if WebP version exists
                const testImg = new Image();
                testImg.onload = () => {
                    img.src = webpSrc;
                };
                testImg.onerror = () => {
                    // Keep original if WebP version doesn't exist
                };
                testImg.src = webpSrc;
            }
        });
    }

    /**
     * Get WebP version of image URL
     */
    getWebPVersion(src) {
        if (!src || src.includes('.webp')) return null;
        
        const extension = src.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png'].includes(extension)) {
            return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        }
        
        return null;
    }

    /**
     * Set up responsive images
     */
    setupResponsiveImages() {
        const images = document.querySelectorAll('img:not([srcset])');
        images.forEach(img => {
            if (img.src && !img.dataset.noResponsive) {
                this.addResponsiveSrcset(img);
            }
        });
    }

    /**
     * Add responsive srcset to image
     */
    addResponsiveSrcset(img) {
        const src = img.src;
        const baseName = src.replace(/\.[^/.]+$/, '');
        const extension = src.split('.').pop();

        // Generate srcset for different screen sizes
        const sizes = [480, 768, 1024, 1200, 1920];
        const srcsetEntries = sizes.map(size => {
            return `${baseName}-${size}w.${extension} ${size}w`;
        });

        img.srcset = srcsetEntries.join(', ');
        img.sizes = '(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1200px) 1200px, 1920px';
    }

    /**
     * Optimize image loading
     */
    optimizeImageLoading() {
        // Add loading="lazy" to images below the fold
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach((img, index) => {
            if (index > 2) { // First 3 images load immediately
                img.loading = 'lazy';
            }
        });

        // Preload critical images
        this.preloadCriticalImages();
    }

    /**
     * Preload critical images
     */
    preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical], .hero img, .logo img');
        criticalImages.forEach(img => {
            if (img.src) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = img.src;
                document.head.appendChild(link);
            }
        });
    }

    /**
     * Initialize performance monitoring
     */
    initPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();

        // Monitor resource loading
        this.monitorResourceLoading();

        // Monitor memory usage
        this.monitorMemoryUsage();

        // Set up periodic reporting
        this.setupPerformanceReporting();
    }

    /**
     * Monitor Core Web Vitals
     */
    monitorCoreWebVitals() {
        // First Contentful Paint
        this.observePerformanceEntry('paint', (entries) => {
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                }
            });
        });

        // Largest Contentful Paint
        this.observePerformanceEntry('largest-contentful-paint', (entries) => {
            entries.forEach(entry => {
                this.metrics.largestContentfulPaint = entry.startTime;
            });
        });

        // First Input Delay
        this.observePerformanceEntry('first-input', (entries) => {
            entries.forEach(entry => {
                this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
            });
        });

        // Cumulative Layout Shift
        this.observePerformanceEntry('layout-shift', (entries) => {
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    this.metrics.cumulativeLayoutShift += entry.value;
                }
            });
        });
    }

    /**
     * Observe performance entries
     */
    observePerformanceEntry(type, callback) {
        try {
            const observer = new PerformanceObserver(callback);
            observer.observe({ entryTypes: [type] });
        } catch (error) {
            console.warn(`Performance observer for ${type} not supported:`, error);
        }
    }

    /**
     * Monitor resource loading
     */
    monitorResourceLoading() {
        // Monitor navigation timing
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
                this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
            }
        });

        // Monitor resource timing
        this.observePerformanceEntry('resource', (entries) => {
            entries.forEach(entry => {
                const loadTime = entry.responseEnd - entry.startTime;
                this.metrics.resourceLoadTimes.set(entry.name, loadTime);
            });
        });
    }

    /**
     * Monitor memory usage
     */
    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                this.metrics.memoryUsage = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }, 10000); // Every 10 seconds
        }
    }

    /**
     * Set up performance reporting
     */
    setupPerformanceReporting() {
        setInterval(() => {
            this.reportPerformanceMetrics();
        }, this.config.monitoring.reportInterval);

        // Report on page unload
        window.addEventListener('beforeunload', () => {
            this.reportPerformanceMetrics(true);
        });
    }

    /**
     * Report performance metrics
     */
    reportPerformanceMetrics(isUnload = false) {
        const metrics = this.getPerformanceMetrics();
        
        // Check thresholds and log warnings
        this.checkPerformanceThresholds(metrics);

        // Send to analytics
        if (window.mediaBayAnalytics) {
            window.mediaBayAnalytics.trackEvent('performance_metrics', {
                ...metrics,
                is_unload: isUnload,
                timestamp: new Date().toISOString()
            });
        }

        // Send to server for monitoring
        if (!isUnload) {
            this.sendPerformanceData(metrics);
        }
    }

    /**
     * Get current performance metrics
     */
    getPerformanceMetrics() {
        return {
            page_load_time: this.metrics.pageLoadTime,
            dom_content_loaded: this.metrics.domContentLoaded,
            first_contentful_paint: this.metrics.firstContentfulPaint,
            largest_contentful_paint: this.metrics.largestContentfulPaint,
            first_input_delay: this.metrics.firstInputDelay,
            cumulative_layout_shift: this.metrics.cumulativeLayoutShift,
            memory_usage: this.metrics.memoryUsage,
            resource_count: this.metrics.resourceLoadTimes.size,
            average_resource_load_time: this.getAverageResourceLoadTime(),
            slow_resources: this.getSlowResources(),
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            connection_type: this.getConnectionType()
        };
    }

    /**
     * Check performance thresholds
     */
    checkPerformanceThresholds(metrics) {
        const warnings = [];

        if (metrics.first_contentful_paint > this.config.monitoring.thresholds.fcp) {
            warnings.push(`First Contentful Paint is slow: ${metrics.first_contentful_paint}ms`);
        }

        if (metrics.largest_contentful_paint > this.config.monitoring.thresholds.lcp) {
            warnings.push(`Largest Contentful Paint is slow: ${metrics.largest_contentful_paint}ms`);
        }

        if (metrics.first_input_delay > this.config.monitoring.thresholds.fid) {
            warnings.push(`First Input Delay is high: ${metrics.first_input_delay}ms`);
        }

        if (metrics.cumulative_layout_shift > this.config.monitoring.thresholds.cls) {
            warnings.push(`Cumulative Layout Shift is high: ${metrics.cumulative_layout_shift}`);
        }

        if (warnings.length > 0) {
            console.warn('⚠️ Performance issues detected:', warnings);
        }
    }

    /**
     * Get average resource load time
     */
    getAverageResourceLoadTime() {
        if (this.metrics.resourceLoadTimes.size === 0) return 0;
        
        const total = Array.from(this.metrics.resourceLoadTimes.values()).reduce((sum, time) => sum + time, 0);
        return total / this.metrics.resourceLoadTimes.size;
    }

    /**
     * Get slow resources
     */
    getSlowResources(threshold = 1000) {
        const slowResources = [];
        this.metrics.resourceLoadTimes.forEach((time, resource) => {
            if (time > threshold) {
                slowResources.push({ resource, time });
            }
        });
        return slowResources;
    }

    /**
     * Get connection type
     */
    getConnectionType() {
        if ('connection' in navigator) {
            return {
                effective_type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }

    /**
     * Send performance data to server
     */
    async sendPerformanceData(metrics) {
        try {
            await fetch('/api/performance/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metrics)
            });
        } catch (error) {
            console.warn('Failed to send performance data:', error);
        }
    }

    /**
     * Initialize resource preloading
     */
    initResourcePreloading() {
        // Preload critical resources
        this.config.preloading.criticalResources.forEach(resource => {
            this.preloadResource(resource);
        });

        // Set up predictive preloading
        this.setupPredictivePreloading();
    }

    /**
     * Preload resource
     */
    preloadResource(href, as = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    }

    /**
     * Set up predictive preloading
     */
    setupPredictivePreloading() {
        // Preload resources on hover
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.dataset.preloaded) {
                this.preloadPage(link.href);
                link.dataset.preloaded = 'true';
            }
        });

        // Preload resources on touch start (mobile)
        document.addEventListener('touchstart', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.dataset.preloaded) {
                this.preloadPage(link.href);
                link.dataset.preloaded = 'true';
            }
        });
    }

    /**
     * Preload page
     */
    preloadPage(href) {
        if (href.startsWith(window.location.origin)) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        }
    }

    /**
     * Initialize caching
     */
    initCaching() {
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Set up localStorage caching for API responses
        this.setupAPICache();
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registered:', registration);
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }

    /**
     * Set up API response caching
     */
    setupAPICache() {
        // Cache GET requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            if (options.method === 'GET' || !options.method) {
                const cacheKey = `api_cache_${url}`;
                const cached = localStorage.getItem(cacheKey);
                
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;
                    
                    // Use cached data if less than 5 minutes old
                    if (age < 300000) {
                        return new Response(JSON.stringify(data), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }

            const response = await originalFetch(url, options);
            
            // Cache successful GET responses
            if (response.ok && (options.method === 'GET' || !options.method)) {
                const clone = response.clone();
                const data = await clone.json();
                const cacheKey = `api_cache_${url}`;
                
                localStorage.setItem(cacheKey, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            }

            return response;
        };
    }

    /**
     * Optimize existing content
     */
    optimizeExistingContent() {
        // Minify inline styles and scripts
        this.minifyInlineContent();

        // Optimize fonts
        this.optimizeFonts();

        // Remove unused CSS
        this.removeUnusedCSS();

        // Optimize animations
        this.optimizeAnimations();
    }

    /**
     * Minify inline content
     */
    minifyInlineContent() {
        // Minify inline styles
        const styleElements = document.querySelectorAll('style');
        styleElements.forEach(style => {
            style.textContent = this.minifyCSS(style.textContent);
        });

        // Minify inline scripts
        const scriptElements = document.querySelectorAll('script:not([src])');
        scriptElements.forEach(script => {
            script.textContent = this.minifyJS(script.textContent);
        });
    }

    /**
     * Simple CSS minification
     */
    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
            .trim();
    }

    /**
     * Simple JS minification
     */
    minifyJS(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
    }

    /**
     * Optimize fonts
     */
    optimizeFonts() {
        // Add font-display: swap to font faces
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            if (!link.href.includes('display=swap')) {
                link.href += '&display=swap';
            }
        });
    }

    /**
     * Remove unused CSS (basic implementation)
     */
    removeUnusedCSS() {
        // This is a simplified version - in production, use a proper tool
        const styleSheets = Array.from(document.styleSheets);
        const usedSelectors = new Set();

        // Collect all used selectors
        document.querySelectorAll('*').forEach(element => {
            usedSelectors.add(element.tagName.toLowerCase());
            if (element.id) usedSelectors.add(`#${element.id}`);
            element.classList.forEach(cls => usedSelectors.add(`.${cls}`));
        });

        // This would require more sophisticated implementation in production
        console.log(`📊 Found ${usedSelectors.size} used CSS selectors`);
    }

    /**
     * Optimize animations
     */
    optimizeAnimations() {
        // Reduce animations for users who prefer reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Check if WebP is supported
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * Load all lazy elements (fallback)
     */
    loadAllLazyElements() {
        const lazyElements = document.querySelectorAll('[data-lazy], img[loading="lazy"], iframe[loading="lazy"]');
        lazyElements.forEach(element => {
            this.loadLazyElement(element);
        });
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        return {
            metrics: this.getPerformanceMetrics(),
            config: this.config,
            optimizations: {
                lazy_loading: this.config.lazyLoading.enabled,
                image_optimization: this.config.imageOptimization.enabled,
                caching: this.config.caching.enabled,
                preloading: this.config.preloading.enabled,
                webp_support: this.config.imageOptimization.webpSupport
            }
        };
    }
}

// Initialize performance system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mediaBayPerformance = new MediaBayPerformance();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaBayPerformance;
}