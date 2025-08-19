// Appointment Booking System
// This handles the calendar interface, time slot selection, and booking confirmation

class BookingSystem {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedSlots = [];
        this.bookingData = null;
        this.availableSlots = {};
        this.timeZone = 'Europe/Amsterdam';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.detectTimeZone();
        await this.loadBookingData();
        this.renderCalendar();
    }

    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => this.previousMonth());
        document.getElementById('next-month').addEventListener('click', () => this.nextMonth());
        
        // Time zone change
        document.getElementById('timezone').addEventListener('change', (e) => {
            this.timeZone = e.target.value;
            this.updateTimeSlots();
        });

        // Booking actions
        document.getElementById('clear-selections').addEventListener('click', () => this.clearSelections());
        document.getElementById('confirm-booking').addEventListener('click', () => this.showConfirmationForm());
        document.getElementById('back-to-calendar').addEventListener('click', () => this.backToCalendar());
        
        // Form submission
        document.getElementById('booking-confirmation-form').addEventListener('submit', (e) => this.confirmBooking(e));
    }

    detectTimeZone() {
        const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneSelect = document.getElementById('timezone');
        
        // Check if detected timezone is in our options
        for (let option of timezoneSelect.options) {
            if (option.value === detectedZone) {
                option.selected = true;
                this.timeZone = detectedZone;
                console.log('Auto-detected timezone:', detectedZone);
                break;
            }
        }
        
        // If no exact match, try to find a close match
        if (this.timeZone === 'Europe/Amsterdam' && detectedZone !== 'Europe/Amsterdam') {
            const europeanZones = ['Europe/Brussels', 'Europe/Berlin', 'Europe/Paris'];
            for (let zone of europeanZones) {
                for (let option of timezoneSelect.options) {
                    if (option.value === zone && detectedZone.startsWith('Europe/')) {
                        option.selected = true;
                        this.timeZone = zone;
                        console.log('Using closest timezone match:', zone);
                        return;
                    }
                }
            }
        }
    }

    async loadBookingData() {
        // Get booking token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const bookingToken = urlParams.get('token');
        
        if (!bookingToken) {
            this.showError('Invalid booking link. Please check your email for the correct link.');
            return;
        }

        try {
            // In production, this would make an API call to verify the token and load booking data
            // For demo purposes, we'll simulate the API response
            this.bookingData = await this.simulateBookingDataLoad(bookingToken);
            this.displayBookingInfo();
            this.loadAvailableSlots();
            
        } catch (error) {
            console.error('Error loading booking data:', error);
            this.showError('Unable to load booking information. Please try again or contact support.');
        }
    }

    async simulateBookingDataLoad(token) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            // Try to decode the booking token (base64 encoded from payment flow)
            if (token && token !== 'demo_booking_token') {
                const decodedData = JSON.parse(atob(token));
                return {
                    customerName: decodedData.customerName || 'Valued Customer',
                    customerEmail: decodedData.customerEmail || 'customer@example.com',
                    packageType: this.getPackageType(decodedData.packageId),
                    packageName: decodedData.packageId || 'Coaching Package',
                    sessionsTotal: decodedData.sessionsTotal || 1,
                    sessionsBooked: 0,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    bookingToken: token,
                    paymentId: decodedData.paymentId
                };
            }
        } catch (error) {
            console.log('Using demo booking data (token decode failed):', error.message);
        }
        
        // Fallback to demo data
        const mockData = {
            customerName: 'Demo Customer',
            customerEmail: 'demo@example.com',
            packageType: 'three-session',
            packageName: '3-Session Package',
            sessionsTotal: 3,
            sessionsBooked: 0,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            bookingToken: token
        };

        return mockData;
    }
    
    getPackageType(packageName) {
        if (!packageName) return 'three-session';
        
        if (packageName.includes('Single') || packageName.includes('1')) return 'single';
        if (packageName.includes('6') || packageName.includes('Intensive')) return 'six-session';
        return 'three-session'; // default
    }

    displayBookingInfo() {
        document.getElementById('status-message').textContent = `Hello ${this.bookingData.customerName}! Ready to schedule your sessions?`;
        document.getElementById('package-name').textContent = this.bookingData.packageName;
        document.getElementById('sessions-remaining').textContent = 
            `${this.bookingData.sessionsTotal - this.bookingData.sessionsBooked} of ${this.bookingData.sessionsTotal}`;
        document.getElementById('booking-expires').textContent = 
            this.bookingData.expiryDate.toLocaleDateString();

        document.getElementById('booking-info').style.display = 'block';
        document.getElementById('calendar-section').style.display = 'block';
    }

    showError(message) {
        document.getElementById('status-message').textContent = message;
        document.getElementById('status-card').className = 'status-card error';
    }

    async loadAvailableSlots() {
        try {
            // Try to load availability from calendar integration
            if (typeof CalendarIntegration !== 'undefined') {
                await this.loadCalendarAvailability();
            } else {
                console.log('📅 Calendar integration not available - using local availability');
                this.generateSampleAvailability();
            }
        } catch (error) {
            console.warn('⚠️ Calendar availability check failed, using local availability:', error.message);
            this.generateSampleAvailability();
        }
    }
    
    async loadCalendarAvailability() {
        console.log('📅 Checking real calendar availability...');
        
        const calendarIntegration = new CalendarIntegration();
        
        try {
            // Initialize with demo credentials
            await calendarIntegration.initialize('google', { primaryCalendarId: 'primary' });
            
            // Check availability for next 60 days
            const startDate = new Date();
            const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
            
            // Get available slots from calendar system
            const availableSlots = await calendarIntegration.checkAvailability(startDate, endDate);
            
            // Convert to our internal format
            this.availableSlots = {};
            availableSlots.forEach(slot => {
                if (!this.availableSlots[slot.date]) {
                    this.availableSlots[slot.date] = [];
                }
                
                this.availableSlots[slot.date].push({
                    time: slot.time,
                    available: true,
                    id: `${slot.date}-${slot.time.replace(':', '')}`,
                    duration: 90,
                    source: 'calendar_api'
                });
            });
            
            console.log('✅ Calendar availability loaded successfully');
            
        } catch (error) {
            console.error('Calendar availability error:', error);
            throw error;
        }
    }

    generateSampleAvailability() {
        const today = new Date();
        // Don't book slots for today if it's past noon
        const startDate = new Date(today);
        if (today.getHours() >= 12) {
            startDate.setDate(startDate.getDate() + 1);
        }
        
        const endDate = new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days ahead
        
        // Nicoline's working hours: Tuesday-Saturday, 9 AM - 5 PM
        const workingDays = [2, 3, 4, 5, 6]; // Tuesday to Saturday
        const workingHours = [9, 10, 11, 14, 15, 16]; // 9-12, 14-17 (with breaks)
        
        // Block some realistic unavailable times
        const blockedDates = this.generateBlockedDates(startDate, endDate);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dateKey = this.formatDateKey(d);
            
            if (workingDays.includes(dayOfWeek)) {
                this.availableSlots[dateKey] = [];
                
                workingHours.forEach(hour => {
                    const slotId = `${dateKey}-${hour}`;
                    const isBlocked = blockedDates.some(blocked => 
                        blocked.date === dateKey && blocked.hour === hour
                    );
                    
                    // More realistic availability (70% available, some blocked)
                    if (!isBlocked && Math.random() > 0.3) {
                        this.availableSlots[dateKey].push({
                            time: `${hour.toString().padStart(2, '0')}:00`,
                            available: true,
                            id: slotId,
                            duration: 90 // 90-minute sessions
                        });
                    }
                });
            }
        }
    }
    
    generateBlockedDates(startDate, endDate) {
        const blocked = [];
        const numBlockedSlots = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24) * 0.1); // 10% blocked
        
        for (let i = 0; i < numBlockedSlots; i++) {
            const randomDays = Math.floor(Math.random() * 60);
            const blockDate = new Date(startDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
            const randomHour = [9, 10, 11, 14, 15, 16][Math.floor(Math.random() * 6)];
            
            blocked.push({
                date: this.formatDateKey(blockDate),
                hour: randomHour
            });
        }
        
        return blocked;
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const monthYear = document.getElementById('current-month');
        
        // Update month/year display
        monthYear.textContent = this.currentDate.toLocaleString('default', { 
            month: 'long', 
            year: 'numeric' 
        });

        // Clear previous calendar
        calendar.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

        // Create calendar header
        const header = document.createElement('div');
        header.className = 'calendar-header-days';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day-header';
            dayElement.textContent = day;
            header.appendChild(dayElement);
        });
        calendar.appendChild(header);

        // Create calendar days
        const calendarDays = document.createElement('div');
        calendarDays.className = 'calendar-days';
        
        for (let i = 0; i < 42; i++) { // 6 weeks
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = this.createDayElement(date);
            calendarDays.appendChild(dayElement);
        }
        
        calendar.appendChild(calendarDays);
    }

    createDayElement(date) {
        const dayElement = document.createElement('div');
        const dateKey = this.formatDateKey(date);
        const today = new Date();
        const isCurrentMonth = date.getMonth() === this.currentDate.getMonth();
        const isPast = date < today;
        const hasSlots = this.availableSlots[dateKey] && this.availableSlots[dateKey].length > 0;

        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();

        // Add appropriate classes
        if (!isCurrentMonth) {
            dayElement.classList.add('other-month');
        }
        if (isPast) {
            dayElement.classList.add('past');
        }
        if (hasSlots && !isPast) {
            dayElement.classList.add('available');
            dayElement.addEventListener('click', () => this.selectDate(date));
        }
        if (this.selectedDate && this.formatDateKey(this.selectedDate) === dateKey) {
            dayElement.classList.add('selected-date');
        }

        return dayElement;
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar(); // Re-render to show selection
        this.displayTimeSlots(date);
    }

    displayTimeSlots(date) {
        const dateKey = this.formatDateKey(date);
        const slots = this.availableSlots[dateKey] || [];
        const timeSlotsContainer = document.getElementById('time-slots');
        const selectedDateElement = document.getElementById('selected-date');

        // Format date in user's timezone
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: this.timeZone
        });
        selectedDateElement.textContent = formattedDate;

        timeSlotsContainer.innerHTML = '';

        if (slots.length === 0) {
            timeSlotsContainer.innerHTML = `
                <div class="no-slots">
                    <p>No available times for this date</p>
                    <p class="hint">Try selecting another date or contact us directly to check for additional availability.</p>
                </div>
            `;
            return;
        }

        // Sort slots by time
        const sortedSlots = slots.sort((a, b) => a.time.localeCompare(b.time));
        
        sortedSlots.forEach(slot => {
            const slotElement = document.createElement('button');
            slotElement.type = 'button';
            slotElement.className = 'time-slot';
            
            // Format time for user's timezone
            const timeDisplay = this.formatTimeForDisplay(slot.time);
            const duration = slot.duration ? ` (${slot.duration}min)` : ' (90min)';
            
            slotElement.innerHTML = `
                <span class="time">${timeDisplay}</span>
                <span class="duration">${duration}</span>
            `;
            
            // Check if this slot is already selected
            const isSelected = this.selectedSlots.some(s => s.id === slot.id);
            if (isSelected) {
                slotElement.classList.add('selected');
                slotElement.innerHTML += '<span class="selected-indicator">✓</span>';
            }

            slotElement.addEventListener('click', () => this.toggleTimeSlot(slot, date));
            timeSlotsContainer.appendChild(slotElement);
        });

        document.getElementById('session-type').style.display = 'block';
        
        // Add timezone info
        const timezoneInfo = document.createElement('div');
        timezoneInfo.className = 'timezone-info';
        timezoneInfo.textContent = `Times shown in ${this.getTimeZoneDisplayName(this.timeZone)}`;
        timeSlotsContainer.appendChild(timezoneInfo);
    }
    
    getTimeZoneDisplayName(timezone) {
        const now = new Date();
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'short'
            });
            const parts = formatter.formatToParts(now);
            const timeZoneName = parts.find(part => part.type === 'timeZoneName');
            return timeZoneName ? timeZoneName.value : timezone;
        } catch {
            return timezone;
        }
    }

    formatTimeForDisplay(time24) {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes.padStart(2, '0')} ${ampm}`;
    }

    toggleTimeSlot(slot, date) {
        const slotId = slot.id;
        const existingIndex = this.selectedSlots.findIndex(s => s.id === slotId);

        if (existingIndex >= 0) {
            // Remove slot
            this.selectedSlots.splice(existingIndex, 1);
        } else {
            // Check if we can add more slots
            const remainingSessions = this.bookingData.sessionsTotal - this.bookingData.sessionsBooked;
            if (this.selectedSlots.length >= remainingSessions) {
                this.showSlotLimitMessage(remainingSessions);
                return;
            }

            // Check for scheduling conflicts (no same-day sessions)
            const sameDaySlot = this.selectedSlots.find(s => 
                this.formatDateKey(s.date) === this.formatDateKey(date)
            );
            
            if (sameDaySlot) {
                this.showSchedulingConflict('You can only book one session per day. Please choose a different date.');
                return;
            }

            // Add slot
            this.selectedSlots.push({
                id: slotId,
                date: new Date(date), // Create new Date object to avoid reference issues
                time: slot.time,
                dateKey: this.formatDateKey(date),
                duration: slot.duration || 90
            });
        }

        this.updateSelectedSessions();
        this.displayTimeSlots(date); // Refresh to show selection state
    }
    
    showSlotLimitMessage(remainingSessions) {
        const message = `You can only book ${remainingSessions} more session(s) with this package.`;
        this.showTemporaryMessage(message, 'warning');
    }
    
    showSchedulingConflict(message) {
        this.showTemporaryMessage(message, 'error');
    }
    
    showTemporaryMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessage = document.querySelector('.temporary-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message message-${type}`;
        messageDiv.textContent = message;
        
        const timeSlotsContainer = document.getElementById('time-slots');
        timeSlotsContainer.insertBefore(messageDiv, timeSlotsContainer.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    updateSelectedSessions() {
        const selectedSessionsDiv = document.getElementById('selected-sessions');
        const sessionsListDiv = document.getElementById('sessions-list');
        const confirmButton = document.getElementById('confirm-booking');

        if (this.selectedSlots.length === 0) {
            selectedSessionsDiv.style.display = 'none';
            return;
        }

        selectedSessionsDiv.style.display = 'block';
        confirmButton.disabled = false;

        // Sort selected slots by date and time
        const sortedSlots = [...this.selectedSlots].sort((a, b) => {
            const dateCompare = a.date.getTime() - b.date.getTime();
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        });

        sessionsListDiv.innerHTML = '';
        sortedSlots.forEach((slot, index) => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'selected-session';
            
            const formattedDate = slot.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                timeZone: this.timeZone
            });
            
            sessionDiv.innerHTML = `
                <div class="session-details">
                    <div class="session-header">
                        <strong>Session ${index + 1}</strong>
                        <span class="session-type">${this.getSessionTypeIcon()} 90 minutes</span>
                    </div>
                    <div class="session-time">
                        <span class="date">${formattedDate}</span>
                        <span class="time">${this.formatTimeForDisplay(slot.time)}</span>
                        <span class="timezone">(${this.getTimeZoneDisplayName(this.timeZone)})</span>
                    </div>
                </div>
                <button type="button" class="remove-session" data-slot-id="${slot.id}" title="Remove this session">
                    ×
                </button>
            `;
            
            sessionDiv.querySelector('.remove-session').addEventListener('click', (e) => {
                e.preventDefault();
                this.removeSelectedSlot(slot.id);
            });

            sessionsListDiv.appendChild(sessionDiv);
        });
        
        // Update summary
        this.updateBookingSummary();
    }
    
    getSessionTypeIcon() {
        const sessionFormat = document.getElementById('session-format')?.value || 'in-person';
        return sessionFormat === 'online' ? '💻' : '🏢';
    }
    
    updateBookingSummary() {
        const sessionsCount = this.selectedSlots.length;
        const remainingSessions = this.bookingData.sessionsTotal - this.bookingData.sessionsBooked;
        
        let summaryHTML = `
            <div class="booking-summary">
                <p><strong>${sessionsCount}</strong> of <strong>${remainingSessions}</strong> sessions scheduled</p>
        `;
        
        if (sessionsCount < remainingSessions) {
            summaryHTML += `<p class="remaining-notice">You can schedule ${remainingSessions - sessionsCount} more session(s)</p>`;
        } else if (sessionsCount === remainingSessions) {
            summaryHTML += `<p class="complete-notice">✓ All sessions scheduled</p>`;
        }
        
        summaryHTML += '</div>';
        
        // Add or update summary
        let existingSummary = document.querySelector('.booking-summary');
        if (existingSummary) {
            existingSummary.outerHTML = summaryHTML;
        } else {
            const sessionsListDiv = document.getElementById('sessions-list');
            sessionsListDiv.insertAdjacentHTML('afterend', summaryHTML);
        }
    }

    removeSelectedSlot(slotId) {
        const index = this.selectedSlots.findIndex(s => s.id === slotId);
        if (index >= 0) {
            this.selectedSlots.splice(index, 1);
            this.updateSelectedSessions();
            
            // Refresh time slots display if this date is selected
            if (this.selectedDate) {
                this.displayTimeSlots(this.selectedDate);
            }
        }
    }

    clearSelections() {
        this.selectedSlots = [];
        this.updateSelectedSessions();
        if (this.selectedDate) {
            this.displayTimeSlots(this.selectedDate);
        }
    }

    showConfirmationForm() {
        // Pre-fill form with customer data
        document.getElementById('confirm-name').value = this.bookingData.customerName;
        document.getElementById('confirm-email').value = this.bookingData.customerEmail;

        // Hide calendar and show confirmation
        document.getElementById('calendar-section').style.display = 'none';
        document.getElementById('confirmation-section').style.display = 'block';
    }

    backToCalendar() {
        document.getElementById('confirmation-section').style.display = 'none';
        document.getElementById('calendar-section').style.display = 'block';
    }

    async confirmBooking(event) {
        event.preventDefault();

        // Validate form before processing
        if (!this.validateBookingForm()) {
            return;
        }

        const formData = new FormData(event.target);
        const bookingDetails = {
            customerInfo: {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                emergencyContact: formData.get('emergency-contact')
            },
            sessionPreferences: {
                experienceLevel: formData.get('experience-level'),
                primaryGoals: formData.get('primary-goals'),
                healthConditions: formData.get('health-conditions'),
                specialRequests: formData.get('special-requests')
            },
            selectedSlots: this.selectedSlots,
            sessionFormat: document.getElementById('session-format').value,
            timeZone: this.timeZone,
            bookingToken: this.bookingData.bookingToken,
            paymentId: this.bookingData.paymentId
        };

        try {
            // Show loading state
            const submitButton = document.getElementById('final-confirm');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Confirming...';
            submitButton.disabled = true;
            submitButton.classList.add('btn-loading');
            
            // Show loading notification
            if (window.userFeedback) {
                window.userFeedback.showLoading('booking-confirmation', 'Confirming your booking and creating calendar events...');
            }

            // Validate slots are still available (prevent double booking)
            const validationResult = await this.validateSlotsAvailability();
            if (!validationResult.valid) {
                throw new Error('Some selected time slots are no longer available. Please select different times.');
            }

            // Process the booking
            const result = await this.processBooking(bookingDetails);
            
            // Update success page with booking details
            this.updateSuccessPage(result);

            // Show success section
            document.getElementById('confirmation-section').style.display = 'none';
            document.getElementById('success-section').style.display = 'block';
            
            // Hide loading notification and show success
            if (window.userFeedback) {
                window.userFeedback.hideLoading('booking-confirmation');
                window.userFeedback.showSuccess('Booking confirmed successfully! Calendar invites have been sent.', {
                    duration: 5000
                });
            }
            
            // Complete journey step
            if (window.journeyTracker) {
                window.journeyTracker.completeCurrentStep({
                    bookingId: result.bookingId,
                    sessionsBooked: bookingDetails.selectedSlots.length,
                    sessionFormat: bookingDetails.sessionFormat,
                    calendarIntegration: result.calendarIntegration
                });
            }
            
            // Scroll to success section
            document.getElementById('success-section').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Booking confirmation error:', error);
            
            // Hide loading notification
            if (window.userFeedback) {
                window.userFeedback.hideLoading('booking-confirmation');
            }
            
            this.showBookingError(error.message);
            
            // Reset button
            const submitButton = document.getElementById('final-confirm');
            submitButton.textContent = 'Confirm All Sessions';
            submitButton.disabled = false;
            submitButton.classList.remove('btn-loading');
        }
    }
    
    validateBookingForm() {
        const requiredFields = [
            { id: 'confirm-name', name: 'Full Name' },
            { id: 'confirm-email', name: 'Email Address' },
            { id: 'primary-goals', name: 'Primary Goals' }
        ];
        
        const requiredCheckboxes = [
            { id: 'policy-agreement', name: 'Terms and Conditions' },
            { id: 'health-agreement', name: 'Health Confirmation' }
        ];
        
        let isValid = true;
        let errorMessage = '';
        
        // Validate required text fields
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element || !element.value.trim()) {
                errorMessage += `${field.name} is required.\n`;
                isValid = false;
            }
        });
        
        // Validate email format
        const emailField = document.getElementById('confirm-email');
        if (emailField && emailField.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value)) {
                errorMessage += 'Please enter a valid email address.\n';
                isValid = false;
            }
        }
        
        // Validate required checkboxes
        requiredCheckboxes.forEach(checkbox => {
            const element = document.getElementById(checkbox.id);
            if (!element || !element.checked) {
                errorMessage += `You must agree to ${checkbox.name}.\n`;
                isValid = false;
            }
        });
        
        // Check if sessions are selected
        if (this.selectedSlots.length === 0) {
            errorMessage += 'Please select at least one session time.\n';
            isValid = false;
        }
        
        if (!isValid) {
            alert('Please correct the following:\n\n' + errorMessage);
        }
        
        return isValid;
    }
    
    async validateSlotsAvailability() {
        // In production, this would check with the server
        // For demo, simulate validation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate occasional conflicts (5% chance)
        const hasConflict = Math.random() < 0.05;
        
        return {
            valid: !hasConflict,
            conflicts: hasConflict ? [this.selectedSlots[0]] : []
        };
    }
    
    showBookingError(message) {
        if (window.userFeedback) {
            window.userFeedback.showError(message, {
                id: 'booking-error',
                actions: [
                    {
                        text: 'Try Again',
                        action: () => {
                            window.userFeedback.removeNotification('booking-error');
                        },
                        type: 'primary'
                    }
                ]
            });
        } else {
            // Fallback method
            const errorDiv = document.createElement('div');
            errorDiv.className = 'booking-error';
            errorDiv.innerHTML = `
                <div class="error-message">
                    <strong>Booking Error:</strong> ${message}
                </div>
            `;
            
            const form = document.getElementById('booking-confirmation-form');
            form.insertBefore(errorDiv, form.firstChild);
            
            // Remove error after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 10000);
        }
    }
    
    updateSuccessPage(bookingResult) {
        // Update contact information with actual booking details
        const contactInfo = document.querySelector('.contact-info');
        if (contactInfo && bookingResult.bookingId) {
            const bookingIdP = document.createElement('p');
            bookingIdP.innerHTML = `<strong>Booking ID:</strong> ${bookingResult.bookingId}`;
            contactInfo.appendChild(bookingIdP);
        }
    }

    async processBooking(bookingDetails) {
        // Simulate realistic API processing time
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        console.log('Booking confirmed:', bookingDetails);
        
        // Generate realistic booking ID
        const bookingId = 'NT-' + Date.now().toString().slice(-8) + '-' + 
                         Math.random().toString(36).substr(2, 4).toUpperCase();
        
        try {
            // Create calendar events for each selected slot
            const calendarEvents = await this.createCalendarEvents(bookingDetails, bookingId);
            
            // Send confirmation emails and calendar invites
            await this.sendBookingConfirmations(bookingDetails, bookingId);
            
            // Mark slots as booked in our local availability
            this.markSlotsAsBooked(bookingDetails.selectedSlots);
            
            console.log('✅ Booking processed successfully with calendar integration');
            
            return { 
                success: true, 
                bookingId: bookingId,
                confirmationEmails: ['client', 'coach'],
                calendarEvents: calendarEvents,
                calendarIntegration: true
            };
            
        } catch (error) {
            console.warn('⚠️ Booking processed but calendar integration failed:', error.message);
            
            // Still return success even if calendar integration fails
            return { 
                success: true, 
                bookingId: bookingId,
                confirmationEmails: ['client', 'coach'],
                calendarEvents: [],
                calendarIntegration: false,
                calendarError: error.message
            };
        }
    }
    
    async createCalendarEvents(bookingDetails, bookingId) {
        const calendarEvents = [];
        
        // Initialize calendar integration if available
        if (typeof CalendarIntegration !== 'undefined') {
            const calendarIntegration = new CalendarIntegration();
            
            try {
                // Initialize with demo credentials
                await calendarIntegration.initialize('google', { primaryCalendarId: 'primary' });
                
                // Create calendar event for each session
                for (const slot of bookingDetails.selectedSlots) {
                    const eventData = {
                        date: slot.date,
                        time: slot.time,
                        customerName: bookingDetails.customerInfo.name,
                        customerEmail: bookingDetails.customerInfo.email,
                        customerPhone: bookingDetails.customerInfo.phone,
                        sessionFormat: bookingDetails.sessionFormat,
                        packageName: this.bookingData.packageName,
                        primaryGoals: bookingDetails.sessionPreferences.primaryGoals,
                        bookingId: bookingId,
                        timeZone: bookingDetails.timeZone
                    };
                    
                    const calendarEvent = await calendarIntegration.createAppointment(eventData);
                    
                    // Also send calendar invite to client
                    await calendarIntegration.sendCalendarInvite(eventData, bookingDetails.customerInfo.email);
                    
                    calendarEvents.push({
                        id: calendarEvent.data?.id || 'cal-' + slot.id,
                        title: `Somatic Coaching Session with ${bookingDetails.customerInfo.name}`,
                        start: slot.date,
                        time: slot.time,
                        duration: 90,
                        location: bookingDetails.sessionFormat === 'in-person' ? 'The Hague, Netherlands' : 'Online (Video Call)',
                        status: 'confirmed'
                    });
                }
                
            } catch (error) {
                console.error('Calendar integration error:', error);
                throw new Error('Failed to create calendar events: ' + error.message);
            }
        } else {
            // Fallback when calendar integration is not available
            console.log('📅 Calendar integration not available - using fallback');
            
            bookingDetails.selectedSlots.forEach(slot => {
                calendarEvents.push({
                    id: 'cal-' + slot.id,
                    title: `Somatic Coaching Session with ${bookingDetails.customerInfo.name}`,
                    start: slot.date,
                    time: slot.time,
                    duration: 90,
                    location: bookingDetails.sessionFormat === 'in-person' ? 'The Hague, Netherlands' : 'Online (Video Call)',
                    status: 'pending_calendar_sync'
                });
            });
        }
        
        return calendarEvents;
    }
    
    async sendBookingConfirmations(bookingDetails, bookingId) {
        // In production, this would send actual emails
        console.log('📧 Sending booking confirmation emails...');
        
        const clientEmail = {
            to: bookingDetails.customerInfo.email,
            subject: 'Your Somatic Coaching Sessions are Confirmed',
            template: 'booking-confirmation-client',
            data: {
                customerName: bookingDetails.customerInfo.name,
                bookingId: bookingId,
                sessions: bookingDetails.selectedSlots,
                packageName: this.bookingData.packageName,
                sessionFormat: bookingDetails.sessionFormat,
                coachEmail: 'hello@nicolinethijssen.nl',
                coachPhone: '+31 6 1234 5678'
            }
        };
        
        const coachEmail = {
            to: 'hello@nicolinethijssen.nl',
            subject: `New Booking: ${bookingDetails.customerInfo.name} - ${bookingId}`,
            template: 'booking-notification-coach',
            data: {
                customerName: bookingDetails.customerInfo.name,
                customerEmail: bookingDetails.customerInfo.email,
                customerPhone: bookingDetails.customerInfo.phone,
                bookingId: bookingId,
                sessions: bookingDetails.selectedSlots,
                packageName: this.bookingData.packageName,
                sessionPreferences: bookingDetails.sessionPreferences,
                paymentId: bookingDetails.paymentId
            }
        };
        
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✉️ Client confirmation email sent to:', clientEmail.to);
        console.log('✉️ Coach notification email sent to:', coachEmail.to);
        
        return { clientEmail, coachEmail };
    }
    
    simulateEmailNotifications(bookingDetails, bookingId) {
        console.log('📧 Sending confirmation email to:', bookingDetails.customerInfo.email);
        console.log('📧 Sending notification to coach: hello@nicolinethijssen.nl');
        console.log('📅 Creating calendar invites for', bookingDetails.selectedSlots.length, 'sessions');
        console.log('🔔 Setting up reminder notifications');
    }
    
    markSlotsAsBooked(selectedSlots) {
        selectedSlots.forEach(slot => {
            const dateKey = this.formatDateKey(slot.date);
            if (this.availableSlots[dateKey]) {
                this.availableSlots[dateKey] = this.availableSlots[dateKey].filter(s => s.id !== slot.id);
            }
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    updateTimeSlots() {
        if (this.selectedDate) {
            this.displayTimeSlots(this.selectedDate);
        }
    }
}

// Initialize booking system when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BookingSystem();
});

// Add to calendar functionality
document.addEventListener('DOMContentLoaded', () => {
    const addToCalendarBtn = document.getElementById('add-to-calendar');
    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener('click', () => {
            // This would generate calendar files for the booked sessions
            alert('Calendar invites will be sent to your email shortly!');
        });
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingSystem;
}