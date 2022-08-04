const sshUtils = require('bindings')('ssh_utils');

/**
 * export method:
 * exec()
 * scpRecv()
 * scpSend()
 *
 * built from C ssh_utils_napi with the node-addon-api
 */
export default sshUtils;
