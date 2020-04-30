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
    var group_id;
    var content;
    var userEmail;
    var time;
    var files=new Array();
    var form=new multiparty.Form();
    form.parse(req);
    form.on('field',function(name,value){
        console.log('field : '+name+"  value : "+value);
        if(name=="group_id")group_id=value;
        if(name=="content")content=value.substring(1,value.length-1);
        if(name=="userEmail")userEmail=value.substring(1,value.length-1);
        if(name=="time")time=value;
    });
    form.on('part',function(part){
        files.push(part.name);
        mkdirp(__dirname+'/../save/post',function(err){
            if(err)console.log('already exist dir'); 
            writeStream = fs.createWriteStream(__dirname+'/../save/post/'+part.name);
            writeStream.filename = part.name;
            part.pipe(writeStream);
        });
        
        part.on('end',function(){
            console.log(' Part read complete');
            writeStream.end();
        });
    });
    form.on('close',function(){
        console.log('close');
        var query='insert into pjh1352.post (group_id,content,userEmail,time) values(?,?,?,?)';
        var params=[group_id,content,userEmail,time];
        
        connection.query(query,params,function(err,result){
            if(err)throw err;
            var selectQuery='select * from pjh1352.post where _id = ?'
            var selectParams=[result.insertId];
            var insertQuery="";
            for(i=0;i<files.length;i++){
                insertQuery+="insert into pjh1352.postImage(post_id,filename) values("+result.insertId+",'"+files[i]+"');";
            }
            if(insertQuery==""){
                connection.query(selectQuery,selectParams,function(err,rows,fields){
                    if(err)throw err;
                    res.status(200).json(new Object(rows[0]));
                });
            }else{
                connection.query(insertQuery,function(err,rows,fields){
                    if(err)throw err;
                    connection.query(selectQuery,selectParams,function(err,rows,fields){
                        if(err)throw err;
                        res.status(200).json(new Object(rows[0]));
                    });
                });
            }
            
           
        });
        
    });
    
});

//post update
router.put('/update',function(req,res,next){
    console.log("post create");
    var post_id;
    var content;
    var deleteList;
    var files=new Array();
    var form=new multiparty.Form();
    form.parse(req);
    form.on('field',function(name,value){
        console.log('field : '+name+"  value : "+value);
        if(name=="postID")post_id=value;
        if(name=="content")content=value.substring(1,value.length-1);
        if(name=="userEmail")userEmail=value.substring(1,value.length-1);
        if(name=="time")time=value;
        if(name=="deleteList"){
            console.log(JSON.parse(value)[0]);
            deleteList=JSON.parse(value);
        }
    });
    form.on('part',function(part){
        files.push(part.name);
        mkdirp(__dirname+'/../save/post',function(err){
            if(err)console.log('already exist dir'); 
            writeStream = fs.createWriteStream(__dirname+'/../save/post/'+part.name);
            writeStream.filename = part.name;
            part.pipe(writeStream);
        });
        
        part.on('end',function(){
            console.log(' Part read complete');
            writeStream.end();
        });
    });
    form.on('close',function(){
        console.log('close');
        var query='update pjh1352.post set content = ? where _id=?'
        var params=[content,post_id];
        
        connection.query(query,params,function(err,result){
            if(err)throw err;

            var deleteQuery="";
            for(i=0;i<deleteList.length;i++){
                deleteQuery+='delete from pjh1352.postImage where _id ='+deleteList[i]+';';
            }
            var selectQuery='select * from pjh1352.post where _id = ?'
            var selectParams=[post_id];
            var insertQuery="";
            for(i=0;i<files.length;i++){
                insertQuery+="insert into pjh1352.postImage(post_id,filename) values("+post_id+",'"+files[i]+"');";
            }
            console.log("post id : "+post_id);
            if(deleteQuery==""){
                console.log("deleteQuery empty");
                connection.query(insertQuery,function(err,rows,fields){
                    if(err)throw err;
                     connection.query(selectQuery,selectParams,function(err,rows,fields){
                         if(err)throw err;
                         res.status(200).json(new Object(rows[0]));
                    });
                 });
            }else{
                console.log("deleteQuery exist");
                connection.query(deleteQuery,function(err,rows,fields){
                    if(err)throw err;
                    if(files.length!=0){
                        connection.query(insertQuery,function(err,rows,fields){
                            if(err)throw err;
                            connection.query(selectQuery,selectParams,function(err,rows,fields){
                                if(err)throw err;
                                res.status(200).json(new Object(rows[0]));
                            });
                        });
                    }else{
                        connection.query(selectQuery,selectParams,function(err,rows,fields){
                            if(err)throw err;
                            res.status(200).json(new Object(rows[0]));
                        });
                    }
                    
                });
            }
            
        });
        
    });
    
});


//post에 첨부된 이미지중 1개가져오기
router.get('/image/thumbnail/:post_id',function(req,res,next){
    var post_id=req.params.post_id;
    var query='select * from pjh1352.postImage where post_id= ? limit 1';
    var params=[post_id];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        if(rows.length==0){
            console.log("사진 없어서 못보네");

        }
        if(rows.length!=0){
            fs.stat(__dirname+'/../save/post/'+rows[0].filename,function(err){
                if(err){
                    throw err;
                }else{
                    console.log('사진 선택');
                    var readStream=fs.createReadStream(__dirname+'/../save/post/'+rows[0].filename)
                    readStream.pipe(res);
                }
            })
        }
    });
});
//postimage id 를 이용해 사진 가져오기
router.get('/image/thumbnail/:post_id/:image_id',function(req,res,next){
    var post_id=req.params.post_id;
    var image_id=req.params.image_id;
    var query='select * from pjh1352.postImage where post_id= ? and _id = ?';
    var params=[post_id,image_id];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        
        if(rows.length!=0){
            fs.stat(__dirname+'/../save/post/'+rows[0].filename,function(err){
                if(err){
                    throw err;
                }else{
                    console.log('사진 선택');
                    var readStream=fs.createReadStream(__dirname+'/../save/post/'+rows[0].filename)
                    readStream.pipe(res);
                }
            })
        }
    });
});
//post각각에 있는 이미지 정보
router.get('/images/:post_id',function(req,res,next){
    var post_id=req.params.post_id*1;
    var query='select * from pjh1352.postImage where post_id=?';
    var params=[post_id];
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

//자신이속한 그룹 게시물 가져오기
router.get('/:group_id/:count/:offset',function(req,res,next){
    console.log("post 불러오기");
    var group_id=req.params.group_id*1;
    var count=req.params.count*1;
    var offset=req.params.offset*1;
    var query='select * from pjh1352.post  where group_id = ? order by time asc limit ? offset ?'
    var params=[group_id,count,offset];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        var jsonObject=new Array();
        for(i=rows.length-1;i>=0;i--){
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

router.delete('/delete/:post_id',function(req,res,next){
    console.log("post 삭제");
    var post_id=req.params.post_id*1;
    var query='delete * from pjh1352.post  where _id = ?'
    var params=[post_id];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        var jsonObject=new Object();
        jsonObject.right=true;
        res.status(200).json(jsonObject);
    });
});

module.exports=router;