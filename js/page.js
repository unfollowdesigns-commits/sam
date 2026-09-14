/**
 * The small script for pages that are not the gallery — the journal index and
 * each entry.
 *
 * js/main.js builds the grid, the viewer, the rail and the loader, none of
 * which exist here. Rather than teach it to skip all that, these pages load
 * this instead: the two things every page on the site shares.
 */

/* Theme. Light unless this visitor has chosen otherwise — the same rule as
   the gallery, read from the same key, so the choice carries between pages. */
const KEY = 'sam-theme';
const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const meta = document.querySelector('meta[name="theme-color"]');

let stored = null;
try { stored = localStorage.getItem(KEY); } catch { /* private browsing */ }

apply(stored === 'dark' ? 'dark' : 'light');

function apply(theme) {
  root.dataset.theme = theme;
  toggle?.setAttribute('aria-pressed', String(theme === 'light'));
  meta?.setAttribute('content', theme === 'light' ? '#eae6dc' : '#12110f');
}

toggle?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  apply(next);
  try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
});

/* The year in the footer, so it is never wrong. */
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
