// Turns off requireJS 'define' if it exists to make it possible to initialize SCBeacon
var __scFxmOrigDefine;
if (typeof define !== "undefined") {
  __scFxmOrigDefine = define;
  define = null;
}
