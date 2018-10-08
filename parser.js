var fs = require('fs');
const properties = require("./properties");
var xml2js = require('xml2js');
var dbwrapper = require('./dbms/dbwrapper');
var logger = require('./logger');
var async = require('async');
var queries = require('./dbms/queries');

var counter = 0;

var db = dbwrapper.getInstance(
    {
        dbtype: properties.dbms.type,
        dbconfig: properties.dbms[properties.dbms.type],
        commitonerror: properties.commitonerror
    }
);


db.logger(logger);


async function getFilesPaths() {

    return new Promise(async (resolve, reject) => {
        try {
            var paths = await fs.readdirSync(properties.metadata_dir);
            resolve(paths)
        } catch (err) {
            logger.error("GetFilesPath " + err);
            reject(err);
        }
    });
}


async function process() {

    // queue of db requests
    // var q = async.queue(submittodb, 20);


    // open db bool
    await db.init();

    // check if output table exists
    logger.info("Wait till we check if necessary tables exist");
    var populatedrecords = await new Promise((resolve, reject) => {
        submittodb({
            query: queries.oracle.default_options.table_exists,
            b: null,
            id: dbrequestid()
        }, function (err, args) {
            if (err) {
                reject(err);
            } else {
                resolve(args);
            }
        })
    });

    logger.info("Obtained " + populatedrecords.length + " records");

    if (populatedrecords == 0) { //let's create table
        logger.info("Let's create table");

        var populatedrecords = await new Promise((resolve, reject) => {
            submittodb({
                query: queries.oracle.default_options.create,
                b: null,
                id: dbrequestid()
            }, function (err, args) {
                if (err) {
                    reject(err);
                } else {
                    resolve(args);
                }
            })
        });

    }

    // get list of files in directory
    var files = await getFilesPaths();

    var bindvars = 0;
    var errors = [];

    var queue = async.queue(async function (file) {
        try {
            logger.info("Parsing:" + file);

            var results = await parseFile(file)

            errors.push(results);

            bindvars++;
            logger.info("Parsed: " + file + ", processed so far:" + bindvars);
            logger.info("queue.length: " + queue.length() + ", running tasks: " + queue.running());

            return results;

        } catch (err) {
            logger.error("worker returned: " + err);
            throw err;

        }
    }, 5);

    function done() {
        queue.drain = null;
        logger.info("Done! look below for results summary");
        var summary={
            rowsAffected:0,
            errors: {
                count:0,
                list:[]
            }

        }
        var b={}
        errors.forEach(v=>{
            summary.rowsAffected+=v[0].rowsAffected;
            summary.errors.count+=v[0].errors.count;
            if(v[0].errors.count>0){
                
                v[1].forEach(error=>{
                   (b[error.message])?b[error.message]+=1: b[error.message]=1;
                })
                
            }
            
        })
        summary.errors.list.push(b);

        logger.info(JSON.stringify(summary, null, 2));
        db.releaseResources();
    }

    // Will only be executed when the queue is drained
    queue.drain = done;

    queue.error = function (err) {
        if (err) logger.error(err.message);
    }

    //var worker = 


    queue.push(files, function (err) {
        logger.info("async callback");
        if (err) {
            logger.error("task returned error:" + err);
            throw err;
        }
    });




}


function parseFile(file) {

    return new Promise((resolve, reject) => {
        try {
            const content = fs.readFileSync(properties.metadata_dir + '\\' + file)

            var parser = new xml2js.Parser();


            parser.parseString(content, (err, data) => {
                try {

                    if (data.metaData) {
                        var application = data.metaData.cfgApplication[0]["$"];
                        var sections = data.metaData.cfgApplication[0].configuration[0].options[0].section;

                        var counter = 0;
                        if (sections) {
                            let bindvars = []; // comment in case of troubleshooting
                            for (var i = 0; i < sections.length; i++) {
                                var section = sections[i];
                                for (var k = 0; k < section.parameter.length; k++) {
                                    //let bindvars = []; // uncomment for troubleshooting
                                    var option = section.parameter[k];
                                    var parsedObject = {};
                                    counter++;



                                    parsedObject.templateVersion = (application.templateVersion) ? application.templateVersion : "";
                                    parsedObject.version = (application.version) ? application.version : "";
                                    parsedObject.type = (application.type) ? application.type : "";

                                    parsedObject.section = section["$"].name;
                                    parsedObject.opt = option["$"].name;
                                    parsedObject.hidden = (option["$"].hidden) ? option["$"].hidden : "false";
                                    parsedObject.readonly = (option["$"].readOnly) ? option["$"].readOnly : "false";

                                    parsedObject.description = option_value_toString(option.description);

                                    parsedObject.effective = option_value_toString(option["effective-description"]);
                                    parsedObject.valid = option_value_toString(option["valid-description"]);
                                    parsedObject.val = (option.format) ? option.format[0]["$"].default : "";
                                    parsedObject.fname = file;

                                    //logger.debug("Adding record id#" + counter + " '" + file + "/" + parsedObject.type + "/" + parsedObject.version + "/" + parsedObject.section + "/" + parsedObject.opt + "`");

                                    bindvars.push(parsedObject);
                                    /* uncomment in case of troubleshooting only 
                                                                        submittodb({b:bindvars, id:dbrequestid}, function (args) {
                                                                            resolve(args);
                                                                        });
                                    
                                                                        */

                                }

                            }
                            /* comment in case of troubleshooting */
                            submittodb({ query: queries.oracle.default_options.insert, b: bindvars, id: dbrequestid() }, function (err, args) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(args);
                                }
                            });


                        } else {
                            logger.error(file + " doesn't contain options");
                            resolve({ error: file + " doesn't contain options" })
                        }

                    }
                } catch (err) {
                    logger.error("can't parse xml structure of " + file + ", " + err);
                    logger.error(err.stack);
                    resolve({ error: "can't parse xml structure of " + file + ", " + err });
                }
            })

        } catch (err) {
            logger.error(err.stack)
            reject(err);
        }
    });
}

dbrid = 0
function dbrequestid() {
    return ++dbrid;
}


function submittodb(bind, callback) {
    var _id = bind.id;
    //dbrequestid++;
    var blength = (bind.b) ? bind.b.length : 0;
    logger.info("Submit to db #id:" + _id + " bindvars.length: " + blength);

    db.handleRequest({
        query: bind.query,
        bindvars: bind.b || null,
        id: { id: _id }
    }
    ).then(result => {
        logger.info(result);
        callback(null, result);
    }).catch(err => {
        callback(err);
        throw err;
    });

}

function option_value_toString(option) {
    if (option) {
        if (option[0]["_"]) {
            return option[0]["_"];
        } else {
            return option[0];
        }
    } else {
        return "<empty>";
    }
}

process();
