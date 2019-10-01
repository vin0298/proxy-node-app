const cache = require('memory-cache');
const express = require('express');
const app = express();
const router = express.Router();
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');
const async = require('async');

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

// Enable form data to be available in req body
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
 function checkCacheAndSendResponse(req, res, targetURL) {
    client.get(targetURL, (err, result) => {
        if (err == null && result != null) {
            console.log("sending from memory");
            res.send(result);
        } else {
            request(targetURL, function(error, response, body) {
                if (!error && parseInt(response.statusCode) == 200) { 
                    console.log("response body length: " + response.socket.bytesRead);
                    client.set(targetURL, body, (err, reply) => {
                        if (reply == 'OK') {
                            res.send(body);
                        }
                    })
                } else {
                    console.log("invalid url: " + error);
                }
            })
        }
    })
 }

 // Limitation: Getting routes of /submit/:url
app.post('/submit', (req, res) => {
    var targetURL = req.body.targeturl;
    checkCacheAndSendResponse(req, res, targetURL);
})

// Routes for type for /submit?url=""
app.get('/submit', (req, res) => {
    var targetURL = req.query.url;
    checkCacheAndSendResponse(req, res, targetURL);
})

function getAllRedisKeyValuePairs(req, res) {
    // Get all the keys(URL) and value.toString().length and render itex
    client.keys('*', function (err, keys) {
        if (err) return console.log(err);
            if (keys) {
                async.map(keys, function(key, callback) {
                   client.get(key, function (error, value) {
                        if (error) return cb(error);
                        cached_pages[key] = value.toString().length;
                        callback(null);
                    }); 
                }, function (error) {
                   if (error) return console.log(error);
                   res.render('test', {cached_pages: cached_pages});
                });
            }
        });
}

app.get('/index', (req, res) => {
    // Get all the keys(URL) and value.toString().length and render itex
    getAllRedisKeyValuePairs(req, res);
})

// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36
// var options = {
//     url: page,
//     headers: {
//       'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
//     }
// }
