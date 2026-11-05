# Orbis Orbital Notes · Design QA

2026-11-05 · PR #73 · **final result: passed** for the local rendered scope below. No remaining P0/P1/P2 issue was found in these representative flows. This is not a production deployment or full accessibility certification.

## Reference and scope

The user selected the Orbital Notes light concept and approved its dark desktop/mobile versions, then requested deeper Orbis-specific meaning. The implementation preserves the article-first composition, orbital brand image, restrained typography and asymmetric reading rows. It uses actual published content and adds real Topic relations and Knowledge review states.

The approved generated concepts and rendered implementation were compared together at equal panel widths, including focused header/type and phone comparisons. This is a design-system/composition assessment, not a pixel-identical claim: real summaries are longer, the user approved added semantic sections, and system font rendering varies.

Desktop browser content was approximately 1197 CSS pixels wide. Narrow tests used 320/393/768 CSS-pixel iframes with a 15-pixel classic scrollbar. These are browser reflow checks, not physical devices.

## Fixed and rechecked

1. Dark orbital illustration initially lacked contrast; separate light/dark generated transparent assets now render cleanly on both backgrounds.
2. Overexplained product copy was shortened. Relationships are established by real shared-topic metadata rather than disclaimers.
3. Hero summary increased to 17.2px desktop / 16.4px phone. Discovery summaries are clamped, while article content remains complete.
4. Topic/index heading hierarchy now uses h1 → h2 where no section h2 exists. Topic content has visible publication dates in newest-first order; Knowledge's grouped h2/h3 hierarchy is retained.
5. Slidev's inherited 0.5 cover-summary opacity was removed. The light summary is opaque #606B76 on #FAFAF7, approximately 5.2:1; dark uses the semantic muted color.
6. Persistent navigation and appearance controls increased to 14px while keeping 44px targets. At 320px there is no page overflow and the main 48px reading CTA begins around y527.
7. Generated/native automatic-theme tabs no longer fight. They intentionally share color preference; this does not isolate native preferences. Native author fixed color schemes, custom styling and files remain unchanged.
8. The phone reading return originally shrank inside Slidev's canvas. A real-source-only link now sits outside the canvas. It measured about 81×46 CSS pixels and remained separate from the theme control at 320px.

## Browser actions verified

- Dark selection survives refresh and home → Daily; light selection propagates across Web tabs; system mode matches the current device appearance.
- Keyboard Tab reveals the skip link; Enter focuses the main content. Daily contents links reach the intended heading without obstruction.
- Archive unmatched search yields 0/27 and a useful empty state; clear restores 27/27 and the URL. Controls measured 44–45px.
- Home, Daily and Archive have no horizontal page overflow at the sampled narrow widths.
- Knowledge distinguishes active editorial status from an overdue review date and correctly shows the current entry's 2026-11-01 review due date.
- Generated and native automatic-theme tabs cooperate without observed loops or flicker. Native choices can become the site's explicit light/dark preference; generated system mode follows the device.
- Daily `#/11` direct entry and refresh remain at 11/11. Both the last-slide and external phone return controls reach the correct reading article.
- Weekly `#/2` refresh remains at 2/8; native `#/2` remains at 2/4 with no injected Orbis selector. A Talk without a reading source has no fabricated return link.
- The inspected browser log contained no observed Orbis application error; extension-origin messages were excluded.

## Engineering checks

The complete build passed, including validation and multi-presentation fixtures. After the last refinements, all 39 Web pages and all 27 production presentations were rebuilt, assembled and passed artifact checks. The final reading-UI suite passed, including appearance matrices, contrast roles, cross-tab/bfcache/blocked-storage behavior and timer-based Slidev race tests. Exact-commit CI and public preview results are recorded in the PR discussion rather than claimed by this local browser review.

## Independent score

| Dimension | Weight | Score |
| --- | ---: | ---: |
| Brand / visual identity | 20% | 9.2 |
| Reading | 25% | 9.1 |
| Discovery | 20% | 9.2 |
| Responsive use | 15% | 8.9 |
| Representative accessibility | 15% | 9.0 |
| Consistency | 5% | 9.1 |

Weighted result: **9.095, rounded to 9.1/10**. This independently evaluates the new direction, not the earlier warm-paper round's 9.0.

## Evidence and limits

[Rendered screenshots and implementation report](docs/reviews/2026-11-05-orbital-notes.md).

Actual OS switching, JavaScript-disabled browsing, first-frame filmstrip, physical iOS/Safari/Android, pinch zoom and screen-reader speech were not independently exercised. Those browser actions must not be conflated with the automated listener/storage tests or code-level no-JS/print contracts. Slides retain a fixed presentation canvas; the reading version is the comfortable portrait-reading route.

The appearance adapter observes the pinned Slidev 52.19.1 storage-event convention and requires revalidation on upgrade. Same-origin automatic-theme decks share preferences. Old numeric `/11` URLs are not migrated; new hash links are supported. No merge or production deployment was performed.

Optional P3 follow-ups: real-device checks, and content-kind grouping within large Topic archives.

final result: passed
