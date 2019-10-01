const cache = require('memory-cache');
const express = require('express');
const app = express();
const router = express.Router();
const request = require('request');
const bodyParser = require('body-parser');

var cached_pages = {};
var cached_bytes = {};

app.set('view engine', 'pug')

app.get('/', (req, res)=> {
    res.render('index')
})

app.listen(3000)

app.use(bodyParser.urlencoded({extended: true}))

// Add validation
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
         *       
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

// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36
