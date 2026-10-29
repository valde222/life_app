# Button

Three kinds of button.

- **Primary:** `accent` fill, `on-accent` text, `button` style. One per sheet or card. Its label says where the thing goes when that matters ("Save to Client A").
- **Secondary:** white on `bg`, or `bg` on white, `ink` text. Destructive secondary actions use `overdue-fg` text, not a red fill.
- **Add:** a dashed `dashed` outline with `accent` text, for adding to a list ("+ Pick for today").
- Heights: 52px for sheet actions, 44px for actions inside a card. Radius 16px for full-width, `radius-control` inside cards.
