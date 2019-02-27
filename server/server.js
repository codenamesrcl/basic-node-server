var http = require('http'),
    urlUtil = require('url'),
    fs = require('fs'),
    mimetypes = require('mime-types');

var server = null;

var apirouters = {
    //files: require("./routers/files")
};


/**
 * Creates and starts a http server to act as the epub server
 * @param  {int} port     A value for the server port
 * @return {object}       Returns an object of type {@link epubServer.ServerInfo}
 */
function startServer(port){
    var promise = new Promise(function(resolve,reject){
        if(server == null){
            server = http.createServer(requestHandler)
            server.listen(port, function(){
                console.log("now listening on " + port);
                resolve(port);
            });
        }
        else{
            resolve(port);
        }
    });

    return promise;

}

function requestHandler(request, response){
    if(request.method === 'GET'){
        var urlSpec = urlUtil.parse(request.url, true);

        //determine if the request should be handled by the API handler or the
        //generic handler
        if(urlSpec.pathname.startsWith('/api/')){
            API(urlSpec, response);
        }
        else{
            routeRequest(urlSpec, response);
        }
    }
    else{
        response.write('Invalid verb, this server only accepts GET requests');
        response.end();
    }
}

function routeRequest(urlSpec, response){
    var route = urlSpec.pathname;

    if(urlSpec.pathname.startsWith('/asset/') ||
       urlSpec.pathname.startsWith('/bower_components/')){
        //route = route;
        //nothing needed
    }
    else{
        route = '/server/views' + route;
    }

    route = process.cwd() + route;

    try{
        if(fs.statSync(route).isDirectory()){
            route += '/index.html';
        }

        fs.readFile(route, (err, data) => {
            if (err){
                console.log(err);
                response.statusCode = 500;
                response.end('file not found');
            }
            else{
                response.setHeader("Content-Type", mimetypes.lookup(route))
                response.end(data);
            }
        });
    }
    catch(err){
        response.statusCode = 500;
        response.end('server error');
    }


}

function API(urlSpec, response){
    var apiroute = urlSpec.pathname.substr(5);

    switch(apiroute){
        //  /api/meta
        case "meta":
            break;
        default:
            // response.write();
            response.end("Invalid API request");
            break;
    }
}

module.exports = {
    startServer: startServer
}
