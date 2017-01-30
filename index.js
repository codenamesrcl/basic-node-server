var server = require('./server/server');

server.startServer(16000, function(port){
    console.log("server started on port " + port);
})
