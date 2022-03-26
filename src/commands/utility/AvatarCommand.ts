import { Message } from "discord.js";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";

@DefineCommand({
    name: "avatar",
    aliases: ["ava", "icon", "av", "pfp", "pp"],
    info: {
        desc: "Show the avatar for someone the users.",
        usage: "{prefix}avatar [@user|userName|userId]",
        example: "{prefix}avatar {userTag}\n{prefix}avatar {userName}\n{prefix}avatar {userId}\n{prefix}avatar"
    }
})
export class AvatarCommand extends BaseCommand {
    public exec(message: Message, args: string[]): Promise<Message> {
        let mentions = message.mentions.members!.first() ?? message.guild!.members.resolve(args[0]);
        if (!mentions) {
            const members = message.guild!.members.cache.filter(
                m => m.displayName.toLowerCase() === args.join(" ").toLowerCase() || m.user.username.toLowerCase() === args.join(" ").toLowerCase()
            );

            mentions = members.first() ?? message.member!;
        }

        return message.reply({
            embeds: [{
                title: `${mentions.user.username}'s Avatar`,
                url: mentions.user.displayAvatarURL({ dynamic: true, size: 4096 }),
                color: mentions.displayHexColor,
                image: { url: mentions.user.displayAvatarURL({ dynamic: true, size: 4096 }) },
                timestamp: Date.now()
            }],
            allowedMentions: { repliedUser: false }
        });
    }
}
