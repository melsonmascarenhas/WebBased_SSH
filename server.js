var WebSocket = require("faye-websocket");
var express = require("express");
var app = express();
var server = require("http").Server(app);
var term = require("term.js");
var ssh = require("ssh2");
var liveServer = require("live-server");
var opn = require("opn");

server.on("upgrade", function (request, socket, body) {
  if (WebSocket.isWebSocket(request)) {
    var ws = new WebSocket(request, socket, body);
    var conn;
    ws.on("open", function () {
      conn = new ssh();
      conn
        .on("ready", function () {
          ws.write("\n*** SSH CONNECTION ESTABLISHED ***\n");
          conn.shell(function (err, stream) {
            if (err) {
              ws.write("\n*** SSH SHELL ERROR: " + err.message + " ***\n");
              conn.end();
              return;
            }

            // Force binary strings to be sent over websocket to prevent
            // getting a Blob on the browser side which term.js cannot
            // currently handle
            stream.setEncoding("binary");

            stream
              .pipe(ws)
              .pipe(stream)
              .on("close", function () {
                conn.end();
              });
          });
        })
        .on("close", function () {
          ws.write("\n*** SSH CONNECTION CLOSED ***\n");
          ws.close();
        })
        .connect({
          //change host ,username,password with your desirable ssh credentials
          host: "test.rebex.net",
          port: 22,
          username: "demo",
          password: "password",
        });
    }).on("close", function (event) {
      try {
        conn && conn.end();
      } catch (ex) {}
    });
  }
});

server.listen(8000, "127.0.0.1");

app.use(express.static(__dirname + "/public"));
app.use(term.middleware());
// opens the url in the default browser
opn("http://localhost:8000/index.html");

// specify the app to open in
//here i set  default browser firefox,you can change it .or if you dont want just comment that .
opn("http://localhost:8000/index.html", { app: "firefox" });
