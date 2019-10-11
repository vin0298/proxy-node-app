const cache = require('memory-cache');
const express = require('express');
const app = express();
const router = express.Router();
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');
const async = require('async');
const absolutify = require('absolutify');

const proxyServerURL = "http://localhost:5000/?url=";

// Store the URL and its corresponding bytes
var cached_pages = {};
var cached_pages_expiration_time = {};
var cached_pages_max_age = {};

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: false}));
app.listen(8000);

app.get('/', (req, res)=> {
    if (req.query.url) {
        var targetURL = req.query.url;
        sendRequestToProxy(req, res, targetURL);
    } else {
        res.render('home');
    }
})

 // Limitation: Getting routes of /submit/:url
app.post('/submit', (req, res) => {
    var targetURL = req.body.targeturl;
    sendRequestToProxy(req, res, targetURL);
})

// Routes for type for /submit?url=""
app.get('/submit', (req, res) => {
    var targetURL = req.query.url;
    checkCacheAndSendResponse(req, res, targetURL);
})

app.get('/index', (req, res) => {
    // Get all the keys(URL) and value.toString().length and render itex
    getAllRedisKeyValuePairs(req, res);
})

app.get('/destroy', (req, res) => {
    client.flushdb( function(err, success) {
        console.log("Redis flushed");
    })
})

function sendRequestToProxy(req, res, targetURL) {
    var requestURL = proxyServerURL + targetURL;
    request(requestURL, function(error, response, body) {
        console.log("recevied response back from proxy server " + Date.now());
        //console.log("response body received: \n" + body);
        res.send(body);
    });
}

// function getAllRedisKeyValuePairs(req, res) {
//     // Get all the keys(URL) and value.toString().length and render itex
//     client.keys('*', function (err, keys) {
//         if (err) return console.log(err);
//         if (keys) {
//             async.map(keys, function(key, callback) {
//                 client.get(key, function (error, value) {
//                     if (error) return cb(error);
//                     cached_pages[key] = value.toString().length;
//                     callback(null);
//                 }); 
//             }, function (error) {
//                 if (error) return console.log(error);
//                 res.render('test', {cached_pages: cached_pages});
//             });
//         }
//     });
// }
// cache header ->20s -> refresh the page in the cache

