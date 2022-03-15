const W3CWebSocket = require("websocket").w3cwebsocket;

const websocket = new W3CWebSocket("ws://duel.duelingbook.com:8443/");

websocket.onopen = function() {
    console.log("WebSocket Client Connected");

    Send({
        "action": "Connect",
        "username": "MasterQuestMaster",
        "password": "b4e8f4b97b251bb7b201d3466a535325e008e78f",
        "db_id": "jl373nbopjha3x6jfihhk379ighbrpdp",
        "session": "my4mu4dp73r0kokj5yi2wn9ei90w68vr",
        "administrate": false,
        "version": 616,
        "capabilities": "",
        "remember_me": 0,
        "connect_time": 0,
        "fingerprint": 0,
        "html_client": true,
        "mobile": false,
        "browser": "Chrome",
        "platform": "PC",
        "degenerate": false,
        "revamped": true
    });

};

websocket.onclose = function() {
    console.log("Web Socket Closed");
};

websocket.onmessage = function(e) {
    try {
        var data = JSON.parse(e.data);
    }
    catch(e) {
		console.error("Malformed server response");
		return;
	}

    switch(data.action) {
        case "Connected":
            console.log("Connected: ", e.data);

            Send({
                "action":"Search cards",
                "search":{
                    "name":"E/R Child",
                    "effect":"",
                    "card_type":"",
                    "monster_color":"",
                    "type":"",
                    "ability":"",
                    "attribute":"",
                    "level_low":"",
                    "level_high":"",
                    "atk_low":"",
                    "atk_high":"",
                    "def_low":"",
                    "def_high":"",
                    "limit":"",
                    "order":"Alpha",
                    "pendulum":0,
                    "scale_low":"",
                    "scale_high":"",
                    "tcg":0,
                    "ocg":0,
                    "ocg_list":0,
                    "arrows":"00000000",
                    "custom":2
                },
                "page":1
            });

            break;
        case "Search cards":
            console.log("Search cards", e.data);
            break;
        default:
            console.log("Received response: " + data.action);
            break;
    }
};

function Send(data) {
	action = JSON.stringify(data, function(k,v){
		if (v == null) {
			v = undefined;
		}
		return v;
	});

	resend();
}

function resend() {
	searching = false;
	// if (!websocket) {
	// 	//console.log(action);
	// 	hideDim();
	// 	return;
	// }
	try {
		websocket.send(action);
	}
	catch(e) {
		console.log('Failed to send data');
	}
}

function randomHex() {
	var str = "";
	var arr = ["a","b","c","d","e","f","g","h","i","j","k","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];
	for (var i = 0; i < 32; i++) {
		str += arr[Math.floor(Math.random() * arr.length)];
	}
	return str;
}