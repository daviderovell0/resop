var fetch = require('node-fetch')

async function postName() {
    const object = { path: 'James Gordon' };
    const response = await fetch('http://127.0.0.1:3000/utils/opn/run', {
      headers: {'Content-Type': 'application/json'},
      method: 'POST',
      body: JSON.stringify(object)
    });
    const responseText = await response.text();
    console.log(responseText); // logs 'OK'
  }
postName();