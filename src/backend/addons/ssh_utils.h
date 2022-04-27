/**
 * @file ssh_client.h
 * @author Davide Rovelli (daviderovell0.github.com)
 * @brief SSH client functions for remote cluster operation. 
 * Uses libssh2 library. Non-blocking I/O operations
 * @date 2022-04-17
 * 
 * @copyright Copyright (c) 2022
 * 
 */

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief execute a command via SSH on a remote cluster
 * 
 * 
 * @param hostname remote host
 * @param port remote port 
 * @param username remote host SSH username
 * @param priv_key local private key associated to the remote cluster.
 * public key is <priv_key>.pub
 * @param password remote cluster SSH password
 * @param commandline shell command to submit (depends from the remote shell default)
 * @param output return string - filled with the command output or error
 * @return exit code of the remote command
 * < 0: internal error, command not send correctly
 * 0: exit code, successful command
 * > 0: exit code, error in the command
 */
int exec(char *hostname, char *port, char *username, char *priv_key,
char *password, char *commandline, char **output);

#ifdef __cplusplus
}  // extern "C"
#endif