# 🌓 Dark Mode Quick Reference

## Toggle Button Location

### Login Page
```
┌─────────────────────────────────────┐
│                           [🌙]      │  ← Toggle button (top-right)
│                                     │
│           📚 ECMS Logo              │
│        Welcome Back                 │
│                                     │
│    ┌─────────────────────┐        │
│    │  Email Address       │        │
│    ├─────────────────────┤        │
│    │  Password            │        │
│    ├─────────────────────┤        │
│    │  [Sign In]           │        │
│    └─────────────────────┘        │
└─────────────────────────────────────┘
```

### Dashboard Pages
```
┌─────────────────────────────────────────────────┐
│ 📚 ECMS  Dashboard     [🌙] Welcome, User [Logout] │  ← Toggle in navbar
├─────────────────────────────────────────────────┤
│                                                 │
│  Welcome back, User!                           │
│                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │ Stat 1 │ │ Stat 2 │ │ Stat 3 │ │ Stat 4 │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
│                                                 │
│  Main Content Area                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Color Transformations

### Light Mode → Dark Mode

#### Backgrounds
```
bg-gray-50    →  dark:bg-gray-900   (Page background)
bg-white      →  dark:bg-gray-800   (Cards, containers)
bg-gray-100   →  dark:bg-gray-700   (Hover states)
```

#### Text
```
text-gray-900 →  dark:text-white       (Headings)
text-gray-700 →  dark:text-gray-300    (Nav items)
text-gray-600 →  dark:text-gray-400    (Body text)
text-gray-500 →  dark:text-gray-500    (Muted text)
```

#### Borders & Dividers
```
border-gray-200 →  dark:border-gray-700   (Cards, tables)
border-gray-300 →  dark:border-gray-600   (Inputs)
```

#### Links & Actions
```
text-blue-600     →  dark:text-blue-400        (Links)
hover:text-blue-800 →  dark:hover:text-blue-300  (Link hover)
text-red-600      →  dark:text-red-400         (Danger)
```

#### Special Components
```
bg-blue-100   →  dark:bg-blue-900/30    (Stat card icons)
bg-green-100  →  dark:bg-green-900/30   (Success indicators)
bg-yellow-100 →  dark:bg-yellow-900/30  (Warning indicators)
bg-red-50     →  dark:bg-red-900/30     (Error messages)
```

## Icon States

### Theme Toggle Icons

**Light Mode Active** (Click to enable Dark Mode):
```
☀️ Sun Icon
```

**Dark Mode Active** (Click to enable Light Mode):
```
🌙 Moon Icon
```

## What Each Page Looks Like

### Login Page - Light Mode
- Soft blue-indigo gradient background
- White login card
- Dark gray text
- Blue accent buttons

### Login Page - Dark Mode  
- Dark gray gradient background
- Dark gray-800 login card
- White/light gray text
- Blue accent buttons (slightly lighter)

### Dashboard - Light Mode
- Light gray background
- White cards with shadows
- Dark text on light backgrounds
- Colorful stat cards

### Dashboard - Dark Mode
- Dark gray-900 background
- Gray-800 cards
- White/light text
- Colorful stats with muted backgrounds

## Quick Test Checklist

To verify dark mode works:

1. **Load any page** → Should show default theme (light)
2. **Click toggle button** → Theme should change immediately
3. **Refresh page** → Theme should persist
4. **Navigate to another page** → Theme should stay the same
5. **Check all elements**:
   - [ ] Headers readable
   - [ ] Body text readable
   - [ ] Links visible and clickable
   - [ ] Forms functional
   - [ ] Buttons properly styled
   - [ ] Cards have proper contrast
   - [ ] Tables display correctly
   - [ ] No invisible elements

## Browser DevTools Test

Open browser console and check:

```javascript
// Check current theme
document.documentElement.classList.contains('dark')  // true = dark, false = light

// Check localStorage
localStorage.getItem('theme')  // Should be 'dark' or 'light'

// Manually toggle (for testing)
document.documentElement.classList.toggle('dark')
```

## Common Issues & Fixes

### Toggle not working
```javascript
// Check if button exists
document.getElementById('theme-toggle')  // Should not be null

// Check if script loaded
typeof updateIcon  // Should not be 'undefined'
```

### Theme not persisting
```javascript
// Check localStorage is working
localStorage.setItem('test', 'value')
localStorage.getItem('test')  // Should return 'value'
```

### Some elements not changing
- Make sure element has `dark:` variant class
- Check class spelling and syntax
- Verify Tailwind config has `darkMode: 'class'`

## Performance Notes

- ✅ **No performance impact** - Uses CSS classes only
- ✅ **Instant switching** - No page reload needed
- ✅ **Lightweight** - ~2KB total JavaScript
- ✅ **No dependencies** - Pure vanilla JS + Tailwind

## Accessibility

- ✅ **WCAG Compliant** - Proper contrast ratios in both modes
- ✅ **Keyboard Accessible** - Toggle button can be focused and activated via keyboard
- ✅ **Screen Reader Friendly** - Clear button labeling
- ✅ **Reduced Motion** - Transitions respect user preferences

---

**Need Help?** See [DARK_MODE_GUIDE.md](DARK_MODE_GUIDE.md) for full documentation.
