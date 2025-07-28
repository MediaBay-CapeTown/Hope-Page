// Dashboard and Onboarding JavaScript Functions
// Extends the main MediaBay website functionality

// Onboarding Wizard Functions
let currentOnboardingStep = 1;
const maxOnboardingSteps = 5;
let onboardingData = {};

function showOnboarding() {
    // Load the onboarding component
    loadComponent('onboarding-wizard.html', () => {
        const modal = document.getElementById('onboarding-modal');
        const overlay = document.getElementById('modal-overlay');
        
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Initialize onboarding
        initializeOnboarding();
    });
}

function initializeOnboarding() {
    currentOnboardingStep = 1;
    onboardingData = {};
    updateOnboardingProgress();
    
    // Setup form listeners
    setupOnboardingFormListeners();
}

function setupOnboardingFormListeners() {
    // File upload handling
    const fileUpload = document.querySelector('#brand-upload input[type="file"]');
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }
    
    // Form validation on input
    const inputs = document.querySelectorAll('.onboarding-step input, .onboarding-step select, .onboarding-step textarea');
    inputs.forEach(input => {
        input.addEventListener('input', validateCurrentStep);
        input.addEventListener('change', saveOnboardingData);
    });
}

function nextOnboardingStep() {
    if (!validateCurrentStep()) {
        return;
    }
    
    saveOnboardingData();
    
    if (currentOnboardingStep < maxOnboardingSteps) {
        currentOnboardingStep++;
        updateOnboardingStepDisplay();
        updateOnboardingProgress();
    } else {
        completeOnboarding();
    }
}

function prevOnboardingStep() {
    if (currentOnboardingStep > 1) {
        currentOnboardingStep--;
        updateOnboardingStepDisplay();
        updateOnboardingProgress();
    }
}

function updateOnboardingStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.onboarding-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show current step
    const currentStep = document.querySelector(`[data-step="${currentOnboardingStep}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('onboarding-prev');
    const nextBtn = document.getElementById('onboarding-next');
    
    prevBtn.style.display = currentOnboardingStep > 1 ? 'flex' : 'none';
    
    if (currentOnboardingStep === maxOnboardingSteps) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> Complete Setup';
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
    }
    
    // Update step indicators
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index + 1 <= currentOnboardingStep);
    });
}

function updateOnboardingProgress() {
    const progressFill = document.getElementById('onboarding-progress');
    const currentStepSpan = document.getElementById('current-step');
    const totalStepsSpan = document.getElementById('total-steps');
    
    if (progressFill) {
        const progress = (currentOnboardingStep / maxOnboardingSteps) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    if (currentStepSpan) {
        currentStepSpan.textContent = currentOnboardingStep;
    }
    
    if (totalStepsSpan) {
        totalStepsSpan.textContent = maxOnboardingSteps;
    }
}

function validateCurrentStep() {
    const currentStep = document.querySelector(`[data-step="${currentOnboardingStep}"]`);
    if (!currentStep) return true;
    
    const requiredFields = currentStep.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--primary-pink)';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });
    
    // Step-specific validation
    switch (currentOnboardingStep) {
        case 1:
            const email = document.getElementById('client-email');
            if (email && !validateEmail(email.value)) {
                email.style.borderColor = 'var(--primary-pink)';
                showNotification('Please enter a valid email address', 'error');
                isValid = false;
            }
            break;
            
        case 2:
            const goals = document.querySelectorAll('input[name="goals"]:checked');
            if (goals.length === 0) {
                showNotification('Please select at least one goal', 'warning');
                isValid = false;
            }
            break;
            
        case 3:
            const budget = document.querySelector('input[name="budget"]:checked');
            const timeline = document.querySelector('input[name="timeline"]:checked');
            if (!budget || !timeline) {
                showNotification('Please select both budget and timeline', 'warning');
                isValid = false;
            }
            break;
    }
    
    return isValid;
}

function saveOnboardingData() {
    const currentStep = document.querySelector(`[data-step="${currentOnboardingStep}"]`);
    if (!currentStep) return;
    
    const formData = new FormData();
    const inputs = currentStep.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) {
                if (onboardingData[input.name]) {
                    if (Array.isArray(onboardingData[input.name])) {
                        onboardingData[input.name].push(input.value);
                    } else {
                        onboardingData[input.name] = [onboardingData[input.name], input.value];
                    }
                } else {
                    onboardingData[input.name] = input.value;
                }
            }
        } else if (input.type === 'file') {
            if (input.files.length > 0) {
                onboardingData[input.name] = Array.from(input.files);
            }
        } else {
            onboardingData[input.name] = input.value;
        }
    });
    
    // Save to localStorage for persistence
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
}

function completeOnboarding() {
    saveOnboardingData();
    
    // Show success step
    currentOnboardingStep = 6;
    updateOnboardingStepDisplay();
    
    // Hide navigation
    document.querySelector('.onboarding-footer').style.display = 'none';
    
    // Submit data to server (simulated)
    submitOnboardingData();
}

function submitOnboardingData() {
    // Simulate API call
    setTimeout(() => {
        console.log('Onboarding data submitted:', onboardingData);
        
        // Create user account
        if (onboardingData.clientEmail && onboardingData.clientName) {
            window.mediaBayWebsite.currentUser = {
                email: onboardingData.clientEmail,
                name: onboardingData.clientName,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(onboardingData.clientName)}&background=3B82F6&color=fff`
            };
            
            window.mediaBayWebsite.updateAuthUI();
            localStorage.setItem('currentUser', JSON.stringify(window.mediaBayWebsite.currentUser));
        }
        
        showNotification('Welcome to MediaBay! Your account has been created successfully.', 'success');
    }, 1500);
}

function handleFileUpload(event) {
    const files = event.target.files;
    const uploadArea = event.target.closest('.file-upload-area');
    
    if (files.length > 0) {
        const fileList = Array.from(files).map(file => file.name).join(', ');
        uploadArea.querySelector('p').textContent = `${files.length} file(s) selected: ${fileList}`;
        uploadArea.style.borderColor = 'var(--primary-green)';
        uploadArea.style.background = 'rgba(16, 185, 129, 0.1)';
    }
}

function closeOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear onboarding data if not completed
    if (currentOnboardingStep < 6) {
        localStorage.removeItem('onboardingData');
    }
}

function goToDashboard() {
    closeOnboarding();
    setTimeout(() => {
        showDashboard();
    }, 300);
}

// Dashboard Functions
let currentDashboardTab = 'overview';

function showDashboard() {
    // Load the dashboard component
    loadComponent('project-dashboard.html', () => {
        const modal = document.getElementById('dashboard-modal');
        const overlay = document.getElementById('modal-overlay');
        
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Initialize dashboard
        initializeDashboard();
    });
}

function initializeDashboard() {
    currentDashboardTab = 'overview';
    
    // Update user info
    updateDashboardUserInfo();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupDashboardListeners();
}

function updateDashboardUserInfo() {
    const user = window.mediaBayWebsite.currentUser;
    if (user) {
        const avatar = document.getElementById('dashboard-avatar');
        const username = document.getElementById('dashboard-username');
        const welcomeName = document.getElementById('welcome-name');
        
        if (avatar) avatar.src = user.avatar;
        if (username) username.textContent = user.name;
        if (welcomeName) welcomeName.textContent = user.name.split(' ')[0];
    }
}

function loadDashboardData() {
    // Simulate loading dashboard data
    const dashboardData = {
        stats: {
            activeProjects: 2,
            daysToCompletion: 15,
            overallProgress: 75,
            newMessages: 3
        },
        recentActivity: [
            {
                icon: 'upload',
                text: 'Design mockups uploaded',
                time: '2 hours ago'
            },
            {
                icon: 'comment',
                text: 'New message from MediaBay team',
                time: '5 hours ago'
            },
            {
                icon: 'check',
                text: 'Homepage design approved',
                time: '1 day ago'
            },
            {
                icon: 'code',
                text: 'Development phase started',
                time: '3 days ago'
            }
        ]
    };
    
    // Update stats
    updateDashboardStats(dashboardData.stats);
    
    // Update activity feed
    updateActivityFeed(dashboardData.recentActivity);
}

function updateDashboardStats(stats) {
    const statElements = document.querySelectorAll('.stat-number');
    statElements.forEach((element, index) => {
        const values = [stats.activeProjects, stats.daysToCompletion, stats.overallProgress, stats.newMessages];
        if (values[index] !== undefined) {
            animateCounter(element, values[index]);
        }
    });
}

function animateCounter(element, target) {
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (element.textContent.includes('%')) {
            element.textContent = Math.floor(current) + '%';
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function updateActivityFeed(activities) {
    const activityFeed = document.querySelector('.activity-feed');
    if (!activityFeed) return;
    
    activityFeed.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p><strong>${activity.text}</strong></p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

function setupDashboardListeners() {
    // Message compose form
    const composeForm = document.querySelector('.compose-form');
    if (composeForm) {
        composeForm.addEventListener('submit', handleMessageSubmit);
    }
    
    // Settings form
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
    }
}

function switchDashboardTab(tabName) {
    currentDashboardTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.dashboard-tab[data-tab="${tabName}"]`).classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

function loadTabData(tabName) {
    switch (tabName) {
        case 'messages':
            loadMessages();
            break;
        case 'invoices':
            loadInvoices();
            break;
        case 'projects':
            loadProjects();
            break;
    }
}

function loadMessages() {
    // Mark messages as read when viewed
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        setTimeout(() => {
            badge.textContent = '0';
            badge.style.display = 'none';
        }, 1000);
    }
}

function loadInvoices() {
    // Load invoice data
    console.log('Loading invoices...');
}

function loadProjects() {
    // Load project data
    console.log('Loading projects...');
}

function closeDashboard() {
    const modal = document.getElementById('dashboard-modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Dashboard Action Functions
function startNewProject() {
    closeDashboard();
    setTimeout(() => {
        showOnboarding();
    }, 300);
}

function scheduleCall() {
    showNotification('Redirecting to calendar booking...', 'info');
    // In a real app, this would open a calendar booking system
    setTimeout(() => {
        window.open('https://calendly.com/mediabay', '_blank');
    }, 1000);
}

function uploadFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx';
    
    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        showNotification(`${files.length} file(s) selected for upload`, 'success');
        
        // Simulate file upload
        files.forEach((file, index) => {
            setTimeout(() => {
                showNotification(`Uploaded: ${file.name}`, 'success');
            }, (index + 1) * 1000);
        });
    };
    
    input.click();
}

function requestChanges() {
    switchDashboardTab('messages');
    setTimeout(() => {
        composeMessage();
    }, 300);
}

function viewProjectDetails(projectId) {
    showNotification(`Loading project details for ${projectId}...`, 'info');
    // In a real app, this would show detailed project information
}

function previewProject(projectId) {
    showNotification('Opening project preview...', 'info');
    setTimeout(() => {
        window.open(`https://preview.mediabay.co.za/${projectId}`, '_blank');
    }, 1000);
}

function visitLiveSite(projectId) {
    showNotification('Opening live website...', 'info');
    setTimeout(() => {
        window.open('https://johndoe-portfolio.com', '_blank');
    }, 1000);
}

function composeMessage() {
    const messageCompose = document.getElementById('message-compose');
    const messagesList = document.querySelector('.messages-list');
    
    if (messageCompose && messagesList) {
        messageCompose.style.display = 'block';
        messagesList.style.display = 'none';
        
        // Focus on the first input
        const firstInput = messageCompose.querySelector('select, input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeCompose() {
    const messageCompose = document.getElementById('message-compose');
    const messagesList = document.querySelector('.messages-list');
    
    if (messageCompose && messagesList) {
        messageCompose.style.display = 'none';
        messagesList.style.display = 'block';
    }
}

function handleMessageSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const messageData = Object.fromEntries(formData.entries());
    
    // Validate message
    if (!messageData.to || !messageData.subject || !messageData.body) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate sending message
    showNotification('Sending message...', 'info');
    
    setTimeout(() => {
        showNotification('Message sent successfully!', 'success');
        closeCompose();
        e.target.reset();
        
        // Add to activity feed
        const activityFeed = document.querySelector('.activity-feed');
        if (activityFeed) {
            const newActivity = document.createElement('div');
            newActivity.className = 'activity-item';
            newActivity.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-paper-plane"></i>
                </div>
                <div class="activity-content">
                    <p><strong>Message sent: ${messageData.subject}</strong></p>
                    <span class="activity-time">Just now</span>
                </div>
            `;
            activityFeed.insertBefore(newActivity, activityFeed.firstChild);
        }
    }, 1500);
}

function downloadInvoice(invoiceId) {
    showNotification(`Downloading invoice ${invoiceId}...`, 'info');
    
    // Simulate PDF download
    setTimeout(() => {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKE1lZGlhQmF5IEludm9pY2UgIyR7aW52b2ljZUlkfSkKL0NyZWF0b3IgKE1lZGlhQmF5KQovUHJvZHVjZXIgKE1lZGlhQmF5KQovQ3JlYXRpb25EYXRlIChEOjIwMjUwMTI3KQo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMyAwIFIKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFs0IDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAzIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA5IDAgUgo+Pgo+PgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooTWVkaWFCYXkgSW52b2ljZSAjJHtpbnZvaWNlSWR9KSBUagpFVApzdHJlYW0KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL0ZvbnREZXNjcmlwdG9yCi9Gb250TmFtZSAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCjcgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9UaW1lcy1Sb21hbgovU3VidHlwZSAvVHlwZTEKPj4KZW5kb2JqCjggMCBvYmoKPDwKL1R5cGUgL0ZvbnREZXNjcmlwdG9yCi9Gb250TmFtZSAvSGVsdmV0aWNhCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvSGVsdmV0aWNhCi9TdWJ0eXBlIC9UeXBlMQovRm9udERlc2NyaXB0b3IgOCAwIFIKPj4KZW5kb2JqCnhyZWYKMCAxMAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDE3NCAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDA0NTggMDAwMDAgbiAKMDAwMDAwMDY4MSAwMDAwMCBuIAowMDAwMDAwNzc3IDAwMDAwIG4gCjAwMDAwMDA4NTQgMDAwMDAgbiAKMDAwMDAwMDk1NCAwMDAwMCBuIAowMDAwMDAxMDMwIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgMTAKL1Jvb3QgMiAwIFIKPj4Kc3RhcnR4cmVmCjExMzAKJSVFT0Y=`;
        link.download = `MediaBay-Invoice-${invoiceId}.pdf`;
        link.click();
        
        showNotification('Invoice downloaded successfully!', 'success');
    }, 1000);
}

function payInvoice(invoiceId) {
    showNotification('Redirecting to payment gateway...', 'info');
    
    // Simulate payment redirect
    setTimeout(() => {
        // In a real app, this would redirect to PayFast, Yoco, or other payment gateway
        const paymentData = {
            merchant_id: 'mediabay_merchant',
            merchant_key: 'mediabay_key',
            amount: '15000',
            item_name: `MediaBay Invoice ${invoiceId}`,
            return_url: window.location.origin + '/payment-success',
            cancel_url: window.location.origin + '/payment-cancel',
            notify_url: window.location.origin + '/payment-notify'
        };
        
        console.log('Payment data:', paymentData);
        showNotification('Payment gateway integration would be implemented here', 'info');
    }, 1500);
}

function downloadReceipt(invoiceId) {
    showNotification(`Downloading receipt for ${invoiceId}...`, 'info');
    
    setTimeout(() => {
        showNotification('Receipt downloaded successfully!', 'success');
    }, 1000);
}

function handleSettingsSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settingsData = Object.fromEntries(formData.entries());
    
    // Simulate saving settings
    showNotification('Saving settings...', 'info');
    
    setTimeout(() => {
        showNotification('Settings saved successfully!', 'success');
        
        // Update user info if name or email changed
        if (window.mediaBayWebsite.currentUser) {
            if (settingsData.name) {
                window.mediaBayWebsite.currentUser.name = settingsData.name;
            }
            if (settingsData.email) {
                window.mediaBayWebsite.currentUser.email = settingsData.email;
            }
            
            localStorage.setItem('currentUser', JSON.stringify(window.mediaBayWebsite.currentUser));
            updateDashboardUserInfo();
        }
    }, 1500);
}

function changePassword() {
    const newPassword = prompt('Enter new password:');
    if (newPassword && newPassword.length >= 6) {
        showNotification('Password changed successfully!', 'success');
    } else if (newPassword) {
        showNotification('Password must be at least 6 characters long', 'error');
    }
}

function enable2FA() {
    showNotification('Two-factor authentication setup would be implemented here', 'info');
    // In a real app, this would show QR code and setup process
}

function downloadData() {
    showNotification('Preparing your data for download...', 'info');
    
    setTimeout(() => {
        const userData = {
            profile: window.mediaBayWebsite.currentUser,
            onboardingData: JSON.parse(localStorage.getItem('onboardingData') || '{}'),
            activityLogs: JSON.parse(localStorage.getItem('activityLogs') || '[]'),
            preferences: {
                darkMode: localStorage.getItem('darkMode'),
                formData: Object.keys(localStorage).filter(key => key.startsWith('form_')).reduce((obj, key) => {
                    obj[key] = localStorage.getItem(key);
                    return obj;
                }, {})
            }
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'mediabay-user-data.json';
        link.click();
        
        showNotification('Your data has been downloaded!', 'success');
    }, 2000);
}

function deleteAccount() {
    const confirmation = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    
    if (confirmation) {
        const finalConfirmation = prompt('Type "DELETE" to confirm account deletion:');
        
        if (finalConfirmation === 'DELETE') {
            showNotification('Deleting account...', 'info');
            
            setTimeout(() => {
                // Clear all user data
                localStorage.clear();
                window.mediaBayWebsite.currentUser = null;
                window.mediaBayWebsite.updateAuthUI();
                
                closeDashboard();
                showNotification('Account deleted successfully', 'success');
            }, 2000);
        } else {
            showNotification('Account deletion cancelled', 'info');
        }
    }
}

// Utility function to load components
function loadComponent(componentPath, callback) {
    // In a real app, this would fetch the component HTML
    // For now, we'll assume the components are already loaded
    if (callback) callback();
}

// Utility function to validate email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Export functions for global access
window.showOnboarding = showOnboarding;
window.closeOnboarding = closeOnboarding;
window.nextOnboardingStep = nextOnboardingStep;
window.prevOnboardingStep = prevOnboardingStep;
window.goToDashboard = goToDashboard;
window.showDashboard = showDashboard;
window.closeDashboard = closeDashboard;
window.switchDashboardTab = switchDashboardTab;
window.startNewProject = startNewProject;
window.scheduleCall = scheduleCall;
window.uploadFiles = uploadFiles;
window.requestChanges = requestChanges;
window.viewProjectDetails = viewProjectDetails;
window.previewProject = previewProject;
window.visitLiveSite = visitLiveSite;
window.composeMessage = composeMessage;
window.closeCompose = closeCompose;
window.downloadInvoice = downloadInvoice;
window.payInvoice = payInvoice;
window.downloadReceipt = downloadReceipt;
window.changePassword = changePassword;
window.enable2FA = enable2FA;
window.downloadData = downloadData;
window.deleteAccount = deleteAccount;

console.log('Dashboard and Onboarding functionality loaded');