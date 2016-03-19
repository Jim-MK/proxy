var request = require('request');
var fs = require('fs');
var proxy_configure = require('./proxy_configure');

/**
 * 转发请求
 * 只有正确返回json数据，callback才会回调
 * @param req
 * @param res
 * @param next
 * @param callback
 */
function proxy_request(req, res, next, callback) {
    req.pipe(request({
        "url":proxy_configure.proxy_url + req.originalUrl,
        "encoding":null
    },function(rreq,rres,body){
        if(rres){
            if (rres.statusCode == 200) {
                var contentType = rres["headers"]["content-type"];
                if (contentType && contentType.indexOf("json") != -1) {
                    var body_str = body.toString(proxy_configure.proxy_encode);
                    var body_json = JSON.parse(body_str);
                    callback(body_json);
                } else{
                    res.writeHead(rres.statusCode,rres.statusMessage,rres.headers);
                    res.end(body);
                }
            } else if (rres.statusCode == 301 || rres.statusCode == 302 ){
                res.writeHead(rres.statusCode,rres.statusMessage,rres.headers);
                res.end(body);
            } else{
                var body_str = body.toString(proxy_configure.proxy_encode);
                var err = new Error(body_str);
                err.status = rres.statusCode;
                next(err);
            }
        }
    })).on("error",function(err){
        err.status = 500;
        next(err);
    });
}

function _return_res(res,render_file,body){
    if(render_file){
        res.render(render_file, body);
    }else{
        res.setHeader("content-type","text/json");
        res.end(JSON.stringify(body));
    }

}
function router_create_one(method, url, render_file, debug_data, debug_filter) {
    global.__router__[method](proxy_configure.proxy_project + url, function (req, res, next) {
        if (proxy_configure.routes_mock && debug_data) { //虚拟的返回数据
            if (typeof(debug_data) == "string") { //虚拟文件
                if(debug_data.toLowerCase().indexOf(".json")!=-1){  //虚拟json文件
                    fs.readFile("./mocks/" + debug_data, 'utf-8', function (err, read_data) {
                        if (err) {
                            next(err);
                        } else {
                            var read_data_json = JSON.parse(read_data);
                            if(proxy_configure.routes_filter  && debug_filter){
                                debug_filter(req,res);
                            }
                            _return_res(res,render_file,read_data_json);
                        }
                    })
                }else{ //虚拟二进制文件
                    fs.readFile("./mocks/" + debug_data,null, function (err, read_data) {
                        if (err) {
                            next(err);
                        } else {
                            res.setHeader("content-type","application/octet-stream");
                            res.setHeader("content-disposition","attachment;fileName="+debug_data);
                            res.end(read_data);
                        }
                    })
                }
            } else { //虚拟json对象
                if(proxy_configure.routes_filter  && debug_filter){
                    debug_filter(req,res);
                }
                _return_res(res,render_file,debug_data);
            }
        } else { //真实的代理返回数据
            proxy_request(req, res, next, function (body) {
                if(proxy_configure.routes_filter  && debug_filter){
                    debug_filter(req,res);
                }
                _return_res(res,render_file,body);
            });
        }
    });
}
function router_create(method, urls, render_file, debug_data, debug_filter) {
    if (Array.isArray(urls)){
        for(var i=0;i<urls.length;i++){
            router_create_one(method,urls[i], render_file, debug_data, debug_filter);
        }
    }else{
        router_create_one(method,urls, render_file, debug_data, debug_filter);
    }
}
function router_create_all(urls, render_file, debug_data, debug_filter) {
    router_create("all", urls, render_file, debug_data, debug_filter);
}

function router_create_get(urls, render_file, debug_data, debug_filter) {
    router_create("get", urls, render_file, debug_data, debug_filter);
}

function router_create_post(urls, render_file, debug_data, debug_filter) {
    router_create("get", urls, render_file, debug_data, debug_filter);
}

function router_create_put(urls, render_file, debug_data, debug_filter) {
    router_create("get", urls, render_file, debug_data, debug_filter);
}

function router_create_delete(urls, render_file, debug_data, debug_filter) {
    router_create("get", urls, render_file, debug_data, debug_filter);
}

module.exports = {
    "proxy_request":proxy_request,
    "all": router_create_all,
    "get": router_create_get,
    "post": router_create_post,
    "put": router_create_put,
    "delete": router_create_delete
};
