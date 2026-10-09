Feature: Opening book input

  Scenario: A saved PGN shows in the line count
    Given the app has no book
    When the player pastes '[Orientation "black"] 1. e4 e5 2. Nf3' and saves
    Then the page shows "Black: 1 line"

  Scenario: Saved lines stay after a reload
    Given the player saved '[Orientation "white"] 1. e4 e5'
    When the player saves '[Orientation "white"] 1. d4 d5' and reloads the page
    Then the page shows "White: 2 lines"

  Scenario: A rejected PGN shows its message
    Given the app has no book
    When the player saves '1. e4 e5'
    Then the page shows 'Add [Orientation "white"] or [Orientation "black"] to the PGN.'
