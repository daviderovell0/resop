/**
 * Series of test cases for the scp_send functions
 * SSH input credentials must be valid
 * src and dst must be valid paths
 */
#include <iostream>
#include <assert.h>
#include <string.h>
#include "../ssh_utils_lib.h"

using namespace std;

void test_scp_send(char *hostname, char *port, char *username, char *private_key,
char *password, char *source, char *dest) {
    char *output;
    int rc;


    cout << "\n***Testing correct functioning" << endl;
    rc = scp_send(hostname, port, username, private_key, 
    password, source, dest, &output);
    assert(rc == 0);
    assert(strlen(output) != 0);
    cout << ">" << output << endl;
    cout << "!!verify that the file " << source << " was sent to " 
    << dest << " on " << hostname << endl; 

    cout << "\n***Testing non-existing source file" << endl;
    char bad_source[] = "fake/file";
    rc = scp_send(hostname, port, username, private_key, 
    password, bad_source, dest, &output);
    assert(rc == -1);
    assert(strcmp(output, "File not found"));

    cout << "\n***Testing non-existing remote path" << endl;
    char bad_dest[] = "/non/existing/path123/test.txt";
    rc = scp_send(hostname, port, username, private_key, 
    password, source, bad_dest, &output);
    assert(rc == -28);
    assert(strcmp(output, "failed to send file\n" ));
        
    cout << "\n***all tests passed." << endl;
}