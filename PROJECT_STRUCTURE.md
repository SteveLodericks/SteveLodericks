# Project Structure

This project follows modern web development best practices with organized directory structure.

## Directory Structure

```
/
├── index.html                  # Main homepage
├── pages/                      # HTML pages
│   ├── about.html
│   ├── admin-calendar.html
│   ├── admin-dashboard.html
│   ├── booking.html
│   ├── payment.html
│   ├── payment-success.html
│   └── payment-failed.html
├── assets/                     # Static assets
│   ├── css/                    # Stylesheets
│   │   ├── styles-new.css      # Main stylesheet (Tailwind-inspired)
│   │   ├── styles.css          # Legacy stylesheet
│   │   ├── styles-tailwind.css # Tailwind base file
│   │   └── tailwind.config.js  # Tailwind configuration
│   ├── js/                     # JavaScript files
│   │   ├── script.js           # Main application scripts
│   │   ├── security-utils.js   # Security utilities
│   │   ├── performance-utils.js # Performance utilities
│   │   ├── payment.js          # Payment processing
│   │   ├── booking.js          # Booking system
│   │   ├── admin-calendar.js   # Calendar management
│   │   ├── admin-dashboard.js  # Admin dashboard
│   │   ├── calendar-integration.js # Calendar integrations
│   │   ├── payment-config.js   # Payment configuration
│   │   └── webhook-handler.js  # Webhook handling
│   ├── images/                 # Image assets (organized by type)
│   │   ├── hero/              # Hero section images
│   │   ├── gallery/           # Gallery images
│   │   ├── icons/             # Icon images
│   │   └── thumbnails/        # Thumbnail images
│   └── fonts/                 # Font files (if any local fonts)
├── src/                       # Source code (for future organization)
│   ├── components/            # Reusable components
│   ├── pages/                 # Page-specific logic
│   └── utils/                 # Utility functions
├── documentation/             # Project documentation
├── package.json              # Node.js dependencies
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # Project overview
```

## File Path References

### From root (index.html):
- CSS: `assets/css/styles-new.css`
- JS: `assets/js/script.js`
- Pages: `pages/payment.html`
- Images: `assets/images/hero/image.jpg`

### From pages directory:
- CSS: `../assets/css/styles-new.css`
- JS: `../assets/js/script.js`
- Home: `../index.html`
- Images: `../assets/images/gallery/image.jpg`

## Benefits of This Structure

1. **Clear Separation of Concerns**: Assets, pages, and source code are logically separated
2. **Scalable**: Easy to add new components and maintain as the project grows
3. **Standard Practice**: Follows industry best practices for web development
4. **Asset Organization**: Images are categorized by usage type for better management
5. **Maintainable**: Clear naming conventions and logical hierarchy

## Notes

- All CSS files use the new Tailwind-inspired design system
- JavaScript modules are organized by functionality
- Image directories are ready for asset optimization
- The structure supports future build processes and bundling