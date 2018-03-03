//Vimeo API Reference: https://github.com/jrue/Vimeo-jQuery-API
jQuery(document).ready(function($) {
    var messages = [];
    var message_id = 0;
    var video_duration = 0;
    var vimeo_video_time = false;

    //var vimeo_player_id = "ld-video-player-1";
    var vimeo_player_iframe = false;
    var main_contianer = ".ld-video"

    var playButton = $("#vimeo_play_button");
    var pauseButton = $("#vimeo_pause_button");
    var rewindButton = $("#vimeo_rewind_button");

    var main_contianer = $("#vimeo_contianer");
    var blocker = $("#vimeo_blocker");

    var requestedRewind = false;
    var initailized = false;
    var complete = false;
    var trainingNotComplete = $("form#sfwd-mark-complete input#learndash_mark_complete_button").length > 0 ? true : false


    function Timer(callback, delay) {
        var timerId;

        this.pause = function() {
            window.clearInterval(timerId);
        };

        this.resume = function() {
            window.clearInterval(timerId);
            timerId = window.setInterval(callback, delay);
        };

        this.cancel = function() {
            window.clearInterval(timerId);
        };

        this.resume();
    }

    function IsJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }

        return true;
    }

    function secondsTimeSpanToHMS(s) {
        var h = Math.floor(s / 3600); //Get whole hours
        s -= h * 3600;

        var m = Math.floor(s / 60); //Get remaining minutes
        s -= m * 60;

        return (h > 0 ? h + "h " : "") + (m < 10 ? (m === 0 ? '' : '0' + m + "m ") : m + "m ") + (Math.floor(s) < 10 ? '0' + Math.floor(s) + "s" : Math.floor(s) + "s");
    }

    function vimeoPost(target, action, value, cb) {
        var data = {
            method: action
        };

        if (value) {
            data.value = value;
        }

        //convert jquery to DOM
        target[0].contentWindow.postMessage(JSON.stringify(data), "*");

        //add UID
        data.uid = message_id++;

        //add target
        data.target = target;

        // add callback to message
        data.cb = cb ? cb : null;

        if (data.cb)
            messages.push(data);
    }

    function complete_initialization() {

    setTimeout(function() {
      if (trainingNotComplete && 'videos_auto_start' in learndash_video_data && learndash_video_data.videos_auto_start == "1") {
              vimeoPost(vimeo_player_iframe, "play", null, null); //Play video
      }

      //get video duration
      var getDurationTimer = setInterval(function() {
                  vimeoPost(vimeo_player_iframe, "getDuration", null, function(message) {
                    video_duration = message.value;
                    clearTimeout(getDurationTimer);
                });
            }, 500);
        }, 500);

        vimeo_video_time = new Timer(function() {
            if (video_duration > 0) {
                vimeoPost(vimeo_player_iframe, "getCurrentTime", null, function(message) {
                    $('#vimeo_video_status input').val(secondsTimeSpanToHMS(video_duration - message.value) + " / " + secondsTimeSpanToHMS(video_duration));
                });
            }
        }, 500);

    }

    function performAction(message, player_target) {
        //When Vimeo video is ready...
        if (!initailized && "event" in message && message.event == "ready") {
            console.log("Initializing plugin...")

            //THE MAGIC HAPPENS HERE
            //todo: add error checking
            //initialize global variable
            vimeo_player_iframe = $(".learndash_content iframe[src*='vimeo.com']")

            //move video into container which activates blocker
            $(main_contianer).prepend(vimeo_player_iframe);
            
            //Set video width
            if (window.vimeo_video_width) {
                //var vimeo_video_width = $(vimeo_player_iframe).css("width");
                $(vimeo_player_iframe).css("width", window.vimeo_video_width);
            }

            //Set video height
            if (window.vimeo_video_height) {
                //var vimeo_video_height = $(vimeo_player_iframe).css("height");
                $(vimeo_player_iframe).css("height", window.vimeo_video_height);
            }
            
            initailized = true;

            return;

        } else if (initailized && "event" in message && message.event == "ready") {
            complete_initialization();
            return;

        } else if (initailized && "event" in message && message.event == "finish") {
            if (trainingNotComplete && learndash_video_data && $("form#sfwd-mark-complete input#learndash_mark_complete_button").length > 0) {
                $("form#sfwd-mark-complete input#learndash_mark_complete_button").attr("disabled", false);

                if ('videos_auto_complete' in learndash_video_data && learndash_video_data.videos_auto_complete) {
                    $("form#sfwd-mark-complete").submit();
                }
            }

            if (vimeo_video_time) {
                vimeo_video_time.cancel();
                complete = true;
            }

            return;
        }

        if (messages.length > 0) {
            // find matching messages if multiple exist, return all
            var result = $.grep(messages, function(e) {
                return e.method == message.method;
            });

            // sort all results by id
            result = result.sort(function(a, b) {
                return parseInt(a.uid) > parseInt(b.uid);
            });

            // get earliest message (FIFO)
            found_result = result.shift()

            // delete messsage from messsages
            $.map(messages, function(e, index) {
                if (e) { // not sure why e is null?
                    if (e.uid == found_result.uid)
                        messages.splice(index, 1);
                }
            })

            // call cb
            if ("cb" in found_result && found_result.cb)
                found_result.cb(message);
        }
    }


    /* Event Listeners */

    window.addEventListener("message", function(event) {
        if (IsJsonString(event.data)) {
            var message = JSON.parse(event.data);

            if ("event" in message) {
                if (initailized) {
                    console.log(message);
                }
            }

            performAction(message, vimeo_player_iframe)
        }

    }, false);


    rewindButton.click(function() {
        console.log("Rewind");
        requestedRewind = true;

        //Peform action
        vimeoPost(vimeo_player_iframe, "getCurrentTime", null, function(message) {
            if (requestedRewind && "method" in message && message.method == "getCurrentTime") {
                var rewindTo = message.value - 30;
                if (rewindTo < 0) {
                    rewindTo = 0.1;
                }

                console.log("At time: " + message.value + ", but going back to time: " + rewindTo);
                vimeoPost(vimeo_player_iframe, "seekTo", rewindTo, null);
                requestedRewind = false;
            }
        });
    });

    playButton.click(function() {
        if (complete) {
            console.log("Restart video");
            complete = false;
            //fake message to restart
            performAction({
                event: "ready"
            }, vimeo_player_iframe)
            vimeoPost(vimeo_player_iframe, "play", null, null);

        } else {
            console.log("Play");
            vimeoPost(vimeo_player_iframe, "play", null, null);
            vimeo_video_time.resume();
        }
    });

    pauseButton.click(function() {
        console.log("Pause");
        vimeo_video_time.pause();
        vimeoPost(vimeo_player_iframe, "pause", null, null);
    });


    console.log("LearnDash - Vimeo Skip Preventor Plugin loaded...");

});