#include <iostream>
#include "../ssh_utils_lib.h"

using namespace std;
int test_exec(char *hostname, char *port, char *username, char *private_key,
char *password, char *commandline) {
    char *output;
    int rc;

    rc = exec(hostname, port, username, private_key, password,
    commandline, &output);

    cout << "exit code: " << rc << endl;
    cout << "output: " << output << endl;
}