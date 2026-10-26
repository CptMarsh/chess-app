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
    And the page background is "rgb(22, 17, 13)"
    And the font "Karla" is loaded

  Scenario: After a mistake, you see the refutation and you play an acceptable move
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4 f1a6"
    Then the message is "Ba6 loses 6.4 pawns. Play Nf3, Nc3 or Bc4."
    And the status is "try again"
    And the moves are "1. e4 e5 (42%) (2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)"
    And the accuracy is "0 of 1 correct (0%)"
    When the player clicks the move "Nxa6"
    Then the board has a "black knight" on "a6"
    And the eval bar shows a number
    When the player presses "ArrowDown"
    And the player plays "g1f3"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)"
    And the eval bar has a height
    And the eval bar shows a number

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
    Then the message is "Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token, then click Change token in the settings."
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
    And the eval bar shows a number
    When the player presses "ArrowUp"
    Then the eval bar shows no number
    When the player presses "ArrowDown"
    Then the eval bar shows a number

  Scenario: The line ends after the number of moves that you choose
    Given the player chooses 3 moves
    And the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3 f1b5"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) 3. Bb5"
    And the status is "line ended"

  Scenario: You move through the moves
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3"
    Then the status is "your move"
    When the player presses "ArrowLeft"
    Then the highlighted move is "Nf3"
    And the board has a "black knight" on "b8"
    When the player presses "ArrowUp"
    Then the board has a "white pawn" on "e2"
    When the player presses "ArrowDown"
    Then the highlighted move is "Nc6"
    And the board has a "black knight" on "c6"
    When the player clicks the move "e4"
    Then the highlighted move is "e4"
    And the board has a "black pawn" on "e7"
    When the player presses "ArrowRight" in the "Rating" field
    Then the highlighted move is "e4"

  Scenario: You use the app on a phone
    Given the screen is 390 by 844 pixels
    And the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3"
    Then the status is "your move"
    And the move list is under the board
    And the page does not scroll sideways
    When the player clicks "Back"
    Then the highlighted move is "Nf3"
    And the board has a "black knight" on "b8"
    When the player clicks "Start"
    Then the board has a "white pawn" on "e2"
    When the player clicks "Forward"
    Then the highlighted move is "e4"
    When the player clicks "End"
    Then the highlighted move is "Nc6"
    And the board has a "black knight" on "c6"

  Scenario: You use the app on a big monitor
    Given the screen is 1920 by 950 pixels
    And the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3"
    Then the board is more than 900 pixels wide
    And the move list is at the right of the board
    And the text of the move list is 15 pixels
    And the page does not scroll sideways
    And the page does not scroll down

  Scenario: You explore from an old position
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3"
    Then the status is "your move"
    When the player presses "ArrowLeft"
    And the player presses "ArrowLeft"
    Then the highlighted move is "e5"
    When the player plays "f1c4 g8f6"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4 Nf6)"
    And the highlighted move is "Nf6"
    And the eval bar shows a number
    And the status is "your move"
    When the player presses "ArrowLeft"
    And the player plays "b8c6"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4 Nf6 (2... Nc6))"
    When the player presses "ArrowDown"
    And the player plays "f1b5"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4 Nf6 (2... Nc6)) 3. Bb5 a6 (55%)"

  Scenario: You see 3 engine lines in explore mode
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the status is "your move"
    And the engine lines are hidden
    When the player presses "ArrowLeft"
    Then the engine shows 3 lines from "1... "
    When the player presses "ArrowDown"
    Then the engine lines are hidden

  Scenario: You delete a variation
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3"
    Then the status is "your move"
    When the player presses "ArrowLeft"
    And the player presses "ArrowLeft"
    And the player plays "f1c4 g8f6"
    When the player right-clicks the move "Nf6"
    And the player clicks "Delete from here"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4)"
    And the highlighted move is "Bc4"
    When the player presses "Delete"
    Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%)"
    And the highlighted move is "e5"

  Scenario: You copy the PGN
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4 g1f3"
    Then the status is "your move"
    When the player presses "ArrowLeft"
    And the player presses "ArrowLeft"
    And the player plays "f1c4 g8f6"
    And the player clicks "Copy PGN"
    Then the clipboard has "1. e4 e5 2. Nf3 (2. Bc4 Nf6) 2... Nc6 *"
    And the copy button is an icon named "Copied"

  Scenario: The settings are behind the cog
    Then the settings are open
    Given the player starts a line with the rating "1450"
    Then the settings are closed
    When the player clicks the cog
    Then the settings are open
    When the player presses "Escape"
    Then the settings are closed

  Scenario: The app keeps the settings
    Given the player chooses the color "Black"
    And the player chooses 5 moves
    And the player starts a line with the rating "1450"
    When the player reloads the app
    Then the settings are closed
    And the Rating field shows "1450"
    And the Color field shows "Black"
    And the Moves field shows "5"

  @withoutToken
  Scenario: The app asks for your token
    Then the token dialog is open
    And the token dialog has no Cancel button
    When the player presses "Escape"
    Then the token dialog is open
    When the player saves the token ""
    Then the token message is "Paste your Lichess token."
    And the token dialog is open
    When the player saves the token "  my-token "
    Then the token dialog is closed
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the moves are "1. e4 e5 (42%)"
    And the explorer got the token "my-token"
    When the player reloads the app
    Then the token dialog is closed

  Scenario: You change the token
    When the player clicks "Change token" in the settings
    Then the token dialog is open
    When the player saves the token "new-token"
    Then the token dialog is closed
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the moves are "1. e4 e5 (42%)"
    And the explorer got the token "new-token"

  Scenario: The app replies with a move of your opponents on chess.com
    Given the player has these chess.com games:
      | white | 1450 | e4 c5 |
      | white | 1550 | e4 c5 |
      | white | 1900 | e4 e5 |
      | black | 1450 | d4 d5 |
    And the player chooses the source "chess.com" and the username "MyName"
    And the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the moves are "1. e4 c5 (100%)"
    And the status is "your move"

  Scenario: The source and the username stay after a reload
    Given the player chooses the source "chess.com" and the username "MyName"
    When the player reloads the app
    Then the source is "chess.com" and the username is "MyName"

  Scenario: chess.com does not know the username
    Given chess.com has no player "Nobody"
    And the player chooses the source "chess.com" and the username "Nobody"
    And the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the message is "chess.com has no player Nobody."

  @withoutToken
  Scenario: The app does not ask for the Lichess token when the source is chess.com
    Given the player saves the token "my-token"
    And the player chooses the source "chess.com" and the username "MyName"
    And the Lichess token is removed
    When the player reloads the app
    Then the token dialog is closed

  Scenario: You hear the moves
    Given the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the moves are "1. e4 e5 (42%)"
    And the status is "your move"
    And the app played 2 sounds
    When the player presses "ArrowLeft"
    Then the app played 2 sounds
    When the player clicks "Forward"
    Then the app played 3 sounds

  Scenario: You turn the sound off
    Given the player turns the sound off
    And the player starts a line with the rating "1450"
    When the player plays "e2e4"
    Then the moves are "1. e4 e5 (42%)"
    And the app played 0 sounds
    When the player reloads the app
    Then the sound is off
