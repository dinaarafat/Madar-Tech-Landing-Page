# Madar Tech Landing Page and CMS

Arabic Madar Tech landing page with a local content-management dashboard.

## Run the site and dashboard

Install Node.js 18 or newer, then run this command from the project directory:

```powershell
node dashboard/server.js
```

Open the landing page at `http://127.0.0.1:4173/` and the dashboard at `http://127.0.0.1:4173/dashboard/`. The server binds to loopback only; do not expose this unauthenticated editor to the internet.

## Content and media

- `dashboard/data/site-content.json` contains the published page content and the original Madar Tech colors.
- The root content is Arabic; other languages live under `translations` (English is included). The website language selector switches between available translations, and the dashboard language selector chooses which translation to edit.
- Colors are shared across languages. To add a language, add another locale entry under `translations` with the same content structure.
- The dashboard previews drafts in the browser and publishes them to the shared JSON file.
- Uploaded images are stored in `assets/images/`.
- The landing page reads the published content from the local server. Its original HTML and styles remain the fallback when opened directly without the server.

This lightweight single-site setup does not require a database. Add authentication and persistent media/data storage before hosting the CMS for remote access or multiple editors.
