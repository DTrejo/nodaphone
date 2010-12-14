var sys = require('sys')
  , url = require('url')
  , http = require('http')
  , eyes = require('eyes')
  , querystring = require('querystring')
  , io = require('socket.io')
  , PORT = 8082 // MAKE SURE THIS IS SAME AS SOCKET.IO

  , static = require('node-static')
  
  // Create a node-static server to serve the current directory
  , fileServer = new static.Server('./public', { cache: 7200, headers: {'X-Hello':'Phone controlled tanks!'} });
  
var httpServer = http.createServer(function (request, response) {

  request.body = '';
  request.addListener('data', function(chunk){ request.body += chunk; });

  // now that we have the whole request body, let's do stuff with it.
  request.addListener('end', function () {

    var params = querystring.parse(url.parse(request.url).query);
    var posted = querystring.parse(request.body);
    for (var i in posted) {
      params[i] = posted[i];
    }
    
    // eyes.inspect(params);
    
    // print only relevant debuggin data
    var printme = ['From', 'Digits', 'CallStatus', 'CallDuration']
      , label;
    for (i in printme) {
      label = printme[i]
      if (params[label]) {
        sys.error(label + ': ' + JSON.stringify(params[label]));
      }
    }
    
    // false when there is no client connected.
    sys.error('client connected?: ' + (typeof client !== 'undefined'));
    
    var path = url.parse(request.url).pathname;

    switch(path) {
      
      // This gets POSTed to by twilio when the user first calls in.
      case '/controller.xml':
        if (typeof client !== 'undefined') {
          var msg = { newPlayer: censor(params.From) };
          client.send(msg); // send to self
          client.broadcast(msg); // send to others
          
        } else {
          sys.error('refresh dat page!');
        }

        // REMEMBER: node-static only serves GET and HEAD requests, and twilio makes POST requests against the XML files.
        // This is why we handle file serving in here.
        fileServer.serveFile(path, 200, {}, request, response);
        break; // all done!

      // This gets POSTed to after a user has hit controller.xml. 
      // Once they'd hit digits.xml, they continue to loop in here and we gather their keypad presses.
      // When the person disconnects, twilio includes the CallDuration parameter.
      case '/digits.xml':
        if (params.CallStatus === 'completed' && typeof client !== 'undefined') {
          var msg = { dropPlayer: censor(params.From) };
          client.send(msg); // send to self
          client.broadcast(msg); // send to others
      
        } else if (typeof client !== 'undefined') {
          var msg = { action: [censor(params.From), params.Digits] };
          client.send(msg); // send to self
          client.broadcast(msg); // send to others
        }

        fileServer.serveFile(path, 200, {}, request, response);
        break; // all done!
        

      // Handling plain static content.
      default:
        fileServer.serve(request, response, function (err, res) {
          if (err) { // An error as occured
            sys.error('> Error serving ' + request.url + ' - ' + err.message);
            fileServer.serveFile('404.html', err.headers, err.headers, request, response);
          } else { // The file was served successfully
            console.log('> ' + request.url + ' - ' + res.message);
          }
        });
    }
  });
});


httpServer.listen(PORT)
console.log('> server is listening on http://127.0.0.1:' + PORT);


// All the socket.io magicx.
// a client is a browser.
// a player connected via phone has no representation here. Twilio handles that.
var io = io.listen(httpServer);
var client = undefined; // Allows  be accessed anywhere.

// In order to make more than one clients able to view the game, we will have to send over the map that was first generated when someone joins :|
// and keep track of all kinds of other shitty state.
// states like: tank positions, what terrain is there, what map it is, etc.
io.on('connection', function(c) {
  client = c;
  
  // test data for Justin.
  //client.send({ newPlayer: '555-500-1337' });
  //client.send({ action: '9' });
  
  // tell other clients they joined
  // client.send({ newPlayer: client.sessionId });
  
  // DON'T show connects or disconnects from browsers

  // client.on('message', function(message){
  //   var action = { action: [censor(client.sessionId), message] };
  //   
  //   // why send the message by to yourself? 
  //   // because the game listens to in messages only, so you have to tell the game what happened.
  //   client.send(action); // send to self
  //   client.broadcast(action); // send to others
  // });
  // 
  // client.on('disconnect', function(){
  //   var msg = { dropPlayer: client.sessionId };
  //   client.send(msg); // send to self
  //   client.broadcast(msg);  // send to others
  // });
});

function censor (number) {
  var string = number + '';
  return '+XXX-xxx-' + string.slice(string.length - 4, string.length);
}