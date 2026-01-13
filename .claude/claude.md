# Claude Development Guidelines for Elastic Planner

This document contains project-specific guidelines and lessons learned for working with this codebase.

## Git Workflow & Protected Branches

### CRITICAL: Always Check Target Branch First
Before making ANY commits:
1. **READ** the task instructions to identify the correct feature branch
2. **VERIFY** you're on that branch: `git branch --show-current`
3. **NEVER** assume the branch name - task descriptions specify it explicitly

### Protected Branch Workflow (main/master)
When you need to get changes to production:

**DO NOT:**
- ❌ Push directly to `main` or `master`
- ❌ Attempt multiple push retries when getting 403 errors
- ❌ Try `git merge` into main locally then push
- ❌ Loop through the same failed approach repeatedly

**DO:**
1. ✅ Push all changes to the specified feature branch
2. ✅ Create a Pull Request (PR) from feature → main
3. ✅ If PR has conflicts, resolve them ON THE FEATURE BRANCH:
   ```bash
   git fetch origin
   git merge origin/main
   # Resolve conflicts
   git add -A
   git commit -m "Resolve merge conflicts"
   git push origin <feature-branch>
   ```
4. ✅ Tell the user to merge the PR manually on GitHub
5. ✅ STOP and wait - don't keep trying to push to main

### Signs You're In A Loop
If you see any of these, STOP and change approach:
- Getting repeated 403 errors when pushing
- Trying the same git command more than twice
- Creating local commits on `main` that can't be pushed
- Cherry-picking between branches multiple times

### Recovery
If you've made commits on wrong branch or `main`:
```bash
# Reset main to match remote
git checkout main
git reset --hard origin/main

# Switch to correct feature branch
git checkout <correct-feature-branch>

# Cherry-pick or recreate changes here
```

### Key Insight
Protected branches exist for a reason - respect them. The workflow is:
**Feature Branch → Push → PR → Manual Merge → Production**

Never try to shortcut this process by pushing directly to main.

## Project-Specific Notes

### Architecture
- Single-file React app (`src/App.jsx`)
- LocalStorage for persistence
- Vite + Tailwind CSS build system
- Swedish language UI

### Data Migrations
When changing data structures:
1. Create migration function (e.g., `migrateLogsToPoints()`)
2. Add to `getInitialWeeksData()` in sequential order
3. Test with existing data
4. Document in CHANGELOG.md with ⚠️ for breaking changes

### Version Updates
When bumping version:
1. Update `APP_VERSION` constant in `src/App.jsx`
2. Update `version` in `package.json`
3. Add comprehensive entry to `CHANGELOG.md`
4. Build and test before committing

### Common Patterns
- Categories: `training`, `job`, `creative`, `life`
- Status: `planned`, `done`, `inactive`
- Data structure: `{ calendar: [], points: {} }` per week
- Time: 7-24 hour range, decimal format (9.5 = 09:30)
