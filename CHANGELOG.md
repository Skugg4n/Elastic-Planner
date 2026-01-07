# Changelog

All notable changes to Elastic Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.4] - 2026-01-07 08:44 UTC

### Changed
- **Report sidebar (PROJEKTRAPPORT) completely redesigned**
  - Dark header (zinc-900) matching modern app aesthetic
  - Compact filter controls in 2-column grid layout
  - Large, prominent stat cards with bold numbers
  - Cleaner project cards with better spacing
  - Modern rounded-lg corners throughout
  - Reduced width (420px vs 480px) for better screen usage
  - Improved visual hierarchy and readability

### Added
- **Editable categories in settings**
  - Users can now edit category labels directly in settings modal
  - Categories section added below presets with color indicators
  - Changes automatically persist to localStorage
  - All category references properly use state instead of constants

### Technical
- **Why**: User feedback indicated report sidebar looked "ugly and 2010-Microsoft-like" and needed editable categories
- **Solution**: Complete visual redesign of report sidebar + category editing infrastructure with localStorage persistence
- **Impact**: Much more modern, professional report interface with user-customizable category names

## [1.6.3] - 2026-01-05 21:00 UTC

### Changed
- **MAJOR REDESIGN**: Activity log sidebar completely modernized
  - Dark header (zinc-900) replacing previous yellow theme
  - Cleaner white card design for log items with better shadows
  - Improved spacing and typography throughout
  - Modern rounded corners (rounded-lg) instead of basic rounded
  - Better visual hierarchy with semibold fonts
  - Improved input styling with focus states
  - Category buttons now use rounded-lg squares instead of circles
  - Time badges now have subtle background for better visibility

### Fixed
- **Done blocks now much more visible**
  - Changed text color from very light (text-zinc-300) to readable (text-zinc-500)
  - Added line-through decoration for clear visual indication
  - Added opacity-75 to maintain "completed" feel while staying readable
  - Training blocks now use text-red-600 instead of text-red-200
  - Life blocks now use text-emerald-700 instead of text-emerald-200

### Technical
- **Why**: User feedback indicated log sidebar looked outdated and done blocks were barely visible
- **Solution**: Complete visual overhaul of log sidebar + darker text colors for done blocks
- **Impact**: Much more modern, professional look with significantly improved readability

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
