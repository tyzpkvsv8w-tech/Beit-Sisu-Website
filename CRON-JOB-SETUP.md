# Set up a "real" cron job for beitsisu.com (about 5 minutes)

**Why:** WordPress runs its background tasks only when someone visits a page that isn't cached. Because the site is now cached (faster), those visits are rarer, so tasks run late: scheduled posts, plugin updates, the email/queue jobs, QUIC.cloud image pulls. Site Health flags this as "A scheduled event is late". A cron job on the server runs them on a fixed timer instead.

Checked 11 Nov 2026: `https://beitsisu.com/wp-cron.php` is reachable (HTTP 200) and not blocked by the site's browser check, so the cron job below will work.

## Option A: in your hosting control panel (recommended)
1. Log in to your hosting account and open **cPanel**.
2. Search for **Cron Jobs** and open it.
3. Under **Add New Cron Job**:
   - **Common Settings:** choose **Once Per Fifteen Minutes** (`*/15 * * * *`).
   - **Command:** paste this exactly:
     ```
     wget -q -O /dev/null "https://beitsisu.com/wp-cron.php?doing_wp_cron" >/dev/null 2>&1
     ```
     If your host says `wget` isn't available, use this instead:
     ```
     curl -s -o /dev/null "https://beitsisu.com/wp-cron.php?doing_wp_cron" >/dev/null 2>&1
     ```
4. Click **Add New Cron Job**. You should see it listed under "Current Cron Jobs".

The cron job runs alongside WordPress's normal visit-based timer, which still works as before. **Don't** add `DISABLE_WP_CRON` to `wp-config.php` unless you want to; it isn't needed.

## Option B: if you can't find Cron Jobs in your hosting panel
Use a free online scheduler, for example **cron-job.org**:
1. Create a free account.
2. Click **Create cronjob**.
3. URL: `https://beitsisu.com/wp-cron.php?doing_wp_cron`
4. Schedule: **every 15 minutes**.
5. Save.

## How to check it worked (the next day)
WordPress admin → **Tools → Site Health**. The "A scheduled event is late" item should be gone. Or tell Claude "check the cron job" and it will check Site Health for you.
