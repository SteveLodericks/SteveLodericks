flowchart TD
  Start[Visitor opens github com slash SteveLodericks] --> Render[GitHub renders README content]
  Render --> DecisionInteract{Interact beyond browsing}
  DecisionInteract -->|No| End[Visitor reads content]
  DecisionInteract -->|Yes| SignIn[User signs in]
  SignIn --> DecisionSign{Sign in successful}
  DecisionSign -->|No| Recovery[Forgot password flow]
  Recovery --> SignIn
  DecisionSign -->|Yes| Dashboard[GitHub Dashboard]
  Dashboard --> OwnerDecision{Is user owner}
  OwnerDecision -->|Yes| OwnerFlow[Modify profile README]
  OwnerFlow --> Edit[Click pencil icon to edit README]
  Edit --> Commit[Commit changes]
  Commit --> Render
  OwnerDecision -->|No| NonOwnerFlow[Star or follow profile]
  NonOwnerFlow --> End
  Render --> ClickLinks[Click project or badge link]
  ClickLinks --> NewTab[Link opens in new tab]