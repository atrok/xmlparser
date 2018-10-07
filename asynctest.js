async = require('async');

function queuetest() {

    var q = new NamedQueue('q1');
    q.assign(async.queue(function (task, callback) {
        console.log("q1 start working on " + task.name)
        queueStatus(q);
        worker(task,callback);
    }, 2)
    );

    // assign a callback
    q.get().drain = function () {
        console.log('q1 all items have been processed');
    };



    function queueStatus(queue) {
        console.log(queue.toString())
    }

    var q2 = new NamedQueue('q2');
    q2.assign(
        async.queue(function (task, callback) {
            console.log("q2 start working on " + task.name)
            queueStatus(q2);
            worker(task,function(result){
            // add some items to the queue

            q2.get().push(result, function (err) {
                console.log('q1 finished processing item');
            });
            queueStatus(q);
            callback();
        });
        }, 2)
    );


    q2.get().push([{ name: 'baz' }, { name: 'bay' }, { name: 'bax' }, { name: 'foo' }, { name: 'doo' }, { name: 'bddd' }, { name: 'zzz' }], (err) => {
        if (err) console.log(err);
        console.log("q2 finished processing item");
    })

    
}



NamedQueue = function (name) {
    this.name = name;
}
NamedQueue.prototype.assign = function (q) {
    this.queue = q;
}

NamedQueue.prototype.get = function () {
    return this.queue;
}
NamedQueue.prototype.toString = function () {
    return this.name + ", queue.length: " + this.queue.length() + ", running tasks: " + this.queue.running();
}


function worker(task,fn) {
    console.log('executing ' + task.name);
    let l = 0;
    while (l < 100000000) { l++; }
    console.log('hello ' + task.name);
    fn({ name: task.name + "_processed" });

}

queuetest()