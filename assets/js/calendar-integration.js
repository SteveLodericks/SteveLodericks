// Calendar Management Integration System
// Handles Google Calendar and Outlook Calendar API integration for automatic appointment blocking

class CalendarIntegration {
    constructor() {
        this.googleCalendarAPI = null;
        this.outlookCalendarAPI = null;
        this.primaryCalendarId = null;
        this.isInitialized = false;
        
        this.config = {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
                redirectUri: process.env.GOOGLE_REDIRECT_URI || 'https://nicolinethijssen.nl/auth/google/callback',
                scopes: [
                    'https://www.googleapis.com/auth/calendar.readonly',
                    'https://www.googleapis.com/auth/calendar.events'
                ]
            },
            outlook: {
                clientId: process.env.OUTLOOK_CLIENT_ID || 'your_outlook_client_id',
                clientSecret: process.env.OUTLOOK_CLIENT_SECRET || 'your_outlook_client_secret',
                redirectUri: process.env.OUTLOOK_REDIRECT_URI || 'https://nicolinethijssen.nl/auth/outlook/callback',
                scopes: ['https://graph.microsoft.com/calendars.readwrite']
            }
        };
    }

    /**
     * Initialize calendar integration
     * @param {string} provider - 'google' or 'outlook'
     * @param {Object} credentials - Authentication credentials
     */
    async initialize(provider, credentials) {
        try {
            if (provider === 'google') {
                await this.initializeGoogleCalendar(credentials);
            } else if (provider === 'outlook') {
                await this.initializeOutlookCalendar(credentials);
            } else {
                throw new Error('Unsupported calendar provider');
            }
            
            this.isInitialized = true;
            console.log(`${provider} calendar integration initialized successfully`);
            
        } catch (error) {
            console.error(`Error initializing ${provider} calendar:`, error);
            throw error;
        }
    }

    /**
     * Initialize Google Calendar API
     * @param {Object} credentials - Google OAuth credentials
     */
    async initializeGoogleCalendar(credentials) {
        // In production, use Google Calendar API client library
        // const {google} = require('googleapis');
        // this.googleCalendarAPI = google.calendar({version: 'v3', auth: oauth2Client});
        
        // For demo purposes, simulate initialization
        this.googleCalendarAPI = {
            events: {
                list: this.mockGoogleEventsList.bind(this),
                insert: this.mockGoogleEventsInsert.bind(this),
                update: this.mockGoogleEventsUpdate.bind(this),
                delete: this.mockGoogleEventsDelete.bind(this)
            },
            calendars: {
                get: this.mockGoogleCalendarsGet.bind(this)
            }
        };
        
        this.primaryCalendarId = credentials.primaryCalendarId || 'primary';
        console.log('Google Calendar API initialized (demo mode)');
    }

    /**
     * Initialize Outlook Calendar API
     * @param {Object} credentials - Outlook OAuth credentials
     */
    async initializeOutlookCalendar(credentials) {
        // In production, use Microsoft Graph API
        // const {Client} = require('@azure/msal-node');
        // this.outlookCalendarAPI = Client.init({...});
        
        // For demo purposes, simulate initialization
        this.outlookCalendarAPI = {
            events: {
                list: this.mockOutlookEventsList.bind(this),
                create: this.mockOutlookEventsCreate.bind(this),
                update: this.mockOutlookEventsUpdate.bind(this),
                delete: this.mockOutlookEventsDelete.bind(this)
            }
        };
        
        console.log('Outlook Calendar API initialized (demo mode)');
    }

    /**
     * Create a calendar event when booking is confirmed
     * @param {Object} bookingData - Booking information
     * @returns {Object} Created event details
     */
    async createAppointment(bookingData) {
        if (!this.isInitialized) {
            throw new Error('Calendar integration not initialized');
        }

        const eventData = this.formatEventData(bookingData);
        
        try {
            let createdEvent;
            
            if (this.googleCalendarAPI) {
                createdEvent = await this.createGoogleEvent(eventData);
            } else if (this.outlookCalendarAPI) {
                createdEvent = await this.createOutlookEvent(eventData);
            }
            
            // Store event mapping for future updates
            await this.storeEventMapping(bookingData.bookingId, createdEvent.id);
            
            console.log('Appointment created in calendar:', createdEvent.id);
            return createdEvent;
            
        } catch (error) {
            console.error('Error creating calendar appointment:', error);
            throw error;
        }
    }

    /**
     * Check availability for given time slots
     * @param {Date} startDate - Start date to check
     * @param {Date} endDate - End date to check
     * @returns {Array} Available time slots
     */
    async checkAvailability(startDate, endDate) {
        if (!this.isInitialized) {
            throw new Error('Calendar integration not initialized');
        }

        try {
            let busyTimes = [];
            
            if (this.googleCalendarAPI) {
                busyTimes = await this.getGoogleBusyTimes(startDate, endDate);
            } else if (this.outlookCalendarAPI) {
                busyTimes = await this.getOutlookBusyTimes(startDate, endDate);
            }
            
            return this.calculateAvailableSlots(startDate, endDate, busyTimes);
            
        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        }
    }

    /**
     * Update existing appointment
     * @param {string} bookingId - Booking identifier
     * @param {Object} updateData - New booking data
     * @returns {Object} Updated event details
     */
    async updateAppointment(bookingId, updateData) {
        try {
            const eventId = await this.getEventIdFromBooking(bookingId);
            const eventData = this.formatEventData(updateData);
            
            let updatedEvent;
            
            if (this.googleCalendarAPI) {
                updatedEvent = await this.updateGoogleEvent(eventId, eventData);
            } else if (this.outlookCalendarAPI) {
                updatedEvent = await this.updateOutlookEvent(eventId, eventData);
            }
            
            console.log('Appointment updated in calendar:', updatedEvent.id);
            return updatedEvent;
            
        } catch (error) {
            console.error('Error updating calendar appointment:', error);
            throw error;
        }
    }

    /**
     * Cancel/delete appointment
     * @param {string} bookingId - Booking identifier
     * @returns {boolean} Success status
     */
    async cancelAppointment(bookingId) {
        try {
            const eventId = await this.getEventIdFromBooking(bookingId);
            
            if (this.googleCalendarAPI) {
                await this.deleteGoogleEvent(eventId);
            } else if (this.outlookCalendarAPI) {
                await this.deleteOutlookEvent(eventId);
            }
            
            // Remove event mapping
            await this.removeEventMapping(bookingId);
            
            console.log('Appointment cancelled in calendar:', eventId);
            return true;
            
        } catch (error) {
            console.error('Error cancelling calendar appointment:', error);
            throw error;
        }
    }

    /**
     * Set recurring availability pattern
     * @param {Object} availabilityPattern - Weekly/monthly availability
     * @returns {boolean} Success status
     */
    async setAvailabilityPattern(availabilityPattern) {
        try {
            // Create recurring "busy" events for unavailable times
            const blockingEvents = this.generateBlockingEvents(availabilityPattern);
            
            for (const event of blockingEvents) {
                if (this.googleCalendarAPI) {
                    await this.createGoogleEvent(event);
                } else if (this.outlookCalendarAPI) {
                    await this.createOutlookEvent(event);
                }
            }
            
            console.log('Availability pattern set successfully');
            return true;
            
        } catch (error) {
            console.error('Error setting availability pattern:', error);
            throw error;
        }
    }

    /**
     * Send calendar invites to clients
     * @param {Object} bookingData - Booking information
     * @param {string} clientEmail - Client's email address
     * @returns {boolean} Success status
     */
    async sendCalendarInvite(bookingData, clientEmail) {
        try {
            const eventData = this.formatEventData(bookingData);
            eventData.attendees = [
                { email: clientEmail, responseStatus: 'needsAction' },
                { email: 'hello@nicolinethijssen.nl', responseStatus: 'accepted' }
            ];
            eventData.sendUpdates = 'all';
            
            let inviteEvent;
            
            if (this.googleCalendarAPI) {
                inviteEvent = await this.createGoogleEvent(eventData);
            } else if (this.outlookCalendarAPI) {
                inviteEvent = await this.createOutlookEvent(eventData);
            }
            
            console.log('Calendar invite sent to:', clientEmail);
            return true;
            
        } catch (error) {
            console.error('Error sending calendar invite:', error);
            throw error;
        }
    }

    // Mock Google Calendar API methods (for demo purposes)
    async mockGoogleEventsList(params) {
        console.log('Mock Google Events List:', params);
        return {
            data: {
                items: [
                    {
                        id: 'mock-event-1',
                        summary: 'Existing Appointment',
                        start: { dateTime: new Date().toISOString() },
                        end: { dateTime: new Date(Date.now() + 90 * 60000).toISOString() }
                    }
                ]
            }
        };
    }

    async mockGoogleEventsInsert(params) {
        console.log('Mock Google Events Insert:', params);
        return {
            data: {
                id: 'mock-event-' + Date.now(),
                summary: params.resource.summary,
                start: params.resource.start,
                end: params.resource.end,
                status: 'confirmed'
            }
        };
    }

    async mockGoogleEventsUpdate(params) {
        console.log('Mock Google Events Update:', params);
        return {
            data: {
                id: params.eventId,
                summary: params.resource.summary,
                start: params.resource.start,
                end: params.resource.end,
                status: 'confirmed'
            }
        };
    }

    async mockGoogleEventsDelete(params) {
        console.log('Mock Google Events Delete:', params);
        return { data: {} };
    }

    async mockGoogleCalendarsGet(params) {
        console.log('Mock Google Calendars Get:', params);
        return {
            data: {
                id: 'primary',
                summary: 'Nicoline Thijssen',
                timeZone: 'Europe/Amsterdam'
            }
        };
    }

    // Mock Outlook Calendar API methods (for demo purposes)
    async mockOutlookEventsList(params) {
        console.log('Mock Outlook Events List:', params);
        return [
            {
                id: 'mock-outlook-event-1',
                subject: 'Existing Meeting',
                start: { dateTime: new Date().toISOString(), timeZone: 'Europe/Amsterdam' },
                end: { dateTime: new Date(Date.now() + 90 * 60000).toISOString(), timeZone: 'Europe/Amsterdam' }
            }
        ];
    }

    async mockOutlookEventsCreate(eventData) {
        console.log('Mock Outlook Events Create:', eventData);
        return {
            id: 'mock-outlook-event-' + Date.now(),
            subject: eventData.subject,
            start: eventData.start,
            end: eventData.end
        };
    }

    async mockOutlookEventsUpdate(eventId, eventData) {
        console.log('Mock Outlook Events Update:', eventId, eventData);
        return {
            id: eventId,
            subject: eventData.subject,
            start: eventData.start,
            end: eventData.end
        };
    }

    async mockOutlookEventsDelete(eventId) {
        console.log('Mock Outlook Events Delete:', eventId);
        return true;
    }

    // Helper methods
    formatEventData(bookingData) {
        const startTime = new Date(bookingData.date);
        startTime.setHours(parseInt(bookingData.time.split(':')[0]));
        startTime.setMinutes(parseInt(bookingData.time.split(':')[1]));
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 90); // 90-minute sessions
        
        return {
            summary: `Somatic Coaching Session - ${bookingData.customerName}`,
            description: `
                Client: ${bookingData.customerName}
                Email: ${bookingData.customerEmail}
                Phone: ${bookingData.customerPhone || 'Not provided'}
                Session Type: ${bookingData.sessionFormat}
                Package: ${bookingData.packageName}
                Goals: ${bookingData.primaryGoals || 'To be discussed'}
                
                Booking ID: ${bookingData.bookingId}
            `.trim(),
            start: {
                dateTime: startTime.toISOString(),
                timeZone: bookingData.timeZone || 'Europe/Amsterdam'
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: bookingData.timeZone || 'Europe/Amsterdam'
            },
            location: bookingData.sessionFormat === 'in-person' ? 'The Hague, Netherlands' : 'Online (Video Call)',
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 24 hours before
                    { method: 'popup', minutes: 60 }       // 1 hour before
                ]
            }
        };
    }

    async createGoogleEvent(eventData) {
        return await this.googleCalendarAPI.events.insert({
            calendarId: this.primaryCalendarId,
            resource: eventData,
            sendUpdates: 'all'
        });
    }

    async createOutlookEvent(eventData) {
        return await this.outlookCalendarAPI.events.create(eventData);
    }

    async updateGoogleEvent(eventId, eventData) {
        return await this.googleCalendarAPI.events.update({
            calendarId: this.primaryCalendarId,
            eventId: eventId,
            resource: eventData,
            sendUpdates: 'all'
        });
    }

    async updateOutlookEvent(eventId, eventData) {
        return await this.outlookCalendarAPI.events.update(eventId, eventData);
    }

    async deleteGoogleEvent(eventId) {
        return await this.googleCalendarAPI.events.delete({
            calendarId: this.primaryCalendarId,
            eventId: eventId,
            sendUpdates: 'all'
        });
    }

    async deleteOutlookEvent(eventId) {
        return await this.outlookCalendarAPI.events.delete(eventId);
    }

    async getGoogleBusyTimes(startDate, endDate) {
        const response = await this.googleCalendarAPI.events.list({
            calendarId: this.primaryCalendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });
        
        return response.data.items.map(event => ({
            start: new Date(event.start.dateTime || event.start.date),
            end: new Date(event.end.dateTime || event.end.date)
        }));
    }

    async getOutlookBusyTimes(startDate, endDate) {
        const events = await this.outlookCalendarAPI.events.list({
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString()
        });
        
        return events.map(event => ({
            start: new Date(event.start.dateTime),
            end: new Date(event.end.dateTime)
        }));
    }

    calculateAvailableSlots(startDate, endDate, busyTimes) {
        // Working hours: Tuesday-Saturday, 9 AM - 5 PM
        const workingDays = [2, 3, 4, 5, 6]; // Tuesday to Saturday
        const workingHours = [9, 10, 11, 14, 15, 16]; // 9-12, 14-17 (with lunch break)
        
        const availableSlots = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            
            if (workingDays.includes(dayOfWeek)) {
                workingHours.forEach(hour => {
                    const slotStart = new Date(d);
                    slotStart.setHours(hour, 0, 0, 0);
                    
                    const slotEnd = new Date(slotStart);
                    slotEnd.setMinutes(slotEnd.getMinutes() + 90);
                    
                    // Check if slot conflicts with busy times
                    const hasConflict = busyTimes.some(busyTime => 
                        (slotStart < busyTime.end && slotEnd > busyTime.start)
                    );
                    
                    if (!hasConflict) {
                        availableSlots.push({
                            start: slotStart,
                            end: slotEnd,
                            date: slotStart.toISOString().split('T')[0],
                            time: `${hour.toString().padStart(2, '0')}:00`
                        });
                    }
                });
            }
        }
        
        return availableSlots;
    }

    generateBlockingEvents(availabilityPattern) {
        // Generate blocking events based on availability pattern
        // This is a simplified example - in production, this would be more sophisticated
        const blockingEvents = [];
        
        // Block lunch hours (12 PM - 2 PM) every day
        const lunchBlocking = {
            summary: 'Lunch Break (Unavailable)',
            description: 'Blocked time for lunch break',
            start: { dateTime: '', timeZone: 'Europe/Amsterdam' },
            end: { dateTime: '', timeZone: 'Europe/Amsterdam' },
            recurrence: ['RRULE:FREQ=DAILY;BYDAY=TU,WE,TH,FR,SA'],
            transparency: 'opaque'
        };
        
        blockingEvents.push(lunchBlocking);
        return blockingEvents;
    }

    // Database operations (would be implemented with actual database)
    async storeEventMapping(bookingId, eventId) {
        // In production, store in database
        console.log(`Mapping stored: Booking ${bookingId} -> Event ${eventId}`);
    }

    async getEventIdFromBooking(bookingId) {
        // In production, query database
        console.log(`Getting event ID for booking: ${bookingId}`);
        return `mock-event-${bookingId}`;
    }

    async removeEventMapping(bookingId) {
        // In production, remove from database
        console.log(`Mapping removed for booking: ${bookingId}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarIntegration;
}

// Example usage and testing
if (typeof window === 'undefined') {
    // Server-side example
    const calendarIntegration = new CalendarIntegration();
    
    // Initialize with mock credentials
    calendarIntegration.initialize('google', { primaryCalendarId: 'primary' });
}