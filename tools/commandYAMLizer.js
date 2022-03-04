/**
 * Tool for development: convert a command --help into a
 * suitable definition for command.yaml.
 *
 * NB: this script does NOT cover all the cases, it just uses common rules to split
 * a --help output. In some cases it might not work or it might crop or miss some useful
 * options, please do CHECK that it matches the options you want to add
 */

/* eslint-disable prettier/prettier */
const yaml = require('yaml');
const shell = require('shelljs');
const fs = require('fs');

const out = { command: '', options: {} };
// eslint-disable-next-line no-multi-str
const usage = '\nUsage:node commandYAMLizer [OPTIONS] COMMAND\n\
\n\
Tool to convert a command help output into a Command compatible YAML definition \n\
for resop new command.yml declaration\n\
\n\
Options:\n\
   -h, --help\tprint this help\n\
   --in\t\tstdin list of bare option, no command needed in this case';

if (process.argv.length < 3) {
  console.log(usage);
} else if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log(usage);
} else {
  let options;
  // take options directly from stdin
  if (process.argv.includes('--in')) {
    // options = process.argv.indexOf('--in');
    options = fs.readFileSync(0).toString();
  } else {
  // extract options list from the help section
  // this process relies on common conventions:
  // - at the top of the option list "Options:" is present
  // - the bottom ends with a double newline
  // it is subject to errors depending on the command
    const cmd = process.argv[2];
    out.command = cmd;
    // run command help
    const returnval = shell.exec(`${cmd} --help`);

    if (returnval.stderr) {
      throw returnval.stderr;
    }
    // extract the options from the 'help' output string
    options = returnval
      .slice(returnval.stdout.indexOf('Option') + 8, returnval.stdout.length); // crop top -> look of 'Option:' string
    options = options.slice(0, options.indexOf('\n\n')); // crop bottom -> look for double newline
  }

  console.log(options);
  options = options.split(/(\n)\s+(-)/g); // extract option lines: split for newline + any space char + '-'
  options.forEach((line) => {
    if (line === '' || line === '-' || line === '\n') return; // don't process empty line or isolated split separators
    const longFlag = line.slice(line.indexOf('-'), line.indexOf(' ', line.indexOf('-')));
    const shortFlag = line[0] === '-' ? null : `-${line[0]}`;
    const desc = line.slice(line.indexOf(' ', line.indexOf(longFlag), line.length)).replace(/\s+/g, ' ');

    // console.log(`${shortFlag}  ${longFlag}\n${desc}`);
    const optionName = longFlag ? longFlag.replace(/-+/g, '') : shortFlag;
    out.options[optionName] = {
      description: desc.slice(1, desc.length),
      flag: shortFlag || `-${longFlag}`
    };
  });
  console.log(yaml.stringify([out]));
}
