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
            connection.query(insertQuery,function(err,rows,fields){
                if(err)throw err;
                connection.query(selectQuery,selectParams,function(err,rows,fields){
                    if(err)throw err;
                    res.status(200).json(new Object(rows[0]));
                });
            });
           
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