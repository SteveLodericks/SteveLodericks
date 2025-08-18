// Stripe Webhook Handler for Payment Confirmations
// This file demonstrates how to handle Stripe webhooks for payment processing
// In production, this would be a server-side endpoint

const STRIPE_ENDPOINT_SECRET = 'whsec_your_stripe_webhook_secret_here'; // Replace with actual secret

/**
 * Webhook handler for Stripe payment events
 * This would typically run on your server (Node.js, PHP, Python, etc.)
 */
function handleStripeWebhook(event) {
    console.log('Processing webhook event:', event.type);
    
    switch (event.type) {
        case 'payment_intent.succeeded':
            handlePaymentSuccess(event.data.object);
            break;
        case 'payment_intent.payment_failed':
            handlePaymentFailed(event.data.object);
            break;
        case 'checkout.session.completed':
            handleCheckoutCompleted(event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
}

/**
 * Handle successful payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentSuccess(paymentIntent) {
    const { id, amount, currency, metadata } = paymentIntent;
    
    console.log('Payment successful:', {
        paymentId: id,
        amount: amount / 100, // Convert from cents
        currency: currency.toUpperCase(),
        customerEmail: metadata.customer_email,
        packageType: metadata.package_type,
        customerName: metadata.customer_name
    });
    
    try {
        // 1. Update payment status in database
        await updatePaymentStatus(id, 'completed');
        
        // 2. Send confirmation email to customer
        await sendConfirmationEmail({
            email: metadata.customer_email,
            name: metadata.customer_name,
            packageType: metadata.package_type,
            amount: amount / 100,
            paymentId: id
        });
        
        // 3. Send notification email to Nicoline
        await sendNotificationToCoach({
            customerEmail: metadata.customer_email,
            customerName: metadata.customer_name,
            packageType: metadata.package_type,
            amount: amount / 100,
            paymentId: id,
            sessionPreference: metadata.session_preference
        });
        
        // 4. Create booking record and generate booking link
        await createBookingRecord({
            paymentId: id,
            customerEmail: metadata.customer_email,
            customerName: metadata.customer_name,
            packageType: metadata.package_type,
            sessionsCount: getSessionsCount(metadata.package_type)
        });
        
        // 5. Send booking instructions
        await sendBookingInstructions({
            email: metadata.customer_email,
            name: metadata.customer_name,
            packageType: metadata.package_type,
            paymentId: id
        });
        
    } catch (error) {
        console.error('Error processing successful payment:', error);
        // In production, you might want to retry or send alert notifications
    }
}

/**
 * Handle failed payment
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentFailed(paymentIntent) {
    const { id, last_payment_error, metadata } = paymentIntent;
    
    console.log('Payment failed:', {
        paymentId: id,
        error: last_payment_error?.message,
        customerEmail: metadata.customer_email
    });
    
    try {
        // 1. Update payment status in database
        await updatePaymentStatus(id, 'failed');
        
        // 2. Send failure notification (optional)
        await sendPaymentFailureEmail({
            email: metadata.customer_email,
            name: metadata.customer_name,
            error: last_payment_error?.message,
            paymentId: id
        });
        
    } catch (error) {
        console.error('Error processing failed payment:', error);
    }
}

/**
 * Handle completed checkout session (for Stripe Checkout integration)
 * @param {Object} session - Stripe checkout session object
 */
async function handleCheckoutCompleted(session) {
    console.log('Checkout session completed:', session.id);
    
    // Extract customer and payment information
    const customerEmail = session.customer_details.email;
    const customerName = session.customer_details.name;
    const amountTotal = session.amount_total / 100;
    
    // Process the completed checkout
    // This is similar to handlePaymentSuccess but for Checkout sessions
}

/**
 * Update payment status in database
 * @param {string} paymentId - Payment intent ID
 * @param {string} status - New status ('completed', 'failed', 'pending')
 */
async function updatePaymentStatus(paymentId, status) {
    // In production, this would update your database
    console.log(`Updating payment ${paymentId} status to ${status}`);
    
    // Example database update (pseudo-code)
    /*
    await db.payments.update({
        payment_intent_id: paymentId
    }, {
        status: status,
        updated_at: new Date()
    });
    */
}

/**
 * Send confirmation email to customer
 * @param {Object} details - Customer and payment details
 */
async function sendConfirmationEmail(details) {
    const { email, name, packageType, amount, paymentId } = details;
    
    console.log(`Sending confirmation email to ${email}`);
    
    // Example email content
    const emailContent = {
        to: email,
        subject: 'Payment Confirmation - Nicoline Thijssen Somatic Coaching',
        html: `
            <h2>Payment Confirmation</h2>
            <p>Dear ${name},</p>
            <p>Thank you for booking your somatic coaching session(s) with Nicoline Thijssen.</p>
            <h3>Order Details:</h3>
            <ul>
                <li>Package: ${packageType}</li>
                <li>Amount: €${amount}</li>
                <li>Payment ID: ${paymentId}</li>
                <li>Date: ${new Date().toLocaleDateString()}</li>
            </ul>
            <p>You will receive a separate email with booking instructions within the next hour.</p>
            <p>Best regards,<br>Nicoline Thijssen</p>
        `
    };
    
    // In production, use email service (SendGrid, Mailgun, etc.)
    // await emailService.send(emailContent);
}

/**
 * Send notification to coach about new booking
 * @param {Object} details - Customer and payment details
 */
async function sendNotificationToCoach(details) {
    const { customerEmail, customerName, packageType, amount, paymentId, sessionPreference } = details;
    
    console.log('Sending notification to coach');
    
    const emailContent = {
        to: 'hello@nicolinethijssen.nl',
        subject: `New Booking: ${packageType} - ${customerName}`,
        html: `
            <h2>New Booking Received</h2>
            <h3>Customer Details:</h3>
            <ul>
                <li>Name: ${customerName}</li>
                <li>Email: ${customerEmail}</li>
                <li>Package: ${packageType}</li>
                <li>Amount: €${amount}</li>
                <li>Session Preference: ${sessionPreference}</li>
                <li>Payment ID: ${paymentId}</li>
            </ul>
            <p>Please review and prepare for the upcoming session(s).</p>
        `
    };
    
    // Send notification to coach
    // await emailService.send(emailContent);
}

/**
 * Create booking record in system
 * @param {Object} bookingData - Booking information
 */
async function createBookingRecord(bookingData) {
    const { paymentId, customerEmail, customerName, packageType, sessionsCount } = bookingData;
    
    console.log(`Creating booking record for ${customerName}`);
    
    // In production, create booking record in database
    /*
    const booking = await db.bookings.create({
        payment_intent_id: paymentId,
        customer_email: customerEmail,
        customer_name: customerName,
        package_type: packageType,
        sessions_total: sessionsCount,
        sessions_completed: 0,
        status: 'pending_schedule',
        created_at: new Date()
    });
    */
    
    // Generate unique booking link
    const bookingToken = generateBookingToken(paymentId);
    console.log(`Booking token generated: ${bookingToken}`);
    
    return {
        bookingId: `booking_${Date.now()}`,
        bookingToken: bookingToken
    };
}

/**
 * Send booking instructions with scheduling link
 * @param {Object} details - Customer details
 */
async function sendBookingInstructions(details) {
    const { email, name, packageType, paymentId } = details;
    
    console.log(`Sending booking instructions to ${email}`);
    
    const bookingLink = `${process.env.WEBSITE_URL || 'https://nicolinethijssen.nl'}/booking?token=${generateBookingToken(paymentId)}`;
    
    const emailContent = {
        to: email,
        subject: 'Booking Instructions - Schedule Your Sessions',
        html: `
            <h2>Ready to Schedule Your Sessions!</h2>
            <p>Dear ${name},</p>
            <p>Your payment has been confirmed. Now it's time to schedule your ${packageType} session(s).</p>
            
            <h3>Next Steps:</h3>
            <ol>
                <li>Click the booking link below to access the scheduling system</li>
                <li>Choose your preferred dates and times</li>
                <li>Complete the brief intake form</li>
                <li>Receive confirmation of your scheduled sessions</li>
            </ol>
            
            <p style="margin: 20px 0;">
                <a href="${bookingLink}" style="background-color: #8fbc8f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                    Schedule Your Sessions
                </a>
            </p>
            
            <p>This link is personal to you and expires in 30 days.</p>
            <p>If you have any questions, don't hesitate to reach out.</p>
            
            <p>Looking forward to working with you!</p>
            <p>Nicoline Thijssen<br>
            Email: hello@nicolinethijssen.nl<br>
            Phone: +31 6 1234 5678</p>
        `
    };
    
    // Send booking instructions
    // await emailService.send(emailContent);
}

/**
 * Generate secure booking token
 * @param {string} paymentId - Payment intent ID
 * @returns {string} - Secure booking token
 */
function generateBookingToken(paymentId) {
    // In production, use crypto.randomBytes() and proper hashing
    return Buffer.from(`${paymentId}_${Date.now()}`).toString('base64url');
}

/**
 * Get session count based on package type
 * @param {string} packageType - Package identifier
 * @returns {number} - Number of sessions
 */
function getSessionsCount(packageType) {
    const sessionCounts = {
        'single': 1,
        'three-session': 3,
        'six-session': 6
    };
    
    return sessionCounts[packageType] || 1;
}

/**
 * Verify webhook signature (production security)
 * @param {string} payload - Raw webhook payload
 * @param {string} signature - Stripe signature header
 * @returns {boolean} - Whether signature is valid
 */
function verifyWebhookSignature(payload, signature) {
    // In production, use Stripe's signature verification
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    try {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            STRIPE_ENDPOINT_SECRET
        );
        return event;
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return false;
    }
    */
    
    console.log('Webhook signature verification (demo mode)');
    return true;
}

// Export for testing and server integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleStripeWebhook,
        handlePaymentSuccess,
        handlePaymentFailed,
        updatePaymentStatus,
        sendConfirmationEmail,
        createBookingRecord,
        getSessionsCount
    };
}

// Example webhook endpoint setup for Express.js
/*
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        const event = verifyWebhookSignature(req.body, sig);
        if (!event) {
            return res.status(400).send('Webhook signature verification failed');
        }
        
        handleStripeWebhook(event);
        res.json({received: true});
    } catch (err) {
        console.error('Webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});
*/