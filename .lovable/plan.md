

# Update Favicon with New Logo

## Change

Copy the green logo to `public/favicon.png` and update `index.html` to reference it.

### Step 1 — Copy logo to public directory
- Copy `src/assets/logo-green.png` → `public/favicon.png`

### Step 2 — Update `index.html`
- Replace the existing `<link rel="icon" href="/favicon.ico">` with:
  ```html
  <link rel="icon" href="/favicon.png" type="image/png">
  ```

