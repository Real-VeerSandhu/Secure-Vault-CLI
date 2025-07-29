"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("./cli");
async function main() {
    const cli = new cli_1.CLI();
    await cli.start();
}
main().catch(console.error);
