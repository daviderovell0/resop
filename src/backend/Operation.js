import CommandParser from './CommandParser';
import OperationError from './OperationError';
import OperationUtils from './OperationUtils';
import SSHUtils from './SSHUtils';
import Command from './Command';

const sshell = new SSHUtils();

/**
 * Operation wrapper
 */
export default class Operation {
  /**
   *
   * @param {List} operator the backend operator
   */
  constructor(operator, name) {
    this.operator = operator;
    this.name = name;
    this.log = [];
    this.options_def = null;
    this.options = {};
    this.description = null;
    this.user = null;
    this.execFunction = null;
  }

  /**
   * Override the toJSON method
   */
  toJSON() {
    // eslint-disable-next-line camelcase
    const { name, operator, options_def, description } = this;
    return {
      name,
      operator,
      description,
      options: options_def,
    };
  }

  /**
   * Set the operation name
   *
   * @param {String} name
   */
  setName(name) {
    this.name = name;
  }

  /**
   * Set the Operation user
   * @param {User} user
   */
  setUser(user) {
    this.user = user;
  }

  /**
   * Set the base operator and the operation name
   *
   * @param {String} operator
   * @param {String} name
   */
  setCredentials(operator, name) {
    this.operator = operator;
    this.name = name;
  }

  /**
   *
   * @param {Function} execFunction runtime of the operation
   */
  set(execFunction) {
    this.execFunction = execFunction;
  }

  /**
   * Set the operation description for informative purposes
   *
   * @param {String} description
   */
  setDescription(description) {
    this.description = description;
  }

  toString() {
    return `${this.operator}:${this.name}`;
  }

  /**
   * Lists the options supported by the command
   */
  getAllowedOptions() {
    return Object.keys(this?.options_def || {});
  }

  /**
   * Define the options (or fields) for an operation.
   * Options are read from a user's
   * */
  defineOptions(options) {
    if (typeof options === 'object' && options !== null) {
      this.options_def = options;
      return options;
    }

    console.error('Error: invalid options format. {OPTION}: {DESCRITPION}');
    return null;
  }

  /**
   * Assigns options from the user request to the operation.
   * Only options that are defined for the operation will be taken into consideration
   * (i.e. with defineOptions)
   *
   * @param {Object} payload
   */
  setOptions(payload) {
    // Add all the necessary values
    this.getAllowedOptions().forEach((option) => {
      // Only if the option is supported
      if (Object.keys(payload).includes(option)) {
        // "sanitize" input
        Command.checkInputFormat(payload[option]);
        this.options[option] = payload[option];
      } else {
        this.options[option] = null;
      }
    });
  }

  /**
   * Check POST request fields against the Operation defined options.
   * Without arguments, all options need to contain a non-empty value
   * @param {Array} exceptions list of options that can be Null
   * @throws OperationError if there's at least 1 null option
   */
  noNullOptions(exceptions = []) {
    Object.entries(this.options).forEach((element) => {
      // console.log(element);

      if (!exceptions.includes(element[0]) && element[1] === null) {
        this.error(
          `${element[0]} option is null.\n` +
            `Required fields: ${Object.keys(this.options)}\n` +
            `Optional fields: ${exceptions}`
        );
      }
    });
  }

  /**
   * Check POST request fields against the Operation defined options.
   * Without arguments, all options need to contain a non-empty value
   * @param {Array} exceptions list of options that can be Empty
   * @throws OperationError if there's at least 1 null option
   */
  noEmptyOptions(exceptions = []) {
    Object.entries(this.options).forEach((element) => {
      if (!exceptions.includes(element[0]) && element[1] === '') {
        this.error(
          `${element[0]} option is empty.\n` +
            `Required non-empty fields: ${Object.keys(this.options)}\n` +
            `Other fields: ${exceptions}`
        );
      }
    });
  }

  /**
   * Throws an instance of OperationError
   * @param {String} error
   */
  error(error) {
    throw new OperationError(error);
  }

  /**
   * Store message in the operation response log
   *
   * @param {String} message
   */
  addLog(message) {
    this.log.push(message);
  }

  /**
   * Runs a command in the remote cluster.
   * Cluster user is attached to the request object
   *
   * @param {String} cmd
   * @returns {String} output of the remote command
   */
  runCommand(cmd) {
    const result = sshell.exec(cmd, this.user);
    if (!result.success) {
      this.error(`CommandError: ${result.output}`);
    }
    return result.output;
  }

  /**
   * Runs a command in the remote cluster from a defined command (as it was a POST request
   * to a command endpoint). The command must be in the commands.yml definition
   * in the current operator.
   * Command is run on behalf of the Operation's user that should be previously set.
   *
   * @todo test
   *
   * @param {JSON} commandObject
   * @returns null
   */
  runCommandDefined(commandObject) {
    const commandName = commandObject.command;

    const command = new CommandParser(this.operator).getCommand(commandName);
    if (!commandName || !command) {
      throw `Unkown command: ${commandName} not in ${this.operator} command list`;
    }
    // store defined payload, the equivalent of req.body for a normal command request
    // eslint-disable-next-line no-param-reassign
    delete commandObject.command;
    const cmd = command.generate(commandObject, this.user);

    const result = sshell.exec(cmd, this.user);
    if (!result.success) {
      this.error(`CommandError: ${result.output}`);
    }
    return result.output;
  }

  /**
   * Runs *any* Operation already defined in the API.
   *
   * @param {String} operator
   * @param {String} operation
   * @param {JSON} options {option1: value1...} set of options
   * @returns {*} operation's result
   * @throws {OperationError} for errors during the execution
   * @throws {Error} for errors in the operation definition
   */
  async runOperationAsync(operator, operation, options) {
    // find the operation
    const opn = await new OperationUtils(operator).findOperation(operation);
    if (!opn) {
      throw `${operation} in operator ${operator} not found`;
    }
    opn.setOptions(options);
    opn.setUser(this.user);
    return opn.execFunction();
  }

  /**
   * Runs *any* Operation already defined in the API.
   *
   * @param {String} operationInstance imported Operation object
   * (result of import ....<operator>/operations/<operation>.js)
   * @param {JSON} options {option1: value1...} set of options
   * @returns {*} operation's result
   * @throws {OperationError} for errors during the execution
   * @throws {Error} for errors in the operation definition
   */
  runOperation(operationInstance, options) {
    // find the operation
    const opn = Object.values(operationInstance)[0];
    opn.setOptions(options);
    opn.setUser(this.user);
    return opn.execFunction();
  }

  /**
   * Run the execution function of this operation with error handling
   *
   * @param {Response} res HTTP response object
   * @returns {String} res.json({success: true/false, output: <String>, *log: []})
   */
  async run() {
    // empty opertation log before running
    this.log = [];
    console.log(
      `# ${this.user?.username} running operation ${this.toString()}`
    );
    if (!this.execFunction) {
      const errMsg =
        'This operation does not have an execution function. Set it via the set() method';
      console.log(errMsg);
      return { success: false, operation: this.toString(), output: errMsg };
    }

    try {
      const output = await this.execFunction();
      console.log(`+ operation ${this.toString()} successful`);
      return {
        success: true,
        operation: this.toString(),
        output,
        log: this.log,
      };
    } catch (err) {
      // check if the error was thrown in the Operation implementation
      if (err instanceof OperationError) {
        console.log(err);
        this.log.push(err.message);
        console.log(`! operation ${this.toString()} failed`);
        return {
          success: false,
          operation: this.toString(),
          output: err.name,
          log: this.log,
        };
      }
      // or if it is caused by the function definition
      console.log('InternalError (check function declaration):');
      console.log(err);
      console.log(`! operation ${this.toString()} failed`);
      return {
        success: false,
        operation: this.toString(),
        output: 'InternalError',
        log: err.toString(),
      };
    }
  }
}
