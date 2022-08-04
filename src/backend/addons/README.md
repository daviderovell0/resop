## SSH utilities function - libssh2 C library binding to NodeJS

This folder contains a library of SSH protocol functions used by resop backend for operations on the remote server via SSH.
The library uses the libssh2 C library. It is exported to NodeJS as an npm module using the node-addon-api. 
The compilation is made with GYP and automatically run with `npm install` alongside the binding.

- ssh_utils_lib.c/h: C functions implementing SSH operations via libssh2
- ssh_utils_napi.cpp: C++ wrapper exposing SSH functions to node
- binding.gyp: build and binding instructions for node
- package.json: local npm config for testing
- tests/: folder containing tests for ssh_utils_lib and node

### run tests

There are direct tests on the library in C++ targeting lib_ssh_utils.c/h only and Node tests testing the whole module.

#### C++ tests for lib_ssh_utils
```sh
cd tests
make all
```
See tests available in test.cpp. All tests use configuration variables provided in a file called `variable.txt`. Make sure 
to create `variable.txt` from `variable.txt.example` then populate it with valid credentials.

Run as follows:
```sh
./test.o exec
#or
./test.o connect
....
```

Install and run with valgrind for debugging info.
```sh
valgrind ./test.o exec
#or
valgrind ./test.o connect
....
```
#### Node tests 
on this folder:
```js
npm install
```
then run the test file:
```
cd tests
node test.js
```