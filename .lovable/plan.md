

# Replace Text Logo with Image Logo Across the App

## Summary

Replace the text-based "edilizia.io" logo (rendered as `<span>`) with the uploaded PNG logo images in all locations. The green-on-transparent version goes on light backgrounds; the white-on-transparent version goes on dark backgrounds.

## Logo Mapping

| Background | Image file | Used in |
|---|---|---|
| Light/white | `edilizia_io_verde_su_trasparente_2x.png` | Navbar, Login, Signup, ForgotPassword, ResetPassword, SidebarNav, Offerta shared header |
| Dark | `edilizia_io_bianco_su_trasparente_2x.png` | Footer, Navbar dark variant |

## Files to Edit (8 files)

### Step 0 — Copy images to `src/assets/`
- `user-uploads://edilizia_io_verde_su_trasparente_2x.png` → `src/assets/logo-green.png`
- `user-uploads://edilizia_io_bianco_su_trasparente_2x.png` → `src/assets/logo-white.png`

### Step 1 — `src/components/sections/Navbar.tsx`
Replace the text `<span>` logo with `<img>` using the green logo by default, white logo when `isDark`. Height ~32px.

### Step 2 — `src/components/sections/Footer.tsx`
Replace text logo with white logo `<img>` (dark background). Height ~28px.

### Step 3 — `src/components/layout/SidebarNav.tsx`
Replace text logo at line 192 with green logo `<img>`. Height ~28px.

### Step 4 — `src/pages/Login.tsx`
Replace text logo at line 61-63 with green logo `<img>`. Height ~32px.

### Step 5 — `src/pages/Signup.tsx`
Replace text logo at line 89-91 with green logo `<img>`. Height ~32px.

### Step 6 — `src/pages/ForgotPassword.tsx`
Replace text logo at line 42-44 with green logo `<img>`. Height ~32px.

### Step 7 — `src/pages/ResetPassword.tsx`
Replace text logo at line 86-88 with green logo `<img>`. Height ~32px.

### Step 8 — `src/components/offerta/shared.tsx`
Replace text logo at line 168-170 with green logo `<img>`. Height ~28px.

## Technical Detail

Each replacement follows this pattern:
```tsx
// Light background:
import logoGreen from "@/assets/logo-green.png";
<img src={logoGreen} alt="Edilizia.io" className="h-8 w-auto" />

// Dark background:
import logoWhite from "@/assets/logo-white.png";
<img src={logoWhite} alt="Edilizia.io" className="h-8 w-auto" />
```

The Navbar uses a conditional: `isDark ? logoWhite : logoGreen`.

