const { SlashCommandBuilder } = require("@discordjs/builders");
const { createCardEmbed } = require("../card-embed.js");

module.exports =  {
    data: new SlashCommandBuilder()
	.setName("details")
	.setDescription("Shows details for a specific card in a search.")
	.addStringOption(option =>
		option.setName("number")
			.setDescription("Result number of the desired card.")
			.setRequired(true)),

    async execute(interaction) {
        const number = interaction.options.getString("number") ?? "";

        //https://maah.gitbooks.io/discord-bots/content/getting-started/awaiting-messages-and-reactions.html
        //-> wait for messages after button press.

            //filter for the button
        const filter = i => i.customId === 'details'; //&& i.user.id === '122157285790187530';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            if (i.customId === 'details') {
                await i.update({ content: 'A button was clicked!', components: [] });
            }
        });

        collector.on('end', collected => console.log(`Collected ${collected.size} items`));
    }
};