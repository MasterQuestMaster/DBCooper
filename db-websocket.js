const W3CWebSocket = require("websocket").w3cwebsocket;
const { Timer } = require("./timer");

const INACTIVITY_TIMEOUT_SECONDS = 300;
const SEARCH_TIMEOUT_SECONDS = 30;
const CHANGE_SESSION_SECONDS = 600;

/*

Concurrent messages:
Need different accounts, each with their own websocket.

TODO:
Error on dbsearchcustom near the part where it awaits reactions "Unknown command" -> maybe from message delete.

Letting the search request time out probably won't actually make the Search stop on DB side.
It will probably still run, as long as Websocket is open. -> Maybe close and reconnect in case of a timeout? But there's no way to check if that actually removes the search.
A new session probably would remove it? In any case, we need a test search that actually goes long.

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
        this.heartbeatTimer = new Timer(30000, () => {
            console.log("Send Heartbeat");

            if (dbws.websocket.readyState !== W3CWebSocket.CLOSED && dbws.websocket.readyState !== W3CWebSocket.CLOSING) {
                const action = (dbws.promises["Search cards"]) ? "Searching" : "Heartbeat";
                Send(dbws.websocket, { "action": action });
            }
        });

        //Timeout after a certain period of no action.
        this.inactivityTimer = new Timer(INACTIVITY_TIMEOUT_SECONDS * 1000, () => {
            console.log("End session due to inactivity");
            dbws.websocket.close();

            //change session sometimes, if reconnect didn't happen for a while.
            //changing session too soon after disconnect can fail with "already logged in".
            dbws.changeSessionTimer.start();
        });

        this.changeSessionTimer = new Timer(CHANGE_SESSION_SECONDS * 1000, () => {
            //only change session if currently disconnected.
            if (dbws.isAuthenticated)
                return;

            dbws.session = randomHex();
            dbws.changeSessionTimer.reset();
            console.log("Change Session to " + dbws.session);
        });

        this.searchTimeoutTimer = new Timer(SEARCH_TIMEOUT_SECONDS * 1000, () => {
            dbws.executePromiseCallback("Search cards", "reject", new Error("timeout"));
            this.searchTimeoutTimer.reset();
        });
    }

    async createWebSocketAndConnect() {
        const dbws = this;
        console.log("use session: ", dbws.session);

        //connect doesn't need timeout, since failure leads to websocket close.
        return new Promise(function (resolve, reject) {
            //save promise for onmessage
            dbws.addPromiseCallback("Connect", resolve, reject);

            //stop waiting to change session when connection is attempted, since there's still activity for the session.
            if(dbws.changeSessionTimer.active)
                dbws.changeSessionTimer.reset();

            try {
                dbws.websocket = new W3CWebSocket("ws://duel.duelingbook.com:8443/");
            }
            catch (e) {
                console.log("Failed to create websocket:", e);
            }

            dbws.websocket.onerror = function (event) {
                console.log("socket error", event);
                //When authenticated, the error occured during search cards.
                if (dbws.isAuthenticated) {
                    dbws.executePromiseCallback("Search cards", "reject", event);
                }
                else {
                    dbws.executePromiseCallback("Connect", "reject", event);
                }
            };

            dbws.websocket.onopen = function () {
                console.log("WebSocket Client Connected");
                dbws.heartbeatTimer.start();
                dbws.inactivityTimer.start();
                sendConnectRequest(dbws);
            };

            dbws.websocket.onclose = function () {
                console.log("Web Socket Closed");
                dbws.isAuthenticated = false;
                dbws.heartbeatTimer.reset();
                dbws.inactivityTimer.reset();
                dbws.rejectAllPromises(new Error("WebSocket closed"));
            };

            dbws.websocket.onmessage = function (e) {
                //console.log("Web Socket response");
                handleSocketResponse(e, dbws);
            };
        });
    }

    async searchForCustomCards(searchName = "", searchEffect = "") {
        const dbws = this;

        //new input reset inactivity timeout.
        dbws.inactivityTimer.reset();

        return new Promise(async function (resolve, reject) {
            if (!dbws.isAuthenticated) {
                const errMsg = "Not authenticated! Send Connect request first."
                console.log(errMsg);
                reject(new Error(errMsg));
                return;
            }

            //callback already set.
            if (dbws.promises["Search cards"]) {
                const errMsg = "There is already a search request running!";
                console.log(errMsg);
                reject(new Error(errMsg));
                return;
            }

            dbws.addPromiseCallback("Search cards", resolve, reject);
            dbws.searchTimeoutTimer.start();

            await new Promise(resolve => setTimeout(resolve, 35000));

            console.log("Send search request for " + searchName + ", " + searchEffect);
            sendSearchRequest(dbws, searchName, searchEffect);
        });
    }

    addPromiseCallback(action, resolve, reject) {
        this.promises[action] = { "resolve": resolve, "reject": reject };
    }

    //also deletes the callback
    executePromiseCallback(action, promiseResponseType, param) {
        if (this.promises[action]) {
            const callback = this.promises[action][promiseResponseType];
            if (typeof callback === "function") callback(param);

            //after executing callback once, it is removed since the request is completed.
            delete this.promises[action];
        }
    }

    rejectAllPromises(reason) {
        if (this.promises.length == 0)
            return;

        for (const prom in this.promises) {
            if (typeof prom["reject"] === "function") prom["reject"](reason);
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
    catch (e) {
        console.error("failed to send connect request", e);
        dbws.executePromiseCallback("Connect", "reject", e);
    }
}

function sendSearchRequest(dbws, searchName, searchEffect = "") {
    console.log("send search request");
    try {
        Send(dbws.websocket, {
            "action": "Search cards",
            "search": {
                "name": searchName,
                "effect": searchEffect,
                "card_type": "",
                "monster_color": "",
                "type": "",
                "ability": "",
                "attribute": "",
                "level_low": "",
                "level_high": "",
                "atk_low": "",
                "atk_high": "",
                "def_low": "",
                "def_high": "",
                "limit": "",
                "order": "Alpha",
                "pendulum": 0,
                "scale_low": "",
                "scale_high": "",
                "tcg": 0,
                "ocg": 0,
                "ocg_list": 0,
                "arrows": "00000000",
                "custom": 1 /* all customs */
            },
            "page": 1
        });
    }
    catch (e) {
        console.error("failed to send search request", e);
        dbws.executePromiseCallback("Search cards", "reject", e);
    }

}

function handleSocketResponse(e, dbws) {
    try {
        var data = JSON.parse(e.data);
    }
    catch (e) {
        console.error("Malformed server response");
        return;
    }

    switch (data.action) {
        case "Connected":
            console.log("Connected: ", e.data);
            dbws.isAuthenticated = true;
            dbws.executePromiseCallback("Connect", "resolve", e.data);
            break;
        case "Search cards":
            console.log("Search cards", e.data);
            dbws.searchTimeoutTimer.reset();
            dbws.inactivityTimer.start();
            dbws.executePromiseCallback("Search cards", "resolve", e.data);
            break;
        case "Already logged in":
        case "Rejected":
            console.log(data.action);
            dbws.executePromiseCallback("Connect", "reject", data.action);
        case "Error":
            console.log("Received error from socket");
            dbws.rejectAllPromises(new Error(e.data));
        default:
            //console.log("Received response: " + data.action);
            break;
    }
}

module.exports = {
    DBWebSocket: dbWebSocket
};

//This function is from DB.
function Send(websocket, data) {
    action = JSON.stringify(data, function (k, v) {
        if (v == null) {
            v = undefined;
        }
        return v;
    });

    websocket.send(action);
}

function randomHex() {
    var str = "";
    var arr = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    for (var i = 0; i < 32; i++) {
        str += arr[Math.floor(Math.random() * arr.length)];
    }
    return str;
}