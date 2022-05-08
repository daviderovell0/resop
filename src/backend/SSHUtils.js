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
    const out = sshUtils.exec({
      hostname: process.env.CLUSTER_ADDRESS,
      port: process.env.CLUSTER_SSH_PORT,
      username,
      password,
      commandline: 'echo hello world!',
    });
    return out;
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

    output.success = out.rc === 0;
    output.output = out.out;

    return output;
    // Promise CRUCIAL to wait for the async event listening
    // return new Promise((resolve) => {
    //   // connect to the cluster -> emits an event
    //   this.conn.connect({
    //     host: process.env.CLUSTER_ADDRESS,
    //     port: process.env.CLUSTER_SSH_PORT,
    //     username: user.username,
    //     passphrase: user.keyPassphrase,
    //     privateKey: readFileSync(user.keyPath),
    //   });

    //   // listen to the event: when connection is ready do...
    //   this.conn.once('ready', () => {
    //     console.log(`> ${command}`);
    //     this.conn.exec(command, async (err, stream) => {
    //       if (err) throw err; // error check for the connection
    //       stream
    //         .on('close', async (code) => {
    //           output.success = code === 0;
    //           this.conn.end(); // close connection stream
    //           resolve(output); // send response when stream finished reading
    //         })
    //         .on('data', (data) => {
    //           console.log(`STDOUT: ${data}`); // log and return stdout of command exec
    //           // crop '\n' from stdout, if there is one
    //           let s = data.toString();
    //           if (s.endsWith('\n')) {
    //             s = s.substring(0, data.length - 1);
    //           }
    //           output.output = output.output.concat(s);
    //         })
    //         .stderr.on('data', (data) => {
    //           console.log(`STDERR: ${data}`); // log and return stderr of command exec
    //           output.output = output.output.concat(data);
    //         });
    //     });
    //   });
    // });
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

    return new Promise((resolve) => {
      // connect to the cluster -> emits an event
      this.conn.connect({
        host: process.env.CLUSTER_ADDRESS,
        username,
        password,
        port: process.env.CLUSTER_SSH_PORT,
      });

      // once connected append the pub key to auth keys
      this.conn.once('ready', () => {
        // create the .ssh folder if it does not exist
        this.conn.exec('mkdir -m 700 ~/.ssh', async (err) => {
          if (err) throw err;
          // do not check for errors. if dir already there it's not an
          // issue
        });
        // copy the pubkey
        this.conn.exec(
          `echo "${publicKeyContent}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`,
          async (err, stream) => {
            if (err) throw err; // error check for the connection
            stream
              .on('close', async (code) => {
                resolve(code === 0); // send response when stream finished reading
              })
              .on('data', (data) => {
                console.log(`ssh copyID stdout: ${data}`);
              })
              .stderr.on('data', (data) => {
                console.log(`Failed to copy key. ${data}`);
              });
          }
        );
      });
    });
  }
}

export default SSHUtils;
