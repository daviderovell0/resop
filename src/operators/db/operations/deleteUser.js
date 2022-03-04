import { User } from '../../../models';
import Operation from '../../../backend/Operation';
/**
 * @summary Creates a user in the api database
 */

const opn = new Operation();

opn.setDescription('Delete a user from API db');

opn.defineOptions({
  username: 'username to be deleted',
});

async function exec() {
  opn.addLog(`deleting username: ${opn.options.username}`);

  const rows = await User.destroy({
    where: {
      username: opn.options.username,
    },
  });
  return rows === 0
    ? `User ${opn.options.username} does not exist`
    : `User ${opn.options.username} successfully deleted`;
}

opn.set(exec);

export default opn;
