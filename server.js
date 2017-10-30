const snoowrap = require("snoowrap");
const websocket = require("ws");
const _ = require("lodash");

const SOCKET_SERVER = process.env.SOCKET_SERVER || "ws://192.168.1.65:3210";
const SUB_BLACKLIST = new Set(require("./blacklist.js").map(x => x.toLowerCase()));

const r = new snoowrap({
	user_agent: 'server:com.andrewsun.hugbot:v0.1 (by /u/as-com)',
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	username: 'hug-bot',
	password: process.env.REDDIT_PASSWORD
});

r.config({
	request_delay: 1010,
	continue_after_ratelimit_error: true,
	retry_error_codes: [500, 502, 503, 504, 522, 521, 520, 524, 523],
	max_retry_attempts: 5
});

let ws, ws_posts;

function connect() {
	ws = new websocket(SOCKET_SERVER);
	ws.on("open", function () {
		console.log("Connected!");
		ws.send(JSON.stringify({
			"channel": "comments",
			"include": {
				"contains": "^ugh",
				// subreddit: ["test"]
			},
			"exclude": {
				author: ["fast-parenthesis-bot", "hug-bot", "Ryugi"],
				// subreddit: SUB_BLACKLIST
			}
		}));
		console.log("Sent subscription");
	});
	ws.on("message", function (data) {
		// console.log("Got comment " + model.id);
		let model = JSON.parse(data);
		processThing(model, model.body, model.id, model.name, model.subreddit);
	});
	ws.on("close", function (data) {
		console.warn("Connection closed!");
		connect(); // reconnect
	});

}

connect();

// connectPosts();

function postReply(thing_id, text) {
	r.oauth_request({
		uri: "/api/comment",
		method: "POST",
		form: {
			text:
				`${text}

---
I'm a bot, and I like to give hugs. [source](https://github.com/as-com/reddit-hug-bot) | [contact](https://www.reddit.com/message/compose/?to=as-com)`,
			thing_id
		}
	}).then(console.log).catch(console.error);
}

function processThing(model, body, id, fullname, subreddit) {
	console.log("Processing https://www.reddit.com" + model.permalink);

	if (SUB_BLACKLIST.has(subreddit.toLowerCase())) {
		console.log("Subreddit blacklisted");
		return;
	}

	if (/^.serious/i.test(model.link_title)) {
		console.log("Excluding serious");
		return;
	}

	if (!/^ugh.{0,20}/.test(model.body)) {
		console.log("Comment too long.");
		return;
	}

	if (Math.random() > 0.5) {
		console.log("Randomly not commenting");
		return;
	}

	postReply(fullname, `Perhaps you misspelled "hug." Would you like one? 🤗`);
}


