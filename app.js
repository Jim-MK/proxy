var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var proxy_pass = require('./proxy_pass');
var proxy_configure = require('./proxy_configure');
var fs = require('fs');
var app = express();

global.__router__ = express.Router();

app.locals.basePath = "/"+global.proxy_project;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html',ejs.__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/",global.__router__);
function walk_route(path){
    var files = fs.readdirSync(path);
    for(var i in files){
        var file = files[i];
        var filepath = path+"/"+file;
        var stat = fs.lstatSync(filepath);
        if(stat.isDirectory()){
            walk_route(filepath);
        }else{
            var jsindex = file.indexOf(".js");
            if(jsindex!=-1){
               var routename = file.substring(0,jsindex);
                var routepath = path +"/"+ routename;
                require(routepath);
            }
       }
    }
}
walk_route("./routes");
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    proxy_pass.proxy_request(req, res, next,function(body){
        res.send(body);
    })
});


// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

