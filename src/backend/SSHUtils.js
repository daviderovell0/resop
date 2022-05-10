import { readFileSync } from 'fs';
import sshUtils from './addons/binding';

/**
 * SSH2Agent - provides helper methods to execute commands on a remote server.
 * The remote rserver should a head node or a master node in case of HPC cluster
 *
 * Exploits the ssh2 NPM module
 */
class SSHUtils {
  helloWorld(username, password) {
    // Promise CRUCIAL to wait for the async event listening
    return sshUtils.exec({
      hostname: process.env.CLUSTER_ADDRESS,
      port: process.env.CLUSTER_SSH_PORT,
      username,
      password,
      commandline: 'echo hello world!',
    });
  }

  /**
   * Executes the provided command through ssh on the remote server.
   *
   * @param {string} command
   */
  exec(command, user) {
    const output = {
      success: false,
      command,
      output: '',
    };

    // console.log(user);

    if (process.env.IN_PROD !== 'true') {
      return {
        success: true,
        command,
        output: 'dev',
      };
    }
    const out = sshUtils.exec({
      hostname: process.env.CLUSTER_ADDRESS,
      port: process.env.CLUSTER_SSH_PORT,
      username: user.username,
      priv_key: user.keyPath,
      password: user.keyPassphrase,
      commandline: command,
    });

    console.log(`stdout:\n\t${out.out}`);
    output.success = out.rc === 0;
    output.output = out.out;

    return output;
  }

  /**
   * same functionality as SSH copy id
   *
   * @returns {Boolean} success? or not
   *
   * @param username
   * @param password
   * @param publicKey full path to public key
   */
  copyID(username, password, publicKey) {
    // get public key contents
    const publicKeyContent = readFileSync(publicKey);

    this.exec({
      host: process.env.CLUSTER_ADDRESS,
      username,
      password,
      port: process.env.CLUSTER_SSH_PORT,
      commandline: 'mkdir -m 700 ~/.ssh',
    });
    // do not check for errors. if dir already there it's not an
    // issue

    const retobj = this.exec({
      host: process.env.CLUSTER_ADDRESS,
      username,
      password,
      port: process.env.CLUSTER_SSH_PORT,
      commandline: `echo "${publicKeyContent}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`,
    });

    if (!retobj.success) {
      console.log(`Failed to copy key. ${retobj.output}`);
    } else {
      console.log(`key ${publicKey} successfully copied.`);
    }
    return retobj.success;
  }
}

export default SSHUtils;
