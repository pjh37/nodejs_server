
const express=require('express');
const fs=require('fs');
const path=require('path');
const multiparty=require('multiparty');
const mkdirp=require('mkdirp');
const socket=require('socket.io');

require('date-utils');
const mysql=require('mysql');
const router=express.Router();
var connection=mysql.createConnection({
    host : 'nodejs-003.cafe24.com',
    user : 'pjh1352',
    password : 'sakarin2018',
    datebase : 'pjh1352',
    charset: 'utf8_bin'
});
connection.connect(function(err){
    if(err){
        console.log('connect error');
    }else{
        console.log('mysql connected!!');
    }
});
var socketIDs=new Array();

/*
io.sockets.on('connection',function(socket){
    socket.on('login',function(data){
        socketIDs[data.userEmail]=socket.id
    })
})
*/
router.post('/result',function(req,res,next){
    
    
    var userEmail=req.body.userEmail;
    var form_id=req.body.form_id;
    
    var time=new Date().toLocaleString();
   
    var jsonStr=JSON.stringify(req.body);
    
    
    var query='INSERT INTO pjh1352.result (user_email,form_id,result,time) VALUES(?,?,?,?)';
    var params=[userEmail,form_id,jsonStr,time];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log('저장실패'+err);
        }else{
            console.log('저장완료');
            //response update 및 누군가 설문을 완료했다는 notification보내기
            var query='SELECT COUNT(*) as cnt FROM pjh1352.result WHERE form_id=?';
            var params=[form_id];
            connection.query(query,params,function(err,rows,fields){
                if(err){
                    console.log("데이터 load 오류");
                    res.status(404).send("error");
                }else{
                    console.log(rows[0].cnt);
                    
                    var response_cnt=rows[0].cnt;
                    var query='UPDATE pjh1352.user SET response_cnt=? WHERE _id=?';
                    var params=[response_cnt,form_id];
                    connection.query(query,params,function(err,rows,fields){
                        if(err){
                            console.log("데이터 update 오류");
                            res.status(404).send("error");
                        }else{
                            console.log("데이터 update 성공");
                            res.status(200).send('Upload complete');
                        }
                    })
                }
            })
            
        }
    });
    
    
    
});
router.post('/load',function(req,res,next){
    var form=new multiparty.Form();
    var userEmail;
    var form_id;
    form.parse(req);
    form.on('field',function(name,value){
        if(name=='userEmail'){
            userEmail=value;
        }
        if(name=='form_id'){
            form_id=value;
        }
    })
    form.on('close',function(){
        var query='SELECT result,time FROM pjh1352.result WHERE user_email=? AND form_id=?';
        var params=[userEmail,form_id];
        connection.query(query,params,function(err,rows,fields){
            //var jsonObject=new Object();

            var jsonArray=new Array();
            for(i=0;i<rows.length;i++){
                var jsonObject=new Object();
                jsonObject.surveyResult=rows[i].result;
                jsonObject.time=rows[i].time;
                jsonArray.push(jsonObject);
            }
            
            
            //jsonObject.result=jsonArray;
            console.log(jsonArray);
            res.status(200).send(jsonArray);
        })
    })
});
router.get('/load/:form_id',function(req,res,next){
    var form_id=req.params.form_id;
    console.log(form_id);
    var query='SELECT * FROM pjh1352.user WHERE _id=?';
    var params=[form_id];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 load 오류");
            res.status(404).send("error");
        }else{
            console.log("데이터 load 성공");
            
            res.status(200).json(JSON.parse(rows[0]));
        }
    })
})
router.get('/deleteform/:form_id',function(req,res,next){
    var form_id=req.params.form_id;
    console.log(form_id);
    var query='DELETE FROM pjh1352.user WHERE _id=?';
    var params=[form_id];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 Delete 오류");
            res.status(404).send("error");
        }else{
            console.log("데이터 Delete 성공");
            res.status(200).send("success");
        }
    })
});
router.post('/update',function(req,res,next){
    var form=new multiparty.Form();
    var json;
    var form_id;
    form.parse(req);
    form.on('field',function(name,value){
        console.log('filed 들어옴');
        if(name=='json'){
            json=value;
        }
        if(name=='form_id'){
            form_id=value;
        }
    });
    form.on('close',function(){
        console.log(json);
        console.log(form_id)
        var query='UPDATE pjh1352.user SET json=? WHERE _id=?';
        var params=[json,form_id];
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log("데이터 update 오류");
                res.status(404).send("error");
            }else{
                console.log("데이터 update 성공");
                res.status(200).send("success");
            }
        })
    });
});
router.get('/save/:user_email/:form_id/:image_name',function(req,res,next){
    var user_email=req.params.user_email;
    var form_id=req.params.form_id;
    var image_name=req.params.image_name;
    //var readStream=fs.createReadStream('.'+'/save/'+user_email+'/'+form_id+'/'+image_name+'.jpg');
    var readStream=fs.createReadStream(__dirname+'/../save/'+user_email+'/'+form_id+'/'+image_name+'.jpg')
    console.log('절대경로 : '+__dirname);
    readStream.pipe(res);
})
router.post('/save',function(req,res,next){
    var form=new multiparty.Form();
    var userEmail;
    var json;
    var title;
    var description;
    var time;
    var form_id;
    form.parse(req);
    form.on('field',function(name,value){
        console.log('filed 들어옴');
        if(name=='json'){
            json=value;
            var jsonObject=JSON.parse(json);
            userEmail=jsonObject.userEmail;
            title=jsonObject.title;
            description=jsonObject.description;
            time=jsonObject.time;
            var query='INSERT INTO pjh1352.user (user_email,title,description,json,time) VALUES(?,?,?,?,?)';
            var params=[userEmail,title,description,json,time];
            connection.query(query,params,function(err,rows,fields){
                if(err){
                    console.log('저장실패'+err);
                }else{
                    
                    console.log('저장완료');
                    
                }
            });
        }
    });
    form.on('part',function(part){
        console.log('part 들어옴');
        var filename;
        var size;
        var writeStream;
        if(part.filename){
            filename=part.filename;
            size=part.byteCount;
            
            console.log('part 들어옴 : '+part.name);
            console.log('part 들어옴 : '+filename);
        }else{
            part.resume();
        }
        var query='SELECT _id FROM pjh1352.user ORDER BY _id DESC LIMIT 1';
        connection.query(query,function(err,rows,fields){
            form_id=rows[0]._id;
            mkdirp(__dirname+'/../save/'+userEmail+'/'+form_id,function(err){
                if(err)console.log('already exist dir'); 
                writeStream = fs.createWriteStream(__dirname+'/../save/'+userEmail+'/'+form_id+'/'+part.name+'.jpg');
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
    //보낸 사람, 설문지 id, 
    form.on('close',function(){
        res.status(200).send('Upload complete');
        
    });
});
router.get('/form/:type/:pages',function(req,res,next){
    console.log("/form/:pages 들어옴");
    var type=req.params.type;
    var page=req.params.pages;
    var offset=(page-1)*10;
    var count=10;
    var query;
    console.log("type : "+type);
    if(type=='all'){
        query='SELECT _id,title,response_cnt,time FROM pjh1352.user LIMIT ? OFFSET ?';
    }else if(type=='recent'){
        query='SELECT _id,title,response_cnt,time FROM pjh1352.user ORDER BY time DESC LIMIT ? OFFSET ?';
    }else if(type=='recommend'){
        query='SELECT _id,title,response_cnt,time FROM pjh1352.user ORDER BY response_cnt DESC LIMIT ? OFFSET ?';
    }
    
        var params=[count,offset];
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log("데이터 select 오류");
            }else{
                console.log("데이터 select 성공");
                var jsonObject=new Array();
                for(i=0;i<rows.length;i++){
                    var temp=new Object();
                    temp._id=rows[i]._id;
                    temp.title=rows[i].title;
                    temp.response_cnt=rows[i].response_cnt;
                    temp.time=rows[i].time;
                    
                    jsonObject.push(temp);
                }
                console.log(jsonObject[0]);
                res.status(200).json(jsonObject);
            }
            
        });
});
router.get('/form/:user_email',function(req,res,next){
    var userEmail=req.params.user_email;
    var query='SELECT _id,title,response_cnt,time FROM pjh1352.user WHERE user_email=?';
    var params=[userEmail];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 select 오류");
        }else{
            console.log("데이터 select 성공");
            var jsonObject=new Array();
            for(i=0;i<rows.length;i++){
                var temp=new Object();
                temp._id=rows[i]._id;
                temp.title=rows[i].title;
                temp.response_cnt=rows[i].response_cnt;
                temp.time=rows[i].time;
                    
                jsonObject.push(temp);
            }
            console.log(jsonObject[0]);
            res.status(200).json(jsonObject);
        }
            
    });
});
router.get('/search_keyword/:keyword', function (req, res, next) {
    var Keyword = req.params.keyword;
    var query = "SELECT _id,title,response_cnt,time FROM pjh1352.user WHERE title LIKE " + connection.escape('%' + req.params.keyword + '%');
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
router.post('/user/forms',function(req,res,next){
    var userEmail;
    var json;
    var response_cnt;
    var form=new multiparty.Form();
    form.parse(req);
    form.on('field',function(name,value){
        console.log('filed 들어옴');
        if(name=='userEmail'){
           
            
            userEmail=value;
            console.log(json);
        }
    });
    form.on('close',function(){
        var query='SELECT _id,json,response_cnt,time FROM pjh1352.user WHERE user_email=?';
        var params=[userEmail];
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log("데이터 select 오류");
            }else{
                console.log("데이터 select 성공");
                var jsonObject=new Array();
                for(i=0;i<rows.length;i++){
                    var temp=new Object();
                    temp._id=rows[i]._id;
                    temp.json= JSON.parse(rows[i].json);
                    temp.response_cnt=rows[i].response_cnt;
                    temp.time=rows[i].time;
                    
                    jsonObject.push(temp);
                }
                console.log(jsonObject[0]);
                res.status(200).json(jsonObject);
            }
            
        });
    });
   
});
router.get('/individual/:form_id',function(req,res){
    var form_id=req.params.form_id;
    var json;
    var query='SELECT * FROM pjh1352.user WHERE _id=?';
    var params=[form_id];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 select 오류");
            res.status(404);
        }else{
            json=rows[0].json;
            res.status(200).send(json);
        }

    });
});
router.get('/survey/:form_id',function(req,res){
    //테스트
    
    var form_id=req.params.form_id;
    console.log(form_id);
    var userEmail;
    var title;
    var description;
    var json;
    var query='SELECT * FROM pjh1352.user WHERE _id=?';
    var params=[form_id];
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log("데이터 select 오류");
                res.status(404);
            }else{
                console.log("데이터 select 성공");
                console.log(rows);
                userEmail=rows[0].user_email;
                title=rows[0].title;//rows[0].title
                description=rows[0].description;
                json=rows[0].json;
                res.render('main',{
                    title:title,
                    name:'page',
                    form_id:form_id,
                    user_email:userEmail,
                    description:description,
                    json:json
                });
            }
        });
});
router.get('/form/:keyword', function (req, res, next) {
    var keyword = req.params.keyword;
    var query = 'SELECT _id,title,response_cnt,time FROM pjh1352.user WHERE title LIKE "%?%"';
    var params = [keyword];
    connection.query(query, params, function (err, rows, fields) {
        if (err) {
            console.log("데이터 select 오류");
        } else {
            console.log("데이터 select 성공");
            var jsonObject = new Array();
            for (i = 0; i < rows.length; i++) {
                var temp = new Object();
                temp._id = rows[i]._id;
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
router.get('/search/:queryText/:page',function(req,res){
    var queryText=req.params.queryText;
    var page=req.params.page;
    var start=10*page;
    var end=10*page+10;
    var query='SELECT * FROM pjh1352.profile WHERE user_email like ?';
    var params=[queryText+"%"];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 select 오류");
            res.status(404);
        }else{
            var jsonObject=new Array();
            if(end<rows.length){
                rows.length=end;
            }
            for(i=start;i<rows.length;i++){
                var temp=new Object();
            
                temp.userEmail=rows[i].user_email;
                temp.profileImageUrl=rows[i].profile_image_url;
                jsonObject.push(temp);
            }
            console.log(jsonObject[0]);
            res.status(200).json(jsonObject);
        }

    });

});
router.get('/user/:userEmail',function(req,res){
    var userEmail=req.params.userEmail;
    var isExist=false;
    var query='SELECT * FROM pjh1352.profile where user_email = ?';
    var params=[userEmail];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 select 오류");
            res.status(404);
        }else{
            console.log(rows.length);
            
            if(rows.length==0){
                var query='INSERT INTO pjh1352.profile (user_email) VALUES(?)';
                var params=[userEmail];
                connection.query(query,params,function(err,rows,fields){
                    if(err){
                        console.log('저장실패'+err);
                    }else{
                        console.log('저장완료');
                        res.status(200).send(true);
                    }
                });
            }
            
        }
    });

});
router.post('/user/forms',function(req,res,next){
    var from;
    var to;
    form.parse(req);
    form.on('field',function(name,value){
        if(name=='from'){
            from=value;
        }
        if(name=='to'){
            to=value;
        }
    });
    form.on('close',function(){
        var query='INSERT INTO pjh1352.friend (from,to) VALUES(?,?)';
        var params=[from,to];
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log('저장실패'+err);
            }else{
                console.log('저장완료');
                res.status(200).send(true);
            }
        });
    })
});
module.exports=router;