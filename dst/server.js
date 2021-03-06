"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const ws_1 = __importDefault(require("ws"));
const WebSocketAPI_1 = require("./WebSocketAPI");
class ZeebeAffinityServer {
    constructor(port = 8089, options) {
        this.workers = [];
        this.clients = [];
        this.port = port;
        this.options = options || {};
    }
    listen() {
        this.wss = new ws_1.default.Server({
            port: this.port,
            perMessageDeflate: false
        });
        // TODO Handle connection failure and remove both clients and workers when they go away
        this.wss.on("connection", ws => {
            ws.on("message", message => {
                const msg = JSON.parse(message.toString());
                switch (msg.type) {
                    case WebSocketAPI_1.AffinityAPIMessageType.REGISTER_CLIENT:
                        this.clients.push(ws);
                        break;
                    case WebSocketAPI_1.AffinityAPIMessageType.REGISTER_WORKER:
                        this.workers.push(ws);
                        break;
                    case WebSocketAPI_1.AffinityAPIMessageType.WORKFLOW_OUTCOME:
                        WebSocketAPI_1.broadcastWorkflowOutcome(this.clients, msg);
                        break;
                }
            });
        });
    }
    outputStats() {
        console.log(dayjs_1.default().format("{YYYY} MM-DDTHH:mm:ss SSS [Z] A")); // display
        console.log(`Worker count: ${this.workers.length}`);
        console.log(`Client count: ${this.clients.length}`);
        console.log(`CPU:`, process.cpuUsage());
        console.log(`Memory used:`, process.memoryUsage());
    }
}
exports.ZeebeAffinityServer = ZeebeAffinityServer;
/**
 * Client connects.
 * When it registers as a client (interest in workflow outcomes)
 * When a worker communicates a workflow outcome, we broadcast the workflow to all clients. They are responsible for determining
 * whether or not the workflow outcome is of interest to them.
 *
 * We could manage that in the server, with subscriptions for specific outcomes. However, this would multiple the roundtrips and the
 * CPU and memory usage of the server.
 */
