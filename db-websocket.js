const W3CWebSocket = require("websocket").w3cwebsocket;

/*

Concurrent messages:
Need different accounts, each with their own websocket.

Timeouts:
Search promise needs timeout in case there's no response from server.
When connected, the session should not run forever, but close after X time without a request.
When search request comes, if not auth, try to auth first.

*/

const dbWebSocket = class {
    constructor(username, password, db_id) {
        this.username = username;
        this.password = password;
        this.dbId = db_id;
        this.session = randomHex();
        this.isAuthenticated = false;

        this.websocket = false;
        this.promises = {}; //{"connect":{"resolve":func, "reject":func}}

        //Heartbeat (if this is not sent, connection will terminate after a short time)
        var dbws = this;
        this.heartbeatTimer = setInterval(() => {
            console.log("Send Heartbeat");
            const action = (dbws.promises["Search cards"]) ? "Searching" : "Heartbeat";
            Send(dbws.websocket, {"action": action});
        }, 30000);

        //Timeout after a certain period of no action.
        //TODO: Make Timeout clear after search (have to reset it, so need access to the dbws)
        //TODO: Check if End all sessions causes "reject" message when trying to connect afterwards.
        //TODO: No results for Celeste search??
        this.timeoutTimer = setTimeout(() => {
            console.log("End session due to inactivity");
            dbws.websocket.close();
        }, 300000); //5 min.
    }

    async createWebSocketAndConnect() {
        const dbws = this;

        return new Promise(function(resolve, reject) {
            //save promise for onmessage
            dbws.addPromiseCallback("Connect", resolve, reject);
            dbws.websocket = new W3CWebSocket("ws://duel.duelingbook.com:8443/");

            dbws.websocket.onerror = function(event) {
                console.log("socket error", event);
                //When authenticated, the error occured during search cards.
                if(dbws.isAuthenticated) {
                    dbws.executePromiseCallback("Search cards", "reject", event);
                }
                else {
                    dbws.executePromiseCallback("Connect", "reject", event);
                }
            };

            dbws.websocket.onopen = function() {
                console.log("WebSocket Client Connected");
                sendConnectRequest(dbws);
            };

            dbws.websocket.onclose = function() {
                console.log("Web Socket Closed");
                dbws.isAuthenticated = false;
                clearInterval(dbws.heartbeatTimer);
                dbws.rejectAllPromises("WebSocket closed");
            };

            dbws.websocket.onmessage = function(e) {
                //console.log("Web Socket response");
                handleSocketResponse(e, dbws);
            };
        });
    }
    async searchForCustomCards(searchName="",searchEffect="") {
        const dbws = this;

        return new Promise(function(resolve, reject) {
            if(!dbws.isAuthenticated) {
                const errMsg = "Not authenticated! Send Connect request first."
                console.log(errMsg);
                reject(errMsg)
                return;
            }
            
            //callback already set.
            if(dbws.promises["Search cards"]) {
                const errMsg = "There is already a search request running!";
                console.log(errMsg);
                reject(errMsg);
                return;
            }

            dbws.addPromiseCallback("Search cards", resolve, reject);
            
            console.log("Send search request for " + searchName + ", " + searchEffect);
            sendSearchRequest(dbws, searchName, searchEffect);
        });
    }

    addPromiseCallback(action, resolve, reject) {
        this.promises[action] = { "resolve": resolve, "reject": reject };
    }

    //also deletes the callback
    executePromiseCallback(action, promiseResponseType, param) {
        if(this.promises[action]) {
            const callback = this.promises[action][promiseResponseType];
            if(typeof callback === "function") callback(param);

            //after executing callback once, it is removed since the request is completed.
            delete this.promises[action];
        }
    }

    rejectAllPromises(reason) {
        if(this.promises.length == 0)
            return;
        
        for(const prom in this.promises) {
            if(typeof prom["reject"] === "function") prom["reject"](reason);
        }

        //clear list
        this.promises = {};
    }
};

function sendConnectRequest(dbws) {
    console.log("send connect request");

    try {
        Send(dbws.websocket, {
            "action": "Connect",
            "username": dbws.username,
            "password": dbws.password,
            "db_id": dbws.dbId,
            "session": dbws.session,
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
    }
    catch(e) {
        console.error("failed to send connect request", e);
        dbws.executePromiseCallback("Connect", "reject", e);
    }
}

function sendSearchRequest(dbws, searchName="", searchEffect="") {
    console.log("send search request");
    try {
        Send(dbws.websocket, {
            "action":"Search cards",
            "search":{
                "name": searchName,
                "effect": searchEffect,
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
                "custom": 1 /* all customs */
            },
            "page":1
        });
    }
    catch(e) {
        console.error("failed to send search request", e);
        dbws.executePromiseCallback("Search cards", "reject", e);
    }

}

function handleSocketResponse(e, dbws) {
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
            dbws.isAuthenticated = true;
            dbws.executePromiseCallback("Connect", "resolve", e.data);
            break;
        case "Search cards":
            console.log("Search cards", e.data);
            dbws.executePromiseCallback("Search cards", "resolve", e.data);
            break;
        case "Already logged in":
        case "Rejected":
            console.log("Already logged in");
            dbws.executePromiseCallback("Connect", "reject", data.action);
        case "Error":
            console.log("Received error from socket");
            dbws.rejectAllPromises(e.data);
        default:
            console.log("Received response: " + data.action);
            break;
    }
}

module.exports = {
    DBWebSocket: dbWebSocket
};

//This function is from DB.
function Send(websocket, data) {
	action = JSON.stringify(data, function(k,v){
		if (v == null) {
			v = undefined;
		}
		return v;
	});

    websocket.send(action);
}

function randomHex() {
	var str = "";
	var arr = ["a","b","c","d","e","f","g","h","i","j","k","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];
	for (var i = 0; i < 32; i++) {
		str += arr[Math.floor(Math.random() * arr.length)];
	}
	return str;
}