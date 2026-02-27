# Changelog

All notable changes to Elastic Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.14.1] - 2026-02-27

### Fixed - CRITICAL
- **Category ID corruption**: Fixed bug where `COLOR_PALETTE[0].id` ('zinc-900') would overwrite custom category IDs when creating or changing color. This caused custom categories to break. Added migration that repairs corrupted IDs on load.
- **Color selection also corrupted**: Same bug existed when clicking a color in category settings — the color's `id` field would overwrite the category's `id`.
- **Defensive weekPoints**: Added guard against corrupted points data (`Object.values(points).filter(Array.isArray).flat()`)
- **Color active indicator**: Fixed the visual indicator for which color is currently selected (no longer depends on matching `id` fields)

## [1.14.0] - 2026-02-27

### Added

#### Feature 1: Edit Block Modal (Full Block Editor)
- **Complete block editor**: Clicking the pen icon (✏️) on a selected block now opens a full modal with all editable properties
- **Editable fields**:
  - **Namn**: Block label/name
  - **Kategori**: Category selector with colored buttons for all available categories
  - **Starttid & Sluttid**: Time pickers (HH:MM) for precise time control
  - **Längd**: Auto-calculated duration display
  - **Status**: Toggle between Planerad, Klar, and Inaktiv
  - **Projekt**: Project name with autocomplete from project history
  - **Uppgift**: Task name
  - **Beskrivning**: Free-text description/notes field
- **Collision resolution**: After saving, blocks are automatically repositioned if time changes cause overlaps
- **Project history**: New project names are automatically saved for future autocomplete

#### Feature 2: Auto-Split on Overlap (Automatic Parallel Blocks)
- **Smart overlap detection**: When dragging a block onto another block's time slot, they automatically become parallel (50/50 split) instead of being pushed forward
- **Resize auto-split**: When resizing a block so it overlaps with another, both blocks become parallel automatically
- **Natural unlinking**: When dragging away from a parallel position, the block is unlinked from its partner (partner returns to full width)
- **Cascading collisions**: If more than 2 blocks overlap, the first pair becomes parallel and remaining blocks are resolved via collision resolution
- **New helper function**: `autoParallelize()` handles the smart detection and pairing logic

### Technical
- **Version bumped**: 1.13.0 → 1.14.0
- **New import**: `Clock` from lucide-react (used in time picker labels)
- **New state**: `editBlockModal` - stores all editable properties of the block being edited
- **New function**: `autoParallelize(allBlocks, movedBlock)` - checks for overlaps and creates parallel pairs instead of pushing blocks
- **Modified**: `handleDrop()` - now uses `autoParallelize()` instead of `resolveCollisions()` for insert operations, and properly unlinks old parallel partners when dragging
- **Modified**: Resize `handleMouseUp` - now uses `autoParallelize()` instead of `resolveCollisions()`
- **Modified**: Block action handler - 'edit' action now opens full modal instead of inline label editing

### Why These Changes?
- **Edit Modal**: Previously, users could only edit block names via inline editing and notes via a separate modal. The new modal provides a unified interface for ALL block properties, reducing the number of clicks needed to fully configure a block.
- **Auto-Split**: The previous behavior pushed blocks forward on overlap, which was often frustrating. Auto-parallelizing matches user intent much better - if you place a block on top of another, you likely want them to coexist in the same time slot, not be sequential.

## [1.13.0] - 2026-02-27

### Added

#### Feature: Unified Training System with Weekly Goals
- **Weekly Training Goal System**: Added `weeklyGoalPoints` field to categories (training defaults to 10 points/week)
- **Composite Goal Scoring**:
  - Each training point (⚡) = 1 goal point
  - Each training block hour = 2 goal points (e.g., 1.5h session = 3 goal points)
  - Combined progress tracking for both micro-workouts and longer sessions
- **Training Goal Dashboard in Header**: New "Fys-mål" pill next to StatPills showing:
  - Current points / goal points (e.g., "7 / 10p")
  - Progress bar visualizing completion percentage
  - Trophy emoji (🏆) when weekly goal is met
- **Day Achievement Badges**:
  - Fire emoji (🔥) badge appears on days with 3+ training points
  - Shows alongside existing PEPP! badge for completing activities
- **Quick-Log Snabbträning Section**:
  - New dedicated "🔥 Snabbträning" section at top of add-point modal
  - One-tap buttons for training presets (filter by category='training')
  - Instant registration without modal closure (stay open for multiple quick logs)
  - Live counter: "3 aktiviteter registrerade denna session"
  - Auto-set time to now, category to training, status to done
- **Enhanced Points Display**:
  - Training points shown in bold red (⚡ in red) in header "Punkter" breakdown
  - Clear visual distinction from other categories

### Technical
- **Version bumped**: 1.12.0 → 1.13.0
- **New category field**: `weeklyGoalPoints: number | null` added to all categories
  - DEFAULT_CATEGORIES training entry now has `weeklyGoalPoints: 10`
  - Other default categories have `weeklyGoalPoints: null`
  - Custom categories created in settings also include this field
- **New state**: `quickTrainingCount` for tracking quick-log session counter
- **New calculations**: `trainingGoals` object computed from points and blocks
  - Per-category tracking of current points vs weekly goal
  - Boolean flag for goal achievement status
- **Settings modal enhancement**: New "Målantalpoäng/v" input field (next to "Måltimmar/v")
- **Header enhancements**:
  - Training goal pills rendered after existing StatPills
  - Fire badge logic on day headers (3+ training points)
  - Training points styled in bold red in points breakdown
- **Modal enhancements**:
  - Quick-training buttons trigger `addPoint()` directly (no form needed)
  - Quick-training section only shows if training presets exist
  - Modal reset functionality clears quick-training counter on close

### Why These Changes?
- **Unified System**: Training was split between blocks (hours) and points (reps). Now they work together toward one goal
- **Flexibility**: Some days might have a long session (3+ hours = 6+ points), other days micro-workouts (3 quick reps = 3 points). Both count equally toward weekly goal
- **Motivation**: Visual progress bar and achievement badges provide feedback on weekly training consistency
- **Speed**: One-tap quick-logging for training removes friction from registering frequent small workouts
- **Clarity**: Fire badge instantly signals "you trained hard today" (3+ mini-sessions), trophy signals "weekly goal achieved"

### Data Model
- Points now support `categoryId` field for better tracking (already existed, now used more)
- Blocks already tracked by `type` (category), count as hours toward goal
- Goal calculation is generic: works with any category that has `weeklyGoalPoints` set (not hardcoded to training)

## [1.12.0] - 2026-02-27

### Added

#### Feature: Parallel Blocks (50/50 Split)
- **Parallel Blocks**: Users can now work on two activities simultaneously in the same time slot by creating parallel blocks that render side-by-side (50/50 width)
- **New Action Button**: "Parallell" button (with SplitSquareHorizontal icon) added to block action menu
- **Creating Parallel Blocks**:
  - Click "Parallell" on any block to create a new block sharing the same time slot
  - New block has same day, start time, and duration as original
  - Gets default category (first available, or 'life')
  - Label: "Parallell"
  - Status: same as original block
  - Both blocks get assigned a shared `parallelId`
- **Side-by-Side Rendering**:
  - Blocks with same `parallelId` render at 50% width each
  - Left block (first by start time or ID): left:2px, right:50%
  - Right block (second by start time or ID): left:50%, right:2px
- **Unlinking Parallel Blocks**:
  - **When dragged**: Automatically removes `parallelId` (unlinks from partner)
  - **When deleted**: Also removes `parallelId` from partner block (makes it full-width again)
- **Time Accounting**: Both parallel blocks count their FULL duration for time tracking (not split)
- **Collision Resolution**: Updated `resolveCollisions()` to skip blocks sharing same `parallelId` (they intentionally overlap)
- **Data Model**: Added optional `parallelId: string | null` field to block structure

### Technical

- **Version bumped**: 1.11.0 → 1.12.0
- **Icon added**: `SplitSquareHorizontal` imported from lucide-react
- **New migration**: `migrateParallelId()` adds `parallelId: null` to existing blocks
- **Modified Block component**: Now accepts `isParallel` and `parallelPosition` props for positioning
- **New function**: `createParallelBlock(block)` - Creates paired parallel block with shared ID
- **Modified**: `resolveCollisions()` - Skips collision detection for blocks with shared `parallelId`
- **Modified**: Block action handler - "parallel" action, enhanced "delete" to unlink partners
- **Modified**: `handleDragStart()` - Removes `parallelId` when dragging parallel blocks
- **Updated block rendering logic**: Calculates parallel position and passes to Block component
- **Modified**: Duplicate action now includes `parallelId: null` for new blocks
- **New localStorage**: `parallelId` persisted in block data

### Why These Changes?

- **Simultaneous Work**: Users can now accurately represent working on multiple projects simultaneously (e.g., job + book project for the same 2 hours)
- **Realistic Time Tracking**: Both activities count full time because user genuinely worked on both in parallel
- **Natural Unlinking**: Dragging a parallel block away automatically unlinks it; deleting one unlinks the partner too
- **Clean Visual**: 50/50 split clearly shows two concurrent activities without creating collision complexity

## [1.11.0] - 2026-02-27

### Added

#### Feature 1: Default Template for New Weeks
- **Default Template System**: Added ability to save any day's layout as a template that automatically applies to all days in newly created weeks
- **"Ställ in som veckomall" button**: In the template dropdown for each day, users can now click "Ställ in som veckomall" to save the current day's blocks and points as the default template
- **Auto-apply on new week navigation**: When navigating to a week that doesn't exist yet, if a default template is set, it will automatically be applied to all 7 days with new block/point IDs
- **Settings panel management**: Added default template section in Settings modal showing:
  - Current default template name and creation date
  - "Radera standardmall" button to clear the default template
  - Helper text when no template is set
- **localStorage key**: `elastic-planner-default-template` stores template data including name, blocks, points, and setAt timestamp

#### Feature 2: Bank Panel (Unscheduled Items Sidebar)
- **Bank System**: New side panel at the bottom of the screen for storing unscheduled blocks to use later
- **Bank UI**:
  - Collapsible panel with "📦 Bank (N)" button showing item count
  - When expanded, displays all stored items with label, category color dot, and duration
  - Items can be dragged from bank directly into calendar cells
  - Items can be deleted from bank with trash icon
- **Add to Bank**: New "📦" button in block action menu to move blocks to bank (removes from calendar)
- **Dragging from Bank**: When dragging a bank item to a calendar cell, creates a new block with the bank item's properties and auto-resolves collisions
- **Quick Add to Bank**: Form in expanded bank panel to add items directly:
  - Label input field
  - Duration dropdown (0.5, 1, 1.5, 2, 3, 4h)
  - Category selector with colored dots
  - "Lägg till" button
- **Bank Item Structure**: Stores label, type (category), duration, projectName, taskName, and addedAt timestamp
- **localStorage key**: `elastic-planner-bank` persists all bank items
- **Floating action button**: Moved add point button up to accommodate expanded bank panel at bottom

### Technical
- **Version bumped**: 1.10.0 → 1.11.0
- **New constants**: `DEFAULT_TEMPLATE_KEY`, `BANK_KEY`
- **New state**: `bankItems`, `bankOpen`, `bankAddLabel`, `bankAddDuration`, `bankAddCategory`
- **New functions**:
  - `saveAsDefaultTemplate(dayIndex)` - Save day layout as default template
  - `getDefaultTemplate()` - Retrieve default template from localStorage
  - `clearDefaultTemplate()` - Delete default template
  - `addToBank(blockId)` - Move block to bank
  - `removeFromBank(bankItemId)` - Delete bank item
  - `addBankItemToCalendar(bankItemId, dayIndex, startHour)` - Create block from bank item
  - `addQuickBankItem()` - Add quick item via form
- **Modified**: `handleDrop()` - Added logic to handle drops from bank items
- **New useEffect**: Auto-applies default template when navigating to week that doesn't exist yet
- **New useEffect**: Persists bank items to localStorage whenever they change

### Why These Changes?
- **Default Template**: Users with repetitive weekly schedules can now instantly set up new weeks without manual entry
- **Bank System**: Enables flexible task management - users can plan activities and schedule them flexibly throughout the week, or keep them as "to be scheduled later"
- **Drag from Bank**: Natural interaction model matching the existing drag-drop calendar system
- **Swedish UI**: Both features use Swedish labels for consistency with existing app

## [1.10.0] - 2026-02-27

### Fixed
- **Resize handles now appear on all block statuses** - Blocks with status 'done' and 'inactive' can now be resized (previously only 'planned' blocks were resizable). The resize handle (bottom edge drag area) now appears for all statuses.
- **Fixed "today" indicator for week navigation** - The blue "today" indicator (blue dot + line) now only appears when viewing the current week, not when navigating to other weeks. Calculation fixed to check if `currentWeekIndex === getCurrentWeek()`.

### Added
- **Delete blocks with keyboard shortcuts** - Selected blocks can now be deleted by pressing Delete or Backspace key. When multiple blocks are selected, pressing Delete removes all of them.
- **Settings gear button in header** - Added Settings icon (⚙️) to the header for quick access to the settings modal. Clicking it opens the category and preset management dialog.
- **Improved settings modal** - Settings modal now clearly shows two sections:
  - "Kategorier" (Categories) - Full CRUD for categories with label editing, color picker, icon picker, target hours, and delete functionality
  - "Snabbval" (Presets) - Preset editing section for quick-add buttons

### Removed
- **Removed "Spara" (Export) and "Ladda" (Import) buttons from header** - These backup buttons have been removed since data is auto-saved to localStorage. The "Import" button for training plans remains. The export/import functions are still available in code for future use but don't clutter the header.

### Technical
- **Version bumped**: 1.9.2 → 1.10.0
- **Updated resize logic**: Block component now shows resize handle for all statuses, not just non-done blocks
- **Updated todayIndex calculation**: Now checks `isCurrentWeek` before showing today indicator
- **Added keyboard event handler**: Delete/Backspace now trigger bulk delete when blocks are selected
- **Simplified header**: Removed export/import button UI, kept training plan import button
- **Added Settings button**: New header button toggles settings modal

### Why These Changes?
- **Resizing done blocks**: Users sometimes need to adjust completed time blocks retroactively
- **Keyboard delete**: Faster workflow for removing unwanted blocks
- **Settings button**: More discoverable access to customization options
- **Today indicator fix**: Prevents confusion when navigating between weeks
- **Removed buttons**: Cleaner header, less clutter, data is already auto-saved

## [1.9.2] - 2026-02-27

### Fixed - CRITICAL
- **White screen crash**: Fixed 3 remaining references to old `CATEGORIES` constant that should have been `categories` (state). Caused the app to crash when clicking empty calendar cells, opening log sidebar, or using FAB presets.
- **Drag start crash**: Removed `setSourceContainer(source)` call - function was never declared (leftover from removed Bank feature). Caused crash on any drag operation.
- **Cleaned up dead code**: Removed unused `doneBok`/`totalBok`/`doneJob`/`totalJob` variables (stats are now dynamic)

### Added
- **Cumulative comp flex**: For categories with a target (e.g., Jobb 24h/v), the header now shows BOTH weekly diff ("v: +2h") AND total cumulative flex across all weeks ("totalt: +12h (8v)")
- This lets you see how much comp time you've banked overall, not just this week

## [1.9.1] - 2026-02-27

### Fixed (Code Review Findings)
- **Missing icons**: Added all 12 icons to getCategoryIcon (Heart, Music, Book, Code, Dumbbell, Bike, Palette were missing)
- **Icon selector in settings**: Added icon picker UI so users can change category icons
- **Day header stats dynamic**: Day headers now show stats for ALL categories, not just hardcoded Bok/Jobb
- **Points by category dynamic**: Points counter now supports custom categories instead of hardcoded 4

## [1.9.0] - 2026-02-27

### 🎉 THREE MAJOR FEATURES ADDED

#### Feature 1: Dynamic/Customizable Categories (Fas 2)
- **Categories now fully customizable** instead of hardcoded
  - Create, edit, and delete categories from settings modal
  - Unique ID generation for custom categories: `custom-${Date.now()}`
  - Categories persist to localStorage with `CATEGORIES_KEY`
  - Default categories (Bok, Jobb, Fys, Livet) still available as baseline

- **Color customization**
  - 8-color palette available: zinc, blue, red, emerald, amber, purple, pink variants
  - One-click color switching in settings
  - Color includes full Tailwind styling (bg, text, border, icon colors, done-state styles)

- **Icon management**
  - Available icons: Briefcase, PenTool, Zap, Coffee, Star, Heart, Music, Book, Code, Dumbbell, Bike, Palette
  - Default icons: PenTool (Bok), Briefcase (Jobb), Zap (Fys), Coffee (Livet)
  - New categories default to Star icon

- **All references updated**
  - Replaced global `CATEGORIES` const with dynamic `categories` state
  - Updated `getCategoryIcon()` to accept and use dynamic categories
  - All UI components now receive `categories` as prop
  - Header stats, points, logs, all respect custom categories

- **Safety features**
  - Cannot delete categories in use (shows block count)
  - Deleting unused categories requires confirmation
  - Settings modal scrollable for many categories

#### Feature 2: Job Meter / Flex Tracking (Fas 3)
- **Target hours per category**
  - Each category can now have optional `targetHoursPerWeek` setting
  - Job defaults to 24h/week
  - Other categories default to null (no tracking)
  - Editable in settings modal with "Måltimmar/vecka" input

- **Dynamic StatPills**
  - Header now dynamically generates StatPill for each category
  - Shows: done / total hours
  - Displays flex difference when target is set: "+2h" (green) or "−3h" (red)
  - Only visible if category has blocks OR has a target set
  - Color-coded: green for on-target/exceeded, red for below target

- **Flexible tracking**
  - Works with any number of custom categories
  - Targets are per-category, not global
  - Visual warning when below target (AlertCircle icon)

#### Feature 3: Duplicate Block (Fas 4)
- **New "Duplicera" button** in action menu (Copy icon)
  - Appears when block is selected
  - Creates exact copy of block with:
    - New unique ID: `block-${Date.now()}`
    - Same day, duration, label, type, projectName, taskName
    - Placed immediately after original (start = original.end)
    - Status set to 'planned' (fresh copy)
  - Auto-resolves collisions to maintain clean schedule
  - Undo via deletion if needed

- **Workflow benefit**
  - Quick copy-paste for repetitive schedules
  - Reduces manual data entry
  - Maintains proper collision detection

### Technical Changes
- **Version bumped**: 1.8.2 → 1.9.0
- **New imports**: Added `Copy` icon from lucide-react
- **New localStorage keys**:
  - `CATEGORIES_KEY = 'elastic-planner-categories'`
  - `FLEX_KEY = 'elastic-planner-flex'` (reserved for future flex calculations)
- **New constants**:
  - `COLOR_PALETTE`: 8 color options with full styling
  - `ICON_OPTIONS`: 12 available icons
  - `DEFAULT_CATEGORIES`: Original 4 categories with new fields
- **New category fields**:
  - `icon: string` - icon name from available options
  - `targetHoursPerWeek: number | null` - weekly goal
- **Updated getCategoryIcon()**: Now accepts `categories` parameter for dynamic lookup
- **Block component**: Accepts `categories` prop, uses for styling
- **Settings modal**: Expanded to include category management section above presets
- **StatPill component**: Enhanced to show flex difference when target is set
- **Header stats**: Dynamically generate from all categories instead of hardcoded

### Data Migrations
- **Automatic migration**: Existing users get DEFAULT_CATEGORIES on first load
- **Backwards compatible**: Old data structures still work, enhanced with new fields
- **No data loss**: All existing blocks, logs, and schedules preserved

### Breaking Changes
⚠️ **None** - Fully backwards compatible

### Why These Features?
- **Dynamic Categories**: App was too rigid with 4 fixed categories. Users want flexibility for different life domains
- **Flex Tracking**: Need visual indicator of whether weekly targets are being met, especially for job hours
- **Duplicate Block**: Repetitive schedules (same meetings weekly, same training) need quick copy-paste mechanism

### Impact
- Significantly more customizable and flexible
- Better support for multiple projects/life domains
- Clearer weekly progress tracking
- Faster schedule creation for recurring patterns

## [1.8.2] - 2026-02-27

### Fixed
- **Drag & drop**: Blocks can now be dropped back to their original position without being shifted forward by collision resolution
- **Report sidebar crash**: Fixed references to `totalLogs`/`logCount` (renamed in v1.8.0 to `totalPoints`/`pointCount`) that caused the report view to break
- **Preset buttons broken**: Fixed `addToLog()` calls (function removed in v1.8.0) → now correctly calls `addPoint()`
- **Log sidebar input broken**: Same `addToLog` → `addPoint` fix applied to the manual activity input form

### Technical
- **Why**: These bugs were introduced in the v1.8.0 refactor when logs were renamed to points, but several UI references were not updated
- **Impact**: Report sidebar now works, preset quick-buttons work, and drag & drop is less frustrating

## [1.8.1] - 2026-01-09

### Added - HOTFIX
- **Floating Action Button (FAB)** for adding points
  - Yellow ⚡ button in bottom-right corner
  - Opens modal for creating new points

- **Add Point Modal**
  - Text input for activity description
  - Time picker (HH:MM format) with smart status detection
  - Automatic status: future time → 'planned', past/current → 'done'
  - Live preview showing if point will be planned or done
  - Category selector with visual buttons
  - Preset quick-select buttons

- **Preset Integration**
  - All presets from settings available in modal
  - Click preset → fills text and category
  - User can then adjust time before creating

### Fixed
- **Critical UX Issue**: No way to create new points after Bank removal in v1.8.0
  - Bank section removal inadvertently removed the micro-menu with presets
  - Users had no UI to add points despite backend functionality existing
  - FAB + modal restores and improves this functionality

### Technical
- **Why**: v1.8.0 removed Bank UI which contained the micro-menu for adding points
- **Impact**: Restored critical functionality with improved UX (floating button + proper time picker)

## [1.8.0] - 2026-01-09

### 🎉 MAJOR ARCHITECTURE REFACTOR - "Points System"

This release represents a major consolidation and simplification of the Elastic Planner architecture, replacing the fragmented "Bank + Logs + Presets" system with a unified "Points" concept.

### Added
- **Points System**
  - New unified data structure replacing "Activity Logs" (micro-activities)
  - Two states: `planned` (grayed out, opacity-40) and `done` (full color)
  - Visual distinction: planned points show with dashed border and reduced opacity
  - Checkbox UI in sidebar for toggling point status
  - Points display on calendar timeline with status indicators (○ planned, ● done)

- **Templates System**
  - Save any day as a reusable template (stored in localStorage)
  - Apply templates via dropdown in day headers (FileText icon)
  - Templates include both blocks and points
  - Delete templates from dropdown menu
  - Instant apply: replaces entire day's content

- **Enhanced MD Parser**
  - New syntax for blocks: `(9-12.30) Styrketräning` (time span)
  - New syntax for points: `@9.15 Armhävningar` (specific time)
  - Backwards compatible with old format
  - Import plans can now create both blocks and points
  - Points automatically created as 'planned' status

### Removed
- **Bank (Unscheduled blocks storage)**
  - Completely removed from UI and data structure
  - Migration automatically discards bank items with console warning
  - Simplified drag-and-drop logic (no more bank container)

### Changed
- **Data Structure**
  - Renamed `logs` → `points` throughout entire codebase
  - Points now have `status` field ('planned' or 'done')
  - All existing logs migrated to points with status='done'
  - Week data structure: `{ calendar: [], points: {} }`

- **Statistics & UI**
  - Header now shows "Punkter" instead of "Loggat"
  - Point counts displayed with category breakdown
  - Sidebar renamed to "Point List"
  - Empty state: "Inga punkter registrerade"

- **Report System**
  - Updated to use points instead of logs
  - `totalLogs` → `totalPoints`
  - `logCount` → `pointCount` in project tracking

### Migrations
- **v1.8.0 Migration #1**: `migrateBankRemoval()` - Removes bank from all weeks
- **v1.8.0 Migration #2**: `migrateLogsToPoints()` - Renames logs to points, adds status field
- All migrations run sequentially on app load
- Existing data fully preserved (logs become done points)

### Technical
- **Why**: System had become "stökigt" (messy) with too many overlapping features doing similar things
- **Goal**: Consolidate Bank + Logs + overlapping functionality into unified "Points" concept
- **Solution**:
  1. Remove Bank entirely
  2. Transform Logs into Points with status (planned/done)
  3. Add Templates for reusable day patterns
  4. Update MD parser for explicit time syntax
- **Impact**:
  - Cleaner architecture with fewer moving parts
  - More intuitive: "planned activities" vs "completed activities"
  - Templates enable quick day setup
  - Better visual distinction between future and past events

### Breaking Changes
⚠️ **Bank is completely removed** - Any items in bank will be discarded during migration
⚠️ **Data structure changed** - Direct localStorage edits need to use new `points` structure

## [1.7.1] - 2026-01-09

### Added
- **Import training plans modal**
  - New "📥 Import" button in header
  - Modal showing available training plans
  - One-click import of 10-dagars armhävningsplan
  - Automatically creates blocks across multiple weeks

- **Import plan logic**
  - Reads and parses MD training plans
  - Calculates correct dates from start date
  - Maps activities to correct days and weeks
  - Creates blocks with checkboxes intact
  - Handles multi-section days (multiple activities per day)

### Technical
- **Why**: User has a 10-day training plan and needs to quickly get it into the calendar
- **Solution**: Import modal + logic to parse MD files and create calendar blocks
- **Impact**: Training plans can now be imported in one click instead of manual entry

## [1.7.0] - 2026-01-08 12:37 UTC

### Added
- **Checkbox support in block descriptions**
  - Use markdown syntax: `- [ ] Task` and `- [x] Done`
  - Interactive checkboxes in notes modal - click to toggle
  - Visual progress indicator in blocks: ☑️ 2/4
  - Perfect for training plans, checklists, project tasks

- **MD parser for training plans & templates**
  - Parse metadata (Type, Start, Repeat, Category)
  - Support for daily sections with checkboxes
  - Foundation for importing plans/templates

- **Example training plan**
  - `/training-plans/10-dagars-armhavningar.md`
  - Ready to be imported (import UI coming next)

### Changed
- Note modal now renders checkboxes beautifully
- Blocks show checkbox progress when description has checklists
- Larger note modal (max-w-md) for better checkbox visibility

### Technical
- **Why**: User needs to track multi-day training plans with daily checkboxes
- **Solution**: Markdown checkbox support + plan/template parser foundation
- **Impact**: Can now track complex plans with sub-tasks, paving way for weekly templates

## [1.6.5] - 2026-01-08 08:49 UTC

### Added
- **Inline category picker** - Category selection now appears directly at the clicked cell as small colored buttons (B/J/F/L) instead of centered modal
- Faster workflow: One less step when adding activities

### Changed
- **Mobile responsiveness improved**
  - Report sidebar now full-width on mobile (sm:w-[420px] on desktop)
  - Log sidebar now full-width on mobile (sm:w-[380px] on desktop)
  - Better touch experience on phones/tablets

### Technical
- **Why**: User feedback that category selection modal was too many clicks, and app wasn't mobile-friendly
- **Solution**: Inline category picker positioned at cursor + responsive sidebar widths
- **Impact**: Faster activity creation and usable on mobile devices

## [1.6.4] - 2026-01-07 10:11 UTC

### Changed
- **Report sidebar (PROJEKTRAPPORT) completely redesigned**
  - Dark header (zinc-900) with AlertCircle icon matching modern app aesthetic
  - Compact filter controls in 2-column grid layout
  - Large, prominent stat cards with bold numbers (timmar, aktiviteter, projekt)
  - Cleaner project cards with better spacing and hover effects
  - Modern rounded-lg corners throughout
  - Reduced width (420px vs 480px) for better screen usage
  - Improved visual hierarchy and readability
  - Better color consistency with zinc palette

### Technical
- **Why**: User feedback indicated report sidebar looked "ugly and 2010-Microsoft-like"
- **Solution**: Complete visual redesign of report sidebar only (no state changes)
- **Impact**: Much more modern, professional report interface matching rest of app

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
