// import crypto from 'crypto';
import EJSON from 'ejson';
import WebSocket from 'faye-websocket';
import randomstring from 'randomstring';

import TimedPromise from './timedpromise';

export default class MeteorWebSocket {
	constructor() {
		this.ws = new WebSocket.Client(`${ process.env.WS_URL || 'ws://localhost:3000' }/websocket`);

		this.ws.on('open', () => {
			this.log('open');
		});

		this.ws.on('message', this.parseMessage.bind(this));

		this.ws.on('close', (event) => {
			this.log('close', event.code, event.reason);
			this.ws = null;
		});

		this._methodCounter = 0;
		this._calledMethods = {};

		this._subs = {};

		this.metrics = {
			methods: [],
			subscriptions: []
		};

		this.debug = false;
	}

	log(...args) {
		this.debug && console.log(`[${ this.id }]`, ...args);
	}

	send(msg) {
		if (msg.msg === 'method') {
			msg.id = (++this._methodCounter).toString();
		} else if (msg.msg === 'sub') {
			msg.id = randomstring.generate(17);
		}

		const str = EJSON.stringify(msg);
		this.ws.send(str);
		this.log('msg ->', str);

		if (msg.msg === 'method') {
			return this._calledMethods[msg.id] = new TimedPromise(msg.method);
		} else if (msg.msg === 'sub') {
			return this._subs[msg.id] = new TimedPromise(msg.name);
		}
	}

	parseMessage(event) {
		this.log('msg <-', event.data);
		const data = EJSON.parse(event.data);

		switch (data.msg) {
			// case 'connected':
			// 	if (this.oncePing) {
			// 		this.oncePing.call(this);
			// 		delete this.oncePing;
			// 	}
			// 	return;

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
					this.metrics.methods.push({ name: this._calledMethods[data.id].name, time: this._calledMethods[data.id].elapsedTime() });
					delete this._calledMethods[data.id];
					return;
				}
				break;

			case 'changed':
				this.ws.emit(data.collection, data.fields);
				return;

			case 'ready':
				data.subs.forEach((id) => {
					if (this._subs[id]) {
						this.metrics.subscriptions.push({ name: this._subs[id].name, time: this._subs[id].elapsedTime() });
						delete this._subs[id];
					}
				});
				return;
		}
	}
}
