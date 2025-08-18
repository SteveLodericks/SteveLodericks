# Images Directory Structure

This directory contains all image assets for the website, organized by purpose and usage.

## Directory Structure

```
images/
├── hero/          # Hero section background images
├── gallery/       # Gallery and portfolio images
├── icons/         # Icon and symbol images
└── thumbnails/    # Thumbnail versions of larger images
```

## Image Naming Convention

- Use lowercase letters and hyphens
- Include purpose in filename: `hero-nicoline-portrait.jpg`
- Include size variant if multiple: `service-card-large.jpg`, `service-card-thumb.jpg`
- Use descriptive names: `testimonial-sarah-m.jpg`

## Supported Formats

- **Primary**: `.jpg` for photographs, `.png` for graphics with transparency
- **Modern**: `.webp` for better compression (with fallbacks)
- **Vector**: `.svg` for icons and simple graphics

## Image Optimization Guidelines

1. **Hero Images**: Max 1920px width, 80% quality JPEG
2. **Gallery Images**: Max 1200px width, 85% quality JPEG  
3. **Thumbnails**: Max 400px width, 75% quality JPEG
4. **Icons**: Use SVG when possible, PNG for complex icons

## Lazy Loading Implementation

All images should use the `lazy-image` class for optimal performance:

```html
<img src="placeholder.jpg" 
     data-src="assets/images/hero/actual-image.jpg"
     class="lazy-image"
     alt="Descriptive alt text">
```

## Responsive Images

Use srcset for different screen sizes:

```html
<img src="assets/images/hero/image-mobile.jpg"
     srcset="assets/images/hero/image-mobile.jpg 768w,
             assets/images/hero/image-tablet.jpg 1024w,
             assets/images/hero/image-desktop.jpg 1920w"
     sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1920px"
     class="lazy-image responsive-image"
     alt="Descriptive alt text">
```