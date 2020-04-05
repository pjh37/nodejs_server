const mysql = require('mysql');

module.exports=function(){
    return{
        init:function(){
           return mysql.createConnection({
                host : 'nodejs-003.cafe24.com',
                user : 'pjh1352',
                password : '*',
                datebase : '*',
                charset: 'utf8_bin'
            });
        },dbConnect:function(con){
            con.connect(function(err){
                if(err){
                    console.log('connect error');
                }else{
                    console.log('mysql connected!!');
                }
            });
        }
    }
}