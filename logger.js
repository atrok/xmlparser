var http=require('http');

const StringBuilder=require('./stringbuilder');

class Logger{
    
    constructor(response, options) {
        this.response=this.assignServerResponse(response);
        this.sb=new StringBuilder();
        this.dateformat=(options)? options: {
            year:"numeric",
            month:"numeric",
            day:"numeric",
            hour:"numeric",
            minute: "numeric",
            second: "numeric",
            timeZoneName:"short"
        }
    };

    info(str){
        this.log(str,"INFO");
    }

    error(str){
        this.log(str,"ERROR");
    }

    debug(str){
        this.log(str,"DEBUG");
    }

    log(str, level){
        var processed=this.stringify(str);
        var date=this.get_date();

        console.log("%s %s "+processed, date, level);

        if(typeof this.response!=='undefined') 
           this.response.emit('console',{r: processed.replace('\t', '&nbsp;').replace('\n', '<br/>')+'<br/>'});
        this.sb.flush();
   
   };
   

   stringify(str){
       return (typeof str==="string") ? str : this.processObject(str, this.sb,1).toString();
   }

   get_date(){
       var date=new Date().toLocaleDateString('en-US',this.dateformat);
       return date;
   }

   processObject(opts,stringbuilder, cycle){

      var propNames=(typeof opts!=='undefined')?Object.getOwnPropertyNames(opts):{object:undefined};
      var sb=stringbuilder;
      sb.append('\n\t'.repeat(cycle-1)+"{\n");
      for(var i=0; i<propNames.length; i++){
        const desc = Object.getOwnPropertyDescriptor(opts, propNames[i]);
        //var value=Object.getOwnPropertyDescriptor(opts,property);
        sb.append('\t'.repeat(cycle)+propNames[i]+':');
        if (typeof desc.value==='object') {
          sb=this.processObject(desc.value, sb,++cycle);
          --cycle;
        }
        else
          sb.append(desc.value+'\n');
       };
       
      return sb.append('\t'.repeat(--cycle)+'}\n');
  };

   assignServerResponse(response){
    if(typeof(response)==='undefined'||response===null){
        return  undefined;
    }

   // if(Object.getPrototypeOf(response) === Socket.prototype){
       return response;
    //}else throw new TypeError('Socket.io socket is expected');
   }

}



module.exports=new Logger();