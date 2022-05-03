/**
 * @file test.hpp
 * @author daviderovell0
 * @brief header file to group function from all cpp tests
 * 
 */

int test_scp_recv(char *hostname, char *port, char *username, char *private_key,
char *password, char *source, char *dest);

int test_scp_send(char *hostname, char *port, char *username, char *private_key,
char *password, char *source, char *dest);