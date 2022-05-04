/**
 * @file test.cpp
 * @author daviderovell0
 * @brief Launcher for tests of ssh_utils_lib
 * 
 * reads variables.txt and launches the chosen test
 * - exec
 * - scp_recv
 * - scp_send
 * - all
 */
#include <iostream>
#include <fstream>
#include <string>
#include <string.h>
#include "test.hpp"

using namespace std;

int main(int argc, char *argv[]){
   fstream newfile;

    // needed variables
    string hostname, port, username, private_key, password, commandline;
    string remote_source, remote_dest, local_source, local_dest;

   newfile.open("variables.txt",ios::in);
   if (newfile.is_open()){   
      string tp;
      int var_count = 0;
      
      while(getline(newfile, tp)){ 
        int i = tp.find("=");
        string var = tp.substr(0,i);
        string val = tp.substr(i+1, tp.length());

        if(var == "HOSTNAME") hostname = val;
        else if (var == "PORT") port = val;
        else if (var == "USERNAME") username = val;
        else if (var == "PRIVATE_KEY") private_key = val;
        else if (var == "PASSWORD") password = val;
        else if (var == "COMMANDLINE") commandline = val;
        else if (var == "REMOTE_SOURCE") remote_source = val;
        else if (var == "REMOTE_DESTINATION") remote_dest = val;
        else if (var == "LOCAL_SOURCE") local_source = val;
        else if (var == "LOCAL_DESTINATION") local_dest = val;
        else {
            cout << "error: unrecognised variable " << var << " exiting\n";
            return -1;
        }
        
        var_count++;
        //cout << var << "-" << val << endl;
      }
      newfile.close(); //close the file object.

      if (var_count != 10) {
          cout << "some variables are missing, double check" << endl;
          return -1;
      }

      // launch tests
      if (argc != 2 ) {
          cout << "usage: test.o <test>, where test is one of: exec,"
          " scp_recv, scp_send" << endl;
          return -1;
      }

    //   if (strcmp(argv[1], "connect") == 0) {
    //       cout << "not yet implemented" << endl;
    //   }
     if (strcmp(argv[1], "exec") == 0) {
          test_exec(&hostname[0], &port[0], &username[0], &private_key[0],
          &password[0], &commandline[0]);
      }
      else if (strcmp(argv[1], "scp_recv") == 0) {
          test_scp_recv(&hostname[0], &port[0], &username[0], &private_key[0],
          &password[0], &remote_source[0], &local_dest[0] );
      }
      else if (strcmp(argv[1], "scp_send") == 0) {
         test_scp_send(&hostname[0], &port[0], &username[0], &private_key[0],
          &password[0], &local_source[0], &remote_dest[0]);
      }
      else {
          cout << "usage: test.o <test>, where test is one of: connect, exec,"
          " scp_recv, scp_send" << endl;
      }

   }
   else {
       cout << "couldn't open variables.txt" << endl;
       return -1;
   }

   return 0;
}