import RocketChat from './rocketchat';
var inquirer = require("inquirer");

// const client = ;

// client.oncePing = function() {
// 	this.registerUser();
// }

let clients = [];

const connect = (a) => {
	for (let index = 0; index < a; index++) {
                                            const client = new RocketChat(null);
                                            client.oncePing = function() {
                                            	this.registerUser();
                                            }
                                            clients.push(client);
                                          }
	console.log('connected');

	return true;
}

const writeMessage = async () => {
  const answers = await inquirer.prompt([
    {
      type: "input",
	  name: "message",
	  default: 'hi rocketchat',
      message: "write your message"
    }
  ]);
  return answers.message;
};

const message = async (n) => {
	const m = await writeMessage();
	console.log(m)
}
const howMany = async () => {
	const answers = await inquirer.prompt([
    {
      type: "input",
      name: "number",
      message: "how many?",
      validate: function(value) {
        var pass = value.match(
          /^[0-9]+]?$/i
        );
        if (pass) {
          return true;
        }
        return "Please enter a valid number";
      }
    }
  ]);
  return answers.number

}
const users = async () => {
	const answers = await inquirer.prompt([
		{
			type: "list",
			name: "action",
			message: "What do you want?",
			choices: ["Connect", "Disconnect", "Message"],
			filter: function(val) {
			return val.toLowerCase();
		}
		}
	]);
	let n;
	switch (answers.action) {
		case "connect":
			n = await howMany();
			return connect(n);
		case "disconnect":
			n = await howMany();
			return connect(n);
		case "message":
			n = await howMany();
			await message(n);
  }
}
(async () => {
  while (true) {
    const answers = await inquirer.prompt([{
		type: "list",
		name: "action",
		message: "What do you want?",
		choices: ["Users", "Status"],
		filter: function(val) {
			return val.toLowerCase();
		}
	  }]);
	  switch(answers.action) {
		  case 'users':
			await users()
	  }
  }
})();
