var async=require('async');

function run(){

    var queues=[]

    var q=async.queue(worker, 2);
    var q2=async.queue(worker, 2);

    function worker(task,fn) {
        console.log('executing ' + task.name);
        let l = 0;
        while (l < 100000000) { l++; }
        console.log('hello ' + task.name);
        fn({ name: task.name + "_processed" });
    
    }

    async.parallel([
        function(callback){
            q.push([{ name: 'baz' }, { name: 'bay' }, { name: 'bax' }, { name: 'foo' }, { name: 'doo' }, { name: 'bddd' }, { name: 'zzz' }], (err) => {
                if (err) console.log(err);
                console.log("q1 finished processing item");
                
            })
            callback();
        },
        function(callback){
            q2.push([{ name: 'baz' }, { name: 'bay' }, { name: 'bax' }, { name: 'foo' }, { name: 'doo' }, { name: 'bddd' }, { name: 'zzz' }], (err) => {
                if (err) console.log(err);
                console.log("q2 finished processing item");
               
            })
            callback();
        }
    ])
}

run();
