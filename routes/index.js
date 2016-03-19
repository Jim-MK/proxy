var proxy_pass = require('../proxy_pass');

proxy_pass.get(["/","/index","/index.php"],"index",{
  "title":"Proxy 的头"
},function(req, res){
    console.log("##################");
    console.log(res.statusCode);
});
