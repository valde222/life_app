# Lifecycle: an open todo

Where a todo that isn't done sits. None of this is stored as a status: it comes from `inbox`, `list` and `date`.

```mermaid
stateDiagram-v2
  [*] --> Inbox : captured with no list
  [*] --> InList : captured into a list
  Inbox --> OnToday : Put on Today
  Inbox --> InList : Move to
  Inbox --> Dated : Pick a date
  InList --> OnToday : Put on Today
  InList --> Dated : Date…
  Dated --> OnToday : the day arrives
  OnToday --> LeftOver : midnight, not done
  LeftOver --> OnToday : Pick for today

  InList : In a list
  OnToday : Today
  Dated : Dated later
  LeftOver : Left over
```

- A todo captured with a date and no list keeps `inbox` on, so it's in the Inbox and on Today at once until it's moved.
- An event (`is_event`) has no tick box and never becomes left over.
