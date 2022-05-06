const sshUtils = require('bindings')('ssh_utils');
const fs = require('fs');

var configExec = {};

const allFileContents = fs.readFileSync('variables.txt', 'utf-8');
allFileContents.split(/\r?\n/).forEach(line =>  {
  const linelist = line.split('=');
  configExec[linelist[0].toLowerCase()] = linelist[1];

});

console.log(`${JSON.stringify(configExec)}`);

// testing exec

const rc = sshUtils.exec(configExec);
