import { GuildMember, MessageEmbedOptions } from "discord.js";
import { prefix } from "../config";
import { BaseCommand } from "../structures/BaseCommand";

export function errorEmbed(type: "argsMissing" | "error", options: errorOptions): MessageEmbedOptions {
    const embed: MessageEmbedOptions = { color: "#FF0000", description: options.content };

    if (type === "error" && options.error) {
        embed.description = `${options.content}, Error: \`${options.error.message.replace(".", "")}\`.`;
    }

    if (type === "argsMissing" && options.command) {
        const prefixes = prefix;

        embed.author = { name: "Argument Missings" };
        embed.color = "#FFFF00";
        embed.fields = [{
            name: "Usage commands", value: options.command.info.usage.replaceAll("{prefix}", prefixes)
        }, {
            name: "Example commands",
            value: (options.member
                ? options.command.info.example?.replaceAll("{userTag}", options.member.toString())
                    .replaceAll("{userName}", options.member.user.username)
                    .replaceAll("{userId}", options.member.id)
                : options.command.info.example)?.replaceAll("{prefix}", prefixes) ?? "No example for commands"
        }];
        embed.footer = { text: `• For more information or detail commands, typin: ${prefixes}help ${options.command.name}.` };
    }

    return embed;
}

interface errorOptions {
    content: string;
    command?: BaseCommand;
    error?: Error;
    member?: GuildMember;
}
