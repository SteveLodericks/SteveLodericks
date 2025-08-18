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
                break;
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
        
        // Decode token to get basic info (in production, this would be server-side)
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
        // In production, this would load available time slots from the server
        // For demo purposes, we'll generate sample availability
        this.generateSampleAvailability();
    }

    generateSampleAvailability() {
        const today = new Date();
        const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days ahead
        
        // Nicoline's working hours: Tuesday-Saturday, 9 AM - 5 PM
        const workingDays = [2, 3, 4, 5, 6]; // Tuesday to Saturday
        const workingHours = [9, 10, 11, 14, 15, 16]; // 9-12, 14-17 (with breaks)
        
        for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dateKey = this.formatDateKey(d);
            
            if (workingDays.includes(dayOfWeek)) {
                this.availableSlots[dateKey] = [];
                
                workingHours.forEach(hour => {
                    // Random availability (80% chance of being available)
                    if (Math.random() > 0.2) {
                        this.availableSlots[dateKey].push({
                            time: `${hour.toString().padStart(2, '0')}:00`,
                            available: true,
                            id: `${dateKey}-${hour}`
                        });
                    }
                });
            }
        }
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

        selectedDateElement.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        timeSlotsContainer.innerHTML = '';

        if (slots.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="no-slots">No available times for this date</p>';
            return;
        }

        slots.forEach(slot => {
            const slotElement = document.createElement('button');
            slotElement.type = 'button';
            slotElement.className = 'time-slot';
            slotElement.textContent = this.formatTimeForDisplay(slot.time);
            
            // Check if this slot is already selected
            const isSelected = this.selectedSlots.some(s => s.id === slot.id);
            if (isSelected) {
                slotElement.classList.add('selected');
            }

            slotElement.addEventListener('click', () => this.toggleTimeSlot(slot, date));
            timeSlotsContainer.appendChild(slotElement);
        });

        document.getElementById('session-type').style.display = 'block';
    }

    formatTimeForDisplay(time24) {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
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
                alert(`You can only book ${remainingSessions} more session(s).`);
                return;
            }

            // Add slot
            this.selectedSlots.push({
                id: slotId,
                date: date,
                time: slot.time,
                dateKey: this.formatDateKey(date)
            });
        }

        this.updateSelectedSessions();
        this.displayTimeSlots(date); // Refresh to show selection state
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

        sessionsListDiv.innerHTML = '';
        this.selectedSlots.forEach((slot, index) => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'selected-session';
            sessionDiv.innerHTML = `
                <div class="session-details">
                    <strong>Session ${index + 1}</strong>
                    <span>${slot.date.toLocaleDateString()} at ${this.formatTimeForDisplay(slot.time)}</span>
                </div>
                <button type="button" class="remove-session" data-slot-id="${slot.id}">Remove</button>
            `;
            
            sessionDiv.querySelector('.remove-session').addEventListener('click', (e) => {
                this.removeSelectedSlot(slot.id);
            });

            sessionsListDiv.appendChild(sessionDiv);
        });
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
            bookingToken: this.bookingData.bookingToken
        };

        try {
            // Show loading state
            const submitButton = document.getElementById('final-confirm');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Confirming...';
            submitButton.disabled = true;

            // In production, this would send the booking to the server
            await this.processBooking(bookingDetails);

            // Show success
            document.getElementById('confirmation-section').style.display = 'none';
            document.getElementById('success-section').style.display = 'block';

        } catch (error) {
            console.error('Booking confirmation error:', error);
            alert('There was an error confirming your booking. Please try again or contact support.');
            
            // Reset button
            const submitButton = document.getElementById('final-confirm');
            submitButton.textContent = 'Confirm All Sessions';
            submitButton.disabled = false;
        }
    }

    async processBooking(bookingDetails) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Booking confirmed:', bookingDetails);
        
        // In production, this would:
        // 1. Save booking to database
        // 2. Send confirmation emails
        // 3. Create calendar events
        // 4. Update availability
        // 5. Send notifications to coach
        
        return { success: true, bookingId: 'BK' + Date.now() };
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