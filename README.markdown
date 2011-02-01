[Nodaphone](http://github.com/dtrejo/nodaphone)
===

See the awesome game demo at [touchtonetanks.com](http://touchtonetanks.com/).
See the barebones demo at [nodaphone.dtrejo.com](http://nodaphone.dtrejo.com/).
There's also some basic documentation over there.

Let me know if I should add more, or if it is unclear. Thanks!

Getting started
===

[Install node.js and npm](http://joyeur.com/2010/12/10/installing-node-and-npm/)

Then clone the git repo like this, install the dependencies, and start up the demo:

    cd nodaphone/
    git submodule update --init --recursive
    npm install eyes socket.io node-static
    node nodaphone.js

(I may have forgotten a dependency, in which case you will need to `npm install` it.)

Much thanks to these technologies and individuals:

* [github.com/twilio](http://github.com/twilio)
* [github.com/learnboost/Socket.IO-node](http://github.com/learnboost/Socket.IO-node)
* [github.com/ry/node](http://github.com/ry/node/)
* [github.com/johndbritton](http://github.com/johndbritton)
* [github.com/Marak](http://github.com/Marak)