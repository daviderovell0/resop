## Credits
Vagrant cluster taken and re-adapted from cluening/vagrantcluster -> https://github.com/cluening/vagrantcluster. Credits and big thanks to cluening

+++ Original README +++

Virtual HPC Cluster
===================

This repository contains the framework for a very basic HPC cluster based on Vagrant, Ansible, and OpenHPC.  It is just enough to build four nodes, a frontend, and a master node on your laptop or desktop system.  From there, you can customize it however you wish!

Getting Started
---------------

1. Install Vagrant: https://www.vagrantup.com/
1. Clone this repository
1. Run the `gensshkeys.sh` script to generate ssh keys in the ansible repository
1. (Optional) Copy `localenv.sh.in` to `localenv.sh` and populate it with any local environment variables you need during the vagrant provisioning step (HTTP proxy information, for example)
1. Run `vagrant up` to fire up the cluster
1. Once the cluster is booted, you can run `vagrant ssh master` to log in to the master node, or `vagrant ssh fe1` to log in to the frontend
1. Run `sinfo` on the frontend or master node to see if Slurm sees that your nodes are up.  If they are not, run `sudo scontrol update nodename=node[01-04] state=resume` to wake them up.
1. Start using your cluster!  At this point, you should be able to run a simple test across the cluster (`srun -N 4 /bin/hostname`) or run some more complex jobs.
1. When you are done, shut down your cluster by logging out of it and running `vagrant halt`.
1. If you want to completely rebuild your cluster, run `vagrant destroy`, and then run `vagrant up` again.

A note on security
------------------
This virtual cluster is built around convenience, not security.  It uses Vagrant's default ssh keys for convenience, and it contains some private keys (for munge, for example).  This is good enough to run on an isolated desktop or laptop for experimentation, but you shouldn't plan to base an actual cluster configuration on its ansible repository without doing a good security sanity check.


+++ Additions +++
## resop dev
 There are 2 options: (1) the API can be run on the local machine and access the VM cluster "remotely" or (2) run the API directly from the cluster.
### 1
- configure the API .env to connect to the frontend node, using the `vagrant` user that already has sudo rights. `vagrant ssh-config` can generate the configuration to be copied to the local SSH configuration.
### 2
The API is deployed on the frontend node **fe1** and deployed autmatically with the cluster. Extra steps
- create the API database (instructions in the API docs-Install) @TODO automatize
- set the .env file with vagrant as *CLUSTER_USER* (instructions in the API docs-Deploy)
- access the API at port `3300` from your local machine
#### useful commands
- to copy modified files (including ansible playbooks, as they are executed *from within* the cluster) to the cluster without rebooting the VMs -> `vagrant rsync` or `vagrant rsync fe1` for the API only.
- to run ansible (only) -> `vagrant provision` or `vagrant provision fe1` for the API only.
- `vagrant rsync-auto fe1` to keep copying the modified files while developing. Can be used in combination with `nodemon` for instant changes.

## HPC cluster config
- Nodes: master, fe, node[01-04]
- Shared NFS folder mounted on *fe1*: `/home`
- shared SSH keys for passwordless access among all nodes
- NTP config
- Slurm (+munge): master=controller, node[01,04] = compute nodes.
- Users: [user1, pwd=user1], [user2, pwd=user2], [vagrant (sudo), nopasswd]

OpenHPC Packages:
- clustershell (master)
- openmpi
- gnu-compilers
- module

## Credits
Vagrant cluster taken and re-adapted from cluening/vagrantcluster -> https://github.com/cluening/vagrantcluster. Credits and big thanks to cluening