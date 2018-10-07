var msql = require('mssql');
var dbConfig = require('./dbconfig.js');
var fs = require('fs');
var path = require('path');
const logger = require('../logger');



// Main entry point.  Creates a connection pool, on callback creates an
// HTTP server that executes a query based on the URL parameter given.
// The pool values shown are the default values.
var mssqldb = function () {
}

mssqldb.prototype.addConfiguration = function (config) {
  this.config = config;
  return this;
}

mssqldb.prototype.assignlogger=function(logger){
  this.l=logger;
  return this;
}

mssqldb.prototype.log=function(){
 //var logger=this.logger;
  var console=function(){}
  console.prototype.print=function(str){logger.log(str)}

  var clientlogger=function(){}
  clientlogger.prototype.print=function(str){
    this.l.log(str);
  }
  clientlogger.prototype.l=this.l;
  

  if (typeof this.l==='undefined') return new console();
  return new clientlogger();
}

mssqldb.prototype.getConnectString=function(){
    return (this.config.host && this.config.dbname) ? 'mssql://'+this.config.user+':'+this.config.pass+'@'+this.config.host + '/' + this.config.dbname : dbConfig.connectString;
}
mssqldb.prototype.init = function (response) {
  var clientlogger=this.log();
  return new Promise(async (resolve, reject) => {
    try {

      
      clientlogger.print('<p><h3>Opening connection to </h3> mssql://'+this.config.user+':'+this.config.pass+'@'+this.config.host + '/' + this.config.dbname  + '</p>');
    
      //console.log('creating oracle connection  pool, moving to handle request');

     //  mssql://username:password@localhost/database
      var result = await handleRequest(clientlogger, {
        user: this.config.user || dbConfig.user,
        password: this.config.pass || dbConfig.password,
        connectString: this.getConnectString()
      })

     // callback(response, result);
     //result.catch((e)=>{setTimeout(function(e){throw e})}); // taking care of possible result promise rejections/exceptions
      //TODO add time of query execution            
      resolve(result);
    } catch (e) {
      console.log ('Catch it!', e.stack);
      reject(e);
    }

  });

}

var handleRequest = function (clientlogger, params) {

  return new Promise(async (resolve, reject) => {
    var pool = new msql.ConnectionPool(params.connectString);
    try {
      // Checkout a connection from the pool
      // var connection = await pool.getConnection();
      //var sql=new msql();

    
    await pool.connect();
    
     clientlogger.print('got MSSQL connection ');

      var query = fs.readFileSync(path.resolve(__dirname, config.ua.dbms.mssql.component_query), 'utf-8');

      let result = await pool.request().query(query);

      clientlogger.print('got the query results, start processing results');



      resolve(result);

    } catch (err) {
      //html.handleError(response, "Oracle DB communication error", err);
      console.log(err.stack);
      reject(err);

    }finally{     
        
         pool.close(function (err) {
        if (err) {
          //html.handleError(response, "normal release() error", err);
          throw new Error(err);
        } else {
          clientlogger.print('MSSQL connection is closed!');
          //return res;
        }
      });
    
    }
  })
}

module.exports =  mssqldb;