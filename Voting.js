;(function(){

// Voting Class Definition

    var Voting = function($el, options){
        var Voting = this

        this.options = options
        this.settings = $.extend({},  $.fn.voting.defaults, options)

        // caché DOM for rapidness and make available through instance
        this.$el =      $el
        this.$items =   $el.children("div.Voting-item")
        this.$bars =    $el.children("div").children("div").children("div")
        this.$votes =   $el.find("span.Voting-votes")
        this.$perc =    $el.find("span.Voting-perc")
        this.$total =   $el.find("span.Voting-total-count")
        this.$time =    $el.find("span.Voting-time")
        this.$blind =   $el.find("label.Voting-blind").children("input")
        this.$slider =  $el.find("div.Voting-slider")
        this.$live =    $el.find("div.Voting-live")

        // short ref history. if no history was given we create a dummy history consisting of only the last voting state taken from the dom
        this.history = this.settings.history || [[0, getCurrentVoteObj.call(Voting)]]

        // init the slider (only if a history was given in the settings)
        if (this.settings.history) {
            var totalvotes = calcTotal.call(Voting, this.history[this.history.length-1][1])
            Voting.$slider = $(this.$slider).slider({
                max: totalvotes, // sets max val
                value: totalvotes // sets starting pos
            })

            // init current state of voting (last history point)
            animateBars.call(this, this.history[this.history.length-1])
        }

        // was already voted for one item? get the id of the item that has been voted on ...
        var lastvoteditem = this.$items.filter(function(){
            return $(this).hasClass("Voting-voted")
        })
        // ... and save it in the elements data, lastvote now has the id of the voted item or is undefined
        if (lastvoteditem.length > 0) Voting.lastvote = lastvoteditem.get(0).id.replace("Voting-", "")

        // bind event listeners
        this.$el    .on("click", "div.Voting-item", $.proxy(onItemClick,            Voting)) // when a vote is clicked
        this.$blind .on("change",                   $.proxy(onToggleVotingHidden,   Voting)) // when the hide votes label is clicked
        this.$slider.on("slide",                    $.proxy(onHistorySlide,         Voting)) // when history slider is slided
                    .on("slidechange",              $.proxy(onHistorySlideChange,   Voting))
                    .on("slidestart",               $.proxy(onHistorySlideStart,    Voting))

        this.settings.onBuilt.call(this)
    }

    Voting.prototype = {

        constructor: Voting

        , increaseVote: function(voteid){

            // if beforeVote returns false, we stop right here
            if(this.settings.beforeVote.call(this, voteid) === false) return false

            var Voting = this
            // create new history entry and assign to "newvote" for short reference
            , newvote = Voting.history[Voting.history.length] = $.extend(true, {}, Voting.history[Voting.history.length-1])
            , currentvoteid = voteid = voteid.replace("Voting-", "")

            // if already voted and regular vote mode, prevent voting
            if(Voting.settings.voteMode === "regular" && Voting.lastvote) return

            if(Voting.settings.voteMode === "regular" || Voting.settings.voteMode === "putin") {
                // increase clicked vote by 1
                newvote[0]=new Date().getTime()/1000
                newvote[1][voteid]+=1
            }

            if(Voting.settings.voteMode === "pirate") {

                // if voted again for already voted (toggle -> take away vote)
                if (Voting.lastvote === voteid) {
                    newvote[1][voteid]-=1
                    currentvoteid = undefined
                }

                // if already voted
                if(Voting.lastvote !== undefined) {
                    // decrease previous vote by 1 (still active here)
                    newvote[1][Voting.lastvote]-=1
                }

                // increase clicked vote by 1 and set current timestamp
                newvote[0] = new Date().getTime()/1000
                newvote[1][voteid]+=1
            }

            // show the rating if it was hidden before vote
            Voting.$el.removeClass("Voting-hidden")

            // update slider
            if(this.settings.history) {
                var sliderval = Voting.$slider.slider("option", "max")+1
                Voting.$slider.slider("option", "max", sliderval)
                Voting.$slider.slider("value", sliderval)
            }

            // animating bars and setting new text values
            animateBars.call(Voting, newvote, 300)

            // adding voted class for visual indication
            Voting.$items.removeClass("Voting-voted")
            $("#Voting-" + voteid)[currentvoteid == undefined ? "removeClass" : "addClass"]("Voting-voted")

            // trigger voted event callback function
            Voting.settings.onVote.call(this, voteid, currentvoteid, Voting.lastvote)

            // set data (vote that it has been voted)
            Voting.lastvote = currentvoteid
        }

        , liveVote: function(historySnap){
            var Voting = this
            Voting.isLive(true)

            // create new history entry
            Voting.history[Voting.history.length] = $.extend({}, historySnap)

            // slider is on last position? we animate the bars to new position and visually indicate
            if(this.settings.history && sliderOnMax.call(Voting)) {

                // update slider
                increaseSlider.call(Voting, true)

                animate()

            } else if (this.settings.history) {

                // update slider
                increaseSlider.call(Voting)

                // small indication that a vote happened
                Voting.$live.animate({"opacity": 1}, 300)
                Voting.$live.animate({"opacity": 0}, 100)
            } else {

                animate()
            }

            function animate(){
                // call showLive to show the green live dot indicator
                showLive.call(Voting, true)

                // animating bars and setting new text values
                animateBars.call(Voting, historySnap, 300)

                // find the changed votes and visually indicate them
                var changedVotes = $.map(historySnap[1], function(val, key){
                    if (Voting.history[Voting.history.length-2][1][key] !== val) return key
                })
                $.each(changedVotes, function(i, key) {
                    var index = $("#Voting-" + key).index()
                    Voting.$bars.eq(index).animate({opacity: 0.5}, {queue: false}).animate({opacity: 1})
                })
            }
        }

        , toggleVotingHidden: function(bool){
            this.$el.toggleClass("Voting-hidden", bool)
            this.settings.onToggleVotingHidden.call(this, bool)
        }

        // sets or gets the isLive status (if we are connected through socket)
        , isLive: function(bool){

            var Voting = this
            if(bool === true || bool === false) Voting.live = bool

            if(this.settings.history && sliderOnMax.call(Voting)) {
                showLive.call(Voting, bool)
            } else {
                showLive.call(Voting, bool)
            }

            return Voting.live
        }
    }

// priviate functions

    // increases the slider max by 1, pass true to also update the slider to highest new value
    function increaseSlider(bool){
        var maxsliderval = this.$slider.slider("option", "max")
        this.$slider.slider("option", "max", maxsliderval+=1)
        if(bool === true) this.$slider.slider("value", maxsliderval)
    }

    function calcTotal(indivotes){
        var totalvotes = 0
        for(var voteid in indivotes) {
            totalvotes+=parseInt(indivotes[voteid])
        }
        return totalvotes
    }

    function getCurrentVoteObj(){
        var voteSnap = {}
        $.each(this.$items, function(i, el){
            voteSnap[el.id.replace("Voting-", "")] = parseInt($(el).find(".Voting-votes").text())
        })
        return voteSnap
    }

    function animateBars(historySnap, delay){
        var Voting = this
        , timeOfVote = parseInt(historySnap[0]*1000)
        , indivotes = historySnap[1]
        , totalvotes = calcTotal.call(Voting, indivotes)

        for(var voteid in indivotes) {
            var i = $("#Voting-" + voteid).index()

            // avoiding case where deviding by 0 (before the first vote)
            var perc = (100 / (totalvotes == 0 ? 1 : totalvotes)) * indivotes[voteid]

            // animate graphs to new percantage
            Voting.$bars.eq([i]).stop().animate({
                width: perc + "%"
            })

            // update vote count/percentage value text to new value with some delay in case voting was hidden to let user see his vote changing
            ;(function(i, voteid, perc) {
                setTimeout(function() {
                    Voting.$votes.eq(i).text(indivotes[voteid])
                    Voting.$perc.eq(i).text("("+Math.round(perc)+"%)")
                }, 0 || delay)
            })(i, voteid, perc)
        }

        if(this.settings.history) {
        // update time of vote text
            Voting.$time
                .text(this.settings.historyTime.call(this, timeOfVote))
                .attr("title", new Date(timeOfVote))
        }

        // update total votes text
        Voting.$total.text(totalvotes)
    }

    // returns true if the current slider value equals the max sliderval (we are in last position)
    function sliderOnMax(){
        var Voting = this
        , currentsliderval = Voting.$slider.slider("value")
        , maxsliderval = Voting.$slider.slider("option", "max")
        return (currentsliderval === maxsliderval)
    }

    function showLive(bool){
        var Voting = this

        if(bool === true) {
            Voting.$live.animate({"opacity": 1}, 200)
        }

        if(bool === false) {
            Voting.$live.animate({"opacity": 0}, 200)
        }
    }

    // triggered by user ui interaction

    function onItemClick(event){
        var el = event.currentTarget
        this.increaseVote(el.id)
    }

    function onToggleVotingHidden(){
        var checked = this.$blind.is(":checked")
        this.toggleVotingHidden(checked)
    }

    function onHistorySlide(event, ui){
        var historySnap = this.history[ui.value]
        animateBars.call(this, historySnap)
    }

    function onHistorySlideChange(event, ui){
        var sliderval = this.$slider.slider("option", "max")
        if(sliderval == ui.value && this.isLive()) showLive.call(this, true)
    }

    function onHistorySlideStart(event, ui){
        showLive.call(this, false)
    }

// jquery plugin wrapper for the Voting "class"

    $.fn.voting = function ( options ) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('voting')
            if (!data) $this.data('voting', (data = new Voting($this, options)))
        })
    }

// default options

    $.fn.voting.defaults = {
        beforeVote: function() {},                      // called just before a vote is made, return false from here to prevent vote
        onVote: function() {},                          // when a vote happened
        onToggleVotingHidden: function(trueOrFalse) {}, // when voteing made invisible
        onBuilt: function() {},                         // when Voting is ready
        voteMode: "pirate",                             // regular(once), putin(multi), pirate(once multi)
        history: null,                                  // pass an array with the voted ids
        historyTime: function(timeOfVote) {
            return timeOfVote
        }
    }
})()