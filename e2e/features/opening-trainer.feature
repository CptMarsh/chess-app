Feature: Opening trainer

  Background:
    Given the explorer replies in turn:
      | e7e5 | e5  |
      | b8c6 | Nc6 |
      | a7a6 | a6  |
      | g8f6 | Nf6 |
    And the player starts a line with the rating "1450"

  Scenario: The app replies to your first move
    When the player plays "e2e4"
    Then the moves are "1. e4 e5"
    And the status is "your move"

  Scenario: The app replaces a bad move with the best move
    When the player plays "e2e4 f1a6"
    Then the message starts with "Ba6 loses"
    And the moves do not contain "Ba6"

  Scenario: The line ends after 5 of your moves
    When the player plays "e2e4 g1f3 f1b5 b5a4 e1g1"
    Then the moves are "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O"
    And the status is "line ended"

  Scenario: Lichess does not accept the token
    Given the explorer refuses the token
    When the player plays "e2e4"
    Then the message is "Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token."
    And the status is "line ended"
