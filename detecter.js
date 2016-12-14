/**
 * Created by liuff on 2016/12/13 21:27
 */
var querystring = require('querystring');
var http = require('http');

var ES = "10.16.33.175";
var PORT = 9200;
var PATTERN = "sharpview-*";

// An object of options to indicate where to post to
var indices = {
    host: ES ,
    port: PORT,
    path: "/_cat/indices",
    method: 'GET'
};

var http = require("http");
var https = require("https");

var s = "";
for (var i=0; i<PATTERN.length; i++) {
    if (PATTERN[i] == "*") {
        s += ".*";
        continue;
    }
    if (PATTERN[i] == "?") {
        s += ".?";
        continue;
    }
    s += PATTERN[i];
}
var compiledPattern = new RegExp(s, "g");

get = function(options, onResult)
{
    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function(res)
    {
        var output = '';
        // console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            onResult(res.statusCode, output);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
        console.error("Failed to send request", err.message);
    });

    req.end();
};

function getIndexName(line) {
    var items = line.split(" ");
    return items[2];
}

function process(index) {

    if (index.search(compiledPattern) == -1) {
        return;
    }

    get( {
        host: ES,
        port: 9200,
        path: "/" + index + "/_mappings",
        method: "GET"
    }, function(code, result) {
      if (code == 200) {
          console.log("Checking index", index);
          var obj = JSON.parse(result);
          for (var key in obj) {
              var m = obj[key];
              if (m == null) {
                  continue;
              }
              var mappings = m["mappings"];
              if (mappings == null) {
                  continue;
              }
              for (var type in mappings) {
                  // console.log("Get a type ", type);
                  if (mappings[type] == null) {
                      continue;
                  }
                  var properties = mappings[type].properties;
                  for (var field in properties) {
                      var f = properties[field];
                     // console.log(f);
                      if (f == null) {
                          continue;
                      }
                      var fieldType = f.type;
                    //  console.log("-> ", type, field, "-", fieldType);
                      audit(index, type, field, fieldType);
                  }
              }
              // console.log(mappings);
          }
      }
    });
}

var allData = {};
function audit(index, type, field, fieldType) {
    var list = allData[field];
    if (list == null) {
        list = [];
    }
    list.push( {
        "index" : index,
        "type" : type,
        "field" : field,
        "fieldType" : fieldType
    })
    allData[field] = list;

    if (list.length > 1) {
        check(list);
    }
}

function check(list) {
    for (var i=0; i<list.length; i++) {
        for (var j=0; j<i; j++) {
            if (i == j) {
                continue;
            }
            var type0 = list[i].fieldType;
            var type1 = list[j].fieldType;
            var level = isOK(type0, type1);
            if (level == null) {
                console.warn("No data found for ", key)
                return 0;
            }
            if (level == 9) {
                console.log("ERR ", list[i].index + "/" + list[i].type + "/" + list[i].field
                    + " is " + type0, " conflict with ",
                    list[j].index + "/" + list[j].type + "/" + list[j].field
                )
            }
            if (level == 1) {
                console.log("WARN ", list[i].index + "/" + list[i].type + "/" + list[i].field
                    + " is " + type0, " is not same. May cause performance/precision problems ",
                    list[j].index + "/" + list[j].type + "/" + list[j].field
                )
            }
        }
    }
}

var matrix = {};
matrix["string,string"] = 0;
matrix["string,float"] = 9;
matrix["string,double"] = 9;
matrix["string,integer"] = 9;
matrix["string,date"] = 9;
matrix["string,long"] = 9;
matrix["string,number"] = 9;
matrix["string,byte"] = 9;

matrix["float,float"] = 0;
matrix["float,string"] = 9;
matrix["float,double"] = 1;
matrix["float,integer"] = 1;
matrix["float,date"] = 9;
matrix["float,long"] = 1;
matrix["float,number"] = 0;
matrix["float,byte"] = 1;

matrix["double,float"] = 1;
matrix["double,string"] = 9;
matrix["double,double"] = 0;
matrix["double,integer"] = 1;
matrix["double,date"] = 9;
matrix["double,long"] = 1;
matrix["double,number"] = 0;
matrix["double,byte"] = 1;

matrix["integer,float"] = 1;
matrix["integer,string"] = 9;
matrix["integer,double"] = 1;
matrix["integer,integer"] = 0;
matrix["integer,date"] = 9;
matrix["integer,long"] = 1;
matrix["integer,number"] = 0;
matrix["integer,byte"] = 1;


matrix["date,float"] = 9;
matrix["date,string"] = 9;
matrix["date,double"] = 9;
matrix["date,integer"] = 9;
matrix["date,date"] = 0;
matrix["date,long"] = 9;
matrix["date,number"] = 9;
matrix["date,byte"] = 9;

matrix["long,float"] = 1;
matrix["long,string"] = 9;
matrix["long,double"] = 1;
matrix["long,integer"] = 1;
matrix["long,date"] = 9;
matrix["long,long"] = 0;
matrix["long,number"] = 0;
matrix["long,byte"] = 1;

matrix["number,float"] = 0;
matrix["number,string"] = 9;
matrix["number,double"] = 0;
matrix["number,integer"] = 0;
matrix["number,date"] = 9;
matrix["number,long"] = 1;
matrix["number,number"] = 0;
matrix["number,byte"] = 1;

matrix["byte,float"] = 1;
matrix["byte,string"] = 9;
matrix["byte,double"] = 1;
matrix["byte,integer"] = 1;
matrix["byte,date"] = 9;
matrix["byte,long"] = 1;
matrix["byte,number"] = 0;
matrix["byte,byte"] = 0;



function isOK(type0, type1) {
    var key = type0 +"," + type1;
    var level = matrix[key];
    return level;
}

get(indices, function(code, obj) {
    if (code == 200) {
        var lines = obj.split("\n");
        console.log("Get " + lines.length + " indices.");
        for (var i=0; i<lines.length; i++) {
            var name = getIndexName(lines[i]);
            if (name != undefined) {
                process(name);
            }
        }
    }
});

