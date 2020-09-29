var admin = require("firebase-admin");
var serviceAccount = require("./firebaseServiceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://crossword-ec05a.firebaseio.com",
});

async function retrieveGameFromDB(gameID) {
    const db = admin.firestore();
    const gameRef = db.collection("games").doc(gameID);
    const storedGame = await gameRef.get();
    return storedGame.exists ? storedGame.data() : undefined;
  }

async function writeGameToDB(game) {
    const db = admin.firestore();
    const storedGame = {};
    const storedInput = {};
    for (let i = 0; i < game.input.length; i++) {
        storedInput[i] = game.input[i]
    }
    storedGame["input"] = storedInput
    const res = await db.collection('games').doc(game.gameID).set(storedGame);
    return res


  }
  module.exports = { retrieveGameFromDB, writeGameToDB };
