#define _GNU_SOURCE
#include <stdio.h>
#include "ssh_utils_lib.h"
#include <libssh2.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <string.h>
#include <netdb.h>
#include <sys/select.h>
#include <unistd.h>
#include <time.h>
#include <stdlib.h>

/**
 * @brief returns the string corresponding to the libssh2 error code
 * error coded taken from libssh2.h
 * 
 * @note use libssh2_session_last_error for more explanatory
 * string
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
 * safely copy the error message in output checking whether
 * it's malloc'd or not. Both cases are possible depending
 * on the parent function: 
 * exec->malloc's output,
 * others->null pointer to be filled with string literal
 * 
 * if message is NULL, the function will use the libssh2 
 * session error
 */
static void set_error(char *message, char **output, LIBSSH2_SESSION *session) {
    char *err;

    if (message == NULL) {
        libssh2_session_last_error(session, &err, NULL, 0);
        //printf("%s\n",err);
    }
    else err = message;


    // if output is a null pointer
    // it means it's not malloc'd
    if(*output == NULL) {
        *output = err;
    }
    else {
        // we assume that output is large enough
        strncpy(*output,err,strlen(err));
    }
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
 * @brief Create system sockets, bind to the SSH server, start 
 * libSSH2 session
 * 
 * @param hostname 
 * @param port 
 * @param username remote host SSH username
 * @param priv_key local private key associated to the remote cluster.
 * public key is <priv_key>.pub
 * @param password remote cluster SSH password
 * @param sock return pointer to the socket descriptor
 * @param session return pointer to libssh2 session 
 * @param output
 * @return return code 
 */
static int sshconnect(char *hostname, char *port, char *username, 
char *priv_key, char *password, int *sock, LIBSSH2_SESSION **session, 
char **output) {
    struct addrinfo *res = NULL;
    // init libSSH2
    int rc = libssh2_init(0);
    if(rc != 0) {
        set_error(NULL,  output, *  session);
        return rc;
    }
    
    // establish the socket connection with the SSH server
    // AF_INET = IPv4 -> not compatible with IPv6
    *sock = socket(AF_INET, SOCK_STREAM, 0);
    // get the server address 
    if(getaddrinfo(hostname, port, NULL, &res)) {
        // char *err = "SSH_UTILS_ERROR: can't get address for given host";
        // strncpy(*output,err,strlen(err));
        set_error("SSH_UTILS_ERROR: can't get address for given host",
                    output, *session);
        return -1;
    }
    // struct sockaddr_in *p = (struct sockaddr_in *)res->ai_addr;
    // char str[256];
    // printf("found: %s\n", inet_ntop(AF_INET, &p->sin_addr, str, sizeof(str)));


    if(connect(*sock, res->ai_addr, sizeof(struct sockaddr)) != 0) {
        // char *err = "SSH_UTILS_ERROR: can't connect to host. wrong hostname or port?";
        // strncpy(*output,err,strlen(err));
        set_error("SSH_UTILS_ERROR: can't connect to host. wrong hostname or port?",
                    output, *session);
        return -1;
    }

    /* Create a session instance */
    *session = libssh2_session_init();
    if(!*session) {
        set_error(NULL, output, *session);
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
        set_error(NULL, output, *session);
        return rc;
    }

    // authenticate. priority is given to key. 
    // if keypath is set, argument (password) is used as the key passphrase
    if(strlen(priv_key) != 0) {
        char pub_key[strlen(priv_key)+4];
        memcpy(pub_key,priv_key,strlen(priv_key)+1);
        strncat(pub_key, ".pub", 5);

        // check if keys exist
        if (access(pub_key, F_OK) != 0 || access(priv_key, F_OK) != 0) {
            set_error("SSH_UTILS_ERROR: can't find private or public key", output, *session);
            return -1;
        }
        //printf("pub: %s, priv: %s\n", pub_key, priv_key);
        while((rc = libssh2_userauth_publickey_fromfile(*session, username,
                                                         pub_key,
                                                         priv_key,
                                                         password)) ==
               LIBSSH2_ERROR_EAGAIN);
        if(rc) {
            set_error(NULL, output, *session);
            cleanup(*sock, *session);
            return rc;
        }
    } 
    else if(strlen(password) != 0) {
        /* Authenticate via password */
        while((rc = libssh2_userauth_password(*session, username, password)) ==
                LIBSSH2_ERROR_EAGAIN);
        if(rc) {
            // libssh2_session_last_error(*session,output, NULL, 0);
            // cleanup(*sock, *session);
            set_error(NULL,  output, *session);
            return rc;
            }
    }
    else {
        //char *err = "SSH_UTILS_ERROR: key or password must be speficied";
        set_error("SSH_UTILS_ERROR: key or password must be speficied", output, *session);
        cleanup(*sock, *session);
        return -1;
    }

    return 0;
}


//// exported functions. desc in .h /////



int exec(char *hostname, char *port, char *username, char *priv_key,
char *password, char *commandline, char **output) {
    
    // allocate output to be filled with ${commandline} output or err message
    int output_size = 1024*1024; //start with 1MB (~27000 lines)
    int output_size_limit = output_size*32; // put a limit on 32MB to avoid dumping mem
    *output = (char *)malloc(output_size * sizeof(char)); // collect both stdout and stderr here
    *output[0] = '\0';
    // variables init
    int sock;
    //const char *fingerprint;
    LIBSSH2_SESSION *session;
    LIBSSH2_CHANNEL *channel;
    int rc;

    // establish the SSH2 connection
    if((rc = sshconnect(hostname, port, username, priv_key, password,
     &sock, &session, output))) 
        return rc;

    // now exec command on host - use waitsocket when receiving LIBSSH2_ERROR_EAGAIN
    // since we are non-blocking
    while((channel = libssh2_channel_open_session(session)) == NULL &&
          libssh2_session_last_error(session, NULL, NULL, 0) ==
          LIBSSH2_ERROR_EAGAIN) {
        waitsocket(sock, session);
    }
    if(channel == NULL) {
        set_error(NULL,  output, session);
        cleanup(sock, session);
        return -1;
    }
    while((rc = libssh2_channel_exec(channel, commandline)) ==
           LIBSSH2_ERROR_EAGAIN) {
        waitsocket(sock, session);
    }
    if(rc != 0) {
        set_error(NULL,  output, session);
        cleanup(sock, session);
        return rc;
    }

    // read command output
    char buffer[0x4000];
    char buffer_stderr[0x4000];
    int nbytes = libssh2_channel_read(channel, buffer, sizeof(buffer));
    int nbytes_stderr = libssh2_channel_read_stderr(channel, buffer_stderr, sizeof(buffer_stderr));

    while(nbytes != 0 || nbytes_stderr != 0) { // exit no more bytes to read in both streams
        /* loop until we block */
        //printf("inloop\n");

        while(nbytes > 0 || nbytes_stderr > 0) { // receiving!
            // printf("%d\n", nbytes_stderr);
            // printf("%p\n", output);
            // check if we overflow init buffer size and reallocate
            if ((int)strlen(*output) + nbytes > output_size || (int)strlen(*output) + nbytes_stderr > output_size) {
                printf("Reallocating output string size\n");
                output_size = output_size*2;
                if (output_size >= output_size_limit) {
                    printf("Reached the output size limit, interrupting read...\n");
                    nbytes = 0;
                    nbytes_stderr = 0;
                    break;
                }

                char *new_output = (char *)malloc(output_size * sizeof(char));
                new_output[0] = '\0';
                strncat(new_output, *output, strlen(*output));
                free(*output);
                *output = new_output;
                continue;
            }

            strncat(*output, buffer, nbytes);
            strncat(*output, buffer_stderr,nbytes_stderr);

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
            set_error(NULL,  output, session);
            cleanup(sock, session);
            return nbytes;
        }
        else if (nbytes_stderr < 0) {
            set_error(NULL,  output, session);
            cleanup(sock, session);
            return nbytes_stderr;
        }
    }

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


int scp_recv(char *hostname, char *port, char *username, char *priv_key,
char *password, char *src, char *dst, char **output) {
    // variables init
    int sock;
    //const char *fingerprint;
    LIBSSH2_SESSION *session;
    LIBSSH2_CHANNEL *channel;
    libssh2_struct_stat fileinfo;
    char *dst_formatted = dst;
    int dst_owner = 0;
    int rc;

    // if it's a dir we will keep the name of the source file
    if(!stat(dst, &fileinfo)  && S_ISDIR(fileinfo.st_mode)) {
        char *remote_filename;
        int index_of_last_slash = 0;
        // find last "/" in the source remote path
        // if not present take it all
        for (int i = strlen(src)-1; i >= 0; i--) {
            if (src[i] == '/') {
                index_of_last_slash = i;
            }
        }
              
        remote_filename = src + index_of_last_slash;
        printf("extracted filename: %s\n", remote_filename);
        dst_owner = 1;
        dst_formatted = (char *)malloc((strlen(dst) + strlen(remote_filename))*sizeof(char)+1);
        dst_formatted[0] = '\0'; // make sure pointer is null

        strncat(dst_formatted, dst, strlen(dst));
        strncat(dst_formatted, remote_filename, strlen(remote_filename));
        dst_formatted[strlen(dst) + strlen(remote_filename)] = '\0';
        printf("new dest: %s\n", dst_formatted);
    }

    // establish the SSH2 connection
    if((rc = sshconnect(hostname, port, username, priv_key, password, 
    &sock, &session, output))) return rc;

    while((channel = libssh2_scp_recv2(session, src, &fileinfo)) == NULL &&
          libssh2_session_last_error(session, NULL, NULL, 0) ==
          LIBSSH2_ERROR_EAGAIN) {
        waitsocket(sock, session);
    }
    if(channel == NULL) {
        set_error(NULL,  output, session);
        cleanup(sock, session);
        return LIBSSH2_ERROR_SCP_PROTOCOL;
    }

    // open file AFTER making sure there's no errors in the 
    // connection and channel process - i.e. if bad remote
    // path is given. otherwise content erased for nothing
    FILE *localfile = fopen(dst_formatted, "wb");
    if(!localfile) {
        fprintf(stderr, "Can't open %s - wrong path?\n", dst_formatted);
        asprintf(output, "Can't open %s - wrong path?\n", dst_formatted);
        return -1;
    }

    libssh2_struct_stat_size bytes_read = 0;
    libssh2_struct_stat_size total = 0;
    while(bytes_read < fileinfo.st_size) {
        char buf[1024]; // read 1k at a time
        int rc;
        int amount = sizeof(buf);
        // channel_read reads an extra byte at the end of the file
        // this prevents it...
        if((fileinfo.st_size -bytes_read) < amount) {
            amount = (int)(fileinfo.st_size - bytes_read);
        }

        while((rc = libssh2_channel_read(channel, buf, amount)) > 0) {
            //printf("bytes read: %d\n", rc);
            //write(1, buf, rc);    
            fwrite(buf, sizeof(char), rc, localfile);
            bytes_read += rc;
            total += rc;
            
            if((fileinfo.st_size -bytes_read) < amount) {
                amount = (int)(fileinfo.st_size - bytes_read);
            }
        }

        // socket busy, retry
        // only if we are not finished yet, otherwise we wait for nothing
        if((rc == LIBSSH2_ERROR_EAGAIN) && bytes_read < fileinfo.st_size) { 
            waitsocket(sock, session); 
            continue;
        }
        if (rc < 0 && rc != LIBSSH2_ERROR_EAGAIN) { // error in the channel_read method
            set_error(NULL,  output, session);
            fclose(localfile);
            remove(dst_formatted); // delete, file is corrupted as we didn't finish reading
            cleanup(sock, session);
            return rc;
        }
    }
    // successfully run scp, cleanup & return
    fclose(localfile);
    if(dst_owner) free(dst_formatted);
    
    // close channel
    while((rc = libssh2_channel_close(channel)) == LIBSSH2_ERROR_EAGAIN)
        waitsocket(sock, session);

    libssh2_channel_free(channel);
    channel = NULL;
    cleanup(sock, session);

    // format string and assign to output
    asprintf(output, "Received %ld bytes", (long)total);
    return 0;
}


int scp_send(char *hostname, char *port, char *username, char *priv_key,
char *password, char *src, char *dst, char **output) {
    // variables init
    int sock;
    //const char *fingerprint;
    LIBSSH2_SESSION *session;
    LIBSSH2_CHANNEL *channel;
    struct stat fileinfo;
    int rc;

    FILE *localfile = fopen(src, "rb");
    if(!localfile) {
        fprintf(stderr, "File %s not found\n", src);
        asprintf( output, "File %s not found\n", src);
        return -1;
    }
    // get file attributes
    stat(src, &fileinfo);

    // establish the SSH2 connection
    if((rc = sshconnect(hostname, port, username, priv_key, password, 
    &sock, &session, output))) return rc;

    while((channel = libssh2_scp_send64(session, dst, fileinfo.st_mode & 0777, 
    (unsigned long)fileinfo.st_size, 0, 0)) == NULL &&
          libssh2_session_last_error(session, NULL, NULL, 0) ==
          LIBSSH2_ERROR_EAGAIN) {
        waitsocket(sock, session);
    }
    if(channel == NULL) {
        set_error(NULL,  output, session);
        cleanup(sock, session);
        return LIBSSH2_ERROR_SCP_PROTOCOL;
    }

    long total = 0;
    size_t bytes_read = 0;
    char buf[1024]; // read 100k at a time
    // read until no more bytes = EOF
    time_t start = time(NULL);
    while((bytes_read = fread(buf, 1, sizeof(buf), localfile)) > 0) {
        char *pointer = buf; 
        int bytes_towrite = bytes_read;
        total += bytes_read;
        //printf("%s\n",buf);
        // have to loop because channel_write might not
        // write all at once. loop until written bytes = bytes previously read
        while(bytes_towrite > 0) {
            while((rc = libssh2_channel_write(channel, pointer, bytes_towrite)) == 
                LIBSSH2_ERROR_EAGAIN ) {
                    waitsocket(sock, session);
            }
            if(rc < 0) {
                set_error(NULL,  output, session);
                cleanup(sock, session);
                return rc;
            }
            //printf("%s\n",pointer);
            
            bytes_towrite -= rc;
            pointer += rc;
        }
    }
    int duration = (int)(time(NULL)-start);

    //fprintf(stderr, "Sending EOF\n");
    while(libssh2_channel_send_eof(channel) == LIBSSH2_ERROR_EAGAIN);
    //fprintf(stderr, "Waiting for EOF\n");
    while(libssh2_channel_wait_eof(channel) == LIBSSH2_ERROR_EAGAIN);
    //fprintf(stderr, "Waiting for channel to close\n");
    while((rc = libssh2_channel_close(channel)) == LIBSSH2_ERROR_EAGAIN)
        waitsocket(sock, session);


    // successfully run scp, cleanup & return
    libssh2_channel_free(channel);
    channel = NULL;
    cleanup(sock, session);
    // format string and assign to output
    asprintf(output, "Sent %ld bytes in %ds", (long)total, duration);
    return 0;
}