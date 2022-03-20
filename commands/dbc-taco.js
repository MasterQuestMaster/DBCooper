const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dbc-taco")
        .setDescription("Gives tacos."),

    async execute(interaction) {
        const helpMessage = "1 Taco for you: https://www.collinsdictionary.com/images/full/taco_180368483.jpg";

        await interaction.reply(helpMessage);
    }
};