/**
 * MediaBay Payment Gateway Integration
 * Supports multiple payment providers for South African market
 */

class MediaBayPayments {
    constructor() {
        this.config = {
            // PayFast (Popular in South Africa)
            payfast: {
                merchant_id: '10000100', // Replace with actual merchant ID
                merchant_key: 'q1cd2rdny4a53jpmxkmgd6ccwha5x3p6', // Replace with actual key
                passphrase: 'jt7NOE43FZPn', // Replace with actual passphrase
                sandbox: true, // Set to false for production
                enabled: true
            },
            // Stripe (International)
            stripe: {
                publishable_key: 'pk_test_51234567890', // Replace with actual key
                enabled: true
            },
            // PayPal
            paypal: {
                client_id: 'AeA1QIZXiflr1234567890', // Replace with actual client ID
                sandbox: true,
                enabled: true
            },
            // Ozow (South African EFT)
            ozow: {
                site_code: 'TEST-SITE', // Replace with actual site code
                private_key: 'test-private-key', // Replace with actual key
                api_url: 'https://api.ozow.com',
                sandbox: true,
                enabled: true
            },
            currency: 'ZAR',
            return_url: window.location.origin + '/payment/success',
            cancel_url: window.location.origin + '/payment/cancel',
            notify_url: window.location.origin + '/api/payment/notify'
        };

        this.activePayments = new Map();
        this.init();
    }

    /**
     * Initialize payment systems
     */
    async init() {
        console.log('💳 Initializing MediaBay Payment Systems...');

        try {
            // Initialize Stripe
            if (this.config.stripe.enabled) {
                await this.initStripe();
            }

            // Initialize PayPal
            if (this.config.paypal.enabled) {
                await this.initPayPal();
            }

            // PayFast and Ozow don't require client-side initialization
            console.log('✅ Payment systems initialized successfully');
        } catch (error) {
            console.error('❌ Payment initialization failed:', error);
        }
    }

    /**
     * Initialize Stripe
     */
    async initStripe() {
        try {
            // Load Stripe.js
            if (!window.Stripe) {
                await this.loadScript('https://js.stripe.com/v3/');
            }

            this.stripe = Stripe(this.config.stripe.publishable_key);
            console.log('✅ Stripe initialized');
        } catch (error) {
            console.error('❌ Stripe initialization failed:', error);
        }
    }

    /**
     * Initialize PayPal
     */
    async initPayPal() {
        try {
            // Load PayPal SDK
            const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${this.config.paypal.client_id}&currency=${this.config.currency}`;
            if (!window.paypal) {
                await this.loadScript(sdkUrl);
            }

            console.log('✅ PayPal initialized');
        } catch (error) {
            console.error('❌ PayPal initialization failed:', error);
        }
    }

    /**
     * Create payment intent
     */
    async createPayment(paymentData) {
        const {
            amount,
            currency = this.config.currency,
            description,
            customer_email,
            customer_name,
            payment_method,
            metadata = {}
        } = paymentData;

        const paymentId = this.generatePaymentId();
        
        const payment = {
            id: paymentId,
            amount: amount,
            currency: currency,
            description: description,
            customer: {
                email: customer_email,
                name: customer_name
            },
            metadata: {
                ...metadata,
                created_at: new Date().toISOString(),
                source: 'mediabay_website'
            },
            status: 'pending'
        };

        this.activePayments.set(paymentId, payment);

        // Track payment initiation
        if (window.mediaBayAnalytics) {
            window.mediaBayAnalytics.trackBusinessEvent('payment_initiated', {
                payment_id: paymentId,
                amount: amount,
                currency: currency,
                payment_method: payment_method
            });
        }

        return payment;
    }

    /**
     * Process payment with PayFast
     */
    async processPayFastPayment(paymentData) {
        try {
            const payment = await this.createPayment(paymentData);
            
            const payfastData = {
                merchant_id: this.config.payfast.merchant_id,
                merchant_key: this.config.payfast.merchant_key,
                return_url: this.config.return_url,
                cancel_url: this.config.cancel_url,
                notify_url: this.config.notify_url,
                name_first: payment.customer.name.split(' ')[0] || '',
                name_last: payment.customer.name.split(' ').slice(1).join(' ') || '',
                email_address: payment.customer.email,
                m_payment_id: payment.id,
                amount: (payment.amount / 100).toFixed(2), // PayFast expects amount in rands
                item_name: payment.description,
                item_description: payment.description,
                custom_str1: JSON.stringify(payment.metadata),
                custom_str2: 'mediabay_website',
                custom_str3: payment.currency
            };

            // Generate signature
            const signature = this.generatePayFastSignature(payfastData);
            payfastData.signature = signature;

            // Create and submit form
            const form = this.createPaymentForm(
                this.config.payfast.sandbox ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process',
                payfastData
            );

            document.body.appendChild(form);
            form.submit();

            return { success: true, payment_id: payment.id };
        } catch (error) {
            console.error('❌ PayFast payment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process payment with Stripe
     */
    async processStripePayment(paymentData) {
        try {
            if (!this.stripe) {
                throw new Error('Stripe not initialized');
            }

            const payment = await this.createPayment(paymentData);

            // Create payment intent on server
            const response = await fetch('/api/payment/stripe/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: payment.amount,
                    currency: payment.currency,
                    payment_id: payment.id,
                    customer_email: payment.customer.email,
                    metadata: payment.metadata
                })
            });

            const { client_secret } = await response.json();

            // Confirm payment
            const result = await this.stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card: paymentData.card_element,
                    billing_details: {
                        name: payment.customer.name,
                        email: payment.customer.email,
                    },
                }
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // Track successful payment
            if (window.mediaBayAnalytics) {
                window.mediaBayAnalytics.trackConversion('payment_completed', {
                    payment_id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    payment_method: 'stripe'
                });
            }

            return { success: true, payment_id: payment.id, stripe_payment_intent: result.paymentIntent };
        } catch (error) {
            console.error('❌ Stripe payment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process payment with PayPal
     */
    async processPayPalPayment(paymentData, containerId) {
        try {
            if (!window.paypal) {
                throw new Error('PayPal not initialized');
            }

            const payment = await this.createPayment(paymentData);

            return new Promise((resolve, reject) => {
                paypal.Buttons({
                    createOrder: (data, actions) => {
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: (payment.amount / 100).toFixed(2),
                                    currency_code: payment.currency
                                },
                                description: payment.description,
                                custom_id: payment.id
                            }]
                        });
                    },
                    onApprove: async (data, actions) => {
                        try {
                            const order = await actions.order.capture();
                            
                            // Track successful payment
                            if (window.mediaBayAnalytics) {
                                window.mediaBayAnalytics.trackConversion('payment_completed', {
                                    payment_id: payment.id,
                                    amount: payment.amount,
                                    currency: payment.currency,
                                    payment_method: 'paypal',
                                    paypal_order_id: order.id
                                });
                            }

                            resolve({ 
                                success: true, 
                                payment_id: payment.id, 
                                paypal_order: order 
                            });
                        } catch (error) {
                            reject({ success: false, error: error.message });
                        }
                    },
                    onError: (err) => {
                        console.error('PayPal error:', err);
                        reject({ success: false, error: 'PayPal payment failed' });
                    },
                    onCancel: (data) => {
                        console.log('PayPal payment cancelled:', data);
                        reject({ success: false, error: 'Payment cancelled by user' });
                    }
                }).render(`#${containerId}`);
            });
        } catch (error) {
            console.error('❌ PayPal payment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process payment with Ozow
     */
    async processOzowPayment(paymentData) {
        try {
            const payment = await this.createPayment(paymentData);

            const ozowData = {
                SiteCode: this.config.ozow.site_code,
                CountryCode: 'ZA',
                CurrencyCode: payment.currency,
                Amount: (payment.amount / 100).toFixed(2),
                TransactionReference: payment.id,
                BankReference: payment.description,
                Customer: payment.customer.name,
                CustomerEmail: payment.customer.email,
                SuccessUrl: this.config.return_url,
                CancelUrl: this.config.cancel_url,
                ErrorUrl: this.config.cancel_url,
                NotifyUrl: this.config.notify_url,
                IsTest: this.config.ozow.sandbox
            };

            // Generate hash
            const hashString = Object.values(ozowData).join('') + this.config.ozow.private_key;
            const hash = await this.generateSHA512Hash(hashString);
            ozowData.HashCheck = hash;

            // Create and submit form
            const form = this.createPaymentForm(
                this.config.ozow.sandbox ? 'https://staging.ozow.com/postpayrequest' : 'https://secure.ozow.com/postpayrequest',
                ozowData
            );

            document.body.appendChild(form);
            form.submit();

            return { success: true, payment_id: payment.id };
        } catch (error) {
            console.error('❌ Ozow payment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create Stripe card element
     */
    createStripeCardElement(containerId, options = {}) {
        if (!this.stripe) {
            console.error('Stripe not initialized');
            return null;
        }

        const elements = this.stripe.elements();
        const cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                        color: '#aab7c4',
                    },
                },
                invalid: {
                    color: '#9e2146',
                },
            },
            ...options
        });

        cardElement.mount(`#${containerId}`);
        return cardElement;
    }

    /**
     * Create payment selection modal
     */
    createPaymentModal(paymentData) {
        const modal = document.createElement('div');
        modal.className = 'payment-modal modal';
        modal.innerHTML = `
            <div class="modal-content payment-modal-content">
                <div class="modal-header">
                    <h3>Complete Payment</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="payment-summary">
                    <h4>Payment Summary</h4>
                    <div class="summary-item">
                        <span>Service:</span>
                        <span>${paymentData.description}</span>
                    </div>
                    <div class="summary-item">
                        <span>Amount:</span>
                        <span class="amount">R ${(paymentData.amount / 100).toFixed(2)}</span>
                    </div>
                </div>

                <div class="payment-methods">
                    <h4>Choose Payment Method</h4>
                    
                    ${this.config.payfast.enabled ? `
                    <button class="payment-method-btn" onclick="window.mediaBayPayments.selectPaymentMethod('payfast', this)">
                        <div class="payment-method-info">
                            <i class="fas fa-credit-card"></i>
                            <div>
                                <strong>PayFast</strong>
                                <small>Credit Card, EFT, Instant EFT</small>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    ` : ''}

                    ${this.config.ozow.enabled ? `
                    <button class="payment-method-btn" onclick="window.mediaBayPayments.selectPaymentMethod('ozow', this)">
                        <div class="payment-method-info">
                            <i class="fas fa-university"></i>
                            <div>
                                <strong>Ozow</strong>
                                <small>Instant EFT from your bank</small>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    ` : ''}

                    ${this.config.stripe.enabled ? `
                    <button class="payment-method-btn" onclick="window.mediaBayPayments.selectPaymentMethod('stripe', this)">
                        <div class="payment-method-info">
                            <i class="fab fa-cc-stripe"></i>
                            <div>
                                <strong>Credit Card</strong>
                                <small>Visa, Mastercard, American Express</small>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    ` : ''}

                    ${this.config.paypal.enabled ? `
                    <button class="payment-method-btn" onclick="window.mediaBayPayments.selectPaymentMethod('paypal', this)">
                        <div class="payment-method-info">
                            <i class="fab fa-paypal"></i>
                            <div>
                                <strong>PayPal</strong>
                                <small>Pay with your PayPal account</small>
                            </div>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    ` : ''}
                </div>

                <div class="payment-form" id="payment-form" style="display: none;">
                    <!-- Payment form will be inserted here -->
                </div>

                <div class="payment-security">
                    <i class="fas fa-shield-alt"></i>
                    <span>Your payment information is secure and encrypted</span>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Store payment data for later use
        this.currentPaymentData = paymentData;

        return modal;
    }

    /**
     * Select payment method
     */
    selectPaymentMethod(method, buttonElement) {
        // Update UI
        document.querySelectorAll('.payment-method-btn').forEach(btn => btn.classList.remove('selected'));
        buttonElement.classList.add('selected');

        const paymentForm = document.getElementById('payment-form');
        paymentForm.style.display = 'block';

        switch (method) {
            case 'stripe':
                this.showStripeForm(paymentForm);
                break;
            case 'paypal':
                this.showPayPalForm(paymentForm);
                break;
            case 'payfast':
            case 'ozow':
                this.showRedirectForm(paymentForm, method);
                break;
        }
    }

    /**
     * Show Stripe payment form
     */
    showStripeForm(container) {
        container.innerHTML = `
            <h5>Credit Card Information</h5>
            <div id="stripe-card-element" class="stripe-element"></div>
            <div id="stripe-card-errors" class="payment-errors"></div>
            <button class="btn btn-primary payment-submit-btn" onclick="window.mediaBayPayments.submitStripePayment()">
                <i class="fas fa-lock"></i>
                Pay Securely
            </button>
        `;

        // Create Stripe card element
        this.currentCardElement = this.createStripeCardElement('stripe-card-element');
    }

    /**
     * Show PayPal payment form
     */
    showPayPalForm(container) {
        container.innerHTML = `
            <h5>PayPal Payment</h5>
            <div id="paypal-button-container"></div>
        `;

        // Initialize PayPal buttons
        this.processPayPalPayment(this.currentPaymentData, 'paypal-button-container');
    }

    /**
     * Show redirect payment form
     */
    showRedirectForm(container, method) {
        const methodName = method === 'payfast' ? 'PayFast' : 'Ozow';
        container.innerHTML = `
            <h5>${methodName} Payment</h5>
            <p>You will be redirected to ${methodName} to complete your payment securely.</p>
            <button class="btn btn-primary payment-submit-btn" onclick="window.mediaBayPayments.submitRedirectPayment('${method}')">
                <i class="fas fa-external-link-alt"></i>
                Continue to ${methodName}
            </button>
        `;
    }

    /**
     * Submit Stripe payment
     */
    async submitStripePayment() {
        const submitBtn = document.querySelector('.payment-submit-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            const result = await this.processStripePayment({
                ...this.currentPaymentData,
                card_element: this.currentCardElement
            });

            if (result.success) {
                this.showPaymentSuccess(result);
            } else {
                this.showPaymentError(result.error);
            }
        } catch (error) {
            this.showPaymentError(error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Submit redirect payment
     */
    async submitRedirectPayment(method) {
        const submitBtn = document.querySelector('.payment-submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';
        submitBtn.disabled = true;

        try {
            let result;
            if (method === 'payfast') {
                result = await this.processPayFastPayment(this.currentPaymentData);
            } else if (method === 'ozow') {
                result = await this.processOzowPayment(this.currentPaymentData);
            }

            if (!result.success) {
                this.showPaymentError(result.error);
                submitBtn.innerHTML = 'Try Again';
                submitBtn.disabled = false;
            }
        } catch (error) {
            this.showPaymentError(error.message);
            submitBtn.innerHTML = 'Try Again';
            submitBtn.disabled = false;
        }
    }

    /**
     * Show payment success
     */
    showPaymentSuccess(result) {
        const modal = document.querySelector('.payment-modal');
        modal.innerHTML = `
            <div class="modal-content payment-success">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Payment Successful!</h3>
                <p>Thank you for your payment. You will receive a confirmation email shortly.</p>
                <p><strong>Payment ID:</strong> ${result.payment_id}</p>
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                    Continue
                </button>
            </div>
        `;
    }

    /**
     * Show payment error
     */
    showPaymentError(error) {
        const errorContainer = document.getElementById('stripe-card-errors') || 
                              document.querySelector('.payment-errors') ||
                              document.querySelector('.payment-form');
        
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="payment-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${error}
                </div>
            `;
        }
    }

    /**
     * Utility functions
     */
    generatePaymentId() {
        return 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generatePayFastSignature(data) {
        const signatureString = Object.keys(data)
            .filter(key => key !== 'signature' && data[key] !== '')
            .sort()
            .map(key => `${key}=${encodeURIComponent(data[key])}`)
            .join('&');
        
        return this.md5(signatureString + '&passphrase=' + this.config.payfast.passphrase);
    }

    async generateSHA512Hash(string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    md5(string) {
        // Simple MD5 implementation - in production, use a proper crypto library
        // This is a placeholder - implement proper MD5 hashing
        return btoa(string).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substr(0, 32);
    }

    createPaymentForm(action, data) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = action;
        form.style.display = 'none';

        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
        });

        return form;
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
     * Get payment status
     */
    async getPaymentStatus(paymentId) {
        try {
            const response = await fetch(`/api/payment/status/${paymentId}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to get payment status:', error);
            return null;
        }
    }

    /**
     * Refund payment
     */
    async refundPayment(paymentId, amount = null) {
        try {
            const response = await fetch('/api/payment/refund', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_id: paymentId,
                    amount: amount
                })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Failed to process refund:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize payments when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mediaBayPayments = new MediaBayPayments();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaBayPayments;
}