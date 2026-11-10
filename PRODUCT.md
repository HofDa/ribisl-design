# Product

## What it is
The website of **ribisl design**: Katrin's upcycling sewing art from Bolzano / Bozen, South Tyrol. She sells one-of-a-kind pieces (vests, bags, hats, baskets, knits) at local markets and gives sewing courses. Instagram: https://www.instagram.com/ribisl_design/

## Navigation
The same nine-screen 3x3 spiral as the ziofungo site (top-left, down, along the bottom, up the right, back along the top, into the center), with the camera, focus pull, minimap, overview, menu and next button. The ziofungo mycelium becomes a red running-stitch thread sewn along the seam allowance of nine fabric patches. It ends in the center by sewing on Katrin's smiley label, and the smiley gets its red copy at that point.

## Scrolling sews
Scrolling (wheel, trackpad, or dragging up and down on touch) moves the needle along the thread through the current screen. Sewing to a screen's edge flies the camera to the next screen, and scrolling back unpicks. The next button, minimap, menu and keys still jump straight to a screen, and the thread sews or unpicks its way there. Screen 2 has a pair of scissors that cut a ribisl label out of the cloth each time you arrive.

## Fabrics
The nine screens are real fabric scans from Poly Haven (CC0, no attribution required): yellow bi-stretch, raspberry waffle piqué (recoloured from the yellow scan), denim, orange caban (brightened), teal curly-teddy tartan fleece (saturation boosted), lime poplin, cobalt terry, teal scuba suede (brightened), and blue linen. The calm teal suede on screen 8 lets the red thread and the cream patches stand out. They are compressed WebP files in `public/fabric/`, about 0.9 MB in total. Cream text sits on the denim and cobalt; on the tartan and the suede, text sits on sewn-on cotton patches. The cloth keeps its full colour in system dark mode too.

## The workbench (visitors make something)
- **Screen 1:** cut a square out of the jeans patch behind "ribisl"; the smiley label shows through the hole.
- **Screen 2:** Katrin's cut-out portrait wears giant round sunglasses that drop onto her nose when you arrive; tap her and she pushes them up into her hair.
- **Screen 4 ("Alter Stoff. Neuer Hut."):** design a reversible bucket hat. Tap the Outside or Inside square to photograph an old garment and cut that side's fabric out of it, or tap / drag a sample onto a side.
- **Screen 5:** the Hats frame shows your reversible hat, both sides; tap it to turn it inside out.
- **Screen 6:** "Try it on!" opens the front camera with MediaPipe face detection (self-hosted, loaded only on tap) and puts a hat on your head: either side of the market hat, or either side of yours. You can take a photo.
- **Screen 7:** the courses are sewing-pattern envelopes you tear open to read the back and "Reserve a spot". Below them, references (no dates on purpose): UpCon Brixen, a workshop at Schloss Runkelstein, the Creative Week of Jugenddienst Bozen, "many local markets and events", and an invitation to ask Katrin for a stall at your event. Closing line: "Aus Alt mach Lieblingsstück."
- **Screen 9:** keep your hat as a picture. Where the device has a share menu (phones), “Share” is the only button: the menu already offers saving the image and posting it to Instagram, and a download would only bring up the browser’s own “download from …” prompt. Elsewhere (most computers) the picture is downloaded, with directions to the Downloads folder. The try-on photo works the same way, and its caption is copied to the clipboard, ready to paste under the post.
- **Nothing is stored:** every visit starts fresh. Photos never leave the device.

## Small fun
Workshop sounds (off by default), seams that fray near the mouse, a lost button hidden in the cobalt terry on screen 7, a Schmunzelsteinchen on screen 8 that turns round when tapped, a thread that tangles if you scroll wildly, and a contact smiley that follows the cursor and winks.

## The smiley
Two upright bar eyes inside a deep U, black, as on Katrin's white sewn-in labels. The logo version adds a red copy offset down and to the right. The SVG is `#i-smile` in `index.html`.

## Stack
Plain HTML/CSS/vanilla JS with Vite, canvas for the cloth and thread. DE (at `/`), IT (`/it/`) and EN (`/en/`) are each prerendered at build time, with JSON-LD, sitemap, robots.txt and llms.txt.

## Open decisions / to confirm with Katrin
- **Domain**: `SITE` in `src/site.js` is a placeholder (`https://ribisl.design`).
- **Photos**: screen 5 shows cut-outs of real pieces (two vests, a belt bag, pouches, the toadstool hat, a backpack), made from photos sent during development. Confirm with Katrin they may be used. The frames for vests, bags and hats are stacks that swap every few seconds.
- **Draft copy**: materials (denim, scraps, rope, knits) and the process steps were inferred from her Instagram grid. The course contents (s7) and "replies in German, Italian or English" are unconfirmed. "ribisl = South Tyrolean for redcurrant" should be checked against how she'd put it.
- **Contact**: Instagram only. There is no email address yet.
- **References (s7)**: UpCon (REX Brixen) is documented under the name ribisl. The Runkelstein workshop (listed as "Kathrin Unterhofer") and the Creative Week (Katrin Unterhofer, no mention of ribisl) still need Katrin to confirm they were her. The Green House Party at Jump was left out on purpose.
- **Katrin's photo (s2)**: `public/katrin/katrin.webp` is cut out of a selfie (background and the pink "Ribisl" sticker removed, pinking-shears edge). The giant red sunglasses are an SVG drawn over it, not part of the photo. Confirm with Katrin that she's happy with the photo and the joke.
- No market dates, prices or course dates are on the site. They point to Instagram.
