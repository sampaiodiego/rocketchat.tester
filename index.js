import RocketChat from './rocketchat';

const client = new RocketChat(null);

client.oncePing = function() {
	this.registerUser();
}
