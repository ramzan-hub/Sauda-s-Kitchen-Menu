# Sauda's Kitchen menu

A buildless, menu-only Indian and Kerala restaurant website using HTML, CSS and vanilla JavaScript. No installation or framework is required.

## Preview

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`.

## Edit

- `menu.js`: all ten dishes, prices in SAR, exact image filenames, descriptions, reviewed component anchors, and gesture logic.
- `styles.css`: desktop and mobile compositions, typography, rotation, and reduced-motion support.
- `index.html`: semantic page structure and the initial dish.
- `images/`: original supplied images, unchanged.
- `assets/thumbnails/`: lightweight derivatives used by navigation; regenerate these separately if photos change.
- `assets/display/`: 840px WebP display derivatives for mobile. Desktop keeps the original PNGs. Mobile preloading selects the matching WebP source rather than downloading the original PNG.

The optional Google Fonts stylesheet supplies Italiana and DM Sans; local serif and sans-serif fallbacks work without an internet connection. All interactions and images are served locally. The restaurant is home delivery only. The Contact button opens a native dialog with both supplied `tel:` links and the supplied `mailto:` link, with Escape dismissal and focus trapping. No ordering or booking features are included.

## Navigation and motion

Browse with previous/next buttons, left/right keyboard arrows, dish index buttons, desktop wheel gestures, or horizontal swipes on the main plate. Wheel inertia is throttled and transitions reuse two wrappers. Buttons and keyboard input use the queued or in-flight destination so rapid navigation and wrapping remain correct.

Mobile uses a single Pointer Events recognizer. Horizontal movement reacts at a responsive 30–42px threshold; a short deliberate release can qualify using distance and velocity. Each pointer contact triggers at most once. Repeated swipes during a roll replace one queued destination relative to the in-flight dish, keeping the latest direction without creating a backlog. Vertical intent, multitouch, pointer cancellation and small movements do not navigate. Passive listeners and `touch-action: pan-y pinch-zoom` preserve browser scrolling and zooming. The original handler waited for touch release, ignored velocity, and discarded gestures throughout the full transition; these were the mobile responsiveness defects.

Each image has one persistent, automatically started Web Animations API rotation: a 30-second clockwise revolution. Actual desktop mouse movement over the photograph pauses rotation; mouse leave resumes the same animation time. Mobile hover cannot pause it. Hidden plates, background pages and reduced-motion preferences pause ambient rotation. This replaces the old 100-second CSS animation and mixed CSS/inline play-state lifecycle, which made motion difficult to perceive and restarted rotation when hidden slots were reused.

The separate plate wrapper rolls for 1.05 seconds on desktop and 680ms on mobile. Translation and angular travel share easing and follow angle = distance / radius. Images stay opaque, retain their proportions, and enter/exit beyond viewport boundaries. Finished wrapper angles are retained before transition animations are removed to prevent angle resets. Text exits gently and enters upward; dish data and selected state update together during the roll. No GSAP dependency or continuous JavaScript rendering loop is needed. Decoded image caching is bounded to the active dish, neighboring dishes and any pending destination.

## Ingredient callouts

`ingredientAnnotations` in `menu.js` is keyed by the exact original PNG filename. Labels identify visually recognizable dish components, not a verified ingredient or allergen specification. Each anchor uses normalized percentages (0–100) of the original image, including transparent margins. All ten compositions were inspected. Uncertain or hidden ingredients, including powders and indistinct gravy, are omitted rather than assigned misleading connectors.

Desktop hover freezes the current ambient angle, subtly dims surrounding content, and draws fine SVG connectors to labels in the nearest available corners. Coordinates account for contain-fit dimensions, non-square sources, the retained rolling-wrapper angle and the paused ambient transform. Two one-off rendering frames allow the pause to commit; no continuous JavaScript loop is used. ResizeObserver recalculates open annotations when the plate size changes. Navigation clears annotations before rolling.

Mobile's existing 44px **Explore Ingredients** toggle now pauses the existing rotation and reveals small orange hotspots without ingredient names. Tapping a hotspot selects a single upright label in the existing gap below the plate; another tap switches or deselects it. The original list is hidden. Invisible 44px targets select the nearest visible marker when they overlap. Close fades the markers out and resumes the same animation time. Hotspot positions reuse the existing image anchors and include contain-fit, ambient rotation and the retained rolling-wrapper transform; ResizeObserver realigns them while open. Plate gestures are suppressed only during mobile exploration, while navigation controls still work and close the ingredient UI automatically. Phone-width layouts, hover/pointer capability and actual tablet input select exactly one presentation. Mouse desktop callouts, swipe thresholds, and all rolling/rotation timings are unchanged. Desktop keyboard users can focus the same control to reveal it, and Escape dismisses annotations. All pictographic Unicode symbols were replaced with inline SVG or CSS geometry.

The exact KURO reference guide was unavailable during implementation; the supplied design brief informed the composition.

## Verification

Phase 1 browser checks passed for all ten full-size photographs and navigation thumbnails, matching active states, previous/next wrapping, keyboard arrows, desktop mouse-wheel navigation, rapid-click transition cleanup, and mobile index selection. Responsive layouts were checked at widths 320, 390, 430, 768, 900, 901, 1024 and 1440 pixels without horizontal overflow.

Phase 2 browser checks verified automatic rotation before interaction, desktop hover pause and mouse-leave resume, all ten photographs and their matching menu states, forward/backward wrapping, rapid relative navigation, keyboard and wheel input, exact contact link values, native dialog dismissal, and mobile widths 360, 390 and 430. Image hashes confirm all ten original PNG files are byte-for-byte unchanged. No JavaScript errors were reported; JavaScript syntax also passed.

Phase 3 browser checks passed for all ten desktop PNGs and their callouts, all five requested mobile widths (320, 360, 375, 390 and 430), 44px main tap targets, mobile WebP selection, contact link values, native mobile-page scrolling, keyboard/wheel/arrow navigation, and absence of horizontal overflow or console errors. The regression fixture passed synthetic gesture tests and independent trigonometric connector checks after paused rotation and rolling, including the non-square ghee-rice photograph. Public source and rendered text/ARIA labels were checked for emoji code points. All menu data and original PNG hashes are unchanged. Updated previews include `preview-ingredients-desktop.jpg` and `preview-ingredients-mobile.jpg`.

For repeatable animation regression tests, serve the project and open `http://localhost:8000/tests/animation.html`, then click **Run checks**. The fixture runs the unchanged production code in an iframe. Phase 3 checks cover rotation timing, all ten images, center positioning, latest-intent swipe queuing, velocity recognition, vertical/multitouch rejection, the mobile ingredient toggle, connector positions after rotation and rolling (including a non-square source), emoji absence, and simulated JavaScript reduced-motion preference changes during navigation. The fixture lives outside the public menu and introduces no production test hooks.

Physical-device touch gestures, Safari/Chrome device performance and native OS reduced-motion preference toggling have not been tested. The fixture's Pointer Events are synthetic and its reduced-motion override tests JavaScript behavior, not CSS media-query emulation; the CSS reduced-motion rule was inspected separately.

## Mobile hotspot verification

The updated browser regression fixture checks initial hidden labels, single selection and deselection, 44px targets, overlapping hit targets, gesture suppression while open, rotation pause/resume continuity, nine combinations of mobile width and paused angle, resizing while open, label clearance above the original controls, navigation cleanup, hybrid tablet input switching, and the unchanged desktop SVG geometry. Touch events in this fixture are synthetic; physical-phone testing remains unverified.
