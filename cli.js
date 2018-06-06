import RocketChat from './rocketchat';
const inquirer = require('inquirer');
import { waitFor } from './utils';
const clients = [];
let url;
const connect = (a) => {
	for (let index = 0; index < a; index++) {
		const client = new RocketChat({ url });
		client.oncePing = function() {
			this.registerUser();
		};
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
const users = async() => {
	const answers = await inquirer.prompt([
		{
			type: 'list',
			name: 'action',
			message: 'What do you want?',
			choices: ['Connect', 'Disconnect', 'Message'],
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
			await message(n);
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
