var properties=require('../properties');

module.exports = {
    oracle: {
        default_options: {
            create: "CREATE TABLE DEFAULT_OPTIONS ("+
            "templateVersion VARCHAR(100) NOT null,"+
            "version VARCHAR(100) NOT null, "+
            "TYPE VARCHAR(100) NOT null,"+
            "SECTION VARCHAR(100) NOT null,"+
            "opt VARCHAR(100) NOT null,"+
            "hidden VARCHAR(100),"+
            "readonly VARCHAR(100),"+ 
            "description VARCHAR(2048),"+
            "effective VARCHAR(2048),"+
            "valid VARCHAR(2048),"+
            "val VARCHAR(1024),"+
            "fname VARCHAR(2048),"+
            "PRIMARY KEY (templateVersion, version,TYPE,SECTION, opt)"+
            ")",
insert: "INSERT INTO DEFAULT_OPTIONS VALUES (:templateVersion, :version, :type, :section, :opt, :hidden, :readonly, :description, :effective, :valid, :val, :fname)",
select: "SELECT DISTINCT (templateversion||'-'||version||'-'||TYPE||'-'||SECTION||'-'||opt) AS d FROM default_options ORDER BY d",
table_exists: "select table_name from dba_tables where Lower(table_name) like 'default_options' AND lower(owner)=lower('"+properties.dbms.oracle.user+"')"
        }
    }
}