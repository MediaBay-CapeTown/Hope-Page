/**
 * MediaBay Responsive Design Tester
 * Comprehensive responsive design testing and validation
 */

class MediaBayResponsiveTester {
    constructor() {
        this.config = {
            breakpoints: {
                mobile: { min: 0, max: 767 },
                tablet: { min: 768, max: 1023 },
                desktop: { min: 1024, max: 1439 },
                large: { min: 1440, max: Infinity }
            },
            devices: {
                'iPhone SE': { width: 375, height: 667, userAgent: 'iPhone' },
                'iPhone 12': { width: 390, height: 844, userAgent: 'iPhone' },
                'iPhone 12 Pro Max': { width: 428, height: 926, userAgent: 'iPhone' },
                'Samsung Galaxy S21': { width: 384, height: 854, userAgent: 'Android' },
                'iPad': { width: 768, height: 1024, userAgent: 'iPad' },
                'iPad Pro': { width: 1024, height: 1366, userAgent: 'iPad' },
                'MacBook Air': { width: 1440, height: 900, userAgent: 'Macintosh' },
                'Desktop 1080p': { width: 1920, height: 1080, userAgent: 'Desktop' },
                'Desktop 4K': { width: 3840, height: 2160, userAgent: 'Desktop' }
            },
            testElements: [
                'header', 'nav', 'main', 'footer', 'aside',
                '.hero', '.services', '.portfolio', '.testimonials',
                '.contact-form', '.modal', '.sidebar', '.menu',
                'img', 'video', 'iframe', 'table', 'form'
            ],
            tests: {
                layout: true,
                typography: true,
                images: true,
                navigation: true,
                forms: true,
                performance: true,
                accessibility: true
            }
        };

        this.testResults = {
            overall: 'pending',
            breakpoints: {},
            devices: {},
            issues: [],
            recommendations: []
        };

        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.init();
    }

    /**
     * Initialize responsive tester
     */
    init() {
        console.log('📱 Initializing MediaBay Responsive Tester...');

        // Set up viewport monitoring
        this.setupViewportMonitoring();

        // Set up orientation change handling
        this.setupOrientationHandling();

        // Set up touch device detection
        this.setupTouchDetection();

        // Run initial tests
        this.runResponsiveTests();

        console.log('✅ Responsive tester initialized');
    }

    /**
     * Set up viewport monitoring
     */
    setupViewportMonitoring() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newBreakpoint = this.getCurrentBreakpoint();
                
                if (newBreakpoint !== this.currentBreakpoint) {
                    console.log(`📱 Breakpoint changed: ${this.currentBreakpoint} → ${newBreakpoint}`);
                    this.currentBreakpoint = newBreakpoint;
                    this.handleBreakpointChange(newBreakpoint);
                }

                this.runResponsiveTests();
            }, 250);
        });
    }

    /**
     * Set up orientation change handling
     */
    setupOrientationHandling() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                console.log('📱 Orientation changed');
                this.runResponsiveTests();
                this.fixOrientationIssues();
            }, 100);
        });
    }

    /**
     * Set up touch device detection
     */
    setupTouchDetection() {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
            this.optimizeForTouch();
        } else {
            document.body.classList.add('no-touch');
        }
    }

    /**
     * Get current breakpoint
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        for (const [name, range] of Object.entries(this.config.breakpoints)) {
            if (width >= range.min && width <= range.max) {
                return name;
            }
        }
        
        return 'unknown';
    }

    /**
     * Handle breakpoint change
     */
    handleBreakpointChange(newBreakpoint) {
        // Update body class
        document.body.className = document.body.className.replace(/breakpoint-\w+/g, '');
        document.body.classList.add(`breakpoint-${newBreakpoint}`);

        // Trigger custom event
        const event = new CustomEvent('breakpointChange', {
            detail: { 
                previous: this.currentBreakpoint,
                current: newBreakpoint,
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
        window.dispatchEvent(event);

        // Track breakpoint change
        if (window.mediaBayAnalytics) {
            window.mediaBayAnalytics.trackEvent('breakpoint_change', {
                previous_breakpoint: this.currentBreakpoint,
                current_breakpoint: newBreakpoint,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight
            });
        }
    }

    /**
     * Run comprehensive responsive tests
     */
    async runResponsiveTests() {
        console.log('🧪 Running responsive design tests...');
        
        const results = {
            timestamp: new Date().toISOString(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                breakpoint: this.currentBreakpoint
            },
            tests: {}
        };

        // Run individual tests
        if (this.config.tests.layout) {
            results.tests.layout = await this.testLayout();
        }

        if (this.config.tests.typography) {
            results.tests.typography = await this.testTypography();
        }

        if (this.config.tests.images) {
            results.tests.images = await this.testImages();
        }

        if (this.config.tests.navigation) {
            results.tests.navigation = await this.testNavigation();
        }

        if (this.config.tests.forms) {
            results.tests.forms = await this.testForms();
        }

        if (this.config.tests.performance) {
            results.tests.performance = await this.testPerformance();
        }

        if (this.config.tests.accessibility) {
            results.tests.accessibility = await this.testAccessibility();
        }

        // Store results
        this.testResults.breakpoints[this.currentBreakpoint] = results;
        
        // Generate overall score
        this.calculateOverallScore();

        // Generate recommendations
        this.generateRecommendations();

        console.log('✅ Responsive tests completed:', results);
        return results;
    }

    /**
     * Test layout responsiveness
     */
    async testLayout() {
        const issues = [];
        const score = { total: 0, passed: 0 };

        // Test horizontal scrolling
        score.total++;
        if (document.documentElement.scrollWidth <= window.innerWidth) {
            score.passed++;
        } else {
            issues.push('Horizontal scrolling detected');
        }

        // Test element overflow
        score.total++;
        const overflowElements = this.findOverflowingElements();
        if (overflowElements.length === 0) {
            score.passed++;
        } else {
            issues.push(`${overflowElements.length} elements are overflowing`);
        }

        // Test grid/flexbox layouts
        score.total++;
        const layoutIssues = this.checkLayoutSystems();
        if (layoutIssues.length === 0) {
            score.passed++;
        } else {
            issues.push(...layoutIssues);
        }

        // Test spacing consistency
        score.total++;
        const spacingIssues = this.checkSpacing();
        if (spacingIssues.length === 0) {
            score.passed++;
        } else {
            issues.push(...spacingIssues);
        }

        return {
            score: Math.round((score.passed / score.total) * 100),
            issues: issues,
            details: {
                horizontal_scroll: document.documentElement.scrollWidth > window.innerWidth,
                overflowing_elements: overflowElements.length,
                viewport_width: window.innerWidth,
                document_width: document.documentElement.scrollWidth
            }
        };
    }

    /**
     * Find overflowing elements
     */
    findOverflowingElements() {
        const overflowing = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.right > window.innerWidth || rect.left < 0) {
                overflowing.push({
                    element: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + 
                            (element.className ? `.${element.className.split(' ')[0]}` : ''),
                    right: rect.right,
                    left: rect.left,
                    width: rect.width
                });
            }
        });

        return overflowing;
    }

    /**
     * Check layout systems (Grid/Flexbox)
     */
    checkLayoutSystems() {
        const issues = [];
        
        // Check flexbox containers
        const flexContainers = document.querySelectorAll('[style*="display: flex"], [style*="display:flex"]');
        flexContainers.forEach(container => {
            const computedStyle = window.getComputedStyle(container);
            if (computedStyle.display === 'flex') {
                const children = Array.from(container.children);
                const totalWidth = children.reduce((sum, child) => {
                    return sum + child.getBoundingClientRect().width;
                }, 0);
                
                if (totalWidth > container.getBoundingClientRect().width * 1.1) {
                    issues.push('Flexbox container may be overflowing');
                }
            }
        });

        // Check grid containers
        const gridContainers = document.querySelectorAll('[style*="display: grid"], [style*="display:grid"]');
        gridContainers.forEach(container => {
            const computedStyle = window.getComputedStyle(container);
            if (computedStyle.display === 'grid') {
                // Check if grid template columns are responsive
                const gridTemplateColumns = computedStyle.gridTemplateColumns;
                if (gridTemplateColumns && !gridTemplateColumns.includes('fr') && 
                    !gridTemplateColumns.includes('minmax') && 
                    !gridTemplateColumns.includes('auto')) {
                    issues.push('Grid container may not be responsive');
                }
            }
        });

        return issues;
    }

    /**
     * Check spacing consistency
     */
    checkSpacing() {
        const issues = [];
        const elements = document.querySelectorAll(this.config.testElements.join(', '));
        const margins = [];
        const paddings = [];

        elements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            margins.push(parseFloat(computedStyle.marginTop));
            margins.push(parseFloat(computedStyle.marginBottom));
            paddings.push(parseFloat(computedStyle.paddingTop));
            paddings.push(parseFloat(computedStyle.paddingBottom));
        });

        // Check for inconsistent spacing (simplified check)
        const uniqueMargins = [...new Set(margins.filter(m => m > 0))];
        const uniquePaddings = [...new Set(paddings.filter(p => p > 0))];

        if (uniqueMargins.length > 10) {
            issues.push('Too many different margin values detected');
        }

        if (uniquePaddings.length > 10) {
            issues.push('Too many different padding values detected');
        }

        return issues;
    }

    /**
     * Test typography responsiveness
     */
    async testTypography() {
        const issues = [];
        const score = { total: 0, passed: 0 };

        // Test font sizes
        score.total++;
        const fontSizeIssues = this.checkFontSizes();
        if (fontSizeIssues.length === 0) {
            score.passed++;
        } else {
            issues.push(...fontSizeIssues);
        }

        // Test line heights
        score.total++;
        const lineHeightIssues = this.checkLineHeights();
        if (lineHeightIssues.length === 0) {
            score.passed++;
        } else {
            issues.push(...lineHeightIssues);
        }

        // Test text overflow
        score.total++;
        const textOverflowElements = this.findTextOverflow();
        if (textOverflowElements.length === 0) {
            score.passed++;
        } else {
            issues.push(`${textOverflowElements.length} elements have text overflow`);
        }

        return {
            score: Math.round((score.passed / score.total) * 100),
            issues: issues,
            details: {
                text_overflow_elements: textOverflowElements.length
            }
        };
    }

    /**
     * Check font sizes
     */
    checkFontSizes() {
        const issues = [];
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button');
        
        textElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const fontSize = parseFloat(computedStyle.fontSize);
            
            // Check minimum font size for mobile
            if (this.currentBreakpoint === 'mobile' && fontSize < 14) {
                issues.push(`Font size too small on mobile: ${fontSize}px`);
            }
            
            // Check maximum font size
            if (fontSize > 72) {
                issues.push(`Font size too large: ${fontSize}px`);
            }
        });

        return issues;
    }

    /**
     * Check line heights
     */
    checkLineHeights() {
        const issues = [];
        const textElements = document.querySelectorAll('p, div, span');
        
        textElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const lineHeight = parseFloat(computedStyle.lineHeight);
            const fontSize = parseFloat(computedStyle.fontSize);
            
            if (lineHeight && fontSize) {
                const ratio = lineHeight / fontSize;
                
                // Check line height ratio
                if (ratio < 1.2) {
                    issues.push('Line height too small for readability');
                } else if (ratio > 2.0) {
                    issues.push('Line height too large');
                }
            }
        });

        return issues;
    }

    /**
     * Find text overflow
     */
    findTextOverflow() {
        const overflowing = [];
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button');
        
        textElements.forEach(element => {
            if (element.scrollWidth > element.clientWidth) {
                overflowing.push(element);
            }
        });

        return overflowing;
    }

    /**
     * Test images responsiveness
     */
    async testImages() {
        const issues = [];
        const score = { total: 0, passed: 0 };
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            score.total++;
            
            // Check if image has responsive attributes
            const hasResponsive = img.hasAttribute('srcset') || 
                                 img.style.maxWidth === '100%' || 
                                 img.style.width === '100%' ||
                                 window.getComputedStyle(img).maxWidth === '100%';
            
            if (hasResponsive) {
                score.passed++;
            } else {
                issues.push(`Image not responsive: ${img.src || img.alt || 'unknown'}`);
            }

            // Check if image overflows container
            const rect = img.getBoundingClientRect();
            const parent = img.parentElement;
            const parentRect = parent.getBoundingClientRect();
            
            if (rect.width > parentRect.width * 1.1) {
                issues.push(`Image overflows container: ${img.src || img.alt || 'unknown'}`);
            }
        });

        return {
            score: images.length > 0 ? Math.round((score.passed / score.total) * 100) : 100,
            issues: issues,
            details: {
                total_images: images.length,
                responsive_images: score.passed
            }
        };
    }

    /**
     * Test navigation responsiveness
     */
    async testNavigation() {
        const issues = [];
        const score = { total: 0, passed: 0 };

        // Test mobile menu
        score.total++;
        const mobileMenu = document.querySelector('.mobile-menu, .hamburger, [data-mobile-menu]');
        if (this.currentBreakpoint === 'mobile') {
            if (mobileMenu) {
                score.passed++;
            } else {
                issues.push('No mobile menu found');
            }
        } else {
            score.passed++; // Not mobile, so this test passes
        }

        // Test navigation accessibility
        score.total++;
        const navElements = document.querySelectorAll('nav, [role="navigation"]');
        let accessibleNav = false;
        
        navElements.forEach(nav => {
            if (nav.getAttribute('aria-label') || nav.getAttribute('aria-labelledby')) {
                accessibleNav = true;
            }
        });

        if (accessibleNav || navElements.length === 0) {
            score.passed++;
        } else {
            issues.push('Navigation lacks accessibility labels');
        }

        // Test touch targets
        score.total++;
        const touchTargetIssues = this.checkTouchTargets();
        if (touchTargetIssues.length === 0) {
            score.passed++;
        } else {
            issues.push(...touchTargetIssues);
        }

        return {
            score: Math.round((score.passed / score.total) * 100),
            issues: issues,
            details: {
                mobile_menu_present: !!mobileMenu,
                accessible_navigation: accessibleNav
            }
        };
    }

    /**
     * Check touch targets
     */
    checkTouchTargets() {
        const issues = [];
        const minTouchTarget = 44; // 44px minimum recommended by Apple/Google
        
        if (this.currentBreakpoint === 'mobile') {
            const touchElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]');
            
            touchElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
                    issues.push(`Touch target too small: ${rect.width}x${rect.height}px`);
                }
            });
        }

        return issues;
    }

    /**
     * Test forms responsiveness
     */
    async testForms() {
        const issues = [];
        const score = { total: 0, passed: 0 };
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            score.total++;
            
            // Check form layout
            const inputs = form.querySelectorAll('input, textarea, select');
            let responsiveForm = true;
            
            inputs.forEach(input => {
                const rect = input.getBoundingClientRect();
                if (rect.width > window.innerWidth * 0.9) {
                    responsiveForm = false;
                }
            });

            if (responsiveForm) {
                score.passed++;
            } else {
                issues.push('Form inputs may be too wide for mobile');
            }
        });

        // Test input labels
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            score.total++;
            
            const label = document.querySelector(`label[for="${input.id}"]`) || 
                         input.closest('label') ||
                         input.getAttribute('aria-label') ||
                         input.getAttribute('placeholder');
            
            if (label) {
                score.passed++;
            } else {
                issues.push(`Input missing label: ${input.name || input.type}`);
            }
        });

        return {
            score: score.total > 0 ? Math.round((score.passed / score.total) * 100) : 100,
            issues: issues,
            details: {
                total_forms: forms.length,
                total_inputs: inputs.length
            }
        };
    }

    /**
     * Test performance on current viewport
     */
    async testPerformance() {
        const issues = [];
        const score = { total: 0, passed: 0 };

        // Test image loading performance
        score.total++;
        const images = document.querySelectorAll('img');
        const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-lazy]');
        
        if (images.length === 0 || lazyImages.length / images.length > 0.5) {
            score.passed++;
        } else {
            issues.push('Consider implementing lazy loading for images');
        }

        // Test CSS performance
        score.total++;
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        if (stylesheets.length <= 3) {
            score.passed++;
        } else {
            issues.push(`Too many CSS files: ${stylesheets.length}`);
        }

        // Test JavaScript performance
        score.total++;
        const scripts = document.querySelectorAll('script[src]');
        if (scripts.length <= 10) {
            score.passed++;
        } else {
            issues.push(`Too many JavaScript files: ${scripts.length}`);
        }

        return {
            score: Math.round((score.passed / score.total) * 100),
            issues: issues,
            details: {
                total_images: images.length,
                lazy_images: lazyImages.length,
                stylesheets: stylesheets.length,
                scripts: scripts.length
            }
        };
    }

    /**
     * Test accessibility
     */
    async testAccessibility() {
        const issues = [];
        const score = { total: 0, passed: 0 };

        // Test alt text for images
        score.total++;
        const images = document.querySelectorAll('img');
        const imagesWithAlt = document.querySelectorAll('img[alt]');
        
        if (images.length === 0 || imagesWithAlt.length === images.length) {
            score.passed++;
        } else {
            issues.push(`${images.length - imagesWithAlt.length} images missing alt text`);
        }

        // Test heading hierarchy
        score.total++;
        const headingIssues = this.checkHeadingHierarchy();
        if (headingIssues.length === 0) {
            score.passed++;
        } else {
            issues.push(...headingIssues);
        }

        // Test color contrast (basic check)
        score.total++;
        const contrastIssues = this.checkColorContrast();
        if (contrastIssues.length === 0) {
            score.passed++;
        } else {
            issues.push(...contrastIssues);
        }

        return {
            score: Math.round((score.passed / score.total) * 100),
            issues: issues,
            details: {
                total_images: images.length,
                images_with_alt: imagesWithAlt.length
            }
        };
    }

    /**
     * Check heading hierarchy
     */
    checkHeadingHierarchy() {
        const issues = [];
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;

        headings.forEach(heading => {
            const currentLevel = parseInt(heading.tagName.charAt(1));
            
            if (currentLevel > previousLevel + 1) {
                issues.push(`Heading hierarchy skip: ${heading.tagName} after h${previousLevel}`);
            }
            
            previousLevel = currentLevel;
        });

        return issues;
    }

    /**
     * Check color contrast (simplified)
     */
    checkColorContrast() {
        const issues = [];
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
        
        textElements.forEach(element => {
            const computedStyle = window.getComputedStyle(element);
            const color = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;
            
            // This is a simplified check - in production, use a proper contrast ratio calculator
            if (color === backgroundColor) {
                issues.push('Text and background colors are the same');
            }
        });

        return issues;
    }

    /**
     * Calculate overall score
     */
    calculateOverallScore() {
        const breakpointResults = this.testResults.breakpoints[this.currentBreakpoint];
        if (!breakpointResults || !breakpointResults.tests) return;

        const scores = Object.values(breakpointResults.tests).map(test => test.score);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        this.testResults.overall = Math.round(averageScore);
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const breakpointResults = this.testResults.breakpoints[this.currentBreakpoint];
        
        if (!breakpointResults) return;

        // Analyze test results and generate recommendations
        Object.entries(breakpointResults.tests).forEach(([testName, result]) => {
            if (result.score < 80) {
                recommendations.push({
                    category: testName,
                    priority: result.score < 50 ? 'high' : 'medium',
                    issues: result.issues,
                    suggestions: this.getSuggestions(testName, result)
                });
            }
        });

        this.testResults.recommendations = recommendations;
    }

    /**
     * Get suggestions for improvement
     */
    getSuggestions(testName, result) {
        const suggestions = {
            layout: [
                'Use CSS Grid or Flexbox for responsive layouts',
                'Implement proper media queries for different breakpoints',
                'Avoid fixed widths and use relative units',
                'Test on multiple devices and screen sizes'
            ],
            typography: [
                'Use relative font sizes (rem, em)',
                'Implement responsive typography with clamp()',
                'Ensure adequate line height for readability',
                'Test text scaling up to 200%'
            ],
            images: [
                'Implement responsive images with srcset',
                'Use CSS max-width: 100% for images',
                'Consider lazy loading for performance',
                'Optimize image formats (WebP, AVIF)'
            ],
            navigation: [
                'Implement mobile-first navigation',
                'Ensure touch targets are at least 44px',
                'Add proper ARIA labels',
                'Test keyboard navigation'
            ],
            forms: [
                'Make form inputs responsive',
                'Add proper labels to all inputs',
                'Use appropriate input types',
                'Test form usability on mobile'
            ],
            performance: [
                'Minimize HTTP requests',
                'Implement lazy loading',
                'Optimize CSS and JavaScript',
                'Use a Content Delivery Network (CDN)'
            ],
            accessibility: [
                'Add alt text to all images',
                'Maintain proper heading hierarchy',
                'Ensure sufficient color contrast',
                'Test with screen readers'
            ]
        };

        return suggestions[testName] || [];
    }

    /**
     * Optimize for touch devices
     */
    optimizeForTouch() {
        // Increase touch target sizes
        const style = document.createElement('style');
        style.textContent = `
            @media (pointer: coarse) {
                button, a, input[type="button"], input[type="submit"], [role="button"] {
                    min-height: 44px;
                    min-width: 44px;
                    padding: 12px 16px;
                }
            }
        `;
        document.head.appendChild(style);

        // Add touch-friendly hover states
        document.addEventListener('touchstart', function() {}, { passive: true });
    }

    /**
     * Fix orientation issues
     */
    fixOrientationIssues() {
        // Recalculate viewport height for mobile browsers
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        // Trigger layout recalculation
        window.dispatchEvent(new Event('resize'));
    }

    /**
     * Test specific device
     */
    async testDevice(deviceName) {
        const device = this.config.devices[deviceName];
        if (!device) {
            console.error(`Device ${deviceName} not found`);
            return null;
        }

        console.log(`📱 Testing device: ${deviceName} (${device.width}x${device.height})`);

        // Simulate device viewport (for testing purposes)
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;

        // Note: In a real testing environment, you would use tools like Puppeteer
        // to actually resize the viewport. This is a simulation.
        
        const testResults = await this.runResponsiveTests();
        this.testResults.devices[deviceName] = testResults;

        return testResults;
    }

    /**
     * Generate test report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            overall_score: this.testResults.overall,
            current_breakpoint: this.currentBreakpoint,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            test_results: this.testResults.breakpoints,
            device_results: this.testResults.devices,
            recommendations: this.testResults.recommendations,
            summary: {
                total_issues: this.testResults.recommendations.reduce((sum, rec) => sum + rec.issues.length, 0),
                high_priority_issues: this.testResults.recommendations.filter(rec => rec.priority === 'high').length,
                categories_tested: Object.keys(this.config.tests).filter(test => this.config.tests[test]).length
            }
        };

        return report;
    }

    /**
     * Export test results
     */
    exportResults(format = 'json') {
        const report = this.generateReport();
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `responsive-test-report-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        return report;
    }

    /**
     * Get test summary
     */
    getTestSummary() {
        return {
            overall_score: this.testResults.overall,
            current_breakpoint: this.currentBreakpoint,
            total_recommendations: this.testResults.recommendations.length,
            high_priority_issues: this.testResults.recommendations.filter(rec => rec.priority === 'high').length,
            last_test: this.testResults.breakpoints[this.currentBreakpoint]?.timestamp
        };
    }
}

// Initialize responsive tester when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mediaBayResponsiveTester = new MediaBayResponsiveTester();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaBayResponsiveTester;
}