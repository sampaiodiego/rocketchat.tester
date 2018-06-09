import RocketChat from './rocketchat';

const client = new RocketChat();
client.on('started', () => {
	client.registerUser();
});

function exitHandler() {
	console.log(JSON.stringify(client.metrics, null, 2));
}

process.on('exit', exitHandler.bind(null, {cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
