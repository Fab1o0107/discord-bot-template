import "dotenv/config";
import { BotClient } from "./structures/BotClient";

const client = new BotClient();

process.on("unhandledRejection", e => client.logger.error("UNHANDLED_REJECTION: ", e));

process.on("uncaughtException", e => {
    client.logger.error("UNCAUGHT_EXCEPTION: ", e);
    client.logger.warn("Uncaught Exception is detected, restarting...");

    process.exit(1);
});

client.build().catch(e => client.logger.error("CLIENT_BUILD_ERR: ", e));
