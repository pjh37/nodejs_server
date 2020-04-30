const express=require('express');
const mkdirp=require('mkdirp');
const fs = require('fs');
const multiparty = require('multiparty');
const router=express.Router();
const mysql_db=require('../public/config/db_connection')();
const connection=mysql_db.init();
mysql_db.dbConnect(connection);

//그룹생성
router.post('/create',function(req,res,next){
    var title;
    var description;
    var cover;
    var category;
    var authority;
    var author;
    var groupPassword;
    var form=new multiparty.Form();
    form.parse(req);
    form.on('field',function(name,value){
        console.log('field : ' + name + "  value : " + value);
        console.log('test1');
        if(name=="title")title=value;
        if(name=="description")description=value;
        if(name=="category")category=value;
        if(name=="authority")authority=value;
        if(name=="author")author=value;
        if(name=="groupPassword")groupPassword=value;
    });
    form.on('part',function(part){
        console.log(part.name);
        console.log('test2');
        cover=part.name;
        var query='insert into pjh1352.group(title,description,category,authority,cover,author,groupPassword) values(?,?,?,?,?,?,?)';
        var params=[title,description,category,authority,cover,author,groupPassword];
        connection.query(query,params,function(err,rows,fields){
            if(err)throw err;
            else{
                mkdirp(__dirname+'/../save/group',function(err){
                    if(err)console.log('already exist dir'); 
                    writeStream = fs.createWriteStream(__dirname+'/../save/group/'+part.name+'.jpg');
                    writeStream.filename = part.name;
                    part.pipe(writeStream);
                    console.log(writeStream);
                });
            }
        });
        
        part.on('end',function(){
            console.log(' Part read complete');
            writeStream.end();
        });
    });
    form.on('close',function(){
        console.log('close');
        res.status(200).send(true);
        
    });
    
});

//모든 그룹 가져오기
router.get('/all/:count/:offset',function(req,res,next){
    var count=req.params.count*1;
    var offset=req.params.offset*1;
    var query='select * from pjh1352.group limit ? offset ?';
    var params=[count,offset];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            throw err;
        }
       
        var jsonObject=new Array();
        for(i=0;i<rows.length;i++){
            jsonObject.push(new Object(rows[i]));
        }
        console.log(jsonObject);
        res.status(200).json(jsonObject);
    });
});

//그룹의 썸네일 가져오기
router.get('/image/cover/:id',function(req,res,next){
    var _id=req.params.id;
    var query='select cover from pjh1352.group where _id= ?';
    var params=[_id];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        fs.stat(__dirname+'/../save/group',function(err){
            if(err){
                //throw err;
                console.log(err);
                res.send(false);
            }else{
                console.log('사진 선택');
                var readStream=fs.createReadStream(__dirname+'/../save/group/'+rows[0].cover+'.jpg')
                readStream.pipe(res);
            }
        })
    });
});

//자신이속한 그룹 가져오기
router.get('/my/:userEmail',function(req,res,next){
    console.log("my group 불러오기");
    var userEmail=req.params.userEmail;
    var query='select * from pjh1352.group where _id=any(select group_id from pjh1352.mygroup where userEmail=?)'
    var params=[userEmail];
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

//그룹 가입
router.post('/join',function(req,res,next){
    console.log("group join");
    var group_id=req.body.group_id;
    var userEmail=req.body.userEmail;
    var query='insert into pjh1352.mygroup (group_id,userEmail) values(?,?)';
    var params=[group_id,userEmail];
    connection.query(query,params,function(err,rows,fields){
        if(err)throw err;
        res.status(200).send(true);
    });
});

//그룹 탈퇴
router.delete('/withdraw',function(req,res,next){

});

//그룹 정보 수정
router.put('/update/:groupID',function(req,res,next){

});

//그룹삭제
router.delete('/delete/:groupID',function(req,res,next){

});

module.exports=router;