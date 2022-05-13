import { readFileSync } from 'fs';
import sshUtils from './addons/binding';

/**
 * SSHUtils - provides helper methods to execute commands on a remote server.
 * The remote rserver should a head node or a master node in case of HPC cluster
 *
 */
class SSHUtils {
  attempt(username, password) {
    // Promise CRUCIAL to wait for the async event listening
    const retobj = sshUtils.exec({
      hostname: process.env.CLUSTER_ADDRESS,
      port: process.env.CLUSTER_SSH_PORT,
      username,
      password,
      commandline: 'echo connection successful',
    });

    return retobj.rc === 0;
  }

  /**
   * Executes the provided command through ssh on the remote server.
   *
   * @param {string} command
   * @param {Object} user authenticated user object
   * @returns {JSON} result of the command execution. result.success=bool
   * indicates the commands output status. Format:
   *
   * {success: bool, command: string, output: string}
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

    // console.log(`stdout:\n\t${out.out}`);
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

    sshUtils.exec({
      hostname: process.env.CLUSTER_ADDRESS,
      username,
      password,
      port: process.env.CLUSTER_SSH_PORT,
      commandline: 'mkdir -m 700 ~/.ssh',
    });
    // do not check for errors. if dir already there it's not an
    // issue

    const retobj = sshUtils.exec({
      hostname: process.env.CLUSTER_ADDRESS,
      username,
      password,
      port: process.env.CLUSTER_SSH_PORT,
      commandline: `echo "${publicKeyContent}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`,
    });

    const success = retobj.rc === 0;

    if (!success) {
      console.log(`Failed to copy key. ${retobj.out}`);
    } else {
      console.log(`key ${publicKey} successfully copied.`);
    }
    return success;
  }

  scpRecv(src, dest, user) {
    const output = {
      success: false,
      operation: 'receive',
      output: '',
    };

    if (process.env.IN_PROD !== 'true') {
      return {
        success: true,
        operation: 'receive',
        output: 'dev',
      };
    }
    const retobj = sshUtils.scpRecv({
      hostname: process.env.CLUSTER_ADDRESS,
      port: process.env.CLUSTER_SSH_PORT,
      username: user.username,
      priv_key: user.keyPath,
      password: user.keyPassphrase,
      src,
      dest,
    });

    output.success = retobj.rc === 0;
    output.output = retobj.out;

    return output;
  }

  scpSend(src, dest, user) {
    const output = {
      success: false,
      operation: 'receive',
      output: '',
    };

    if (process.env.IN_PROD !== 'true') {
      return {
        success: true,
        operation: 'receive',
        output: 'dev',
      };
    }

    console.log(user);
    const retobj = sshUtils.scpSend({
      hostname: process.env.CLUSTER_ADDRESS,
      port: process.env.CLUSTER_SSH_PORT,
      username: user.username,
      priv_key: user.keyPath,
      password: user.keyPassphrase,
      src,
      dest,
    });

    output.success = retobj.rc === 0;
    output.output = retobj.out;

    return output;
  }
}

export default SSHUtils;
