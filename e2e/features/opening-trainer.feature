Feature: Opening trainer

  Background:
    Given the explorer replies in turn:
      | e7e5 | e5  | 42 |
      | b8c6 | Nc6 | 61 |
      | a7a6 | a6  | 55 |
      | g8f6 | Nf6 | 48 |
    And the player opens the app

  Scenario: The app replies to your first move
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the moves are "1. e4 e5 (42%)"
    And the status is "your move"
    And the Moves field shows "10"

  Scenario: The app replaces a bad move with the best move
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4 f1a6"
    Then the message starts with "Ba6 loses"
    And the moves do not contain "Ba6"
    And the eval shows a pawn value
    And the eval bar has a height
    And the accuracy is "0 of 1 correct (0%)"

  Scenario: The line ends after 5 of your moves
    Given the player chooses 5 moves
    And the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3 f1b5 b5a4 e1g1"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) 3. Bb5 a6 (55%) 4. Ba4 Nf6 (48%) 5. O-O"
    And the status is "line ended"

  Scenario: Lichess does not accept the token
    Given the explorer refuses the token
    And the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the message is "Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token."
    And the status is "line ended"

  Scenario: You play Black
    Given the explorer replies in turn:
      | e2e4 | e4  | 52 |
      | g1f3 | Nf3 | 70 |
    And the player chooses the color "Black"
    And the player starts a line with the rating "1450"
    Then the moves are "1. e4 (52%)"
    And the board shows the Black side
    When the player plays "e7e5"
    Then the moves are "1. e4 (52%) e5 2. Nf3 (70%)"
    And the status is "your move"

  Scenario: The line ends after the number of moves that you choose
    Given the player chooses 3 moves
    And the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3 f1b5"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) 3. Bb5"
    And the status is "line ended"
