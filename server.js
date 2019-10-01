const cache = require('memory-cache');
const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const request = require('request');
const bodyParser = require('body-parser');

var cached_pages = {};

app.set('view engine', 'pug')

app.get('/', (req, res)=> {
    res.render('index')
})

app.listen(3000)

app.use(bodyParser.urlencoded({extended: true}))

// Add validation
app.post('/submit', (req, res) => {
    var targetURL = req.body.targeturl;
    console.log("target url: " + targetURL);
    if (targetURL in cached_pages) {
        console.log("sending from memory");
        res.send(cached_pages[targetURL]);
    } else {
        request(targetURL, function(error, response, body) {
            cached_pages[targetURL] = body;
            res.send(body);
        })
    } 
})
