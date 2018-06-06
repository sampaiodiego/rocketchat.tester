export default class Method {
	constructor(name) {
		this.name = name;
		this.ts = Date.now();

		this._promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
		this.then = this._promise.then.bind(this._promise);
		this.catch = this._promise.catch.bind(this._promise);
		this[Symbol.toStringTag] = 'Promise';
	}

	elapsedTime() {
		return Date.now() - this.ts;
	}
}
