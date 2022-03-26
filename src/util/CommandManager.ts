import { Collection, Message, MessageEmbed, NewsChannel, Snowflake, TextChannel, ThreadChannel } from "discord.js";
import { promises as fs } from "fs";
import { parse, resolve } from "path";
import { BaseCommand, CommandModules } from "../structures/BaseCommand";
import { BotClient } from "../structures/BotClient";

export class CommandManager {
    public modules: Collection<string, CommandModules> = new Collection();
    public commands: Collection<string, BaseCommand> = new Collection();
    public cooldowns: Collection<string, Collection<Snowflake, number>> = new Collection();
    public constructor(public readonly client: BotClient, private readonly path: string) {
        Object.defineProperties(this, {
            client: { enumerable: true, writable: false },
            path: { enumerable: false, writable: false }
        });
    }

    public load(): void {
        fs.readdir(resolve(this.path)).then(async modules => {
            let hidedCount = 0;

            for (const module of modules) {
                const modulePath = resolve(this.path, module);
                const moduleConf: CommandModules = require(resolve(modulePath, "module.meta.json"));

                Object.assign(moduleConf, { path: modulePath, commands: [] });

                if (moduleConf.hide) hidedCount++;

                await fs.readdir(resolve(modulePath)).then(async files => {
                    for (const file of files) {
                        if (file.endsWith(".json")) continue;

                        const path = resolve(moduleConf.path, file);
                        const command = await this.import(path, this.client, path, moduleConf, true);

                        if (!command) return Promise.reject(new ReferenceError(`File ${file} is invalid command files.`));

                        this.commands.set(command.name, command);
                        moduleConf.commands.push(command);

                        this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Command for ${command.name} in ${moduleConf.name} category has been loaded.`);
                    }

                    this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} A total of ${files.filter(f => (/(?!json)(ts|js)/gi).exec(f) !== null).length} of command in ${moduleConf.name} category has been loaded.`);
                });

                if (hidedCount !== 0) this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} ${hidedCount} out of ${modules.length} category are hided.`);

                this.modules.set(module, moduleConf);
            }
        }).catch(e => this.client.logger.error("COMMAND_LOADER_ERR: ", e));

        return undefined;
    }

    public handle(message: Message): any {
        const prefix = this.client.config.prefix;
        if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return message;

        const args = message.content.substring(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();
        const command = this.commands.get(commandName!) ?? this.commands.find(({ aliases }) => aliases.includes(commandName!));

        if (!command || (command.modules.hide && !this.client.config.owners.includes(message.author.id))) return message;
        if (message.guild && !message.guild.members.resolve(this.client.user!)!.permissions.has("SEND_MESSAGES")) return message;
        if (!this.cooldowns.has(command.name)) this.cooldowns.set(command.name, new Collection());

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name)!;
        const cooldownAmount = command.cooldown * 1_000;

        if (timestamps.has(message.author.id)) {
            const expireTime = timestamps.get(message.author.id)! + cooldownAmount;

            if (now < expireTime) {
                const timeLeft = (expireTime - now) / 1_000;

                return message.reply({
                    embeds: [{ color: "#00CCFF", description: `Please wait, you can use command again in **\`${timeLeft.toFixed(1)}\`** cooldown times.` }]
                }).then(m => setTimeout(() => m.delete().catch(() => null), 5_000));
            }

            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        } else if (!this.client.config.owners.includes(message.author.id)) { timestamps.set(message.author.id, now); }

        if (message.guild && message.member && command.requiredPermissions) {
            const requiredPermissions = typeof command.requiredPermissions === "object" && command.requiredPermissions.length === 1 ? command.requiredPermissions[0] : command.requiredPermissions;
            const permissionEmbed = new MessageEmbed().setColor("#FF0000");

            if (
                message.member.id !== message.guild.ownerId &&
                !message.member.permissions.has("ADMINISTRATOR") &&
                !message.member.permissions.has(requiredPermissions) &&
                !message.member.permissionsIn(message.channel as NewsChannel | TextChannel | ThreadChannel).has(requiredPermissions)
            ) {
                permissionEmbed.setDescription(
                    `I'm sorry, but you don't have **\`${typeof requiredPermissions === "object" ? requiredPermissions.join(", ") : requiredPermissions}\`** permission for can access the commands.`
                );

                return message.reply({ embeds: [permissionEmbed] });
            }

            if (
                !message.guild.members.resolve(this.client.user!)!.permissions.has(requiredPermissions) &&
                !(message.channel as NewsChannel | TextChannel | ThreadChannel).permissionsFor(this.client.user!)!.has(requiredPermissions)
            ) {
                permissionEmbed.setDescription(
                    `I'm sorry, but I don't have **\`${typeof requiredPermissions === "object" ? requiredPermissions.join(", ") : requiredPermissions}\`** permission for can access the commands.`
                );

                return message.reply({ embeds: [permissionEmbed] });
            }
        }

        try {
            if (command.guildOnly && !message.guild) return message;
            if (command.nsfw && message.guild) {
                if (!(message.channel as NewsChannel | TextChannel).nsfw && !(message.channel instanceof ThreadChannel && message.channel.parent!.nsfw)) {
                    return message.reply({ embeds: [{ color: "#FFFF00", description: "You must be on the **`NSFW` Channel** for can access the NSFW commands." }] });
                }
            }
            if (command.ownerOnly && !this.client.config.owners.includes(message.author.id)) {
                return message.reply({ embeds: [{ color: "#FF0000", description: "I'm sorry, but you can't access the **Developers** commands." }] });
            }

            return command.exec(message, args);
        } catch (e) {
            this.client.logger.error("COMMAND_HANDLER_ERR: ", e);
        } finally {
            this.client.logger.info(
                `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} ${message.author.tag} [${message.author.id}] using command ${command.name} in ${message.guild
                    ? `${message.guild.name} [${message.guild.id}] server with ${(message.channel as NewsChannel | TextChannel | ThreadChannel).name} [${(message.channel as NewsChannel | TextChannel | ThreadChannel).id}] channels`
                    : "Direct Messages"
                }.`
            );
        }
    }

    private async import(path: string, ...args: any[]): Promise<BaseCommand | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const file = await import(resolve(path)).then(f => f[parse(path).name]);

        return file ? new file(...args) : undefined;
    }
}
