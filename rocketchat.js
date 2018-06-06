import crypto from 'crypto';
import EJSON from 'ejson';
import WebSocket from 'faye-websocket';
import randomstring from 'randomstring';
import random_name from 'node-random-name';

import Method from './method';

import { waitFor } from './utils';

export default class RocketChat {
	constructor(id) {
		this.id = id || randomstring.generate(5);

		this.ws = new WebSocket.Client(`${ process.env.WS_URL || 'ws://localhost:3000' }/websocket`);

		this.ws.on('open', (event) => {
			this.log('open');
			this.startup();
		});

		this.ws.on('message', this.parseMessage.bind(this));

		this.ws.on('close', (event) => {
			this.log('close', event.code, event.reason);
			this.ws = null;
		});

		this._userId;

		this._methodCounter = 0;
		this._calledMethods = {};
	}

	log(...args) {
		// console.log(`[${ this.id }]`, ...args);
	}

	send(msg) {
		if (msg.method) {
			msg.id = (++this._methodCounter).toString();
		}

		const str = EJSON.stringify(msg);
		this.ws.send(str);
		this.log('msg ->', str);

		if (msg.method) {
			return this._calledMethods[msg.id] = new Method();
		}
	}

	parseMessage(event) {
		this.log('msg <-',event.data);
		const data = EJSON.parse(event.data);

		switch (data.msg) {
			case 'connected':
			if (this.oncePing) {
					this.oncePing.call(this);
					delete this.oncePing;
				}
				return;
			case 'ping':
				this.send({ msg: 'pong' });

				if (this.oncePing) {
					this.oncePing.call(this);
					delete this.oncePing;
				}

				return;

			case 'result':
				if (this._calledMethods[data.id]) {
					if (!data.error) {
						this._calledMethods[data.id].resolve(data.result);
					} else {
						this._calledMethods[data.id].reject(data.error);
					}
					delete this._calledMethods[data.id];
					return;
				}

			case 'changed':
				this.ws.emit(data.collection, data.fields);
				return;
		}
	}

	startup() {
		this.send({"msg":"connect","version":"1","support":["1","pre2","pre1"]});
		this.send({"msg":"method","method":"autoTranslate.getSupportedLanguages","params":["en"]});
		this.send({"msg":"method","method":"listCustomSounds","params":[]});
		this.send({"msg":"method","method":"listEmojiCustom","params":[]});
		this.send({"msg":"method","method":"apps/is-enabled","params":[]})
			.then(() => this.appsSubscribe());
		this.send({"msg":"method","method":"public-settings/get","params":[]});
		this.send({"msg":"method","method":"permissions/get","params":[]});
		this.send({"msg":"sub","id":"iBFKdqx3cMypttPfY","name":"meteor.loginServiceConfiguration","params":[]});
		this.send({"msg":"sub","id":"jcyK668fxQefkGdHg","name":"stream-notify-user","params":["null/subscriptions-changed",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"kaixDtmXB2QunpWhx","name":"roles","params":[]});
		this.send({"msg":"sub","id":"Wu6RexGMDWjhC59Z3","name":"stream-importers","params":["progress",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"ZrutCB6mkfMGYpzgi","name":"meteor_autoupdate_clientVersions","params":[]});
		this.send({"msg":"sub","id":"vha6LJ4gW4eCQ7zfi","name":"stream-notify-all","params":["updateCustomSound",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"n3LJPwwN3CXdwWWFE","name":"stream-notify-all","params":["deleteCustomSound",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"u5jo5spDYu3MmKTcN","name":"activeUsers","params":[]});
		this.send({"msg":"sub","id":"qFYNtt39s84s4bYRY","name":"userData","params":[]});
		this.send({"msg":"sub","id":"af7rPLuCwFF5g7r3b","name":"stream-notify-all","params":["public-settings-changed",{"useCollection":false,"args":[]}]});
	}

	appsSubscribe() {
		this.send({"msg":"sub","id":"YBeYeJkWXg957jcBo","name":"stream-apps","params":["app/added",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"QWaSjEhbCdk5dH2PD","name":"stream-apps","params":["app/removed",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"BgqFEgZDzApEPLqhd","name":"stream-apps","params":["app/updated",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"4Xr4d7bRu9795J8KT","name":"stream-apps","params":["app/statusUpdate",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"jmteZ8PNWDr2XvGss","name":"stream-apps","params":["app/settingUpdated",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"4CjaHgYb7f6hKb8ZE","name":"stream-apps","params":["command/added",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"MBPuzy68tsz2kez5w","name":"stream-apps","params":["command/disabled",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"HPSWNQxZMFrey7fQp","name":"stream-apps","params":["command/updated",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"FcERMppDEfjRwtPMB","name":"stream-apps","params":["command/removed",{"useCollection":false,"args":[]}]});
	}

	login(user, password) {
		return this.send({"msg":"method","method":"login","params":[{user,"password":{"digest":crypto.createHash('sha256').update(password, 'utf8').digest('hex'),"algorithm":"sha-256"}}]})
			.then(({ id }) => this.loggedInSubscribe(id));
	}

	loggedInSubscribe(id) {
		this._userId = id;
		this.send({"msg":"sub","id":"uxwugDrEmTgLFDov2","name":"stream-notify-logged","params":["Users:NameChanged",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"EF9eytMeqSRFPHKLq","name":"stream-notify-logged","params":["updateEmojiCustom",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"Gd68zHFsAFWuisPjH","name":"stream-notify-logged","params":["deleteEmojiCustom",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"x6YHZmyPJYTiZ2xP2","name":"stream-notify-logged","params":["updateAvatar",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"jzN2RHLu5jrE9gDKS","name":"stream-notify-logged","params":["permissions-changed",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"xpCRbEvpij6CXfF6F","name":"userData","params":[]});
		this.send({"msg":"sub","id":"wovhmt4hLbkAkqMwZ","name":"activeUsers","params":[]});
		this.send({"msg":"method","method":"getUserRoles","params":[]});
		this.send({"msg":"sub","id":"Ny8jbMgzTrutQd8PD","name":"stream-notify-logged","params":["roles-change",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"WLvfzdaCayZJWCfTL","name":"stream-notify-user","params":[id + "/message",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"df3nzH4XFoSreuSBq","name":"stream-notify-user","params":[id + "/otr",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"NEwALAgCZcBqtDq6J","name":"stream-notify-user","params":[id + "/webrtc",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"kvEWLRyXhvo3eri7h","name":"stream-notify-user","params":[id + "/notification",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"boKnuE7ZnNk2deby6","name":"stream-notify-user","params":[id + "/audioNotification",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"dw5X7q9pMcExZE5LR","name":"stream-notify-user","params":[id + "/subscriptions-changed",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"3PKQ8tPeNKFLtjZQM","name":"stream-notify-user","params":[id + "/rooms-changed",{"useCollection":false,"args":[]}]});
		this.send({"msg":"method","method":"subscriptions/get","params":[]});
		this.send({"msg":"method","method":"rooms/get","params":[]})
			.then(([ room ]) => room && this.openRoom(room._id));
	}

	registerUser() {
		const name = random_name();
		const pass = randomstring.generate();
		const email = `${ randomstring.generate() }@${ pass }.com`;

		this.send({"msg":"method","method":"registerUser","params":[{name,email,pass,"confirm-pass":pass}]})
			.then(() => this.login({ email }, pass))
			.then(() => this.send({"msg":"method","method":"getUsernameSuggestion","params":[]}))
			.then((suggestion) => {
				this._username = suggestion;
				this.send({"msg":"method","method":"setUsername","params":[suggestion]});
			})
			.then(() => this.openRoom('GENERAL')); // TODO: this should not be hardcoded
	}

	openRoom(rid) {
		this.send({"msg":"method","method":"loadHistory","params":[rid,null,50,new Date()]})
			.then(() => this.send({"msg":"method","method":"readMessages","params":[rid]}));
		this.send({"msg":"method","method":"getRoomRoles","params":[rid]});
		this.send({"msg":"sub","id":"C5SyCJBsKz2Ffbwvp","name":"stream-room-messages","params":[rid,{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"nFLWdC8QRB6mKahZe","name":"stream-notify-room","params":[rid + "/deleteMessage",{"useCollection":false,"args":[]}]});
		this.send({"msg":"sub","id":"c2R7sGCEKuJRaa9Yg","name":"stream-notify-room","params":[rid + "/typing",{"useCollection":false,"args":[]}]});

		this.ws.on('stream-room-messages', (event) => {
			if (event.eventName !== rid) {
				return;
			}

			const [data] = event.args;

			if (this._userId !== data.u._id) {
				this.send({"msg":"method","method":"readMessages","params":[rid]});
			}

			if (data.msg.indexOf(`@${ this._username }`) !== -1 || /@(all|here)/.test(data.msg)) {
				this.sendMessage(rid, `hi there @${ data.u.username }`);
			}
		});
	}

	async sendMessage(rid, msg) {
		this.send({"msg":"method","method":"stream-notify-room","params":[rid + "/typing",this._username,true]});

		await waitFor(Math.max(1500, Math.random() * 5 * 1000));

		this.send({"msg":"method","method":"stream-notify-room","params":[rid + "/typing",this._username,false]});
		return this.send({"msg":"method","method":"sendMessage","params":[{"_id":randomstring.generate(17),rid, msg}]});
	}
}
