{
  "targets": [
    {
      "target_name": "ssh_utils",
      "cflags_cc": [ "-fno-exceptions", "-Wall", ],
      "sources": [ "src/backend/addons/ssh_utils_napi.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'dependencies': [
          'ssh_utils_lib',
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    },
    {
      "target_name": "ssh_utils_lib",
      'type': '<(library)',
      "sources": ["/src/backend/addons/ssh_utils_lib.c"],
      "cflags": [ "-Wall", " -Wno-unused-function" ],
      'link_settings': {
        'libraries': ['-lssh2', '-lcrypto'], 
      },
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    }
  ]
}
