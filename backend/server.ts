import * as tf from "@tensorflow/tfjs-node";
import * as path from "path";
import * as express from "express";
import * as socketio from "socket.io";
import * as http from "http";
import * as fs from "fs";
import * as utils from "./utils";
import { createLogger, format, transports } from "winston";
const PORT = 3002;
const logger = createLogger({
	level: "info",
	format: format.combine(
		format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss"
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json()
	),
	defaultMeta: { service: "AI-PolynomialRegression" },
	transports: [
		//
		// - Write to all logs with level `info` and below to `quick-start-combined.log`.
		// - Write all logs error (and below) to `quick-start-error.log`.
		//
		new transports.File({
			filename: "logs/ai-polynomialregression-error.log",
			level: "error"
		}),
		new transports.File({ filename: "logs/ai-polynomialregression-combined.log" })
	]
});

const initializeServer = async () => {
	const app = express();
	const server = http.createServer(app);
	const io = socketio(server);
	let onlineSessions: string[] = [];

	setInterval(() => {
		io.emit("onlineCount", onlineSessions.length);
	}, 60e3);

	app.get("*.ts", (req, res) => {
		utils.sendOpenSourcePage(req, res);
	});

	app.get("/node_modules*", (req, res) => {
		utils.sendOpenSourcePage(req, res);
	});

	app.get("/", (req, res) => {
		res.sendFile(path.join(__dirname, "..", "client", "index.html"));
	});

	app.get("*", (req, res) => {
		const filePath = path.join(__dirname, "..", "client", req.path);
		fs.exists(filePath, exists => {
			if (exists) res.sendFile(filePath);
			else utils.error404(req, res);
		});
	});

	server.listen(PORT, async () => {
		console.log(`Started listening on *:${PORT}`);
		logger.info(`Started listening on *:${PORT}`);
	});

	io.on("connection", socket => {
		if (!onlineSessions.includes(socket.id)) onlineSessions.push(socket.id);

		socket.emit("initialize", `Hello #${socket.id}`);
		socket.emit("onlineCount", onlineSessions.length);

		socket.on("disconnect", () => {
			onlineSessions = onlineSessions.filter(val => val !== socket.id);
		});
	});
};

console.log("Starting to initialize server.");
logger.info("Starting to initialize server.");
initializeServer();
