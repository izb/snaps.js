![Snaps logo](https://raw.github.com/izb/snaps.js/master/resources/logo/snaps-logo.png)

[![Build Status](https://travis-ci.org/izb/snaps.js.png?branch=master)](https://travis-ci.org/izb/snaps.js)

The JavaScript isometric game engine
------------------------------------

This game engine is being used to develop a game, but will periodically be updated here. Eventually,
once the code becomes stable, it will be packaged up neatly here and have a build process created
around it.

Trust me though, it's pretty good already.

If you want to know more, head on over to the [wiki](https://github.com/izb/snaps.js/wiki).

Notes on building
-----------------

To build, you need to install node.js. You need at least v0.10

To set up:

```bash
npm install -g grunt-cli
npm install
```

To build:

```bash
grunt
```

To test:

```bash
grunt production test
```

Or to test unminified:

```bash
grunt dev test
```
