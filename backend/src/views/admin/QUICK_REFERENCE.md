# Admin Dashboard - Quick Reference Guide

## 📂 File Organization

### Main Entry Point
- **dashboard.ejs** - Includes all components (170 lines)

### Components (22 files)
```
partials/admin/
├── sidebar.ejs              # Navigation menu
├── header.ejs               # Top bar
├── tabs/ (8 files)          # Page content
├── modals/ (6 files)        # Popup dialogs
└── scripts/ (6 files)       # JavaScript functions
```

## 🎯 Quick Tasks

### Add a New Student
1. Click "Students" in sidebar
2. Click "+ Add New Student"
3. Fill form in modal
4. Click "Add Student"

### Edit Student
1. Find student in table
2. Click edit icon (pencil)
3. Modify form
4. Click "Update Student"

### Change Styling
- **Colors**: Edit Tailwind classes in specific partial
- **Layout**: Modify structure in partial file
- **Global styles**: Edit `<style>` in dashboard.ejs

### Add New Tab
1. Create `partials/admin/tabs/your-tab.ejs`
2. Add button in `sidebar.ejs`
3. Include in `dashboard.ejs`

## 🔍 Find What You Need

| Want to modify... | Edit this file... |
|------------------|-------------------|
| Menu items | `sidebar.ejs` |
| Search bar | `header.ejs` |
| Dashboard stats | `tabs/dashboard-overview.ejs` |
| Profile form | `tabs/profile.ejs` |
| Student table | `tabs/students.ejs` |
| Add student form | `modals/student-modal.ejs` |
| Data fetching | `scripts/data-loaders.ejs` |
| Form submission | `scripts/form-handlers.ejs` |
| Delete operations | `scripts/user-management.ejs` |
| Real-time updates | `scripts/socket-and-init.ejs` |

## 🔧 Common Code Patterns

### Alpine.js Tab Switching
```html
<button @click="activeTab = 'students'; loadStudents()">
    Students
</button>

<div x-show="activeTab === 'students'" x-cloak>
    <!-- Content -->
</div>
```

### Modal Trigger
```html
<button @click="showModal = true; modalType = 'addStudent'">
    Add Student
</button>
```

### API Call Pattern
```javascript
async function loadData() {
    const response = await fetch('/api/endpoint', {
        credentials: 'include'
    });
    const data = await response.json();
    // Process data
}
```

### Form Submission
```html
<form @submit.prevent="submitFunction">
    <!-- Fields -->
    <button type="submit">Submit</button>
</form>
```

## 🎨 Styling Quick Reference

### Tailwind Class Patterns
- **Card**: `glass-card rounded-xl shadow-md p-6`
- **Button**: `px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700`
- **Input**: `w-full px-4 py-2 border rounded-lg dark:bg-gray-700`
- **Table**: `min-w-full` + responsive wrapper

### Dark Mode
- Add `dark:` prefix: `bg-white dark:bg-gray-800`
- Toggle: Handled by `dark-mode.js`

## 🐛 Debug Checklist

- [ ] Check browser console for errors
- [ ] Verify API endpoint is correct
- [ ] Ensure Alpine.js is loaded
- [ ] Check `x-show` conditions
- [ ] Verify function is exported globally
- [ ] Check Socket.IO connection
- [ ] Test in both light/dark mode

## 📞 Need Help?

1. Check `README.md` for detailed documentation
2. Look at existing code for patterns
3. Test changes in browser DevTools
4. Check backend API responses

## ⚡ Pro Tips

- Use browser "Inspect Element" to find classes
- Alpine.js state in `__x.$data`
- Socket events logged to console
- Forms have built-in validation
- All tables auto-refresh on updates

---
**Quick Start**: Click sidebar → View tab → Click action → Fill form → Submit
