/* eslint-disable prettier/prettier */
import { User } from '../../../models';
import Operation from '../../../backend/Operation';
/**
 * @summary Creates a user in the api database
 */

const opn = new Operation();

opn.setDescription('change the password for a given username');

opn.defineOptions({
  username: 'cluster username',
  new_password: 'cluster password',
});

async function exec() {
  opn.addLog(`[INFO]: user ${opn.options.username} attempting to change password...`);

  const user = await User.findOne({
    where: { username: opn.options.username },
  });

  // does user exist
  if (!user) {
    console.log('[ERROR]: username does not exist ');
    opn.error('Username does not exist');
  }

  // special handling when password is null
  if (!opn.options.new_password) {
    console.log('[ERROR]: null password ');
    opn.error('Password can\'t be empty');
  }

  user.password = opn.options.new_password;
  console.log(user.password);

  return user
    .save({ validate: false })
    .then(() => 'The password was updated')
    .catch((err) => {
      opn.error(err);
    });
}
opn.set(exec);

// eslint-disable-next-line import/prefer-default-export
export { opn };
