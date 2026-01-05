# Changelog

All notable changes to Elastic Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.1] - 2026-01-05 14:29 UTC

### Fixed
- **CRITICAL**: Fixed blank white page error caused by missing category references
  - Replaced remaining `CATEGORIES` constant references with `categories` state variable
  - Fixed 4 instances in micro-menu and settings modal that were missed in v1.7.0
  - App now loads correctly after merge to main

### Technical
- **Why**: After merging v1.7.0, the app showed blank white page with "ReferenceError: categories is not defined"
- **Solution**: Found and replaced all remaining `Object.values(CATEGORIES)` with `Object.values(categories)`
- **Root cause**: Incomplete migration from constant to state variable in v1.7.0
- **Impact**: App is now functional again, critical bug fix for production use

## [1.7.0] - 2026-01-05 14:19 UTC

### Added
- Editable categories in settings modal with visual color indicators
- Categories now persist in localStorage for customization across sessions
- Category editor allows real-time label editing while preserving category IDs and styling

### Changed
- **MAJOR REDESIGN**: Report sidebar completely redesigned with modern dark theme
  - Color scheme changed from blue/white to dark zinc-900 background with white/grey text
  - More compact layout (420px width vs previous 480px)
  - Large stat cards with prominent numbers for better data visibility
  - Inline grid filters for better space usage
  - Simplified project list with cleaner typography and improved hierarchy
  - Export button updated to white/black contrast
- Categories moved from constant to stateful variable with localStorage persistence

### Technical
- **Why**: User feedback indicated old report sidebar looked "ugly and 2010-Microsoft-like" and uninspiring
- **Solution**: Complete visual overhaul with modern dark theme matching rest of application
- **Problem solved**: Categories can now be customized per user preference without code changes
- **Impact**: Better user experience with modern, clean design and personalization options

## [1.6.0] - 2026-01-03

### Added
- Comprehensive reporting dashboard with category-based activity logging
- Time-based activity filtering (today, this week, this month, all time)
- Project-based activity grouping with detailed breakdowns
- Export functionality for activity reports
- Activity statistics: total hours, activity count, project count
- Category-specific filtering in reports

### Features
- Sidebar report view with real-time data visualization
- Per-project hour tracking and activity count
- Category-aware activity logging system
- CSV export for external analysis

### Technical
- **Why**: Need to track and analyze time spent across projects and categories
- **Solution**: Built comprehensive reporting system with flexible filters
- **Impact**: Users can now analyze productivity patterns and time allocation

## [1.5.0] - 2026-01-03

### Added
- Project tracking system with automatic project history
- Project name autocomplete from historical data
- Project-specific activity aggregation
- localStorage persistence for project history

### Changed
- Enhanced activity logging to include project names
- Project dropdown in activity log entry form
- Projects stored and retrieved from `elastic-planner-project-history` key

### Technical
- **Why**: Users needed way to organize activities by projects for better tracking
- **Solution**: Added project field to activities with autocomplete from history
- **Impact**: Better organization and reporting of time spent per project

## [1.4.0] - 2026-01-03

### Added
- Date display showing current date in Swedish format
- "Idag" (Today) button to quickly jump to current week
- Automatic navigation to current week on button click

### Changed
- Header now displays formatted date (e.g., "3 jan 2026")
- Improved navigation with quick-access button

### Technical
- **Why**: Users needed easy way to navigate back to current week
- **Solution**: Added visible date display and quick navigation button
- **Impact**: Improved user orientation and navigation efficiency

## [1.3.0] - 2026-01-03

### Added
- Activity log sidebar replacing previous modal interface
- Persistent sidebar on right side of screen
- Better visibility of logged activities

### Changed
- Moved activity log from modal to dedicated sidebar
- Improved layout for better workflow integration

### Technical
- **Why**: Modal was disruptive to workflow when logging activities
- **Solution**: Replaced modal with persistent sidebar for better UX
- **Impact**: Smoother activity logging experience

## [1.2.0] - 2026-01-03

### Added
- Time editing capability for scheduled blocks
- Week statistics showing total hours per category
- Enhanced statistics display

### Features
- Click-to-edit time for blocks
- Real-time statistics calculation
- Category-based hour aggregation

### Technical
- **Why**: Users needed to adjust block times and see weekly summaries
- **Solution**: Added time editing and statistics calculation
- **Impact**: Better time management and overview

## [1.1.0] - 2026-01-03

### Added
- Current time indicator showing "now" line on calendar
- Category editing in settings
- Keyboard shortcuts for common actions
- Visual current time marker

### Features
- Real-time visual indicator of current time
- Customizable category labels
- Improved keyboard navigation

### Technical
- **Why**: Users needed visual reference of current time and more customization
- **Solution**: Added time indicator and settings panel
- **Impact**: Better time awareness and personalization

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
