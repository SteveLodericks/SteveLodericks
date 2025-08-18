# Website Maintenance Guide
## Nicoline Thijssen Somatic Coaching Website

### Overview
This guide provides instructions for maintaining the alignment, components, and overall design system of the website.

## Design System Architecture

### CSS Architecture
The website follows **ITCSS (Inverted Triangle CSS)** methodology with BEM naming conventions:

1. **Settings** - CSS Custom Properties (design tokens)
2. **Generic** - Normalize/reset styles
3. **Elements** - Base HTML element styles
4. **Components** - Styled UI components
5. **Utilities** - Single-purpose classes

### Design Tokens (CSS Custom Properties)
All design tokens are centralized in `:root` and should be used consistently:

```css
/* Colors */
--color-sage-500: #7a8966;
--color-neutral-700: #404040;

/* Spacing */
--spacing-4: 1rem;
--spacing-8: 2rem;

/* Typography */
--font-size-xl: 1.25rem;
--line-height-relaxed: 1.625;
```

## Component Alignment Guidelines

### Service Cards
- Use `.services-grid` for responsive grid layout
- Cards automatically maintain equal heights with `height: 100%`
- Pricing uses `.price-container` for consistent alignment
- Features lists use `.features` with styled checkmarks

### Typography
- Responsive font sizes using mobile-first approach
- Consistent line heights and spacing
- Text colors follow hierarchy: primary, secondary, muted, accent

### Responsive Breakpoints
```css
/* Mobile First */
320px - 639px: Mobile
640px - 767px: Small tablet
768px - 1023px: Tablet
1024px+: Desktop
```

## Cross-Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### CSS Features with Fallbacks
- **Backdrop Filter**: Progressive enhancement with `@supports`
- **CSS Grid**: Fallbacks provided for older browsers
- **Custom Properties**: Modern browsers only (no IE11 support)

## Accessibility Features

### Built-in Accessibility
- Semantic HTML structure
- ARIA attributes where needed
- Focus management with `:focus-visible`
- Respect for `prefers-reduced-motion`
- High contrast mode support
- Keyboard navigation support

### Testing Accessibility
1. Use browser dev tools accessibility tab
2. Test keyboard navigation (Tab, Enter, Escape)
3. Check color contrast ratios (WCAG AA minimum)
4. Test with screen readers

## Performance Optimizations

### Implemented Optimizations
- Hardware acceleration for animations (`will-change`)
- CSS containment for layout performance
- Efficient CSS selectors with low specificity
- Minimal CSS custom properties usage
- Optimized animations and transitions

### Performance Monitoring
- Monitor Core Web Vitals
- Check CSS file size (current: ~2130 lines)
- Validate no unused CSS rules
- Test on slower devices

## Common Maintenance Tasks

### Adding New Components
1. Follow BEM naming convention: `.block__element--modifier`
2. Use design tokens from `:root`
3. Implement responsive behavior mobile-first
4. Add accessibility considerations
5. Document the component

### Updating Colors
1. Modify CSS custom properties in `:root`
2. Changes automatically propagate throughout the site
3. Test color contrast for accessibility
4. Update design documentation

### Responsive Issues
1. Test on all breakpoints: 320px, 768px, 1024px, 1440px
2. Use browser dev tools device simulation
3. Check component alignment at each breakpoint
4. Verify typography scales appropriately

### Animation Issues
1. Check `prefers-reduced-motion` compatibility
2. Ensure animations don't block user interactions
3. Use `transform` and `opacity` for performance
4. Limit animation duration to under 500ms

## Code Quality Standards

### CSS Best Practices
- Use semantic class names
- Avoid !important declarations
- Keep specificity low (max 3 levels)
- Comment complex CSS logic
- Use consistent indentation (2 spaces)

### File Organization
```
assets/css/styles-new.css - Main stylesheet
```

### Naming Conventions
- Components: `.service-card`, `.testimonial-card`
- Modifiers: `.card--featured`, `.btn--secondary`
- Utilities: `.text-center`, `.mb-4`
- States: `.is-active`, `.is-hidden`

## Testing Checklist

### Before Deploying Changes
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Verify responsive behavior on all breakpoints
- [ ] Check accessibility with keyboard navigation
- [ ] Validate HTML and CSS
- [ ] Test performance impact
- [ ] Verify print styles work correctly
- [ ] Check high contrast mode compatibility

### Visual Regression Testing
1. Take screenshots at key breakpoints
2. Compare before and after changes
3. Check alignment consistency
4. Verify typography hierarchy
5. Test interactive states (hover, focus, active)

## Emergency Fixes

### Quick Alignment Fixes
```css
/* Force equal heights */
.flex-container { display: flex; align-items: stretch; }

/* Center content */
.center { display: flex; justify-content: center; align-items: center; }

/* Responsive spacing fix */
.responsive-spacing { padding: clamp(1rem, 4vw, 2rem); }
```

### Common Issues and Solutions

**Issue**: Service cards different heights
**Solution**: Ensure `.services-grid` has `align-items: stretch`

**Issue**: Text not readable on mobile
**Solution**: Check responsive font sizes and line heights

**Issue**: Buttons not aligned
**Solution**: Use flexbox with `align-self: center` or `stretch`

## Contact for Support
For complex issues or major changes, consult with a senior frontend engineer familiar with modern CSS architecture and accessibility standards.

---
*Last updated: August 2025*
*Version: 1.0.0*