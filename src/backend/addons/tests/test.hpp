/**
 * @file test.hpp
 * @author daviderovell0
 * @brief header file to group function from all cpp tests
 * 
 */

void test_exec(char *hostname, char *port, char *username, char *private_key,
char *password, char *commandline);

void test_scp_recv(char *hostname, char *port, char *username, char *private_key,
char *password, char *source, char *dest);

void test_scp_send(char *hostname, char *port, char *username, char *private_key,
char *password, char *source, char *dest);