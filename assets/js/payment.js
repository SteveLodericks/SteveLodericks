/**
 * Stripe Payment Integration
 * SECURITY: Uses configuration from payment-config.js
 * Secret keys are handled server-side only
 */

// Initialize payment system with secure configuration
let stripe;
let elements;
let paymentElement;
let selectedPackage = null;
let clientSecret = null;
let processingPayment = false;

// Get secure configuration
const paymentConfig = typeof PAYMENT_CONFIG !== 'undefined' ? PAYMENT_CONFIG : null;

// Package configurations
const packages = {
    'single': {
        name: 'Single Session',
        description: 'One 90-minute somatic coaching session',
        price: 120,
        currency: 'eur',
        sessions: 1
    },
    'three-session': {
        name: '3-Session Package',
        description: 'Three comprehensive 90-minute sessions with support',
        price: 320,
        currency: 'eur',
        sessions: 3
    },
    'six-session': {
        name: '6-Session Intensive',
        description: 'Complete healing journey with ongoing support',
        price: 600,
        currency: 'eur',
        sessions: 6
    }
};

/**
 * Initialize Stripe with secure configuration
 * @returns {boolean} Success status
 */
function initializeStripe() {
    try {
        if (!paymentConfig || !paymentConfig.stripe.publishableKey) {
            throw new Error('Payment configuration not found or incomplete');
        }

        const publishableKey = paymentConfig.stripe.publishableKey;
        
        // Validate publishable key format
        if (!publishableKey.startsWith('pk_')) {
            throw new Error('Invalid Stripe publishable key format');
        }
        
        // Initialize Stripe (only if key is not placeholder)
        if (!publishableKey.includes('placeholder') && typeof Stripe !== 'undefined') {
            stripe = Stripe(publishableKey, {
                locale: paymentConfig.stripe.locale || 'en'
            });
            
            // Initialize Elements
            elements = stripe.elements({
                appearance: paymentConfig.stripe.appearance || {},
                clientSecret: clientSecret
            });
            
            console.log('Stripe payment system initialized');
            return true;
        } else {
            console.log('Stripe payment system in demo mode - will simulate payments');
            return false;
        }
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showPaymentMessage('Payment system unavailable. Please contact us directly.', 'error');
        return false;
    }
}

// Package selection handlers
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Stripe
    const stripeInitialized = initializeStripe();
    
    // Setup UI handlers
    setupPackageSelection();
    setupPaymentForm();
    
    // Load payment configuration
    await loadPaymentConfiguration();
    
    // Check for selected package in URL
    checkUrlForSelectedPackage();
});

async function loadPaymentConfiguration() {
    // In production, this would validate server configuration
    // For now, just validate client-side config
    if (paymentConfig) {
        const validation = validateConfig();
        if (!validation.isValid) {
            console.warn('Payment configuration issues:', validation.errors);
        }
    }
}

function checkUrlForSelectedPackage() {
    const urlParams = new URLSearchParams(window.location.search);
    const packageParam = urlParams.get('package');
    
    if (packageParam && packages[packageParam]) {
        selectPackage(packageParam);
    }
}

function validateConfig() {
    const errors = [];
    
    if (!paymentConfig) {
        errors.push('Payment configuration not found');
        return { isValid: false, errors };
    }
    
    if (!paymentConfig.stripe?.publishableKey || 
        paymentConfig.stripe.publishableKey.includes('placeholder')) {
        errors.push('Stripe publishable key not configured');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

function setupPackageSelection() {
    const packageCards = document.querySelectorAll('.package-select');
    
    packageCards.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const packageCard = this.closest('.package-card');
            const packageId = packageCard.dataset.package;
            selectPackage(packageId);
        });
    });
}

async function selectPackage(packageId) {
    selectedPackage = packages[packageId];
    
    if (!selectedPackage) {
        console.error('Invalid package selected');
        return;
    }
    
    // Track package selection
    trackPaymentEvent('package_selected', {
        package: selectedPackage.name,
        amount: selectedPackage.price
    });
    
    // Create payment intent for real payments
    if (stripe && !clientSecret) {
        await createPaymentIntent();
    }
    
    // Update UI to show selected package
    updatePackageSelection(packageId);
    showPaymentSection();
    updateOrderSummary();
    
    // Scroll to payment section
    document.getElementById('payment-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

async function createPaymentIntent() {
    try {
        // In production, this would be a server-side API call
        // For demo purposes, we'll simulate creating a payment intent
        if (paymentConfig?.stripe?.publishableKey?.includes('placeholder')) {
            console.log('Demo mode: skipping PaymentIntent creation');
            return;
        }
        
        // This is where you'd make the API call to your server
        // const response = await fetch('/api/create-payment-intent', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         amount: selectedPackage.price * 100, // Convert to cents
        //         currency: 'eur',
        //         packageId: selectedPackage.name
        //     })
        // });
        // const { clientSecret: newClientSecret } = await response.json();
        // clientSecret = newClientSecret;
        
        console.log('Payment intent creation would happen server-side');
        
    } catch (error) {
        console.error('Error creating payment intent:', error);
    }
}

function updatePackageSelection(packageId) {
    // Remove active state from all package cards
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add active state to selected package
    document.querySelector(`[data-package="${packageId}"]`).classList.add('selected');
}

function showPaymentSection() {
    const paymentSection = document.getElementById('payment-section');
    paymentSection.style.display = 'block';
}

function updateOrderSummary() {
    if (!selectedPackage) return;
    
    document.getElementById('selected-package-name').textContent = selectedPackage.name;
    document.getElementById('selected-package-description').textContent = selectedPackage.description;
    document.getElementById('selected-package-price').textContent = `€${selectedPackage.price}`;
}

function setupPaymentForm() {
    // Payment method selection
    const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            selectPaymentMethod(this.dataset.method);
        });
    });
    
    // Form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', handleFormSubmit);
}

function selectPaymentMethod(method) {
    // Remove active state from all buttons
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active state to selected method
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    // Update payment elements based on selected method
    updatePaymentElements(method);
}

async function updatePaymentElements(method) {
    const paymentElementContainer = document.getElementById('payment-element');
    
    // Clear existing content
    paymentElementContainer.innerHTML = '';
    
    // If we have a real Stripe instance and client secret, use Stripe Elements
    if (stripe && elements && clientSecret) {
        await createStripePaymentElement(method);
    } else {
        // Fallback to demo form elements
        switch (method) {
            case 'card':
                createCardElement();
                break;
            case 'ideal':
                createIdealElement();
                break;
            case 'apple-pay':
                createApplePayElement();
                break;
            case 'google-pay':
                createGooglePayElement();
                break;
            default:
                createCardElement();
        }
    }
}

async function createStripePaymentElement(paymentMethod = 'card') {
    if (!elements || !stripe) {
        console.error('Stripe Elements not initialized');
        createCardElement(); // Fallback
        return;
    }

    try {
        // Create payment element with specific payment method types
        const paymentMethodTypes = getPaymentMethodTypes(paymentMethod);
        
        paymentElement = elements.create('payment', {
            fields: {
                billingDetails: {
                    name: 'auto',
                    email: 'auto',
                    phone: 'auto',
                    address: {
                        country: 'auto',
                        postalCode: 'auto'
                    }
                }
            },
            terms: {
                card: 'never',
                ideal: 'never',
                applePay: 'never',
                googlePay: 'never'
            },
            wallets: {
                applePay: paymentMethod === 'apple-pay' ? 'auto' : 'never',
                googlePay: paymentMethod === 'google-pay' ? 'auto' : 'never'
            }
        });

        paymentElement.mount('#payment-element');
        
        // Handle real-time validation errors
        paymentElement.on('change', ({error, complete}) => {
            if (error) {
                showPaymentMessage(error.message, 'error');
            } else {
                document.getElementById('payment-messages').innerHTML = '';
            }
        });
        
    } catch (error) {
        console.error('Error creating Stripe Payment Element:', error);
        createCardElement(); // Fallback to demo form
    }
}

function getPaymentMethodTypes(method) {
    const methodMap = {
        'card': ['card'],
        'ideal': ['ideal'],
        'apple-pay': ['apple_pay'],
        'google-pay': ['google_pay']
    };
    return methodMap[method] || ['card'];
}

function createCardElement() {
    const cardElement = document.createElement('div');
    cardElement.className = 'payment-input-group';
    cardElement.innerHTML = `
        <div class="form-group">
            <label for="card-number">Card Number</label>
            <input type="text" id="card-number" placeholder="1234 5678 9012 3456" maxlength="19">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="card-expiry">Expiry Date</label>
                <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5">
            </div>
            <div class="form-group">
                <label for="card-cvc">CVC</label>
                <input type="text" id="card-cvc" placeholder="123" maxlength="4">
            </div>
        </div>
        <div class="form-group">
            <label for="card-name">Name on Card</label>
            <input type="text" id="card-name" placeholder="Full Name">
        </div>
    `;
    
    document.getElementById('payment-element').appendChild(cardElement);
    
    // Add input formatting
    setupCardInputFormatting();
}

function createIdealElement() {
    const idealElement = document.createElement('div');
    idealElement.className = 'payment-input-group';
    idealElement.innerHTML = `
        <div class="form-group">
            <label for="ideal-bank">Select your bank</label>
            <select id="ideal-bank" required>
                <option value="">Choose your bank</option>
                <option value="abn_amro">ABN AMRO</option>
                <option value="asn_bank">ASN Bank</option>
                <option value="bunq">Bunq</option>
                <option value="handelsbanken">Handelsbanken</option>
                <option value="ing">ING</option>
                <option value="knab">Knab</option>
                <option value="rabobank">Rabobank</option>
                <option value="regiobank">RegioBank</option>
                <option value="revolut">Revolut</option>
                <option value="sns_bank">SNS Bank</option>
                <option value="triodos_bank">Triodos Bank</option>
                <option value="van_lanschot">Van Lanschot</option>
            </select>
        </div>
        <p class="payment-info">You will be redirected to your bank's website to complete the payment.</p>
    `;
    
    document.getElementById('payment-element').appendChild(idealElement);
}

function createApplePayElement() {
    const applePayElement = document.createElement('div');
    applePayElement.className = 'payment-input-group apple-pay-container';
    applePayElement.innerHTML = `
        <div class="apple-pay-button">
            <div class="apple-pay-logo">🍎 Pay</div>
            <p>Touch ID or Face ID to pay with Apple Pay</p>
        </div>
        <p class="payment-info">Payment will be processed through Apple Pay using your default payment method.</p>
    `;
    
    document.getElementById('payment-element').appendChild(applePayElement);
}

function createGooglePayElement() {
    const googlePayElement = document.createElement('div');
    googlePayElement.className = 'payment-input-group google-pay-container';
    googlePayElement.innerHTML = `
        <div class="google-pay-button">
            <div class="google-pay-logo">G Pay</div>
            <p>Pay securely with Google Pay</p>
        </div>
        <p class="payment-info">Payment will be processed through Google Pay using your saved payment methods.</p>
    `;
    
    document.getElementById('payment-element').appendChild(googlePayElement);
}

function setupCardInputFormatting() {
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvcInput = document.getElementById('card-cvc');
    
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    if (cardCvcInput) {
        cardCvcInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (processingPayment) {
        return; // Prevent double submission
    }
    
    if (!selectedPackage) {
        showPaymentMessage('Please select a package first.', 'error');
        return;
    }
    
    if (!validateForm()) {
        return;
    }
    
    processingPayment = true;
    setLoadingState(true);
    
    try {
        if (stripe && paymentElement && clientSecret) {
            // Real Stripe payment processing
            await processStripePayment();
        } else {
            // Demo/fallback payment processing
            await simulatePaymentProcessing();
            handlePaymentSuccess();
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        handlePaymentError(error);
    } finally {
        processingPayment = false;
    }
}

async function processStripePayment() {
    const customerData = getCustomerData();
    
    const {error, paymentIntent} = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/pages/payment-success.html`,
            receipt_email: customerData.email,
            shipping: {
                name: customerData.name,
                address: {
                    line1: 'Online Session', // Since it's coaching, no physical address needed
                    city: 'The Hague',
                    country: 'NL'
                }
            }
        },
        redirect: 'if_required'
    });

    if (error) {
        throw error;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        await handlePaymentSuccess(paymentIntent);
    } else {
        throw new Error('Payment not completed');
    }
}

function getCustomerData() {
    return {
        name: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        sessionPreference: document.getElementById('session-preference').value
    };
}

async function handlePaymentSuccess(paymentIntent = null) {
    try {
        // Track successful payment
        trackPaymentEvent('payment_completed', {
            package: selectedPackage.name,
            amount: selectedPackage.price,
            paymentIntentId: paymentIntent?.id
        });
        
        // Create booking token for calendar scheduling
        const bookingToken = await createBookingToken({
            customerData: getCustomerData(),
            package: selectedPackage,
            paymentIntentId: paymentIntent?.id
        });
        
        // Emit journey event for tracking
        window.dispatchEvent(new CustomEvent('paymentSuccessful', {
            detail: {
                package: selectedPackage.name,
                amount: selectedPackage.price,
                paymentId: paymentIntent?.id,
                bookingToken: bookingToken
            }
        }));
        
        // Small delay to ensure journey tracking completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to success page with booking token
        const successUrl = new URL('/pages/payment-success.html', window.location.origin);
        successUrl.searchParams.set('package', selectedPackage.name);
        successUrl.searchParams.set('amount', selectedPackage.price);
        successUrl.searchParams.set('bookingToken', bookingToken);
        if (paymentIntent?.id) {
            successUrl.searchParams.set('paymentId', paymentIntent.id);
        }
        
        window.location.href = successUrl.toString();
        
    } catch (error) {
        console.error('Error handling payment success:', error);
        // Still redirect to success page even if booking token creation fails
        window.location.href = `payment-success.html?package=${selectedPackage.name}&amount=${selectedPackage.price}`;
    }
}

function handlePaymentError(error) {
    let errorType = 'generic';
    
    // Map Stripe error types to our error types
    if (error.type === 'card_error') {
        if (error.code === 'card_declined') errorType = 'card_declined';
        else if (error.code === 'insufficient_funds') errorType = 'insufficient_funds';
        else if (error.code === 'expired_card') errorType = 'expired_card';
        else if (error.code === 'incorrect_cvc') errorType = 'incorrect_cvc';
    } else if (error.type === 'validation_error') {
        errorType = 'processing_error';
    }
    
    // Use user feedback system for consistent error handling
    if (window.userFeedback) {
        window.userFeedback.showPaymentError(errorType, {
            retryCallback: () => {
                // Reset form state for retry
                setLoadingState(false);
                processingPayment = false;
            }
        });
    } else {
        // Fallback to old method
        showPaymentMessage(error.message || 'Payment failed. Please try again.', 'error');
    }
    
    setLoadingState(false);
    
    // Track failed payment
    trackPaymentEvent('payment_failed', {
        package: selectedPackage.name,
        error: error.message,
        errorType: errorType
    });
}

async function createBookingToken(data) {
    // In production, this would be a server-side API call
    // For demo, generate a simple token
    const tokenData = {
        customerName: data.customerData.name,
        customerEmail: data.customerData.email,
        packageId: data.package.name,
        sessionsTotal: data.package.sessions,
        paymentId: data.paymentIntentId,
        timestamp: Date.now()
    };
    
    // Simple base64 encoding for demo (in production, use proper JWT)
    return btoa(JSON.stringify(tokenData));
}

function trackPaymentEvent(eventName, data) {
    // Track with Google Analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            package_name: data.package,
            value: data.amount,
            currency: 'EUR'
        });
    }
    
    // Console log for debugging
    console.log('Payment event:', eventName, data);
}

function validateForm() {
    const requiredFields = ['customer-name', 'customer-email', 'terms-checkbox'];
    let isValid = true;
    const errors = [];
    
    // Clear previous error states
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('form-error'));
    document.querySelectorAll('.form-error-message').forEach(el => el.remove());
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        if (fieldId === 'terms-checkbox') {
            if (!field.checked) {
                errors.push('Please accept the terms and conditions');
                field.closest('.checkbox-container').classList.add('form-error');
            }
        } else if (!field.value.trim()) {
            errors.push(`${field.previousElementSibling?.textContent?.replace('*', '') || field.name || fieldId} is required`);
            field.classList.add('form-error');
            field.focus();
            isValid = false;
        }
    });
    
    // Validate email format
    const emailField = document.getElementById('customer-email');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            errors.push('Please enter a valid email address');
            emailField.classList.add('form-error');
            emailField.focus();
            isValid = false;
        }
    }
    
    // Show validation errors using user feedback system
    if (errors.length > 0) {
        if (window.userFeedback) {
            window.userFeedback.showValidationErrors(errors);
        } else {
            showPaymentMessage(errors.join(' '), 'error');
        }
        isValid = false;
    }
    
    return isValid;
}

function simulatePaymentProcessing() {
    return new Promise((resolve) => {
        // Simulate API call delay
        setTimeout(() => {
            console.log('Payment processed successfully (demo mode)');
            resolve();
        }, 2000);
    });
}

function setLoadingState(isLoading) {
    const submitButton = document.getElementById('submit-button');
    const spinner = submitButton.querySelector('.spinner');
    const buttonText = submitButton.querySelector('span');
    
    if (isLoading) {
        submitButton.disabled = true;
        submitButton.classList.add('btn-loading');
        if (spinner) spinner.style.display = 'inline-block';
        if (buttonText) buttonText.textContent = 'Processing...';
        
        // Show loading notification with user feedback system
        if (window.userFeedback) {
            window.userFeedback.showLoading('payment-processing', 'Processing your payment securely...');
        }
    } else {
        submitButton.disabled = false;
        submitButton.classList.remove('btn-loading');
        if (spinner) spinner.style.display = 'none';
        if (buttonText) buttonText.textContent = 'Complete Payment';
        
        // Hide loading notification
        if (window.userFeedback) {
            window.userFeedback.hideLoading('payment-processing');
        }
    }
}

function showPaymentMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('payment-messages');
    messagesContainer.innerHTML = `
        <div class="payment-message payment-message-${type}">
            ${message}
        </div>
    `;
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messagesContainer.innerHTML = '';
        }, 5000);
    }
}

// Initialize default card payment method
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        updatePaymentElements('card');
    }, 100);
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        packages,
        selectPackage,
        validateForm,
        showPaymentMessage
    };
}