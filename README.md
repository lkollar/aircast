# AirCast - Stream AirPlay audio to Chromecast devices


## Installation
Clone this repository, then
  
    npm install


## Usage

Start the server:

    node index.js
    
Your Chromecast devices should now show up as AirPlay receivers.

**NOTE this is alpha quality code. The basic streaming functionality works but
expect bugs. Certain features like handling multiple cast devices haven't 
been tested at all (I only have one Chromecast device). Pull requests and bug
reports are welcome.**

### Command line options

#### Overriding the HTTP server's address
AirCast will try to use the first external IP on the machine for the HTTP 
server for the audio stream. You can specify an IP or host name with the -i 
parameter.

The port for the stream is automatically allocated but you can specify it
manually with the -p argument.


## Platform specific notes

### Debian/Ubuntu

You will need the libavahi-compat-libdnssd-dev library to get mdns browsing
work.

    apt-get install libavahi-compat-libdnssd-dev

### FreeBSD

If node-gyp complains about missing c++0x support upgrade GCC to 4.9:

    pkg install gcc49
    setenv CXX /usr/local/bin/g++49  
    setenv CC /usr/local/bin/gcc49  
    setenv CPP /usr/local/bin/cpp49
    npm install


If dns_sd.h is missing install mDNSResponder: 

    pkg install mDNSResponder
    