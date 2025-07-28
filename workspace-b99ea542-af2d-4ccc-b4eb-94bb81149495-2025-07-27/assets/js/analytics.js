/**
 * MediaBay Analytics Integration
 * Comprehensive analytics tracking system
 */

class MediaBayAnalytics {
    constructor() {
        this.config = {
            googleAnalytics: {
                measurementId: 'G-XXXXXXXXXX', // Replace with actual GA4 ID
                enabled: true
            },
            facebookPixel: {
                pixelId: '1234567890123456', // Replace with actual Pixel ID
                enabled: true
            },
            hotjar: {
                hjid: 1234567, // Replace with actual Hotjar ID
                hjsv: 6,
                enabled: true
            },
            customEvents: {
                enabled: true,
                endpoint: '/api/analytics/events'
            }
        };

        this.sessionData = {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: []
        };

        this.init();
    }

    /**
     * Initialize analytics services
     */
    init() {
        console.log('🔍 Initializing MediaBay Analytics...');
        
        // Initialize Google Analytics
        if (this.config.googleAnalytics.enabled) {
            this.initGoogleAnalytics();
        }

        // Initialize Facebook Pixel
        if (this.config.facebookPixel.enabled) {
            this.initFacebookPixel();
        }

        // Initialize Hotjar
        if (this.config.hotjar.enabled) {
            this.initHotjar();
        }

        // Set up event listeners
        this.setupEventListeners();

        // Track initial page view
        this.trackPageView();

        console.log('✅ Analytics initialized successfully');
    }

    /**
     * Initialize Google Analytics 4
     */
    initGoogleAnalytics() {
        try {
            // Load gtag script
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalytics.measurementId}`;
            document.head.appendChild(script);

            // Initialize gtag
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            
            gtag('js', new Date());
            gtag('config', this.config.googleAnalytics.measurementId, {
                page_title: document.title,
                page_location: window.location.href,
                custom_map: {
                    'custom_parameter_1': 'client_type',
                    'custom_parameter_2': 'service_interest'
                }
            });

            console.log('✅ Google Analytics initialized');
        } catch (error) {
            console.error('❌ Google Analytics initialization failed:', error);
        }
    }

    /**
     * Initialize Facebook Pixel
     */
    initFacebookPixel() {
        try {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', this.config.facebookPixel.pixelId);
            fbq('track', 'PageView');

            console.log('✅ Facebook Pixel initialized');
        } catch (error) {
            console.error('❌ Facebook Pixel initialization failed:', error);
        }
    }

    /**
     * Initialize Hotjar
     */
    initHotjar() {
        try {
            (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:this.config.hotjar.hjid,hjsv:this.config.hotjar.hjsv};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');

            console.log('✅ Hotjar initialized');
        } catch (error) {
            console.error('❌ Hotjar initialization failed:', error);
        }
    }

    /**
     * Set up event listeners for automatic tracking
     */
    setupEventListeners() {
        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.trackEvent('form_submit', {
                    form_id: form.id || 'unknown',
                    form_name: form.name || 'unknown',
                    page_url: window.location.href
                });
            }
        });

        // Track button clicks
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, .btn, [role="button"]');
            if (button) {
                this.trackEvent('button_click', {
                    button_text: button.textContent?.trim() || 'unknown',
                    button_id: button.id || 'unknown',
                    button_class: button.className || 'unknown',
                    page_url: window.location.href
                });
            }
        });

        // Track link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const isExternal = !link.href.startsWith(window.location.origin);
                this.trackEvent('link_click', {
                    link_url: link.href,
                    link_text: link.textContent?.trim() || 'unknown',
                    is_external: isExternal,
                    page_url: window.location.href
                });
            }
        });

        // Track scroll depth
        let maxScrollDepth = 0;
        const trackScrollDepth = () => {
            const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
                maxScrollDepth = scrollDepth;
                this.trackEvent('scroll_depth', {
                    depth_percentage: scrollDepth,
                    page_url: window.location.href
                });
            }
        };

        window.addEventListener('scroll', this.throttle(trackScrollDepth, 1000));

        // Track time on page
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - this.sessionData.startTime;
            this.trackEvent('time_on_page', {
                duration_ms: timeOnPage,
                duration_seconds: Math.round(timeOnPage / 1000),
                page_url: window.location.href
            });
        });

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility_change', {
                visibility_state: document.visibilityState,
                page_url: window.location.href
            });
        });
    }

    /**
     * Track page view
     */
    trackPageView(customData = {}) {
        this.sessionData.pageViews++;
        
        const pageData = {
            page_title: document.title,
            page_url: window.location.href,
            page_path: window.location.pathname,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            session_id: this.sessionData.sessionId,
            page_view_count: this.sessionData.pageViews,
            timestamp: new Date().toISOString(),
            ...customData
        };

        // Send to Google Analytics
        if (this.config.googleAnalytics.enabled && window.gtag) {
            gtag('event', 'page_view', pageData);
        }

        // Send to Facebook Pixel
        if (this.config.facebookPixel.enabled && window.fbq) {
            fbq('track', 'PageView', pageData);
        }

        // Send to custom endpoint
        this.sendCustomEvent('page_view', pageData);

        console.log('📊 Page view tracked:', pageData);
    }

    /**
     * Track custom event
     */
    trackEvent(eventName, eventData = {}) {
        const eventPayload = {
            event_name: eventName,
            session_id: this.sessionData.sessionId,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            ...eventData
        };

        this.sessionData.events.push(eventPayload);

        // Send to Google Analytics
        if (this.config.googleAnalytics.enabled && window.gtag) {
            gtag('event', eventName, eventPayload);
        }

        // Send to Facebook Pixel
        if (this.config.facebookPixel.enabled && window.fbq) {
            fbq('trackCustom', eventName, eventPayload);
        }

        // Send to custom endpoint
        this.sendCustomEvent(eventName, eventPayload);

        console.log(`📊 Event tracked: ${eventName}`, eventPayload);
    }

    /**
     * Track conversion events
     */
    trackConversion(conversionType, conversionData = {}) {
        const conversionPayload = {
            conversion_type: conversionType,
            conversion_value: conversionData.value || 0,
            conversion_currency: conversionData.currency || 'ZAR',
            session_id: this.sessionData.sessionId,
            timestamp: new Date().toISOString(),
            ...conversionData
        };

        // Send to Google Analytics
        if (this.config.googleAnalytics.enabled && window.gtag) {
            gtag('event', 'conversion', {
                send_to: this.config.googleAnalytics.measurementId,
                value: conversionPayload.conversion_value,
                currency: conversionPayload.conversion_currency,
                ...conversionPayload
            });
        }

        // Send to Facebook Pixel
        if (this.config.facebookPixel.enabled && window.fbq) {
            fbq('track', 'Purchase', {
                value: conversionPayload.conversion_value,
                currency: conversionPayload.conversion_currency,
                ...conversionPayload
            });
        }

        this.trackEvent('conversion', conversionPayload);
        console.log(`💰 Conversion tracked: ${conversionType}`, conversionPayload);
    }

    /**
     * Track user identification
     */
    identifyUser(userId, userProperties = {}) {
        const userPayload = {
            user_id: userId,
            session_id: this.sessionData.sessionId,
            timestamp: new Date().toISOString(),
            ...userProperties
        };

        // Send to Google Analytics
        if (this.config.googleAnalytics.enabled && window.gtag) {
            gtag('config', this.config.googleAnalytics.measurementId, {
                user_id: userId,
                custom_map: userProperties
            });
        }

        // Send to Facebook Pixel
        if (this.config.facebookPixel.enabled && window.fbq) {
            fbq('track', 'CompleteRegistration', userPayload);
        }

        this.trackEvent('user_identified', userPayload);
        console.log('👤 User identified:', userPayload);
    }

    /**
     * Track business-specific events
     */
    trackBusinessEvent(eventType, eventData = {}) {
        const businessEvents = {
            quote_requested: () => {
                this.trackConversion('quote_request', {
                    value: eventData.estimated_value || 0,
                    service_type: eventData.service_type,
                    industry: eventData.industry
                });
            },
            contact_form_submitted: () => {
                this.trackConversion('lead_generation', {
                    lead_source: 'contact_form',
                    service_interest: eventData.service_interest
                });
            },
            phone_call_initiated: () => {
                this.trackEvent('phone_call_click', {
                    phone_number: eventData.phone_number,
                    call_source: eventData.source || 'website'
                });
            },
            email_clicked: () => {
                this.trackEvent('email_click', {
                    email_address: eventData.email_address,
                    email_source: eventData.source || 'website'
                });
            },
            service_viewed: () => {
                this.trackEvent('service_interest', {
                    service_name: eventData.service_name,
                    service_category: eventData.service_category
                });
            },
            portfolio_item_viewed: () => {
                this.trackEvent('portfolio_engagement', {
                    portfolio_item: eventData.portfolio_item,
                    engagement_type: 'view'
                });
            },
            chatbot_interaction: () => {
                this.trackEvent('chatbot_engagement', {
                    interaction_type: eventData.interaction_type,
                    message_count: eventData.message_count
                });
            }
        };

        if (businessEvents[eventType]) {
            businessEvents[eventType]();
        } else {
            this.trackEvent(eventType, eventData);
        }
    }

    /**
     * Send custom event to backend
     */
    async sendCustomEvent(eventName, eventData) {
        if (!this.config.customEvents.enabled) return;

        try {
            await fetch(this.config.customEvents.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_name: eventName,
                    event_data: eventData,
                    session_id: this.sessionData.sessionId,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.warn('⚠️ Failed to send custom event:', error);
        }
    }

    /**
     * Get analytics dashboard data
     */
    async getDashboardData(dateRange = '30d') {
        try {
            const response = await fetch(`/api/analytics/dashboard?range=${dateRange}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch dashboard data:', error);
            return null;
        }
    }

    /**
     * Generate session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Throttle function for performance
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /**
     * Get session data
     */
    getSessionData() {
        return {
            ...this.sessionData,
            duration: Date.now() - this.sessionData.startTime
        };
    }

    /**
     * Export analytics data
     */
    exportData() {
        const exportData = {
            session: this.getSessionData(),
            config: this.config,
            browser_info: {
                user_agent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookie_enabled: navigator.cookieEnabled,
                online: navigator.onLine
            },
            page_info: {
                title: document.title,
                url: window.location.href,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            }
        };

        return exportData;
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mediaBayAnalytics = new MediaBayAnalytics();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaBayAnalytics;
}