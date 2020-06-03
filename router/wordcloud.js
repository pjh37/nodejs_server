const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const fs = require('fs');
const fsExtra = require('fs-extra')
const path=require('path');
const mkdirp=require('mkdirp');

const mysql_db=require('../public/config/db_connection')();
const connection=mysql_db.init();
mysql_db.dbConnect(connection);


router.get('/search_keyword/:keyword', function (req, res, next) {
    var Keyword = req.params.keyword;
    var query = "SELECT _id,user_email,title,response_cnt,time FROM pjh1352.user WHERE title LIKE "
    + connection.escape('%' + req.params.keyword + '%');
    var params = [Keyword];
    connection.query(query, params, function (err, rows, fields) {
        if (err) {
            console.log("데이터 select 오류");
        } else {
            console.log("데이터 select 성공");
            var jsonObject = new Array();
            for (i = 0; i < rows.length; i++) {
                var temp = new Object();
                temp._id = rows[i]._id;
                temp.userEmail = rows[i].user_email;
                temp.title = rows[i].title;
                temp.response_cnt = rows[i].response_cnt;
                temp.time = rows[i].time;

                jsonObject.push(temp);
            }
            console.log(jsonObject[0]);
            res.status(200).json(jsonObject);
        }

    });
});













module.exports = router;
