#include <iostream>
#include <assert.h>
#include <string.h>
#include <stdlib.h> 
#include "../ssh_utils_lib.h"

using namespace std;

void test_exec(char *hostname, char *port, char *username, char *private_key,
char *password, char *commandline) {
    char *output;
    int rc;

    cout << "\n***Testing correct functioning" << endl;
    rc = exec(hostname, port, username, private_key, password,
    commandline, &output);
    assert(rc == 0);
    assert(strlen(output) != 0);
    string o = output; // assign to C++ string before losing value
    free(output);
    cout << "exit code: " << rc << endl;
    cout << "output: " << o << endl;  
}