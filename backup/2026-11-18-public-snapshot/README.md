# beitsisu.com — public snapshot, 18 November 2026

Taken before any redesign work, from the outside (no WordPress login).

| Folder | What's in it |
|---|---|
| `site/` | A browsable copy of all 16 pages in the sitemap, plus `/services/`, with their images, CSS, JS and fonts. Open `site/index.html` in a browser. |
| `media-originals/` | Full-size originals of all 42 files in the WordPress Media Library, in their `YYYY/MM/` folders. |
| `content-json/` | The WordPress REST API output for pages, posts, services, media and categories: titles, text, URLs and dates. Use it to restore any page's wording. |
| `urls.txt`, `media.txt` | The page and media URLs that were saved. |

## What this snapshot does NOT include

It cannot restore the site by itself. It does **not** contain:
- the WordPress database (settings, menus, Yoast SEO, users)
- **BookingPress data**: appointments, customers, payments, services, staff/rooms, working hours
- plugins, the theme's PHP code, or `wp-config.php`

## Full backup (owner, about 5 minutes)

Your site already has the **UpdraftPlus** plugin.

1. Log in at https://beitsisu.com/wp-admin
2. Go to **Settings → UpdraftPlus Backups**.
3. Click **Backup Now**. Tick **both** "Include your database" and "Include your files", then click **Backup Now** again.
4. When it finishes, the backup appears under **Existing backups**. Click each button there (**Database, Plugins, Themes, Uploads, Others**) to download those files to your computer.
5. Keep those files somewhere safe outside the website, e.g. Google Drive. A backup stored only on the same server is lost if the server fails.

Optional: in **Settings → UpdraftPlus → Settings**, set file and database backups to **Weekly**, and pick **Google Drive** as remote storage so backups are copied off the server automatically.

Your hosting company may also offer a one-click full backup in its control panel (cPanel → Backup). That's a good second copy.
