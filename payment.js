/**
 * Stripe Payment Integration
 * SECURITY: Uses configuration from payment-config.js
 * Secret keys are handled server-side only
 */

// Initialize payment system with secure configuration
let stripe;
let elements;
let selectedPackage = null;

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
            stripe = Stripe(publishableKey);
            console.log('Stripe payment system initialized');
            return true;
        } else {
            console.log('Stripe payment system in demo mode');
            return false;
        }
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showPaymentMessage('Payment system unavailable. Please contact us directly.', 'error');
        return false;
    }
}

// Package selection handlers
document.addEventListener('DOMContentLoaded', function() {
    initializeStripe();
    setupPackageSelection();
    setupPaymentForm();
});

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

function selectPackage(packageId) {
    selectedPackage = packages[packageId];
    
    if (!selectedPackage) {
        console.error('Invalid package selected');
        return;
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

function updatePaymentElements(method) {
    const paymentElementContainer = document.getElementById('payment-element');
    
    // Clear existing content
    paymentElementContainer.innerHTML = '';
    
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
    
    if (!selectedPackage) {
        showPaymentMessage('Please select a package first.', 'error');
        return;
    }
    
    if (!validateForm()) {
        return;
    }
    
    setLoadingState(true);
    
    try {
        // In a real implementation, this would:
        // 1. Create payment intent on server
        // 2. Confirm payment with Stripe
        // 3. Handle the result
        
        // For demo purposes, simulate payment processing
        await simulatePaymentProcessing();
        
        // Redirect to success page
        window.location.href = `payment-success.html?package=${selectedPackage.name}&amount=${selectedPackage.price}`;
        
    } catch (error) {
        console.error('Payment error:', error);
        showPaymentMessage('Payment failed. Please try again or contact support.', 'error');
        setLoadingState(false);
    }
}

function validateForm() {
    const requiredFields = ['customer-name', 'customer-email', 'terms-checkbox'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        if (fieldId === 'terms-checkbox') {
            if (!field.checked) {
                showPaymentMessage('Please accept the terms and conditions.', 'error');
                isValid = false;
            }
        } else if (!field.value.trim()) {
            showPaymentMessage(`Please fill in all required fields.`, 'error');
            field.focus();
            isValid = false;
        }
    });
    
    // Validate email format
    const emailField = document.getElementById('customer-email');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            showPaymentMessage('Please enter a valid email address.', 'error');
            emailField.focus();
            isValid = false;
        }
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
        spinner.style.display = 'inline-block';
        buttonText.textContent = 'Processing...';
    } else {
        submitButton.disabled = false;
        spinner.style.display = 'none';
        buttonText.textContent = 'Complete Payment';
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