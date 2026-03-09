

# Scroll to top on navigation

The issue is that when navigating between pages (especially "Per Chi È" sub-pages), the browser doesn't scroll to the top. React Router doesn't do this automatically.

## Solution

Create a `ScrollToTop` component that listens to route changes and scrolls to top, then add it inside `<BrowserRouter>` in `App.tsx`.

### File changes

**Create `src/components/ScrollToTop.tsx`** — a small component using `useEffect` + `useLocation` from react-router-dom to call `window.scrollTo(0, 0)` on every path change.

**Modify `src/App.tsx`** — import and place `<ScrollToTop />` right after `<BrowserRouter>`.

