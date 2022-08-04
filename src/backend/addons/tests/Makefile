CC = gcc
CXX = g++
CFLAGS = -O0 -g -Wall
LFLAGS = -lssh2 -lcrypto


ssh_utils_lib: ../ssh_utils_lib.c
	${CC} ${CFLAGS} -c ../ssh_utils_lib.c 

exec: exec.cpp
	${CXX} ${CFLAGS} -c exec.cpp -o exec.o

scp_recv: scp_recv.cpp
	${CXX} ${CFLAGS} -c scp_recv.cpp -o scp_recv.o

scp_send: scp_send.cpp
	${CXX} ${CFLAGS} -c scp_send.cpp -o scp_send.o

test: test.cpp
	${CXX} ${CFLAGS} test.cpp -o test.o exec.o scp_recv.o scp_send.o ssh_utils_lib.o ${LFLAGS}

all: ssh_utils_lib exec scp_recv scp_send test