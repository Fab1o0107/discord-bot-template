import { Message } from "discord.js";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";
import { errorEmbed } from "../../util/errorEmbed";

@DefineCommand({
    name: "reload",
    aliases: ["rl"],
    ownerOnly: true,
    info: {
        desc: "Reload the single command or category command the bots.",
        usage: "{prefix}reload [<command>] <flagument>",
        example: "{prefix}reload --all\n{prefix}reload core --category\n{prefix}reload ping --command"
    }
})
export class ReloadCommand extends BaseCommand {
    public exec(message: Message, _args: string[]): Promise<Message> {
        const { args, flag } = this.client.util.parseQuery(_args);

        if (!flag.length) {
            return message.channel.send({
                embeds: [{ color: "#FF0000", description: "You not provide the flagument options, the valid a **`all`**, **`category`**, **`command`** flagument options." }]
            });
        }

        if (!["all", "category", "categories", "module", "modules", "command", "commands", "cmd", "cmds"].includes(flag[0])) {
            return message.channel.send({
                embeds: [{
                    color: "#FF0000",
                    description: `You provide a flagument option for **\`${flag[0]}\`** is invalid, the valid a **\`all\`**, **\`category\`**, **\`command\`** flagument options.`
                }]
            });
        }

        const commandHandler = this.client.commandManager;

        if (flag[0] === "all") {
            return message.channel.send({ embeds: [{ color: "#00CCFF", description: "The all command will be **`Reloaded`**, please wait..." }] }).then(m => {
                for (const command of [...commandHandler.commands.values()]) command.reload().catch(e => this.client.logger.error("PROMISE_ERR: ", e));

                return m.edit({ embeds: [{ color: "#00FF00", description: "Done, the all command has been **`Reloaded`**." }] });
            });
        }

        if (["category", "categories", "module", "modules"].includes(flag[0])) {
            if (!args.length) return message.channel.send({ embeds: [errorEmbed("argsMissing", { content: "No category command for provided.", command: this })] });

            const commandModule = commandHandler.modules.get(args[0]);

            if (!commandModule) {
                return message.channel.send({
                    embeds: [{ color: "#FF0000", description: `I cannot find for **\`${args[0]}\`** from the category commands, because you provide is invalid.` }]
                });
            }

            return message.channel.send({
                embeds: [{ color: "#00CCFF", description: `The category command for **${this.client.util.toTitleCase(commandModule.name)}** will be **\`Reloaded\`**, please wait...` }]
            }).then(m => {
                for (const command of commandModule.commands) command.reload().catch(e => this.client.logger.error("PROMISE_ERR: ", e));

                return m.edit({
                    embeds: [{ color: "#00FF00", description: `Done, the category command for **${this.client.util.toTitleCase(commandModule.name)}** has been **\`Reloaded\`**.` }]
                });
            });
        }

        if (!args.length) return message.channel.send({ embeds: [errorEmbed("argsMissing", { content: "No command for provided.", command: this })] });

        const command = commandHandler.commands.get(args[0]) ?? commandHandler.commands.find(c => c.aliases.includes(args[0]));

        if (!command) {
            return message.channel.send({ embeds: [{ color: "#FF0000", description: `I cannot find for **\`${args[0]}\`** from the commands, because you provide is invalid.` }] });
        }

        return message.channel.send({
            embeds: [{ color: "#00CCFF", description: `The command for **${this.client.util.toTitleCase(command.name)}** will be **\`Reloaded\`**, please wait...` }]
        }).then(m => {
            command.reload().catch(e => this.client.logger.error("PROMISE_ERR: ", e));

            return m.edit({ embeds: [{ color: "#00FF00", description: `Done, the command for **${this.client.util.toTitleCase(command.name)}** has been **\`Reloaded\`**.` }] });
        });
    }
}
