const sshUtils = require('bindings')('ssh_utils');
const fs = require('fs');

var configExec = {};

console.log('importing values from variables.txt...');
const allFileContents = fs.readFileSync('variables.txt', 'utf-8');
allFileContents.split(/\r?\n/).forEach(line =>  {
  const linelist = line.split('=');
  configExec[linelist[0].toLowerCase()] = linelist[1];

});

console.log('\nparams:')
console.log(`${JSON.stringify(configExec)}`);

console.log('\nTesting exec method...')
// execute the command via SSH and save the return object
let ro = sshUtils.exec(configExec);
console.log(`> return code ${ro['rc']}\n> output:\n${ro['out']}`);

console.log('\nTesting scpRecv method...');
configExec["src"] = configExec["remote_source"];
configExec["dest"] = configExec["local_destination"];
ro = sshUtils.scpRecv(configExec);
console.log(`remote file ${configExec["src"]} copied to ${configExec["dest"]}`);
console.log(`> return code ${ro['rc']}\n> output:\n${ro['out']}`);

console.log('\nTesting scpSend method...');
configExec["src"] = configExec["local_source"];
configExec["dest"] = configExec["remote_destination"];
ro = sshUtils.scpSend(configExec);
console.log(`local file ${configExec["src"]} copied to ${configExec["dest"]} on ${configExec["hostname"]}`);
console.log(`> return code ${ro['rc']}\n> output:\n${ro['out']}`);
