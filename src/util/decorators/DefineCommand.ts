import { BaseCommand, CommandMeta, CommandModules } from "../../structures/BaseCommand";
import { BotClient } from "../../structures/BotClient";

export function DefineCommand(meta: CommandMeta): any {
    return function decorate<T extends BaseCommand>(target: new (...args: any[]) => T): new (client: BotClient, path: string, modules: CommandModules) => T {
        return new Proxy(target, { construct: (ctx, [client, path, modules]): T => new ctx(client, meta, path, modules) });
    };
}
