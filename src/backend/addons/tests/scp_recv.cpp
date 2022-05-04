/**
 * Series of test cases for the scp_recv functions
 * SSH input credentials must be valid
 * src and dst must be valid paths
 */
#include <iostream>
#include <assert.h>
#include <string.h>
#include <stdlib.h>
#include "../ssh_utils_lib.h"
#include "test.hpp"

using namespace std;
void test_scp_recv(char *hostname, char *port, char *username, char *private_key,
char *password, char *source, char *dest) {
    
    char *output;
    int rc;

    // 1
    cout << "***Testing correct functioning" << endl;
    rc = scp_recv(hostname, port, username, private_key, 
    password, source, dest, &output);
    //assert(rc == 0);
    //assert(strlen(output) != 0);
    cout << ">" << output << endl;
    cout << "!!verify that the file " << source << " on " <<
    hostname << " was copied to " << dest << " on localhost" 
    << endl;

    // 2 
    cout << "\n***Testing using source name if dest is a folder" << endl;
    char current_folder[] = "./";
    rc = scp_recv(hostname, port, username, private_key, 
    password, source, current_folder, &output);
    assert(rc == 0);
    assert(strlen(output) != 0);
    cout << ">" << output << endl;
    cout << "!!verify that the file " << source << " on " <<
    hostname << " was copied to " << "./" << endl;

    // testing returns correct error
    // 3
    cout << "\n***Testing non-existing remote file" << endl;
    char bad_source[] = "/fake/file/tt.txt";
    rc = scp_recv(hostname, port, username, private_key, 
    password, bad_source, dest, &output);
    assert(rc == -28);
    assert(strcmp(output, "Failed to recv file\n"));

    // 4
    cout << "\n***Testing non-existing local path" << endl;
    char bad_dest[] = "/non/existing/path123/test.txt";
    rc = scp_recv(hostname, port, username, private_key, 
    password, source, bad_dest, &output);
    assert(rc == -1);
    
    // done!
    cout << "\n**All tests passed" << endl;

}