const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow } = require("discord.js");
const { DBWebSocket } = require("../db-websocket");
const { createCardEmbed } = require("../card-embed.js");

let dbws = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("db-search-custom")
        .setDescription("Searches custom from DB.")
        .addStringOption(option =>
            option.setName("search-name")
                .setDescription("Search criteria for card name.")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("search-effect")
                .setDescription("Search criteria for effect. Also accepts card author.")
                .setRequired(false)),

    async execute(interaction) {

        await interaction.deferReply();

        const searchName = interaction.options.getString("search-name") ?? "";
        const searchEffect = interaction.options.getString("search-effect") ?? ""; //also searches author.

        if (!dbws) {
            console.log("create new websocket instance");
            const { username, password, db_id } = require("../db-config.json");
            dbws = new DBWebSocket(username, password, db_id);
        }

        if (!dbws.isAuthenticated) {
            try {
                await dbws.createWebSocketAndConnect();
            }
            catch (e) {
                console.error("Failed to connect to websocket.", e);
                await interaction.editReply({ content: "Could not connect to DuelingBook." });
                return;
            }
        }


        try {
            const searchResults = await dbws.searchForCustomCards(searchName, searchEffect);
            var results = JSON.parse(searchResults);
        }
        catch (e) {
            console.error("Error searching, or parsing the response from the server.", e);
            await interaction.editReply({ content: "Something went wrong trying to search DuelingBook." });
            return;
        }

        //const results = {"full_search":false,"total":1,"cards":[{"def":"?","monster_color":"Link","arrows":"00101000","is_effect":1,"scale":0,"pic":"2","type":"Warrior","ocg":0,"atk":"1900","tcg":0,"id":2046112,"attribute":"LIGHT","ability":"","pendulum":0,"flip":0,"level":2,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"2 monsters, including \"Celeste, Ashen Squire\"\nIf this card is Link Summoned: You can send 1 face-up monster from your Extra Deck to the GY; Special Summon 1 Level 3 or lower Pendulum Monster from your Deck with a different Attribute from the sent monster and face-up monsters in your Extra Deck. You can only use this effect of \"Celeste, Ashen Knight\" once per turn. You cannot Special Summon Level 5 or higher monsters from your hand or Deck the turn you activate this effect.","name":"Celeste, Ashen Knight","pendulum_effect":"","treated_as":"Celeste, Ashen Knight","username":"MasterQuestMaster"}],"action":"Search cards","page":0,"millis":595};

        if (results.total == 0) {
            await interaction.editReply({ content: "Sorry, there are no results for your search" });
            return;
        }
        else if (results.total == 1) {
            const embed = createCardEmbed(results.cards[0]);
            interaction.editReply({ embeds: embed });
        }
        else {
            //Do not show link embeds?
            const formattedCards = results.cards.map(function (card, index) {
                return `${index + 1}. ${card.name}`;
            }).slice(0, 10); //cap at 10 results.

            //add Button
            // const row = new MessageActionRow()
            // .addComponents(
            // 	new MessageButton()
            // 		.setCustomId('details')
            // 		.setLabel('Details')
            // 		.setStyle('PRIMARY'),
            // );

            const resultPage = await interaction.editReply({ content: formattedCards.join("\n"), fetchReply: true, embeds:[] });
            //console.log("result page:", resultPage);

            const emojiList = [
                "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"
            ];
            
            //only user that searched can trigger it.
            const filter = (reaction, user) => {
                return user.id == interaction.user.id && emojiList.includes(reaction.emoji.name);
            }

            let lastReaction = false;

            const handleReaction = async (collected) => {
                //remove previous reaction.
                if(lastReaction) {
                    lastReaction.users.remove(interaction.user.id)
                        .catch((e) => console.log("Error removing last reaction ", lastReaction, e));
                }

                const reaction = collected.first();
                const emojiIndex = emojiList.indexOf(reaction.emoji.name);
                console.log("Emoji: ", reaction.emoji.name, emojiIndex);
                //console.log(results.cards);
                const card = results.cards[emojiIndex];
                console.log("Show card ", card.name);

                const embed = createCardEmbed(card);
                
                await interaction.editReply({embeds:embed});
                lastReaction = reaction;
                
                //await next reaction with same handler (repeat).
                resultPage.awaitReactions({ filter, max: 1, time: 15000, errors: ['time']})
                    .then(handleReaction)
                    .catch(handleReactTimeout);
            };

            const handleReactTimeout = async (collected) => { //when time is up
                console.log("time is up");
                try {
                    await resultPage.reactions.removeAll();
                }
                catch(e) {
                    console.log("failed to remove all reactions after timeout.", e);
                }
            };

            resultPage.awaitReactions({ filter, max: 1, time: 20000, errors: ['time'] })
                .then(handleReaction)
                .catch(handleReactTimeout);

            // Reacts so the user only have to click the emojis. Runs in tandem with waiting for reaction.
            for(var i=0; i < 10 && i < results.total; i++ ) {
                await resultPage.react(emojiList[i]);
            }
        }
    }
};