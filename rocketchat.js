import crypto from 'crypto';
import randomstring from 'randomstring';
import random_name from 'node-random-name';

import MeteorWebSocket from './MeteorWebSocket';
import { waitFor } from './utils';

export default class RocketChat extends MeteorWebSocket {
	constructor({id, url} = {}) {
		super(url);

		this.id = id || randomstring.generate(5);

		this.ws.on('open', () => {
			this.startup();
		});

		this._userId;
	}

	startup() {
		this.send({'msg':'connect', 'version':'1', 'support':['1', 'pre2', 'pre1']});
		this.send({'msg':'method', 'method':'autoTranslate.getSupportedLanguages', 'params':['en']}).catch(() => {});
		this.send({'msg':'method', 'method':'listCustomSounds', 'params':[]});
		this.send({'msg':'method', 'method':'listEmojiCustom', 'params':[]});
		this.send({'msg':'method', 'method':'apps/is-enabled', 'params':[]})
			.then(() => this.appsSubscribe());
		this.send({'msg':'method', 'method':'public-settings/get', 'params':[]});
		this.send({'msg':'method', 'method':'permissions/get', 'params':[]});
		this.send({'msg':'sub', 'name':'meteor.loginServiceConfiguration', 'params':[]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':['null/subscriptions-changed', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'roles', 'params':[]});
		this.send({'msg':'sub', 'name':'stream-importers', 'params':['progress', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'meteor_autoupdate_clientVersions', 'params':[]});
		this.send({'msg':'sub', 'name':'stream-notify-all', 'params':['updateCustomSound', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-all', 'params':['deleteCustomSound', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'activeUsers', 'params':[]});
		this.send({'msg':'sub', 'name':'userData', 'params':[]});
		this.send({'msg':'sub', 'name':'stream-notify-all', 'params':['public-settings-changed', {'useCollection':false, 'args':[]}]})
			.then((...args) => this.emit('started'));
	}

	appsSubscribe() {
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['app/added', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['app/removed', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['app/updated', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['app/statusUpdate', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['app/settingUpdated', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['command/added', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['command/disabled', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['command/updated', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-apps', 'params':['command/removed', {'useCollection':false, 'args':[]}]});
	}

	login(user, password) {
		return this.send({'msg':'method', 'method':'login', 'params':[{user, 'password':{'digest':crypto.createHash('sha256').update(password, 'utf8').digest('hex'), 'algorithm':'sha-256'}}]})
			.then(({ id }) => this.loggedInSubscribe(id));
	}

	loggedInSubscribe(id) {
		this._userId = id;
		this.send({'msg':'sub', 'name':'stream-notify-logged', 'params':['Users:NameChanged', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-logged', 'params':['updateEmojiCustom', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-logged', 'params':['deleteEmojiCustom', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-logged', 'params':['updateAvatar', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-logged', 'params':['permissions-changed', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'userData', 'params':[]});
		this.send({'msg':'sub', 'name':'activeUsers', 'params':[]});
		this.send({'msg':'method', 'method':'getUserRoles', 'params':[]});
		this.send({'msg':'sub', 'name':'stream-notify-logged', 'params':['roles-change', {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':[`${ id }/message`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':[`${ id }/otr`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':[`${ id }/webrtc`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':[`${ id }/notification`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':[`${ id }/audioNotification`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':[`${ id }/subscriptions-changed`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-user', 'params':[`${ id }/rooms-changed`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'method', 'method':'subscriptions/get', 'params':[]});
		this.send({'msg':'method', 'method':'rooms/get', 'params':[]})
			.then(([ room ]) => room && this.openRoom(room._id));
	}

	registerUser() {
		const name = random_name();
		const pass = randomstring.generate();
		const email = `${ randomstring.generate() }@${ pass }.com`;

		this.send({'msg':'method', 'method':'registerUser', 'params':[{name, email, pass, 'confirm-pass':pass}]})
			.then(() => this.login({ email }, pass))
			.then(() => this.send({'msg':'method', 'method':'getUsernameSuggestion', 'params':[]}))
			.then((suggestion) => {
				this._username = suggestion;
				this.send({'msg':'method', 'method':'setUsername', 'params':[suggestion]});
			})
			.then(() => this.openRoom('GENERAL')); // TODO: this should not be hardcoded
	}

	openRoom(rid) {
		this.send({'msg':'method', 'method':'loadHistory', 'params':[rid, null, 50, new Date()]})
			.then(() => this.send({'msg':'method', 'method':'readMessages', 'params':[rid]}));
		this.send({'msg':'method', 'method':'getRoomRoles', 'params':[rid]});
		this.send({'msg':'sub', 'name':'stream-room-messages', 'params':[rid, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-room', 'params':[`${ rid }/deleteMessage`, {'useCollection':false, 'args':[]}]});
		this.send({'msg':'sub', 'name':'stream-notify-room', 'params':[`${ rid }/typing`, {'useCollection':false, 'args':[]}]});

		this.ws.on('stream-room-messages', (event) => {
			if (event.eventName !== rid) {
				return;
			}

			const [data] = event.args;

			if (this._userId !== data.u._id) {
				this.send({'msg':'method', 'method':'readMessages', 'params':[rid]});
			}

			if (data.msg.indexOf(`@${ this._username }`) !== -1 || /@(all|here)/.test(data.msg)) {
				this.sendMessage(rid, `hi there @${ data.u.username }`);
			}
		});
	}

	async sendMessage(rid, msg) {
		this.send({'msg':'method', 'method':'stream-notify-room', 'params':[`${ rid }/typing`, this._username, true]});

		await waitFor(Math.max(1500, Math.random() * 5 * 1000));

		this.send({'msg':'method', 'method':'stream-notify-room', 'params':[`${ rid }/typing`, this._username, false]});
		return this.send({'msg':'method', 'method':'sendMessage', 'params':[{'_id':randomstring.generate(17), rid, msg}]});
	}
}
