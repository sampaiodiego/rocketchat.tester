/* eslint-disable no-await-in-loop */
import RocketChat from './rocketchat';
import { waitFor } from './utils';

function go(url) {
	return new Promise((resolve) => {
		const client = new RocketChat({
			url,
			runAfterStartup: false,
		});
		client.on('started', () => {
			resolve();
		});
	});
}

const {
	TOTAL_CONNS = 5000,
	CONNS_STEP = 500,
} = process.env;

const totalConns = parseInt(TOTAL_CONNS);
const connsStep = parseInt(CONNS_STEP);

const {
	WS_URL = '',
} = process.env;

const urls = WS_URL.split('|');
const totalURLs = urls.length;

(async function() {
	const all = [];

	for (let i = 0; i < totalConns; i++) {
		all.push(go(urls[i % totalURLs]));

		if (i % connsStep === 0) {
			await Promise.all(all);
			await waitFor(1000);

			all.length = 0;

			console.log('step', i);
		}
	}
}());
