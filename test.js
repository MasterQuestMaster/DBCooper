const { apiKey } = require("./pastebin-config.json");

console.log(apiKey);

const params = new URLSearchParams()
params.append("api_option", "paste");
params.append("api_dev_key", apiKey);
params.append("api_paste_code", "test");

const axios = require("axios");

// const pasteResult = axios({
//     method: "post",
//     url: "https://pastebin.com/api/api_post.php", 
//     data: "api_dev_key=" + pastebinApiKey,
//     headers: {'Content-Type': 'application/x-www-form-urlencoded' }
// }, function(result) {
//     console.log(result.data);
// });

const pasteResult = axios.post("https://pastebin.com/api/api_post.php", params, {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
});

console.log(pasteResult);