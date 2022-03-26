import "dotenv/config";
import { resolve } from "path";
import { ShardingManager } from "discord.js";
import { createLogger } from "./util/Logger";

// @ts-expect-error ignore this issues (7053)
if (process[Symbol.for("ts-node.register.instance")]) return require("./bot");

const log = createLogger("shardingManager", process.env.NODE_ENV === "development");

process.on("unhandledRejection", e => log.error("UNHANDLED_REJECTION: ", e));

process.on("uncaughtException", e => {
    log.error("UNCAUGHT_EXCEPTION: ", e);
    log.warn("Uncaught Exception is detected, restarting...");

    process.exit(1);
});

const manager = new ShardingManager(resolve(__dirname, "bot.js"), { mode: "worker" });

manager.on("shardCreate", shard => {
    shard.on("spawn", () => log.info(`[ShardingManager] Shard #${shard.id} Spawned.`) as any);
    shard.on("disconnect", () => log.warn(`[ShardingManager] Shard #${shard.id} Disconnected.`) as any);
    shard.on("reconnection", () => log.info(`[ShardingManager] Shard #${shard.id} Reconnected.`) as any);

    if (manager.shards.size === manager.totalShards) log.info("[ShardingManager] All shard are spawn has been successfully.");
});

manager.spawn().catch(e => log.error("SHARD_SPAWN_ERR: ", e));
