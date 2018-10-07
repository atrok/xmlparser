/* Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   webapp.js
 *
 * DESCRIPTION
 *   Shows a web based query using connections from connection pool.
 *
 *   This displays a table of employees in the specified department.
 *
 *   The script creates an HTTP server listening on port 7000 and
 *   accepts a URL parameter for the department ID, for example:
 *   http://localhost:7000/90
 *
 *   Uses Oracle's sample HR schema.  Scripts to create the HR schema
 *   can be found at: https://github.com/oracle/db-sample-schemas
 *
 *****************************************************************************/

var ora = require('oracledb');
var dbConfig = require('./dbconfig.js');
//var fs = require('fs');
//var path = require('path');
const logger = require('../logger');
var Queue = require('../libs/Queue');


// Main entry point.  Creates a connection pool, on callback creates an
// HTTP server that executes a query based on the URL parameter given.
// The pool values shown are the default values.
var oracledb = function () {
}

oracledb.prototype.addConfiguration = function (config) {
  this.config = config;
  //
  this.pool = null;
  this.batchQueue = new Queue();
  this.batchsize = (this.config.batchsize) ? this.config.batchsize : 1;
  this.execbatch = [];

 

  return this;
}

oracledb.prototype.assignlogger = function (logger) {
  this.logger = logger;
  this.logger.info(JSON.stringify(this.config));
  return this;
}

oracledb.prototype.log = function () {
  var logger = this.logger;
  
  return logger;
}

oracledb.prototype.init = async function () {
  
 var config=this.config.dbconfig;

  return new Promise(async (resolve, reject) => {
    try {
      var res = await ora.createPool({
        user: config.user || dbConfig.user,
        password: config.password || dbConfig.password,
        connectString: config.connectString || dbConfig.connectString,
        // Default values shown below
        // externalAuth: false, // whether connections should be established using External Authentication
        poolMax: 100, // maximum size of the pool. Increase UV_THREADPOOL_SIZE if you increase poolMax
        // poolMin: 0, // start with no connections; let the pool shrink completely
        // poolIncrement: 1, // only grow the pool by one connection at a time
        // poolTimeout: 60, // terminate connections that are idle in the pool for 60 seconds
        // poolPingInterval: 60, // check aliveness of connection if in the pool for 60 seconds
        // queueRequests: true, // let Node.js queue new getConnection() requests if all pool connections are in use
        queueTimeout: 120000, // terminate getConnection() calls in the queue longer than 60000 milliseconds
        // poolAlias: 'myalias' // could set an alias to allow access to the pool via a name
        // stmtCacheSize: 30 // number of statements that are cached in the statement cache of each connection
        _enableStats: true

      });

      resolve("Oracle DB pool is created");
    } catch (err) {
      reject(err);
    }

  })
}

/*
return new Promise(async (resolve, reject) => {
  try {


    // clientlogger.print('<p><h3>Executing against Oracle DB</h3>' + this.config.host + '/' + this.config.dbname + "<br/>" + this.config.user + '<br/></p>');

    //console.log('creating oracle connection  pool, moving to handle request');


    var result = await handleRequest(clientlogger, {
      pool: this.pool,
      query: query
    })

    // callback(response, result);
    //result.catch((e)=>{setTimeout(function(e){throw e})}); // taking care of possible result promise rejections/exceptions
    //TODO add time of query execution            
    resolve(result);
  } catch (e) {
    console.log('Catch it!', e.stack);
    reject(e);
  }

});

}
*/
oracledb.prototype.handleRequest = function (params) {

  var clientlogger = this.log();

  var commitonerrors = this.config.commitonerrors;

  return new Promise(async (resolve, reject) => {
    var pool = ora.getPool();
    var id=params.id;

    try {
      // Checkout a connection from the pool

      var connection = await pool.getConnection();

      clientlogger.debug("#id"+JSON.stringify(id)+' got connection');
      //var query = fs.readFileSync(path.resolve(__dirname, config.ua.dbms.oracle.component_query), 'utf-8');
      //var query = config.query;
      var result=null;

      if(params.bindvars){
      result = await connection.executeMany(params.query, params.bindvars, { autoCommit: true, batchErrors: true });
    }else{
      result = await connection.execute(params.query);
    }

      result.vars = id;
      clientlogger.debug("#id"+JSON.stringify(id)+' got the query results, start processing results');

      if (result.batchErrors){
        if(commitonerrors) {
        connection.commit(err => {
          clientlogger.info("Committed on error!");
          if(err) 
          reject("Failed to commit on error. #id "+JSON.stringify(id)+", "+err.message);
        });
      }else{
        clientlogger.info("#id "+JSON.stringify(id)+" is not committed because of errors! set `commitonerror` in dbwrapper to true if commit on error is required");
      }
    }

      close(connection);

     

      resolve(result);

    } catch (err) {
      //html.handleError(response, "Oracle DB communication error", err);
      clientlogger.error(err.stack);
      pool._logStats();
      clientlogger.error("id:"+JSON.stringify(id)+"\n"+ JSON.stringify(params, null,3));
      if(connection) close(connection);
      reject({rowsAffected:0, vars:id, batchErrors: [err.message], error: err});
      throw new Error(err);

      

    }

    function close(connection){
      connection.close(function (err) {
      if (err) {
        //html.handleError(response, "normal release() error", err);
        clientlogger.error("Failed to close connection #id "+JSON.stringify(id)+", "+err.stack);
        throw new Error("id:"+JSON.stringify(id)+", error:"+err.message);
        
      } else {
        clientlogger.info('Oracle connection ' + JSON.stringify(id) + ' is closed!');
        //return res;
      }
    });}

  })

}

module.exports = new oracledb();