# CEED interface refresh

Display names: CEED, CEED PLANNER, CEED GYM. Repository names, hosting projects,
authentication, cloud tables and existing storage keys remain unchanged.

The shared interface uses warm glass surfaces, a soft lavender/peach glow,
quiet mono wordmarks and a conversational layout. The arrow logo is removed.
Contrast is defined separately for light and dark mode; backdrop blur is limited
to navigation/composer surfaces. Reduced-motion preferences are respected.

Auto · London is the default. Pinned SunCalc 2.1.1 calculates sunrise/sunset
locally for London (51.5074, -0.1278) using the London calendar date. Absolute
instants handle British Summer Time and seasonal variation. Timers re-check at
boundaries and after focus/visibility changes. No GPS, external location service,
model call or recurring server work is used. Light/Dark override Auto until Auto
is selected again. Appearance preference is stored per browser/app; business,
Planner and training records continue using existing cloud sync.

This work is on an isolated feature branch and is presented in Preview first.

The follow-up layout pass uses CEED's open greeting area instead of the illustrated hero, limits the content width, softens type weights, and replaces remaining hardcoded dark statistic and programme surfaces. Training programmes, logs, timers, cloud history and AI Coach remain on the existing components.

The shared draggable lavender character opens the existing quick training coach in a compact panel. It uses saved cloud training records and retains its reply when the panel is closed. Its programme suggestions remain read-only. Unique form IDs keep the coach tab and floating coach accessible when both have been opened. Voice is not activated in this phase.
