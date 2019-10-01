const cache = require('memory-cache');
const express = require('express');
const app = express();
const router = express.Router();
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');

// Initialised redis to cache response body
const redis = require('redis'),
    client = redis.createClient();
client.on('connect', ()=> console.log('Redis connected'))

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


/**
 * TODO: Update cached page (if there are any updates) : etags (?), last-modified
 *       Show byte sizes
 *       Simple form validation
 * Current Limitations: Can't download assets (External css)
 *                      Dynamic pages
 *                      Strictly one link at a time
 *                      Some pages encounter "Update browser problem" : facebook
 *                      Redis not exited cleanly
 */

app.post('/submit', (req, res) => {
    var targetURL = req.body.targeturl;

    client.get(targetURL, (err, result) => {
        if (err == null && result != null) {
            console.log("sending from memory");
            res.send(result);
        } else {
            request(targetURL, function(error, response, body) {
                if (!error && parseInt(response.statusCode) == 200) { 
                    client.set(targetURL, body, (err, reply) => {
                        if (reply == 'OK') {
                            res.send(body);
                        }
                    })
                    cached_pages[targetURL] = body;
                    cached_bytes[targetURL] = response.socket.bytesRead;
                } else {
                    console.log("invalid url: " + error);
                }
            })
        }
    })
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
