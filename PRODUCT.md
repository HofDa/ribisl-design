# Product

## What it is
The website of **ribisl design**: Katrin's upcycling sewing art from Bolzano / Bozen, South Tyrol. She sells one-of-a-kind pieces (vests, bags, hats, baskets, knits) at local markets and gives sewing courses. Instagram: https://www.instagram.com/ribisl_design/

## Navigation
The same nine-screen 3x3 spiral as the ziofungo site (top-left, down, along the bottom, up the right, back along the top, into the center), with the camera, focus pull, minimap, overview, menu and next button. The ziofungo mycelium becomes a red running-stitch thread sewn along the seam allowance of nine fabric patches. It ends in the center by sewing on Katrin's smiley label, and the smiley gets its red copy at that point.

## Scrolling sews
Scrolling (wheel, trackpad, or dragging up and down on touch) moves the needle along the thread through the current screen. Sewing to a screen's edge flies the camera to the next screen, and scrolling back unpicks. The next button, minimap, menu and keys still jump straight to a screen, and the thread sews or unpicks its way there. Screen 2 has a pair of scissors that cut a ribisl label out of the cloth each time you arrive.

## Fabrics
The nine screens are real fabric scans from Poly Haven (CC0, no attribution required): yellow bi-stretch, mint crepe georgette, denim, orange caban (brightened), green gingham, lime poplin, cobalt terry, houndstooth wool bouclé, and blue linen. They are compressed WebP files in `public/fabric/`, about 1.2 MB in total. Cream text sits on the denim and cobalt; on the gingham and plaid, text sits on sewn-on cotton patches.

## The workbench (visitors make something)
- **Screen 1:** cut a square out of the jeans patch behind "ribisl"; the smiley label shows through the hole.
- **Screen 3:** tap or drag the samples into a 2×2 patchwork. "+ Your fabric" lets you photograph an old garment and cut your own square out of it.
- **Screen 5:** the Hats frame shows a bucket hat sewn from your patchwork.
- **Screen 6:** "Try it on!" opens the front camera with MediaPipe face detection (self-hosted, loaded only on tap) and puts a hat on your head. You can take a photo.
- **Screen 7:** the courses are sewing-pattern envelopes you tear open to read the back and "Reserve a spot".
- **Screen 9:** save your hat as a picture.
- **Nothing is stored:** every visit starts fresh. Photos never leave the device.

## Small fun
Workshop sounds (off by default), seams that fray near the mouse, a lost button hidden in the plaid on screen 8, a thread that tangles if you scroll wildly, and a contact smiley that follows the cursor and winks.

## The smiley
Two upright bar eyes inside a deep U, black, as on Katrin's white sewn-in labels. The logo version adds a red copy offset down and to the right. The SVG is `#i-smile` in `index.html`.

## Stack
Plain HTML/CSS/vanilla JS with Vite, canvas for the cloth and thread. DE (at `/`), IT (`/it/`) and EN (`/en/`) are each prerendered at build time, with JSON-LD, sitemap, robots.txt and llms.txt.

## Open decisions / to confirm with Katrin
- **Domain**: `SITE` in `src/site.js` is a placeholder (`https://ribisl.design`).
- **Photos**: the four pieces on screen 5 are empty pattern-piece frames. To fill one, put an `<img>` inside its `<figure>`.
- **Draft copy**: materials (denim, scraps, rope, knits) and the process steps were inferred from her Instagram grid. The course contents (s7) and "replies in German, Italian or English" are unconfirmed. "ribisl = South Tyrolean for redcurrant" should be checked against how she'd put it.
- **Contact**: Instagram only. There is no email address yet.
- No market dates, prices or course dates are on the site. They point to Instagram.
