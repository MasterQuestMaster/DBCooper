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
            const { username, password, db_id } = require("../db-config.json");
            dbws = new DBWebSocket(username, password, db_id);
        }

        console.log("dbws before connect check: ", dbws);

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
            console.log(searchResults);
            var results = JSON.parse(searchResults);
        }
        catch (e) {
            console.error("Error searching, or parsing the response from the server.")
            await interaction.editReply({ content: "Something went wrong trying to search DuelingBook." });
            return;
        }

        // const results = {
        //     "full_search":false,
        //     "total":111,
        //     "cards": [
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"1","type":"Quick-Play","ocg":0,"atk":"0","tcg":0,"id":1335252,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"Invoca de tu mano un monstruo \"Baron del Cielo\". Puedes desterrar esta carta (Efecto Rapido) excepto el turno que fue enviada al cementerio, invoca a un monstruo \"Comandante de los Barones del Cielo\" desterrado ignorando sus condiciones de invocacion. Solo puedes usar cada efecto de \"Altair, El Navio Celeste\" una vez por turno","name":"Altair, El Navio Celeste","pendulum_effect":"","treated_as":"Altair, El Navio Celeste","username":"Alvions"},
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"1","type":"Normal","ocg":0,"atk":"0","tcg":0,"id":2960217,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"Special Summon 1 \"Celeste\" monster from your Deck, and if you do, add 1 \"Celeste\" Ritual Spell from your GY to your hand. \"Arrival of Celeste\" can only be activated once per turn.","name":"Arrival of Celeste","pendulum_effect":"","treated_as":"Arrival of Celeste","username":"blacknub"},
        //         {"def":"200","monster_color":"Effect","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Psychic","ocg":0,"atk":"200","tcg":0,"id":2045104,"attribute":"DARK","ability":"","pendulum":0,"flip":0,"level":1,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"You cannot summon this card, except by it's own effects. You can Special Summon this card from your hand to your Opponents field. This cannot be targeted for attacks while you control other monsters. When this card is destroyed by \"Madaline, Celeste's Challenger\"; Banish this card and this card's owner draws a card. While this is banished via this effect, all \"Madaline, Celeste's Challenger\" you control gain 600 ATK. [UNCL]","name":"Badaline, Celeste's Doubts","pendulum_effect":"","treated_as":"Badaline, Celeste's Doubts","username":"Universal Collapse"},
        //         {"def":"2000","monster_color":"Effect","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Fairy","ocg":0,"atk":"100","tcg":0,"id":806281,"attribute":"LIGHT","ability":"","pendulum":0,"flip":1,"level":4,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"FLIP: Special Summon 1 Level 4 or lower Fairy-Type from your hand or Graveyard. If \"Golden Castle of Stromberg\" is on the field, once per turn this face up card cannot be destroyed by card effects.","name":"Celeste","pendulum_effect":"","treated_as":"Celeste","username":"47843784"},
        //         {"def":"2000","monster_color":"Effect","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Fairy","ocg":0,"atk":"100","tcg":0,"id":806281,"attribute":"LIGHT","ability":"","pendulum":0,"flip":1,"level":4,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"FLIP: Special Summon 1 Level 4 or lower Fairy-Type from your hand or Graveyard. If \"Golden Castle of Stromberg\" is on the field, once per turn this face up card cannot be destroyed by card effects.","name":"Celeste","pendulum_effect":"","treated_as":"Celeste","username":"47843784"},
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"1","type":"Quick-Play","ocg":0,"atk":"0","tcg":0,"id":2045110,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"Send the top card of your Deck to your GY. If it is a \"Celeste\" card; Switch the Battle Position of all monsters on the field. [UNCL]","name":"Celeste - Anxiety","pendulum_effect":"","treated_as":"Celeste - Anxiety","username":"Universal Collapse"},
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"1","type":"Quick-Play","ocg":0,"atk":"0","tcg":0,"id":2045119,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"For every \"Celeste\" card in your GY; Inflict 200 damage to your opponent and you gain 200 LP. If their are 5 or more \"Celeste\" cards in your GY; Your opponent must also discard a card. [UNCL]","name":"Celeste - Fatigue","pendulum_effect":"","treated_as":"Celeste - Fatigue","username":"Universal Collapse"},
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"1","type":"Quick-Play","ocg":0,"atk":"0","tcg":0,"id":2045114,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"Discard a \"Celeste\" card; Reduce the ATK of all monsters on the field by 1000. [UNCL]","name":"Celeste - Fear","pendulum_effect":"","treated_as":"Celeste - Fear","username":"Universal Collapse"},
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"1","type":"Quick-Play","ocg":0,"atk":"0","tcg":0,"id":2045115,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"You can only activate this if you control another \"Celeste\" card. Discard a card and target a card; Destroy it. [UNCL]","name":"Celeste - Hatred","pendulum_effect":"","treated_as":"Celeste - Hatred","username":"Universal Collapse"},
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"1","type":"Quick-Play","ocg":0,"atk":"0","tcg":0,"id":2045124,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"You can only activate this if you control a \"Celeste\" monster. Search your deck for a \"Badaline\" monster; Special Summon it to your opponent's field, ignoring it's summoning conditions. [UNCL]","name":"Celeste - Ignorance","pendulum_effect":"","treated_as":"Celeste - Ignorance","username":"Universal Collapse"},
        //         {"def":"1000","monster_color":"Ritual","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Celestial Warrior","ocg":0,"atk":"1600","tcg":0,"id":2960136,"attribute":"WATER","ability":"","pendulum":0,"flip":0,"level":4,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"This card can be Ritual Summoned with any \"Celeste\" Ritual Spell. If this card is Ritual Summoned: You can discard 1 card; add 1 \"Celeste\" card from your Deck to your hand except \"Celeste Alanara\". If this card is sent from the field to the GY: You can draw 1 card. Each effect of \"Celeste Alanara\" can only be activated once per turn.","name":"Celeste Alanara","pendulum_effect":"","treated_as":"Celeste Alanara","username":"blacknub"},
        //         {"def":"0","monster_color":"","arrows":"","is_effect":0,"scale":0,"pic":"2","type":"Ritual","ocg":0,"atk":"0","tcg":0,"id":2960112,"attribute":"","ability":"","pendulum":0,"flip":0,"level":0,"custom":1,"serial_number":"","card_type":"Spell","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"This card is used to Ritual Summon any \"Celeste\" Ritual Monster. You must also tribute monsters from your hand and/or field whos Levels are equal to or greater than the Level of the Summoned Ritual Monster. While this card is in your GY: You can reveal 1 \"Celeste\" Ritual Monster in your hand; tribute monsters from your hand and/or field whos Levels are exactly equal to the revealed monster. Then Ritual Summon that revealed monster from your hand. This effect of \"Celeste Ascension\" can only be activated once per turn.","name":"Celeste Ascension","pendulum_effect":"","treated_as":"Celeste Ascension","username":"blacknub"},
        //         {"def":"?","monster_color":"Link","arrows":"00000100","is_effect":1,"scale":0,"pic":"1","type":"Celestial Warrior","ocg":0,"atk":"400","tcg":0,"id":2961227,"attribute":"LIGHT","ability":"","pendulum":0,"flip":0,"level":1,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"1 \"Celeste\" Monster\nYou can discard 1 \"Celeste\" Ritual Spell or 1 \"Celeste\" Ritual Monster; Ritual Summon 1 \"Celeste\" Ritual Monster from your hand. This effect of \"Celeste Behyem\" can only be activated once per turn. If you would Ritual Summon a \"Celeste\" Ritual Monster, you can use this card as the full tribute.","name":"Celeste Behyem","pendulum_effect":"","treated_as":"Celeste Behyem","username":"blacknub"},
        //         {"def":"400","monster_color":"Effect","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Celestial Warrior","ocg":0,"atk":"1000","tcg":0,"id":2960036,"attribute":"EARTH","ability":"Tuner","pendulum":0,"flip":0,"level":3,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"If this card is Normal Summoned: You can add 1 \"Celeste\" Ritual Spell from your Deck to your hand. If this card is Special Summoned: You can add 1 \"Celeste\" Ritual Monster from your Deck to your hand. If this card is sent from the field to the GY: You can target 1 \"Celeste\" Ritual monster and 1 \"Celeste\" Ritual Spell in your GY; add those targets to your hand. Each effect of \"Celeste Ceram\" can only be activated once per turn.","name":"Celeste Ceram","pendulum_effect":"","treated_as":"Celeste Ceram","username":"blacknub"},
        //         {"def":"1000","monster_color":"Ritual","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Celestial Warrior","ocg":0,"atk":"1600","tcg":0,"id":2960405,"attribute":"LIGHT","ability":"","pendulum":0,"flip":0,"level":4,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"This card can be Ritual Summoned with any \"Celeste\" Ritual Spell. You can discard this card and 1 other card in your hand and target 1 \"Celeste\" monster you control; that target is unaffected by your opponent's monster effects and cannot be destroyed by battle this turn. If this card is Ritual Summoned: You can send 1 \"Celeste\" Ritual Spell from your hand or Deck to the GY; Special Summon 1 Level 4 or lower \"Celeste\" Ritual Monster from your Deck. Each effect of \"Celeste Deadalus\" can only be acitvated once per turn.","name":"Celeste Deadalus","pendulum_effect":"","treated_as":"Celeste Deadalus","username":"blacknub"},
        //         {"def":"400","monster_color":"Ritual","arrows":"","is_effect":1,"scale":0,"pic":"4","type":"Celestial Warrior","ocg":0,"atk":"1000","tcg":0,"id":2960124,"attribute":"WIND","ability":"","pendulum":0,"flip":0,"level":3,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"This card can be Ritual Summoned with any \"Celeste\" Ritual Spell. If this card is Ritual Summoned: You can target 1 card on the field; return it to the hand. If this card is sent from the field to the GY: You can target 1 other \"Celeste\" card in your GY; add it to your hand. Each effect of \"Celeste Gustam\" can only be activated once per turn.","name":"Celeste Gustam","pendulum_effect":"","treated_as":"Celeste Gustam","username":"blacknub"},
        //         {"def":"1900","monster_color":"Synchro","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Celestial Warrior","ocg":0,"atk":"2500","tcg":0,"id":2960324,"attribute":"FIRE","ability":"","pendulum":0,"flip":0,"level":7,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"1 \"Celeste\" Tuner + 1 non-Tuner monster\nIf this card is Synchro Summoned: Target 1 monster your opponent controls; deal damage to your opponent equal to that monster's ATK, then destroy all monsters your opponent controls with ATK equal to or less than the amount of damage dealt. If this card is sent to the GY, except from the Extra Deck: You can deal 800 damage to your LP; destroy 1 card on the field. Each effect of \"Celeste Infarus\" can only be activated once per turn.","name":"Celeste Infarus","pendulum_effect":"","treated_as":"Celeste Infarus","username":"blacknub"},
        //         {"def":"2550","monster_color":"Xyz","arrows":"","is_effect":1,"scale":0,"pic":"2","type":"Celestial Warrior","ocg":0,"atk":"3150","tcg":0,"id":2960360,"attribute":"LIGHT","ability":"","pendulum":0,"flip":0,"level":7,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"3 Level 7 \"Celeste\" monsters\nThis card can also be Special Summoned by using a Level 7 \"Celeste\" Ritual Monster as Material. (This is not treated as an XYZ Summon). If Summoned this way, the effects of \"Celeste Maryanos\" cannot be activated until the End Phase of the next turn. Once while this card is face-up on the field: You can detach 1, 2, or 3 XYZ Material from this card; activate an effect depending on the amount of Material Detached.\n1. Skip the Draw Phase of your opponent's next turn.\n2. Look at your opponent's hand and place 1 card on the Bottom of the Deck.\n3. Shuffle all cards from your opponent's field, GY, hand, and face-up in the Banish Zone into the Deck. Then your opponent draws 4 cards.","name":"Celeste Maryanos","pendulum_effect":"","treated_as":"Celeste Maryanos","username":"blacknub"},
        //         {"def":"?","monster_color":"Link","arrows":"00001010","is_effect":1,"scale":0,"pic":"2","type":"Celestial Warrior","ocg":0,"atk":"1000","tcg":0,"id":2961237,"attribute":"DARK","ability":"","pendulum":0,"flip":0,"level":2,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"2 \"Celeste\" monsters including at least 1 Ritual Monster\nIf this card is Link Summoned: You can Special Summon 1 \"Celeste\" Ritual Monster from your hand. If you have a card in your Banish Zone: You can target 1 \"Celeste\" Ritual Monster or \"Celeste\" Ritual Spell in your GY; add that target to your hand. Each effect of \"Celeste Nihilio\" can only be activated once per turn.","name":"Celeste Nihilio","pendulum_effect":"","treated_as":"Celeste Nihilio","username":"blacknub"},
        //         {"def":"0","monster_color":"Effect","arrows":"","is_effect":1,"scale":0,"pic":"1","type":"Psychic","ocg":0,"atk":"800","tcg":0,"id":2646766,"attribute":"LIGHT","ability":"","pendulum":0,"flip":0,"level":2,"custom":1,"serial_number":"","card_type":"Monster","tcg_limit":3,"ocg_limit":3,"rush":0,"effect":"When this card inflicts battle damage to your opponent gain LP equal to that battle damage. If this card is discarded to the GY: You can Special Summon this card from your GY, and if you do, destroy 1 card on the field, then, if it was a Monster Card, gain 500 LP.. If Special Summoned this way, banish this card when it leaves the field. You can only use this effect of \"Celeste of the Holy Order\" once per turn.","name":"Celeste of the Holy Order","pendulum_effect":"","treated_as":"Celeste of the Holy Order","username":"Pleinair {ZA WARUDO}"}
        //     ],
        //     "action":"Search cards",
        //     "page":0,
        //     "millis":416
        // };

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