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

// Store the URL and its corresponding bytes
var cached_pages = {};
var cached_pages_expiration_time = {};
var cached_pages_max_age = {};

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
 *       Delete Cache(?)
 * Current Limitations: Can't download assets (External css)
 *                      Dynamic pages
 *                      Strictly one link at a time
 *                      Some pages encounter "Update browser problem" : facebook
 *                      Redis not exited cleanly
 */
 function checkCacheAndSendResponse(req, res, targetURL) {
    client.get(targetURL, (err, result) => {
        var curDate = Date.now();
        
        if (err == null && result != null && !checkIfStale(curDate, targetURL)) {
            console.log("sending from memory");
            res.send(result);
        } else {
            request(targetURL, function(error, response, body) {
                if (!error && parseInt(response.statusCode) == 200) { 
                    // cached_pages_max_age[targetURL] = parseForMaxAge(response.headers['cache-control']);
                    // cached_pages_time[targetURL] = Date.now();
                    cached_pages_expiration_time[targetURL] = Date.now() + parseForMaxAge(response.headers['cache-control']);

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

 function parseForMaxAge(cacheControl) {
     var parsedArr = cacheControl.split(',');
     for(i = 0; i < parsedArr.length; i++) {
         if (parsedArr[i].includes("max-age=")) {
             return 30*1000;
             //return parseInt(parsedArr[i].substring(8)) * 1000;
         }
     }
 }

 function checkIfStale(curTime, targetURL) {
     if (cached_pages_expiration_time[targetURL]) {
        var expirationDate = cached_pages_expiration_time[targetURL];
        console.log("curtime " + curTime);
        console.log("expiration: " + expirationDate);
        if (curTime > expirationDate) {
            console.log(curTime  + " expiration: " + expirationDate);
            console.log("stale request");
            return true;
        }
        return false;
     }

     console.log("not cached");
     return true;

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

app.get('/destroy', (req, res) => {
    client.flushdb( function(err, success) {
        console.log("Redis flushed");
    })
})

// cache header ->20s -> refresh the page in the cache


// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36
// var options = {
//     url: page,
//     headers: {
//       'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36'
//     }
// }
