/**
 * MediaBay Input Sanitization System
 * Comprehensive input cleaning and validation
 */

class MediaBaySanitizer {
    constructor() {
        this.config = {
            autoSanitize: true,
            strictMode: true,
            allowedTags: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
            allowedAttributes: {
                'a': ['href', 'title'],
                'img': ['src', 'alt', 'width', 'height']
            },
            maxLength: {
                text: 1000,
                textarea: 5000,
                email: 254,
                tel: 20,
                url: 2048
            },
            patterns: {
                email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                phone: /^[\+]?[1-9][\d]{0,15}$/,
                url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                alphanumeric: /^[a-zA-Z0-9\s]*$/,
                numeric: /^[0-9]*$/,
                alpha: /^[a-zA-Z\s]*$/
            }
        };

        this.dangerousPatterns = [
            // XSS patterns
            /<script[^>]*>.*?<\/script>/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>/gi,
            /<applet[^>]*>.*?<\/applet>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi,
            /expression\s*\(/gi,
            
            // SQL injection patterns
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(UNION|OR|AND)\s+\d+\s*=\s*\d+/gi,
            /['"]\s*(OR|AND)\s*['"]\d+['"]\s*=\s*['"]\d+['"]*/gi,
            /['"]\s*;\s*(DROP|DELETE|INSERT|UPDATE)/gi,
            
            // Command injection patterns
            /[;&|`$(){}[\]]/g,
            /\.\.\//g,
            /\/etc\/passwd/gi,
            /\/bin\//gi,
            
            // Path traversal
            /\.\.[\/\\]/g,
            /[\/\\]\.\./g
        ];

        this.init();
    }

    /**
     * Initialize sanitization system
     */
    init() {
        console.log('🧹 Initializing MediaBay Sanitization System...');

        if (this.config.autoSanitize) {
            this.setupAutoSanitization();
        }

        console.log('✅ Sanitization system initialized');
    }

    /**
     * Set up automatic sanitization for form inputs
     */
    setupAutoSanitization() {
        // Sanitize on input events
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) {
                this.sanitizeInput(e.target);
            }
        });

        // Sanitize on paste events
        document.addEventListener('paste', (e) => {
            if (e.target.matches('input, textarea')) {
                setTimeout(() => {
                    this.sanitizeInput(e.target);
                }, 10);
            }
        });

        // Sanitize before form submission
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.sanitizeForm(e.target);
            }
        });
    }

    /**
     * Sanitize individual input element
     */
    sanitizeInput(input) {
        if (!input.value) return;

        const originalValue = input.value;
        const sanitizedValue = this.sanitizeValue(input.value, input.type, input.dataset.sanitize);

        if (originalValue !== sanitizedValue) {
            input.value = sanitizedValue;
            
            // Show sanitization notice if significant changes were made
            if (this.isSignificantChange(originalValue, sanitizedValue)) {
                this.showSanitizationNotice(input);
            }

            // Track sanitization event
            if (window.mediaBayAnalytics) {
                window.mediaBayAnalytics.trackEvent('input_sanitized', {
                    input_name: input.name || input.id,
                    input_type: input.type,
                    original_length: originalValue.length,
                    sanitized_length: sanitizedValue.length,
                    significant_change: this.isSignificantChange(originalValue, sanitizedValue)
                });
            }
        }
    }

    /**
     * Sanitize entire form
     */
    sanitizeForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let sanitizedCount = 0;

        inputs.forEach(input => {
            if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
                return;
            }

            const originalValue = input.value;
            const sanitizedValue = this.sanitizeValue(input.value, input.type, input.dataset.sanitize);

            if (originalValue !== sanitizedValue) {
                input.value = sanitizedValue;
                sanitizedCount++;
            }
        });

        if (sanitizedCount > 0) {
            console.log(`🧹 Sanitized ${sanitizedCount} form fields`);
        }

        return sanitizedCount;
    }

    /**
     * Main sanitization method
     */
    sanitizeValue(value, inputType = 'text', customRules = null) {
        if (!value || typeof value !== 'string') {
            return value;
        }

        let sanitized = value;

        // Apply custom rules if specified
        if (customRules) {
            sanitized = this.applyCustomRules(sanitized, customRules);
        }

        // Apply type-specific sanitization
        switch (inputType) {
            case 'email':
                sanitized = this.sanitizeEmail(sanitized);
                break;
            case 'tel':
                sanitized = this.sanitizePhone(sanitized);
                break;
            case 'url':
                sanitized = this.sanitizeURL(sanitized);
                break;
            case 'number':
                sanitized = this.sanitizeNumber(sanitized);
                break;
            case 'text':
            case 'textarea':
                sanitized = this.sanitizeText(sanitized);
                break;
            case 'search':
                sanitized = this.sanitizeSearch(sanitized);
                break;
            default:
                sanitized = this.sanitizeGeneric(sanitized);
        }

        // Apply length limits
        sanitized = this.applyLengthLimits(sanitized, inputType);

        // Final security check
        sanitized = this.removeDangerousPatterns(sanitized);

        return sanitized;
    }

    /**
     * Sanitize email input
     */
    sanitizeEmail(value) {
        // Remove whitespace and convert to lowercase
        let sanitized = value.trim().toLowerCase();
        
        // Remove dangerous characters
        sanitized = sanitized.replace(/[<>'"]/g, '');
        
        // Remove multiple @ symbols (keep only the last one)
        const atCount = (sanitized.match(/@/g) || []).length;
        if (atCount > 1) {
            const lastAtIndex = sanitized.lastIndexOf('@');
            sanitized = sanitized.substring(0, lastAtIndex).replace(/@/g, '') + sanitized.substring(lastAtIndex);
        }

        return sanitized;
    }

    /**
     * Sanitize phone input
     */
    sanitizePhone(value) {
        // Remove all non-numeric characters except + and spaces
        let sanitized = value.replace(/[^\d\+\s\-\(\)]/g, '');
        
        // Ensure only one + at the beginning
        if (sanitized.includes('+')) {
            const plusIndex = sanitized.indexOf('+');
            if (plusIndex > 0) {
                sanitized = sanitized.replace(/\+/g, '');
            } else {
                sanitized = '+' + sanitized.substring(1).replace(/\+/g, '');
            }
        }

        return sanitized;
    }

    /**
     * Sanitize URL input
     */
    sanitizeURL(value) {
        let sanitized = value.trim();
        
        // Remove dangerous protocols
        const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
        dangerousProtocols.forEach(protocol => {
            if (sanitized.toLowerCase().startsWith(protocol)) {
                sanitized = sanitized.substring(protocol.length);
            }
        });

        // Ensure http/https protocol
        if (sanitized && !sanitized.match(/^https?:\/\//i)) {
            sanitized = 'https://' + sanitized;
        }

        return sanitized;
    }

    /**
     * Sanitize number input
     */
    sanitizeNumber(value) {
        // Keep only digits, decimal point, and minus sign
        let sanitized = value.replace(/[^\d\.\-]/g, '');
        
        // Ensure only one decimal point
        const decimalCount = (sanitized.match(/\./g) || []).length;
        if (decimalCount > 1) {
            const firstDecimalIndex = sanitized.indexOf('.');
            sanitized = sanitized.substring(0, firstDecimalIndex + 1) + 
                       sanitized.substring(firstDecimalIndex + 1).replace(/\./g, '');
        }

        // Ensure minus sign only at the beginning
        if (sanitized.includes('-')) {
            const minusIndex = sanitized.indexOf('-');
            if (minusIndex > 0) {
                sanitized = sanitized.replace(/-/g, '');
            } else {
                sanitized = '-' + sanitized.substring(1).replace(/-/g, '');
            }
        }

        return sanitized;
    }

    /**
     * Sanitize text input
     */
    sanitizeText(value) {
        let sanitized = value;

        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');

        // Normalize whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        // Remove or escape HTML tags
        if (this.config.strictMode) {
            sanitized = this.stripHTML(sanitized);
        } else {
            sanitized = this.sanitizeHTML(sanitized);
        }

        // Remove control characters (except newlines and tabs)
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        return sanitized;
    }

    /**
     * Sanitize search input
     */
    sanitizeSearch(value) {
        let sanitized = value.trim();

        // Remove dangerous characters for search
        sanitized = sanitized.replace(/[<>'"]/g, '');
        
        // Remove excessive special characters
        sanitized = sanitized.replace(/[!@#$%^&*()+={}[\]|\\:";'<>?,./]{3,}/g, '');

        // Normalize whitespace
        sanitized = sanitized.replace(/\s+/g, ' ');

        return sanitized;
    }

    /**
     * Generic sanitization
     */
    sanitizeGeneric(value) {
        let sanitized = value;

        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');

        // Remove dangerous patterns
        sanitized = this.removeDangerousPatterns(sanitized);

        // Normalize whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        return sanitized;
    }

    /**
     * Strip HTML tags
     */
    stripHTML(value) {
        return value.replace(/<[^>]*>/g, '');
    }

    /**
     * Sanitize HTML (allow only safe tags)
     */
    sanitizeHTML(value) {
        let sanitized = value;

        // Remove script tags and their content
        sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

        // Remove dangerous tags
        const dangerousTags = ['iframe', 'object', 'embed', 'applet', 'form', 'input', 'button'];
        dangerousTags.forEach(tag => {
            const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gi');
            sanitized = sanitized.replace(regex, '');
            sanitized = sanitized.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
        });

        // Remove event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

        // Remove javascript: and vbscript: protocols
        sanitized = sanitized.replace(/(javascript|vbscript):/gi, '');

        return sanitized;
    }

    /**
     * Remove dangerous patterns
     */
    removeDangerousPatterns(value) {
        let sanitized = value;

        this.dangerousPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        return sanitized;
    }

    /**
     * Apply length limits
     */
    applyLengthLimits(value, inputType) {
        const maxLength = this.config.maxLength[inputType] || this.config.maxLength.text;
        
        if (value.length > maxLength) {
            return value.substring(0, maxLength);
        }

        return value;
    }

    /**
     * Apply custom sanitization rules
     */
    applyCustomRules(value, rules) {
        let sanitized = value;

        if (typeof rules === 'string') {
            // Parse comma-separated rules
            rules = rules.split(',').map(rule => rule.trim());
        }

        if (Array.isArray(rules)) {
            rules.forEach(rule => {
                switch (rule) {
                    case 'alphanumeric':
                        sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
                        break;
                    case 'numeric':
                        sanitized = sanitized.replace(/[^0-9]/g, '');
                        break;
                    case 'alpha':
                        sanitized = sanitized.replace(/[^a-zA-Z\s]/g, '');
                        break;
                    case 'lowercase':
                        sanitized = sanitized.toLowerCase();
                        break;
                    case 'uppercase':
                        sanitized = sanitized.toUpperCase();
                        break;
                    case 'trim':
                        sanitized = sanitized.trim();
                        break;
                    case 'no-html':
                        sanitized = this.stripHTML(sanitized);
                        break;
                    case 'no-special':
                        sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, '');
                        break;
                }
            });
        }

        return sanitized;
    }

    /**
     * Check if sanitization made significant changes
     */
    isSignificantChange(original, sanitized) {
        const lengthDiff = Math.abs(original.length - sanitized.length);
        const lengthChangePercent = (lengthDiff / original.length) * 100;
        
        return lengthChangePercent > 10 || lengthDiff > 20;
    }

    /**
     * Show sanitization notice to user
     */
    showSanitizationNotice(input) {
        // Remove existing notices
        const existingNotice = input.parentNode.querySelector('.sanitization-notice');
        if (existingNotice) {
            existingNotice.remove();
        }

        // Create notice
        const notice = document.createElement('div');
        notice.className = 'sanitization-notice';
        notice.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>Input was automatically cleaned for security</span>
        `;

        // Insert notice
        input.parentNode.insertBefore(notice, input.nextSibling);

        // Remove notice after 3 seconds
        setTimeout(() => {
            if (notice.parentNode) {
                notice.remove();
            }
        }, 3000);
    }

    /**
     * Validate input against patterns
     */
    validateInput(value, inputType) {
        const pattern = this.config.patterns[inputType];
        if (!pattern) return true;

        return pattern.test(value);
    }

    /**
     * Sanitize object (for API data)
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const sanitized = {};

        Object.keys(obj).forEach(key => {
            const value = obj[key];
            
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeGeneric(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        });

        return sanitized;
    }

    /**
     * Sanitize array
     */
    sanitizeArray(arr) {
        if (!Array.isArray(arr)) {
            return arr;
        }

        return arr.map(item => {
            if (typeof item === 'string') {
                return this.sanitizeGeneric(item);
            } else if (typeof item === 'object' && item !== null) {
                return this.sanitizeObject(item);
            } else {
                return item;
            }
        });
    }

    /**
     * Get sanitization statistics
     */
    getStats() {
        return {
            autoSanitize: this.config.autoSanitize,
            strictMode: this.config.strictMode,
            allowedTags: this.config.allowedTags.length,
            dangerousPatterns: this.dangerousPatterns.length,
            maxLengths: this.config.maxLength
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🧹 Sanitization config updated');
    }

    /**
     * Manual sanitization method for external use
     */
    sanitize(value, type = 'text', rules = null) {
        return this.sanitizeValue(value, type, rules);
    }
}

// Initialize sanitization system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mediabaySanitizer = new MediaBaySanitizer();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaBaySanitizer;
}