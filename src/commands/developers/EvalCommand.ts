import { Message, MessageEmbed } from "discord.js";
import { inspect } from "util";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";
import { errorEmbed } from "../../util/errorEmbed";

@DefineCommand({
    name: "eval",
    aliases: ["e", "ev", "evaluate"],
    ownerOnly: true,
    info: {
        desc: "Evaluate code the bots.",
        usage: "{prefix}eval <code>",
        example: "{prefix}eval this;"
    }
})
export class EvalCommand extends BaseCommand {
    public async exec(message: Message, _args: string[]): Promise<Message> {
        const { args, flag } = this.parseQuery(_args);
        const evalEmbed = new MessageEmbed();

        let evaled;
        let result;

        const code = args.join(" ");

        if (!code.length) return message.channel.send({ embeds: [errorEmbed("argsMissing", { content: "No code for provided.", command: this })] });

        try {
            if (code.length >= 1024) {
                const hastebin = await this.client.util.hastebin(code);

                evalEmbed.addField("Input", hastebin);
            } else { evalEmbed.addField("Input", `\`\`\`js\n${code}\n\`\`\``); }

            const silentFlag = ["silent", "hide"];

            if (flag.includes("async")) {
                for (const silentEval of silentFlag) {
                    if (flag.includes(silentEval)) return await eval(`(async () => { ${code} })()`);
                }

                evaled = await eval(`(async () => { ${code} })()`);
            } else {
                for (const silentEval of silentFlag) {
                    if (flag.includes(silentEval)) return await eval(code);
                }

                evaled = await eval(code);
            }

            if (typeof evaled !== "string") evaled = inspect(evaled, { depth: 0 });

            const output = this.clean(evaled);

            if (flag.includes("no-embed")) {
                if (output.length >= 2000) {
                    const hastebin = await this.client.util.hastebin(output);

                    result = hastebin;
                } else { result = output; }

                const isURL = this.client.util.validateURL(result);

                return await message.channel.send(isURL ? result : `\`\`\`js\n${result}\n\`\`\``);
            }

            if (output.length >= 1024) {
                const hastebin = await this.client.util.hastebin(output);

                result = hastebin;
            } else { result = output; }

            const isURL = this.client.util.validateURL(result);

            evalEmbed.setColor("#00FF00").addField("Output", isURL ? result : `\`\`\`js\n${result}\n\`\`\``);
        } catch (e) {
            const error = this.clean(String(e));

            if (flag.includes("no-embed")) {
                if (error.length >= 2000) {
                    const hastebin = await this.client.util.hastebin(error);

                    result = hastebin;
                } else { result = error; }

                const isURL = this.client.util.validateURL(result);

                return message.channel.send(isURL ? result : `\`\`\`js\n${result}\n\`\`\``);
            }

            if (error.length >= 1024) {
                const hastebin = await this.client.util.hastebin(error);

                result = hastebin;
            } else { result = error; }

            const isURL = this.client.util.validateURL(result);

            evalEmbed.setColor("#FF0000").addField("Error", isURL ? result : `\`\`\`js\n${result}\n\`\`\``);
        }

        return message.channel.send({ embeds: [evalEmbed] });
    }

    private parseQuery(queries: string[]): { args: string[]; flag: string[] } {
        const args = [];
        const flag = [];

        for (const query of queries) {
            if (query.startsWith("--")) flag.push(query.slice(2).toLowerCase());
            else args.push(query);
        }

        return { args, flag };
    }

    private clean(text: string): string {
        if (typeof text === "string") {
            if (process.env.TOPGG_TOKEN) text.replace(new RegExp(process.env.TOPGG_TOKEN, "g"), "[REDACTED]");

            return text.replace(/`/g, `\`${String.fromCharCode(8203)}`)
                .replace(new RegExp(process.env.DISCORD_TOKEN!, "g"), "[REDACTED]")
                .replace(new RegExp(process.env.MONGODB_URL!, "g"), "[REDACTED]")
                .replace(new RegExp(process.env.YOUTUBE_API!, "g"), "[REDACTED]")
                .replace(/@/g, `@${String.fromCharCode(8203)}`); // eslint-disable-line prefer-const
        }

        return text;
    }
}
