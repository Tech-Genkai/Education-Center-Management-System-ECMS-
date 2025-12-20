# Admin Dashboard - Modular Structure Documentation

## 📁 File Structure

The admin dashboard has been refactored from a single monolithic file into a well-organized modular structure for better maintainability and scalability.

```
backend/src/views/admin/
├── dashboard.ejs                    # Main entry point (clean, only includes)
├── dashboard-backup.ejs             # Original monolithic file (backup)
│
└── partials/admin/
    ├── sidebar.ejs                  # Sidebar navigation component
    ├── header.ejs                   # Top bar with search and logout
    │
    ├── tabs/                        # Tab content sections
    │   ├── dashboard-overview.ejs   # Dashboard home with stats
    │   ├── profile.ejs              # Admin profile management
    │   ├── students.ejs             # Student management table
    │   ├── teachers.ejs             # Teacher management table
    │   ├── admins.ejs               # Admin management table
    │   ├── classes.ejs              # Classes management
    │   ├── subjects.ejs             # Subjects management
    │   └── settings.ejs             # Settings page
    │
    ├── modals/                      # Modal dialogs
    │   ├── student-modal.ejs        # Add/Edit student form
    │   ├── teacher-modal.ejs        # Add/Edit teacher form
    │   ├── admin-modal.ejs          # Add/Edit admin form
    │   ├── class-modal.ejs          # Add class form
    │   ├── subject-modal.ejs        # Add subject form
    │   └── password-reset-modal.ejs # Password reset dialog
    │
    └── scripts/                     # JavaScript functionality
        ├── head-scripts.ejs         # Alpine.js config & initial functions
        ├── data-loaders.ejs         # Data fetching functions
        ├── form-handlers.ejs        # Form submission & CRUD operations
        ├── profile-handlers.ejs     # Profile update & picture upload
        ├── user-management.ejs      # User actions (delete, toggle, reset)
        └── socket-and-init.ejs      # Socket.IO & initialization
```

## 📄 Component Descriptions

### Core Components

#### **dashboard.ejs** (Main File)
- **Purpose**: Main entry point that orchestrates all components
- **Size**: ~170 lines (down from 2300+ lines)
- **Contains**: HTML structure and EJS includes only
- **Benefits**: Easy to understand the overall structure at a glance

#### **sidebar.ejs**
- **Purpose**: Left navigation menu
- **Features**:
  - Tab navigation (Dashboard, Profile, Students, Teachers, etc.)
  - User profile display
  - Theme toggle button
  - Collapsible sidebar
- **Dependencies**: Uses Alpine.js for interactivity

#### **header.ejs**
- **Purpose**: Top navigation bar
- **Features**:
  - Global search bar
  - Notifications button
  - Logout button
- **Styling**: Sticky header with glass morphism effect

### Tab Components

Each tab component represents a different section of the dashboard:

#### **dashboard-overview.ejs**
- **Contains**:
  - Welcome banner with user info
  - Statistics cards (Students, Teachers, Classes)
  - Enrollment chart (Chart.js)
  - Recent activity feed
- **Data**: Uses server-side variables passed from controller

#### **profile.ejs**
- **Contains**:
  - Profile picture upload with preview
  - Personal information form
  - Quick info sidebar
- **Functionality**:
  - Image validation (type & size)
  - Form submission via AJAX
  - Real-time preview

#### **students.ejs / teachers.ejs / admins.ejs**
- **Contains**:
  - Data table with search
  - Action buttons (Add, Edit, Delete, Toggle Status, Reset Password)
  - Status indicators
- **Data Loading**: Uses `loadStudents()`, `loadTeachers()`, `loadAdmins()`
- **Real-time**: Socket.IO updates when data changes

#### **classes.ejs**
- **Contains**:
  - Classes table
  - Subjects table
  - Add buttons for both
- **Features**: Integrated view for academic structure

#### **subjects.ejs**
- **Contains**: Standalone subjects management
- **Note**: Can be merged with classes tab if preferred

#### **settings.ejs**
- **Contains**: Placeholder for system settings
- **Status**: Ready for future implementation

### Modal Components

All modals follow a consistent pattern:

#### **student-modal.ejs / teacher-modal.ejs / admin-modal.ejs**
- **Purpose**: Add and edit forms for users
- **Features**:
  - Modal overlay with backdrop
  - Form validation
  - Dual mode (Add/Edit) using Alpine.js
  - Hidden ID field for edit mode
- **Submission**: Handled by form-handlers.ejs

#### **class-modal.ejs / subject-modal.ejs**
- **Purpose**: Add academic entities
- **Features**:
  - Simplified forms
  - Dropdown selections
  - Validation

#### **password-reset-modal.ejs**
- **Purpose**: Password management for users
- **Features**:
  - Two options: Manual reset or OTP email
  - Displays user info
  - Confirmation dialogs

### Script Components

JavaScript is organized by functionality:

#### **head-scripts.ejs**
- **Loaded**: In `<head>` before Alpine.js
- **Contains**:
  - Alpine.js dashboard component configuration
  - Initial data loading functions
  - Profile picture handling functions
  - Global state initialization
- **Critical**: Must load before Alpine.js initializes

#### **data-loaders.ejs**
- **Purpose**: Fetch and display data from API
- **Functions**:
  - `loadStudents()`: Fetches and renders student table
  - `loadTeachers()`: Fetches and renders teacher table
  - `loadAdmins()`: Fetches and renders admin table
  - `loadClasses()`: Fetches and renders classes
  - `loadSubjects()`: Fetches and renders subjects
- **Features**: Error handling, loading states, empty states

#### **form-handlers.ejs**
- **Purpose**: Handle form submissions and CRUD operations
- **Functions**:
  - `submitStudentForm()`, `submitTeacherForm()`, etc.
  - `editStudent()`, `editTeacher()`, `editAdmin()`
  - `updateStudent()`, `updateTeacher()`, `updateAdmin()`
- **Features**: Form validation, success/error alerts, table refresh

#### **profile-handlers.ejs**
- **Purpose**: Profile-specific functionality
- **Functions**:
  - Profile form submission
  - Profile picture upload validation
- **Features**: 
  - AJAX submission
  - Image validation (2MB limit, JPG/PNG/WEBP)
  - Success notifications

#### **user-management.ejs**
- **Purpose**: User action handlers
- **Functions**:
  - `toggleStatus()`: Activate/deactivate users
  - `deleteStudent/Teacher/Admin()`: Delete operations
  - `resetPassword()`: Password reset workflow
  - `manualPasswordReset()`, `sendResetOTPEmail()`
- **Features**: Confirmation dialogs, permission checks

#### **socket-and-init.ejs**
- **Purpose**: Real-time updates and initialization
- **Contains**:
  - Socket.IO connection setup
  - Event listeners for create/update/delete
  - DOMContentLoaded initialization
  - Global function exports
- **Features**: Automatic table refresh on data changes

## 🔄 How It Works

### Page Load Flow

1. **HTML Structure Loads**
   ```
   dashboard.ejs → includes sidebar & header → includes all tabs
   ```

2. **Head Scripts Execute**
   ```
   head-scripts.ejs → Defines Alpine.js component & global functions
   ```

3. **Alpine.js Initializes**
   ```
   Alpine.js mounts → dashboard() component active → tabs become reactive
   ```

4. **Socket.IO Connects**
   ```
   socket-and-init.ejs → Establishes WebSocket connection
   ```

5. **User Interaction**
   ```
   Tab click → Alpine.js switches view → data-loaders.ejs fetches data
   ```

### Data Flow

```
User Action → Alpine.js Event → JavaScript Function → API Call → Response → Update UI → Socket.IO Broadcast → Other Clients Update
```

### Example: Adding a Student

1. User clicks "Add Student" button
2. Alpine.js sets `showModal = true`, `modalType = 'addStudent'`
3. student-modal.ejs becomes visible
4. User fills form and submits
5. `submitStudentForm()` in form-handlers.ejs handles submission
6. AJAX POST to `/api/students`
7. On success: Close modal, show alert, call `loadStudents()`
8. Socket.IO emits `student:created` event
9. All connected clients receive update and refresh their tables

## 🎨 Styling & UI

### CSS Framework
- **Tailwind CSS**: Utility-first CSS via CDN
- **Dark Mode**: Fully supported with `dark:` classes
- **Custom Styles**: In `<style>` tag and shared-styles.css

### Components
- **Glass Morphism**: Cards with blur and transparency
- **Animations**: Smooth transitions for tabs and modals
- **Responsive**: Mobile-first design with breakpoints
- **Icons**: SVG icons inline

### Color Scheme
- **Light Mode**: Stone/amber palette
- **Dark Mode**: Gray palette with amber accents
- **Status Colors**: Green (active), Red (inactive), Blue (info)

## 🔧 Customization Guide

### Adding a New Tab

1. **Create tab file**: `partials/admin/tabs/your-tab.ejs`
2. **Add sidebar button**: In `sidebar.ejs`
   ```html
   <button @click="activeTab = 'your-tab'; loadYourData()">
       <!-- Icon and text -->
   </button>
   ```
3. **Add tab container**: In `dashboard.ejs`
   ```html
   <div x-show="activeTab === 'your-tab'" x-cloak>
       <%- include('../partials/admin/tabs/your-tab') %>
   </div>
   ```
4. **Add data loader**: In `data-loaders.ejs` or create new script

### Adding a New Modal

1. **Create modal file**: `partials/admin/modals/your-modal.ejs`
2. **Include in dashboard**: Add to modals section in `dashboard.ejs`
3. **Add trigger**: In appropriate tab, add button with `@click="showModal = true; modalType = 'yourModal'"`
4. **Add handler**: In `form-handlers.ejs`

### Modifying Existing Components

- **Styling Changes**: Edit the specific partial file
- **Functionality Changes**: Edit the corresponding script file
- **API Endpoints**: Update fetch URLs in data-loaders or form-handlers

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Alpine is not defined" error
- **Solution**: Ensure head-scripts.ejs loads before Alpine.js CDN

**Issue**: Functions not found (e.g., loadStudents)
- **Solution**: Check that head-scripts.ejs defines the function as `window.functionName`

**Issue**: Modal not showing
- **Solution**: Verify Alpine.js `x-show` conditions and `showModal` state

**Issue**: Form not submitting
- **Solution**: Check `@submit.prevent` directive and handler function name

**Issue**: Real-time updates not working
- **Solution**: Verify Socket.IO connection in browser console

### Debug Tips

1. **Console Logging**: Check browser console for errors
2. **Network Tab**: Monitor API calls and responses
3. **Alpine DevTools**: Install Alpine.js DevTools extension
4. **Socket Events**: Log socket events to verify connection

## 🚀 Performance Benefits

### Before Refactoring
- ❌ Single 2300+ line file
- ❌ Difficult to maintain
- ❌ Hard to find specific code
- ❌ Merge conflicts likely
- ❌ Slower IDE performance

### After Refactoring
- ✅ Organized into 20+ smaller files
- ✅ Easy to maintain and update
- ✅ Clear separation of concerns
- ✅ Team-friendly (parallel development)
- ✅ Faster IDE loading and search
- ✅ Reusable components
- ✅ Better code readability

## 📝 Maintenance Guidelines

### When to Edit Each File

| Task | File to Edit |
|------|-------------|
| Add menu item | `sidebar.ejs` |
| Change header layout | `header.ejs` |
| Modify dashboard stats | `tabs/dashboard-overview.ejs` |
| Update profile form | `tabs/profile.ejs` |
| Change table columns | `tabs/students.ejs` (or teachers/admins) |
| Add form field | `modals/student-modal.ejs` (or others) |
| Modify API call | `scripts/data-loaders.ejs` or `form-handlers.ejs` |
| Add user action | `scripts/user-management.ejs` |
| Change Socket events | `scripts/socket-and-init.ejs` |

### Best Practices

1. **Keep partials focused**: Each file should have a single responsibility
2. **Comment your changes**: Add comments explaining non-obvious logic
3. **Test after changes**: Always test in browser after editing
4. **Maintain consistency**: Follow existing patterns and naming
5. **Update documentation**: Keep this README up to date

## 🔐 Security Notes

- All API calls use `credentials: 'include'` for session auth
- CSRF protection handled by backend
- Input validation on both client and server
- XSS protection via EJS escaping
- File upload validation (type & size)

## 📚 Related Files

- **Backend Routes**: `backend/src/routes/views.ts`
- **API Routes**: `backend/src/routes/*.ts`
- **Models**: `backend/src/models/*.ts`
- **Middleware**: `backend/src/middleware/auth.ts`

## 🎓 Learning Resources

- **Alpine.js**: https://alpinejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Chart.js**: https://www.chartjs.org/
- **Socket.IO**: https://socket.io/
- **EJS**: https://ejs.co/

---

**Last Updated**: December 20, 2025  
**Maintained By**: ECMS Development Team  
**Version**: 2.0.0 (Modular)
