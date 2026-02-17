---
name: release
description: Create a versioned release — bumps version, updates changelog, tags, and pushes.
user_invocable: true
---

# Release

Create a new versioned release of kai.

If `$ARGUMENTS` contains a version (e.g. `/release 1.2.0`), use that version directly. Otherwise, suggest a version based on commits.

## Workflow

### 1. Pre-flight checks

Run these checks and **abort with a clear message** if any fail:

- Working directory is clean (`git status --porcelain` is empty)
- On `main` branch
- No unpushed commits (`git log @{u}.. --oneline` is empty)

### 2. Gather commits since last tag

```bash
# Get last tag (empty if first release)
git describe --tags --abbrev=0 2>/dev/null

# Commits since last tag (or all commits if none)
git log <last-tag>..HEAD --oneline   # or git log --oneline if first release
```

### 3. Suggest version bump

If a version was provided via `$ARGUMENTS`, skip to step 4.

Analyze commit prefixes to suggest bump type:

- **major**: any commit with `BREAKING CHANGE` or `!:` suffix
- **minor**: `feat:` commits present
- **patch**: only `fix:`, `docs:`, `chore:`, `refactor:`, `style:`, `perf:`, `ci:`, `build:`, `test:` commits

Show the user:
- Grouped commit list (by type)
- Current version (from package.json)
- Suggested next version and bump type

**Pause and ask the user to confirm the version before continuing.**

### 4. Update CHANGELOG.md

If CHANGELOG.md doesn't exist, create it with:
```markdown
# Changelog
```

Prepend the new entry **below the `# Changelog` header** (above any existing entries).

Use the current date. Format depends on bump type:

**Major release:**
```markdown
## X.Y.Z — YYYY-MM-DD

Short paragraph summarizing this release.

### Added
- ...

### Improved
- ...

### Fixed
- ...

### Removed
- ...
```
Only include sections that have entries.

**Minor release:**
```markdown
## X.Y.Z — YYYY-MM-DD

Short paragraph summarizing this release.

### Added
- ...

### Improved
- ...
```
Sections are optional; use shorter bullets.

**Patch release:**
```markdown
## X.Y.Z — YYYY-MM-DD

Brief one-line summary of the fix(es).
```

### 5. Bump version in package.json

Update the `"version"` field in `package.json` to the new version (without `v` prefix).

### 6. Commit

Stage `CHANGELOG.md` and `package.json`, then commit:
```
release: vX.Y.Z
```

### 7. Tag and push

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main --follow-tags
```

### 8. Confirm to user

Tell the user the release is done and show:
- The version and tag
- That the GitHub Action will now build and attach dist to the tag
- Expected CDN URLs once the action completes:
  - `https://cdn.jsdelivr.net/gh/hfrdmnk/kai@vX.Y.Z/dist/kai.min.js`
  - `https://cdn.jsdelivr.net/gh/hfrdmnk/kai@latest/dist/kai.min.js`
