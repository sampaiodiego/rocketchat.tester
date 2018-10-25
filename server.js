const Koa = require('koa');
import json from 'koa-json';
import bodyparser from 'koa-bodyparser';

import api from './routes/api';

const app = new Koa();

app.use(bodyparser({
	enableTypes:['json', 'form', 'text']
}));
app.use(json());

// logger

app.use(async(ctx, next) => {
	await next();
	const rt = ctx.response.get('X-Response-Time');
	console.log(`${ ctx.method } ${ ctx.url } - ${ rt }`);
});

// x-response-time

app.use(async(ctx, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	ctx.set('X-Response-Time', `${ ms }ms`);
});

app.use(api.routes(), api.allowedMethods());

app.listen(3000, () => {
	console.log('server listening on port 3000');
});
