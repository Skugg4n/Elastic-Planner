# Changelog

All notable changes to Elastic Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
