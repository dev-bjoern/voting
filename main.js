require(["jquery", "Voting"], function($, Voting) {
    $(function() {

        // generate random voting history of 100 votes
/*
        while(i--) {
            var timediff =  getRandomInt(0,10000000000)
            var time = new Date().getTime() - timediff
            var plus = getRandomInt(0,10)
            var index = getRandomInt(0,2)

            if(plus === 3) {
                history[i] = [time, getRandomInt(0,2)+"|"+getRandomInt(0,2)]
            } else {
                history[i] = [time, getRandomInt(0,2)]
            }
        }
*/

var history = []
    var arr = {a:0, b:0, c:0}

for (var i = 0; i < 100; i++) {
    history[i] = [0, {a:0, b:0, c:0}]
}

for (var j = 1; j < history.length; j++) {
    var index = getRandomInt(0, 2)
    var key = makeid()

    arr[key]++
    history[j][0] = new Date().getTime()/1000
    history[j][1] = $.extend({}, arr)

    //history[j][1] = $.map(history[j][1], function(v){
     // return parseInt(v)
    //})

}


        console.log(history)

         window.vots = $("#voting").voting({
            history: history
        })

        function getRandomInt (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function makeid() {
            var text = "";
            //var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var possible = "abc";

            for( var i=0; i < 1; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
    }

    });
});