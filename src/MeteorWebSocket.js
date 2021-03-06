// import crypto from 'crypto';
import EventEmitter from 'events';

import EJSON from 'ejson';
import WebSocket from 'ws';
import randomstring from 'randomstring';

import TimedPromise from './timedpromise';

export default class MeteorWebSocket extends EventEmitter {
	constructor(url) {
		super();

		this.ws = new WebSocket(`${ url || 'ws://localhost:3000' }/websocket`);

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
			subscriptions: [],
		};

		this.debug = process.env.DEBUG === 'true';
	}

	log(...args) {
		this.debug && console.log(`[${ this.id }]`, ...args);
	}

	close() {
		return this.ws.close();
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
			this._calledMethods[msg.id] = new TimedPromise(msg.method);
			return this._calledMethods[msg.id];
		}
		if (msg.msg === 'sub') {
			this._subs[msg.id] = new TimedPromise(msg.name);
			return this._subs[msg.id];
		}
		return Promise.resolve();
	}

	sendPing() {
		if (this.pingInterval) {
			clearTimeout(this.pingInterval);
		}
		this.pingInterval = setTimeout(() => this.send({ msg: 'ping' }), 15000);
	}

	parseMessage(rawData) {
		this.log('msg <-', rawData);
		const data = EJSON.parse(rawData);

		this.sendPing();

		switch (data.msg) {
			case 'ping':
				// console.log('ping!');
				this.send({ msg: 'pong' });

				break;

			case 'result':
				if (this._calledMethods[data.id]) {
					if (!data.error) {
						this._calledMethods[data.id].resolve(data.result);
					} else {
						this._calledMethods[data.id].reject(data.error);
					}
					this.metrics.methods.push({ name: this._calledMethods[data.id].name, time: this._calledMethods[data.id].elapsedTime() });
					delete this._calledMethods[data.id];
				}
				break;

			case 'changed':
				this.ws.emit(data.collection, data.fields);
				break;

			case 'ready':
				data.subs.forEach((id) => {
					if (this._subs[id]) {
						if (!data.error) {
							this._subs[id].resolve();
						} else {
							this._subs[id].reject();
						}
						this.metrics.subscriptions.push({ name: this._subs[id].name, time: this._subs[id].elapsedTime() });
						delete this._subs[id];
					}
				});
				break;
		}
	}
}

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at:', p, 'reason:', reason);
	// application specific logging, throwing an error, or other logic here
});
