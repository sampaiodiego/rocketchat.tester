import RocketChat from './rocketchat';

function go() {
	const client = new RocketChat();
	client.on('started', () => {
		client.resumeLogin('Xn3HTQZQH2e_ezVyggv9Ea5GYHsUo-8keDxbZywu695');
		// client.disconnect();
		// setTimeout(() => client.disconnect(), 8)
		// .then(() => {
		// 	console.log('logged in');
		// });
		// client.registerUser()
		// 	.then(() => client.sendPublic(1))
	});
}

go();
// setInterval(go, 200);

function exitHandler() {
	// console.log(JSON.stringify(client.metrics, null, 2));
}

process.on('exit', exitHandler.bind(null, {cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
