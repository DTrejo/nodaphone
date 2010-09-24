// Used to run code in a directory and rerun it if any files are changed.
// usage: node run.js servercode.js
// servercode.js is whatever js file you want to run with node.

// Excludes filetypes in the ignoreExtensions array
var sys = require('sys'),
	fs = require('fs'), 
	spawn = require('child_process').spawn,
	child, // child process which runs the actual code
	ignoreExtensions = ['.dirtydb', '.db'];

if (process.argv.length !== 3){
	sys.puts('\nFound '+process.argv.length+' argument(s). Expected three.');
	sys.puts('Usage: \nnode run.js servercode.js');
  return;
}
	
	
run();
watchFiles(parseFolder('.'), run); // watch all files, restart if problem

// executes the command given by the second argument
function run() { 

	// kill if running
	if (child !== null && child !== undefined){
		child.kill();
	}
		
	// run the server
	child = spawn('node', [process.argv[2]]);
	
	// let the child's  'puts'  escape.
	child.stdout.addListener('data', function(data) { 
		sys.print(data);
	});
	child.stderr.addListener('data', function(error) { 
		sys.print(error);
		// this allows the server to restart when you change a file. Hopefully the change fixes the error!
		child = undefined;
	});
	
	sys.puts('\nStarting: ' + process.argv[2]);
}

/**
* Parses a folder and returns a list of files
*
* @param root {String}
* @return {Array}
*/
function parseFolder(root) {

    var fileList = [];
    var files = fs.readdirSync(root);

    files.forEach( function (file) {
		
        var path = root + "/" + file;
        var stat = fs.statSync(path);
		
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


/**
* Adds change listener to the files
*
* @param files {Array}
*/
 function watchFiles(files, callback) {

    var config = {  persistent: true,
					interval: 1
	};

    sys.puts("watched files:");

    files.forEach( function (file) {
		
		// don't include certain files
		var ext = file.slice(file.lastIndexOf('.'), file.length);
		if(ignoreExtensions.indexOf(ext) !== -1) {
			sys.puts("ignored "+file);
			return;
		}
	
        sys.puts(file);
        
		// if one of the files changes
        fs.watchFile(file, config, function (curr, prev) {

            if ((curr.mtime + "") != (prev.mtime + "")) {
                sys.puts(file + " changed");
				
                if (callback !== undefined) {
                    callback();
                }
            }
        });
    });
}