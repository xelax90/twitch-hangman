#!/usr/bin/env node
const WebSocketClient = require('websocket').client;

const tmi = require('tmi.js');
const express = require("express");
const fs = require('fs/promises');

const client = new tmi.Client({
	channels: [ 'xelax90' ]
});

const hostname = '127.0.0.1';
const port = 3000;

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
	// "Alca: Hello, World!"
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
    guessString = guesses.join('');
    let regex = new RegExp(`[^${guessString}-]`, 'gi');
    let maskedWord = word.replaceAll(regex, '_');
    return maskedWord;
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
    if (letter.match(/[a-zA-Z]/g)) {
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

