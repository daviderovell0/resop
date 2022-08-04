import * as tmp from 'tmp';
import Operation from '../../../backend/Operation';

const opn = new Operation();

opn.setDescription('Creates a temporary (tmp) file with the given content');

// options in the POST request body, to be used in the Operation logic
opn.defineOptions({
  content: 'String with the content of the file',
});

function exec() {
  const tempfile = tmp.tmpNameSync();

  opn.addLog(opn.options.content);
  let parsedContent = !opn.options.content
    ? ''
    : opn.options.content.replace(/(\r\n|\n|\r)/gm, '\n');

  // adding escape caracters for nested quotes and backslash
  parsedContent = parsedContent.replaceAll('\\', '\\\\');
  parsedContent = parsedContent.replaceAll('`', '\\`');
  parsedContent = parsedContent.replaceAll('"', '\\"');
  // no need to escape single quotes in printf
  opn.addLog(parsedContent);

  // TODO: fix issue: some special characters "break" the string and are not supported: `'
  opn.runCommand(`printf "%s" "${parsedContent}" > ${tempfile}`);
  return tempfile;
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
