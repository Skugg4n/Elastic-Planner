# Changelog

All notable changes to Elastic Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2026-01-05 19:47 UTC

### Fixed
- **ROLLBACK**: Reverted to v1.6.0 due to critical issues with v1.7.0/v1.7.1
- Removed editable categories feature (caused blank page errors)
- Removed report sidebar redesign (deployment issues)
- App now stable and functional again

### Technical
- **Why**: v1.7.0 introduced breaking changes that caused blank white pages in production
- **Solution**: Complete rollback to last known stable version (v1.6.0)
- **Impact**: All v1.6.0 features working correctly, v1.7.x features postponed for proper testing

## [1.6.0] - 2026-01-03

### Added
- Comprehensive reporting dashboard with category-based activity logging
- Time-based activity filtering (today, this week, this month, all time)
- Project-based activity grouping with detailed breakdowns
- Export functionality for activity reports
- Activity statistics: total hours, activity count, project count
- Category-specific filtering in reports

### Technical
- **Why**: Need to track and analyze time spent across projects and categories
- **Solution**: Built comprehensive reporting system with flexible filters
- **Impact**: Users can now analyze productivity patterns and time allocation

## [1.0.3] - 2026-01-03 07:45 UTC

### Added
- Lagt till en lättvikts favicon (SVG) och `theme-color` för bättre upplevelse utan binära filer

### Fixed
- Undviker binära tillgångar i deploy genom att använda textbaserad ikon

## [1.0.2] - 2026-01-02 22:07 UTC

### Added
- React/Vite + Tailwind byggpipeline så appen körs och matchar designen ur kartong
- Versionsmärke i UI och återanvänd `APP_VERSION` för både visning och exportfilnamn
- Lokalt lagrad planering (veckodata och vald vecka) för att undvika dataförlust vid omladdning
- Uppdaterad README med installations- och körinstruktioner

### Fixed
- Kalendern renderas nu med full styling (tidsaxel, färgkodade block, bank och loggmeny) i linje med referensskärmen

## [1.0.1] - 2026-01-02

### Fixed
- **Critical bug fix**: Fixed blank screen issue caused by incorrect Lucide icons library
  - Changed from vanilla `lucide@latest` to `lucide-react@latest/dist/umd/lucide-react.js`
  - Updated icon imports from `lucide` to `LucideReact`
  - Removed unnecessary `lucide.createIcons()` call that was for vanilla JS only
  - **Impact**: Application now loads properly instead of showing blank screen with React errors

### Added
- Version numbering system with `APP_VERSION` constant
- Version display in the UI header (shows "v1.0.1")
- This CHANGELOG.md file to track all changes and fixes

### Technical Details
**Problem**: The app was loading the vanilla Lucide icon library but trying to use it as React components, causing a "Minified React error #185" and blank screen.

**Solution**: Switched to the proper React-compatible Lucide library (lucide-react) which provides actual React components instead of vanilla JS icon elements.

---

## [1.0.0] - 2026-01-01

### Added
- Initial release of Elastic Planner
- Week-based calendar view with drag-and-drop functionality
- Block scheduling with categories: Bok (Creative), Jobb (Job), Fys (Training), Livet (Life), Inbox (Todo)
- Status tracking (planned, done, inactive)
- Duration resize functionality
- Block splitting capability
- Daily activity logs with "Pepp" celebration for active days
- Inbox/Todo management with drag-to-schedule
- Bank (storage) for unscheduled blocks
- Local storage persistence
- Export/Import functionality for backup
- Week navigation
- Progress tracking for Book and Job hours
- Quick-add presets for common activities
- Notes/descriptions for blocks
- Collision detection and auto-resolution
- Bulk operations (mark as done, delete multiple blocks)
- Responsive grid layout with time slots (7:00-24:00)
- Swedish language interface

### Features
- **Time Management**: Visual weekly planner with hourly slots
- **Flexible Scheduling**: Drag and drop blocks between days and storage
- **Activity Logging**: Track micro-activities throughout the day
- **Smart Collisions**: Automatic time slot conflict resolution
- **Data Persistence**: Auto-save to browser local storage
- **Multi-select**: Shift-click to select multiple blocks for batch operations
- **Visual Feedback**: Color-coded categories, completion states, and daily achievements
