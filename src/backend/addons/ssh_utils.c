#include "ssh_utils.h"
#include <libssh2.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <string.h>
#include <stdio.h>
#include <netdb.h>
#include <sys/select.h>
#include <unistd.h>

/**
 * @brief returns the string corresponding to the libssh2 error code
 * error coded taken from libssh2.h
 * @param rc 
 * @return char* 
 */
static char *get_libssh2_error(int rc) {
    switch (rc)
    {
    case -2: return "LIBSSH2_ERROR_BANNER_RECV";
    case -3: return "LIBSSH2_ERROR_BANNER_SEND";
    case -4: return "LIBSSH2_ERROR_INVALID_MAC"; 
    case -5: return "LIBSSH2_ERROR_KEX_FAILURE"; 
    case -6: return "LIBSSH2_ERROR_ALLOC"; 
    case -7: return "LIBSSH2_ERROR_SOCKET_SEND"; 
    case -8: return "LIBSSH2_ERROR_KEY_EXCHANGE_FAILURE"; 
    case -9: return "LIBSSH2_ERROR_TIMEOUT"; 
    case -10: return "LIBSSH2_ERROR_HOSTKEY_INIT"; 
    case -11: return "LIBSSH2_ERROR_HOSTKEY_SIGN"; 
    case -12: return "LIBSSH2_ERROR_DECRYPT"; 
    case -13: return "LIBSSH2_ERROR_SOCKET_DISCONNECT"; 
    case -14: return "LIBSSH2_ERROR_PROTO"; 
    case -15: return "LIBSSH2_ERROR_PASSWORD_EXPIRED"; 
    case -16: return "LIBSSH2_ERROR_FILE"; 
    case -17: return "LIBSSH2_ERROR_METHOD_NONE"; 
    case -18: return "LIBSSH2_ERROR_AUTHENTICATION_FAILED"; 
    case -19: return "LIBSSH2_ERROR_PUBLICKEY_UNVERIFIED"; 
    case -20: return "LIBSSH2_ERROR_CHANNEL_OUTOFORDER"; 
    case -21: return "LIBSSH2_ERROR_CHANNEL_FAILURE"; 
    case -22: return "LIBSSH2_ERROR_CHANNEL_REQUEST_DENIED"; 
    case -23: return "LIBSSH2_ERROR_CHANNEL_UNKNOWN"; 
    case -24: return "LIBSSH2_ERROR_CHANNEL_WINDOW_EXCEEDED"; 
    case -25: return "LIBSSH2_ERROR_CHANNEL_PACKET_EXCEEDED"; 
    case -26: return "LIBSSH2_ERROR_CHANNEL_CLOSED"; 
    case -27: return "LIBSSH2_ERROR_CHANNEL_EOF_SENT"; 
    case -28: return "LIBSSH2_ERROR_SCP_PROTOCOL"; 
    case -29: return "LIBSSH2_ERROR_ZLIB"; 
    case -30: return "LIBSSH2_ERROR_SOCKET_TIMEOUT";
    case -31: return "LIBSSH2_ERROR_SFTP_PROTOCOL"; 
    case -32: return "LIBSSH2_ERROR_REQUEST_DENIED"; 
    case -33: return "LIBSSH2_ERROR_METHOD_NOT_SUPPORTED"; 
    case -34: return "LIBSSH2_ERROR_INVAL"; 
    case -35: return "LIBSSH2_ERROR_INVALID_POLL_TYPE"; 
    case -36: return "LIBSSH2_ERROR_PUBLICKEY_PROTOCOL"; 
    case -37: return "LIBSSH2_ERROR_EAGAIN"; 
    case -38: return "LIBSSH2_ERROR_BUFFER_TOO_SMALL"; 
    case -39: return "LIBSSH2_ERROR_BAD_USE"; 
    case -40: return "LIBSSH2_ERROR_COMPRESS"; 
    case -41: return "LIBSSH2_ERROR_OUT_OF_BOUNDARY"; 
    case -42: return "LIBSSH2_ERROR_AGENT_PROTOCOL"; 
    case -43: return "LIBSSH2_ERROR_SOCKET_RECV"; 
    case -44: return "LIBSSH2_ERROR_ENCRYPT"; 
    case -45: return "LIBSSH2_ERROR_BAD_SOCKET"; 
    case -46: return "LIBSSH2_ERROR_KNOWN_HOSTS"; 
    case -47: return "LIBSSH2_ERROR_CHANNEL_WINDOW_FULL"; 
    case -48: return "LIBSSH2_ERROR_KEYFILE_AUTH_FAILED"; 
    case -49: return "LIBSSH2_ERROR_RANDGEN"; 
    case -50: return "LIBSSH2_ERROR_MISSING_USERAUTH_BANNER";
    case -51: return "LIBSSH2_ERROR_ALGO_UNSUPPORTED";
    default: return "LIBSSH2_ERROR_GENERIC";
    }
}
/**
 * @brief Non-blocking util, waits for the socket to be ready 
 * for read or write operation, associated to some libssh2 methods 
 * based on system call select().
 * 
 * @param socket_fd socket file descriptor
 * @param session libssh2 session object
 * @return int, -1 if error
 */
static int waitsocket(int socket_fd, LIBSSH2_SESSION *session)
{
    struct timeval timeout;
    int rc;
    fd_set fd;
    fd_set *writefd = NULL;
    fd_set *readfd = NULL;
    int dir;

    timeout.tv_sec = 10;
    timeout.tv_usec = 0;

    FD_ZERO(&fd);

    FD_SET(socket_fd, &fd);

    // now make sure we wait in the correct direction
    // eiher read or write  
    dir = libssh2_session_block_directions(session);
    if(dir & LIBSSH2_SESSION_BLOCK_INBOUND) readfd = &fd;
    if(dir & LIBSSH2_SESSION_BLOCK_OUTBOUND) writefd = &fd;

    /**
     * select() waits until the socket is ready to send or receive
     * data without making the thread wait for I/O, the returns
     */
    //printf("waiting on socket\n");
    rc = select(socket_fd + 1, readfd, writefd, NULL, &timeout);

    return rc;
}

/**
 * @brief Create system sockets, bind to the SSH server, start 
 * libSSH2 session
 * 
 * @param hostname 
 * @param port 
 * @param sock return pointer to the socket descriptor
 * @param session return pointer to libssh2 session 
 * @return return code 
 */
static int init_connection(char *hostname, char *port, int *sock, LIBSSH2_SESSION **session, char **output) {
    struct addrinfo *res = NULL;
    // init libSSH2
    int rc = libssh2_init(0);
    if(rc != 0) {
        *output = get_libssh2_error(rc);
        return rc;
    }
    
    // establish the socket connection with the SSH server
    // AF_INET = IPv4 -> not compatible with IPv6
    *sock = socket(AF_INET, SOCK_STREAM, 0);
    // get the server address 
    if(getaddrinfo(hostname, port, NULL, &res)) {
        *output = "SSH_UTILS_ERROR: can't get address for given host";
        return -1;
    }
    // struct sockaddr_in *p = (struct sockaddr_in *)res->ai_addr;
    // char str[256];
    //printf("found: %s\n", inet_ntop(AF_INET, &p->sin_addr, str, sizeof(str)));

    if(connect(*sock, res->ai_addr, sizeof(struct sockaddr)) != 0) {
        *output = "SSH_UTILS_ERROR: can't get connect to host";
        return -1;
    }

    /* Create a session instance */
    *session = libssh2_session_init();
    if(!*session) {
        *output = "LIBSSH2_ERROR_SESSION_INIT_FAILED";
        return -1;
    }

    /* tell libssh2 we want it all done non-blocking */
    libssh2_session_set_blocking(*session, 0);

    /* ... start it up. This will trade welcome banners, exchange keys,
     * and setup crypto, compression, and MAC layers
     */
    while((rc = libssh2_session_handshake(*session, *sock)) ==
           LIBSSH2_ERROR_EAGAIN);
    if(rc) {
        *output = get_libssh2_error(rc);
        return rc;
    }

    return 0;
}

/**
 * close the socket and terminare libssh2 session
 */
static void cleanup(int sock, LIBSSH2_SESSION *session) {
    close(sock);
    int rc;
    while((rc = libssh2_session_disconnect(session, "SSH session disconected")) == LIBSSH2_ERROR_EAGAIN);
    while((rc = libssh2_session_free(session)) == LIBSSH2_ERROR_EAGAIN);
    libssh2_exit();
}

/**
 * exported function. desc in .h
 */
int exec(char *hostname, char *port, char *username, char *priv_key,
char *password, char *commandline, char **output) {
    // variables init
    int sock;
    //const char *fingerprint;
    LIBSSH2_SESSION *session;
    LIBSSH2_CHANNEL *channel;
    int rc;

    // establish the SSH2 connection
    if((rc = init_connection(hostname, port, &sock, &session, output))) return rc;
    // authenticate. priority is given to key. 
    // if keypath is set, argument (password) is used as the key passphrase
    if(strlen(priv_key) != 0) {
        char pub_key[strlen(priv_key)+4];
        memcpy(pub_key,priv_key,strlen(priv_key)+1);
        strncat(pub_key, ".pub", 5);

        // check if keys exist
        if (access(pub_key, F_OK) != 0 || access(priv_key, F_OK) != 0) {
            *output = "SSH_UTILS_ERROR: can't find private or public key";
            return -1;
        }
        //printf("pub: %s, priv: %s\n", pub_key, priv_key);
        while((rc = libssh2_userauth_publickey_fromfile(session, username,
                                                         pub_key,
                                                         priv_key,
                                                         password)) ==
               LIBSSH2_ERROR_EAGAIN);
        if(rc) {
            *output = get_libssh2_error(rc);
            cleanup(sock, session);
            return rc;
        }
    } 
    else if(strlen(password) != 0) {
        /* Authenticate via password */
        while((rc = libssh2_userauth_password(session, username, password)) ==
                LIBSSH2_ERROR_EAGAIN);
        if(rc) {
            *output = get_libssh2_error(rc);
            cleanup(sock, session);
            return rc;
            }
    }
    else {
        *output = "SSH_UTILS_ERROR: key or password must be speficied";
        cleanup(sock, session);
        return -1;
    }

    // now exec command on host - use waitsocket when receiving LIBSSH2_ERROR_EAGAIN
    // since we are non-blocking
    while((channel = libssh2_channel_open_session(session)) == NULL &&
          libssh2_session_last_error(session, NULL, NULL, 0) ==
          LIBSSH2_ERROR_EAGAIN) {
        waitsocket(sock, session);
    }
    if(channel == NULL) {
        *output = "LIBSSH2_ERROR_CHANNEL_INIT_FAILED";
        cleanup(sock, session);
        return -1;
    }
    while((rc = libssh2_channel_exec(channel, commandline)) ==
           LIBSSH2_ERROR_EAGAIN) {
        waitsocket(sock, session);
    }
    if(rc != 0) {
        *output = get_libssh2_error(rc);
        cleanup(sock, session);
        return rc;
    }

    // read command output
    char out[1]; // collect both stdout and stderr here
    char buffer[0x4000];
    char buffer_stderr[0x4000];
    int nbytes = libssh2_channel_read(channel, buffer, sizeof(buffer));
    int nbytes_stderr = libssh2_channel_read_stderr(channel, buffer_stderr, sizeof(buffer_stderr));
    //printf("nbytes: %d , nbyteserr %d\n", nbytes, nbytes_stderr);
    while(nbytes != 0 || nbytes_stderr != 0) { // exit no more bytes to read in both streams
        /* loop until we block */
        //printf("inloop\n");
        while(nbytes > 0 || nbytes_stderr > 0) { // receiving!
            //printf("reading\n");
            int i;
            for(i = 0; i < nbytes; ++i) {
                strncat(out, &buffer[i],1);
            }
                
            for(i = 0; i < nbytes_stderr; ++i) {
                strncat(out, &buffer_stderr[i],1);
            }    


            nbytes = libssh2_channel_read(channel, buffer, sizeof(buffer));
            nbytes_stderr = libssh2_channel_read_stderr(channel, buffer_stderr, sizeof(buffer_stderr));
        }
        
        if(nbytes == LIBSSH2_ERROR_EAGAIN || nbytes_stderr == LIBSSH2_ERROR_EAGAIN) { // socket busy, retry
            //printf("socket\n");
            waitsocket(sock, session);
            nbytes = libssh2_channel_read(channel, buffer, sizeof(buffer));
            nbytes_stderr = libssh2_channel_read_stderr(channel, buffer_stderr, sizeof(buffer_stderr));
            //printf("nbytes: %d , nbyteserr %d\n", nbytes, nbytes_stderr);
        }
        else if (nbytes < 0) { // error in the channel_read method
            *output = get_libssh2_error(nbytes);
            cleanup(sock, session);
            return nbytes;
        }
        else if (nbytes_stderr < 0) {
            *output = get_libssh2_error(nbytes_stderr);
            cleanup(sock, session);
            return nbytes_stderr;
        }
    }

    // assign pointer to output return argument
    *output = out;

    // close channel
    while((rc = libssh2_channel_close(channel)) == LIBSSH2_ERROR_EAGAIN)
        waitsocket(sock, session);

    // get exit code or exit signal
    int exitcode = libssh2_channel_get_exit_status(channel);
    char *exitsignal = (char *)"none";
    libssh2_channel_get_exit_signal(channel, &exitsignal,
                                        NULL, NULL, NULL, NULL, NULL);

    if(exitsignal) {
        //fprintf(stderr, "\nSignal received: %s\n", exitsignal);
        return 12345;
    }
    else {
        //fprintf(stdout, "\nEXIT: %d\n", exitcode);
        return exitcode;
    }
    // successfully executed remote command, cleanup
    libssh2_channel_free(channel);
    channel = NULL;
    cleanup(sock, session);

    return 0;

}