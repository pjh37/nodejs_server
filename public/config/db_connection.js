const mysql = require('mysql');

module.exports=function(){
    return{
        init:function(){
           return mysql.createConnection({
               host: '203.229.46.196',
               user: 'yoone3452',
               password: '!hsy3682qe',
               datebase: 'pjh1352',
               port: '3306',
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