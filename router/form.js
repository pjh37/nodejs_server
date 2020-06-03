const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const fs = require('fs');
const fsExtra = require('fs-extra')
const mkdirp=require('mkdirp');
const path=require('path');

const mysql_db=require('../public/config/db_connection')();
const connection=mysql_db.init();
mysql_db.dbConnect(connection);



router.post('/save',function(req,res,next){
    var form=new multiparty.Form();
    var userEmail;
    var json;
    var title;
    var description;
    var time;
    var form_id;


    form.on('field',function(name,value){
        console.log('filed 들어옴');
        if(name=='json'){
            json=value;
            var jsonObject=JSON.parse(json);
            userEmail=jsonObject.userEmail;
            title=jsonObject.title;
            description=jsonObject.description;
            json = JSON.stringify(jsonObject.formComponents);
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
        //var size;
        var writeStream;
        if(part.filename){
            filename=part.filename;
            //size=part.byteCount;
            console.log('part 들어옴 : '+part.name);
            console.log('part 들어옴 : '+filename);
        }else{
            part.resume();
        }

        var splitArray = filename.split('.');  // 확장자 제거


        var query='SELECT _id,user_email FROM pjh1352.user ORDER BY _id DESC LIMIT 1';
        connection.query(query,function(err,rows,fields){
            form_id=rows[0]._id;
            userEmail=rows[0].user_email;

        // 새 생성은 form_id 가 유니크해서 충돌이 없다.
            var dirPath = __dirname + "/../save/images/" + userEmail + '/' + form_id + '/' + splitArray[0];
            fsExtra.emptyDirSync(dirPath) // 기존 이미지 삭제 후 다시 쓰기 , 충돌문제 해결!
            fs.mkdirSync(dirPath, {
              recursive: true
            });
            writeStream = fs.createWriteStream(dirPath + '/' + filename);
            writeStream.filename = filename;
            part.pipe(writeStream); // 파일 쓰는 부분

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
    form.parse(req); // here
});

// router.get('/save/:user_email/:form_id/:image_name',function(req,res,next)
router.get('/save/images/:user_email/:form_id/:image_name/:imgfile',function(req,res,next)
{
    var user_email=req.params.user_email;
    var form_id=req.params.form_id;
    var image_name=req.params.image_name;
    var imgfile=req.params.imgfile;
    var dirpath = __dirname+'/../save/images/'+user_email+'/'+form_id+'/'+image_name;
    var readStream=fs.createReadStream(dirpath+'/'+imgfile);
    // var readStream=fs.createReadStream(__dirname+'/../save/'+user_email+'/'+form_id+'/'+image_name+'.jpg')
    console.log('절대경로 : '+__dirname);
    readStream.pipe(res);
})
router.get('/survey/:form_id',function(req,res){

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
                // HTML 로 보이기
                res.render('main', {
                  form_id: form_id,
                  user_email: userEmail,
                  title: title,
                  description: description,
                  json: json,
                  befoP:"befoBtnOnFunc()",
                  nextP:"nextBtnOnFunc()",
                });
            }
        });
});

router.post('/update',function(req,res,next){
  var form = new multiparty.Form();
  var form_id;
  var userEmail;
  var title;
  var description;
  var json;
  var IsfileSaved = false;
    form.on('field',function(name,value){
        console.log('filed 들어옴');
        if(name=='json'){
          var jsonObject = JSON.parse(value);
          title = jsonObject.title;
          description = jsonObject.description;
          json = JSON.stringify(jsonObject.formComponents);
          userEmail = jsonObject.userEmail;
        }
        if(name=='form_id'){
            form_id=value;

            // 이전 결과들 삭제 , 결과쪽 혼선방지
            var query='DELETE FROM checkmate_schema.result WHERE form_id=?';
            var params = [form_id];
            connection.query(query, params, function(err, rows, fields) {
              if (err) {
                console.log("router.post update field - 데이터 Delete 오류");
                // res.status(404).send("delete error");
              } else {
                // console.log("router.post update field - 데이터 Delete 성공");
                // res.status(200).send("delete success");
              }
            })
        }
    });

    form.on('part',function(part){
            var filename;
            // var size;
            var writeStream;
            if(part.filename){ // 파일일 경우 실행되는 부분
                filename=part.filename; // 확장자포함
                // size=part.byteCount;
                // console.log('router.post update part - part.headers = '+part.headers);
                // console.log('router.post update part - part.name = '+part.name);
                // console.log('router.post update part - part.filename = '+part.filename);
                // console.log('router.post update part - part.byteCount = '+part.byteCount);
            }else{ // 파일 아닐경우 처리 넘기기
                part.resume();
            }

          var splitArray = filename.split('.');

          var query='SELECT _id,user_email FROM pjh1352.user ORDER BY _id DESC LIMIT 1';
          connection.query(query,function(err,rows,fields){
              form_id=rows[0]._id;
              userEmail=rows[0].user_email;
              // console.log('router.post update part query - form_id = ',form_id);
              // console.log('router.post update part query - userEmail = ',userEmail);

              var dirPath =__dirname+"/../save/images/"+userEmail+'/'+form_id+'/'+splitArray[0];
              fsExtra.emptyDirSync(dirPath) // 기존 이미지 삭제 후 다시 쓰기 , 충돌문제 해결!
              fs.mkdirSync( dirPath, { recursive: true } );
              writeStream = fs.createWriteStream(dirPath+'/'+filename);
              writeStream.filename = filename;
              part.pipe(writeStream); // 파일 쓰는 부분

          })


           part.on('end',function(){
              console.log('router.post update part end - Part read complete, filename = ',filename);
              writeStream.end();
              IsfileSaved = true;
          });
        })

    form.on('close',function(){
        console.log(json);
        console.log(form_id)
        var query='UPDATE pjh1352.user SET title=?,description=?,json=? WHERE _id=?';
        var params=[title,description,json,form_id];
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log("데이터 update 오류");
                res.status(404).send("update error");
            }else{
                console.log("데이터 update 성공");
                res.status(200).send("update success");
            }
        })
        if(IsfileSaved === false){
                  // 이미지 없이 업데이트된 경우, 기존 이미지들 제거
          var dirPath =__dirname+"/../save/images/"+userEmail+'/'+form_id;
          fsExtra.emptyDirSync(dirPath); // 이미지 서버에 쌓이는거 방지
        }


    });
    form.parse(req);
});

router.get('/deleteform/:form_id/:user_email', function(req, res, next) {
    var form_id=req.params.form_id;
    var userEmail = req.params.user_email;
    var query='DELETE FROM pjh1352.user WHERE _id=?';
    var params=[form_id];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 Delete 오류");
            // res.status(404).send("delete error");
        }else{
            console.log("데이터 Delete 성공");
            // res.status(200).send("delete success");
        }
    })

    // 설문 삭제 했다면 , 결과쪽도 삭제하자
    var query2='DELETE FROM pjh1352.result WHERE form_id=?';
    var params2 = [form_id];
    connection.query(query2, params2, function(err, rows, fields) {
      if (err) {
        console.log("router.get(/deleteform/:form_id - 결과 Delete 오류");
        res.status(404).send("delete error");
      } else {
        console.log("router.get(/deleteform/:form_id - 결과 Delete 성공");
        res.status(200).send("delete success");
      }
    });

    // 삭제했다면 기존 이미지도 제거하자
    var dirPath =__dirname+"/../save/images/"+userEmail+'/'+form_id;
    fsExtra.emptyDirSync(dirPath);



});

router.post('/draftsave', function(req, res, next) {
  // console.log('router.post(/draftsave - __dirname = ' + __dirname);
  // console.log('router.post(/draftsave - __filename = ' + __filename);
  var form = new multiparty.Form();
  var userEmail;
  var json;
  var title;
  var description;
  var time;
  var form_id;
  form.parse(req);
  form.on('field', function(name, value) {
    // console.log(`came field name = ${name} `);
    console.log("router.post draftsave field - value  = ", value);
    // console.log("router.post save field - value type = ",typeof value);
    if (name == 'json') {
      var jsonObject = JSON.parse(value);
      userEmail = jsonObject.userEmail;
      title = jsonObject.title;
      description = jsonObject.description;
      json = JSON.stringify(jsonObject.formComponents);
      time = jsonObject.time;
      console.log("router.post draftsave field - jsonObject  = ", jsonObject);
      console.log("router.post draftsave field - userEmail  = ", userEmail);
      console.log("router.post draftsave field - title  = ", title);
      console.log("router.post draftsave field - description  = ", description);
      console.log("router.post draftsave field - json  = ", json);
      // console.log("router.post save field - json type = ", typeof json); // object
      // console.log("router.post save field - json2 type = ", typeof json2); // string


      var params = [userEmail, title, description, json, time];
      // table 적어야 하나보지
      // .user는 디비 ,
      // ? 는 params 로 순서에 맞게 치환된다.
      // 새 DB 테이블 !!
      var query = 'INSERT INTO pjh1352.user_draft (user_email,title,description,json,time) VALUES(?,?,?,?,?)';
      connection.query(query, params, function(err, rows, fields) {
        if (err) {
          console.log('router.post draftsave field -저장실패 >> ' + err);
        } else {
          console.log('router.post draftsave field -저장완료 params >>' + params);
          // console.log('router.post save field 저장완료 rows >>'+rows);
          //console.log('저장완료 fields >>'+fields); //  fields is undefined
        }
      });


    }
  });
  form.on('close', function() {
    res.status(200).send('post draftsave success');
    //console.log("pass here? form.on('close')"); // always pass
  });
});
router.post('/user/draftForms', function(req, res, next) {
  var userEmail;
  var form = new multiparty.Form();
  form.parse(req);
  form.on('field', function(name, value) {
    console.log('/user/draftForms form.on(field) 들어옴');
    if (name == 'userEmail') {
      userEmail = value; // 이메일로 db를 불러온다
       console.log("value = "+userEmail); // userEmail
    }
  });
  form.on('close', function() {
    var query = 'SELECT _id,title,json,time FROM pjh1352.user_draft WHERE user_email=?';
    var params = [userEmail];
    connection.query(query, params, function(err, rows, fields) {
      if (err) {
        console.log("/user/draftForms form.on('close') 오류 ", err);
      } else {
        console.log("/user/draftForms form.on('close') 성공");
        var jsonObject = new Array();

        for (i = 0; i < rows.length; i++) {
          // 와씨 쩌는스킬이야
          var temp = new Object();
          temp._id = rows[i]._id;
          temp.title = rows[i].title;
          //temp.json = JSON.parse(rows[i].json); // string -> jsonObject , no need
          temp.time = rows[i].time;

          jsonObject.push(temp);
        }
        // console.log("/user/draftForms form.on('close') 성공 - jsonObject = ",jsonObject);
        res.status(200).json(jsonObject); // must send, 항상 string 이 전해져? null 없고?
      }

    });
  });

});
router.get('/deleteDraftForms/:form_id', function(req, res, next) {
  var form_id = req.params.form_id;
  console.log("router.get(/deleteDraftForms/:form_id - form_id = ",form_id);
  var query = 'DELETE FROM pjh1352.user_draft WHERE _id=?';
  var params = [form_id];
  connection.query(query, params, function(err, rows, fields) {
    if (err) {
      console.log("router.get(/deleteDraftForms/:form_id - 데이터 Delete 오류");
      res.status(404).send("delete error");
    } else {
      console.log("router.get(/deleteDraftForms/:form_id - 데이터 Delete 성공");
      res.status(200).send("success");
    }
  })
});
router.get('/Draftform/:user_email', function(req, res, next) { // 더보기메뉴
  var userEmail = req.params.user_email;
  var query = 'SELECT _id,title,time FROM pjh1352.user_draft WHERE user_email=?';
  var params = [userEmail];
  connection.query(query, params, function(err, rows, fields) {
    if (err) {
      console.log("/Draftform/:user_email 오류 ", err);
    } else {
      console.log("/Draftform/:user_email 성공");
      var jsonObject = new Array();
      for (i = 0; i < rows.length; i++) {
        var temp = new Object();
        temp._id = rows[i]._id;
        temp.title = rows[i].title;
        temp.time = rows[i].time;

        jsonObject.push(temp);
      }
      console.log("/Draftform/:user_email jsonObject = ", jsonObject);
      res.status(200).json(jsonObject);
    }

  });
});
router.get('/draftload/:form_id', function(req, res, next) {
  var form_id = req.params.form_id; // id는 유니크로 설정해야하나?
  // console.log(`/load/:form_id - form_id = ${form_id}`);
  // id is unique , 즉 1개만 가져옴
  var query = 'SELECT * FROM pjh1352.user_draft WHERE _id=?';
  var params = [form_id];
  console.log(`/draftload/:form_id - params = ${params}`);

  connection.query(query, params, function(err, rows, fields) {
    if (err) {
      console.log("/draftload/:form_id - 오류");
      res.status(404).send("draftload error"); // 아하
    } else {
      // console.log("/load/:form_id - 성공 rows = ",rows);
      //console.log("/load/:form_id - rows.length = ",rows.length); // 1임
      console.log("/load/:form_id - rows[0] = ", rows[0]); // 그냥 rows와 같고

      //console.log("/load/:form_id - rows[1] = ",rows[1]); // undefined , 1이상부터는
      //console.log("/load/:form_id - rows[2] = ",rows[2]); // undefined 네

      //res.status(200).json(JSON.parse(rows[0])); // 이중파서라는데 ?
      // res.status(200).json(rows); // work ?
      res.status(200).json(rows[0]); // work ?
    }
  })
})
router.post('/draftupdate',function(req,res,next){
    var form = new multiparty.Form();
    var form_id;
    var title;
    var description;
    var json;
    form.parse(req);
    form.on('field',function(name,value){
        if(name=='json'){
            var jsonObject = JSON.parse(value);
            title = jsonObject.title;
            description = jsonObject.description;
            json = JSON.stringify(jsonObject.formComponents);

            console.log('router.post draftupdate field - jsonObject = ' + jsonObject);
            console.log('router.post draftupdate field - json = ' + json);
        }
        if(name=='form_id'){
            form_id=value;
            console.log('router.post draftupdate field - form_id = ' +form_id);
        }
    });
    form.on('close',function(){
        console.log('router.post draftupdate - 들어옴');
        var params=[title,description,json,form_id];
        var query='UPDATE pjh1352.user_draft SET title=?,description=?,json=? WHERE _id=?';
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log('router.post draftupdate close- draftupdate 오류');
                res.status(404).send("draftupdate error");
            }else{
                console.log('router.post draftupdate close- draftupdate 성공');
                res.status(200).send("draftupdate success");
            }
        })
    });
});

router.get('/form/:user_email',function(req,res,next){ // 더보기메뉴
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
router.get('/form/:type/:pages',function(req,res,next){
    console.log("/form/:pages 들어옴");
    var type=req.params.type;
    var page=req.params.pages;
    //var offset=(page-1)*10;
    var offset = page * 10;
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

router.get('/load/:form_id',function(req,res,next){
    var form_id=req.params.form_id;
    console.log(form_id);
    var query='SELECT * FROM pjh1352.user WHERE _id=?';
    var params=[form_id];
    connection.query(query,params,function(err,rows,fields){
        if(err){
            console.log("데이터 load 오류");
            res.status(404).send("load error");
        }else{
            console.log("데이터 load 성공");
            //res.status(200).json(JSON.parse(rows[0]));
            res.status(200).json(rows[0]);
        }
    })
})
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
            var jsonArray=new Array();
            for(i=0;i<rows.length;i++){
                var jsonObject=new Object();
                jsonObject.surveyResult=rows[i].result;
                jsonObject.time=rows[i].time;
                jsonArray.push(jsonObject);
            }
            console.log(jsonArray);
            res.status(200).send(jsonArray);
        })
    })
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
router.get('/individualChart/:form_id',function(req,res){
    console.log("/individualChart/:form_id - called ");

        var form_id=req.params.form_id;

        var title;
        var description;
        var json;

        var query='SELECT * FROM pjh1352.user WHERE _id=?';
        var params=[form_id];
        connection.query(query,params,function(err,rows,fields){
            if(err){
                console.log("/individualChart/:form_id - 데이터 select 오류");
                res.status(404);
            }else{

                var jsonObject=new Object();
                jsonObject.title=rows[0].title;
                jsonObject.description=rows[0].description;
                jsonObject.json=rows[0].json;

                console.log("/individualChart/:form_id - jsonObject = ",jsonObject);

                res.status(200).send(jsonObject);
            }

        });
    });
router.post('/user/forms',function(req,res,next){
    console.log("/user/forms");
    var userEmail;
    // var json;
    // var response_cnt;
    var form=new multiparty.Form();
    form.parse(req);
    form.on('field',function(name,value){
        console.log('filed 들어옴');
        if(name=='userEmail'){
            userEmail=value;
            //console.log(json);
        }
    });
    form.on('close',function(){
        var query='SELECT _id,title,json,response_cnt,time FROM pjh1352.user WHERE user_email=?';
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
                    //temp.json= JSON.parse(rows[i].json);
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




router.get('/search_id/:id', function (req, res, next) {
    var Keyword = req.params.id;
    var query = "SELECT _id,title,response_cnt,time FROM pjh1352.user WHERE _id=?"
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
            console.log("데이터 response 성공");
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
            }else{
                res.status(200).send(true);
            }

        }
    });

});


router.get('/user/profile/select/:user_email',function(req,res,next){

    var user_email=req.params.user_email;
    console.log('/user/profile/:user_email : '+user_email);
    fs.stat(__dirname+'/../profile/'+user_email,function(err){
        if(err){
            //throw err;
            console.log(err);
            res.send(false);
        }else{
            var readStream=fs.createReadStream(__dirname+'/../profile/'+user_email)
            readStream.pipe(res);
        }
    })


})


module.exports=router;
