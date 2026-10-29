# Bottom nav

The floating panel on every main screen: a search bar on top, and under it Today, Agenda, capture, Inbox and Lists.

- White, `radius-nav`, `shadow-nav`, 24px from the bottom and 16px from the sides. Content leaves 164px of space beneath it.
- The search bar spans the full width: 40px tall, `bg` fill, `muted` text. Tapping it opens Search, where the field sits at the top of the screen and the nav shows only the five buttons. Archive and Recently deleted also drop the bar: Archive has its own search field.
- The capture button sits in the middle: 52 × 52, `accent`, `radius-capture`.
- Active tab: `ink`, weight 700, 2px icon stroke. Inactive: `ink-2`, 500, 1.8 stroke.
- The inbox badge counts everything waiting in the inbox, todos and quick notes. No badge at zero.
- The search bar tucks away while you scroll down and comes back on scroll up.
- Settings is not in the nav: it opens from the round avatar on Today's top row.
