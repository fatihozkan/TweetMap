var express = require('express');
var router = express.Router();
var io = require("socket.io");

router.get('/', function (req, res, next) {
    res.render('index', {title: 'TweetMap'});
});

module.exports = router;
