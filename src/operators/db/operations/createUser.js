/* eslint-disable prettier/prettier */
import { User } from '../../../models';
import Operation from '../../../backend/Operation';
/**
 * @summary Creates a user in the api database
 */

const opn = new Operation();

opn.setDescription('Creates a user in the api database');

opn.defineOptions({
  username: "user's supercomputer login",
  password: "user's supercomputer password",
  mail: 'user registered email',
});

async function exec() {
  opn.addLog(`Adding user ${opn.options.username} to the database...`);

  return User.create({
    username: opn.options.username,
    password: opn.options.password,
    mail: opn.options.mail,
  }).then((result) => result, (error) => {
    // creating error string from Sequelize Error object
    const errorString = `Type: ${error.errors[0].type}. Message: ${error.errors[0].value} - ${error.errors[0].message}`;
    console.log(error);
    return opn.error(errorString);
  });
}

opn.set(exec);

export default opn;
