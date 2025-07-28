/**
 * MediaBay Security System
 * Comprehensive form security with honeypot, CAPTCHA, and validation
 */

class MediaBaySecurity {
    constructor() {
        this.config = {
            honeypot: {
                enabled: true,
                fieldName: 'website_url', // Hidden field name
                timeout: 3000 // Minimum time before form submission (ms)
            },
            recaptcha: {
                enabled: true,
                siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Replace with actual site key
                theme: 'light',
                size: 'normal'
            },
            rateLimit: {
                enabled: true,
                maxAttempts: 5,
                timeWindow: 300000, // 5 minutes in ms
                blockDuration: 900000 // 15 minutes in ms
            },
            validation: {
                enabled: true,
                strictMode: true
            },
            csrf: {
                enabled: true,
                tokenName: '_csrf_token'
            }
        };

        this.formTimestamps = new Map();
        this.submissionAttempts = new Map();
        this.blockedIPs = new Set();
        this.csrfTokens = new Map();

        this.init();
    }

    /**
     * Initialize security system
     */
    init() {
        console.log('🔒 Initializing MediaBay Security System...');

        // Load reCAPTCHA if enabled
        if (this.config.recaptcha.enabled) {
            this.loadRecaptcha();
        }

        // Set up form security
        this.setupFormSecurity();

        // Initialize CSRF protection
        if (this.config.csrf.enabled) {
            this.initCSRFProtection();
        }

        // Set up rate limiting
        if (this.config.rateLimit.enabled) {
            this.initRateLimiting();
        }

        console.log('✅ Security system initialized');
    }

    /**
     * Load Google reCAPTCHA
     */
    async loadRecaptcha() {
        try {
            if (!window.grecaptcha) {
                await this.loadScript(`https://www.google.com/recaptcha/api.js?render=${this.config.recaptcha.siteKey}`);
            }
            console.log('✅ reCAPTCHA loaded');
        } catch (error) {
            console.error('❌ Failed to load reCAPTCHA:', error);
        }
    }

    /**
     * Set up form security for all forms
     */
    setupFormSecurity() {
        // Find all forms and secure them
        const forms = document.querySelectorAll('form');
        forms.forEach(form => this.secureForm(form));

        // Set up observer for dynamically added forms
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
                        forms.forEach(form => this.secureForm(form));
                        
                        if (node.tagName === 'FORM') {
                            this.secureForm(node);
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Secure individual form
     */
    secureForm(form) {
        if (form.dataset.secured === 'true') return;

        const formId = form.id || this.generateFormId();
        form.id = formId;
        form.dataset.secured = 'true';

        // Add honeypot field
        if (this.config.honeypot.enabled) {
            this.addHoneypotField(form);
        }

        // Add CSRF token
        if (this.config.csrf.enabled) {
            this.addCSRFToken(form);
        }

        // Add reCAPTCHA
        if (this.config.recaptcha.enabled && !form.querySelector('.g-recaptcha')) {
            this.addRecaptcha(form);
        }

        // Record form load time
        this.formTimestamps.set(formId, Date.now());

        // Add security validation on submit
        form.addEventListener('submit', (e) => this.validateFormSubmission(e, form));

        console.log(`🔒 Form secured: ${formId}`);
    }

    /**
     * Add honeypot field to form
     */
    addHoneypotField(form) {
        const honeypot = document.createElement('div');
        honeypot.style.cssText = 'position: absolute; left: -9999px; opacity: 0; pointer-events: none;';
        honeypot.innerHTML = `
            <label for="${this.config.honeypot.fieldName}">Leave this field empty</label>
            <input type="text" 
                   name="${this.config.honeypot.fieldName}" 
                   id="${this.config.honeypot.fieldName}" 
                   value="" 
                   tabindex="-1" 
                   autocomplete="off">
        `;
        
        form.appendChild(honeypot);
    }

    /**
     * Add CSRF token to form
     */
    addCSRFToken(form) {
        const token = this.generateCSRFToken();
        this.csrfTokens.set(form.id, token);

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = this.config.csrf.tokenName;
        csrfInput.value = token;
        
        form.appendChild(csrfInput);
    }

    /**
     * Add reCAPTCHA to form
     */
    addRecaptcha(form) {
        // Skip if form already has reCAPTCHA
        if (form.querySelector('.g-recaptcha') || form.querySelector('[data-recaptcha]')) {
            return;
        }

        const recaptchaDiv = document.createElement('div');
        recaptchaDiv.className = 'recaptcha-container';
        recaptchaDiv.innerHTML = `
            <div class="g-recaptcha" 
                 data-sitekey="${this.config.recaptcha.siteKey}"
                 data-theme="${this.config.recaptcha.theme}"
                 data-size="${this.config.recaptcha.size}">
            </div>
        `;

        // Insert before submit button or at the end
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(recaptchaDiv, submitBtn);
        } else {
            form.appendChild(recaptchaDiv);
        }

        // Render reCAPTCHA when available
        if (window.grecaptcha && window.grecaptcha.render) {
            setTimeout(() => {
                try {
                    window.grecaptcha.render(recaptchaDiv.querySelector('.g-recaptcha'));
                } catch (error) {
                    console.warn('reCAPTCHA render failed:', error);
                }
            }, 100);
        }
    }

    /**
     * Validate form submission
     */
    async validateFormSubmission(event, form) {
        const formId = form.id;
        const validationResult = await this.performSecurityValidation(form);

        if (!validationResult.valid) {
            event.preventDefault();
            this.showSecurityError(form, validationResult.errors);
            
            // Track security violation
            if (window.mediaBayAnalytics) {
                window.mediaBayAnalytics.trackEvent('security_violation', {
                    form_id: formId,
                    violations: validationResult.errors,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            }

            return false;
        }

        // Track successful form submission
        if (window.mediaBayAnalytics) {
            window.mediaBayAnalytics.trackEvent('secure_form_submit', {
                form_id: formId,
                security_checks_passed: true
            });
        }

        return true;
    }

    /**
     * Perform comprehensive security validation
     */
    async performSecurityValidation(form) {
        const errors = [];
        const formId = form.id;

        // 1. Honeypot validation
        if (this.config.honeypot.enabled) {
            const honeypotField = form.querySelector(`input[name="${this.config.honeypot.fieldName}"]`);
            if (honeypotField && honeypotField.value.trim() !== '') {
                errors.push('Honeypot field filled (likely bot)');
            }
        }

        // 2. Timing validation
        const formLoadTime = this.formTimestamps.get(formId);
        if (formLoadTime) {
            const timeDiff = Date.now() - formLoadTime;
            if (timeDiff < this.config.honeypot.timeout) {
                errors.push(`Form submitted too quickly (${timeDiff}ms < ${this.config.honeypot.timeout}ms)`);
            }
        }

        // 3. reCAPTCHA validation
        if (this.config.recaptcha.enabled) {
            const recaptchaResponse = form.querySelector('.g-recaptcha-response');
            if (!recaptchaResponse || !recaptchaResponse.value) {
                errors.push('reCAPTCHA not completed');
            } else {
                // Verify reCAPTCHA on server side (this is a client-side placeholder)
                const isValid = await this.verifyRecaptcha(recaptchaResponse.value);
                if (!isValid) {
                    errors.push('reCAPTCHA verification failed');
                }
            }
        }

        // 4. CSRF token validation
        if (this.config.csrf.enabled) {
            const csrfToken = form.querySelector(`input[name="${this.config.csrf.tokenName}"]`);
            const expectedToken = this.csrfTokens.get(formId);
            if (!csrfToken || csrfToken.value !== expectedToken) {
                errors.push('Invalid CSRF token');
            }
        }

        // 5. Rate limiting validation
        if (this.config.rateLimit.enabled) {
            const rateLimitResult = this.checkRateLimit();
            if (!rateLimitResult.allowed) {
                errors.push(`Rate limit exceeded: ${rateLimitResult.message}`);
            }
        }

        // 6. Input validation
        if (this.config.validation.enabled) {
            const inputValidation = this.validateInputs(form);
            if (!inputValidation.valid) {
                errors.push(...inputValidation.errors);
            }
        }

        // 7. Browser fingerprinting (basic)
        const fingerprint = this.generateBrowserFingerprint();
        if (this.isSuspiciousFingerprint(fingerprint)) {
            errors.push('Suspicious browser fingerprint detected');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Verify reCAPTCHA (server-side call)
     */
    async verifyRecaptcha(response) {
        try {
            const result = await fetch('/api/security/verify-recaptcha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    response: response,
                    remoteip: this.getClientIP()
                })
            });

            const data = await result.json();
            return data.success === true;
        } catch (error) {
            console.error('reCAPTCHA verification failed:', error);
            return false;
        }
    }

    /**
     * Check rate limiting
     */
    checkRateLimit() {
        const clientId = this.getClientIdentifier();
        const now = Date.now();
        
        // Check if client is blocked
        if (this.blockedIPs.has(clientId)) {
            return {
                allowed: false,
                message: 'Client is temporarily blocked'
            };
        }

        // Get or create attempt history
        let attempts = this.submissionAttempts.get(clientId) || [];
        
        // Remove old attempts outside time window
        attempts = attempts.filter(timestamp => 
            now - timestamp < this.config.rateLimit.timeWindow
        );

        // Check if limit exceeded
        if (attempts.length >= this.config.rateLimit.maxAttempts) {
            // Block client
            this.blockedIPs.add(clientId);
            setTimeout(() => {
                this.blockedIPs.delete(clientId);
            }, this.config.rateLimit.blockDuration);

            return {
                allowed: false,
                message: `Too many attempts (${attempts.length}/${this.config.rateLimit.maxAttempts})`
            };
        }

        // Record this attempt
        attempts.push(now);
        this.submissionAttempts.set(clientId, attempts);

        return {
            allowed: true,
            remaining: this.config.rateLimit.maxAttempts - attempts.length
        };
    }

    /**
     * Validate form inputs
     */
    validateInputs(form) {
        const errors = [];
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            // Skip honeypot and hidden fields
            if (input.name === this.config.honeypot.fieldName || 
                input.type === 'hidden') {
                return;
            }

            const value = input.value.trim();

            // Check for suspicious patterns
            if (this.containsSuspiciousContent(value)) {
                errors.push(`Suspicious content in field: ${input.name}`);
            }

            // Check for SQL injection patterns
            if (this.containsSQLInjection(value)) {
                errors.push(`Potential SQL injection in field: ${input.name}`);
            }

            // Check for XSS patterns
            if (this.containsXSS(value)) {
                errors.push(`Potential XSS in field: ${input.name}`);
            }

            // Email validation
            if (input.type === 'email' && value && !this.isValidEmail(value)) {
                errors.push(`Invalid email format: ${input.name}`);
            }

            // Phone validation
            if (input.type === 'tel' && value && !this.isValidPhone(value)) {
                errors.push(`Invalid phone format: ${input.name}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Security pattern detection methods
     */
    containsSuspiciousContent(value) {
        const suspiciousPatterns = [
            /\b(viagra|cialis|casino|poker|lottery)\b/i,
            /\b(buy now|click here|limited time)\b/i,
            /(http:\/\/|https:\/\/)[^\s]{10,}/g, // Multiple URLs
            /[^\x00-\x7F]{20,}/, // Too many non-ASCII characters
        ];

        return suspiciousPatterns.some(pattern => pattern.test(value));
    }

    containsSQLInjection(value) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
            /(UNION|OR|AND)\s+\d+\s*=\s*\d+/i,
            /['"]\s*(OR|AND)\s*['"]\d+['"]\s*=\s*['"]\d+['"]*/i,
            /['"]\s*;\s*(DROP|DELETE|INSERT|UPDATE)/i
        ];

        return sqlPatterns.some(pattern => pattern.test(value));
    }

    containsXSS(value) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>/gi
        ];

        return xssPatterns.some(pattern => pattern.test(value));
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        // South African phone number patterns
        const phoneRegex = /^(\+27|0)[1-9]\d{8}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone);
    }

    /**
     * Browser fingerprinting
     */
    generateBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);

        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvas.toDataURL(),
            plugins: Array.from(navigator.plugins).map(p => p.name).join(','),
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack
        };
    }

    isSuspiciousFingerprint(fingerprint) {
        // Basic checks for suspicious patterns
        const suspiciousUA = /bot|crawler|spider|scraper/i.test(fingerprint.userAgent);
        const headlessBrowser = /headless/i.test(fingerprint.userAgent);
        const noPlugins = fingerprint.plugins === '';
        
        return suspiciousUA || headlessBrowser || (noPlugins && !fingerprint.cookieEnabled);
    }

    /**
     * Utility methods
     */
    generateFormId() {
        return 'form_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateCSRFToken() {
        return 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    getClientIdentifier() {
        // Simple client identification (in production, use more sophisticated methods)
        return this.hashString(navigator.userAgent + screen.width + screen.height);
    }

    getClientIP() {
        // This would typically be handled server-side
        return 'client_ip_placeholder';
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Show security error to user
     */
    showSecurityError(form, errors) {
        // Remove existing error messages
        const existingErrors = form.querySelectorAll('.security-error');
        existingErrors.forEach(error => error.remove());

        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'security-error';
        errorContainer.innerHTML = `
            <div class="security-error-content">
                <i class="fas fa-shield-alt"></i>
                <div>
                    <strong>Security Check Failed</strong>
                    <p>Please refresh the page and try again. If the problem persists, contact support.</p>
                </div>
            </div>
        `;

        // Insert error message
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
            submitBtn.parentNode.insertBefore(errorContainer, submitBtn);
        } else {
            form.appendChild(errorContainer);
        }

        // Log detailed errors for debugging (not shown to user)
        console.warn('Security validation failed:', errors);
    }

    /**
     * Initialize CSRF protection
     */
    initCSRFProtection() {
        // Set up CSRF token refresh
        setInterval(() => {
            this.refreshCSRFTokens();
        }, 300000); // Refresh every 5 minutes
    }

    refreshCSRFTokens() {
        this.csrfTokens.forEach((token, formId) => {
            const form = document.getElementById(formId);
            if (form) {
                const newToken = this.generateCSRFToken();
                this.csrfTokens.set(formId, newToken);
                
                const csrfInput = form.querySelector(`input[name="${this.config.csrf.tokenName}"]`);
                if (csrfInput) {
                    csrfInput.value = newToken;
                }
            }
        });
    }

    /**
     * Initialize rate limiting
     */
    initRateLimiting() {
        // Clean up old attempts periodically
        setInterval(() => {
            const now = Date.now();
            this.submissionAttempts.forEach((attempts, clientId) => {
                const validAttempts = attempts.filter(timestamp => 
                    now - timestamp < this.config.rateLimit.timeWindow
                );
                
                if (validAttempts.length === 0) {
                    this.submissionAttempts.delete(clientId);
                } else {
                    this.submissionAttempts.set(clientId, validAttempts);
                }
            });
        }, 60000); // Clean up every minute
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            honeypot: this.config.honeypot.enabled,
            recaptcha: this.config.recaptcha.enabled,
            rateLimit: this.config.rateLimit.enabled,
            csrf: this.config.csrf.enabled,
            validation: this.config.validation.enabled,
            activeForms: this.formTimestamps.size,
            blockedClients: this.blockedIPs.size,
            activeAttempts: this.submissionAttempts.size
        };
    }
}

// Initialize security system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mediabaySecurity = new MediaBaySecurity();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaBaySecurity;
}