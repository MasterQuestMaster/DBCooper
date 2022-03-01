// Require the necessary discord.js classes
const { Client, Intents } = require("discord.js");
const { token } = require("./config.json");
const { apiKey } = require("./pastebin-config.json");

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log("Ready!");
});

client.on("interactionCreate", async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName, options } = interaction;

	if (commandName === "db-card-texts") {

        //Get DB link from argument
        const deckUrl = options.getString("deck-url");
        const deckId = parseInt(getParameterByName("id", deckUrl));
        console.log(deckId);

        if(isNaN(deckId)) {
            await interaction.reply("There was a problem with the deck URL. Make sure you use the 'Export' option in DB to get the link.");
            return;
        }
        
        const axios = require("axios");
        const deckResponse = await axios({
            method: "post",
            url: "https://www.duelingbook.com/php-scripts/load-deck.php", 
            data: `id=${deckId}`,
            headers: {'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const deckResult = deckResponse.data;
        if(deckResult.action == "Error") {
            await interaction.reply("I failed to load the deck. DB says: " + deckResult.message);
            return;
        }

        //Query all the cards with name and text.
        let existingCardIds = {};

        //console.log(deckResult);

        //distinct by name
        let combinedDeckCards = deckResult.main.concat(deckResult.side, deckResult.extra);
        combinedDeckCards = combinedDeckCards.filter(function(card) { 
            if(!existingCardIds[card.id] && card.custom) {
                existingCardIds[card.id] = true;
                return true;
            }
            
            return false;
        });
        
        //Format
        const formattedCards = combinedDeckCards.map(function(card) {
            var cardStr = `*${card.name}*\n`;
            if(card.pendulum_effect && card.pendulum_effect.length > 0) {
               cardStr += `Pendulum effect:\n${card.pendulum_effect}\n\nMonster effect:\n`;
            }
            
            cardStr += card.effect;
            return cardStr;
        });

        if(formattedCards.length == 0) {
            await interaction.reply("It seems there were no cards in that deck.");
            return;
        }

        //Create an external text file (pastebin) to keep the text.
        const params = new URLSearchParams()
        params.append("api_option", "paste");
        params.append("api_dev_key", apiKey);
        params.append("api_paste_code", formattedCards.join("\n\n"));
        params.append("api_paste_name", deckResult.name);
        params.append("api_paste_private", 1);
        params.append("api_paste_expire_date", "1D");

        const pasteResult = await axios.post("https://pastebin.com/api/api_post.php", params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log(pasteResult.data);
        var pasteUrl = pasteResult.data;

        if(pasteUrl && pasteUrl.length && pasteUrl.length > 0) {
            await interaction.reply("Success! Here's a pastebin link to the card texts: " + pasteUrl);
        }
    }
});

// Login to Discord with your client"s token
client.login(token);

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}