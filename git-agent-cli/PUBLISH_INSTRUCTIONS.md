# Publishing to npm

## Steps to Publish

1. **Check npm login:**
   ```bash
   npm whoami
   ```
   If not logged in:
   ```bash
   npm login
   # Or create account: npm adduser
   ```

2. **Verify package name is available:**
   ```bash
   npm view git-somnia-agent
   ```
   Should return 404 (not found) - means name is available!

3. **Final checks:**
   ```bash
   cd git-agent-cli
   npm version patch  # Bump version if needed (1.0.0 → 1.0.1)
   npm publish
   ```

4. **After publishing:**
   Users can install with:
   ```bash
   npm install -g git-somnia-agent
   ```

## Important Notes

- Package name: `git-somnia-agent` (unique, not taken)
- Command name: `git-somnia-agent` (via Git alias: `git config --global alias.somnia-agent '!git-somnia-agent'`)
- Version: Start with 1.0.0 for first publish
- Make sure all dependencies are in `package.json`

## Git Alias Setup (for users)

After installing, users need to set up Git alias:
```bash
git config --global alias.somnia-agent '!git-somnia-agent'
```

Or use directly:
```bash
git-somnia-agent stats
git-somnia-agent compare main aggressive
```

