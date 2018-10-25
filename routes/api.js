import koaRouter from 'koa-router';
import { clients, connect, sendPublic } from '../loadtest';

const router = koaRouter();

router.prefix('/api');

router.get('/', async(ctx/*, next*/) => {
	const body = ctx.request.body;

	console.log('body ->', body);

	return ctx.body = { success: true };
});

router.post('/connect', async(ctx/*, next*/) => {
	console.log('ctx.request.body ->', ctx.request.body);
	ctx.assert(ctx.request.body.url, 500, 'Invalid URL');
	ctx.assert(ctx.request.body.qt, 500, 'Invalid quantity');

	const { url, qt } = ctx.request.body;

	try {
		await connect(url, qt);
		return ctx.body = { success: true };
	} catch (e) {
		console.log('error ->', e);
	}
});


router.get('/status', async(ctx/*, next*/) => {
	console.log('clients ->', clients);

	return ctx.body = { clients: clients.length };
});

export default router;
