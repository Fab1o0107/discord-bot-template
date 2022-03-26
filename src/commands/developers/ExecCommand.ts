import { exec } from "child_process";
import { Message } from "discord.js";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";
import { errorEmbed } from "../../util/errorEmbed";

@DefineCommand({
    name: "exec",
    aliases: ["ex", "execute", "$"],
    ownerOnly: true,
    info: {
        desc: "Execute commmand on terminal the bots.",
        usage: "{prefix}exec <bash>",
        example: "{prefix}exec ls"
    }
})
export class ExecCommand extends BaseCommand {
    public exec(message: Message, args: string[]): Promise<Message> {
        if (!args.length) return message.channel.send({ embeds: [errorEmbed("argsMissing", { content: "No bash for provided.", command: this })] });

        return message.channel.send(`**❱_ ${args.join(" ")}**`).then(m => {
            exec(args.join(" "), async (stdout, stderr) => {
                if (!stdout && !stderr) return m.edit(`**❱_ ${args.join(" ")}**\nExecuted without results.`);

                if (stdout) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    if ((stdout as any).length >= 2000) {
                        const hastebin = await this.client.util.hastebin(stdout as unknown as string);

                        return m.edit(`**❱_ ${args.join(" ")}**\n${hastebin}`);
                    }

                    return m.edit(`**❱_ ${args.join(" ")}**\n\`\`\`bash\n${stdout as any}\n\`\`\``);
                }

                if (stderr.length >= 2000) {
                    const hastebin = await this.client.util.hastebin(stderr);

                    return m.edit(`**❱_ ${args.join(" ")}**\n${hastebin}`);
                }

                return m.edit(`**❱_ ${args.join(" ")}**\n\`\`\`bash\n${stderr}\n\`\`\``);
            });

            return m;
        });
    }
}
