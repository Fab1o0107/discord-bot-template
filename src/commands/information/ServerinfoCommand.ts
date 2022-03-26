import { Message, MessageActionRow, MessageButton, MessageEmbed, VerificationLevel } from "discord.js";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";

@DefineCommand({
    name: "serverinfo",
    aliases: ["infoserver", "server", "serveri", "sinfo", "si"],
    info: {
        desc: "Show the Discord information for this server.",
        usage: "{prefix}serverinfo [flagument]",
        example: "{prefix}serverinfo\n{prefix}serverinfo --roles\n{prefix}serverinfo --emoji\n{prefix}serverinfo --avatar"
    }
})
export class ServerinfoCommand extends BaseCommand {
    public async exec(message: Message, args: string[]): Promise<any> {
        const serverinfoEmbed = new MessageEmbed().setColor("#00CCFF").setTimestamp();

        if (["-avatar", "--avatar", "-icon", "--icon"].includes(args[0])) {
            if (!message.guild!.icon) {
                serverinfoEmbed.setColor("#FF0000").setDescription(
                    "The server is no have icon server for show full version, please add icon server and try again!"
                );

                return message.channel.send({ embeds: [serverinfoEmbed] });
            }

            serverinfoEmbed
                .setAuthor({ name: `${message.guild!.name} Server Icon`, url: message.guild!.iconURL({ size: 4096, dynamic: true })! })
                .setImage(message.guild!.iconURL({ size: 4096, dynamic: true })!);

            return message.channel.send({ embeds: [serverinfoEmbed] });
        }

        if (["-emoji", "--emoji", "-emote", "--emote"].includes(args[0])) {
            serverinfoEmbed.setAuthor({ name: `${message.guild!.name} Server Emojis` });

            const emoji = [...message.guild!.emojis.cache.values()].map((e, i) => `**${++i}.** ${e.toString()}, **\`${e.name!}\`** - \`${e.id}\`.`);

            if (message.guild!.emojis.cache.size > 10) {
                const indexes = this.client.util.chunk(emoji);

                let index = 0;

                serverinfoEmbed.setDescription(indexes[index].join("\n")).setFooter({ text: `Page ${index + 1} of ${indexes.length}` });

                return message.channel.send({
                    embeds: [serverinfoEmbed],
                    components: [
                        new MessageActionRow().addComponents([
                            new MessageButton()
                                .setCustomId("previous-serveremoji")
                                .setStyle("SECONDARY")
                                .setLabel("Previous"),
                            new MessageButton()
                                .setCustomId("next-serveremoji")
                                .setStyle("SECONDARY")
                                .setLabel("Next")
                        ])
                    ]
                }).then(m => {
                    const messageComponentCollector = m.channel.createMessageComponentCollector({
                        filter: interaction => {
                            if (interaction.user.id === message.author.id) return true;

                            interaction.reply({
                                embeds: [{ color: "#FF0000", description: `I'm sorry, but that interaction is only for ${message.member!.toString()}.` }], ephemeral: true
                            }).catch(e => this.client.logger.error("PROMISE_ERR: ", e));

                            return false;
                        },
                        time: 120_000
                    });

                    messageComponentCollector.on("collect", interaction => {
                        if (interaction.customId === "previous-serveremoji") {
                            if (index === 0) return interaction.deferUpdate();
                            index--;

                            serverinfoEmbed.setDescription(indexes[index].join("\n")).setFooter({ text: `Page ${index + 1} of ${indexes.length}` });
                        } else if (interaction.customId === "next-serveremoji") {
                            if (index + 1 === indexes.length) return interaction.deferUpdate();
                            index++;

                            serverinfoEmbed.setDescription(indexes[index].join("\n")).setFooter({ text: `Page ${index + 1} of ${indexes.length}` });
                        }

                        return interaction.update({ embeds: [serverinfoEmbed] }) as any;
                    });

                    messageComponentCollector.on("end", () => {
                        m.components[0].components.forEach(component => component.setDisabled());

                        return m.edit({ components: m.components }) as any;
                    });

                    return m;
                });
            }

            return message.channel.send({ embeds: [serverinfoEmbed.setDescription(emoji.join("\n")).setFooter({ text: "Page 1 of 1" })] });
        }

        const verification: Record<VerificationLevel, string> = {
            NONE: "None (Unrestriced)",
            LOW: "Low (Must have a verified email on their Discord account)",
            MEDIUM: "Medium (Must also be registered on Discord for longer 5 minutes)",
            HIGH: "High (Must also be a member of this server for longer 10 minutes)",
            VERY_HIGH: "Highest (Must have a verified phone on their Discord account)"
        };

        serverinfoEmbed
            .setAuthor({ name: "Server Informations" })
            .setDescription(
                `
You can type **\`server roles\`** to show list the **Server Roles**,
or type **\`server emojis\`** tho show list the **Server Emojis**,
and also type **\`server icon\`** to show the **Server Icon**.
`
            )
            .addFields({
                name: "**Over View**",
                value: `\`\`\`asciidoc
• Server Name     :: ${message.guild!.name}
• Server ID       :: ${message.guild!.id}
• Server V. Level :: ${verification[message.guild!.verificationLevel]}
\`\`\``,
                inline: false
            }, {
                name: "**Statistic**",
                value: `\`\`\`asciidoc
• Roles    :: ${message.guild!.roles.cache.size.toLocaleString()}
• Channels :: [${message.guild!.channels.cache.size.toLocaleString()}]
           :: ${message.guild!.channels.cache.filter(m => m.type === "GUILD_CATEGORY").size.toLocaleString()} Category
           :: ${message.guild!.channels.cache.filter(m => m.isText()).size.toLocaleString()} Text (include Thread, and News)
           :: ${message.guild!.channels.cache.filter(m => m.isVoice()).size.toLocaleString()} Voice (include Stage)
• Members  :: [${message.guild!.memberCount.toLocaleString()}]
           :: ${message.guild!.members.cache.filter(m => m.presence?.status === "online").size.toLocaleString()} Online
           :: ${message.guild!.members.cache.filter(m => m.presence?.status === "idle").size.toLocaleString()} Idle
           :: ${message.guild!.members.cache.filter(m => m.presence?.status === "dnd").size.toLocaleString()} Do Not Disturb
           :: ${message.guild!.members.cache.filter(m => !m.presence || m.presence.status === "offline").size.toLocaleString()} Offline
\`\`\``,
                inline: false
            }, {
                name: "**Details**",
                value: `\`\`\`asciidoc
• Owner Server      :: ${(await message.guild!.fetchOwner()).user.tag}
                    :: ${(await message.guild!.fetchOwner()).user.id}
• Owner Created At  :: ${(await message.guild!.fetchOwner()).user.createdAt.toLocaleString()}
\`\`\``
            });

        return message.channel.send({ embeds: [serverinfoEmbed] });
    }
}
