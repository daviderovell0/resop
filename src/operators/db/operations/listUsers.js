/* eslint-disable prettier/prettier */
import { User } from '../../../models';
import Operation from '../../../backend/Operation';
/**
 * @summary Creates a user in the api database
 */

const opn = new Operation();

opn.setDescription('List all cluster\'s users');

async function exec() {
  return User.findAll();
}

opn.set(exec);

// eslint-disable-next-line import/prefer-default-export
export { opn };
