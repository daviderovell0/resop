import { readFileSync } from 'fs';
import YAML from 'yaml';
import * as path from 'path';
import Command from './Command';
/**
 * Parse the given operator commands, from the corresponding yaml list.
 * Provides helper methods for valid commands.
 *
 * @description Gives ehlper methods
 * @param operator the backend operator (relative to the folder)
 */
export default class CommandParser {
  constructor(operator) {
    const commandsFilePath = path.join(
      __dirname,
      `../operators/${operator}/commands.yml`
    );

    this.commandsFile = readFileSync(commandsFilePath, { encoding: 'utf8' });
    this.commands = YAML.parseAllDocuments(this.commandsFile);
  }

  /**
   * Lists the parsed commands
   */
  getCommands() {
    return this.commands?.[0]?.toJSON() || [];
  }

  /**
   *
   * @param {Command} commandName command name (e.g sbatch)
   */
  getCommand(commandName) {
    const supportedCommands = this.getCommands();
    const command = supportedCommands.find(
      (entity) => entity.command === commandName
    );
    if (!command) {
      return null;
    }
    return new Command(command);
  }
}
