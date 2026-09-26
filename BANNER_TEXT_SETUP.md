# Admin-editable article banner text

The visitor article pages now render informational text boxes directly **above** and **below** the primary HilltopAds banner. The same two messages appear around the optional second banner only when that zone is configured. The compact timer remains between the two banner placements. The existing timer and both delayed Continue buttons are unchanged.

In **Admin > Article banner text**, edit either message (up to 500 plain-text characters) and click **Save banner text**. Empty fields hide their text box. Settings are stored in the existing PostgreSQL `settings` table; no new table or migration is necessary. They work on an existing database, with defaults until saved. Do not put HTML or JavaScript into these messages.

No extra advertisement scripts have been added. Banner delivery depends on HilltopAds; setting these messages does not guarantee ad fill. To avoid a duplicate/blank lower ad, configure a second independent HilltopAds 300×250 zone as described in ARTICLE_ADS_SETUP.md. Homepage and admin remain ad-free.

Upload the full source to GitHub and deploy. Keep `.env` files, API credentials, and node_modules out of Git.
