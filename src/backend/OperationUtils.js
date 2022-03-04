import * as path from 'path';
import * as fs from 'fs';
/**
 * Operation utils.
 */
export default class OperationUtils {
  constructor(operator) {
    this.operator = operator;
    this.operationsFilePath = path.join(
      __dirname,
      `../operators/${operator}/operations`
    );
  }

  listOperations() {
    const operations = fs
      .readdirSync(this.operationsFilePath)
      .map((opn) => opn.slice(0, -3));
    return operations;
  }

  /**
   * Find and return an implemented operation (instance of Operation)
   * @param {String} operationName
   * @returns {Operation} or null if not found.
   */
  async findOperation(operationName) {
    return import(`${this.operationsFilePath}/${operationName}`).then(
      (operation) => {
        // extract the actual Operation object wrapped around the operation instance
        // -> only value in the Operation instance
        const opObj = Object.values(operation)[0];

        // set the operation details based on the path location
        opObj.setCredentials(this.operator, operationName);

        return opObj;
      },
      (err) => {
        console.error(err);
        return null;
      }
    );
  }
}
