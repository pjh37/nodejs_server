const express=require('express');
const mysql=require('mysql');
const router=express.Router();
const mysql_db=require('../public/config/db_connection')();
const connection=mysql_db.init();
mysql_db.dbConnect(connection);

router.post('/create',function(req,res,next){
    //각 인원들을 채팅방에 추가하기
    var friendEmails=JSON.parse(req.body.friends);
    var userEmail=req.body.userEmail;
    var roomkey=req.body.pk;
    console.log(friendEmails);
    console.log(friendEmails[0]);
    var query='INSERT INTO pjh1352.roomlist (user_email,roomkey) VALUES ?;';
    var items=[];
    items.push([userEmail,roomkey]);
    
    for(var i=0;i<friendEmails.length;i++){
        items.push([friendEmails[i],roomkey]);
    }
    
    
    connection.query(query,[items],function(err,rows,fields){
        if(err){
            throw err;
        }
        res.status(200).send(true);
    });
    
});

router.get('/rooms/:userEmail',function(req,res,next){
    //모든 채팅방 정보 얻기
    var userEmail=req.params.userEmail;
    var query='SELECT * FROM pjh1352.roomlist WHERE roomkey = any(SELECT roomkey FROM pjh1352.roomlist WHERE user_email = ?)';
    var params=[userEmail];
    connection.query(query,params,function(err,rows,fields){
        var jsonObject=new Array();
        for(i=0;i<rows.length;i++){
            var room=new Object();
            room.roomKey=rows[i].roomkey;
            room.userEmail=rows[i].user_email;
            jsonObject.push(room);
        }
        console.log(jsonObject);
        res.status(200).json(jsonObject);
    });
});

router.get('/rooms/:roomKey/:count/:offset',function(req,res,next){
    //해당 키에속하는 방의 모든 메세지,혹은 일부 메세지 요청
    var roomkey=req.params.roomKey;
    var count=Number(req.params.count);
    var offset=Number(req.params.offset);
    
    var query='SELECT * FROM pjh1352.chatLog WHERE roomkey = ? order by date ASC LIMIT ? OFFSET ?';
    var params=[roomkey,count,offset];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            throw err;
        }
        var jsonObject=new Array();
        for(i=0;i<rows.length;i++){
            var msg=new Object();
            msg.roomKey=rows[i].roomkey;
            msg.message=rows[i].message;
            msg.userEmail=rows[i].user_email;
            msg.date=rows[i].date;
            jsonObject.push(msg);
        }
        console.log(jsonObject);
        res.status(200).json(jsonObject);
    });
});
module.exports=router;