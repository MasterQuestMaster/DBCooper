const { MessageEmbed } = require("discord.js");

const Colour = {
    Token: 0x8d8693,
    Spell: 0x1d9e74,
    Trap: 0xbc5a84,
    Fusion: 0xa086b7,
    Ritual: 0x6699ff,
    Synchro: 0xe8e8e6,
    Xyz: 0x2d2f33,
    Link: 0x1f11b2,
    Skill: 0x4287f5,
    Normal: 0xfde68a,
    Orange: 0xff8b53
};

const RaceIcon = {
    Warrior: "<:Warrior:602707927224025118>",
    Spellcaster: "<:Spellcaster:602707926834085888>",
    Fairy: "<:Fairy:602707926200614912>",
    Fiend: "<:Fiend:602707926850732035>",
    Zombie: "<:Zombie:602707927102390292>",
    Machine: "<:Machine:602707926733291521>",
    Aqua: "<:Aqua:602707887931785238>",
    Pyro: "<:Pyro:602707925793767427>",
    Rock: "<:Rock:602707926213460010>",
    "Winged Beast": "<:WingedBeast:602707926464987138>",
    Plant: "<:Plant:602707792138076186>",
    Insect: "<:Insect:602707926146088960>",
    Thunder: "<:Thunder:602707927484203013>",
    Dragon: "<:Dragon:602707926901325834>",
    Beast: "<:Beast:602707889018372109>",
    "Beast-Warrior": "<:BeastWarrior:602707890171543593>",
    Dinosaur: "<:Dinosaur:602713887141527563>",
    Fish: "<:Fish:602707925877915659>",
    "Sea Serpent": "<:SeaSerpent:602707926288826378>",
    Reptile: "<:Reptile:602707927219830784>",
    Psychic: "<:Psychic:602707926767108129>",
    "Divine-Beast": "<:DivineBeast:602707925730852874>",
    "Creator-God": "<:CreatorGod:602707927219961866>", // TODO: should not be hyphenated
    Wyrm: "<:Wyrm:602707927068835884>",
    Cyberse: "<:Cyberse:602707927421157376>"
    //Yokai: "<:Yokai:602707927932993546>",
    //Charisma: "<:Charisma:602707891530629130>"
};

const AttributeIcon = {
    EARTH: "<:EARTH:602707925726658570>",
    WATER: "<:WATER:602707927341596691>",
    FIRE: "<:FIRE:602707928255954963>",
    WIND: "<:WIND:602707926771171348>",
    LIGHT: "<:LIGHT:602707926183968768>",
    DARK: "<:DARK:602707926792273920>",
    DIVINE: "<:DIVINE:602707926594879498>",
    LAUGH: "<:LAUGH:602719132567207938>"
};

const Icon = {
    Spell: "<:SPELL:623021653580054538>",
    Trap: "<:TRAP:623021653810741258> ",
    Ritual: "<:Ritual:602707927274487838>",
    "Quick-Play": "<:QuickPlay:602707927073030150> ",
    Continuous: "<:Continuous:602707892507770891>",
    Equip: "<:Equip:602707925886042119> ",
    Field: "<:FIELD:602707926834216963> ",
    Counter: "<:Counter:602707928075599872>",
    //Link: "<:LinkSpell:602707598164099104>",
    LeftScale: "<:ScaleLeft:602710168337121290>",
    RightScale: "<:ScaleRight:602710170430210048>",
    Level: "<:level:602707925949087760>",
    Rank: "<:rank:602707927114973185>"
};

module.exports = {
    createCardEmbed: function (card) {

        const embed = new MessageEmbed()
            .setTitle(card.name)
            .setURL(`https://www.duelingbook.com/card?id=${card.id}`)
            .setThumbnail(getImage(card));

        if (card.card_type === "Monster") {
            embed.setColor(Colour[card.monster_color] ?? Colour["Orange"]); 

            let description =
                `**Type**: ${RaceIcon[card.type]} ${card.type} / ${getTypeline(card)}\n` +
                `**Attribute**: ${AttributeIcon[card.attribute]} ${card.attribute}\n`;

            if (card.monster_color === "Xyz") {
                description += `**Rank**: ${Icon.Rank} ${card.rank} **ATK**: ${card.atk} **DEF**: ${card.def}`;
            } else if (card.monster_color === "Link") {
                const arrows = getLinkArrows(card);
                description += `**Link Rating**: ${card.level} **ATK**: ${card.atk} **Link Arrows**: ${arrows.join("")}`;
            } else {
                description += `**Level**: ${Icon.Level} ${card.level} **ATK**: ${card.atk} **DEF**: ${card.def}`;
            }

            if (card.pendulum > 0) {
                description += ` **Pendulum Scale**: ${Icon.LeftScale}${card.scale}/${card.scale}${Icon.RightScale}`;
            }

            embed.setDescription(description);

            if (card.pendulum === 0) {
                embed.addField("Card Text", card.effect);
                // common return
            } else {
                // Discord cannot take just a blank or spaces, but this zero-width space works
                embed.addField("Pendulum Effect", card.pendulum_effect || "\u200b");
                embed.addField("Card Text", card.effect);
            }
        } else {
            embed.setColor(Colour[card.card_type]);
            
            //card_type = Spell/Trap, type = Quick-Play, Continuous,...
            let description = Icon[card.card_type];
            const subtype = card.type;
            if (subtype !== "Normal" && subtype in Icon) {
                description += ` ${Icon[subtype]}`;
            }
            description += `**${card.type} ${card.card_type}**`;
            embed.setDescription(description);

            embed.addField("Card Effect", card.effect);
        }

        // one or both may be null to due data corruption or prereleases
        embed.setFooter({ text: `ID: ${card.id} | Author: ${card.username}` });

        return [embed];
    }
}

function getTypeline(card) {
    const extraMonsterTypes = ["Fusion","Synchro","Xyz","Link"];

    let types = [];
    if(extraMonsterTypes.includes(card.monster_color) || card.pendulum == 1) {
        types.push(card.monster_color);
    }

    if(card.ability) {
        types.push(card.ability);
    }

    if(card.monster_color === "Normal") {
        types.push("Normal");
    }
    else if(card.is_effect === 1) {
        types.push("Effect");
    }

    return types.join(" / ");
}

function getLinkArrows(card) {
    const allArrows = ["↖️","⬆️", "↗️","➡️","↘️","⬇️","↙️","⬅️"];
    return card.arrows.split("")
        .map((value, index) => value == "1" ? allArrows[index] : "")
        .filter((value) => value)
        .reverse();
}

//These functions are from DB.
function getImage(card) {

    if (card.pic == "0") {
        return "";
    }

    var src = "https://images.duelingbook.com/low-res/" + card.id + ".jpg";
    if (card.custom > 0) {
        src = "https://images.duelingbook.com/custom-pics/" + getCustomFolder(card.id) + "/" + card.id + ".jpg";
    }
    if (card.monster_color == "Token") {
        src = card.pic;
    }
    else if (card.pic.indexOf("http") == 0) {
        src = card.pic;
    }
    else if (card.pic != "1") {
        src += '?version=' + card.pic;
    }

    return src;
}

function getCustomFolder(id) {
	if (id < 100000) {
		return "0";
	}
	return Math.floor(id / 100000) + "00000";
}