import { Message, MessageEmbed, PermissionString } from "discord.js";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";

@DefineCommand({
    name: "help",
    aliases: ["h", "command", "commands", "cmd", "cmds", "?"],
    info: {
        desc: "Show the my command list or view the my command details.",
        usage: "{prefix}help [command]",
        example: "{prefix}help ping"
    }
})
export class HelpCommand extends BaseCommand {
    public exec(message: Message, args: string[]): Promise<Message> {
        const commandHandler = this.client.commandManager;
        const helpEmbed = new MessageEmbed();
        const prefix = this.client.config.prefix;

        if (!args.length) {
            const modules = this.client.config.owners.includes(message.member!.user.id)
                ? [...commandHandler.modules.values()]
                : [...commandHandler.modules.filter(mod => !mod.hide).values()];

            helpEmbed
                .setAuthor({ name: `${this.client.user!.username}'s Command Lists` })
                .setColor("#A053A8")
                .setThumbnail(this.client.user!.displayAvatarURL({ size: 4096 }))
                .setFooter({
                    text: `• Type ${prefix}help [command] for view the command details | A total of ${
                        this.client.config.owners.includes(message.member!.user.id) ? commandHandler.commands.size : commandHandler.commands.filter(cmd => !cmd.modules.hide).size
                    } command has been loaded.`
                });

            for (const mod of modules) {
                helpEmbed.addField(
                    `**${this.client.util.toTitleCase(mod.name)}**`, mod.commands.map(cmd => `**\`${cmd.name}\`**`).join(", ")
                );
            }

            return message.reply({ embeds: [helpEmbed], allowedMentions: { repliedUser: false } });
        }

        const command = commandHandler.commands.get(args[0].toLowerCase()) ?? commandHandler.commands.find(c => c.aliases.includes(args[0].toLowerCase()));

        if (!command || (command.modules.hide && !this.client.config.owners.includes(message.member!.user.id))) {
            helpEmbed.setColor("#FF0000").setDescription(
                `I cannot find the my command list for **\`${args[0]}\`** to view the command details.`
            );

            return message.reply({ embeds: [helpEmbed], allowedMentions: { repliedUser: false } });
        }

        const requiredPermissions = command.requiredPermissions && typeof command.requiredPermissions === "object" && command.requiredPermissions.length > 1
            ? command.requiredPermissions.map(perm => `• ${perm as PermissionString}`).join("\n")
            : command.requiredPermissions && typeof command.requiredPermissions === "object"
                ? `• ${command.requiredPermissions[0] as PermissionString}`
                : `• ${command.requiredPermissions ?? "No permission for commands"}`;

        helpEmbed
            .setAuthor({ name: `${this.client.util.toTitleCase(command.name)} Command Details` })
            .setColor("#00CCFF")
            .setThumbnail(this.client.user!.displayAvatarURL({ size: 4096 }))
            .setDescription(command.info.desc)
            .addFields({
                name: "Aliases commands",
                value: command.aliases.length > 0 ? command.aliases.join(" **|** ") : "No aliases for commands"
            }, {
                name: "Usage commands",
                value: command.info.usage.replaceAll("{prefix}", prefix),
                inline: true
            }, {
                name: "Example commands",
                value: command.info.example?.replaceAll("{prefix}", prefix)
                    .replaceAll("{userTag}", message.member!.toString())
                    .replaceAll("{userName}", message.member!.user.username)
                    .replaceAll("{userId}", message.member!.id) ?? "No example for commands",
                inline: true
            }, {
                name: "Require permission commands",
                value: `\`\`\`ini\n${requiredPermissions}\n\`\`\``
            }, {
                name: "Status commands",
                value: `**\`\`\`asiidoc
• Developers Only :: ${command.ownerOnly ? "Enable" : "Disable"}
• Guilds Only :: ${command.guildOnly ? "Enable" : "Disable"}
• NSFW Only :: ${command.nsfw ? "Enable" : "Disable"}
• Cooldown :: ${command.cooldown}S
\`\`\`**`
            })
            .setFooter({ text: "• Don't include <> or [], it's mean <> is required or [] is optionals." });

        return message.reply({ embeds: [helpEmbed], allowedMentions: { repliedUser: false } });
    }
}
