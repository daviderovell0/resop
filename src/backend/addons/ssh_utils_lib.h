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
 * @param hostname remote host
 * @param port remote port 
 * @param username remote host SSH username
 * @param priv_key local private key associated to the remote cluster.
 * public key is <priv_key>.pub
 * @param password remote cluster SSH password
 * @param commandline shell command to submit (depends from the remote shell default)
 * @param output return string - filled with the command output or error. 
 * the string is dynamcally allocated (malloc)-> must be free'd by the caller after usage 
 * 
 * @return exit code of the remote command
 * < 0: internal error, command not send correctly
 * 0: exit code, successful command
 * > 0: exit code, error in the command
 */
int exec(char *hostname, char *port, char *username, char *priv_key,
char *password, char *commandline, char **output);

/**
 * @brief scp - transfer from remote host
 * 
 * @param hostname remote host
 * @param port remote port 
 * @param username remote host SSH username
 * @param priv_key local private key associated to the remote cluster.
 * public key is <priv_key>.pub
 * @param password remote cluster SSH password
 * @param src full path (or relative path to $HOME) of remote file to transfer
 * @param dest full path (or empty if current directory) of the local file 
 * @param output return string - filled with the command output or error
 * @return exit code of the remote command
 * < 0: internal error, error in the scp transfer
 * 0: successful transfer
 */
int scp_recv(char *hostname, char *port, char *username, char *priv_key,
char *password, char *src, char *dest, char **output);

/**
 * @brief scp - send to remote host
 * 
 * @param hostname remote host
 * @param port remote port 
 * @param username remote host SSH username
 * @param priv_key local private key associated to the remote cluster.
 * public key is <priv_key>.pub
 * @param password remote cluster SSH password
 * @param src full path (or empty if in current directory) of the local FILE 
 * (no folders allowed) 
 * @param dest Full path and filename  (or empty if HOME directory) of FILE to transfer to.
 * This is the filename 
 * @param output return string - filled with the command output or error
 * @return exit code of the remote command
 * < 0: internal error, error in the scp transfer
 * 0: successful transfer
 */
int scp_send(char *hostname, char *port, char *username, char *priv_key,
char *password, char *src, char *dest, char **output);

#ifdef __cplusplus
}  // extern "C"
#endif