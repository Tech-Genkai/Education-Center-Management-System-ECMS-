# Frontend notes

## API base URL

The profile UI uses `window.API_BASE_URL` if defined; otherwise it falls back to `http://localhost:5000`.

Set it via an inline script before `main.js` in `index.html` when pointing at another environment:

```html
<script>
  window.API_BASE_URL = 'https://your-api.example.com';
</script>
<script type="module" src="/assets/js/main.js"></script>
```

For Vite, you can also inject it at build time with an env var and a small snippet:

```html
<script>
  window.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
</script>
```

Add `VITE_API_BASE_URL` to `.env` (or `.env.local`) for local overrides.
