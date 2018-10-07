var logger = require('../logger');

class ResultHandler {
    constructor() {
        this.logger = logger;
    }

    prepare() {
        // this.logger.log('Preparing dbms data before sending to docxprocessor');
    }

    fill_data(obj, struct) {
        //console.log(typeof obj);

        const propNames = Object.getOwnPropertyNames(struct);
        propNames.forEach(function (name) {
            const desc = Object.getOwnPropertyDescriptor(struct, name);
            Object.defineProperty(obj, name, desc);
        });
        return obj;
    };
}

class ResultHandlerOra extends ResultHandler {

    prepare(result) {
        super.prepare();
        var obj = [];

        if (result.rows) {
            for (var row = 0; row < result.rows.length; row++) {
                obj[row] = {};
                for (var col = 0; col < result.rows[row].length; col++) {
                    var t = { [result.metaData[col].name]: result.rows[row][col] };
                    obj[row] = this.fill_data(obj[row], t);
                }
            }
            return obj;
        }

        if (result.rowsAffected!=null) {
            var t = { rowsAffected: 0, id: "unknown", errors: 0 };

            t["rowsAffected"] = result.rowsAffected;

            if (result.vars) {
                let r = {};
                r = this.fill_data(r, result.vars);
                t["id"] = r;
            }
            if (result.batchErrors) {
                t["errors"] = { count: result.batchErrors.length };
                //obj.push(result.batchErrors);

            }
            obj.push(t);

            if(t["errors"].count>0)obj.push(result.batchErrors); // attach list of errors

            

            return obj;
        }
        /*
        if(result.vars){
            let r={};
            r=this.fill_data(r,result.vars);
            obj.push(r);
        }
        if(result.batchErrors){
            obj.push(result.batchErrors);
        }
        */
        return obj.push({ error: "can't process results", result: result });
    }
}

class ResultHandlerMsql extends ResultHandler {

    prepare(data) {
        super.prepare();
        var obj = [];

        if (typeof data.recordset === 'undefined')
            throw new Error('Wrong format for MSSQLDB result, missing recordset property')

        var result = data.recordset;
        for (var row = 0; row < result.length; row++) {
            obj[row] = {};
            var keys = Object.keys(result[row]);
            for (var o = 0; o < keys.length; o++) {
                var k = keys[o].toUpperCase();
                var t = { [k]: result[row][keys[o]] }
                obj[row] = this.fill_data(obj[row], t);
            }
        }

        return obj;

    }
}

module.exports = {
    ResultHandlerOra,
    ResultHandlerMsql
}