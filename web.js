const express = require('express');
const app=express()
const port = 8001;
const path = require('path');
const ejs = require('ejs');
const saveRouter = require('./router/form.js');
const groupRouter = require('./router/group.js');
const postRouter = require('./router/post.js');
// const multiparty=require('multiparty');
// const socket=require('socket.io');
// const mysql=require('mysql');
// const fs = require('fs');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/', saveRouter);
app.use('/group', groupRouter);
app.use('/post', postRouter);

app.use(express.static(__dirname + '/save')); // 보안성 증가
app.use(express.static(__dirname + '/public'));

app.set('views',path.join(__dirname,'views'));
app.set("view engine","ejs");
app.get('/',function(req,res){
    res.sendFile(__dirname+'/main.html');
});

app.listen(port,()=>{
    console.log(`checkmate server start! on port ${port} !`);
});
