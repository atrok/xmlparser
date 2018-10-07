class StringBuilder{
    
        constructor(){
            this.strings=[];
        };
    
        append(value){
            if (value || value === 0) {
                this.strings.push(value);
            }
            return this;
           }
        
        toString(){
            return this.strings.join("");
        }

        flush(){
            this.strings=[];
        }
    }

module.exports=StringBuilder