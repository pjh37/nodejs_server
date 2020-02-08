const mysql=require('mysql');
const path=require('path');
const multiparty=require('multiparty');
const express=require('express');
const ejs=require('ejs');
const socket=require('socket.io');
const app=express();
const saveRouter=require('./router/form.js');

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(__dirname + '/public'));
app.use(express.static('save'));
app.use('/',saveRouter);

app.set('views',path.join(__dirname,'views'));
app.set("view engine","ejs");
app.get('/',function(req,res){
    res.sendFile(__dirname+'/main.html');
});

app.listen(8001,()=>{
    console.log('server start!');
});