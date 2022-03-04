import Operation from '../../../backend/Operation';
/**
 * @summary Save Linux user modification to the cluster (helper function)
 * @description any user operation is made only on the underlying NodeJS server.
 * This commands saves user modification in the all the nodes of the Tigon cluster,
 * by copying passwd, shadow and group to a specific shared storage location, where
 * the nodes point
 */

const opn = new Operation();

opn.setDescription('save linux user data to a shared location in Tigon');

async function exec() {
  opn.addLog(
    await opn.runCommandDefined({
      command: 'cp',
      input: '/etc/passwd /sharedFS/etc/',
    })
  );

  opn.addLog(
    await opn.runCommandDefined({
      command: 'cp',
      input: '/etc/shadow /sharedFS/etc/',
    })
  );

  opn.addLog(
    await opn.runCommandDefined({
      command: 'cp',
      input: '/etc/group /sharedFS/etc/',
    })
  );

  return 'User files copied';
}

opn.set(exec);

// eslint-disable-next-line import/prefer-default-export
export { opn };
