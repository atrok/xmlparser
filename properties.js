module.exports={
    //metadata_dir: "e:\\metadata",
    metadata_dir: "C:\\Users\\Administrator\\My Documents\\metadata_files" ,

    dbms: {
        type: "oracle",
        commintonerrors: true,

        oracle:{
            user          : process.env.NODE_ORACLEDB_USER || "SA",
          
            // Instead of hard coding the password, consider prompting for it,
            // passing it in an environment variable via process.env, or using
            // External Authentication.
            password      : process.env.NODE_ORACLEDB_PASSWORD || "none",
          
            // For information on connection strings see:
            // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#connectionstrings
            connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "10.12.60.130/ORCL12C",
          
            // Setting externalAuth is optional.  It defaults to false.  See:
            // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#extauth
            externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
          }
    }
}