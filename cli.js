import RocketChat from './rocketchat';

const inquirer = require('inquirer');
import { waitFor } from './utils';
const clients = [];
let url;

const connect = (a) => {
	for (let index = 0; index < a; index++) {
		const client = new RocketChat({ url });
		client.on('started', function() {
			this.registerUser();
		});
		clients.push(client);
	}
	console.log('connected');

	return true;
};

const writeMessage = async() => {
	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'message',
			default: 'hi rocketchat',
			message: 'write your message'
		}
	]);
	return answers.message;
};

const writeUrl = async() => {
	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'message',
			default: 'ws://localhost:3000',
			message: 'write your server'
		}
	]);
	return answers.message;
};

const message = async(n) => {
	const m = await writeMessage();
	for (let index = 0; index < n; index++) {
		const element = clients[index % clients.length];
		element.sendMessage('GENERAL', m);
		await waitFor(1);
	}
};

let dmInterval = 1000;
let dmTimer = null;
const sendDM = () => {
	if (!dmInterval) {
		return;
	}
	dmTimer = setTimeout(async() => {
		for (let index = 0; index < clients.length; index++) {
			const cli1 = clients[index % clients.length];
			const cli2 = clients[(index + 1) % clients.length];
			cli1.sendDM(cli2);
		}
		sendDM();
	}, dmInterval);
};

const howMany = async() => {
	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'number',
			message: 'how many?',
			validate(value) {
				const pass = value.match(
					/^[0-9]+]?$/i
				);
				if (pass) {
					return true;
				}
				return 'Please enter a valid number';
			}
		}
	]);
	return answers.number;
};

const howMuchInterval = async() => {
	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'number',
			message: 'set the interval',
			default: 0,
			validate(value) {
				const pass = value.match(
					/^[0-9]+]?$/i
				);
				if (pass) {
					return true;
				}
				return 'Please enter a valid number';
			}
		}
	]);
	return answers.number;
};
const dm = async() => {
	dmInterval = await howMuchInterval();
	if (dmTimer) {
		clearTimeout(dmTimer);
	}
	sendDM();
};
const users = async() => {
	const answers = await inquirer.prompt([
		{
			type: 'list',
			name: 'action',
			message: 'What do you want?',
			choices: ['Connect', 'Disconnect', 'Message', 'Dm'],
			filter(val) {
				return val.toLowerCase();
			}
		}
	]);
	let n;
	switch (answers.action) {
		case 'connect':
			n = await howMany();
			return connect(n);
		case 'disconnect':
			n = await howMany();
			return connect(n);
		case 'message':
			n = await howMany();
			return await message(n);
		case 'dm':
			await dm();
	}
};

(async() => {
	url = await writeUrl();
	while (true) { // eslint-disable-line no-constant-condition
		const answers = await inquirer.prompt([{
			type: 'list',
			name: 'action',
			message: 'What do you want?',
			choices: ['Users', 'Status'],
			filter(val) {
				return val.toLowerCase();
			}
		}]);
		switch (answers.action) {
			case 'users':
				await users();
		}
	}
})();
