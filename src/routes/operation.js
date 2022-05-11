import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import CommandParser from '../backend/CommandParser';
import OperationUtils from '../backend/OperationUtils';

const router = express.Router();
/**
 * Check whether the operator exist for each request,
 * before each operation.
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
 * Returns the list of supported operations
 */
router.get('/:op/operations', (req, res) => {
  try {
    const allOperations = new OperationUtils(req.params.op).listOperations();
    res.json(allOperations);
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err,
    });
  }
});

/**
 * Returns the operation description and options
 */
router.get('/:op/opn/:operation', (req, res) => {
  const operationName = req.params.operation || null;
  new OperationUtils(req.params.op).findOperation(operationName).then(
    (operation) => {
      if (!operationName || !operation) {
        return res.status(404).json({
          success: false,
          error: 'Unkown operation.',
        });
      }
      return res.json(operation);
    },
    (e) => {
      console.error(
        `Error in retrieving the operation  ${operationName}. Error: ${e.message}`
      );
      return res.status(500).end();
    }
  );
});

/**
 * Submit a operation to the remote cluster
 */
router.post('/:op/opn/:operation', (req, res) => {
  const operationName = req.params.operation || null;
  new OperationUtils(req.params.op).findOperation(operationName).then(
    // eslint-disable-next-line consistent-return
    (operation) => {
      if (!operationName || !operation) {
        return res.status(404).json({
          success: false,
          error: 'Unkown operation.',
        });
      }
      // extract operation options from the body
      operation.setOptions(req.body);
      // IMPORTANT: set the operation user (username = cluster POSIX username)
      operation.setUser(req.user); // @TODO: add user check for second security layer
      // run the operation and return the response

      // const result = operation.run();
      // res.json(result);

      // pipeline mostly sync but need async for some methods
      // such as runOperationAsync
      operation.run().then((output) => {
        res.json(output);
      });
    },
    (e) => {
      console.error(
        `Error in retrieving the operation  ${operationName}. Error: ${e.message}`
      );
      return res.status(500).end();
    }
  );
});

/**
 * Display submit form if it exists
 */
router.get('/:op/opn/:operation/submit', (req, res) => {
  const operationName = req.params.operation || null;
  try {
    const operation = new CommandParser(req.params.op).getCommand(
      operationName
    );
    if (!operationName || !operation) {
      return res.status(404).json({
        success: false,
        error: 'Unkown operation.',
      });
    }

    const hasStaticForm = 'form' in operation;

    if (!hasStaticForm) {
      return res.status(404).json({
        success: false,
        error: 'Command doesnt have a static submission page.',
      });
    }

    const formPath = path.join(__dirname, '../', operation.form);
    if (!fs.existsSync(formPath)) {
      return res.status(404).json({
        success: false,
        error: 'Command doesnt have a static submission page.',
        path: formPath,
      });
    }

    return res.sendFile(operation.form, {
      root: path.join(__dirname, '../'),
    });
  } catch (e) {
    console.error(
      `Error in retrieving the operation  ${operationName}. Error: ${e.message}`
    );
    return res.status(500).end();
  }
});
export default router;
