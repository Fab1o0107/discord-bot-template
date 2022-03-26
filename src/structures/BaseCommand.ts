import { BotClient } from "./BotClient";
import { parse, resolve } from "path";
import { Message, PermissionString, RecursiveReadonlyArray } from "discord.js";

export class BaseCommand {
    public name;
    public aliases;
    public cooldown;
    public guildOnly;
    public ownerOnly;
    public nsfw;
    public info;
    public requiredPermissions: PermissionString | RecursiveReadonlyArray<PermissionString> | null;
    public constructor(public readonly client: BotClient, meta: CommandMeta, private readonly path: string, public readonly modules: CommandModules) {
        this.name = meta.name;
        this.aliases = meta.aliases ?? [];
        this.cooldown = meta.cooldown ?? 5;
        this.guildOnly = meta.guildOnly ?? true;
        this.ownerOnly = meta.ownerOnly ?? false;
        this.nsfw = meta.nsfw ?? false;
        this.info = meta.info;
        this.requiredPermissions = meta.requiredPermissions ?? null;

        Object.defineProperties(this, {
            client: { enumerable: false, writable: false },
            path: { enumerable: false, writable: false },
            modules: { enumerable: false, writable: false }
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
    public exec(message: Message, args: string[]): any {}

    public async reload(): Promise<BaseCommand> {
        delete require.cache[require.resolve(`${this.path}`)];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const file = await import(resolve(this.path)).then(f => f[parse(this.path).name]);
        const newCommand: BaseCommand = new file(this.client, this.path, this.modules);

        this.name = newCommand.name;
        this.aliases = newCommand.aliases;
        this.cooldown = newCommand.cooldown;
        this.guildOnly = newCommand.guildOnly;
        this.ownerOnly = newCommand.ownerOnly;
        this.nsfw = newCommand.nsfw;
        this.info = newCommand.info;
        this.requiredPermissions = newCommand.requiredPermissions;
        this.exec = newCommand.exec;

        return this;
    }

    public destroy(): boolean {
        this.modules.commands = this.modules.commands.filter(cmd => cmd.name !== this.name);

        if (!this.modules.commands.length) this.modules.hide = true;

        return this.client.commandManager.commands.delete(this.name);
    }
}

export interface CommandMeta {
    name: string;
    aliases?: string[];
    cooldown?: number;
    guildOnly?: boolean;
    ownerOnly?: boolean;
    nsfw?: boolean;
    info: CommandInformation;
    requiredPermissions?: PermissionString | RecursiveReadonlyArray<PermissionString>;
}

export interface CommandInformation {
    desc: string;
    usage: string;
    example?: string;
}

export interface CommandModules {
    name: string;
    commands: BaseCommand[];
    path: string;
    hide?: boolean;
}
