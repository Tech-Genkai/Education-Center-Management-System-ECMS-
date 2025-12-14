# Dark Mode Implementation Guide

## Overview
Dark mode has been successfully implemented across all pages in the ECMS application. Users can toggle between light and dark themes, and their preference is automatically saved and persisted across all pages.

## Features

### ✨ Key Features
- **Seamless Toggle**: Click the sun/moon icon to switch themes instantly
- **Persistent Preference**: Your choice is saved in browser's localStorage
- **Smooth Transitions**: All color changes have smooth 300ms transitions
- **Cross-Page Sync**: Theme preference applies across all pages automatically
- **No Flash**: Theme is applied before page renders (no white flash on dark mode)

### 📄 Pages with Dark Mode Support
✅ Login Page
✅ Student Dashboard  
✅ Teacher Dashboard
✅ Admin Dashboard
✅ Error Pages (401, 403, 404, 500, generic error)

## User Guide

### How to Toggle Dark Mode

1. **Look for the Theme Toggle Button**
   - Located in the top-right corner of every page
   - Login page: Top-right of the screen
   - Dashboards: In the navigation bar (next to your name)

2. **Click the Toggle Button**
   - ☀️ Sun icon = Light mode active → Click to switch to dark
   - 🌙 Moon icon = Dark mode active → Click to switch to light

3. **Your Preference is Automatically Saved**
   - No need to change the setting on every page
   - Works across browser sessions
   - Persists even after logout

### Tips
- Try both modes to see which you prefer
- Dark mode is easier on the eyes in low-light environments
- Light mode provides better visibility in bright conditions

## Technical Implementation

### Architecture

#### 1. Dark Mode Script (`/js/dark-mode.js`)
```javascript
// Features:
- Checks localStorage for saved theme preference
- Applies theme immediately (prevents flash)
- Updates toggle icon based on current theme
- Saves preference when user toggles
```

#### 2. Tailwind Configuration
```html
<script>
    tailwind.config = {
        darkMode: 'class'
    }
</script>
```

#### 3. Dark Mode Classes
All UI elements use Tailwind's `dark:` variant:
```html
<!-- Example -->
<div class="bg-white dark:bg-gray-800">
    <h1 class="text-gray-900 dark:text-white">Title</h1>
    <p class="text-gray-600 dark:text-gray-400">Text</p>
</div>
```

### Color Scheme

#### Light Mode
- Background: `bg-gray-50`, `bg-white`
- Primary text: `text-gray-900`
- Secondary text: `text-gray-600`
- Borders: `border-gray-200`

#### Dark Mode  
- Background: `dark:bg-gray-900`, `dark:bg-gray-800`
- Primary text: `dark:text-white`
- Secondary text: `dark:text-gray-400`
- Borders: `dark:border-gray-700`

### Components with Dark Mode

#### Navigation Bars
- Background: `bg-white dark:bg-gray-800`
- Border: `border-gray-200 dark:border-gray-700`
- Text: `text-gray-900 dark:text-white`

#### Cards & Containers
- Background: `bg-white dark:bg-gray-800`
- Shadow remains consistent
- Border: `border-gray-200 dark:border-gray-700`

#### Form Inputs
- Background: `bg-white dark:bg-gray-700`
- Border: `border-gray-300 dark:border-gray-600`
- Text: `text-gray-900 dark:text-white`
- Placeholder: `placeholder-gray-400 dark:placeholder-gray-500`

#### Buttons & Links
- Primary links: `text-blue-600 dark:text-blue-400`
- Hover states: `hover:text-blue-800 dark:hover:text-blue-300`
- Danger buttons: `text-red-600 dark:text-red-400`

#### Stat Cards
- Icon backgrounds: `bg-blue-100 dark:bg-blue-900/30`
- Supports all color variants (blue, green, yellow, purple, etc.)

#### Tables
- Header: `border-gray-200 dark:border-gray-700`
- Rows: `hover:bg-gray-50 dark:hover:bg-gray-700`
- Text: `text-gray-900 dark:text-white`

#### Special Elements
- Gradients adjusted for dark mode
- Colored info boxes have dark variants
- Badges and tags maintain color identity in both modes

## Development Guide

### Adding Dark Mode to New Pages

1. **Include Required Scripts in `<head>`**
```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        darkMode: 'class'
    }
</script>
<script src="/js/dark-mode.js"></script>
```

2. **Update Body Tag**
```html
<body class="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
```

3. **Add Theme Toggle Button**
```html
<!-- For dashboards (in nav bar) -->
<button id="theme-toggle" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300">
    <svg id="theme-icon" class="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <!-- Icon will be updated by JavaScript -->
    </svg>
</button>

<!-- For standalone pages (absolute positioned) -->
<button id="theme-toggle" class="absolute top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
    <svg id="theme-icon" class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <!-- Icon will be updated by JavaScript -->
    </svg>
</button>
```

4. **Apply Dark Mode Classes**

Use this pattern for all UI elements:
```html
<!-- Containers -->
<div class="bg-white dark:bg-gray-800">

<!-- Text -->
<h1 class="text-gray-900 dark:text-white">
<p class="text-gray-600 dark:text-gray-400">

<!-- Borders -->
<div class="border-gray-200 dark:border-gray-700">

<!-- Links -->
<a class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">

<!-- Inputs -->
<input class="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">

<!-- Hover states -->
<div class="hover:bg-gray-50 dark:hover:bg-gray-700">
```

### Best Practices

1. **Always Add Transitions**
   - Add `transition-colors duration-300` to elements that change color
   - Makes theme switching smooth and pleasant

2. **Test Both Themes**
   - Check every page in both light and dark mode
   - Ensure all text is readable
   - Verify icons and images look good

3. **Maintain Contrast**
   - Dark mode: Use lighter text on dark backgrounds
   - Light mode: Use darker text on light backgrounds
   - Test with accessibility tools

4. **Consistent Color Patterns**
   - Use established color classes
   - Don't create custom colors that break the pattern
   - Follow the color scheme table above

5. **Icon Backgrounds**
   - Use `bg-{color}-100` in light mode
   - Use `dark:bg-{color}-900/30` in dark mode (30% opacity)

## Browser Support

Dark mode works in all modern browsers:
- ✅ Chrome/Edge (v88+)
- ✅ Firefox (v78+)  
- ✅ Safari (v14+)
- ✅ Opera (v74+)

### localStorage Requirement
Dark mode preference requires localStorage support. All modern browsers support this.

## Troubleshooting

### Theme Not Persisting
**Problem**: Theme resets to light mode on page refresh
**Solution**: Check browser's localStorage settings. Ensure it's not disabled or being cleared.

### Flash of Light Theme
**Problem**: Brief white flash when loading dark mode
**Solution**: This is already fixed. The script applies the theme before page renders.

### Toggle Button Not Working
**Problem**: Clicking the toggle doesn't change theme
**Solution**: 
1. Check that `/js/dark-mode.js` is loading correctly
2. Open browser console and check for JavaScript errors
3. Verify the button has `id="theme-toggle"`

### Some Elements Not Changing Color
**Problem**: Some UI elements stay the same color in dark mode
**Solution**: Add the appropriate `dark:` class variants to those elements.

## Future Enhancements

Potential improvements for the future:
- 🌗 System theme detection (auto-match OS preference)
- 🎨 Multiple theme options (not just light/dark)
- ⚙️ Theme settings page with more customization
- 📱 Better mobile theme toggle placement
- 🔔 Animated theme transitions

## Files Modified

### Core Dark Mode Files
- `/backend/public/js/dark-mode.js` - Main dark mode script

### View Templates
- `/backend/src/views/login.ejs`
- `/backend/src/views/student/dashboard.ejs`
- `/backend/src/views/teacher/dashboard.ejs`
- `/backend/src/views/admin/dashboard.ejs`
- `/backend/src/views/errors/401.ejs`
- `/backend/src/views/errors/403.ejs`
- `/backend/src/views/errors/404.ejs`
- `/backend/src/views/errors/500.ejs`
- `/backend/src/views/errors/error.ejs`

## Testing Checklist

When testing dark mode:

- [ ] Toggle button appears on all pages
- [ ] Icon changes between sun and moon
- [ ] Theme changes immediately when toggled
- [ ] Theme persists after page refresh
- [ ] Theme persists across different pages
- [ ] All text is readable in both modes
- [ ] No elements are invisible in either mode
- [ ] Forms and inputs work correctly
- [ ] Tables display properly
- [ ] Cards and containers look good
- [ ] Links are visible and clickable
- [ ] Buttons have proper contrast
- [ ] Smooth transitions between themes
- [ ] No console errors

---

**Implementation Date**: December 2025  
**Version**: 1.0  
**Status**: ✅ Complete and Production Ready
