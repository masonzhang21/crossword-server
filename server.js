var Game = require('./Game').Game
const {retrieveGameFromDB, writeGameToDB} = require('./firestoreIO')
// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;




server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
//app.use(express.static(path.join(__dirname, 'public')));

var games = {};
//to newly joining players, also pass timer, syncMode, completed. Store timer, completed when writing.
io.on('connection', (socket) => {
  let gameID
  let playerID
  let game

  socket.on('join', async (data) => {
    gameID = data.gameID
    playerID = data.playerID
    
    //First player to join. Construct the game room.
    if (!(gameID in games)) {
      let storedGame = await retrieveGameFromDB(gameID)
      if (storedGame) {
        //input stored as object of 1D arrays since firestore doesn't allow nested arrays
        const input = Object.values(storedGame.input)
        games[gameID] = new Game(gameID, input)
      } else {
        //Upon initial creation of multiplayer game (executes once per gameID). Uses the user's current state of game as the initial input grid. 
        games[gameID] = new Game(gameID, data.curInput)
      }
    }

    game = games[gameID]
    let playerColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
    game.addPlayer(playerID, playerColor, data.curTile, data.curWord)
    socket.join(gameID)
    socket.emit("ready", game)
    socket.to(gameID).emit("newPlayer", game.connectedPlayers[playerID])
  })
  
  socket.on('onInputC2S', (data) => {
      game.updateInput(data.loc, data.tileInput)
      io.in(gameID).emit("onInputS2C", data.loc, data.tileInput)
  })
  
  socket.on('focusedChangeC2S', (tile) => {
    if (tile == null) {
      socket.emit("focusedChangeS2C", tile)
      return
    }

    if (game.syncMode) {
      for (const player in game.connectedPlayers) {
        game.updateTile(player, tile)
      }
    } else {
      game.updateTile(playerID, tile)
    }
    socket.in(gameID).emit("tileChangeS2C", playerID, tile)
    socket.emit("focusedChangeS2C", tile)
  })

  socket.on('tileChangeC2S', (tile) => {
    if (game.syncMode) {
      for (const player in game.connectedPlayers) {
        game.updateTile(player, tile)
      }
    } else {
      game.updateTile(playerID, tile)
    }
    io.in(gameID).emit("tileChangeS2C", playerID, tile)
  })
  socket.on('wordChangeC2S', (word) => {
    if (game.syncMode) {
      for (const player in game.connectedPlayers) {
        game.updateWord(player, word)
      }
    } else {
      game.updateWord(playerID, word)
    }
    io.in(gameID).emit("wordChangeS2C", playerID, word)    //emit to everyone in the room the updated word (currentWord)
  })
  socket.on('syncC2S', (isSynced) => {
    game.updateSyncMode(isSynced)
    io.in(gameID).emit("syncS2C", isSynced)
  })
  socket.on('disconnect', async (data) => {
    console.log("disc")
    game.removePlayer(playerID)
    socket.to(gameID).emit("playerLeft", playerID)
    if (game.numPlayers() === 0) {
      await writeGameToDB(game)
      delete games[gameID]
    }
  })

});
