const express=require('express');
const mkdirp=require('mkdirp');
const fs = require('fs');
const multiparty = require('multiparty');
const router=express.Router();
const mysql_db=require('../public/config/db_connection')();
const connection=mysql_db.init();
mysql_db.dbConnect(connection);
//게시글 등록
router.post('/create',function(req,res,next){
    console.log("post create");
    var group_id=req.body.group_id;
    var content=req.body.content;
    var userEmail=req.body.userEmail;
    var time=req.body.time;
    var query='insert into pjh1352.post (group_id,content,userEmail,time) values(?,?,?,?)';
    var params=[group_id,content,userEmail,time];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        res.status(200).send(true);
    });
});
//자신이속한 그룹 게시물 가져오기
router.get('/:group_id/:count/:offset',function(req,res,next){
    console.log("post 불러오기");
    var group_id=req.params.group_id*1;
    var count=req.params.count*1;
    var offset=req.params.offset*1;
    var query='select * from pjh1352.post where group_id =? limit ? offset ?'
    var params=[group_id,count,offset];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        var jsonObject=new Array();
        for(i=0;i<rows.length;i++){
            jsonObject.push(new Object(rows[i]));
        }
        console.log(jsonObject);
        res.status(200).json(jsonObject);
    });
});

//댓글 등록
router.post('/add_comment', function (req, res, next) {
    console.log("add comment");
    var post_id = req.body.post_id;
    var content = req.body.content;
    var userEmail = req.body.userEmail;
    var time = req.body.time;
    var query = 'insert into pjh1352.comment (post_id,content,userEmail,time) values(?,?,?,?)';
    var params = [post_id, content, userEmail, time];
    connection.query(query, params, function (err, rows, fields) {
        if (err) throw err;
        res.status(200).send(true);
    });
});

//댓글 삭제
router.get('/delete_comment/:_id', function (req, res, next) {
    var _id = req.params._id;
    console.log(_id);
    var query = 'DELETE FROM pjh1352.comment WHERE _id=?';
    var params = [_id];
    connection.query(query, params, function (err, rows, fields) {
        if (err) {
            console.log("데이터 Delete 오류");
            res.status(404).send("delete error");
        } else {
            console.log("데이터 Delete 성공");
            res.status(200).send("delete success");
        }
    })
});

//대댓글 등록
router.post('/add_comment_reply', function (req, res, next) {
    console.log("add comment_reply");
    var post_id = req.body.post_id;
    var content = req.body.content;
    var target_userEmail = req.body.target_userEmail;
    var userEmail = req.body.userEmail;
    var time = req.body.time;
    var query = 'insert into pjh1352.comment_reply (post_id, content, target_userEmail, userEmail,time) values(?,?,?,?,?)';
    var params = [post_id, content, target_userEmail, userEmail, time];
    connection.query(query, params, function (err, rows, fields) {
        if (err) throw err;
        res.status(200).send(true);
    });
});

//대댓글 삭제
router.get('/delete_reply/:_id', function (req, res, next) {
    var _id = req.params._id;
    console.log(_id);
    var query = 'DELETE FROM pjh1352.comment_reply WHERE _id=?';
    var params = [_id];
    connection.query(query, params, function (err, rows, fields) {
        if (err) {
            console.log("데이터 Delete 오류");
            res.status(404).send("delete error");
        } else {
            console.log("데이터 Delete 성공");
            res.status(200).send("delete success");
        }
    })
});

//댓글 가져오기
router.get('/comment/:post_id/:count/:offset', function (req, res, next) {
    console.log("comment 불러오기");
    var post_id = req.params.post_id * 1;
    var count = req.params.count * 1;
    var offset = req.params.offset * 1;
    var query = 'select * from pjh1352.comment where post_id =? limit ? offset ?'
    var params = [post_id, count, offset];
    connection.query(query, params, function (err, rows, fields) {
        if (err) throw err;
        var jsonObject = new Array();
        for (i = 0; i < rows.length; i++) {
            jsonObject.push(new Object(rows[i]));
        }
        console.log(jsonObject);
        res.status(200).json(jsonObject);
    });
});

//대댓글 가져오기
router.get('/comment_reply/:post_id/:count/:offset', function (req, res, next) {
    console.log("comment_reply 불러오기");
    var post_id = req.params.post_id * 1;
    var count = req.params.count * 1;
    var offset = req.params.offset * 1;
    var query = 'select * from pjh1352.comment_reply where post_id =? limit ? offset ?'
    var params = [post_id, count, offset];
    connection.query(query, params, function (err, rows, fields) {
        if (err) throw err;
        var jsonObject = new Array();
        for (i = 0; i < rows.length; i++) {
            jsonObject.push(new Object(rows[i]));
        }
        console.log(jsonObject);
        res.status(200).json(jsonObject);
    });
});

module.exports=router;