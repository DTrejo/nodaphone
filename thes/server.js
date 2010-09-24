HOST = null; // localhost
PORT = 8888;

var fu = require("./fu")
  , fs = require("fs")
  , sys = require("sys")
  , url = require("url")
  , qs = require("querystring")
  , http = require("http")
  , Step = require('./step');

fu.listen(PORT, HOST);

// html and random
fu.get("/", fu.staticHandler("public/index.html"));
fu.get("/favicon.png", fu.staticHandler("public/images/favicon.png"));

// static
var staticContent = parseFolder('public');
staticContent.forEach(function(file) {
  fu.get('/'+file, fu.staticHandler(file));
});


// Get data from bighugelabs
// api key: 25a323d420cdba259b6aaf3b8fb53447
// url: http://words.bighugelabs.com/api/2/25a323d420cdba259b6aaf3b8fb53447/word/json
fu.get("/words", function (req, res) {
	var json = qs.parse(url.parse(req.url).query)
    , words = decodeURIComponent(json.words).split(' ')
    , results = {};
  console.log('GET /words');
	
	Step(
    // Looks up all words in parallel
    function lookUpWords() {
      for (var i = 0; i < words.length; i++) {
        var word = words[i]
        , bhlURL = 'http://words.bighugelabs.com/api/2/25a323d420cdba259b6aaf3b8fb53447/'+word+'/json';
        createRequest(bhlURL, this.parallel());
      }
    },
    // Sends back to client when done
    function sendBackResults(err, args) {
      if (err) console.log(err);

      for (var i = 0; i < arguments.length - 1; i++) {
        word = words[i];
        results[word] = arguments[i + 1]; // ignore first arg, err
      }
      console.log(results);
      res.simpleJSON(200, results);
    }
  );
});

/**
 * create the request to words.bighugelabs.com
 */
function createRequest(url, callback){
  var headers = { 'Accept': '*/*'
                , 'Host': 'words.bighugelabs.com'
                , 'User-Agent': 'node.js'
                , 'Content-length': 0
                , 'Content-Type': 'text/plain'
                }
    , client = http.createClient(80, "words.bighugelabs.com")
    , req = client.request('POST', url, headers);

  req.on('response', function (response) {
    var body = '';
    response.setEncoding("utf8");
    response.on('data', function(chunk) {
      body += chunk;
    });
    response.on('end', function() {
      // console.log('-- ' + typeof body);
      // console.log(body);
      // console.log('-- ' + response.statusCode);
      
      if (typeof callback === 'function') {
        if (response.statusCode === 200 && typeof body === 'string') {
          callback(null, JSON.parse(body));
        } else {
          callback(new Error('Big Huge Thesaurus: ' + 'problem!' + ' - ' + response.statusCode));
        }
      }
    });
  });
  req.end();
}


/**
* Parses a folder and returns a list of files
*
* @param root {String}
* @return {Array}
*/
function parseFolder(root) {

  var fileList = []
    , files = fs.readdirSync(root);

  files.forEach( function (file) {

    var path = root + "/" + file
      , stat = fs.statSync(path);

    // add to list
    if (stat !== undefined && !stat.isDirectory()) {
      fileList.push(path);
    }

    // recur if directory
    if (stat !== undefined && stat.isDirectory()) {
      fileList = fileList.concat(parseFolder(path));
    }
  });

  return fileList;
}