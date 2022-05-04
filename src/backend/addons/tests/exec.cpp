/**
 * Series of test cases for the scp_recv functions
 * SSH input credentials must be valid
 * commandline must be a valid command
 */
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

    cout << "\n***Testing bad shell command" << endl;
    char bad_command[] = "nonexisingcommand";
    rc = exec(hostname, port, username, private_key, password,
    bad_command, &output);
    cout << "output: " << output << endl;
    assert(rc > 0);
    free(output);
    //assert(strlen(output) != 0);

    cout << "\n***Testing empty command should give 0" << endl;
    char empty[] = "";
    rc = exec(hostname, port, username, private_key, password,
    empty, &output);
    cout << "output: " << output << endl;
    cout << "exit code: " << rc << endl;    
    assert(rc == 0);
    free(output);

    cout << "\n***Testing error - wrong password" << endl;
    char wrong_pwd[] = "badpwdmaybe?"; 
    rc = exec(hostname, port, username, empty, wrong_pwd,
    commandline, &output);
    cout << "output: " << output << endl;
    cout << "exit code: " << rc << endl;    
    assert(rc == -18);
    free(output);

    cout << "\n***Testing error - wrong hostname" << endl;
    char wrong_hn[] = "nonawebhostname"; 
    rc = exec(wrong_hn, port, username, private_key, password,
    commandline, &output);
    cout << "output: " << output << endl;
    cout << "exit code: " << rc << endl;    
    assert(rc == -1);
    free(output);


    cout << "\n***Testing error - no password or private key" << endl;
    rc = exec(hostname, port, username, empty, empty,
    commandline, &output);
    cout << "output: " << output << endl;
    cout << "exit code: " << rc << endl;    
    assert(rc == -1);
    free(output);

    cout << "\n**All tests passed" << endl;
}