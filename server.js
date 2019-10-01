const cache = require('memory-cache');
const express = require('express');
const app = express();
const router = express.Router();
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');

// Store the response body of cached pages
var cached_pages = {};
// Store the bytesRead of the response body stored
var cached_bytes = {};

app.set('view engine', 'pug')

app.get('/', (req, res)=> {
    res.render('home')
})

app.listen(8000)

app.use(bodyParser.urlencoded({extended: true}))

app.post('/submit', (req, res) => {
    var targetURL = req.body.targeturl;
    if (targetURL in cached_pages) {
        console.log("Sending from memory....");
        res.send(cached_pages[targetURL]);
    } else {
        /**
         * TODO: Update cached page (if there are any updates)
         *       Show byte sizes
         *       Simple form validation
         * Current Limitations: Can't download assets (External css)
         *                      Dynamic pages
         *                      Strictly one link at a time
         */
        request(targetURL, function(error, response, body) {
            if (!error && parseInt(response.statusCode) == 200) { 
                cached_pages[targetURL] = body;
                cached_bytes[targetURL] = response.socket.bytesRead;
                res.send(body);
            } else {
                console.log("invalid url: " + error);
            }
        })
    } 
})

app.get('/index', (req, res) => {
    res.render('test', {cached_pages: cached_pages, cached_bytes: cached_bytes});
})

// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36
// var options = {
//     url: page,
//     headers: {
//       'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
//     }
