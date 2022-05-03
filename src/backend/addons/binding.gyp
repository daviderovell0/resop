{
  "targets": [
    {
      "target_name": "ssh_utils",
      "cflags_cc!": [ "-fno-exceptions", "-Wall" ],
      "sources": [ "ssh_utils_napi.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'dependencies': [
          'ssh_utils_lib',
      ],
    },
    {
      "target_name": "ssh_utils_lib",
      'type': '<(library)',
      "sources": ["ssh_utils_lib.c"],
      "cflags!": [ "-Wall" ],
      'link_settings': {
        'libraries': ['-lssh2', '-lcrypto'], 
      },
    }
  ]
}
