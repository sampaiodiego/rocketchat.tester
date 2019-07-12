import RocketChat from './rocketchat';
const url = 'ws://localhost:3000';

const createuser = () => new Promise((resolve, reject) => {
	const client = new RocketChat({ url });
	client.on('started', async function() {
		console.log('started');
		await client.registerUser();
		console.log('started done');
	});
	client.on('logged', () => {
		resolve(client);
	});
});


const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

class Action {
	async before() {
		console.log('action before');
		this.client = await createuser();
		console.log('done');
	}
	async action() {
		return this.client.sendMessage('GENERAL');
	}
	async after() {

	}
}

class Runner {
	async run(size) {
		console.log('aeo');
		this.actions = [];
		for (let index = 0; index < size; index++) {
			this.actions.push(new Action());
		}
		console.log('hello');
		const init = new Date();
		await this.before();
		const finish = new Date();
		console.log('before', (finish.getTime() - init.getTime()) / 1000);
		await delay(2500);
		this.actions.forEach(async(action) => {
			for (let index = 0; index < 1000; index++) {
				const init = new Date();
				await action.action();
				const finish = new Date();
				console.log('action', (finish.getTime() - init.getTime()) / 1000);
				await delay(2000);
			}
		});
	}
	async before() {
		for (let index = 0; index < this.actions.length; index++) {
			const init = new Date();
			const action = this.actions[index];
			await action.before();
			const finish = new Date();
			console.log('before', (finish.getTime() - init.getTime()) / 1000);
		}
	}
}

const r = new Runner();
(async() => {
	await r.run(2);
})();
// (async()=> {
// 	// await (async() => {
// 	// 	const start = new Date();
// 	// 	console.log('\nconnecting 1 user');
// 	// 	await createuser();
// 	// 	const end = new Date() - start;
// 	// 	console.info('Execution time: %dms', end);
// 	// })();
// 	// await (async() => {
// 	// 	const start = new Date();
// 	// 	console.log('\nconnecting 10 users');
// 	// 	let counter = 0;
// 	// 	while (counter < 10) {
// 	// 		try {
// 	// 			await createuser();
// 	// 			counter++;
// 	// 		} catch (e) {
// 	// 			console.log(e);
// 	// 		}
// 	// 	}
// 	// 	const end = new Date() - start;
// 	// 	console.info('Execution time: %dms', end);
// 	// 	console.info('Execution average: %dms', end / counter);
// 	// })();
// 	// await (async() => {
// 	// 	const start = new Date();
// 	// 	console.log('\nconnecting 100 users');
// 	// 	let counter = 0;
// 	// 	while (counter < 100) {
// 	// 		try {
// 	// 			await createuser();
// 	// 			counter++;
// 	// 		} catch (e) {
// 	// 			console.log(e);
// 	// 		}
// 	// 	}
// 	// 	const end = new Date() - start;
// 	// 	console.info('Execution time: %dms', end);
// 	// 	console.info('Execution average: %dms', end / counter);

// 	// })();

// 	// await (async() => {
// 	// 	const start = new Date();
// 	// 	console.log('\nconnecting 200 users');
// 	// 	let counter = 0;
// 	// 	while (counter < 200) {
// 	// 		try {
// 	// 			await createuser();
// 	// 			counter++;
// 	// 		} catch (e) {
// 	// 			console.log(e);
// 	// 		}
// 	// 	}
// 	// 	const end = new Date() - start;
// 	// 	console.info('Execution time: %dms', end);
// 	// 	console.info('Execution average: %dms', end / counter);
// 	// })();



// 	await(async() => {
// 		const clients = [];
// 		const clientSendMessage = async client => {
// 			const start = new Date();
// 			let count = 0;
// 			await client.openGeneral();
// 			while (new Date() - start < 60000) {
// 				await client.sendMessage('GENERAL');
// 				count++;
// 			}
// 			return count;
// 		};
// 		const createAndSend = async(limit = 1, users = []) => {
// 			const start = new Date();
// 			console.log(`\nconnecting ${ limit } users`);
// 			while (users.length < limit) {
// 				try {
// 					users.push(await createuser());
// 				} catch (e) {
// 					console.log(e);
// 				}
// 			}
// 			const end = new Date() - start;
// 			console.info('Execution time: %dms', end);
// 			console.info('Execution average: %dms', end / users.length);
// 			const result = await Promise.all(users.map(clientSendMessage));
// 			const total = result.reduce((r, a) => r + a);
// 			console.log('total', total, 'average', total / limit);
// 		};
// 		// await createAndSend(1, clients);
// 		await createAndSend(10, clients);
// 		await createAndSend(15, clients);
// 		await createAndSend(25, clients);
// 		await createAndSend(50, clients);
// 		await createAndSend(75, clients);
// 		await createAndSend(100, clients);
// 		await createAndSend(200, clients);
// 		await createAndSend(400, clients);
// 	})();



// })();
