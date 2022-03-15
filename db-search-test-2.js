const { DBWebSocket } = require("./db-websocket");
const { username, password, db_id } = require("./db-config.json");

(async() => {
    const dbws = new DBWebSocket(username, password, db_id);
    await dbws.createWebSocketAndConnect();
    await dbws.searchForCustomCards("Catcrobat Zippette", "");
})();
