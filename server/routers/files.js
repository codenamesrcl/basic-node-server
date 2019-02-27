var urlUtil = require('url'),
    fs = require('fs-extra'),
    mimetypes = require('mime-types'),
    busboy = require("__app/io/busboy"),
    filesystem_proc = require('__app/system/filesystem')
    ;

function route(request, response){
    var urlSpec = urlUtil.parse(request.url, true);

    var ending = urlSpec.pathname.substr(urlSpec.pathname.lastIndexOf('/'));
    
    //route based on the request pathing
    if(ending === '/file'){
        file(request, response, urlSpec);
    }
    else if(ending === '/folder'){
        folder(request, response, urlSpec);
    }
    else if(ending === '/meta'){
        //for getting metadata on a file or folder based on path
        response.end(null);
    }
    else{
        response.statusCode = 500;
        response.end("Invalid Files API request");
    }
}

function file(request, response, urlSpec){
    //based on the verb, figure out what it wants

    /**
     * The structure of the URL is as follows
     * /files/file?path=[path]
     *
     * where [path] refers to the filepath of the file in question
     * based on the verb it will attempt to perform the action
     * if there is no [path] defined querystring value then the request immediately 500's with the proper reason
     *
     * if it's a POST/PUT then the caller will have posted the data payload object required of the action
     * this allows the URL to be of fixed structure through all 4 request types with the post-able payload
     * only providing additional information beyond the basic GET url structured call
     */

    //we flat out reject any requests that don't have a defined path query
    if(!urlSpec.query.path){
        response.statusCode = 500;
        response.end(JSON.stringify({
            type: "notpath",
            msg: "no path to file defined in querystring"
        }));
        return;
    }
    switch(request.method){
        case "GET":
            //get the file if it exists, else return null
        if(!fs.existsSync(urlSpec.query.path)){   
            response.statusCode = 500;
            response.end(JSON.stringify({
                type: "notfound",
                msg: "file at path:  "+ urlSpec.query.path + " not found"
            }));
        }
        else{
            response.setHeader("Content-Type", mimetypes.lookup(urlSpec.query.path));
            response.setHeader("Content-Length", fs.lstatSync(urlSpec.query.path).size);
   
            var stream = fs.createReadStream(urlSpec.query.path, {bufferSize: 64 * 1024});
            stream.pipe(response);
        }
            
        break;
        case "POST":
        case "PUT":
            //taking the text IDE approach, meaning save/overwrite at the location stated.
            if(!fs.existsSync(urlSpec.query.path)){
                busboy.process(request)
                    .then(function(form){
                        filesystem_proc.file.write(urlSpec.query.path, form.data)
                            .then(
                                ()=>{
                                    response.end();
                                },
                                (err)=>{
				                    console.log(err);
                                    response.statusCode = 500;
                                    response.end(JSON.stringify({
                                        type: 'savefail',
                                        msg: err
                                    }));
                                }
                            );
                    });
            }
            else{
                response.end(null);
            }
            break;
        case "DELETE":
            //delete the file from the filesystem
            if(false){

            }
            else{
                response.end(null);
            }
            break;
        default:
            //invalid action, return error
            response.statusCode = 500;
            response.end("Invalid Files API request for file");
            break;
    }

}

function folder(request, response, urlSpec){
    /**
     * The structure of the URL is as follows
     * /files/folder?path=[path]
     *
     * where [path] refers to the path of the folder in question
     * based on the verb it will attempt to perform the action
     * if there is no [path] defined querystring value then the request immediately 500's with the proper reason
     *
     * if it's a POST/PUT then the caller will have posted the data payload object required of the action
     * this allows the URL to be of fixed structure through all 4 request types with the post-able payload
     * only providing additional information beyond the basic GET url structured call
     */

    switch(request.method){
        case "GET":
            //get the folder and it's immediate contents list if it exists, else return null
            if(fs.existsSync(urlSpec.query.path)){
                filesystem_proc.directory.get(urlSpec.query.path)
                    .then(function(result){
                        response.end(JSON.stringify(result));
                    },
                    function(err){
                        response.statusCode = 500;
                        response.end(JSON.stringify({
                            type: "error",
                            msg: JSON.stringify(err)
                        }));
                    });
            }
            else{
                response.statusCode = 500;
                response.end(JSON.stringify({
                    type: "notfound",
                    msg: "directory at path:  "+ urlSpec.query.path + " not found"
                }));
            }
            break;
        case "POST":
            //create the folder and write the posted contents if and only if the folder doesn't exist yet
            //if it does exist then return null, indicating that the folder exists already
            if(false){

            }
            else{
                response.end(null);
            }
            break;
        case "PUT":
            //rename the folder if the rename doesn't exist
            //if it does exist then return null, indicating that the rename exists already
            if(false){

            }
            else{
                response.end(null);
            }
            break;
        case "DELETE":
            //delete the folder, recursively deleting it's file contents
            if(false){

            }
            else{
                response.end(null);
            }
            break;
        default:
            //invalid action, return error
            response.statusCode = 500;
            response.end("Invalid Files API request for folder");
            break;
    }
}

module.exports = {
    route: route
};
