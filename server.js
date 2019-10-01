const cache = require('memory-cache');
const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

app.set('view engine', 'pug')

app.get('/', (req, res)=> {
    res.render('index')
})

app.listen(3000)
// router.get('/',function(req,res){
//     res.sendFile(path.join(__dirname+'/index.html'));
//   });
