import RocketChat from '../rocketchat';
import { waitFor } from '../utils';

let url;

export const clients = [];

export const connect = async(connectURL, qt) => {
	url = connectURL;

	const connections = [];
	for (let index = 0; index < qt; index++) {
		connections.push(new Promise((resolve, reject) => {
			try {
				console.log('index ->', index);
				const client = new RocketChat({ url });
				client.on('started', function() {
					console.log('started ->', index);
					this.registerUser().then(() => {
						console.log('registered');
						resolve();
					});
				});
				clients.push(client);
			} catch (r) {
				console.log('error ->', index);
				reject(r);
			}
		}));
		waitFor(200);
	}

	await Promise.all(connections);

	console.log('connected');

	return true;
};

const sendBatch = async(timer, interval, qtRoom, cb) => {
	if (!interval || !qtRoom) {
		return;
	}
	timer = setTimeout(async() => {
		for (let index = 0; index < clients.length; index++) {
			const dm = index % qtRoom;
			await cb(index, dm);
		}
		sendBatch(interval, qtRoom, cb);
	}, interval);
};

let publicTimer = null;
export const sendPublic = (publicInterval = 1000, publicRooms = 0) => {
	if (publicTimer) {
		clearTimeout(publicTimer);
		publicTimer = null;
	}
	sendBatch(publicTimer, publicInterval, publicRooms, async(index, dm) => {
		const cli = clients[index];
		return cli.sendPublic(dm);
	});
};

// let dmInterval = 1000;
// let dmTimer = null;
// export const sendDM = () => {
// 	if (!dmInterval) {
// 		return;
// 	}
// 	dmTimer = setTimeout(async() => {
// 		for (let index = 0; index < clients.length; index++) {
// 			const cli1 = clients[index % clients.length];
// 			const cli2 = clients[(index + 1) % clients.length];
// 			cli1.sendDM(cli2);
// 		}
// 		sendDM();
// 	}, dmInterval);
// };
