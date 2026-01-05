# Development Guidelines

## Standard Development Workflow

For every feature or fix, follow this workflow:

### 1. Make Changes
- Implement the requested feature or fix
- Test locally with `npm run dev`

### 2. Update Version Number
- Update `APP_VERSION` in `/src/App.jsx`
- Update `version` in `/package.json`
- Follow semantic versioning:
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes

### 3. Update CHANGELOG.md
Add a new entry with:
- Version number
- Current date and time in UTC (format: `YYYY-MM-DD HH:MM UTC`)
- Changes categorized under:
  - **Added**: New features
  - **Changed**: Changes to existing functionality
  - **Fixed**: Bug fixes
  - **Removed**: Removed features
  - **Technical**: Why/Solution/Impact explanation

**Template:**
```markdown
## [X.Y.Z] - YYYY-MM-DD HH:MM UTC

### Added
- Feature description

### Changed
- Change description

### Technical
- **Why**: Problem or need
- **Solution**: How it was solved
- **Impact**: Effect on users/system
```

### 4. Build
```bash
npm run build
```

### 5. Commit & Push
```bash
git add .
git commit -m "Descriptive message (vX.Y.Z)"
git push -u origin <branch-name>
```

### 6. Create Pull Request
- Create PR on GitHub
- Use descriptive title with version number
- Include summary of changes
- Add test plan checklist

### 7. Merge Pull Request
- Review changes
- Merge to main branch
- Delete feature branch after merge

## Version Display

The app displays version number in the UI footer using the `APP_VERSION` constant from `/src/App.jsx`. This same constant is used for:
- UI display
- Export filenames
- Version tracking

If version display is needed in multiple places, always use the `APP_VERSION` constant to ensure consistency.

## CHANGELOG Best Practices

1. **Always include date and time in UTC**
2. **Explain the "why" in Technical section** - helps future debugging
3. **Be specific** - "Added user authentication" not "Added stuff"
4. **Include impact** - how does this affect users or the system?
5. **Keep chronological order** - newest on top

## Git Branch Naming

Use descriptive branch names:
- `claude/<feature-description>-<session-id>` for features
- Always include session ID for tracking

## Testing Before Commit

1. Run development server: `npm run dev`
2. Test all changed functionality
3. Check console for errors
4. Verify version number displays correctly
5. Test on different screen sizes if UI changes

## Future Plans

- Move from localStorage to Firebase/backend
- Add user authentication
- Multi-device sync
