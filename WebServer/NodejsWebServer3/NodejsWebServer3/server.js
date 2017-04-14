// Cannot see this from laptop! Make sure to set Loominary.html to "require in project"
var http = require('http'),
    fs = require('fs'),
    qs = require('querystring');
//var io = require('socket.io')(http.createServer(handler));

var io;
var htmlConnection;
var fileName = "Loominary.html";
var redThread = "red";
var lastSent = 0;
fs.exists(fileName, function (exists) {
    if (exists) {
        fs.stat(fileName, function (error, stats) {
            fs.readFile('Loominary.html', function (err, html) {
                if (err) {
                    console.log(err);
                }
                // This handles the initial GET request from the browser application. It will display the
                // story as a webpage.
                io = require("socket.io")(http.createServer(function (req, res) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(html);
                    res.end();
                }).listen(process.env.port || 1337));

                // This is the function that happens when we get a new connection
                console.log("about to try io.on");
                io.on('connection', function (socket) {
                    // Get here when the IoT browser connects!!
                    // Story only shows up when you get here, not before.
                    console.log("inside io.on");
                    htmlConnection = socket;
                    htmlConnection.on('response', function (color) {
                        console.log("color");
                        console.log(color.color);
                    });
                });

                // This handles the POST requests from the RFID hardware. 
                http.createServer(function (req, res) {
                    if (req.method === 'POST') {
                        var body = '';
                        // When we get data, add it to the body.
                        req.on('data', function (data) {
                            body += data;
                            if (body.length > 1e6) {
                                req.connection.destroy();
                            }
                        });
                        // When we reach the end of the request, parse the body JSON
                        req.on('end', function () {
                            // get tag id
                            var result = JSON.parse(body);
                            var tagId = result[0].TagId;

                            // If we have sent a message recently, wait a few seconds for the user to finish their
                            // current weave.
                            var date = new Date();
                            var timeReceived = Math.round(date.getTime() / 1000);
                            if (timeReceived - lastSent > 10 || lastSent == 0) {
                                console.log("Send the message!");
                                lastSent = timeReceived;
                                // associate with color
                                console.log(tagId);
                                if (htmlConnection) {
                                    htmlConnection.emit('choice', { tag: tagId });
                                }
                            }

                        });
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('post received');
                    }
                    else {
                        // Shouldn't be getting anything here, but just in case...
                        console.log("GET");
                    }
                    // set timer here
                }).listen(process.env.port || 1338);
            });
        });
    }
    else {
        console.log("Does not exist");
    }
});