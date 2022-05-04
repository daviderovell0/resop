#include <napi.h>
#include <stdlib.h> 
#include <iostream>
#include "ssh_utils_lib.h"

using namespace std;

/**
 * @brief expose exec() C function from ssh_utils to NodeJS 
 * Form when exported:
 * exec({
 *     hostname: 'val',
 *     port: 'val',
 *     username: 'val',
 *     priv_key: 'val',
 *     password: 'val',
 *     commandline: 'val',
 * });
 * 
 * All keys and either priv_key or password must be specified.
 * If priv_key is specified, password is considered to be the private
 * key passphrase
 * 
 * @return Napi::String (JS string)
 */
Napi::Value Exec(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() != 1) {
        Napi::TypeError::New(env, "This function takes 1 JS object as arg")
        .ThrowAsJavaScriptException();
        return env.Null();
    }
    // cout << "type is: " << info[0].Type() << endl;

    if(!info[0].IsObject()) {
        Napi::TypeError::New(env, "exec() argument must be an object.")
        .ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Object args = info[0].ToObject();

    // check all the arg object has all the required fields and assign 
    // them to C++ strings for the exec function
    string args_error = "fields hostname, port, commandline, username, " 
                        "priv_key (and/or) password must be specified for exec()";

    if(args.Get("hostname").IsUndefined() || 
    args.Get("port").IsUndefined() || 
    args.Get("commandline").IsUndefined() ||
    args.Get("username").IsUndefined()) {
        
        Napi::Error::New(env, args_error)
        .ThrowAsJavaScriptException();
        return env.Null();
    }
    string hostname = args.Get("hostname").As<Napi::String>().Utf8Value();
    string port = args.Get("port").As<Napi::String>().Utf8Value();
    string username = args.Get("username").As<Napi::String>().Utf8Value();
    string commandline = args.Get("commandline").As<Napi::String>().Utf8Value();
    string priv_key = "";
    string password = "";

    if(args.Get("priv_key").IsUndefined() && args.Get("password").IsUndefined()) {
        Napi::Error::New(env, args_error)
        .ThrowAsJavaScriptException();
        return env.Null();
    } 
    if(!args.Get("password").IsUndefined()) { // if password defined
        password = args.Get("password").As<Napi::String>().Utf8Value();
        
    } 
    if(!args.Get("priv_key").IsUndefined()) { // if priv_key defined
        priv_key = args.Get("priv_key").As<Napi::String>().Utf8Value();
        
    } 
    // if both defined, password is used as priv_key passphrase

    char *output;
    int rc = exec(&hostname[0], 
                  &port[0], 
                  &username[0], 
                  &priv_key[0], 
                  &password[0], 
                  &commandline[0], 
                  &output);
    // since exec allocates output dyncamically, need to free it
    // first create a new C++ string with it
    string output_val = output;
    //free(output);

    cout << output_val;
    return Napi::Number::New(env, rc);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "exec"), Napi::Function::New(env, Exec));
  return exports;
}

NODE_API_MODULE(ssh_utils, Init)
