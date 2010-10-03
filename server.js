var static = require('node-static')
  , http = require('http')
  
  // Create a node-static server instance to serve the './public' folder
  , fileServer = new static.Server('./public');

http.createServer(function (request, response) {
  request.addListener('end', function () {

    // Serve files!
    fileServer.serve(request, response, function (e, res) {
      if (e && (e.status === 404)) { // If the file wasn't found
        // fileServer.serveFile('404.html', request, response);
        fileServer.serveFile('404.html', 404, {}, request, response);
      }
    });
  });
}).listen(80);