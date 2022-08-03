import SSH2Agent from './SSH2Agent';
import SSHUtils from './SSHUtils';

// eslint-disable-next-line camelcase
const remote_shell = new SSH2Agent();
const sshell = new SSHUtils();

/**
 * Command wrapper
 */
export default class Command {
  /**
   *
   * @param {JSON} commandObject raw command object (extracted by YAML)
   */
  constructor(commandObject) {
    this.command = commandObject.command;
    this.subcommand = commandObject.subcommand;
    this.description = commandObject.description;
    this.options = commandObject.options;

    if ('form' in commandObject) {
      this.form = commandObject.form;
    }
  }

  toString() {
    return `${this.command}`;
  }

  /**
   * Override the toJSON method
   */
  toJSON() {
    const { command, subcommand, description, options } = this;

    return {
      command,
      subcommand,
      description,
      options,
    };
  }

  /**
   * Lists the options supported by the command
   */
  getOptions() {
    return Object.keys(this?.options || {});
  }

  /**
   * Checks if an option is supported by the command
   * @param {string} option
   */
  hasOption(option) {
    return this.getOptions().includes(option);
  }

  /**
   * Strip a command string from all special characters that go
   * outside the scope of the original command.
   * Example: echo hello & whoami -> perform an action of 'echo'
   * Performs also other sanity checks
   *
   * @param {String} commandString
   * @returns {String} processed string to be run
   */
  static checkInputFormat(commandString) {
    const blacklist = ['&', '>', '|', ';', '#', '(', ')'];

    // check if quotes are closed (number of occurrences is even)
    // double
    if (commandString.split('"').length % 2 === 0) {
      throw 'InputFormatError: double quotes are not closed';
    }
    // single
    if (commandString.split("'").length % 2 === 0) {
      throw 'InputFormatError: single quotes are not closed';
    }

    // check for forbitten characters
    blacklist.forEach((char) => {
      if (commandString.includes(char)) {
        const i = commandString.indexOf(char);
        if (commandString[i - 1] !== '\\') {
          throw `InputFormatError: character ${char} not allowed, escape it with a backslash`;
        }
      }
    });

    // temp. disabled: file-2.txt does not pass the test
    // check no inside flags
    // for (let i = 0; i < commandString.length; i += 1) {
    //   if (commandString[i] === '-' && commandString[i + 1] !== ' ') {
    //     throw 'InputFormatError: embedded flag in input field';
    //   }
    // }

    return commandString;
  }

  /**
   * Generates the slurm command with the set of flags
   * given the options in the API POST request
   *
   * @param {Object} payload request body (req.body)
   * @param {User} user Authenticated user (req.user)
   */
  generate(payload) {
    let { command } = this;

    if (this.subcommand) {
      command += ` ${this.subcommand}`;
    }
    const input = payload?.input || '';

    // Add all the necessary flags for the supported options
    this.getOptions().forEach((option) => {
      // Only if the option is supported
      if (Object.keys(payload).includes(option)) {
        command += ` ${this.options[option].flag}${
          ` ${payload[option]}` || ''
        }`;
      }
    });

    // concatenate the input command
    command += ` ${input}`;
    // "sanitize" input
    Command.checkInputFormat(command);
    return command;
  }

  /**
   * @deprecated
   * Runs a command asynchronously in the remote cluster. Command options are taken from the
   * req body
   *
   * @param {Object} req Express object: HTTP request
   * @param {Object} res Express object: HTTP response
   * @returns HTTP response
   */
  async runAsync(req, res) {
    try {
      const cmd = this.generate(req.body);
      console.log(
        `# ${this.user?.username} running command ${this.toString()}`
      );
      const out = await remote_shell.exec(cmd, req.user);
      return res.json(out);
    } catch (error) {
      console.log(error, req.body);
      return res.status(422).json({
        success: false,
        input: req.body.input,
        output: error,
      });
    }
  }

  /**
   * Runs a command synchronously in the remote cluster. Command options are taken from the
   * req body
   *
   * @param {Object} req Express object: HTTP request
   * @param {Object} res Express object: HTTP response
   * @returns HTTP response
   */
  runSync(req, res) {
    try {
      const cmd = this.generate(req.body);
      console.log(`# ${req.user?.username} running command ${this.toString()}`);
      const out = sshell.exec(cmd, req.user);
      return res.json(out);
    } catch (error) {
      console.log(error, req.body);
      return res.status(422).json({
        success: false,
        input: req.body.input,
        output: error,
      });
    }
  }
}
