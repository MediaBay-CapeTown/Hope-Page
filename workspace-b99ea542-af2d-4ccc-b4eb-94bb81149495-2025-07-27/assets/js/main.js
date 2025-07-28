// MediaBay Website JavaScript
// Modern, interactive functionality with comprehensive features

class MediaBayWebsite {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.initializeComponents();
    }

    init() {
        // Initialize core functionality
        this.isLoading = true;
        this.currentUser = null;
        this.chatbotMessages = [];
        this.quoteData = {
            projectType: null,
            pages: null,
            features: [],
            basePrice: 0,
            multiplier: 1,
            featuresPrice: 0,
            totalPrice: 0
        };
        this.currentQuoteStep = 1;
        this.maxQuoteSteps = 3;
        
        // Voice recognition setup
        this.recognition = null;
        this.isListening = false;
        this.setupVoiceRecognition();
        
        // Dark mode setup
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.applyTheme();
        
        // Animation observer
        this.setupIntersectionObserver();
        
        // Loading sequence
        this.startLoadingSequence();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('nav-toggle').addEventListener('click', () => this.toggleNavigation());
        document.getElementById('nav-close').addEventListener('click', () => this.closeNavigation());
        
        // Dark mode toggle
        document.getElementById('dark-mode-toggle').addEventListener('click', () => this.toggleDarkMode());
        
        // Scroll progress
        window.addEventListener('scroll', () => this.updateScrollProgress());
        
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Authentication
        document.getElementById('login-btn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('signup-btn').addEventListener('click', () => this.showAuthModal('signup'));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('auth-switch-link').addEventListener('click', (e) => this.switchAuthMode(e));
        document.getElementById('auth-form').addEventListener('submit', (e) => this.handleAuth(e));
        
        // Quote calculator
        this.setupQuoteCalculator();
        
        // Contact form
        document.getElementById('contact-form').addEventListener('submit', (e) => this.handleContactForm(e));
        
        // Newsletter
        document.getElementById('newsletter-form').addEventListener('submit', (e) => this.handleNewsletter(e));
        
        // Chatbot
        this.setupChatbot();
        
        // Modal handling
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-overlay')) {
                this.closeModal();
            }
        });
        
        // Industry cards
        document.querySelectorAll('.industry-card').forEach(card => {
            card.addEventListener('click', () => this.showIndustryTemplates(card.dataset.industry));
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Form auto-save
        this.setupFormAutoSave();
    }

    initializeComponents() {
        // Initialize all interactive components
        this.initializeCounters();
        this.initializeParallax();
        this.initializeTooltips();
        this.initializeLazyLoading();
        
        // Check authentication status
        this.checkAuthStatus();
        
        // Initialize PWA features
        this.initializePWA();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
    }

    // Loading and Animation System
    startLoadingSequence() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.querySelector('.loading-progress');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.classList.add('fade-out');
                    document.body.classList.remove('loading');
                    this.isLoading = false;
                    this.startAnimations();
                }, 500);
            }
        }, 100);
    }

    startAnimations() {
        // Trigger reveal animations
        const revealElements = document.querySelectorAll('.reveal-text');
        revealElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animationDelay = `${index * 0.2}s`;
                element.classList.add('animate');
            }, index * 200);
        });
        
        // Start counter animations
        this.animateCounters();
        
        // Initialize AOS (Animate On Scroll)
        this.initializeAOS();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, options);
        
        // Observe all elements with data-aos attribute
        document.querySelectorAll('[data-aos]').forEach(el => {
            this.observer.observe(el);
        });
    }

    initializeAOS() {
        const elements = document.querySelectorAll('[data-aos]');
        elements.forEach(element => {
            const delay = element.getAttribute('data-aos-delay') || 0;
            setTimeout(() => {
                element.classList.add('aos-animate');
            }, parseInt(delay));
        });
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current);
            }, 16);
        });
    }

    // Navigation System
    toggleNavigation() {
        const sideNav = document.getElementById('side-nav');
        const navToggle = document.getElementById('nav-toggle');
        
        sideNav.classList.toggle('active');
        navToggle.classList.toggle('active');
        
        // Prevent body scroll when nav is open
        if (sideNav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeNavigation() {
        const sideNav = document.getElementById('side-nav');
        const navToggle = document.getElementById('nav-toggle');
        
        sideNav.classList.remove('active');
        navToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Scroll to section
        this.scrollToSection(targetId.substring(1));
        this.closeNavigation();
    }

    updateScrollProgress() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        document.getElementById('scroll-progress').style.width = `${scrollPercent}%`;
        
        // Update active navigation based on scroll position
        this.updateActiveNavigation();
    }

    updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // Theme System
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
    }

    applyTheme() {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const icon = darkModeToggle.querySelector('i');
        
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            icon.className = 'fas fa-moon';
        }
    }

    // Authentication System
    showAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const submitBtn = document.getElementById('auth-submit');
        const switchText = document.getElementById('auth-switch-text');
        const switchLink = document.getElementById('auth-switch-link');
        const confirmPasswordGroup = document.getElementById('confirm-password-group');
        
        if (mode === 'login') {
            title.textContent = 'Login';
            submitBtn.textContent = 'Login';
            switchText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-switch-link">Sign up</a>';
            confirmPasswordGroup.style.display = 'none';
        } else {
            title.textContent = 'Sign Up';
            submitBtn.textContent = 'Sign Up';
            switchText.innerHTML = 'Already have an account? <a href="#" id="auth-switch-link">Login</a>';
            confirmPasswordGroup.style.display = 'block';
        }
        
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Re-attach event listener for the new switch link
        document.getElementById('auth-switch-link').addEventListener('click', (e) => this.switchAuthMode(e));
    }

    switchAuthMode(e) {
        e.preventDefault();
        const title = document.getElementById('modal-title').textContent;
        const newMode = title === 'Login' ? 'signup' : 'login';
        this.showAuthModal(newMode);
    }

    handleAuth(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');
        const isSignup = document.getElementById('modal-title').textContent === 'Sign Up';
        
        // Basic validation
        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        
        if (isSignup && password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        // Simulate authentication
        this.simulateAuth(email, password, isSignup);
    }

    simulateAuth(email, password, isSignup) {
        // Show loading state
        const submitBtn = document.getElementById('auth-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            // Simulate successful authentication
            this.currentUser = {
                email: email,
                name: email.split('@')[0],
                avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=3B82F6&color=fff`
            };
            
            this.updateAuthUI();
            this.closeModal();
            this.showNotification(isSignup ? 'Account created successfully!' : 'Welcome back!', 'success');
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    updateAuthUI() {
        const authSection = document.getElementById('nav-auth');
        const userSection = document.getElementById('nav-user');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (this.currentUser) {
            authSection.classList.add('hidden');
            userSection.classList.remove('hidden');
            userName.textContent = this.currentUser.name;
            userAvatar.src = this.currentUser.avatar;
        } else {
            authSection.classList.remove('hidden');
            userSection.classList.add('hidden');
        }
    }

    logout() {
        this.currentUser = null;
        this.updateAuthUI();
        this.showNotification('Logged out successfully', 'info');
    }

    checkAuthStatus() {
        // Check if user is logged in (simulate with localStorage)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateAuthUI();
        }
    }

    // Quote Calculator System
    setupQuoteCalculator() {
        const nextBtn = document.getElementById('quote-next');
        const prevBtn = document.getElementById('quote-prev');
        
        nextBtn.addEventListener('click', () => this.nextQuoteStep());
        prevBtn.addEventListener('click', () => this.prevQuoteStep());
        
        // Setup option listeners
        document.querySelectorAll('input[name="project-type"]').forEach(input => {
            input.addEventListener('change', () => this.updateQuoteCalculation());
        });
        
        document.querySelectorAll('input[name="pages"]').forEach(input => {
            input.addEventListener('change', () => this.updateQuoteCalculation());
        });
        
        document.querySelectorAll('input[name="features"]').forEach(input => {
            input.addEventListener('change', () => this.updateQuoteCalculation());
        });
    }

    nextQuoteStep() {
        if (this.currentQuoteStep < this.maxQuoteSteps) {
            // Validate current step
            if (!this.validateQuoteStep(this.currentQuoteStep)) {
                return;
            }
            
            this.currentQuoteStep++;
            this.updateQuoteStepDisplay();
        }
    }

    prevQuoteStep() {
        if (this.currentQuoteStep > 1) {
            this.currentQuoteStep--;
            this.updateQuoteStepDisplay();
        }
    }

    validateQuoteStep(step) {
        switch (step) {
            case 1:
                const projectType = document.querySelector('input[name="project-type"]:checked');
                if (!projectType) {
                    this.showNotification('Please select a project type', 'warning');
                    return false;
                }
                break;
            case 2:
                const pages = document.querySelector('input[name="pages"]:checked');
                if (!pages) {
                    this.showNotification('Please select the number of pages', 'warning');
                    return false;
                }
                break;
        }
        return true;
    }

    updateQuoteStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.quote-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        document.querySelector(`[data-step="${this.currentQuoteStep}"]`).classList.add('active');
        
        // Update navigation buttons
        const nextBtn = document.getElementById('quote-next');
        const prevBtn = document.getElementById('quote-prev');
        
        prevBtn.style.display = this.currentQuoteStep > 1 ? 'flex' : 'none';
        
        if (this.currentQuoteStep === this.maxQuoteSteps) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> Complete';
            nextBtn.onclick = () => this.completeQuote();
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            nextBtn.onclick = () => this.nextQuoteStep();
        }
    }

    updateQuoteCalculation() {
        // Get selected values
        const projectType = document.querySelector('input[name="project-type"]:checked');
        const pages = document.querySelector('input[name="pages"]:checked');
        const features = document.querySelectorAll('input[name="features"]:checked');
        
        // Calculate base price
        if (projectType) {
            this.quoteData.basePrice = parseInt(projectType.dataset.price);
            this.quoteData.projectType = projectType.value;
        }
        
        // Calculate page multiplier
        if (pages) {
            this.quoteData.multiplier = parseFloat(pages.dataset.multiplier);
            this.quoteData.pages = pages.value;
        }
        
        // Calculate features price
        this.quoteData.featuresPrice = 0;
        this.quoteData.features = [];
        features.forEach(feature => {
            this.quoteData.featuresPrice += parseInt(feature.dataset.price);
            this.quoteData.features.push(feature.value);
        });
        
        // Calculate total
        this.quoteData.totalPrice = (this.quoteData.basePrice * this.quoteData.multiplier) + this.quoteData.featuresPrice;
        
        // Update display
        this.updateQuoteDisplay();
    }

    updateQuoteDisplay() {
        document.getElementById('base-price').textContent = `R${this.quoteData.basePrice.toLocaleString()}`;
        document.getElementById('page-multiplier').textContent = `×${this.quoteData.multiplier}`;
        document.getElementById('features-price').textContent = `R${this.quoteData.featuresPrice.toLocaleString()}`;
        document.getElementById('total-price').textContent = `R${this.quoteData.totalPrice.toLocaleString()}`;
    }

    completeQuote() {
        if (!this.validateQuoteStep(this.currentQuoteStep)) {
            return;
        }
        
        // Store quote data
        localStorage.setItem('quoteData', JSON.stringify(this.quoteData));
        
        // Show completion message and redirect to contact
        this.showNotification('Quote calculated! Redirecting to contact form...', 'success');
        
        setTimeout(() => {
            this.scrollToSection('contact');
            this.prefillContactForm();
        }, 2000);
    }

    prefillContactForm() {
        const projectTypeSelect = document.getElementById('project-type');
        const messageTextarea = document.getElementById('message');
        
        // Map quote project type to contact form options
        const projectTypeMap = {
            'basic': 'basic-website',
            'business': 'business-website',
            'ecommerce': 'ecommerce',
            'custom': 'web-application'
        };
        
        if (this.quoteData.projectType && projectTypeMap[this.quoteData.projectType]) {
            projectTypeSelect.value = projectTypeMap[this.quoteData.projectType];
        }
        
        // Prefill message with quote details
        let message = `Hi! I've used your quote calculator and I'm interested in a ${this.quoteData.projectType} project.\n\n`;
        message += `Project Details:\n`;
        message += `- Project Type: ${this.quoteData.projectType}\n`;
        message += `- Number of Pages: ${this.quoteData.pages}\n`;
        if (this.quoteData.features.length > 0) {
            message += `- Additional Features: ${this.quoteData.features.join(', ')}\n`;
        }
        message += `- Estimated Budget: R${this.quoteData.totalPrice.toLocaleString()}\n\n`;
        message += `Please provide me with a detailed quote for this project.`;
        
        messageTextarea.value = message;
    }

    // Contact Form System
    handleContactForm(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        if (!this.validateContactForm(data)) {
            return;
        }
        
        // Check honeypot
        if (data.website) {
            console.log('Spam detected');
            return;
        }
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
            this.submitContactForm(data);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    validateContactForm(data) {
        const errors = {};
        
        // Name validation
        if (!data.name || data.name.trim().length < 2) {
            errors.name = 'Please enter your full name';
        }
        
        // Email validation
        if (!data.email || !this.validateEmail(data.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        // Project type validation
        if (!data['project-type']) {
            errors['project-type'] = 'Please select a project type';
        }
        
        // Budget validation
        if (!data.budget) {
            errors.budget = 'Please select your budget range';
        }
        
        // Message validation
        if (!data.message || data.message.trim().length < 10) {
            errors.message = 'Please provide more details about your project (minimum 10 characters)';
        }
        
        // Terms validation
        if (!data.terms) {
            errors.terms = 'Please accept the terms and conditions';
        }
        
        // Display errors
        this.displayFormErrors(errors);
        
        return Object.keys(errors).length === 0;
    }

    displayFormErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('show');
        });
        
        // Show new errors
        Object.keys(errors).forEach(field => {
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.textContent = errors[field];
                errorElement.classList.add('show');
            }
        });
        
        // Focus on first error field
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
            const field = document.getElementById(firstErrorField) || document.querySelector(`[name="${firstErrorField}"]`);
            if (field) {
                field.focus();
            }
        }
    }

    submitContactForm(data) {
        // In a real application, this would send data to a server
        console.log('Contact form submitted:', data);
        
        // Show success message
        this.showNotification('Thank you! Your message has been sent. We\'ll get back to you within 24 hours.', 'success');
        
        // Reset form
        document.getElementById('contact-form').reset();
        
        // Add to activity log if user is logged in
        if (this.currentUser) {
            this.addActivityLog('Contact form submitted', data);
        }
        
        // Send confirmation email (simulated)
        this.sendConfirmationEmail(data.email, data.name);
    }

    sendConfirmationEmail(email, name) {
        // Simulate email sending
        console.log(`Confirmation email sent to ${email}`);
        
        // In a real application, this would integrate with an email service
        // like SendGrid, Mailgun, or a backend API
    }

    // Newsletter System
    handleNewsletter(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');
        
        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }
        
        // Simulate newsletter signup
        setTimeout(() => {
            this.showNotification('Successfully subscribed to our newsletter!', 'success');
            e.target.reset();
        }, 1000);
    }

    // Chatbot System
    setupChatbot() {
        const chatbotToggle = document.getElementById('chatbot-toggle');
        const chatbotWindow = document.getElementById('chatbot-window');
        const chatbotClose = document.getElementById('chatbot-close');
        const sendBtn = document.getElementById('send-btn');
        const chatbotInput = document.getElementById('chatbot-input');
        const voiceBtn = document.getElementById('voice-btn');
        
        chatbotToggle.addEventListener('click', () => this.toggleChatbot());
        chatbotClose.addEventListener('click', () => this.closeChatbot());
        sendBtn.addEventListener('click', () => this.sendChatMessage());
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Quick action buttons
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
        });
        
        // Initialize chatbot with welcome message
        this.initializeChatbot();
    }

    toggleChatbot() {
        const chatbotWindow = document.getElementById('chatbot-window');
        const chatbotBadge = document.getElementById('chatbot-badge');
        
        chatbotWindow.classList.toggle('active');
        
        if (chatbotWindow.classList.contains('active')) {
            chatbotBadge.style.display = 'none';
            document.getElementById('chatbot-input').focus();
        }
    }

    closeChatbot() {
        document.getElementById('chatbot-window').classList.remove('active');
    }

    initializeChatbot() {
        // Add initial welcome message
        this.addChatMessage('bot', 'Hi! I\'m your MediaBay assistant. How can I help you today?', true);
    }

    sendChatMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addChatMessage('user', message);
        input.value = '';
        
        // Process message and generate response
        setTimeout(() => {
            const response = this.generateChatResponse(message);
            this.addChatMessage('bot', response);
        }, 1000);
    }

    addChatMessage(sender, message, showQuickActions = false) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
                ${showQuickActions ? this.getQuickActionsHTML() : ''}
            </div>
            <span class="message-time">${currentTime}</span>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Re-attach quick action listeners if added
        if (showQuickActions) {
            messageElement.querySelectorAll('.quick-action').forEach(btn => {
                btn.addEventListener('click', () => this.handleQuickAction(btn.dataset.action));
            });
        }
    }

    getQuickActionsHTML() {
        return `
            <div class="quick-actions">
                <button class="quick-action" data-action="pricing">💰 Pricing Info</button>
                <button class="quick-action" data-action="templates">🎨 View Templates</button>
                <button class="quick-action" data-action="location">📍 Our Location</button>
                <button class="quick-action" data-action="meeting">📅 Schedule Meeting</button>
            </div>
        `;
    }

    generateChatResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Pricing inquiries
        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
            return 'Our pricing varies based on project complexity. Basic websites start from R15,000, business websites from R25,000, and e-commerce solutions from R45,000. Would you like to use our quote calculator for a more accurate estimate?';
        }
        
        // Template inquiries
        if (lowerMessage.includes('template') || lowerMessage.includes('design') || lowerMessage.includes('example')) {
            return 'We have specialized templates for various industries including photography, e-commerce, education, fashion, restaurants, and healthcare. Each template is fully customizable to match your brand. Which industry are you interested in?';
        }
        
        // Location inquiries
        if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('address')) {
            return 'We\'re based in Cape Town, South Africa, but we serve clients worldwide. We offer both in-person consultations for local clients and remote collaboration for international projects. Would you like to see our location on the map?';
        }
        
        // Meeting/consultation inquiries
        if (lowerMessage.includes('meeting') || lowerMessage.includes('consultation') || lowerMessage.includes('schedule')) {
            return 'I\'d be happy to help you schedule a consultation! We offer free 30-minute discovery calls to discuss your project requirements. Please fill out our contact form with your preferred time, and we\'ll get back to you within 24 hours.';
        }
        
        // Timeline inquiries
        if (lowerMessage.includes('time') || lowerMessage.includes('deadline') || lowerMessage.includes('delivery')) {
            return 'Project timelines vary based on complexity. Typically, basic websites take 2-3 weeks, business websites 3-4 weeks, and e-commerce solutions 4-6 weeks. We always provide detailed timelines during our initial consultation.';
        }
        
        // Technology inquiries
        if (lowerMessage.includes('technology') || lowerMessage.includes('tech') || lowerMessage.includes('platform')) {
            return 'We use modern technologies including React, Next.js, Node.js, and various CMS platforms. All our websites are mobile-responsive, SEO-optimized, and built with performance in mind. What specific technology are you curious about?';
        }
        
        // Support inquiries
        if (lowerMessage.includes('support') || lowerMessage.includes('maintenance') || lowerMessage.includes('help')) {
            return 'We provide ongoing support and maintenance for all our projects. This includes security updates, content updates, performance monitoring, and technical support. We offer different support packages based on your needs.';
        }
        
        // Default response
        return 'Thank you for your question! For detailed information about your specific needs, I\'d recommend filling out our contact form or scheduling a consultation. Our team will provide you with personalized answers and recommendations. Is there anything specific about our services you\'d like to know more about?';
    }

    handleQuickAction(action) {
        switch (action) {
            case 'pricing':
                this.addChatMessage('user', 'Tell me about your pricing');
                setTimeout(() => {
                    const response = this.generateChatResponse('pricing');
                    this.addChatMessage('bot', response);
                }, 500);
                break;
                
            case 'templates':
                this.addChatMessage('user', 'Show me your templates');
                setTimeout(() => {
                    this.addChatMessage('bot', 'Here are our industry-specific templates. Let me redirect you to our templates section.');
                    this.scrollToSection('industries');
                    this.closeChatbot();
                }, 500);
                break;
                
            case 'location':
                this.addChatMessage('user', 'Where are you located?');
                setTimeout(() => {
                    this.addChatMessage('bot', 'We\'re located in Cape Town, South Africa. Let me show you our location on the map.');
                    this.scrollToSection('contact');
                    this.closeChatbot();
                }, 500);
                break;
                
            case 'meeting':
                this.addChatMessage('user', 'I want to schedule a meeting');
                setTimeout(() => {
                    this.addChatMessage('bot', 'Great! Let me redirect you to our contact form where you can schedule a consultation.');
                    this.scrollToSection('contact');
                    this.closeChatbot();
                }, 500);
                break;
        }
    }

    // Voice Recognition System
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isListening = true;
                document.getElementById('voice-btn').classList.add('active');
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                document.getElementById('voice-btn').classList.remove('active');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('chatbot-input').value = transcript;
                this.sendChatMessage();
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showNotification('Voice recognition error. Please try again.', 'error');
            };
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Voice recognition not supported in this browser', 'warning');
            return;
        }
        
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    // Utility Functions
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const offsetTop = section.offsetTop - 80; // Account for fixed header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
        
        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        return colors[type] || colors.info;
    }

    removeNotification(notification) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // Modal System
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        const modals = document.querySelectorAll('.modal');
        
        overlay.classList.remove('active');
        modals.forEach(modal => modal.classList.remove('active'));
        document.body.style.overflow = '';
    }

    showModal(modalId) {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById(`${modalId}-modal`);
        
        if (modal) {
            overlay.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Industry Templates
    showIndustryTemplates(industry) {
        const templates = {
            photography: [
                'Portfolio Showcase',
                'Wedding Photography',
                'Studio Gallery',
                'Event Photography'
            ],
            ecommerce: [
                'Fashion Store',
                'Electronics Shop',
                'Handmade Crafts',
                'Digital Products'
            ],
            education: [
                'Online Courses',
                'University Portal',
                'Training Center',
                'Certification Platform'
            ],
            fashion: [
                'Boutique Store',
                'Designer Portfolio',
                'Fashion Blog',
                'Clothing Brand'
            ],
            restaurant: [
                'Fine Dining',
                'Fast Food Chain',
                'Cafe & Bakery',
                'Food Delivery'
            ],
            healthcare: [
                'Medical Practice',
                'Dental Clinic',
                'Wellness Center',
                'Telemedicine'
            ]
        };
        
        const industryTemplates = templates[industry] || [];
        const templateList = industryTemplates.map(template => `• ${template}`).join('\n');
        
        this.showNotification(`${industry.charAt(0).toUpperCase() + industry.slice(1)} Templates:\n${templateList}`, 'info');
    }

    // Form Auto-save
    setupFormAutoSave() {
        const forms = ['contact-form'];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('input', () => {
                        this.autoSaveForm(formId, input.name, input.value);
                    });
                });
                
                // Restore saved data
                this.restoreFormData(formId);
            }
        });
    }

    autoSaveForm(formId, fieldName, value) {
        const savedData = JSON.parse(localStorage.getItem(`form_${formId}`) || '{}');
        savedData[fieldName] = value;
        localStorage.setItem(`form_${formId}`, JSON.stringify(savedData));
    }

    restoreFormData(formId) {
        const savedData = JSON.parse(localStorage.getItem(`form_${formId}`) || '{}');
        
        Object.keys(savedData).forEach(fieldName => {
            const field = document.querySelector(`#${formId} [name="${fieldName}"]`);
            if (field && savedData[fieldName]) {
                field.value = savedData[fieldName];
            }
        });
    }

    clearFormData(formId) {
        localStorage.removeItem(`form_${formId}`);
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Performance:', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                totalTime: perfData.loadEventEnd - perfData.fetchStart
            });
        });
        
        // Monitor resource loading
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > 1000) { // Log slow resources
                    console.warn('Slow resource:', entry.name, entry.duration + 'ms');
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }

    // PWA Features
    initializePWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
        
        // Handle install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.showNotification('App installed successfully!', 'success');
        });
    }

    showInstallPrompt() {
        // Create install button
        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install App';
        installBtn.className = 'btn btn-primary install-btn';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
        `;
        
        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    }
                    deferredPrompt = null;
                    installBtn.remove();
                });
            }
        });
        
        document.body.appendChild(installBtn);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.remove();
            }
        }, 10000);
    }

    // Additional Features
    initializeCounters() {
        // Already implemented in startAnimations
    }

    initializeParallax() {
        const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            parallaxElements.forEach((element, index) => {
                const speed = (index + 1) * 0.1;
                element.style.transform = `translateY(${rate * speed}px)`;
            });
        });
    }

    initializeTooltips() {
        // Add tooltips to elements with title attributes
        document.querySelectorAll('[title]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('title'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    initializeLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    handleKeyboardNavigation(e) {
        // ESC key closes modals and navigation
        if (e.key === 'Escape') {
            this.closeModal();
            this.closeNavigation();
            this.closeChatbot();
        }
        
        // Tab navigation improvements
        if (e.key === 'Tab') {
            // Add focus styles for keyboard navigation
            document.body.classList.add('keyboard-navigation');
        }
    }

    handleResize() {
        // Handle responsive behavior on window resize
        if (window.innerWidth > 1024) {
            this.closeNavigation();
        }
        
        // Adjust chatbot position on mobile
        const chatbot = document.getElementById('chatbot');
        if (window.innerWidth <= 768) {
            chatbot.style.bottom = '10px';
            chatbot.style.right = '10px';
        } else {
            chatbot.style.bottom = '2rem';
            chatbot.style.right = '2rem';
        }
    }

    addActivityLog(action, data = {}) {
        if (!this.currentUser) return;
        
        const log = {
            timestamp: new Date().toISOString(),
            action: action,
            data: data,
            user: this.currentUser.email
        };
        
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.push(log);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('activityLogs', JSON.stringify(logs));
    }
}

// Global functions for HTML onclick handlers
function scrollToSection(sectionId) {
    window.mediaBayWebsite.scrollToSection(sectionId);
}

function showModal(modalId) {
    window.mediaBayWebsite.showModal(modalId);
}

function closeModal() {
    window.mediaBayWebsite.closeModal();
}

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mediaBayWebsite = new MediaBayWebsite();
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .keyboard-navigation *:focus {
        outline: 2px solid #3B82F6 !important;
        outline-offset: 2px !important;
    }
    
    .install-btn {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
    }
`;
document.head.appendChild(style);