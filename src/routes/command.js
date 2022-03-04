/**
 * Define routes for commands.
 */

import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import CommandParser from '../backend/CommandParser';
import Command from '../backend/Command';

const router = express.Router();

/**
 * Check whether the operator exist for each request,
 * before each command
 */
router.param('op', (req, res, next, operator) => {
  const operatorDir = path.join(__dirname, '../operators');
  // eslint-disable-next-line consistent-return
  fs.readdir(operatorDir, (err, files) => {
    if (err) {
      throw err;
    }

    if (!files.includes(operator)) {
      return res.status(404).json({
        success: false,
        error: 'Operator does not exist',
      });
    }
    // set the operator to the req object for later usage
    next();
  });
});

/**
 * Informative message at entrypoint
 */
router.get('/:op', (req, res) => {
  res.json({
    message: ` > ${req.params.op} < operator entrypoint. Run commands or operations`,
  });
});

/**
 * Returns the list of supported commands
 */
router.get('/:op/commands', (req, res) => {
  const commands = new CommandParser(req.params.op)
    .getCommands()
    .map((command) => new Command(command));

  return res.json(commands);
});

/**
 * Returns the list of supported options
 */
router.get('/:op/cmd/:command', (req, res) => {
  const commandName = req.params.command || null;
  try {
    const command = new CommandParser(req.params.op).getCommand(commandName);
    if (!commandName || !command) {
      return res.status(404).json({
        error: 'Unkown command.',
      });
    }
    return res.json(command);
  } catch (e) {
    console.error(
      `Error in retrieving the command  ${commandName}. Error: ${e.message}`
    );
    return res.status(500).end();
  }
});

/**
 * Submit a job
 */
router.post('/:op/cmd/:command', (req, res) => {
  const commandName = req.params.command || null;
  try {
    const command = new CommandParser(req.params.op).getCommand(commandName);
    if (!commandName || !command) {
      return res.status(404).json({
        success: false,
        error: 'Unkown command.',
      });
    }
    return command.run(req, res);
  } catch (e) {
    console.error(
      `Error in running the command  ${commandName}. Error: ${e.message}`
    );
    return res.status(500).end();
  }
});

/**
 * Display submit form if it exists
 */
router.get('/:op/cmd/:command/submit', (req, res) => {
  const commandName = req.params.command || null;
  try {
    const command = new CommandParser(req.params.op).getCommand(commandName);
    if (!commandName || !command) {
      return res.status(404).json({
        error: 'Unkown command.',
      });
    }

    const hasStaticForm = 'form' in command;

    if (!hasStaticForm) {
      return res.status(404).json({
        error: 'Command doesnt have a static submission page.',
      });
    }

    const formPath = path.join(__dirname, '../', command.form);
    if (!fs.existsSync(formPath)) {
      return res.status(404).json({
        error: 'Command doesnt have a static submission page.',
        path: formPath,
      });
    }

    return res.sendFile(command.form, {
      root: path.join(__dirname, '../'),
    });
  } catch (e) {
    console.error(
      `Error in retrieving the command  ${commandName}. Error: ${e.message}`
    );
    return res.status(500).end();
  }
});
export default router;
