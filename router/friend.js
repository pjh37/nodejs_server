const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const fs = require('fs');
const path=require('path');
const fsExtra = require('fs-extra')
const mkdirp=require('mkdirp');

const mysql_db=require('../public/config/db_connection')();
const connection=mysql_db.init();
mysql_db.dbConnect(connection);

// 친구 요청 목록 가져오기
router.get('/user/:userEmail/:state',function(req,res){
    var to=req.params.userEmail;
    var state=req.params.state;
    var temp=escape(to);
    var query='SELECT * FROM pjh1352.profile where user_email=any(SELECT sender FROM pjh1352.friendlog where receiver=?)'
    //var query='SELECT _id,title,response_cnt,time FROM pjh1352.user WHERE user_email=?';
    var params=[temp];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 select 오류 : "+err);
            res.status(404);
        }else{

            var jsonObject=new Array();
            for(i=0;i<rows.length;i++){
                var temp=new Object();
                temp._id=rows[i]._id;
                temp.userEmail=rows[i].user_email;
                temp.profileImageUrl=rows[i].profile_image_url;
                jsonObject.push(temp);
            }

            res.status(200).json(jsonObject);

        }
    })
});


// 유저 프로필 사진 업데이트
router.post('/user/profile/upload',function(req,res,next){
    console.log('/user/profile/upload : '+"진입");
    var form=new multiparty.Form();

    var userEmail;
    form.parse(req);
    form.on('field',function(name,value){
        console.log('field : '+name);
        if(name=='userEmail'){
            userEmail=value;
            console.log('field : '+value);
        }
    });
    form.on('part',function(part){
        console.log('field : '+part);
        if(part.filename){
            filename=part.filename;
            size=part.byteCount;

            console.log('part 들어옴 : '+part.name);
            console.log('part 들어옴 : '+filename);
        }else{
            part.resume();
        }
        var query='UPDATE pjh1352.profile SET profile_image_url = ? WHERE user_email = ?';
        var params = [part.name, part.name];

        connection.query(query, params, function (err, rows, fields) {

            mkdirp(__dirname + '/../profile', function (err) {
                if(err)console.log('already exist dir');
                writeStream = fs.createWriteStream(__dirname+'/../profile/'+part.name+'.jpg');
                writeStream.filename = filename;
                part.pipe(writeStream);
                console.log(writeStream);
            });

        })

         part.on('end',function(){
            console.log(filename+' Part read complete');
            writeStream.end();
        });
    })

    form.on('close',function(){
        console.log('close');
        res.status(200).send('Upload complete');

    });
});

// 채팅방에 친구 목록 가져오기
router.post('/friend/select',function(req,res,next){
    var userEmail=req.body.userEmail;
    var query='SELECT * FROM pjh1352.profile WHERE user_email = any(SELECT friend_email FROM pjh1352.friend WHERE user_email = ?)';
    var params=[userEmail];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log('/friend/select실패'+err);
            throw err;
        }else{
            console.log('/friend/select완료');
            var jsonObject=new Array();
            for(i=0;i<rows.length;i++){
                var temp=new Object();
                temp._id=rows[i]._id;
                temp.userEmail=rows[i].user_email;
                temp.profileImageUrl=rows[i].profile_image_url;
                jsonObject.push(temp);
            }
            console.log(jsonObject);
            res.status(200).json(jsonObject);
        }
    });
});

// 친구 수락 OR 거절
router.post('/friend/update',function(req,res,next){
    var sender=req.body.sender;
    var receiver=req.body.receiver;
    var state=req.body.state;

    var deleteQuery='DELETE FROM pjh1352.friendlog where sender = ? and receiver = ?';
    var params=[sender,receiver];
    var params2=[receiver,sender];

    if(state==0){
        //reject
        connection.query(deleteQuery,params,function(err,rows,fields){
            if(err){
                console.log('저장실패'+err);
                throw err;
            }else{
                console.log('저장완료');
                res.status(200).send(true);
            }
        });
    }else if(state==1){
        //grant user
        var insertQuery1='INSERT INTO pjh1352.friend (user_email,friend_email) VALUES(?,?)';
        var insertQuery2='INSERT INTO pjh1352.friend (friend_email,user_email) VALUES(?,?)';

        connection.query(insertQuery1,params,function(err,rows,fields){
            if(err){
                console.log('저장실패'+err);
                throw err;
            }else{
                console.log('저장완료');
                connection.query(insertQuery2,params2,function(err,rows,fields){
                    if(err){
                        console.log('저장실패'+err);
                        throw err;
                    }
                    connection.query(deleteQuery,params,function(err,rows,fields){
                        if(err){
                            console.log('저장실패'+err);
                            throw err;
                        }else{
                            console.log('저장완료');
                            res.status(200).send(true);
                        }
                    });
                });


            }
        });

    }

});

router.post('/friend/request',function(req,res,next){
    var sender=req.body.sender;
    var receiver=req.body.receiver;
    var state=req.body.state;
    var time=req.body.time;

    var query='INSERT INTO pjh1352.friendlog set ?';

    console.log(":" +sender+" "+receiver+" "+state+" "+time);
    var params={sender:sender,receiver:receiver,state:state,time:time};

    connection.query(query,params,function(err,rows,fields){
        if(err){

            console.log('저장실패'+err);
        }else{
            console.log('저장완료');
            res.status(200).send(true);
        }
    });

});






module.exports = router;
