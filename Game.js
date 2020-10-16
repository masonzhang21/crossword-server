const playerColors = require('./playerColors')
class Player {

    constructor(playerID, color, initialTileLoc, initialWordLoc) {
        this.playerID = playerID
        this.color = color
        this.tileLoc = initialTileLoc
        this.wordLoc = initialWordLoc
    }

}

class Game {
  constructor(gameID, input, secondsElapsed) {
    this.gameID = gameID;
    this.input = input;
    this.secondsElapsed = secondsElapsed
    this.connectedPlayers = {}
    this.syncMode = false
    setInterval(() => {this.secondsElapsed++}, 1000)
    this.availableColors = [...playerColors]
  }

  updateInput(loc, newChar) {
    this.input[loc["row"]][loc["col"]] = newChar;
  }
  updateTile(playerID, tile) {
    this.connectedPlayers[playerID].tileLoc = tile;
  }
  updateWord(playerID, word) {
    this.connectedPlayers[playerID].wordLoc = word;
  }
  updateSyncMode(isSynced) {
    this.syncMode = isSynced
  }
  /**
   * Called when a player joins the game.
   */
  addPlayer(playerID, preferredColor, initialTile, initialWord) {
    let actualColor = preferredColor in this.availableColors ? preferredColor : this.availableColors.pop()
    const newPlayer = new Player(playerID, actualColor, initialTile, initialWord)
    this.connectedPlayers[playerID] = newPlayer
    return newPlayer
  }

  removePlayer(playerID) {
    delete this.connectedPlayers[playerID]
  }

  numPlayers() {
    return Object.keys(this.connectedPlayers).length;
  }
  
}
module.exports = { Game, Player };
