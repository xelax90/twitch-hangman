#!/usr/bin/env node
const WebSocketClient = require('websocket').client;

const tmi = require('tmi.js');
const express = require("express");
const fs = require('fs/promises');
const fsSync = require('fs');

let settings = JSON.parse(fsSync.readFileSync('settings.json'));

const client = new tmi.Client({
	channels: settings.channels
});

const hostname = settings.hostname;
const port = settings.port;

let wordlist = [];
let currentWord = null;
let currentGuess = [];
let wonBy = null;

fs.readFile('wordlist.json').then((data) => {
    wordlist = JSON.parse(data);
    console.log(wordlist);
});

client.connect();

client.on('message', (channel, tags, message, self) => {
    if (message.length == 1) {
        guessLetter(message);
    } else {
        guessWord(message, tags['display-name']);
    }
	console.log(`${tags['display-name']}: ${message}`);
});

const app = express();
app.listen(port, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
app.use(express.static('public'));

app.get("/api/start", (req, res, next) => {
    chooseWord();
    res.json(maskedWord(currentWord, currentGuess));
});

app.get("/api/guess", (req, res, next) => {
    guessLetter(req.query.guess);
    res.json(maskedWord(currentWord, currentGuess));
});

app.get("/api/guessWord", (req, res, next) => {
    let result = guessWord(req.query.guess, "Web");
    res.json(result);
});

app.get("/api/status", (req, res, next) => {
    result = {
        word: maskedWord(currentWord, currentGuess),
        wonBy: wonBy,
        solution: wonBy ? currentWord : null
    };
    res.json(result);
});


const maskedWord = (word, guesses) => {
    if (! word) {
        return null;
    }
    let guessString = guesses.join('');
    let guessRegex = new RegExp(`[${guessString}]`, 'i');
    let regex = new RegExp(settings.allowedLetters, 'i');
    var result = "";
    for (var i = 0; i < word.length; i++) {
        var letter = word.charAt(i);

        if (! letter.match(regex)) {
            result += letter;
            continue;
        }
        if (letter.match(guessRegex)) {
            result += letter;
            continue;
        }

        result += '_';
    }
    return result;
}

const chooseWord = () => {
    var wordNumber = Math.floor(Math.random() * wordlist.length);
    currentWord = wordlist[wordNumber];
    currentGuess = [];
    wonBy = null;
    console.log('Current Word: %s', currentWord);
}

const guessLetter = (letter) => {
    letter = letter.charAt(0);
    let regex = new RegExp('^'+settings.allowedLetters+'$', 'i');
    if (letter.match(regex)) {
        if (! currentGuess.includes(letter)) {
            currentGuess.push(letter);
        }
    }
}

const guessWord = (word, user) => {
    if (currentWord.toLowerCase() == word.toLowerCase()) {
        wonBy = user;
        return true;
    }
    return false;
}

