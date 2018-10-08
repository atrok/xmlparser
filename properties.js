module.exports = {
    //metadata_dir: "e:\\metadata",
    metadata_dir: "C:\\Users\\Administrator\\My Documents\\metadata_files",

    dbms: {
        type: "oracle",
        commitonerror: true,

        oracle: {
            user: process.env.NODE_ORACLEDB_USER || "SA_TEST",

            // Instead of hard coding the password, consider prompting for it,
            // passing it in an environment variable via process.env, or using
            // External Authentication.
            password: process.env.NODE_ORACLEDB_PASSWORD || "none",

            // For information on connection strings see:
            // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
            connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "10.12.60.130/ORCL12C",

            // Setting externalAuth is optional.  It defaults to false.  See:
            // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#extauth
            externalAuth: process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false,
            //

            // Default values shown below
            // externalAuth: false, // whether connections should be established using External Authentication
            poolMax: 100, // maximum size of the pool. Increase UV_THREADPOOL_SIZE if you increase poolMax
            poolMin: 10, // start with no connections; let the pool shrink completely
            //poolIncrement: 0, // only grow the pool by one connection at a time
            // poolTimeout: 60, // terminate connections that are idle in the pool for 60 seconds
            // poolPingInterval: 60, // check aliveness of connection if in the pool for 60 seconds
            // queueRequests: true, // let Node.js queue new getConnection() requests if all pool connections are in use
            queueTimeout: 120000, // terminate getConnection() calls in the queue longer than 60000 milliseconds
            // poolAlias: 'myalias' // could set an alias to allow access to the pool via a name
            // stmtCacheSize: 30 // number of statements that are cached in the statement cache of each connection
            _enableStats: true


        }
    }
}