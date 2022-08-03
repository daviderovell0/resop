import Operation from '../../../backend/Operation';
/**
 * @summary Description
 */

// (mustdo) Instatiate a new Operation:
const opn = new Operation();

opn.setDescription(
  'Creates a user in all nodes in the test vagrant cluster that comes with the API'
);

// options in the POST request body, to be used in the Operation logic
opn.defineOptions({
  username: 'username',
  password: 'password - no character limitations',
});

async function exec() {
  const passwordHash = await opn.runOperationAsync('linux-user', 'hashMD5', {
    password: opn.options.password,
    escapeChar: 'true',
  });
  // use a command defined in this operator's commands, as it would be in a POST request
  const out = await opn.runCommandDefined({
    command: 'pdsh',
    nodes: 'node[01-04]',
    input: `useradd --password "${passwordHash}" ${opn.options.username}`,
  });

  // add log information to the HTTP response and API log
  opn.addLog('commands completed...');

  // the result of the operation
  return out;
}

// (must do), set the execution function
opn.set(exec);

// (mustdo) export the Operation instance
export default opn;
