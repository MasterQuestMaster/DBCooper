const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dbc-help")
        .setDescription("Show help for Cooper commands."),

    async execute(interaction) {
        const helpMessage = "**Commands:**\n\n"
            + "**db-search-custom**: The first parameter (search-name) will search for the card name and is automatically selected.\n"
            + "    Use '*' in search-name to search for any name.\n"
            + "    The second parameter (search-effect) can be used to either search for the card text, or the card's author (DB Username).\n"
            + "    To use search-effect, you have to use the tab key and then enter search-effect or select search-effect from the list.\n"
            + "    If the bot shows that it couldn't connect to DB, try waiting 5 minutes.\n\n"
            + "**db-card-texts**: This read the texts of all custom cards in a DB deck. It was made for our PSCT team.\n"
            + "**dbc-taco**: Gives tacos (added due to request of Botman)";

        await interaction.reply(helpMessage);
    }
};