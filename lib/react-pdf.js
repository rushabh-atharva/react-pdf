import * as P from '@react-pdf/primitives';
export * from '@react-pdf/primitives';
import fs from 'fs';
import { Buffer as Buffer$1 } from 'buffer';
import FontStore from '@react-pdf/font';
import renderPDF from '@react-pdf/render';
import PDFDocument from '@react-pdf/pdfkit';
import { compose, castArray, parseFloat as parseFloat$1, matchPercent, isNil, repeat, last, dropLast as dropLast$2, adjust, reverse, without, asyncCompose, upperFirst, pick, evolve, omit as omit$1, capitalize, mapValues } from '@react-pdf/fns';
import url from 'url';
import path from 'path';
import zlib from 'zlib';
import Reconciler from '@react-pdf/reconciler';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function MaxHeight(value) {
  this.value = value;
  this.match = function (options) {
    return this.value >= options.height;
  };
}
function MinHeight(value) {
  this.value = value;
  this.match = function (options) {
    return this.value < options.height;
  };
}
function MaxWidth(value) {
  this.value = value;
  this.match = function (options) {
    return this.value >= options.width;
  };
}
function MinWidth(value) {
  this.value = value;
  this.match = function (options) {
    return this.value < options.width;
  };
}
function Orientation(value) {
  this.value = value;
  this.match = function (options) {
    return this.value === options.orientation;
  };
}
var queries = function Query(type, value) {
  switch (type) {
    case 'max-height':
      return new MaxHeight(value);
    case 'min-height':
      return new MinHeight(value);
    case 'max-width':
      return new MaxWidth(value);
    case 'min-width':
      return new MinWidth(value);
    case 'orientation':
      return new Orientation(value);
    default:
      throw new Error(value);
  }
};

function And(left, right) {
  this.left = left;
  this.right = right;
  this.match = function (options) {
    return left.match(options) && right.match(options);
  };
}
function Or(left, right) {
  this.left = left;
  this.right = right;
  this.match = function (options) {
    return left.match(options) || right.match(options);
  };
}
var operators = function Operator(type, left, right) {
  switch (type) {
    case 'and':
      return new And(left, right);
    case ',':
      return new Or(left, right);
    default:
      throw new Error(value);
  }
};

var Query = queries;
var Operator = operators;
var NUMBERS = /[0-9]/;
var LETTERS = /[a-z|\-]/i;
var WHITESPACE = /\s/;
var COLON = /:/;
var COMMA = /,/;
var AND = /and$/;
var AT = /@/;
function tokenizer(input) {
  var current = 0;
  var tokens = [];
  while (current < input.length) {
    var char = input[current];
    if (AT.test(char)) {
      char = input[++current];
      while (LETTERS.test(char) && char !== undefined) {
        char = input[++current];
      }
    }
    if (WHITESPACE.test(char) || char === ')' || char === '(') {
      current++;
      continue;
    }
    if (COLON.test(char) || COMMA.test(char)) {
      current++;
      tokens.push({
        type: 'operator',
        value: char
      });
      continue;
    }
    if (NUMBERS.test(char)) {
      var value = '';
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }
      tokens.push({
        type: 'number',
        value: value
      });
      continue;
    }
    if (LETTERS.test(char)) {
      var value = '';
      while (LETTERS.test(char) && char !== undefined) {
        value += char;
        char = input[++current];
      }
      if (AND.test(value)) {
        tokens.push({
          type: 'operator',
          value: value
        });
      } else {
        tokens.push({
          type: 'literal',
          value: value
        });
      }
      continue;
    }
    throw new TypeError('Tokenizer: I dont know what this character is: ' + char);
  }
  return tokens;
}
function parser(tokens) {
  var output = [];
  var stack = [];
  while (tokens.length > 0) {
    var token = tokens.shift();
    if (token.type === 'number' || token.type === 'literal') {
      output.push(token);
      continue;
    }
    if (token.type === 'operator') {
      if (COLON.test(token.value)) {
        token = {
          type: 'query',
          key: output.pop(),
          value: tokens.shift()
        };
        output.push(token);
        continue;
      }
      while (stack.length > 0) {
        output.unshift(stack.pop());
      }
      stack.push(token);
    }
  }
  while (stack.length > 0) {
    output.unshift(stack.pop());
  }
  function walk() {
    var head = output.shift();
    if (head.type === 'number') {
      return parseInt(head.value);
    }
    if (head.type === 'literal') {
      return head.value;
    }
    if (head.type === 'operator') {
      var l = walk();
      var r = walk();
      return Operator(head.value, l, r);
    }
    if (head.type === 'query') {
      var l = head.key.value;
      var r = head.value.value;
      return Query(l, r);
    }
  }
  return walk();
}
var parser_1 = {
  parse: function (query) {
    var tokens = tokenizer(query);
    var ast = parser(tokens);
    return ast;
  }
};

var Parser = parser_1;
var src = function (queries, options) {
  var result = {};
  Object.keys(queries).forEach(function (query) {
    if (Parser.parse(query).match(options)) {
      Object.assign(result, queries[query]);
    }
  });
  return result;
};

var matchMedia = /*@__PURE__*/getDefaultExportFromCjs(src);

// expected hue range: [0, 360)
// expected saturation range: [0, 1]
// expected lightness range: [0, 1]
var hslToRgb = function (hue, saturation, lightness) {
  // based on algorithm from http://en.wikipedia.org/wiki/HSL_and_HSV#Converting_to_RGB
  if (hue == undefined) {
    return [0, 0, 0];
  }
  var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  var huePrime = hue / 60;
  var secondComponent = chroma * (1 - Math.abs(huePrime % 2 - 1));
  huePrime = Math.floor(huePrime);
  var red;
  var green;
  var blue;
  if (huePrime === 0) {
    red = chroma;
    green = secondComponent;
    blue = 0;
  } else if (huePrime === 1) {
    red = secondComponent;
    green = chroma;
    blue = 0;
  } else if (huePrime === 2) {
    red = 0;
    green = chroma;
    blue = secondComponent;
  } else if (huePrime === 3) {
    red = 0;
    green = secondComponent;
    blue = chroma;
  } else if (huePrime === 4) {
    red = secondComponent;
    green = 0;
    blue = chroma;
  } else if (huePrime === 5) {
    red = chroma;
    green = 0;
    blue = secondComponent;
  }
  var lightnessAdjustment = lightness - chroma / 2;
  red += lightnessAdjustment;
  green += lightnessAdjustment;
  blue += lightnessAdjustment;
  return [Math.abs(Math.round(red * 255)), Math.abs(Math.round(green * 255)), Math.abs(Math.round(blue * 255))];
};
var converter = hslToRgb;

// In our case, there's only one dependency

var toRgb = converter;

// Typically all dependencies should be declared at the top of the file.

// Now let's define an API for our module, we're taking hue, saturation and luminosity values and outputting a CSS compatible hex string.
// Hue is in degrees, between 0 and 359. Since degrees a cyclical in nature, we'll support numbers greater than 359 or less than 0 by "spinning" them around until they fall within the 0 to 359 range.
// Saturation and luminosity are both percentages, we'll represent these percentages with whole numbers between 0 and 100. For these numbers we'll need to enforce a maximum and a minimum, anything below 0 will become 0, anything above 100 will become 100.
// Let's write some utility functions to handle this logic:

function max(val, n) {
  return val > n ? n : val;
}
function min(val, n) {
  return val < n ? n : val;
}
function cycle(val) {
  // for safety:
  val = max(val, 1e7);
  val = min(val, -1e7);
  // cycle value:
  while (val < 0) {
    val += 360;
  }
  while (val > 359) {
    val -= 360;
  }
  return val;
}

// Now for the main piece, the `hsl` function:

function hsl(hue, saturation, luminosity) {
  // resolve degrees to 0 - 359 range
  hue = cycle(hue);

  // enforce constraints
  saturation = min(max(saturation, 100), 0);
  luminosity = min(max(luminosity, 100), 0);

  // convert to 0 to 1 range used by hsl-to-rgb-for-reals
  saturation /= 100;
  luminosity /= 100;

  // let hsl-to-rgb-for-reals do the hard work
  var rgb = toRgb(hue, saturation, luminosity);

  // convert each value in the returned RGB array
  // to a 2 character hex value, join the array into
  // a string, prefixed with a hash
  return '#' + rgb.map(function (n) {
    return (256 + n).toString(16).substr(-2);
  }).join('');
}

// In order to make our code into a bona fide module we have to export it:

var hslToHex = hsl;

var hlsToHex = /*@__PURE__*/getDefaultExportFromCjs(hslToHex);

var colorString$1 = {exports: {}};

var colorName = {
  "aliceblue": [240, 248, 255],
  "antiquewhite": [250, 235, 215],
  "aqua": [0, 255, 255],
  "aquamarine": [127, 255, 212],
  "azure": [240, 255, 255],
  "beige": [245, 245, 220],
  "bisque": [255, 228, 196],
  "black": [0, 0, 0],
  "blanchedalmond": [255, 235, 205],
  "blue": [0, 0, 255],
  "blueviolet": [138, 43, 226],
  "brown": [165, 42, 42],
  "burlywood": [222, 184, 135],
  "cadetblue": [95, 158, 160],
  "chartreuse": [127, 255, 0],
  "chocolate": [210, 105, 30],
  "coral": [255, 127, 80],
  "cornflowerblue": [100, 149, 237],
  "cornsilk": [255, 248, 220],
  "crimson": [220, 20, 60],
  "cyan": [0, 255, 255],
  "darkblue": [0, 0, 139],
  "darkcyan": [0, 139, 139],
  "darkgoldenrod": [184, 134, 11],
  "darkgray": [169, 169, 169],
  "darkgreen": [0, 100, 0],
  "darkgrey": [169, 169, 169],
  "darkkhaki": [189, 183, 107],
  "darkmagenta": [139, 0, 139],
  "darkolivegreen": [85, 107, 47],
  "darkorange": [255, 140, 0],
  "darkorchid": [153, 50, 204],
  "darkred": [139, 0, 0],
  "darksalmon": [233, 150, 122],
  "darkseagreen": [143, 188, 143],
  "darkslateblue": [72, 61, 139],
  "darkslategray": [47, 79, 79],
  "darkslategrey": [47, 79, 79],
  "darkturquoise": [0, 206, 209],
  "darkviolet": [148, 0, 211],
  "deeppink": [255, 20, 147],
  "deepskyblue": [0, 191, 255],
  "dimgray": [105, 105, 105],
  "dimgrey": [105, 105, 105],
  "dodgerblue": [30, 144, 255],
  "firebrick": [178, 34, 34],
  "floralwhite": [255, 250, 240],
  "forestgreen": [34, 139, 34],
  "fuchsia": [255, 0, 255],
  "gainsboro": [220, 220, 220],
  "ghostwhite": [248, 248, 255],
  "gold": [255, 215, 0],
  "goldenrod": [218, 165, 32],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenyellow": [173, 255, 47],
  "grey": [128, 128, 128],
  "honeydew": [240, 255, 240],
  "hotpink": [255, 105, 180],
  "indianred": [205, 92, 92],
  "indigo": [75, 0, 130],
  "ivory": [255, 255, 240],
  "khaki": [240, 230, 140],
  "lavender": [230, 230, 250],
  "lavenderblush": [255, 240, 245],
  "lawngreen": [124, 252, 0],
  "lemonchiffon": [255, 250, 205],
  "lightblue": [173, 216, 230],
  "lightcoral": [240, 128, 128],
  "lightcyan": [224, 255, 255],
  "lightgoldenrodyellow": [250, 250, 210],
  "lightgray": [211, 211, 211],
  "lightgreen": [144, 238, 144],
  "lightgrey": [211, 211, 211],
  "lightpink": [255, 182, 193],
  "lightsalmon": [255, 160, 122],
  "lightseagreen": [32, 178, 170],
  "lightskyblue": [135, 206, 250],
  "lightslategray": [119, 136, 153],
  "lightslategrey": [119, 136, 153],
  "lightsteelblue": [176, 196, 222],
  "lightyellow": [255, 255, 224],
  "lime": [0, 255, 0],
  "limegreen": [50, 205, 50],
  "linen": [250, 240, 230],
  "magenta": [255, 0, 255],
  "maroon": [128, 0, 0],
  "mediumaquamarine": [102, 205, 170],
  "mediumblue": [0, 0, 205],
  "mediumorchid": [186, 85, 211],
  "mediumpurple": [147, 112, 219],
  "mediumseagreen": [60, 179, 113],
  "mediumslateblue": [123, 104, 238],
  "mediumspringgreen": [0, 250, 154],
  "mediumturquoise": [72, 209, 204],
  "mediumvioletred": [199, 21, 133],
  "midnightblue": [25, 25, 112],
  "mintcream": [245, 255, 250],
  "mistyrose": [255, 228, 225],
  "moccasin": [255, 228, 181],
  "navajowhite": [255, 222, 173],
  "navy": [0, 0, 128],
  "oldlace": [253, 245, 230],
  "olive": [128, 128, 0],
  "olivedrab": [107, 142, 35],
  "orange": [255, 165, 0],
  "orangered": [255, 69, 0],
  "orchid": [218, 112, 214],
  "palegoldenrod": [238, 232, 170],
  "palegreen": [152, 251, 152],
  "paleturquoise": [175, 238, 238],
  "palevioletred": [219, 112, 147],
  "papayawhip": [255, 239, 213],
  "peachpuff": [255, 218, 185],
  "peru": [205, 133, 63],
  "pink": [255, 192, 203],
  "plum": [221, 160, 221],
  "powderblue": [176, 224, 230],
  "purple": [128, 0, 128],
  "rebeccapurple": [102, 51, 153],
  "red": [255, 0, 0],
  "rosybrown": [188, 143, 143],
  "royalblue": [65, 105, 225],
  "saddlebrown": [139, 69, 19],
  "salmon": [250, 128, 114],
  "sandybrown": [244, 164, 96],
  "seagreen": [46, 139, 87],
  "seashell": [255, 245, 238],
  "sienna": [160, 82, 45],
  "silver": [192, 192, 192],
  "skyblue": [135, 206, 235],
  "slateblue": [106, 90, 205],
  "slategray": [112, 128, 144],
  "slategrey": [112, 128, 144],
  "snow": [255, 250, 250],
  "springgreen": [0, 255, 127],
  "steelblue": [70, 130, 180],
  "tan": [210, 180, 140],
  "teal": [0, 128, 128],
  "thistle": [216, 191, 216],
  "tomato": [255, 99, 71],
  "turquoise": [64, 224, 208],
  "violet": [238, 130, 238],
  "wheat": [245, 222, 179],
  "white": [255, 255, 255],
  "whitesmoke": [245, 245, 245],
  "yellow": [255, 255, 0],
  "yellowgreen": [154, 205, 50]
};

var simpleSwizzle = {exports: {}};

var isArrayish$1 = function isArrayish(obj) {
  if (!obj || typeof obj === 'string') {
    return false;
  }
  return obj instanceof Array || Array.isArray(obj) || obj.length >= 0 && (obj.splice instanceof Function || Object.getOwnPropertyDescriptor(obj, obj.length - 1) && obj.constructor.name !== 'String');
};

var isArrayish = isArrayish$1;
var concat$1 = Array.prototype.concat;
var slice$3 = Array.prototype.slice;
var swizzle$1 = simpleSwizzle.exports = function swizzle(args) {
  var results = [];
  for (var i = 0, len = args.length; i < len; i++) {
    var arg = args[i];
    if (isArrayish(arg)) {
      // http://jsperf.com/javascript-array-concat-vs-push/98
      results = concat$1.call(results, slice$3.call(arg));
    } else {
      results.push(arg);
    }
  }
  return results;
};
swizzle$1.wrap = function (fn) {
  return function () {
    return fn(swizzle$1(arguments));
  };
};

var simpleSwizzleExports = simpleSwizzle.exports;

/* MIT license */

var colorNames = colorName;
var swizzle = simpleSwizzleExports;
var hasOwnProperty = Object.hasOwnProperty;
var reverseNames = Object.create(null);

// create a list of reverse color names
for (var name in colorNames) {
  if (hasOwnProperty.call(colorNames, name)) {
    reverseNames[colorNames[name]] = name;
  }
}
var cs = colorString$1.exports = {
  to: {},
  get: {}
};
cs.get = function (string) {
  var prefix = string.substring(0, 3).toLowerCase();
  var val;
  var model;
  switch (prefix) {
    case 'hsl':
      val = cs.get.hsl(string);
      model = 'hsl';
      break;
    case 'hwb':
      val = cs.get.hwb(string);
      model = 'hwb';
      break;
    default:
      val = cs.get.rgb(string);
      model = 'rgb';
      break;
  }
  if (!val) {
    return null;
  }
  return {
    model: model,
    value: val
  };
};
cs.get.rgb = function (string) {
  if (!string) {
    return null;
  }
  var abbr = /^#([a-f0-9]{3,4})$/i;
  var hex = /^#([a-f0-9]{6})([a-f0-9]{2})?$/i;
  var rgba = /^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/;
  var per = /^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/;
  var keyword = /^(\w+)$/;
  var rgb = [0, 0, 0, 1];
  var match;
  var i;
  var hexAlpha;
  if (match = string.match(hex)) {
    hexAlpha = match[2];
    match = match[1];
    for (i = 0; i < 3; i++) {
      // https://jsperf.com/slice-vs-substr-vs-substring-methods-long-string/19
      var i2 = i * 2;
      rgb[i] = parseInt(match.slice(i2, i2 + 2), 16);
    }
    if (hexAlpha) {
      rgb[3] = parseInt(hexAlpha, 16) / 255;
    }
  } else if (match = string.match(abbr)) {
    match = match[1];
    hexAlpha = match[3];
    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(match[i] + match[i], 16);
    }
    if (hexAlpha) {
      rgb[3] = parseInt(hexAlpha + hexAlpha, 16) / 255;
    }
  } else if (match = string.match(rgba)) {
    for (i = 0; i < 3; i++) {
      rgb[i] = parseInt(match[i + 1], 0);
    }
    if (match[4]) {
      if (match[5]) {
        rgb[3] = parseFloat(match[4]) * 0.01;
      } else {
        rgb[3] = parseFloat(match[4]);
      }
    }
  } else if (match = string.match(per)) {
    for (i = 0; i < 3; i++) {
      rgb[i] = Math.round(parseFloat(match[i + 1]) * 2.55);
    }
    if (match[4]) {
      if (match[5]) {
        rgb[3] = parseFloat(match[4]) * 0.01;
      } else {
        rgb[3] = parseFloat(match[4]);
      }
    }
  } else if (match = string.match(keyword)) {
    if (match[1] === 'transparent') {
      return [0, 0, 0, 0];
    }
    if (!hasOwnProperty.call(colorNames, match[1])) {
      return null;
    }
    rgb = colorNames[match[1]];
    rgb[3] = 1;
    return rgb;
  } else {
    return null;
  }
  for (i = 0; i < 3; i++) {
    rgb[i] = clamp(rgb[i], 0, 255);
  }
  rgb[3] = clamp(rgb[3], 0, 1);
  return rgb;
};
cs.get.hsl = function (string) {
  if (!string) {
    return null;
  }
  var hsl = /^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
  var match = string.match(hsl);
  if (match) {
    var alpha = parseFloat(match[4]);
    var h = (parseFloat(match[1]) % 360 + 360) % 360;
    var s = clamp(parseFloat(match[2]), 0, 100);
    var l = clamp(parseFloat(match[3]), 0, 100);
    var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);
    return [h, s, l, a];
  }
  return null;
};
cs.get.hwb = function (string) {
  if (!string) {
    return null;
  }
  var hwb = /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;
  var match = string.match(hwb);
  if (match) {
    var alpha = parseFloat(match[4]);
    var h = (parseFloat(match[1]) % 360 + 360) % 360;
    var w = clamp(parseFloat(match[2]), 0, 100);
    var b = clamp(parseFloat(match[3]), 0, 100);
    var a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);
    return [h, w, b, a];
  }
  return null;
};
cs.to.hex = function () {
  var rgba = swizzle(arguments);
  return '#' + hexDouble(rgba[0]) + hexDouble(rgba[1]) + hexDouble(rgba[2]) + (rgba[3] < 1 ? hexDouble(Math.round(rgba[3] * 255)) : '');
};
cs.to.rgb = function () {
  var rgba = swizzle(arguments);
  return rgba.length < 4 || rgba[3] === 1 ? 'rgb(' + Math.round(rgba[0]) + ', ' + Math.round(rgba[1]) + ', ' + Math.round(rgba[2]) + ')' : 'rgba(' + Math.round(rgba[0]) + ', ' + Math.round(rgba[1]) + ', ' + Math.round(rgba[2]) + ', ' + rgba[3] + ')';
};
cs.to.rgb.percent = function () {
  var rgba = swizzle(arguments);
  var r = Math.round(rgba[0] / 255 * 100);
  var g = Math.round(rgba[1] / 255 * 100);
  var b = Math.round(rgba[2] / 255 * 100);
  return rgba.length < 4 || rgba[3] === 1 ? 'rgb(' + r + '%, ' + g + '%, ' + b + '%)' : 'rgba(' + r + '%, ' + g + '%, ' + b + '%, ' + rgba[3] + ')';
};
cs.to.hsl = function () {
  var hsla = swizzle(arguments);
  return hsla.length < 4 || hsla[3] === 1 ? 'hsl(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%)' : 'hsla(' + hsla[0] + ', ' + hsla[1] + '%, ' + hsla[2] + '%, ' + hsla[3] + ')';
};

// hwb is a bit different than rgb(a) & hsl(a) since there is no alpha specific syntax
// (hwb have alpha optional & 1 is default value)
cs.to.hwb = function () {
  var hwba = swizzle(arguments);
  var a = '';
  if (hwba.length >= 4 && hwba[3] !== 1) {
    a = ', ' + hwba[3];
  }
  return 'hwb(' + hwba[0] + ', ' + hwba[1] + '%, ' + hwba[2] + '%' + a + ')';
};
cs.to.keyword = function (rgb) {
  return reverseNames[rgb.slice(0, 3)];
};

// helpers
function clamp(num, min, max) {
  return Math.min(Math.max(min, num), max);
}
function hexDouble(num) {
  var str = Math.round(num).toString(16).toUpperCase();
  return str.length < 2 ? '0' + str : str;
}

var colorStringExports = colorString$1.exports;
var colorString = /*@__PURE__*/getDefaultExportFromCjs(colorStringExports);

var openParentheses = "(".charCodeAt(0);
var closeParentheses = ")".charCodeAt(0);
var singleQuote = "'".charCodeAt(0);
var doubleQuote = '"'.charCodeAt(0);
var backslash = "\\".charCodeAt(0);
var slash = "/".charCodeAt(0);
var comma = ",".charCodeAt(0);
var colon = ":".charCodeAt(0);
var star = "*".charCodeAt(0);
var uLower = "u".charCodeAt(0);
var uUpper = "U".charCodeAt(0);
var plus$1 = "+".charCodeAt(0);
var isUnicodeRange = /^[a-f0-9?-]+$/i;
var parse$1 = function (input) {
  var tokens = [];
  var value = input;
  var next, quote, prev, token, escape, escapePos, whitespacePos, parenthesesOpenPos;
  var pos = 0;
  var code = value.charCodeAt(pos);
  var max = value.length;
  var stack = [{
    nodes: tokens
  }];
  var balanced = 0;
  var parent;
  var name = "";
  var before = "";
  var after = "";
  while (pos < max) {
    // Whitespaces
    if (code <= 32) {
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      token = value.slice(pos, next);
      prev = tokens[tokens.length - 1];
      if (code === closeParentheses && balanced) {
        after = token;
      } else if (prev && prev.type === "div") {
        prev.after = token;
        prev.sourceEndIndex += token.length;
      } else if (code === comma || code === colon || code === slash && value.charCodeAt(next + 1) !== star && (!parent || parent && parent.type === "function" && parent.value !== "calc")) {
        before = token;
      } else {
        tokens.push({
          type: "space",
          sourceIndex: pos,
          sourceEndIndex: next,
          value: token
        });
      }
      pos = next;

      // Quotes
    } else if (code === singleQuote || code === doubleQuote) {
      next = pos;
      quote = code === singleQuote ? "'" : '"';
      token = {
        type: "string",
        sourceIndex: pos,
        quote: quote
      };
      do {
        escape = false;
        next = value.indexOf(quote, next + 1);
        if (~next) {
          escapePos = next;
          while (value.charCodeAt(escapePos - 1) === backslash) {
            escapePos -= 1;
            escape = !escape;
          }
        } else {
          value += quote;
          next = value.length - 1;
          token.unclosed = true;
        }
      } while (escape);
      token.value = value.slice(pos + 1, next);
      token.sourceEndIndex = token.unclosed ? next : next + 1;
      tokens.push(token);
      pos = next + 1;
      code = value.charCodeAt(pos);

      // Comments
    } else if (code === slash && value.charCodeAt(pos + 1) === star) {
      next = value.indexOf("*/", pos);
      token = {
        type: "comment",
        sourceIndex: pos,
        sourceEndIndex: next + 2
      };
      if (next === -1) {
        token.unclosed = true;
        next = value.length;
        token.sourceEndIndex = next;
      }
      token.value = value.slice(pos + 2, next);
      tokens.push(token);
      pos = next + 2;
      code = value.charCodeAt(pos);

      // Operation within calc
    } else if ((code === slash || code === star) && parent && parent.type === "function" && parent.value === "calc") {
      token = value[pos];
      tokens.push({
        type: "word",
        sourceIndex: pos - before.length,
        sourceEndIndex: pos + token.length,
        value: token
      });
      pos += 1;
      code = value.charCodeAt(pos);

      // Dividers
    } else if (code === slash || code === comma || code === colon) {
      token = value[pos];
      tokens.push({
        type: "div",
        sourceIndex: pos - before.length,
        sourceEndIndex: pos + token.length,
        value: token,
        before: before,
        after: ""
      });
      before = "";
      pos += 1;
      code = value.charCodeAt(pos);

      // Open parentheses
    } else if (openParentheses === code) {
      // Whitespaces after open parentheses
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      parenthesesOpenPos = pos;
      token = {
        type: "function",
        sourceIndex: pos - name.length,
        value: name,
        before: value.slice(parenthesesOpenPos + 1, next)
      };
      pos = next;
      if (name === "url" && code !== singleQuote && code !== doubleQuote) {
        next -= 1;
        do {
          escape = false;
          next = value.indexOf(")", next + 1);
          if (~next) {
            escapePos = next;
            while (value.charCodeAt(escapePos - 1) === backslash) {
              escapePos -= 1;
              escape = !escape;
            }
          } else {
            value += ")";
            next = value.length - 1;
            token.unclosed = true;
          }
        } while (escape);
        // Whitespaces before closed
        whitespacePos = next;
        do {
          whitespacePos -= 1;
          code = value.charCodeAt(whitespacePos);
        } while (code <= 32);
        if (parenthesesOpenPos < whitespacePos) {
          if (pos !== whitespacePos + 1) {
            token.nodes = [{
              type: "word",
              sourceIndex: pos,
              sourceEndIndex: whitespacePos + 1,
              value: value.slice(pos, whitespacePos + 1)
            }];
          } else {
            token.nodes = [];
          }
          if (token.unclosed && whitespacePos + 1 !== next) {
            token.after = "";
            token.nodes.push({
              type: "space",
              sourceIndex: whitespacePos + 1,
              sourceEndIndex: next,
              value: value.slice(whitespacePos + 1, next)
            });
          } else {
            token.after = value.slice(whitespacePos + 1, next);
            token.sourceEndIndex = next;
          }
        } else {
          token.after = "";
          token.nodes = [];
        }
        pos = next + 1;
        token.sourceEndIndex = token.unclosed ? next : pos;
        code = value.charCodeAt(pos);
        tokens.push(token);
      } else {
        balanced += 1;
        token.after = "";
        token.sourceEndIndex = pos + 1;
        tokens.push(token);
        stack.push(token);
        tokens = token.nodes = [];
        parent = token;
      }
      name = "";

      // Close parentheses
    } else if (closeParentheses === code && balanced) {
      pos += 1;
      code = value.charCodeAt(pos);
      parent.after = after;
      parent.sourceEndIndex += after.length;
      after = "";
      balanced -= 1;
      stack[stack.length - 1].sourceEndIndex = pos;
      stack.pop();
      parent = stack[balanced];
      tokens = parent.nodes;

      // Words
    } else {
      next = pos;
      do {
        if (code === backslash) {
          next += 1;
        }
        next += 1;
        code = value.charCodeAt(next);
      } while (next < max && !(code <= 32 || code === singleQuote || code === doubleQuote || code === comma || code === colon || code === slash || code === openParentheses || code === star && parent && parent.type === "function" && parent.value === "calc" || code === slash && parent.type === "function" && parent.value === "calc" || code === closeParentheses && balanced));
      token = value.slice(pos, next);
      if (openParentheses === code) {
        name = token;
      } else if ((uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) && plus$1 === token.charCodeAt(1) && isUnicodeRange.test(token.slice(2))) {
        tokens.push({
          type: "unicode-range",
          sourceIndex: pos,
          sourceEndIndex: next,
          value: token
        });
      } else {
        tokens.push({
          type: "word",
          sourceIndex: pos,
          sourceEndIndex: next,
          value: token
        });
      }
      pos = next;
    }
  }
  for (pos = stack.length - 1; pos; pos -= 1) {
    stack[pos].unclosed = true;
    stack[pos].sourceEndIndex = value.length;
  }
  return stack[0].nodes;
};

var parse$1$1 = /*@__PURE__*/getDefaultExportFromCjs(parse$1);

var minus = "-".charCodeAt(0);
var plus = "+".charCodeAt(0);
var dot = ".".charCodeAt(0);
var exp = "e".charCodeAt(0);
var EXP = "E".charCodeAt(0);

// Check if three code points would start a number
// https://www.w3.org/TR/css-syntax-3/#starts-with-a-number
function likeNumber(value) {
  var code = value.charCodeAt(0);
  var nextCode;
  if (code === plus || code === minus) {
    nextCode = value.charCodeAt(1);
    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }
    var nextNextCode = value.charCodeAt(2);
    if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
      return true;
    }
    return false;
  }
  if (code === dot) {
    nextCode = value.charCodeAt(1);
    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }
    return false;
  }
  if (code >= 48 && code <= 57) {
    return true;
  }
  return false;
}

// Consume a number
// https://www.w3.org/TR/css-syntax-3/#consume-number
var unit = function (value) {
  var pos = 0;
  var length = value.length;
  var code;
  var nextCode;
  var nextNextCode;
  if (length === 0 || !likeNumber(value)) {
    return false;
  }
  code = value.charCodeAt(pos);
  if (code === plus || code === minus) {
    pos++;
  }
  while (pos < length) {
    code = value.charCodeAt(pos);
    if (code < 48 || code > 57) {
      break;
    }
    pos += 1;
  }
  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);
  if (code === dot && nextCode >= 48 && nextCode <= 57) {
    pos += 2;
    while (pos < length) {
      code = value.charCodeAt(pos);
      if (code < 48 || code > 57) {
        break;
      }
      pos += 1;
    }
  }
  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);
  nextNextCode = value.charCodeAt(pos + 2);
  if ((code === exp || code === EXP) && (nextCode >= 48 && nextCode <= 57 || (nextCode === plus || nextCode === minus) && nextNextCode >= 48 && nextNextCode <= 57)) {
    pos += nextCode === plus || nextCode === minus ? 3 : 2;
    while (pos < length) {
      code = value.charCodeAt(pos);
      if (code < 48 || code > 57) {
        break;
      }
      pos += 1;
    }
  }
  return {
    number: value.slice(0, pos),
    unit: value.slice(pos)
  };
};

var parseUnit = /*@__PURE__*/getDefaultExportFromCjs(unit);

/**
 * Remove nil values from array
 *
 * @param array - Style array
 * @returns Style array without nils
 */
const compact = array => array.filter(Boolean);
/**
 * Merges style objects array
 *
 * @param styles - Style array
 * @returns Merged style object
 */
const mergeStyles$2 = styles => styles.reduce((acc, style) => {
  const s = Array.isArray(style) ? flatten$1(style) : style;
  Object.keys(s).forEach(key => {
    if (s[key] !== null && s[key] !== undefined) {
      acc[key] = s[key];
    }
  });
  return acc;
}, {});
/**
 * Flattens an array of style objects, into one aggregated style object.
 *
 * @param styles - Style or style array
 * @returns Flattened style object
 */
const flatten$1 = compose(mergeStyles$2, compact, castArray);

/**
 * Resolves media queries in styles object
 *
 * @param container - Container for which styles are resolved
 * @param style - Style description
 * @returns Resolved style object
 */
const resolveMediaQueries = (container, style) => {
  return Object.keys(style).reduce((acc, key) => {
    if (/@media/.test(key)) {
      return {
        ...acc,
        ...matchMedia({
          [key]: style[key]
        }, container)
      };
    }
    return {
      ...acc,
      [key]: style[key]
    };
  }, {});
};
const isRgb = value => /rgba?/g.test(value);
const isHsl = value => /hsla?/g.test(value);
/**
 * Transform rgb color to hexa
 *
 * @param value - Styles value
 * @returns Transformed value
 */
const parseRgb = value => {
  const rgb = colorString.get.rgb(value);
  return colorString.to.hex(rgb);
};
/**
 * Transform Hsl color to hexa
 *
 * @param value - Styles value
 * @returns Transformed value
 */
const parseHsl = value => {
  const hsl = colorString.get.hsl(value).map(Math.round);
  const hex = hlsToHex(...hsl);
  return hex.toUpperCase();
};
/**
 * Transform given color to hexa
 *
 * @param value - Styles value
 * @returns Transformed value
 */
const transformColor = value => {
  if (isRgb(value)) return parseRgb(value);
  if (isHsl(value)) return parseHsl(value);
  return value;
};

/**
 * Parses scalar value in value and unit pairs
 *
 * @param value - Scalar value
 * @returns Parsed value
 */
const parseValue$1 = value => {
  if (typeof value === 'number') return {
    value,
    unit: undefined
  };
  const match = /^(-?\d*\.?\d+)(in|mm|cm|pt|vh|vw|px|rem)?$/g.exec(value);
  return match ? {
    value: parseFloat(match[1]),
    unit: match[2] || 'pt'
  } : {
    value,
    unit: undefined
  };
};
/**
 * Transform given scalar value
 *
 * @param container
 * @param value - Styles value
 * @returns Transformed value
 */
const transformUnit$1 = (container, value) => {
  const scalar = parseValue$1(value);
  const outputDpi = 72;
  const inputDpi = container.dpi || 72;
  const mmFactor = 1 / 25.4 * outputDpi;
  const cmFactor = 1 / 2.54 * outputDpi;
  if (typeof scalar.value !== 'number') return scalar.value;
  switch (scalar.unit) {
    case 'rem':
      return scalar.value * (container.remBase || 18);
    case 'in':
      return scalar.value * outputDpi;
    case 'mm':
      return scalar.value * mmFactor;
    case 'cm':
      return scalar.value * cmFactor;
    case 'vh':
      return scalar.value * (container.height / 100);
    case 'vw':
      return scalar.value * (container.width / 100);
    case 'px':
      return Math.round(scalar.value * (outputDpi / inputDpi));
    default:
      return scalar.value;
  }
};
const processNumberValue = (key, value) => ({
  [key]: parseFloat$1(value)
});
const processUnitValue = (key, value, container) => ({
  [key]: transformUnit$1(container, value)
});
const processColorValue = (key, value) => {
  const result = {
    [key]: transformColor(value)
  };
  return result;
};
const processNoopValue = (key, value) => ({
  [key]: value
});
const BORDER_SHORTHAND_REGEX = /(-?\d+(\.\d+)?(in|mm|cm|pt|vw|vh|px|rem)?)\s(\S+)\s(.+)/;
const matchBorderShorthand = value => value.match(BORDER_SHORTHAND_REGEX) || [];
const resolveBorderShorthand = (key, value, container) => {
  const match = matchBorderShorthand(`${value}`);
  if (match) {
    const widthMatch = match[1] || value;
    const styleMatch = match[4] || value;
    const colorMatch = match[5] || value;
    const style = styleMatch;
    const color = colorMatch ? transformColor(colorMatch) : undefined;
    const width = widthMatch ? transformUnit$1(container, widthMatch) : undefined;
    if (key.match(/(Top|Right|Bottom|Left)$/)) {
      return {
        [`${key}Color`]: color,
        [`${key}Style`]: style,
        [`${key}Width`]: width
      };
    }
    if (key.match(/Color$/)) {
      return {
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: color,
        borderLeftColor: color
      };
    }
    if (key.match(/Style$/)) {
      if (typeof style === 'number') throw new Error(`Invalid border style: ${style}`);
      return {
        borderTopStyle: style,
        borderRightStyle: style,
        borderBottomStyle: style,
        borderLeftStyle: style
      };
    }
    if (key.match(/Width$/)) {
      if (typeof width !== 'number') throw new Error(`Invalid border width: ${width}`);
      return {
        borderTopWidth: width,
        borderRightWidth: width,
        borderBottomWidth: width,
        borderLeftWidth: width
      };
    }
    if (key.match(/Radius$/)) {
      const radius = value ? transformUnit$1(container, value) : undefined;
      if (typeof radius !== 'number') throw new Error(`Invalid border radius: ${radius}`);
      return {
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        borderBottomRightRadius: radius,
        borderBottomLeftRadius: radius
      };
    }
    if (typeof width !== 'number') throw new Error(`Invalid border width: ${width}`);
    if (typeof style === 'number') throw new Error(`Invalid border style: ${style}`);
    return {
      borderTopColor: color,
      borderTopStyle: style,
      borderTopWidth: width,
      borderRightColor: color,
      borderRightStyle: style,
      borderRightWidth: width,
      borderBottomColor: color,
      borderBottomStyle: style,
      borderBottomWidth: width,
      borderLeftColor: color,
      borderLeftStyle: style,
      borderLeftWidth: width
    };
  }
  return {
    [key]: value
  };
};
const handlers$b = {
  border: resolveBorderShorthand,
  borderBottom: resolveBorderShorthand,
  borderBottomColor: processColorValue,
  borderBottomLeftRadius: processUnitValue,
  borderBottomRightRadius: processUnitValue,
  borderBottomStyle: processNoopValue,
  borderBottomWidth: processUnitValue,
  borderColor: resolveBorderShorthand,
  borderLeft: resolveBorderShorthand,
  borderLeftColor: processColorValue,
  borderLeftStyle: processNoopValue,
  borderLeftWidth: processUnitValue,
  borderRadius: resolveBorderShorthand,
  borderRight: resolveBorderShorthand,
  borderRightColor: processColorValue,
  borderRightStyle: processNoopValue,
  borderRightWidth: processUnitValue,
  borderStyle: resolveBorderShorthand,
  borderTop: resolveBorderShorthand,
  borderTopColor: processColorValue,
  borderTopLeftRadius: processUnitValue,
  borderTopRightRadius: processUnitValue,
  borderTopStyle: processNoopValue,
  borderTopWidth: processUnitValue,
  borderWidth: resolveBorderShorthand
};
const handlers$a = {
  backgroundColor: processColorValue,
  color: processColorValue,
  opacity: processNumberValue
};
const handlers$9 = {
  height: processUnitValue,
  maxHeight: processUnitValue,
  maxWidth: processUnitValue,
  minHeight: processUnitValue,
  minWidth: processUnitValue,
  width: processUnitValue
};

// https://developer.mozilla.org/en-US/docs/Web/CSS/flex#values
// TODO: change flex defaults to [0, 1, 'auto'] as in spec in next major release
const flexDefaults = [1, 1, 0];
const flexAuto = [1, 1, 'auto'];
const processFlexShorthand = (key, value, container) => {
  let defaults = flexDefaults;
  let matches = [];
  if (value === 'auto') {
    defaults = flexAuto;
  } else {
    matches = `${value}`.split(' ');
  }
  const flexGrow = parseFloat$1(matches[0] || defaults[0]);
  const flexShrink = parseFloat$1(matches[1] || defaults[1]);
  const flexBasis = transformUnit$1(container, matches[2] || defaults[2]);
  return {
    flexGrow,
    flexShrink,
    flexBasis
  };
};
const handlers$8 = {
  alignContent: processNoopValue,
  alignItems: processNoopValue,
  alignSelf: processNoopValue,
  flex: processFlexShorthand,
  flexBasis: processUnitValue,
  flexDirection: processNoopValue,
  flexFlow: processNoopValue,
  flexGrow: processNumberValue,
  flexShrink: processNumberValue,
  flexWrap: processNoopValue,
  justifyContent: processNoopValue,
  justifySelf: processNoopValue
};
const processGapShorthand = (key, value, container) => {
  const match = `${value}`.split(' ');
  const rowGap = transformUnit$1(container, (match === null || match === void 0 ? void 0 : match[0]) || value);
  const columnGap = transformUnit$1(container, (match === null || match === void 0 ? void 0 : match[1]) || value);
  return {
    rowGap,
    columnGap
  };
};
const handlers$7 = {
  gap: processGapShorthand,
  columnGap: processUnitValue,
  rowGap: processUnitValue
};
const handlers$6 = {
  aspectRatio: processNumberValue,
  bottom: processUnitValue,
  display: processNoopValue,
  left: processUnitValue,
  position: processNoopValue,
  right: processUnitValue,
  top: processUnitValue,
  overflow: processNoopValue,
  zIndex: processNumberValue
};
const BOX_MODEL_UNITS = 'px,in,mm,cm,pt,%,vw,vh';
const logError = (style, value) => {
  const name = style.toString();
  // eslint-disable-next-line no-console
  console.error(`
    @react-pdf/stylesheet parsing error:
    ${name}: ${value},
    ${' '.repeat(name.length + 2)}^
    Unsupported ${name} value format
  `);
};
/**
 * @param options
 * @param [options.expandsTo]
 * @param [options.maxValues]
 * @param [options.autoSupported]
 */
const expandBoxModel = function (_temp) {
  let {
    expandsTo,
    maxValues = 1,
    autoSupported = false
  } = _temp === void 0 ? {} : _temp;
  return (model, value, container) => {
    const nodes = parse$1$1(`${value}`);
    const parts = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // value contains `calc`, `url` or other css function
      // `,`, `/` or strings that unsupported by margin and padding
      if (node.type === 'function' || node.type === 'string' || node.type === 'div') {
        logError(model, value);
        return {};
      }
      if (node.type === 'word') {
        if (node.value === 'auto' && autoSupported) {
          parts.push(node.value);
        } else {
          const result = parseUnit(node.value);
          // when unit isn't specified this condition is true
          if (result && BOX_MODEL_UNITS.includes(result.unit)) {
            parts.push(node.value);
          } else {
            logError(model, value);
            return {};
          }
        }
      }
    }
    // checks that we have enough parsed values
    if (parts.length > maxValues) {
      logError(model, value);
      return {};
    }
    const first = transformUnit$1(container, parts[0]);
    if (expandsTo) {
      const second = transformUnit$1(container, parts[1] || parts[0]);
      const third = transformUnit$1(container, parts[2] || parts[0]);
      const fourth = transformUnit$1(container, parts[3] || parts[1] || parts[0]);
      return expandsTo({
        first,
        second,
        third,
        fourth
      });
    }
    return {
      [model]: first
    };
  };
};
const processMargin = expandBoxModel({
  expandsTo: _ref => {
    let {
      first,
      second,
      third,
      fourth
    } = _ref;
    return {
      marginTop: first,
      marginRight: second,
      marginBottom: third,
      marginLeft: fourth
    };
  },
  maxValues: 4,
  autoSupported: true
});
const processMarginVertical = expandBoxModel({
  expandsTo: _ref2 => {
    let {
      first,
      second
    } = _ref2;
    return {
      marginTop: first,
      marginBottom: second
    };
  },
  maxValues: 2,
  autoSupported: true
});
const processMarginHorizontal = expandBoxModel({
  expandsTo: _ref3 => {
    let {
      first,
      second
    } = _ref3;
    return {
      marginRight: first,
      marginLeft: second
    };
  },
  maxValues: 2,
  autoSupported: true
});
const processMarginSingle = expandBoxModel({
  autoSupported: true
});
const handlers$5 = {
  margin: processMargin,
  marginBottom: processMarginSingle,
  marginHorizontal: processMarginHorizontal,
  marginLeft: processMarginSingle,
  marginRight: processMarginSingle,
  marginTop: processMarginSingle,
  marginVertical: processMarginVertical
};
const processPadding = expandBoxModel({
  expandsTo: _ref4 => {
    let {
      first,
      second,
      third,
      fourth
    } = _ref4;
    return {
      paddingTop: first,
      paddingRight: second,
      paddingBottom: third,
      paddingLeft: fourth
    };
  },
  maxValues: 4
});
const processPaddingVertical = expandBoxModel({
  expandsTo: _ref5 => {
    let {
      first,
      second
    } = _ref5;
    return {
      paddingTop: first,
      paddingBottom: second
    };
  },
  maxValues: 2
});
const processPaddingHorizontal = expandBoxModel({
  expandsTo: _ref6 => {
    let {
      first,
      second
    } = _ref6;
    return {
      paddingRight: first,
      paddingLeft: second
    };
  },
  maxValues: 2
});
const processPaddingSingle = expandBoxModel();
const handlers$4 = {
  padding: processPadding,
  paddingBottom: processPaddingSingle,
  paddingHorizontal: processPaddingHorizontal,
  paddingLeft: processPaddingSingle,
  paddingRight: processPaddingSingle,
  paddingTop: processPaddingSingle,
  paddingVertical: processPaddingVertical
};
const offsetKeyword = value => {
  switch (value) {
    case 'top':
    case 'left':
      return '0%';
    case 'right':
    case 'bottom':
      return '100%';
    case 'center':
      return '50%';
    default:
      return value;
  }
};
const processObjectPosition = (key, value, container) => {
  const match = `${value}`.split(' ');
  const objectPositionX = offsetKeyword(transformUnit$1(container, (match === null || match === void 0 ? void 0 : match[0]) || value));
  const objectPositionY = offsetKeyword(transformUnit$1(container, (match === null || match === void 0 ? void 0 : match[1]) || value));
  return {
    objectPositionX,
    objectPositionY
  };
};
const processObjectPositionValue = (key, value, container) => ({
  [key]: offsetKeyword(transformUnit$1(container, value))
});
const handlers$3 = {
  objectPosition: processObjectPosition,
  objectPositionX: processObjectPositionValue,
  objectPositionY: processObjectPositionValue,
  objectFit: processNoopValue
};
const castInt = value => {
  if (typeof value === 'number') return value;
  return parseInt(value, 10);
};
const FONT_WEIGHTS = {
  thin: 100,
  hairline: 100,
  ultralight: 200,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  ultrabold: 800,
  extrabold: 800,
  heavy: 900,
  black: 900
};
const transformFontWeight = value => {
  if (!value) return FONT_WEIGHTS.normal;
  if (typeof value === 'number') return value;
  const lv = value.toLowerCase();
  if (FONT_WEIGHTS[lv]) return FONT_WEIGHTS[lv];
  return castInt(value);
};
const processFontWeight = (key, value) => {
  return {
    [key]: transformFontWeight(value)
  };
};
const transformLineHeight = (value, styles, container) => {
  if (value === '') return value;
  const fontSize = transformUnit$1(container, styles.fontSize || 18);
  const lineHeight = transformUnit$1(container, value);
  // Percent values: use this number multiplied by the element's font size
  const {
    percent
  } = matchPercent(lineHeight) || {};
  if (percent) return percent * fontSize;
  // Unitless values: use this number multiplied by the element's font size
  return isNaN(value) ? lineHeight : lineHeight * fontSize;
};
const processLineHeight = (key, value, container, styles) => {
  return {
    [key]: transformLineHeight(value, styles, container)
  };
};
const handlers$2 = {
  direction: processNoopValue,
  fontFamily: processNoopValue,
  fontSize: processUnitValue,
  fontStyle: processNoopValue,
  fontWeight: processFontWeight,
  letterSpacing: processUnitValue,
  lineHeight: processLineHeight,
  maxLines: processNumberValue,
  textAlign: processNoopValue,
  textDecoration: processNoopValue,
  textDecorationColor: processColorValue,
  textDecorationStyle: processNoopValue,
  textIndent: processNoopValue,
  textOverflow: processNoopValue,
  textTransform: processNoopValue,
  verticalAlign: processNoopValue
};
const matchNumber = value => typeof value === 'string' && /^-?\d*\.?\d*$/.test(value);
const castFloat = value => {
  if (typeof value !== 'string') return value;
  if (matchNumber(value)) return parseFloat(value);
  return value;
};
const parse = transformString => {
  const transforms = transformString.trim().split(/\)[ ,]|\)/);
  // Handle "initial", "inherit", "unset".
  if (transforms.length === 1) {
    return [[transforms[0], true]];
  }
  const parsed = [];
  for (let i = 0; i < transforms.length; i += 1) {
    const transform = transforms[i];
    if (transform) {
      const [name, rawValue] = transform.split('(');
      const splitChar = rawValue.indexOf(',') >= 0 ? ',' : ' ';
      const value = rawValue.split(splitChar).map(val => val.trim());
      parsed.push({
        operation: name.trim(),
        value
      });
    }
  }
  return parsed;
};
const parseAngle = value => {
  const unitsRegexp = /(-?\d*\.?\d*)(\w*)?/i;
  const [, angle, unit] = unitsRegexp.exec(value);
  const number = Number.parseFloat(angle);
  return unit === 'rad' ? number * 180 / Math.PI : number;
};
const normalizeTransformOperation = _ref7 => {
  let {
    operation,
    value
  } = _ref7;
  switch (operation) {
    case 'scale':
      {
        const [scaleX, scaleY = scaleX] = value.map(num => Number.parseFloat(num));
        return {
          operation: 'scale',
          value: [scaleX, scaleY]
        };
      }
    case 'scaleX':
      {
        return {
          operation: 'scale',
          value: [Number.parseFloat(value), 1]
        };
      }
    case 'scaleY':
      {
        return {
          operation: 'scale',
          value: [1, Number.parseFloat(value)]
        };
      }
    case 'rotate':
      {
        return {
          operation: 'rotate',
          value: [parseAngle(value)]
        };
      }
    case 'translate':
      {
        return {
          operation: 'translate',
          value: value.map(num => Number.parseFloat(num))
        };
      }
    case 'translateX':
      {
        return {
          operation: 'translate',
          value: [Number.parseFloat(value), 0]
        };
      }
    case 'translateY':
      {
        return {
          operation: 'translate',
          value: [0, Number.parseFloat(value)]
        };
      }
    case 'skew':
      {
        return {
          operation: 'skew',
          value: value.map(parseAngle)
        };
      }
    case 'skewX':
      {
        return {
          operation: 'skew',
          value: [parseAngle(value), 0]
        };
      }
    case 'skewY':
      {
        return {
          operation: 'skew',
          value: [0, parseAngle(value)]
        };
      }
    default:
      {
        return {
          operation,
          value: value.map(num => Number.parseFloat(num))
        };
      }
  }
};
const normalize$1 = operations => {
  return operations.map(operation => normalizeTransformOperation(operation));
};
const processTransform = (key, value) => {
  if (typeof value !== 'string') return {
    [key]: value
  };
  return {
    [key]: normalize$1(parse(value))
  };
};
const Y_AXIS_SHORTHANDS = {
  top: true,
  bottom: true
};
const sortTransformOriginPair = (a, b) => {
  if (Y_AXIS_SHORTHANDS[a]) return 1;
  if (Y_AXIS_SHORTHANDS[b]) return -1;
  return 0;
};
const getTransformOriginPair = values => {
  if (!values || values.length === 0) return ['center', 'center'];
  const pair = values.length === 1 ? [values[0], 'center'] : values;
  return pair.sort(sortTransformOriginPair);
};
// Transforms shorthand transformOrigin values
const processTransformOriginShorthand = (key, value, container) => {
  const match = `${value}`.split(' ');
  const pair = getTransformOriginPair(match);
  const transformOriginX = transformUnit$1(container, pair[0]);
  const transformOriginY = transformUnit$1(container, pair[1]);
  return {
    transformOriginX: offsetKeyword(transformOriginX) || castFloat(transformOriginX),
    transformOriginY: offsetKeyword(transformOriginY) || castFloat(transformOriginY)
  };
};
const processTransformOriginValue = (key, value, container) => {
  const v = transformUnit$1(container, value);
  return {
    [key]: offsetKeyword(v) || castFloat(v)
  };
};
const handlers$1 = {
  transform: processTransform,
  gradientTransform: processTransform,
  transformOrigin: processTransformOriginShorthand,
  transformOriginX: processTransformOriginValue,
  transformOriginY: processTransformOriginValue
};
const handlers = {
  fill: processColorValue,
  stroke: processColorValue,
  strokeDasharray: processNoopValue,
  strokeWidth: processUnitValue,
  fillOpacity: processNumberValue,
  strokeOpacity: processNumberValue,
  fillRule: processNoopValue,
  textAnchor: processNoopValue,
  strokeLinecap: processNoopValue,
  strokeLinejoin: processNoopValue,
  visibility: processNoopValue,
  clipPath: processNoopValue,
  dominantBaseline: processNoopValue
};
const shorthands = {
  ...handlers$b,
  ...handlers$a,
  ...handlers$9,
  ...handlers$8,
  ...handlers$7,
  ...handlers$6,
  ...handlers$5,
  ...handlers$4,
  ...handlers$3,
  ...handlers$2,
  ...handlers$1,
  ...handlers
};
/**
 * Expand the shorthand properties.
 *
 * @param style - Style object
 * @returns Expanded style object
 */
const resolve$1 = container => style => {
  const propsArray = Object.keys(style);
  const resolvedStyle = {};
  for (let i = 0; i < propsArray.length; i += 1) {
    const key = propsArray[i];
    const value = style[key];
    if (!shorthands[key]) {
      resolvedStyle[key] = value;
      continue;
    }
    const resolved = shorthands[key](key, value, container, style);
    const keys = Object.keys(resolved);
    for (let j = 0; j < keys.length; j += 1) {
      const propName = keys[j];
      const propValue = resolved[propName];
      resolvedStyle[propName] = propValue;
    }
  }
  return resolvedStyle;
};

/**
 * Resolves styles
 *
 * @param container
 * @param style - Style
 * @returns Resolved style
 */
const resolveStyles$1 = (container, style) => {
  const computeMediaQueries = value => resolveMediaQueries(container, value);
  return compose(resolve$1(container), computeMediaQueries, flatten$1)(style);
};

function bidiFactory() {
  var bidi = function (exports$1) {
    // Bidi character types data, auto generated
    var DATA = {
      "R": "13k,1a,2,3,3,2+1j,ch+16,a+1,5+2,2+n,5,a,4,6+16,4+3,h+1b,4mo,179q,2+9,2+11,2i9+7y,2+68,4,3+4,5+13,4+3,2+4k,3+29,8+cf,1t+7z,w+17,3+3m,1t+3z,16o1+5r,8+30,8+mc,29+1r,29+4v,75+73",
      "EN": "1c+9,3d+1,6,187+9,513,4+5,7+9,sf+j,175h+9,qw+q,161f+1d,4xt+a,25i+9",
      "ES": "17,2,6dp+1,f+1,av,16vr,mx+1,4o,2",
      "ET": "z+2,3h+3,b+1,ym,3e+1,2o,p4+1,8,6u,7c,g6,1wc,1n9+4,30+1b,2n,6d,qhx+1,h0m,a+1,49+2,63+1,4+1,6bb+3,12jj",
      "AN": "16o+5,2j+9,2+1,35,ed,1ff2+9,87+u",
      "CS": "18,2+1,b,2u,12k,55v,l,17v0,2,3,53,2+1,b",
      "B": "a,3,f+2,2v,690",
      "S": "9,2,k",
      "WS": "c,k,4f4,1vk+a,u,1j,335",
      "ON": "x+1,4+4,h+5,r+5,r+3,z,5+3,2+1,2+1,5,2+2,3+4,o,w,ci+1,8+d,3+d,6+8,2+g,39+1,9,6+1,2,33,b8,3+1,3c+1,7+1,5r,b,7h+3,sa+5,2,3i+6,jg+3,ur+9,2v,ij+1,9g+9,7+a,8m,4+1,49+x,14u,2+2,c+2,e+2,e+2,e+1,i+n,e+e,2+p,u+2,e+2,36+1,2+3,2+1,b,2+2,6+5,2,2,2,h+1,5+4,6+3,3+f,16+2,5+3l,3+81,1y+p,2+40,q+a,m+13,2r+ch,2+9e,75+hf,3+v,2+2w,6e+5,f+6,75+2a,1a+p,2+2g,d+5x,r+b,6+3,4+o,g,6+1,6+2,2k+1,4,2j,5h+z,1m+1,1e+f,t+2,1f+e,d+3,4o+3,2s+1,w,535+1r,h3l+1i,93+2,2s,b+1,3l+x,2v,4g+3,21+3,kz+1,g5v+1,5a,j+9,n+v,2,3,2+8,2+1,3+2,2,3,46+1,4+4,h+5,r+5,r+a,3h+2,4+6,b+4,78,1r+24,4+c,4,1hb,ey+6,103+j,16j+c,1ux+7,5+g,fsh,jdq+1t,4,57+2e,p1,1m,1m,1m,1m,4kt+1,7j+17,5+2r,d+e,3+e,2+e,2+10,m+4,w,1n+5,1q,4z+5,4b+rb,9+c,4+c,4+37,d+2g,8+b,l+b,5+1j,9+9,7+13,9+t,3+1,27+3c,2+29,2+3q,d+d,3+4,4+2,6+6,a+o,8+6,a+2,e+6,16+42,2+1i",
      "BN": "0+8,6+d,2s+5,2+p,e,4m9,1kt+2,2b+5,5+5,17q9+v,7k,6p+8,6+1,119d+3,440+7,96s+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+75,6p+2rz,1ben+1,1ekf+1,1ekf+1",
      "NSM": "lc+33,7o+6,7c+18,2,2+1,2+1,2,21+a,1d+k,h,2u+6,3+5,3+1,2+3,10,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,g+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+g,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,k1+w,2db+2,3y,2p+v,ff+3,30+1,n9x+3,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,r2,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+5,3+1,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2d+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,f0c+4,1o+6,t5,1s+3,2a,f5l+1,43t+2,i+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,gzhy+6n",
      "AL": "16w,3,2,e+1b,z+2,2+2s,g+1,8+1,b+m,2+t,s+2i,c+e,4h+f,1d+1e,1bwe+dp,3+3z,x+c,2+1,35+3y,2rm+z,5+7,b+5,dt+l,c+u,17nl+27,1t+27,4x+6n,3+d",
      "LRO": "6ct",
      "RLO": "6cu",
      "LRE": "6cq",
      "RLE": "6cr",
      "PDF": "6cs",
      "LRI": "6ee",
      "RLI": "6ef",
      "FSI": "6eg",
      "PDI": "6eh"
    };
    var TYPES = {};
    var TYPES_TO_NAMES = {};
    TYPES.L = 1; //L is the default
    TYPES_TO_NAMES[1] = 'L';
    Object.keys(DATA).forEach(function (type, i) {
      TYPES[type] = 1 << i + 1;
      TYPES_TO_NAMES[TYPES[type]] = type;
    });
    Object.freeze(TYPES);
    var ISOLATE_INIT_TYPES = TYPES.LRI | TYPES.RLI | TYPES.FSI;
    var STRONG_TYPES = TYPES.L | TYPES.R | TYPES.AL;
    var NEUTRAL_ISOLATE_TYPES = TYPES.B | TYPES.S | TYPES.WS | TYPES.ON | TYPES.FSI | TYPES.LRI | TYPES.RLI | TYPES.PDI;
    var BN_LIKE_TYPES = TYPES.BN | TYPES.RLE | TYPES.LRE | TYPES.RLO | TYPES.LRO | TYPES.PDF;
    var TRAILING_TYPES = TYPES.S | TYPES.WS | TYPES.B | ISOLATE_INIT_TYPES | TYPES.PDI | BN_LIKE_TYPES;
    var map = null;
    function parseData() {
      if (!map) {
        //const start = performance.now()
        map = new Map();
        var loop = function (type) {
          if (DATA.hasOwnProperty(type)) {
            var lastCode = 0;
            DATA[type].split(',').forEach(function (range) {
              var ref = range.split('+');
              var skip = ref[0];
              var step = ref[1];
              skip = parseInt(skip, 36);
              step = step ? parseInt(step, 36) : 0;
              map.set(lastCode += skip, TYPES[type]);
              for (var i = 0; i < step; i++) {
                map.set(++lastCode, TYPES[type]);
              }
            });
          }
        };
        for (var type in DATA) loop(type);
        //console.log(`char types parsed in ${performance.now() - start}ms`)
      }
    }

    /**
     * @param {string} char
     * @return {number}
     */
    function getBidiCharType(char) {
      parseData();
      return map.get(char.codePointAt(0)) || TYPES.L;
    }
    function getBidiCharTypeName(char) {
      return TYPES_TO_NAMES[getBidiCharType(char)];
    }

    // Bidi bracket pairs data, auto generated
    var data$1 = {
      "pairs": "14>1,1e>2,u>2,2wt>1,1>1,1ge>1,1wp>1,1j>1,f>1,hm>1,1>1,u>1,u6>1,1>1,+5,28>1,w>1,1>1,+3,b8>1,1>1,+3,1>3,-1>-1,3>1,1>1,+2,1s>1,1>1,x>1,th>1,1>1,+2,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,4q>1,1e>2,u>2,2>1,+1",
      "canonical": "6f1>-6dx,6dy>-6dx,6ec>-6ed,6ee>-6ed,6ww>2jj,-2ji>2jj,14r4>-1e7l,1e7m>-1e7l,1e7m>-1e5c,1e5d>-1e5b,1e5c>-14qx,14qy>-14qx,14vn>-1ecg,1ech>-1ecg,1edu>-1ecg,1eci>-1ecg,1eda>-1ecg,1eci>-1ecg,1eci>-168q,168r>-168q,168s>-14ye,14yf>-14ye"
    };

    /**
     * Parses an string that holds encoded codepoint mappings, e.g. for bracket pairs or
     * mirroring characters, as encoded by scripts/generateBidiData.js. Returns an object
     * holding the `map`, and optionally a `reverseMap` if `includeReverse:true`.
     * @param {string} encodedString
     * @param {boolean} includeReverse - true if you want reverseMap in the output
     * @return {{map: Map<number, number>, reverseMap?: Map<number, number>}}
     */
    function parseCharacterMap(encodedString, includeReverse) {
      var radix = 36;
      var lastCode = 0;
      var map = new Map();
      var reverseMap = includeReverse && new Map();
      var prevPair;
      encodedString.split(',').forEach(function visit(entry) {
        if (entry.indexOf('+') !== -1) {
          for (var i = +entry; i--;) {
            visit(prevPair);
          }
        } else {
          prevPair = entry;
          var ref = entry.split('>');
          var a = ref[0];
          var b = ref[1];
          a = String.fromCodePoint(lastCode += parseInt(a, radix));
          b = String.fromCodePoint(lastCode += parseInt(b, radix));
          map.set(a, b);
          includeReverse && reverseMap.set(b, a);
        }
      });
      return {
        map: map,
        reverseMap: reverseMap
      };
    }
    var openToClose, closeToOpen, canonical;
    function parse$1() {
      if (!openToClose) {
        //const start = performance.now()
        var ref = parseCharacterMap(data$1.pairs, true);
        var map = ref.map;
        var reverseMap = ref.reverseMap;
        openToClose = map;
        closeToOpen = reverseMap;
        canonical = parseCharacterMap(data$1.canonical, false).map;
        //console.log(`brackets parsed in ${performance.now() - start}ms`)
      }
    }
    function openingToClosingBracket(char) {
      parse$1();
      return openToClose.get(char) || null;
    }
    function closingToOpeningBracket(char) {
      parse$1();
      return closeToOpen.get(char) || null;
    }
    function getCanonicalBracket(char) {
      parse$1();
      return canonical.get(char) || null;
    }

    // Local type aliases
    var TYPE_L = TYPES.L;
    var TYPE_R = TYPES.R;
    var TYPE_EN = TYPES.EN;
    var TYPE_ES = TYPES.ES;
    var TYPE_ET = TYPES.ET;
    var TYPE_AN = TYPES.AN;
    var TYPE_CS = TYPES.CS;
    var TYPE_B = TYPES.B;
    var TYPE_S = TYPES.S;
    var TYPE_ON = TYPES.ON;
    var TYPE_BN = TYPES.BN;
    var TYPE_NSM = TYPES.NSM;
    var TYPE_AL = TYPES.AL;
    var TYPE_LRO = TYPES.LRO;
    var TYPE_RLO = TYPES.RLO;
    var TYPE_LRE = TYPES.LRE;
    var TYPE_RLE = TYPES.RLE;
    var TYPE_PDF = TYPES.PDF;
    var TYPE_LRI = TYPES.LRI;
    var TYPE_RLI = TYPES.RLI;
    var TYPE_FSI = TYPES.FSI;
    var TYPE_PDI = TYPES.PDI;

    /**
     * @typedef {object} GetEmbeddingLevelsResult
     * @property {{start, end, level}[]} paragraphs
     * @property {Uint8Array} levels
     */

    /**
     * This function applies the Bidirectional Algorithm to a string, returning the resolved embedding levels
     * in a single Uint8Array plus a list of objects holding each paragraph's start and end indices and resolved
     * base embedding level.
     *
     * @param {string} string - The input string
     * @param {"ltr"|"rtl"|"auto"} [baseDirection] - Use "ltr" or "rtl" to force a base paragraph direction,
     *        otherwise a direction will be chosen automatically from each paragraph's contents.
     * @return {GetEmbeddingLevelsResult}
     */
    function getEmbeddingLevels(string, baseDirection) {
      var MAX_DEPTH = 125;

      // Start by mapping all characters to their unicode type, as a bitmask integer
      var charTypes = new Uint32Array(string.length);
      for (var i = 0; i < string.length; i++) {
        charTypes[i] = getBidiCharType(string[i]);
      }
      var charTypeCounts = new Map(); //will be cleared at start of each paragraph
      function changeCharType(i, type) {
        var oldType = charTypes[i];
        charTypes[i] = type;
        charTypeCounts.set(oldType, charTypeCounts.get(oldType) - 1);
        if (oldType & NEUTRAL_ISOLATE_TYPES) {
          charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) - 1);
        }
        charTypeCounts.set(type, (charTypeCounts.get(type) || 0) + 1);
        if (type & NEUTRAL_ISOLATE_TYPES) {
          charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
        }
      }
      var embedLevels = new Uint8Array(string.length);
      var isolationPairs = new Map(); //init->pdi and pdi->init

      // === 3.3.1 The Paragraph Level ===
      // 3.3.1 P1: Split the text into paragraphs
      var paragraphs = []; // [{start, end, level}, ...]
      var paragraph = null;
      for (var i$1 = 0; i$1 < string.length; i$1++) {
        if (!paragraph) {
          paragraphs.push(paragraph = {
            start: i$1,
            end: string.length - 1,
            // 3.3.1 P2-P3: Determine the paragraph level
            level: baseDirection === 'rtl' ? 1 : baseDirection === 'ltr' ? 0 : determineAutoEmbedLevel(i$1, false)
          });
        }
        if (charTypes[i$1] & TYPE_B) {
          paragraph.end = i$1;
          paragraph = null;
        }
      }
      var FORMATTING_TYPES = TYPE_RLE | TYPE_LRE | TYPE_RLO | TYPE_LRO | ISOLATE_INIT_TYPES | TYPE_PDI | TYPE_PDF | TYPE_B;
      var nextEven = function (n) {
        return n + (n & 1 ? 1 : 2);
      };
      var nextOdd = function (n) {
        return n + (n & 1 ? 2 : 1);
      };

      // Everything from here on will operate per paragraph.
      for (var paraIdx = 0; paraIdx < paragraphs.length; paraIdx++) {
        paragraph = paragraphs[paraIdx];
        var statusStack = [{
          _level: paragraph.level,
          _override: 0,
          //0=neutral, 1=L, 2=R
          _isolate: 0 //bool
        }];
        var stackTop = void 0;
        var overflowIsolateCount = 0;
        var overflowEmbeddingCount = 0;
        var validIsolateCount = 0;
        charTypeCounts.clear();

        // === 3.3.2 Explicit Levels and Directions ===
        for (var i$2 = paragraph.start; i$2 <= paragraph.end; i$2++) {
          var charType = charTypes[i$2];
          stackTop = statusStack[statusStack.length - 1];

          // Set initial counts
          charTypeCounts.set(charType, (charTypeCounts.get(charType) || 0) + 1);
          if (charType & NEUTRAL_ISOLATE_TYPES) {
            charTypeCounts.set(NEUTRAL_ISOLATE_TYPES, (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES) || 0) + 1);
          }

          // Explicit Embeddings: 3.3.2 X2 - X3
          if (charType & FORMATTING_TYPES) {
            //prefilter all formatters
            if (charType & (TYPE_RLE | TYPE_LRE)) {
              embedLevels[i$2] = stackTop._level; // 5.2
              var level = (charType === TYPE_RLE ? nextOdd : nextEven)(stackTop._level);
              if (level <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
                statusStack.push({
                  _level: level,
                  _override: 0,
                  _isolate: 0
                });
              } else if (!overflowIsolateCount) {
                overflowEmbeddingCount++;
              }
            }

            // Explicit Overrides: 3.3.2 X4 - X5
            else if (charType & (TYPE_RLO | TYPE_LRO)) {
              embedLevels[i$2] = stackTop._level; // 5.2
              var level$1 = (charType === TYPE_RLO ? nextOdd : nextEven)(stackTop._level);
              if (level$1 <= MAX_DEPTH && !overflowIsolateCount && !overflowEmbeddingCount) {
                statusStack.push({
                  _level: level$1,
                  _override: charType & TYPE_RLO ? TYPE_R : TYPE_L,
                  _isolate: 0
                });
              } else if (!overflowIsolateCount) {
                overflowEmbeddingCount++;
              }
            }

            // Isolates: 3.3.2 X5a - X5c
            else if (charType & ISOLATE_INIT_TYPES) {
              // X5c - FSI becomes either RLI or LRI
              if (charType & TYPE_FSI) {
                charType = determineAutoEmbedLevel(i$2 + 1, true) === 1 ? TYPE_RLI : TYPE_LRI;
              }
              embedLevels[i$2] = stackTop._level;
              if (stackTop._override) {
                changeCharType(i$2, stackTop._override);
              }
              var level$2 = (charType === TYPE_RLI ? nextOdd : nextEven)(stackTop._level);
              if (level$2 <= MAX_DEPTH && overflowIsolateCount === 0 && overflowEmbeddingCount === 0) {
                validIsolateCount++;
                statusStack.push({
                  _level: level$2,
                  _override: 0,
                  _isolate: 1,
                  _isolInitIndex: i$2
                });
              } else {
                overflowIsolateCount++;
              }
            }

            // Terminating Isolates: 3.3.2 X6a
            else if (charType & TYPE_PDI) {
              if (overflowIsolateCount > 0) {
                overflowIsolateCount--;
              } else if (validIsolateCount > 0) {
                overflowEmbeddingCount = 0;
                while (!statusStack[statusStack.length - 1]._isolate) {
                  statusStack.pop();
                }
                // Add to isolation pairs bidirectional mapping:
                var isolInitIndex = statusStack[statusStack.length - 1]._isolInitIndex;
                if (isolInitIndex != null) {
                  isolationPairs.set(isolInitIndex, i$2);
                  isolationPairs.set(i$2, isolInitIndex);
                }
                statusStack.pop();
                validIsolateCount--;
              }
              stackTop = statusStack[statusStack.length - 1];
              embedLevels[i$2] = stackTop._level;
              if (stackTop._override) {
                changeCharType(i$2, stackTop._override);
              }
            }

            // Terminating Embeddings and Overrides: 3.3.2 X7
            else if (charType & TYPE_PDF) {
              if (overflowIsolateCount === 0) {
                if (overflowEmbeddingCount > 0) {
                  overflowEmbeddingCount--;
                } else if (!stackTop._isolate && statusStack.length > 1) {
                  statusStack.pop();
                  stackTop = statusStack[statusStack.length - 1];
                }
              }
              embedLevels[i$2] = stackTop._level; // 5.2
            }

            // End of Paragraph: 3.3.2 X8
            else if (charType & TYPE_B) {
              embedLevels[i$2] = paragraph.level;
            }
          }

          // Non-formatting characters: 3.3.2 X6
          else {
            embedLevels[i$2] = stackTop._level;
            // NOTE: This exclusion of BN seems to go against what section 5.2 says, but is required for test passage
            if (stackTop._override && charType !== TYPE_BN) {
              changeCharType(i$2, stackTop._override);
            }
          }
        }

        // === 3.3.3 Preparations for Implicit Processing ===

        // Remove all RLE, LRE, RLO, LRO, PDF, and BN characters: 3.3.3 X9
        // Note: Due to section 5.2, we won't remove them, but we'll use the BN_LIKE_TYPES bitset to
        // easily ignore them all from here on out.

        // 3.3.3 X10
        // Compute the set of isolating run sequences as specified by BD13
        var levelRuns = [];
        var currentRun = null;
        for (var i$3 = paragraph.start; i$3 <= paragraph.end; i$3++) {
          var charType$1 = charTypes[i$3];
          if (!(charType$1 & BN_LIKE_TYPES)) {
            var lvl = embedLevels[i$3];
            var isIsolInit = charType$1 & ISOLATE_INIT_TYPES;
            var isPDI = charType$1 === TYPE_PDI;
            if (currentRun && lvl === currentRun._level) {
              currentRun._end = i$3;
              currentRun._endsWithIsolInit = isIsolInit;
            } else {
              levelRuns.push(currentRun = {
                _start: i$3,
                _end: i$3,
                _level: lvl,
                _startsWithPDI: isPDI,
                _endsWithIsolInit: isIsolInit
              });
            }
          }
        }
        var isolatingRunSeqs = []; // [{seqIndices: [], sosType: L|R, eosType: L|R}]
        for (var runIdx = 0; runIdx < levelRuns.length; runIdx++) {
          var run = levelRuns[runIdx];
          if (!run._startsWithPDI || run._startsWithPDI && !isolationPairs.has(run._start)) {
            var seqRuns = [currentRun = run];
            for (var pdiIndex = void 0; currentRun && currentRun._endsWithIsolInit && (pdiIndex = isolationPairs.get(currentRun._end)) != null;) {
              for (var i$4 = runIdx + 1; i$4 < levelRuns.length; i$4++) {
                if (levelRuns[i$4]._start === pdiIndex) {
                  seqRuns.push(currentRun = levelRuns[i$4]);
                  break;
                }
              }
            }
            // build flat list of indices across all runs:
            var seqIndices = [];
            for (var i$5 = 0; i$5 < seqRuns.length; i$5++) {
              var run$1 = seqRuns[i$5];
              for (var j = run$1._start; j <= run$1._end; j++) {
                seqIndices.push(j);
              }
            }
            // determine the sos/eos types:
            var firstLevel = embedLevels[seqIndices[0]];
            var prevLevel = paragraph.level;
            for (var i$6 = seqIndices[0] - 1; i$6 >= 0; i$6--) {
              if (!(charTypes[i$6] & BN_LIKE_TYPES)) {
                //5.2
                prevLevel = embedLevels[i$6];
                break;
              }
            }
            var lastIndex = seqIndices[seqIndices.length - 1];
            var lastLevel = embedLevels[lastIndex];
            var nextLevel = paragraph.level;
            if (!(charTypes[lastIndex] & ISOLATE_INIT_TYPES)) {
              for (var i$7 = lastIndex + 1; i$7 <= paragraph.end; i$7++) {
                if (!(charTypes[i$7] & BN_LIKE_TYPES)) {
                  //5.2
                  nextLevel = embedLevels[i$7];
                  break;
                }
              }
            }
            isolatingRunSeqs.push({
              _seqIndices: seqIndices,
              _sosType: Math.max(prevLevel, firstLevel) % 2 ? TYPE_R : TYPE_L,
              _eosType: Math.max(nextLevel, lastLevel) % 2 ? TYPE_R : TYPE_L
            });
          }
        }

        // The next steps are done per isolating run sequence
        for (var seqIdx = 0; seqIdx < isolatingRunSeqs.length; seqIdx++) {
          var ref = isolatingRunSeqs[seqIdx];
          var seqIndices$1 = ref._seqIndices;
          var sosType = ref._sosType;
          var eosType = ref._eosType;
          /**
           * All the level runs in an isolating run sequence have the same embedding level.
           * 
           * DO NOT change any `embedLevels[i]` within the current scope.
           */
          var embedDirection = embedLevels[seqIndices$1[0]] & 1 ? TYPE_R : TYPE_L;

          // === 3.3.4 Resolving Weak Types ===

          // W1 + 5.2. Search backward from each NSM to the first character in the isolating run sequence whose
          // bidirectional type is not BN, and set the NSM to ON if it is an isolate initiator or PDI, and to its
          // type otherwise. If the NSM is the first non-BN character, change the NSM to the type of sos.
          if (charTypeCounts.get(TYPE_NSM)) {
            for (var si = 0; si < seqIndices$1.length; si++) {
              var i$8 = seqIndices$1[si];
              if (charTypes[i$8] & TYPE_NSM) {
                var prevType = sosType;
                for (var sj = si - 1; sj >= 0; sj--) {
                  if (!(charTypes[seqIndices$1[sj]] & BN_LIKE_TYPES)) {
                    //5.2 scan back to first non-BN
                    prevType = charTypes[seqIndices$1[sj]];
                    break;
                  }
                }
                changeCharType(i$8, prevType & (ISOLATE_INIT_TYPES | TYPE_PDI) ? TYPE_ON : prevType);
              }
            }
          }

          // W2. Search backward from each instance of a European number until the first strong type (R, L, AL, or sos)
          // is found. If an AL is found, change the type of the European number to Arabic number.
          if (charTypeCounts.get(TYPE_EN)) {
            for (var si$1 = 0; si$1 < seqIndices$1.length; si$1++) {
              var i$9 = seqIndices$1[si$1];
              if (charTypes[i$9] & TYPE_EN) {
                for (var sj$1 = si$1 - 1; sj$1 >= -1; sj$1--) {
                  var prevCharType = sj$1 === -1 ? sosType : charTypes[seqIndices$1[sj$1]];
                  if (prevCharType & STRONG_TYPES) {
                    if (prevCharType === TYPE_AL) {
                      changeCharType(i$9, TYPE_AN);
                    }
                    break;
                  }
                }
              }
            }
          }

          // W3. Change all ALs to R
          if (charTypeCounts.get(TYPE_AL)) {
            for (var si$2 = 0; si$2 < seqIndices$1.length; si$2++) {
              var i$10 = seqIndices$1[si$2];
              if (charTypes[i$10] & TYPE_AL) {
                changeCharType(i$10, TYPE_R);
              }
            }
          }

          // W4. A single European separator between two European numbers changes to a European number. A single common
          // separator between two numbers of the same type changes to that type.
          if (charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
            for (var si$3 = 1; si$3 < seqIndices$1.length - 1; si$3++) {
              var i$11 = seqIndices$1[si$3];
              if (charTypes[i$11] & (TYPE_ES | TYPE_CS)) {
                var prevType$1 = 0,
                  nextType = 0;
                for (var sj$2 = si$3 - 1; sj$2 >= 0; sj$2--) {
                  prevType$1 = charTypes[seqIndices$1[sj$2]];
                  if (!(prevType$1 & BN_LIKE_TYPES)) {
                    //5.2
                    break;
                  }
                }
                for (var sj$3 = si$3 + 1; sj$3 < seqIndices$1.length; sj$3++) {
                  nextType = charTypes[seqIndices$1[sj$3]];
                  if (!(nextType & BN_LIKE_TYPES)) {
                    //5.2
                    break;
                  }
                }
                if (prevType$1 === nextType && (charTypes[i$11] === TYPE_ES ? prevType$1 === TYPE_EN : prevType$1 & (TYPE_EN | TYPE_AN))) {
                  changeCharType(i$11, prevType$1);
                }
              }
            }
          }

          // W5. A sequence of European terminators adjacent to European numbers changes to all European numbers.
          if (charTypeCounts.get(TYPE_EN)) {
            for (var si$4 = 0; si$4 < seqIndices$1.length; si$4++) {
              var i$12 = seqIndices$1[si$4];
              if (charTypes[i$12] & TYPE_EN) {
                for (var sj$4 = si$4 - 1; sj$4 >= 0 && charTypes[seqIndices$1[sj$4]] & (TYPE_ET | BN_LIKE_TYPES); sj$4--) {
                  changeCharType(seqIndices$1[sj$4], TYPE_EN);
                }
                for (si$4++; si$4 < seqIndices$1.length && charTypes[seqIndices$1[si$4]] & (TYPE_ET | BN_LIKE_TYPES | TYPE_EN); si$4++) {
                  if (charTypes[seqIndices$1[si$4]] !== TYPE_EN) {
                    changeCharType(seqIndices$1[si$4], TYPE_EN);
                  }
                }
              }
            }
          }

          // W6. Otherwise, separators and terminators change to Other Neutral.
          if (charTypeCounts.get(TYPE_ET) || charTypeCounts.get(TYPE_ES) || charTypeCounts.get(TYPE_CS)) {
            for (var si$5 = 0; si$5 < seqIndices$1.length; si$5++) {
              var i$13 = seqIndices$1[si$5];
              if (charTypes[i$13] & (TYPE_ET | TYPE_ES | TYPE_CS)) {
                changeCharType(i$13, TYPE_ON);
                // 5.2 transform adjacent BNs too:
                for (var sj$5 = si$5 - 1; sj$5 >= 0 && charTypes[seqIndices$1[sj$5]] & BN_LIKE_TYPES; sj$5--) {
                  changeCharType(seqIndices$1[sj$5], TYPE_ON);
                }
                for (var sj$6 = si$5 + 1; sj$6 < seqIndices$1.length && charTypes[seqIndices$1[sj$6]] & BN_LIKE_TYPES; sj$6++) {
                  changeCharType(seqIndices$1[sj$6], TYPE_ON);
                }
              }
            }
          }

          // W7. Search backward from each instance of a European number until the first strong type (R, L, or sos)
          // is found. If an L is found, then change the type of the European number to L.
          // NOTE: implemented in single forward pass for efficiency
          if (charTypeCounts.get(TYPE_EN)) {
            for (var si$6 = 0, prevStrongType = sosType; si$6 < seqIndices$1.length; si$6++) {
              var i$14 = seqIndices$1[si$6];
              var type = charTypes[i$14];
              if (type & TYPE_EN) {
                if (prevStrongType === TYPE_L) {
                  changeCharType(i$14, TYPE_L);
                }
              } else if (type & STRONG_TYPES) {
                prevStrongType = type;
              }
            }
          }

          // === 3.3.5 Resolving Neutral and Isolate Formatting Types ===

          if (charTypeCounts.get(NEUTRAL_ISOLATE_TYPES)) {
            // N0. Process bracket pairs in an isolating run sequence sequentially in the logical order of the text
            // positions of the opening paired brackets using the logic given below. Within this scope, bidirectional
            // types EN and AN are treated as R.
            var R_TYPES_FOR_N_STEPS = TYPE_R | TYPE_EN | TYPE_AN;
            var STRONG_TYPES_FOR_N_STEPS = R_TYPES_FOR_N_STEPS | TYPE_L;

            // * Identify the bracket pairs in the current isolating run sequence according to BD16.
            var bracketPairs = [];
            {
              var openerStack = [];
              for (var si$7 = 0; si$7 < seqIndices$1.length; si$7++) {
                // NOTE: for any potential bracket character we also test that it still carries a NI
                // type, as that may have been changed earlier. This doesn't seem to be explicitly
                // called out in the spec, but is required for passage of certain tests.
                if (charTypes[seqIndices$1[si$7]] & NEUTRAL_ISOLATE_TYPES) {
                  var char = string[seqIndices$1[si$7]];
                  var oppositeBracket = void 0;
                  // Opening bracket
                  if (openingToClosingBracket(char) !== null) {
                    if (openerStack.length < 63) {
                      openerStack.push({
                        char: char,
                        seqIndex: si$7
                      });
                    } else {
                      break;
                    }
                  }
                  // Closing bracket
                  else if ((oppositeBracket = closingToOpeningBracket(char)) !== null) {
                    for (var stackIdx = openerStack.length - 1; stackIdx >= 0; stackIdx--) {
                      var stackChar = openerStack[stackIdx].char;
                      if (stackChar === oppositeBracket || stackChar === closingToOpeningBracket(getCanonicalBracket(char)) || openingToClosingBracket(getCanonicalBracket(stackChar)) === char) {
                        bracketPairs.push([openerStack[stackIdx].seqIndex, si$7]);
                        openerStack.length = stackIdx; //pop the matching bracket and all following
                        break;
                      }
                    }
                  }
                }
              }
              bracketPairs.sort(function (a, b) {
                return a[0] - b[0];
              });
            }
            // * For each bracket-pair element in the list of pairs of text positions
            for (var pairIdx = 0; pairIdx < bracketPairs.length; pairIdx++) {
              var ref$1 = bracketPairs[pairIdx];
              var openSeqIdx = ref$1[0];
              var closeSeqIdx = ref$1[1];
              // a. Inspect the bidirectional types of the characters enclosed within the bracket pair.
              // b. If any strong type (either L or R) matching the embedding direction is found, set the type for both
              // brackets in the pair to match the embedding direction.
              var foundStrongType = false;
              var useStrongType = 0;
              for (var si$8 = openSeqIdx + 1; si$8 < closeSeqIdx; si$8++) {
                var i$15 = seqIndices$1[si$8];
                if (charTypes[i$15] & STRONG_TYPES_FOR_N_STEPS) {
                  foundStrongType = true;
                  var lr = charTypes[i$15] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                  if (lr === embedDirection) {
                    useStrongType = lr;
                    break;
                  }
                }
              }
              // c. Otherwise, if there is a strong type it must be opposite the embedding direction. Therefore, test
              // for an established context with a preceding strong type by checking backwards before the opening paired
              // bracket until the first strong type (L, R, or sos) is found.
              //    1. If the preceding strong type is also opposite the embedding direction, context is established, so
              //    set the type for both brackets in the pair to that direction.
              //    2. Otherwise set the type for both brackets in the pair to the embedding direction.
              if (foundStrongType && !useStrongType) {
                useStrongType = sosType;
                for (var si$9 = openSeqIdx - 1; si$9 >= 0; si$9--) {
                  var i$16 = seqIndices$1[si$9];
                  if (charTypes[i$16] & STRONG_TYPES_FOR_N_STEPS) {
                    var lr$1 = charTypes[i$16] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                    if (lr$1 !== embedDirection) {
                      useStrongType = lr$1;
                    } else {
                      useStrongType = embedDirection;
                    }
                    break;
                  }
                }
              }
              if (useStrongType) {
                charTypes[seqIndices$1[openSeqIdx]] = charTypes[seqIndices$1[closeSeqIdx]] = useStrongType;
                // * Any number of characters that had original bidirectional character type NSM prior to the application
                // of W1 that immediately follow a paired bracket which changed to L or R under N0 should change to match
                // the type of their preceding bracket.
                if (useStrongType !== embedDirection) {
                  for (var si$10 = openSeqIdx + 1; si$10 < seqIndices$1.length; si$10++) {
                    if (!(charTypes[seqIndices$1[si$10]] & BN_LIKE_TYPES)) {
                      if (getBidiCharType(string[seqIndices$1[si$10]]) & TYPE_NSM) {
                        charTypes[seqIndices$1[si$10]] = useStrongType;
                      }
                      break;
                    }
                  }
                }
                if (useStrongType !== embedDirection) {
                  for (var si$11 = closeSeqIdx + 1; si$11 < seqIndices$1.length; si$11++) {
                    if (!(charTypes[seqIndices$1[si$11]] & BN_LIKE_TYPES)) {
                      if (getBidiCharType(string[seqIndices$1[si$11]]) & TYPE_NSM) {
                        charTypes[seqIndices$1[si$11]] = useStrongType;
                      }
                      break;
                    }
                  }
                }
              }
            }

            // N1. A sequence of NIs takes the direction of the surrounding strong text if the text on both sides has the
            // same direction.
            // N2. Any remaining NIs take the embedding direction.
            for (var si$12 = 0; si$12 < seqIndices$1.length; si$12++) {
              if (charTypes[seqIndices$1[si$12]] & NEUTRAL_ISOLATE_TYPES) {
                var niRunStart = si$12,
                  niRunEnd = si$12;
                var prevType$2 = sosType; //si === 0 ? sosType : (charTypes[seqIndices[si - 1]] & R_TYPES_FOR_N_STEPS) ? TYPE_R : TYPE_L
                for (var si2 = si$12 - 1; si2 >= 0; si2--) {
                  if (charTypes[seqIndices$1[si2]] & BN_LIKE_TYPES) {
                    niRunStart = si2; //5.2 treat BNs adjacent to NIs as NIs
                  } else {
                    prevType$2 = charTypes[seqIndices$1[si2]] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                    break;
                  }
                }
                var nextType$1 = eosType;
                for (var si2$1 = si$12 + 1; si2$1 < seqIndices$1.length; si2$1++) {
                  if (charTypes[seqIndices$1[si2$1]] & (NEUTRAL_ISOLATE_TYPES | BN_LIKE_TYPES)) {
                    niRunEnd = si2$1;
                  } else {
                    nextType$1 = charTypes[seqIndices$1[si2$1]] & R_TYPES_FOR_N_STEPS ? TYPE_R : TYPE_L;
                    break;
                  }
                }
                for (var sj$7 = niRunStart; sj$7 <= niRunEnd; sj$7++) {
                  charTypes[seqIndices$1[sj$7]] = prevType$2 === nextType$1 ? prevType$2 : embedDirection;
                }
                si$12 = niRunEnd;
              }
            }
          }
        }

        // === 3.3.6 Resolving Implicit Levels ===

        for (var i$17 = paragraph.start; i$17 <= paragraph.end; i$17++) {
          var level$3 = embedLevels[i$17];
          var type$1 = charTypes[i$17];
          // I2. For all characters with an odd (right-to-left) embedding level, those of type L, EN or AN go up one level.
          if (level$3 & 1) {
            if (type$1 & (TYPE_L | TYPE_EN | TYPE_AN)) {
              embedLevels[i$17]++;
            }
          }
          // I1. For all characters with an even (left-to-right) embedding level, those of type R go up one level
          // and those of type AN or EN go up two levels.
          else {
            if (type$1 & TYPE_R) {
              embedLevels[i$17]++;
            } else if (type$1 & (TYPE_AN | TYPE_EN)) {
              embedLevels[i$17] += 2;
            }
          }

          // 5.2: Resolve any LRE, RLE, LRO, RLO, PDF, or BN to the level of the preceding character if there is one,
          // and otherwise to the base level.
          if (type$1 & BN_LIKE_TYPES) {
            embedLevels[i$17] = i$17 === 0 ? paragraph.level : embedLevels[i$17 - 1];
          }

          // 3.4 L1.1-4: Reset the embedding level of segment/paragraph separators, and any sequence of whitespace or
          // isolate formatting characters preceding them or the end of the paragraph, to the paragraph level.
          // NOTE: this will also need to be applied to each individual line ending after line wrapping occurs.
          if (i$17 === paragraph.end || getBidiCharType(string[i$17]) & (TYPE_S | TYPE_B)) {
            for (var j$1 = i$17; j$1 >= 0 && getBidiCharType(string[j$1]) & TRAILING_TYPES; j$1--) {
              embedLevels[j$1] = paragraph.level;
            }
          }
        }
      }

      // DONE! The resolved levels can then be used, after line wrapping, to flip runs of characters
      // according to section 3.4 Reordering Resolved Levels
      return {
        levels: embedLevels,
        paragraphs: paragraphs
      };
      function determineAutoEmbedLevel(start, isFSI) {
        // 3.3.1 P2 - P3
        for (var i = start; i < string.length; i++) {
          var charType = charTypes[i];
          if (charType & (TYPE_R | TYPE_AL)) {
            return 1;
          }
          if (charType & (TYPE_B | TYPE_L) || isFSI && charType === TYPE_PDI) {
            return 0;
          }
          if (charType & ISOLATE_INIT_TYPES) {
            var pdi = indexOfMatchingPDI(i);
            i = pdi === -1 ? string.length : pdi;
          }
        }
        return 0;
      }
      function indexOfMatchingPDI(isolateStart) {
        // 3.1.2 BD9
        var isolationLevel = 1;
        for (var i = isolateStart + 1; i < string.length; i++) {
          var charType = charTypes[i];
          if (charType & TYPE_B) {
            break;
          }
          if (charType & TYPE_PDI) {
            if (--isolationLevel === 0) {
              return i;
            }
          } else if (charType & ISOLATE_INIT_TYPES) {
            isolationLevel++;
          }
        }
        return -1;
      }
    }

    // Bidi mirrored chars data, auto generated
    var data = "14>1,j>2,t>2,u>2,1a>g,2v3>1,1>1,1ge>1,1wd>1,b>1,1j>1,f>1,ai>3,-2>3,+1,8>1k0,-1jq>1y7,-1y6>1hf,-1he>1h6,-1h5>1ha,-1h8>1qi,-1pu>1,6>3u,-3s>7,6>1,1>1,f>1,1>1,+2,3>1,1>1,+13,4>1,1>1,6>1eo,-1ee>1,3>1mg,-1me>1mk,-1mj>1mi,-1mg>1mi,-1md>1,1>1,+2,1>10k,-103>1,1>1,4>1,5>1,1>1,+10,3>1,1>8,-7>8,+1,-6>7,+1,a>1,1>1,u>1,u6>1,1>1,+5,26>1,1>1,2>1,2>2,8>1,7>1,4>1,1>1,+5,b8>1,1>1,+3,1>3,-2>1,2>1,1>1,+2,c>1,3>1,1>1,+2,h>1,3>1,a>1,1>1,2>1,3>1,1>1,d>1,f>1,3>1,1a>1,1>1,6>1,7>1,13>1,k>1,1>1,+19,4>1,1>1,+2,2>1,1>1,+18,m>1,a>1,1>1,lk>1,1>1,4>1,2>1,f>1,3>1,1>1,+3,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,6>1,4j>1,j>2,t>2,u>2,2>1,+1";
    var mirrorMap;
    function parse() {
      if (!mirrorMap) {
        //const start = performance.now()
        var ref = parseCharacterMap(data, true);
        var map = ref.map;
        var reverseMap = ref.reverseMap;
        // Combine both maps into one
        reverseMap.forEach(function (value, key) {
          map.set(key, value);
        });
        mirrorMap = map;
        //console.log(`mirrored chars parsed in ${performance.now() - start}ms`)
      }
    }
    function getMirroredCharacter(char) {
      parse();
      return mirrorMap.get(char) || null;
    }

    /**
     * Given a string and its resolved embedding levels, build a map of indices to replacement chars
     * for any characters in right-to-left segments that have defined mirrored characters.
     * @param string
     * @param embeddingLevels
     * @param [start]
     * @param [end]
     * @return {Map<number, string>}
     */
    function getMirroredCharactersMap(string, embeddingLevels, start, end) {
      var strLen = string.length;
      start = Math.max(0, start == null ? 0 : +start);
      end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);
      var map = new Map();
      for (var i = start; i <= end; i++) {
        if (embeddingLevels[i] & 1) {
          //only odd (rtl) levels
          var mirror = getMirroredCharacter(string[i]);
          if (mirror !== null) {
            map.set(i, mirror);
          }
        }
      }
      return map;
    }

    /**
     * Given a start and end denoting a single line within a string, and a set of precalculated
     * bidi embedding levels, produce a list of segments whose ordering should be flipped, in sequence.
     * @param {string} string - the full input string
     * @param {GetEmbeddingLevelsResult} embeddingLevelsResult - the result object from getEmbeddingLevels
     * @param {number} [start] - first character in a subset of the full string
     * @param {number} [end] - last character in a subset of the full string
     * @return {number[][]} - the list of start/end segments that should be flipped, in order.
     */
    function getReorderSegments(string, embeddingLevelsResult, start, end) {
      var strLen = string.length;
      start = Math.max(0, start == null ? 0 : +start);
      end = Math.min(strLen - 1, end == null ? strLen - 1 : +end);
      var segments = [];
      embeddingLevelsResult.paragraphs.forEach(function (paragraph) {
        var lineStart = Math.max(start, paragraph.start);
        var lineEnd = Math.min(end, paragraph.end);
        if (lineStart < lineEnd) {
          // Local slice for mutation
          var lineLevels = embeddingLevelsResult.levels.slice(lineStart, lineEnd + 1);

          // 3.4 L1.4: Reset any sequence of whitespace characters and/or isolate formatting characters at the
          // end of the line to the paragraph level.
          for (var i = lineEnd; i >= lineStart && getBidiCharType(string[i]) & TRAILING_TYPES; i--) {
            lineLevels[i] = paragraph.level;
          }

          // L2. From the highest level found in the text to the lowest odd level on each line, including intermediate levels
          // not actually present in the text, reverse any contiguous sequence of characters that are at that level or higher.
          var maxLevel = paragraph.level;
          var minOddLevel = Infinity;
          for (var i$1 = 0; i$1 < lineLevels.length; i$1++) {
            var level = lineLevels[i$1];
            if (level > maxLevel) {
              maxLevel = level;
            }
            if (level < minOddLevel) {
              minOddLevel = level | 1;
            }
          }
          for (var lvl = maxLevel; lvl >= minOddLevel; lvl--) {
            for (var i$2 = 0; i$2 < lineLevels.length; i$2++) {
              if (lineLevels[i$2] >= lvl) {
                var segStart = i$2;
                while (i$2 + 1 < lineLevels.length && lineLevels[i$2 + 1] >= lvl) {
                  i$2++;
                }
                if (i$2 > segStart) {
                  segments.push([segStart + lineStart, i$2 + lineStart]);
                }
              }
            }
          }
        }
      });
      return segments;
    }

    /**
     * @param {string} string
     * @param {GetEmbeddingLevelsResult} embedLevelsResult
     * @param {number} [start]
     * @param {number} [end]
     * @return {string} the new string with bidi segments reordered
     */
    function getReorderedString(string, embedLevelsResult, start, end) {
      var indices = getReorderedIndices(string, embedLevelsResult, start, end);
      var chars = [].concat(string);
      indices.forEach(function (charIndex, i) {
        chars[i] = (embedLevelsResult.levels[charIndex] & 1 ? getMirroredCharacter(string[charIndex]) : null) || string[charIndex];
      });
      return chars.join('');
    }

    /**
     * @param {string} string
     * @param {GetEmbeddingLevelsResult} embedLevelsResult
     * @param {number} [start]
     * @param {number} [end]
     * @return {number[]} an array with character indices in their new bidi order
     */
    function getReorderedIndices(string, embedLevelsResult, start, end) {
      var segments = getReorderSegments(string, embedLevelsResult, start, end);
      // Fill an array with indices
      var indices = [];
      for (var i = 0; i < string.length; i++) {
        indices[i] = i;
      }
      // Reverse each segment in order
      segments.forEach(function (ref) {
        var start = ref[0];
        var end = ref[1];
        var slice = indices.slice(start, end + 1);
        for (var i = slice.length; i--;) {
          indices[end - i] = slice[i];
        }
      });
      return indices;
    }
    exports$1.closingToOpeningBracket = closingToOpeningBracket;
    exports$1.getBidiCharType = getBidiCharType;
    exports$1.getBidiCharTypeName = getBidiCharTypeName;
    exports$1.getCanonicalBracket = getCanonicalBracket;
    exports$1.getEmbeddingLevels = getEmbeddingLevels;
    exports$1.getMirroredCharacter = getMirroredCharacter;
    exports$1.getMirroredCharactersMap = getMirroredCharactersMap;
    exports$1.getReorderSegments = getReorderSegments;
    exports$1.getReorderedIndices = getReorderedIndices;
    exports$1.getReorderedString = getReorderedString;
    exports$1.openingToClosingBracket = openingToClosingBracket;
    Object.defineProperty(exports$1, '__esModule', {
      value: true
    });
    return exports$1;
  }({});
  return bidi;
}

var base64Js = {};

base64Js.byteLength = byteLength$1;
base64Js.toByteArray = toByteArray;
base64Js.fromByteArray = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62;
revLookup['_'.charCodeAt(0)] = 63;
function getLens(b64) {
  var len = b64.length;
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4');
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=');
  if (validLen === -1) validLen = len;
  var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}

// base64 is 4/3 + up to two characters of the original data
function byteLength$1(b64) {
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function _byteLength(b64, validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
  var tmp;
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
  var curByte = 0;

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  var i;
  for (i = 0; i < len; i += 4) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[curByte++] = tmp >> 16 & 0xFF;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }
  if (placeHoldersLen === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[curByte++] = tmp & 0xFF;
  }
  if (placeHoldersLen === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[curByte++] = tmp >> 8 & 0xFF;
    arr[curByte++] = tmp & 0xFF;
  }
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
}
function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
    output.push(tripletToBase64(tmp));
  }
  return output.join('');
}
function fromByteArray(uint8) {
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
  }
  return parts.join('');
}

var TINF_OK = 0;
var TINF_DATA_ERROR = -3;
function Tree() {
  this.table = new Uint16Array(16); /* table of code length counts */
  this.trans = new Uint16Array(288); /* code -> symbol translation table */
}
function Data(source, dest) {
  this.source = source;
  this.sourceIndex = 0;
  this.tag = 0;
  this.bitcount = 0;
  this.dest = dest;
  this.destLen = 0;
  this.ltree = new Tree(); /* dynamic length/symbol tree */
  this.dtree = new Tree(); /* dynamic distance tree */
}

/* --------------------------------------------------- *
 * -- uninitialized global data (static structures) -- *
 * --------------------------------------------------- */

var sltree = new Tree();
var sdtree = new Tree();

/* extra bits and base tables for length codes */
var length_bits = new Uint8Array(30);
var length_base = new Uint16Array(30);

/* extra bits and base tables for distance codes */
var dist_bits = new Uint8Array(30);
var dist_base = new Uint16Array(30);

/* special ordering of code length codes */
var clcidx = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);

/* used by tinf_decode_trees, avoids allocations every call */
var code_tree = new Tree();
var lengths = new Uint8Array(288 + 32);

/* ----------------------- *
 * -- utility functions -- *
 * ----------------------- */

/* build extra bits and base tables */
function tinf_build_bits_base(bits, base, delta, first) {
  var i, sum;

  /* build bits table */
  for (i = 0; i < delta; ++i) bits[i] = 0;
  for (i = 0; i < 30 - delta; ++i) bits[i + delta] = i / delta | 0;

  /* build base table */
  for (sum = first, i = 0; i < 30; ++i) {
    base[i] = sum;
    sum += 1 << bits[i];
  }
}

/* build the fixed huffman trees */
function tinf_build_fixed_trees(lt, dt) {
  var i;

  /* build fixed length tree */
  for (i = 0; i < 7; ++i) lt.table[i] = 0;
  lt.table[7] = 24;
  lt.table[8] = 152;
  lt.table[9] = 112;
  for (i = 0; i < 24; ++i) lt.trans[i] = 256 + i;
  for (i = 0; i < 144; ++i) lt.trans[24 + i] = i;
  for (i = 0; i < 8; ++i) lt.trans[24 + 144 + i] = 280 + i;
  for (i = 0; i < 112; ++i) lt.trans[24 + 144 + 8 + i] = 144 + i;

  /* build fixed distance tree */
  for (i = 0; i < 5; ++i) dt.table[i] = 0;
  dt.table[5] = 32;
  for (i = 0; i < 32; ++i) dt.trans[i] = i;
}

/* given an array of code lengths, build a tree */
var offs = new Uint16Array(16);
function tinf_build_tree(t, lengths, off, num) {
  var i, sum;

  /* clear code length count table */
  for (i = 0; i < 16; ++i) t.table[i] = 0;

  /* scan symbol lengths, and sum code length counts */
  for (i = 0; i < num; ++i) t.table[lengths[off + i]]++;
  t.table[0] = 0;

  /* compute offset table for distribution sort */
  for (sum = 0, i = 0; i < 16; ++i) {
    offs[i] = sum;
    sum += t.table[i];
  }

  /* create code->symbol translation table (symbols sorted by code) */
  for (i = 0; i < num; ++i) {
    if (lengths[off + i]) t.trans[offs[lengths[off + i]]++] = i;
  }
}

/* ---------------------- *
 * -- decode functions -- *
 * ---------------------- */

/* get one bit from source stream */
function tinf_getbit(d) {
  /* check if tag is empty */
  if (!d.bitcount--) {
    /* load next tag */
    d.tag = d.source[d.sourceIndex++];
    d.bitcount = 7;
  }

  /* shift bit out of tag */
  var bit = d.tag & 1;
  d.tag >>>= 1;
  return bit;
}

/* read a num bit value from a stream and add base */
function tinf_read_bits(d, num, base) {
  if (!num) return base;
  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }
  var val = d.tag & 0xffff >>> 16 - num;
  d.tag >>>= num;
  d.bitcount -= num;
  return val + base;
}

/* given a data stream and a tree, decode a symbol */
function tinf_decode_symbol(d, t) {
  while (d.bitcount < 24) {
    d.tag |= d.source[d.sourceIndex++] << d.bitcount;
    d.bitcount += 8;
  }
  var sum = 0,
    cur = 0,
    len = 0;
  var tag = d.tag;

  /* get more bits while code value is above sum */
  do {
    cur = 2 * cur + (tag & 1);
    tag >>>= 1;
    ++len;
    sum += t.table[len];
    cur -= t.table[len];
  } while (cur >= 0);
  d.tag = tag;
  d.bitcount -= len;
  return t.trans[sum + cur];
}

/* given a data stream, decode dynamic trees from it */
function tinf_decode_trees(d, lt, dt) {
  var hlit, hdist, hclen;
  var i, num, length;

  /* get 5 bits HLIT (257-286) */
  hlit = tinf_read_bits(d, 5, 257);

  /* get 5 bits HDIST (1-32) */
  hdist = tinf_read_bits(d, 5, 1);

  /* get 4 bits HCLEN (4-19) */
  hclen = tinf_read_bits(d, 4, 4);
  for (i = 0; i < 19; ++i) lengths[i] = 0;

  /* read code lengths for code length alphabet */
  for (i = 0; i < hclen; ++i) {
    /* get 3 bits code length (0-7) */
    var clen = tinf_read_bits(d, 3, 0);
    lengths[clcidx[i]] = clen;
  }

  /* build code length tree */
  tinf_build_tree(code_tree, lengths, 0, 19);

  /* decode code lengths for the dynamic trees */
  for (num = 0; num < hlit + hdist;) {
    var sym = tinf_decode_symbol(d, code_tree);
    switch (sym) {
      case 16:
        /* copy previous code length 3-6 times (read 2 bits) */
        var prev = lengths[num - 1];
        for (length = tinf_read_bits(d, 2, 3); length; --length) {
          lengths[num++] = prev;
        }
        break;
      case 17:
        /* repeat code length 0 for 3-10 times (read 3 bits) */
        for (length = tinf_read_bits(d, 3, 3); length; --length) {
          lengths[num++] = 0;
        }
        break;
      case 18:
        /* repeat code length 0 for 11-138 times (read 7 bits) */
        for (length = tinf_read_bits(d, 7, 11); length; --length) {
          lengths[num++] = 0;
        }
        break;
      default:
        /* values 0-15 represent the actual code lengths */
        lengths[num++] = sym;
        break;
    }
  }

  /* build dynamic trees */
  tinf_build_tree(lt, lengths, 0, hlit);
  tinf_build_tree(dt, lengths, hlit, hdist);
}

/* ----------------------------- *
 * -- block inflate functions -- *
 * ----------------------------- */

/* given a stream and two trees, inflate a block of data */
function tinf_inflate_block_data(d, lt, dt) {
  while (1) {
    var sym = tinf_decode_symbol(d, lt);

    /* check for end of block */
    if (sym === 256) {
      return TINF_OK;
    }
    if (sym < 256) {
      d.dest[d.destLen++] = sym;
    } else {
      var length, dist, offs;
      var i;
      sym -= 257;

      /* possibly get more bits from length code */
      length = tinf_read_bits(d, length_bits[sym], length_base[sym]);
      dist = tinf_decode_symbol(d, dt);

      /* possibly get more bits from distance code */
      offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);

      /* copy match */
      for (i = offs; i < offs + length; ++i) {
        d.dest[d.destLen++] = d.dest[i];
      }
    }
  }
}

/* inflate an uncompressed block of data */
function tinf_inflate_uncompressed_block(d) {
  var length, invlength;
  var i;

  /* unread from bitbuffer */
  while (d.bitcount > 8) {
    d.sourceIndex--;
    d.bitcount -= 8;
  }

  /* get length */
  length = d.source[d.sourceIndex + 1];
  length = 256 * length + d.source[d.sourceIndex];

  /* get one's complement of length */
  invlength = d.source[d.sourceIndex + 3];
  invlength = 256 * invlength + d.source[d.sourceIndex + 2];

  /* check length */
  if (length !== (~invlength & 0x0000ffff)) return TINF_DATA_ERROR;
  d.sourceIndex += 4;

  /* copy block */
  for (i = length; i; --i) d.dest[d.destLen++] = d.source[d.sourceIndex++];

  /* make sure we start next block on a byte boundary */
  d.bitcount = 0;
  return TINF_OK;
}

/* inflate stream from source to dest */
function tinf_uncompress(source, dest) {
  var d = new Data(source, dest);
  var bfinal, btype, res;
  do {
    /* read final block flag */
    bfinal = tinf_getbit(d);

    /* read block type (2 bits) */
    btype = tinf_read_bits(d, 2, 0);

    /* decompress block */
    switch (btype) {
      case 0:
        /* decompress uncompressed block */
        res = tinf_inflate_uncompressed_block(d);
        break;
      case 1:
        /* decompress block with fixed huffman trees */
        res = tinf_inflate_block_data(d, sltree, sdtree);
        break;
      case 2:
        /* decompress block with dynamic huffman trees */
        tinf_decode_trees(d, d.ltree, d.dtree);
        res = tinf_inflate_block_data(d, d.ltree, d.dtree);
        break;
      default:
        res = TINF_DATA_ERROR;
    }
    if (res !== TINF_OK) throw new Error('Data error');
  } while (!bfinal);
  if (d.destLen < d.dest.length) {
    if (typeof d.dest.slice === 'function') return d.dest.slice(0, d.destLen);else return d.dest.subarray(0, d.destLen);
  }
  return d.dest;
}

/* -------------------- *
 * -- initialization -- *
 * -------------------- */

/* build fixed huffman trees */
tinf_build_fixed_trees(sltree, sdtree);

/* build extra bits and base tables */
tinf_build_bits_base(length_bits, length_base, 4, 3);
tinf_build_bits_base(dist_bits, dist_base, 2, 1);

/* fix a special case */
length_bits[28] = 0;
length_base[28] = 258;
var tinyInflate = tinf_uncompress;

const isBigEndian$1 = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12;
const swap = (b, n, m) => {
  let i = b[n];
  b[n] = b[m];
  b[m] = i;
};
const swap32 = array => {
  const len = array.length;
  for (let i = 0; i < len; i += 4) {
    swap(array, i, i + 3);
    swap(array, i + 1, i + 2);
  }
};
const swap32LE$1 = array => {
  if (isBigEndian$1) {
    swap32(array);
  }
};
var swap_1 = {
  swap32LE: swap32LE$1
};

const inflate = tinyInflate;
const {
  swap32LE
} = swap_1;

// Shift size for getting the index-1 table offset.
const SHIFT_1 = 6 + 5;

// Shift size for getting the index-2 table offset.
const SHIFT_2 = 5;

// Difference between the two shift sizes,
// for getting an index-1 offset from an index-2 offset. 6=11-5
const SHIFT_1_2 = SHIFT_1 - SHIFT_2;

// Number of index-1 entries for the BMP. 32=0x20
// This part of the index-1 table is omitted from the serialized form.
const OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> SHIFT_1;

// Number of entries in an index-2 block. 64=0x40
const INDEX_2_BLOCK_LENGTH = 1 << SHIFT_1_2;

// Mask for getting the lower bits for the in-index-2-block offset. */
const INDEX_2_MASK = INDEX_2_BLOCK_LENGTH - 1;

// Shift size for shifting left the index array values.
// Increases possible data size with 16-bit index values at the cost
// of compactability.
// This requires data blocks to be aligned by DATA_GRANULARITY.
const INDEX_SHIFT = 2;

// Number of entries in a data block. 32=0x20
const DATA_BLOCK_LENGTH = 1 << SHIFT_2;

// Mask for getting the lower bits for the in-data-block offset.
const DATA_MASK = DATA_BLOCK_LENGTH - 1;

// The part of the index-2 table for U+D800..U+DBFF stores values for
// lead surrogate code _units_ not code _points_.
// Values for lead surrogate code _points_ are indexed with this portion of the table.
// Length=32=0x20=0x400>>SHIFT_2. (There are 1024=0x400 lead surrogates.)
const LSCP_INDEX_2_OFFSET = 0x10000 >> SHIFT_2;
const LSCP_INDEX_2_LENGTH = 0x400 >> SHIFT_2;

// Count the lengths of both BMP pieces. 2080=0x820
const INDEX_2_BMP_LENGTH = LSCP_INDEX_2_OFFSET + LSCP_INDEX_2_LENGTH;

// The 2-byte UTF-8 version of the index-2 table follows at offset 2080=0x820.
// Length 32=0x20 for lead bytes C0..DF, regardless of SHIFT_2.
const UTF8_2B_INDEX_2_OFFSET = INDEX_2_BMP_LENGTH;
const UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6; // U+0800 is the first code point after 2-byte UTF-8

// The index-1 table, only used for supplementary code points, at offset 2112=0x840.
// Variable length, for code points up to highStart, where the last single-value range starts.
// Maximum length 512=0x200=0x100000>>SHIFT_1.
// (For 0x100000 supplementary code points U+10000..U+10ffff.)
//
// The part of the index-2 table for supplementary code points starts
// after this index-1 table.
//
// Both the index-1 table and the following part of the index-2 table
// are omitted completely if there is only BMP data.
const INDEX_1_OFFSET = UTF8_2B_INDEX_2_OFFSET + UTF8_2B_INDEX_2_LENGTH;

// The alignment size of a data block. Also the granularity for compaction.
const DATA_GRANULARITY = 1 << INDEX_SHIFT;
class UnicodeTrie {
  constructor(data) {
    const isBuffer = typeof data.readUInt32BE === 'function' && typeof data.slice === 'function';
    if (isBuffer || data instanceof Uint8Array) {
      // read binary format
      let uncompressedLength;
      if (isBuffer) {
        this.highStart = data.readUInt32LE(0);
        this.errorValue = data.readUInt32LE(4);
        uncompressedLength = data.readUInt32LE(8);
        data = data.slice(12);
      } else {
        const view = new DataView(data.buffer);
        this.highStart = view.getUint32(0, true);
        this.errorValue = view.getUint32(4, true);
        uncompressedLength = view.getUint32(8, true);
        data = data.subarray(12);
      }

      // double inflate the actual trie data
      data = inflate(data, new Uint8Array(uncompressedLength));
      data = inflate(data, new Uint8Array(uncompressedLength));

      // swap bytes from little-endian
      swap32LE(data);
      this.data = new Uint32Array(data.buffer);
    } else {
      // pre-parsed data
      ({
        data: this.data,
        highStart: this.highStart,
        errorValue: this.errorValue
      } = data);
    }
  }
  get(codePoint) {
    let index;
    if (codePoint < 0 || codePoint > 0x10ffff) {
      return this.errorValue;
    }
    if (codePoint < 0xd800 || codePoint > 0xdbff && codePoint <= 0xffff) {
      // Ordinary BMP code point, excluding leading surrogates.
      // BMP uses a single level lookup.  BMP index starts at offset 0 in the index.
      // data is stored in the index array itself.
      index = (this.data[codePoint >> SHIFT_2] << INDEX_SHIFT) + (codePoint & DATA_MASK);
      return this.data[index];
    }
    if (codePoint <= 0xffff) {
      // Lead Surrogate Code Point.  A Separate index section is stored for
      // lead surrogate code units and code points.
      //   The main index has the code unit data.
      //   For this function, we need the code point data.
      index = (this.data[LSCP_INDEX_2_OFFSET + (codePoint - 0xd800 >> SHIFT_2)] << INDEX_SHIFT) + (codePoint & DATA_MASK);
      return this.data[index];
    }
    if (codePoint < this.highStart) {
      // Supplemental code point, use two-level lookup.
      index = this.data[INDEX_1_OFFSET - OMITTED_BMP_INDEX_1_LENGTH + (codePoint >> SHIFT_1)];
      index = this.data[index + (codePoint >> SHIFT_2 & INDEX_2_MASK)];
      index = (index << INDEX_SHIFT) + (codePoint & DATA_MASK);
      return this.data[index];
    }
    return this.data[this.data.length - DATA_GRANULARITY];
  }
}
var unicodeTrie = UnicodeTrie;

var $bdjGp$unicodetrie = /*@__PURE__*/getDefaultExportFromCjs(unicodeTrie);

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
var $f4087201da764553$exports = {};
$f4087201da764553$exports = JSON.parse('{"categories":["Cc","Zs","Po","Sc","Ps","Pe","Sm","Pd","Nd","Lu","Sk","Pc","Ll","So","Lo","Pi","Cf","No","Pf","Lt","Lm","Mn","Me","Mc","Nl","Zl","Zp","Cs","Co"],"combiningClasses":["Not_Reordered","Above","Above_Right","Below","Attached_Above_Right","Attached_Below","Overlay","Iota_Subscript","Double_Below","Double_Above","Below_Right","Above_Left","CCC10","CCC11","CCC12","CCC13","CCC14","CCC15","CCC16","CCC17","CCC18","CCC19","CCC20","CCC21","CCC22","CCC23","CCC24","CCC25","CCC30","CCC31","CCC32","CCC27","CCC28","CCC29","CCC33","CCC34","CCC35","CCC36","Nukta","Virama","CCC84","CCC91","CCC103","CCC107","CCC118","CCC122","CCC129","CCC130","CCC132","Attached_Above","Below_Left","Left","Kana_Voicing","CCC26","Right"],"scripts":["Common","Latin","Bopomofo","Inherited","Greek","Coptic","Cyrillic","Armenian","Hebrew","Arabic","Syriac","Thaana","Nko","Samaritan","Mandaic","Devanagari","Bengali","Gurmukhi","Gujarati","Oriya","Tamil","Telugu","Kannada","Malayalam","Sinhala","Thai","Lao","Tibetan","Myanmar","Georgian","Hangul","Ethiopic","Cherokee","Canadian_Aboriginal","Ogham","Runic","Tagalog","Hanunoo","Buhid","Tagbanwa","Khmer","Mongolian","Limbu","Tai_Le","New_Tai_Lue","Buginese","Tai_Tham","Balinese","Sundanese","Batak","Lepcha","Ol_Chiki","Braille","Glagolitic","Tifinagh","Han","Hiragana","Katakana","Yi","Lisu","Vai","Bamum","Syloti_Nagri","Phags_Pa","Saurashtra","Kayah_Li","Rejang","Javanese","Cham","Tai_Viet","Meetei_Mayek","null","Linear_B","Lycian","Carian","Old_Italic","Gothic","Old_Permic","Ugaritic","Old_Persian","Deseret","Shavian","Osmanya","Osage","Elbasan","Caucasian_Albanian","Linear_A","Cypriot","Imperial_Aramaic","Palmyrene","Nabataean","Hatran","Phoenician","Lydian","Meroitic_Hieroglyphs","Meroitic_Cursive","Kharoshthi","Old_South_Arabian","Old_North_Arabian","Manichaean","Avestan","Inscriptional_Parthian","Inscriptional_Pahlavi","Psalter_Pahlavi","Old_Turkic","Old_Hungarian","Hanifi_Rohingya","Old_Sogdian","Sogdian","Elymaic","Brahmi","Kaithi","Sora_Sompeng","Chakma","Mahajani","Sharada","Khojki","Multani","Khudawadi","Grantha","Newa","Tirhuta","Siddham","Modi","Takri","Ahom","Dogra","Warang_Citi","Nandinagari","Zanabazar_Square","Soyombo","Pau_Cin_Hau","Bhaiksuki","Marchen","Masaram_Gondi","Gunjala_Gondi","Makasar","Cuneiform","Egyptian_Hieroglyphs","Anatolian_Hieroglyphs","Mro","Bassa_Vah","Pahawh_Hmong","Medefaidrin","Miao","Tangut","Nushu","Duployan","SignWriting","Nyiakeng_Puachue_Hmong","Wancho","Mende_Kikakui","Adlam"],"eaw":["N","Na","A","W","H","F"]}');
const $747425b437e121da$var$trie = new ($bdjGp$unicodetrie)((base64Js).toByteArray("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"));
const $747425b437e121da$var$log2 = Math.log2 || (n => Math.log(n) / Math.LN2);
const $747425b437e121da$var$bits = n => $747425b437e121da$var$log2(n) + 1 | 0;
// compute the number of bits stored for each field
const $747425b437e121da$var$CATEGORY_BITS = $747425b437e121da$var$bits(((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).categories.length - 1);
const $747425b437e121da$var$COMBINING_BITS = $747425b437e121da$var$bits(((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).combiningClasses.length - 1);
const $747425b437e121da$var$SCRIPT_BITS = $747425b437e121da$var$bits(((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).scripts.length - 1);
const $747425b437e121da$var$EAW_BITS = $747425b437e121da$var$bits(((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).eaw.length - 1);
const $747425b437e121da$var$NUMBER_BITS = 10;
// compute shift and mask values for each field
const $747425b437e121da$var$CATEGORY_SHIFT = $747425b437e121da$var$COMBINING_BITS + $747425b437e121da$var$SCRIPT_BITS + $747425b437e121da$var$EAW_BITS + $747425b437e121da$var$NUMBER_BITS;
const $747425b437e121da$var$COMBINING_SHIFT = $747425b437e121da$var$SCRIPT_BITS + $747425b437e121da$var$EAW_BITS + $747425b437e121da$var$NUMBER_BITS;
const $747425b437e121da$var$SCRIPT_SHIFT = $747425b437e121da$var$EAW_BITS + $747425b437e121da$var$NUMBER_BITS;
const $747425b437e121da$var$EAW_SHIFT = $747425b437e121da$var$NUMBER_BITS;
const $747425b437e121da$var$CATEGORY_MASK = (1 << $747425b437e121da$var$CATEGORY_BITS) - 1;
const $747425b437e121da$var$COMBINING_MASK = (1 << $747425b437e121da$var$COMBINING_BITS) - 1;
const $747425b437e121da$var$SCRIPT_MASK = (1 << $747425b437e121da$var$SCRIPT_BITS) - 1;
const $747425b437e121da$var$EAW_MASK = (1 << $747425b437e121da$var$EAW_BITS) - 1;
const $747425b437e121da$var$NUMBER_MASK = (1 << $747425b437e121da$var$NUMBER_BITS) - 1;
function $747425b437e121da$export$410364bbb673ddbc(codePoint) {
  const val = $747425b437e121da$var$trie.get(codePoint);
  return ((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).categories[val >> $747425b437e121da$var$CATEGORY_SHIFT & $747425b437e121da$var$CATEGORY_MASK];
}
function $747425b437e121da$export$c03b919c6651ed55(codePoint) {
  const val = $747425b437e121da$var$trie.get(codePoint);
  return ((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).combiningClasses[val >> $747425b437e121da$var$COMBINING_SHIFT & $747425b437e121da$var$COMBINING_MASK];
}
function $747425b437e121da$export$941569448d136665(codePoint) {
  const val = $747425b437e121da$var$trie.get(codePoint);
  return ((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).scripts[val >> $747425b437e121da$var$SCRIPT_SHIFT & $747425b437e121da$var$SCRIPT_MASK];
}
function $747425b437e121da$export$92f6187db8ca6d26(codePoint) {
  const val = $747425b437e121da$var$trie.get(codePoint);
  return ((/*@__PURE__*/$parcel$interopDefault($f4087201da764553$exports))).eaw[val >> $747425b437e121da$var$EAW_SHIFT & $747425b437e121da$var$EAW_MASK];
}
function $747425b437e121da$export$7d1258ebb7625a0d(codePoint) {
  let val = $747425b437e121da$var$trie.get(codePoint);
  let num = val & $747425b437e121da$var$NUMBER_MASK;
  if (num === 0) return null;else if (num <= 50) return num - 1;else if (num < 0x1e0) {
    const numerator = (num >> 4) - 12;
    const denominator = (num & 0xf) + 1;
    return numerator / denominator;
  } else if (num < 0x300) {
    val = (num >> 5) - 14;
    let exp = (num & 0x1f) + 2;
    while (exp > 0) {
      val *= 10;
      exp--;
    }
    return val;
  } else {
    val = (num >> 2) - 0xbf;
    let exp = (num & 3) + 1;
    while (exp > 0) {
      val *= 60;
      exp--;
    }
    return val;
  }
}
function $747425b437e121da$export$52c8ea63abd07594(codePoint) {
  const category = $747425b437e121da$export$410364bbb673ddbc(codePoint);
  return category === "Lu" || category === "Ll" || category === "Lt" || category === "Lm" || category === "Lo" || category === "Nl";
}
function $747425b437e121da$export$727d9dbc4fbb948f(codePoint) {
  return $747425b437e121da$export$410364bbb673ddbc(codePoint) === "Nd";
}
function $747425b437e121da$export$a5b49f4dc6a07d2c(codePoint) {
  const category = $747425b437e121da$export$410364bbb673ddbc(codePoint);
  return category === "Pc" || category === "Pd" || category === "Pe" || category === "Pf" || category === "Pi" || category === "Po" || category === "Ps";
}
function $747425b437e121da$export$7b6804e8df61fcf5(codePoint) {
  return $747425b437e121da$export$410364bbb673ddbc(codePoint) === "Ll";
}
function $747425b437e121da$export$aebd617640818cda(codePoint) {
  return $747425b437e121da$export$410364bbb673ddbc(codePoint) === "Lu";
}
function $747425b437e121da$export$de8b4ee23b2cf823(codePoint) {
  return $747425b437e121da$export$410364bbb673ddbc(codePoint) === "Lt";
}
function $747425b437e121da$export$3c52dd84024ae72c(codePoint) {
  const category = $747425b437e121da$export$410364bbb673ddbc(codePoint);
  return category === "Zs" || category === "Zl" || category === "Zp";
}
function $747425b437e121da$export$a11bdcffe109e74b(codePoint) {
  const category = $747425b437e121da$export$410364bbb673ddbc(codePoint);
  return category === "Nd" || category === "No" || category === "Nl" || category === "Lu" || category === "Ll" || category === "Lt" || category === "Lm" || category === "Lo" || category === "Me" || category === "Mc";
}
function $747425b437e121da$export$e33ad6871e762338(codePoint) {
  const category = $747425b437e121da$export$410364bbb673ddbc(codePoint);
  return category === "Mn" || category === "Me" || category === "Mc";
}
var
// Backwards compatibility.
$747425b437e121da$export$2e2bcd8739ae039 = {
  getCategory: $747425b437e121da$export$410364bbb673ddbc,
  getCombiningClass: $747425b437e121da$export$c03b919c6651ed55,
  getScript: $747425b437e121da$export$941569448d136665,
  getEastAsianWidth: $747425b437e121da$export$92f6187db8ca6d26,
  getNumericValue: $747425b437e121da$export$7d1258ebb7625a0d,
  isAlphabetic: $747425b437e121da$export$52c8ea63abd07594,
  isDigit: $747425b437e121da$export$727d9dbc4fbb948f,
  isPunctuation: $747425b437e121da$export$a5b49f4dc6a07d2c,
  isLowerCase: $747425b437e121da$export$7b6804e8df61fcf5,
  isUpperCase: $747425b437e121da$export$aebd617640818cda,
  isTitleCase: $747425b437e121da$export$de8b4ee23b2cf823,
  isWhiteSpace: $747425b437e121da$export$3c52dd84024ae72c,
  isBaseForm: $747425b437e121da$export$a11bdcffe109e74b,
  isMark: $747425b437e121da$export$e33ad6871e762338
};

var hyphen$2 = {exports: {}};

/** Text hyphenation in Javascript.
 *  Copyright (C) 2025 Yevhen Tiurin (yevhentiurin@gmail.com)
 *  https://github.com/ytiurin/hyphen
 *
 *  Released under the ISC license
 *  https://github.com/ytiurin/hyphen/blob/master/LICENSE
 */

(function (module) {
	(function (root, factory) {
	  if (module.exports) {
	    // Node. Does not work with strict CommonJS, but
	    // only CommonJS-like environments that support module.exports,
	    // like Node.
	    module.exports = factory();
	  } else {
	    // Browser globals (root is window)
	    root.createHyphenator = factory();
	  }
	})(commonjsGlobal, function () {
	  function createTextReader(setup) {
	    var char1 = "";
	    var char2 = "";
	    var i = 0;
	    var verifier = setup();
	    return function (text) {
	      while (i < text.length) {
	        char1 = text.charAt(i++);
	        char2 = text.charAt(i);
	        var verified = verifier(char1, char2);
	        if (verified !== void 0) {
	          return verified;
	        }
	      }
	    };
	  }
	  var isNotLetter = RegExp.prototype.test.bind(/\s|(?![\'])[\!-\@\[-\`\{-\~\u2013-\u203C]/);
	  function createHTMLVerifier() {
	    var skip = false;
	    return function (accumulate, chars) {
	      if (skip) {
	        if (chars[0] === ">") {
	          accumulate();
	          skip = false;
	        }
	      } else if (chars[0] === "<" && (!isNotLetter(chars[1]) || chars[1] === "/")) {
	        skip = true;
	      }
	      return skip;
	    };
	  }
	  function createHyphenCharVerifier(hyphenChar) {
	    var skip = false;
	    return function (accumulate, chars) {
	      if (skip) {
	        if (!isNotLetter(chars[0]) && isNotLetter(chars[1])) {
	          accumulate();
	          skip = false;
	        }
	      } else if (!isNotLetter(chars[0]) && chars[1] === hyphenChar) {
	        skip = true;
	      }
	      return skip;
	    };
	  }
	  function createHyphenationVerifier(verifiers, minWordLength) {
	    return function () {
	      var accum0 = "";
	      var accum = "";
	      function accumulate() {
	        accum0 += accum;
	        accum = "";
	      }
	      function resolveWith(value) {
	        accum0 = "";
	        accum = "";
	        return value;
	      }
	      return function (char1, char2) {
	        accum += char1;
	        var skip = verifiers.reduce(function (skip2, verify) {
	          return skip2 || verify(accumulate, [char1, char2]);
	        }, false);
	        if (!skip) {
	          if (isNotLetter(char1) && !isNotLetter(char2)) {
	            accumulate();
	          }
	          if (!isNotLetter(char1) && isNotLetter(char2)) {
	            if (accum.length >= minWordLength) {
	              return resolveWith([accum0, accum]);
	            } else {
	              accumulate();
	            }
	          }
	        }
	        if (char2 === "") {
	          if (accum.length < minWordLength || skip) {
	            accumulate();
	          }
	          return resolveWith([accum0, accum]);
	        }
	      };
	    };
	  }
	  function levelsToMarkers(levels) {
	    var markers = [];
	    for (var i = 0; i < levels.length; i++) if ((levels[i] & 1) === 1) markers.push(i);
	    return markers;
	  }
	  function insertChar(text, hyphenChar, markers) {
	    if (markers.length === 0) {
	      return text;
	    }
	    var resultText = [text.slice(0, markers[0])];
	    if (markers.length > 1) for (var i = 0, j = 1; j < markers.length; i++, j++) {
	      resultText.push(text.slice(markers[i], markers[j]));
	    }
	    resultText.push(text.slice(markers[markers.length - 1]));
	    return resultText.join(hyphenChar);
	  }
	  function markersFromExceptionsDefinition(exceptionsList) {
	    return exceptionsList.reduce(function (markersDict, definition) {
	      var i = 0,
	        markers = [];
	      while ((i = definition.indexOf("-", i + 1)) > -1) {
	        markers.push(i);
	      }
	      markersDict[definition.toLocaleLowerCase().replace(/\-/g, "")] = markers;
	      return markersDict;
	    }, {});
	  }
	  function createCharIterator(str) {
	    var i = 0;
	    function nextChar() {
	      return str[i++];
	    }
	    return nextChar;
	  }
	  function createStringSlicer(str) {
	    var i = 0,
	      slice = str;
	    function next() {
	      slice = str.slice(i++);
	      if (slice.length < 3) {
	        return;
	      }
	      return slice;
	    }
	    function isFirstCharacter() {
	      return i === 2;
	    }
	    return [next, isFirstCharacter];
	  }
	  function hyphenateWord(text, loweredText, levelsTable, patternTrie) {
	    var levels = new Array(text.length + 1),
	      loweredText = ("." + loweredText + ".").split(""),
	      wordSlice,
	      letter,
	      triePtr,
	      trieNode,
	      patternLevelsIndex,
	      patternLevels,
	      patternEntityIndex = -1,
	      slicer,
	      nextSlice,
	      isFirstCharacter,
	      nextLetter;
	    for (var i = levels.length; i--;) levels[i] = 0;
	    slicer = createStringSlicer(loweredText);
	    nextSlice = slicer[0];
	    isFirstCharacter = slicer[1];
	    while (wordSlice = nextSlice()) {
	      patternEntityIndex++;
	      if (isFirstCharacter()) {
	        patternEntityIndex--;
	      }
	      triePtr = patternTrie;
	      nextLetter = createCharIterator(wordSlice);
	      while (letter = nextLetter()) {
	        if ((trieNode = triePtr[letter]) === void 0) {
	          break;
	        }
	        triePtr = {};
	        patternLevelsIndex = -1;
	        switch (Object.prototype.toString.call(trieNode)) {
	          case "[object Array]":
	            triePtr = trieNode[0];
	            patternLevelsIndex = trieNode[1];
	            break;
	          case "[object Object]":
	            triePtr = trieNode;
	            break;
	          case "[object Number]":
	            patternLevelsIndex = trieNode;
	            break;
	        }
	        if (patternLevelsIndex < 0) {
	          continue;
	        }
	        if (!levelsTable[patternLevelsIndex].splice) {
	          levelsTable[patternLevelsIndex] = levelsTable[patternLevelsIndex].slice("");
	        }
	        patternLevels = levelsTable[patternLevelsIndex];
	        for (var k = 0; k < patternLevels.length; k++) levels[patternEntityIndex + k] = Math.max(patternLevels[k], levels[patternEntityIndex + k]);
	      }
	    }
	    levels[0] = levels[1] = levels[levels.length - 1] = levels[levels.length - 2] = 0;
	    return levelsToMarkers(levels);
	  }
	  function start(text, levelsTable, patterns, cache, markersDict, hyphenChar, skipHTML, minWordLength, isAsync) {
	    function done() {
	      resolveNewText(newText);
	    }
	    var newText = "",
	      fragments,
	      readText = createTextReader(createHyphenationVerifier((skipHTML ? [createHTMLVerifier()] : []).concat(createHyphenCharVerifier(hyphenChar)), minWordLength)),
	      resolveNewText = function () {};
	    function nextTick() {
	      var loopStart = /* @__PURE__ */new Date();
	      while ((!isAsync || /* @__PURE__ */new Date() - loopStart < 10) && (fragments = readText(text))) {
	        if (fragments[1]) {
	          var cacheKey = fragments[1].length ? "~" + fragments[1] : "";
	          if (!Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
	            var loweredWord = fragments[1].toLocaleLowerCase();
	            if (!Object.prototype.hasOwnProperty.call(markersDict, loweredWord)) markersDict[loweredWord] = hyphenateWord(fragments[1], loweredWord, levelsTable, patterns);
	            cache[cacheKey] = insertChar(fragments[1], hyphenChar, markersDict[loweredWord]);
	          }
	          fragments[1] = cache[cacheKey];
	        }
	        newText += fragments[0] + fragments[1];
	      }
	      if (!fragments) {
	        done();
	      } else {
	        setTimeout(nextTick);
	      }
	    }
	    if (isAsync) {
	      setTimeout(nextTick);
	      return new Promise(function (resolve) {
	        resolveNewText = resolve;
	      });
	    } else {
	      nextTick();
	      return newText;
	    }
	  }
	  var SETTING_DEFAULT_ASYNC = false;
	  var SETTING_DEFAULT_EXCEPTIONS = [];
	  var SETTING_DEFAULT_HTML = true;
	  var SETTING_DEFAULT_HYPH_CHAR = "\xAD";
	  var SETTING_DEFAULT_MIN_WORD_LENGTH = 5;
	  var SETTING_NAME_ASYNC = "async";
	  var SETTING_NAME_EXCEPTIONS = "exceptions";
	  var SETTING_NAME_HTML = "html";
	  var SETTING_NAME_HYPH_CHAR = "hyphenChar";
	  var SETTING_NAME_MIN_WORD_LENGTH = "minWordLength";
	  var _global = typeof commonjsGlobal === "object" ? commonjsGlobal : typeof window === "object" ? window : typeof self === "object" ? self : {};
	  function extend(target, source) {
	    target = target || {};
	    for (var key in source) {
	      target[key] = source[key];
	    }
	    return target;
	  }
	  function validateArray(value) {
	    return value instanceof Array;
	  }
	  function keyOrDefault(object, key, defaultValue, test) {
	    if (key in object && (test ? test(object[key]) : true)) {
	      return object[key];
	    }
	    return defaultValue;
	  }
	  function exceptionsFromDefinition(exceptionsList, hyphenChar) {
	    return exceptionsList.reduce(function (exceptions, exception) {
	      exceptions["~" + exception.replace(/\-/g, "")] = exception.replace(/\-/g, hyphenChar);
	      return exceptions;
	    }, {});
	  }
	  function createHyphenator(patternsDefinition, options) {
	    options = options || {};
	    var asyncMode = keyOrDefault(options, SETTING_NAME_ASYNC, SETTING_DEFAULT_ASYNC),
	      caches = {},
	      markersDict = {},
	      exceptions = {},
	      hyphenChar = keyOrDefault(options, SETTING_NAME_HYPH_CHAR, SETTING_DEFAULT_HYPH_CHAR),
	      levelsTable = patternsDefinition[0].split(","),
	      patterns = JSON.parse(patternsDefinition[1]),
	      minWordLength = keyOrDefault(options, SETTING_NAME_MIN_WORD_LENGTH, SETTING_DEFAULT_MIN_WORD_LENGTH) >> 0,
	      skipHTML = keyOrDefault(options, SETTING_NAME_HTML, SETTING_DEFAULT_HTML),
	      userExceptions = keyOrDefault(options, SETTING_NAME_EXCEPTIONS, SETTING_DEFAULT_EXCEPTIONS, validateArray);
	    var cacheKey = hyphenChar + minWordLength;
	    exceptions[cacheKey] = {};
	    if (patternsDefinition[2]) {
	      exceptions[cacheKey] = exceptionsFromDefinition(patternsDefinition[2], hyphenChar);
	      markersDict = markersFromExceptionsDefinition(patternsDefinition[2]);
	    }
	    if (userExceptions && userExceptions.length) {
	      exceptions[cacheKey] = extend(exceptions[cacheKey], exceptionsFromDefinition(userExceptions, hyphenChar));
	      markersDict = extend(markersDict, markersFromExceptionsDefinition(userExceptions));
	    }
	    caches[cacheKey] = extend({}, exceptions[cacheKey]);
	    if (asyncMode && !("Promise" in _global)) {
	      throw new Error("Failed to create hyphenator: Could not find global Promise object, needed for hyphenator to work in async mode");
	    }
	    return function (text, options2) {
	      options2 = options2 || {};
	      var localHyphenChar = keyOrDefault(options2, SETTING_NAME_HYPH_CHAR, hyphenChar),
	        localMinWordLength = keyOrDefault(options2, SETTING_NAME_MIN_WORD_LENGTH, minWordLength) >> 0,
	        localUserExceptions = keyOrDefault(options2, SETTING_NAME_EXCEPTIONS, SETTING_DEFAULT_EXCEPTIONS, validateArray),
	        cacheKey2 = localHyphenChar + localMinWordLength;
	      if (!exceptions[cacheKey2] && patternsDefinition[2]) {
	        exceptions[cacheKey2] = exceptionsFromDefinition(patternsDefinition[2], localHyphenChar);
	        caches[cacheKey2] = extend(caches[cacheKey2], exceptions[cacheKey2]);
	      }
	      if (localUserExceptions && localUserExceptions.length) {
	        exceptions[cacheKey2] = extend(exceptions[cacheKey2], exceptionsFromDefinition(localUserExceptions, localHyphenChar));
	        markersDict = extend(markersDict, markersFromExceptionsDefinition(localUserExceptions));
	        caches[cacheKey2] = extend(caches[cacheKey2], exceptions[cacheKey2]);
	      }
	      return start(text, levelsTable, patterns, caches[cacheKey2], markersDict, localHyphenChar, skipHTML, localMinWordLength, asyncMode);
	    };
	  }
	  return createHyphenator;
	}); 
} (hyphen$2));

var hyphenExports = hyphen$2.exports;

var hyphen = hyphenExports;

var hyphen$1 = /*@__PURE__*/getDefaultExportFromCjs(hyphen);

var enUs = {exports: {}};

(function (module) {
	(function (root, factory) {
	  if (module.exports) {
	    // Node. Does not work with strict CommonJS, but
	    // only CommonJS-like environments that support module.exports,
	    // like Node.
	    module.exports = factory();
	  } else {
	    // Browser globals (root is window)
	    root.hyphenationPatternsEnUs = factory();
	  }
	})(commonjsGlobal, function () {
	  return ["0004,004,001,003,005,0005,00005,000005,0002,002,0000005,0003,00003,00505,00034,0001,00055,00004,4,05,0055,04,42,03,02,2,404,3,044,01,0505,55,5,045,041,0033,000004,22,00504,5504,0042,1,21,41,402,405,4004,43,23,000054,303,3005,022,5004,000003,252,45,25,2004,000505,054,403,401,3002,0025,144,432,00054,34,12,234,0022,014,0304,012,143,503,0403,101,052,414,212,011,043,00002,0041,0024,05005,03003,00102,0404,04303,01004,0034,025,0044,00404,00025,0103,042,0205,412,104,54,344,433,5005,253,055,0402,3004,0043,204,505,454,0000004,00303,04004,552,201,4005,0255,52,444,14,44,02004,033,05004,00045,00013,0021,0405,00044,0054,50055,000303,00001,304,0204,11,301,232,122,00305,504,000043,0104,00052,000045,50004,0023,00033,00032,00202,5003,202,0401,0000505,214,102,032,000161,004101,00501,00301,0036,0052,00023,006101,006,00401,000521,0014,0063,00012,000501,000006,000604,000601,005001,005005,0010305,00006,003012,003005,0003011,0061,013,000021,000022,000105,00211,00062,00051,000112,006013,000011,0200306,1021,0050001,003003,2102,305,000015,01030005,000035,001011,00021,16330001,0234,030006,5020001,000001,00016,0031,021,21431,002305,0350014,0000012,000063,00101,106,105,00435,00063,0300061,00041,100306,003602,023,0503,0010011,10003,1005,30011,00031,0001001,0000061,0030003,30305,001201,0301,5000101,500101,00015,000401,000065,000016,0000402,0500002,000205,030201,500301,00014,5001,000002,00030011,01034,0300006,030213,00400304,050001,05003,000311,0634,00061,0006,00000604,00050013,00213,0030001,100003,000033,30002,00003632,0003004,050003,0000021,006303,0000006,00005005,30451,03001,00231,00056,00011,6,001001,00500001,03005,503005,0000010001,1002,003001,001065,300001,32011,32,0000003,0213001,0500053,021005,10001,0000011,0001041,0020016,100032,50011,0606,5002,3001,03002,0015001,0102,00003001,000000033,0000001,300101,300015,0101003,00000101,0100501,0101,0010033,00000362,000014,0005001,031", '{".":{"a":{"c":{"h":0},"d":{"d":{"e":{"r":1}}},"f":{"t":2},"l":{"t":3},"m":{"a":{"t":4}},"n":{"c":4,"g":0,"i":{"m":5},"t":[{"e":3,"i":{"s":6}},0]},"r":{"s":4,"t":{"i":{"e":1},"y":1}},"s":{"c":3,"p":2,"s":2,"t":{"e":{"r":7}}},"t":{"o":{"m":6}},"u":{"d":2},"v":{"i":1},"w":{"n":0}},"b":{"a":{"g":1,"n":{"a":4},"s":{"e":0}},"e":{"r":[{"a":4},0],"s":{"m":3,"t":{"o":4}}},"r":{"i":8},"u":{"t":{"t":{"i":0}}}},"c":{"a":{"m":{"p":{"e":0}},"n":{"c":5},"p":{"a":{"b":6}},"r":{"o":{"l":5}},"t":1},"e":{"l":{"a":1}},"h":[{"i":{"l":{"l":{"i":7}}}},1],"i":[{"t":{"r":5}},9],"o":{"e":3,"r":[{"n":{"e":{"r":5}}},1],"n":{"g":{"r":5}}}},"d":{"e":{"m":{"o":{"i":1}},"o":3,"r":{"a":3,"i":[{"v":{"a":4}},3]},"s":{"c":0}},"i":{"c":{"t":{"i":{"o":10}}}},"o":{"t":1},"u":{"c":1,"m":{"b":6}},"r":{"i":{"v":67}}},"e":{"a":{"r":{"t":{"h":7}},"s":{"i":11}},"b":1,"e":{"r":0},"g":9,"l":{"d":4,"e":{"m":3}},"n":{"a":{"m":12},"g":3,"s":3},"q":{"u":{"i":{"t":13}}},"r":{"r":{"i":1}},"s":3,"u":[{"l":{"e":{"r":1}}},3],"y":{"e":5},"t":{"h":{"y":{"l":162}}},"v":[{"e":{"r":{"s":{"i":{"b":158}}}}},9]},"f":{"e":{"s":11},"o":{"r":{"m":{"e":{"r":5}}}}},"g":{"a":[{"s":{"o":{"m":163}}},9],"e":[{"n":{"t":14},"o":{"g":4,"m":{"e":1},"t":164}},9],"i":{"a":4,"b":1},"o":{"r":1}},"h":{"a":{"n":{"d":{"i":6},"k":5}},"e":[{"r":{"o":{"i":6,"e":3}},"s":11,"t":11,"m":{"o":165},"p":{"a":166}},9],"i":{"b":3,"e":{"r":3}},"o":{"n":{"e":{"y":5},"o":11},"v":5}},"i":{"d":{"l":1,"o":{"l":12}},"m":{"m":3,"p":{"i":{"n":4}}},"n":[{"c":{"i":3},"e":8,"k":9,"s":3,"u":{"t":167}},2],"r":{"r":4},"s":{"i":1}},"j":{"u":{"r":3}},"l":{"a":{"c":{"y":1},"m":1,"t":{"e":{"r":5},"h":6}},"e":[{"g":{"e":5},"n":0,"p":5,"v":15,"i":{"c":{"e":{"s":170}}}},9],"i":{"g":[{"a":5},1],"n":9,"o":3,"t":1}},"m":{"a":{"g":{"a":16},"l":{"o":5},"n":{"a":5},"r":{"t":{"i":5}}},"e":[{"r":{"c":11},"t":{"e":{"r":4},"a":{"l":{"a":0}}},"g":{"a":{"l":171}}},9],"i":{"s":[{"t":{"i":6},"e":{"r":{"s":173}}},15],"m":{"i":{"c":172}}},"o":{"n":{"e":11},"r":{"o":3}},"u":{"t":{"a":[{"b":6},4]}}},"n":{"i":{"c":1},"e":{"o":{"f":174}},"o":{"e":{"t":{"h":15}},"n":{"e":{"m":175}}}},"o":{"d":[{"d":5},9],"f":{"t":{"e":4}},"r":{"a":{"t":{"o":4}},"c":3,"d":2,"t":3},"s":[{"t":{"l":1}},3],"t":{"h":11},"u":{"t":11}},"p":{"e":{"d":{"a":{"l":5}},"t":{"e":4,"i":{"t":4}}},"i":{"e":1,"o":{"n":5},"t":9},"r":{"e":{"m":11,"a":{"m":15}}},"o":{"l":{"y":{"s":137}},"s":{"t":{"a":{"m":137}}}}},"r":{"a":{"c":1,"n":{"t":0},"t":{"i":{"o":{"n":{"a":7}}}},"v":{"e":{"n":{"o":176}}}},"e":{"e":[{"c":173},8],"m":{"i":{"t":4}},"s":[{"t":{"a":{"t":4}}},8]},"i":{"g":1,"t":{"u":5}},"o":{"q":1,"s":{"t":5},"w":{"d":5}},"u":{"d":1}},"s":{"c":{"i":{"e":11}},"e":{"l":{"f":6,"l":6},"n":9,"r":{"i":{"e":4}},"m":{"i":[{"c":0,"d":177,"p":36,"r":36,"s":178,"v":36},6]}},"h":9,"i":[{"n":{"g":17}},9],"t":[{"a":{"b":{"l":5}}},1],"y":9,"p":{"h":{"i":{"n":179}},"i":{"n":{"o":137}}}},"t":{"a":[{"p":{"e":{"s":{"t":{"r":180}}}}},1],"e":[{"n":{"a":{"n":5}},"l":{"e":{"g":{"r":3}}}},1],"h":9,"i":[{"l":0,"m":{"o":16},"n":{"g":17,"k":5}},9],"o":{"n":{"a":0},"p":[{"i":5,"o":{"g":170}},1],"u":{"s":5},"q":9},"r":{"i":{"b":{"u":{"t":6}}}}},"u":{"n":{"a":[{"t":{"t":144}},2],"c":{"e":3},"d":{"e":{"r":7}},"e":[{"r":{"r":181}},2],"k":4,"o":4,"u":3},"p":3,"r":{"e":11},"s":{"a":4}},"v":{"e":{"n":{"d":{"e":0}},"r":{"a":4}},"i":{"c":{"a":{"r":151}}}},"w":{"i":{"l":{"i":5}},"e":{"b":{"l":131}}},"y":{"e":1},"k":{"i":{"l":{"n":{"i":168}}},"o":{"r":{"t":{"e":169}}}}},"a":{"b":{".":18,"a":{"l":19,"n":19},"e":[{"r":{"d":4}},8],"i":{"a":5,"t":{"a":{"b":13}}},"l":{"a":{"t":4}},"o":{"l":{"i":{"z":20,"c":19}}},"r":[{"o":{"g":4}},18],"u":{"l":3}},"c":{"a":{"r":[{"d":4,"o":4},21],"b":{"l":24}},"e":{"o":{"u":19},"r":2},"h":{"e":{"t":19}},"i":[{"e":23,"n":2,"o":23},22],"r":{"o":{"b":4}},"t":{"i":{"f":5}},"u":{"l":3,"m":1}},"d":[{"d":{"i":{"n":1}},"e":{"r":{".":4}},"i":[{"a":23,"c":{"a":3},"e":{"r":0},"o":23,"t":23,"u":19},25],"l":{"e":1},"o":{"w":3},"r":{"a":{"n":4}},"s":{"u":1},"u":[{"c":23,"m":4},18]},24],"e":{"r":[{"i":{"e":17}},1]},"f":[{"f":[{"i":{"s":{"h":170}}},0]},24],"g":{"a":{"b":21,"n":0},"e":{"l":{"l":4},"o":0,"u":18},"i":2,"l":26,"n":2,"o":[{"g":27,"n":{"i":3}},24],"u":{"e":{"r":19},"l":4},"y":21},"h":{"a":23,"e":23,"l":1,"o":23},"i":[{"a":19,"c":{".":23},"l":{"y":4},"n":[{"i":{"n":5},"o":5},28],"t":{"e":{"n":5}}},9],"j":29,"k":{"e":{"n":2}},"l":{"a":{"b":4,"d":3,"r":21},"d":{"i":18},"e":[{"n":{"d":3,"t":{"i":21}},"o":30},25],"i":[{"a":{".":1},"e":0},2],"l":{"e":{"v":4},"i":{"c":18}},"m":18,"o":{"g":{".":19}},"y":{".":21,"s":[{"t":31},18],"t":32,"z":27}},"m":{"a":[{"b":4,"g":3,"r":{"a":5},"s":{"c":4},"t":{"i":{"s":21},"o":33}},18],"e":{"r":{"a":4},"n":{"t":{"a":{"b":182}}}},"i":{"c":3,"f":4,"l":{"y":4},"n":[{"o":0},2]},"o":[{"n":19,"r":{"i":6}},24],"p":{"e":{"n":5}}},"n":[{"a":{"g":{"e":3},"l":{"y":[{"s":183},27]},"r":[{"c":3,"i":17},23],"t":{"i":23}},"d":[{"e":{"s":17},"i":{"s":3},"l":2,"o":{"w":1}},18],"e":{"e":19,"n":23,"s":{"t":{".":4}},"u":23},"g":[{"i":{"e":5},"l":2},25],"i":{"c":34,"e":{"s":23},"f":35,"m":{"e":1,"i":19},"n":{"e":19},"o":3,"p":23,"s":{"h":3},"t":3,"u":23},"k":{"l":{"i":1}},"n":{"i":{"z":32}},"o":[{"t":[{"h":7},4],"a":{"c":148}},0],"s":{"a":9,"c":{"o":1},"n":1,"p":[{"o":11},9],"t":1,"u":{"r":1},"g":{"r":5},"v":11},"t":{"a":{"l":36},"i":{"e":1,"d":137,"n":184,"r":{"e":137}},"o":18,"r":9,"w":1},"u":{"a":3,"l":3,"r":19}},24],"o":18,"p":{"a":{"r":17,"t":4},"e":{"r":{"o":4},"a":{"b":{"l":{"e":132}}}},"h":{"e":{"r":23},"i":18},"i":{"l":{"l":{"a":[{"r":4},21]}},"n":3,"t":{"a":3,"u":23}},"l":24,"o":{"c":6,"l":{"a":4},"r":{"i":6},"s":{"t":12}},"s":{"e":{"s":5}},"u":23},"q":{"u":{"e":6}},"r":[{"a":{"c":{"t":3},"d":{"e":19,"i":{"s":4}},"l":3,"m":{"e":{"t":{"e":19}}},"n":{"g":17},"p":11,"t":[{"i":{"o":19,"v":4}},1],"u":19,"v":38,"w":17},"b":{"a":{"l":36}},"c":{"h":{"a":{"n":1},"e":{"t":185}}},"d":{"i":{"n":{"e":4}},"r":1},"e":{"a":{"s":4},"e":23,"n":{"t":3},"s":{"s":19}},"f":{"i":1,"l":1},"i":[{"a":{"l":4,"n":3},"e":{"t":23},"m":1,"n":{"a":{"t":4}},"o":3,"z":9},2],"m":{"i":9},"o":{"d":20,"n":{"i":19},"o":23},"p":9,"q":3,"r":{"e":17,"a":{"n":{"g":{"e":9}}}},"s":{"a":1,"h":9}},37],"s":{".":18,"a":{"b":1,"n":{"t":3}},"h":{"i":17},"i":{"a":{".":19},"b":23,"c":23,"t":39},"k":{"i":11},"l":1,"o":{"c":21},"p":{"h":4},"s":{"h":1},"t":{"e":{"n":3},"r":2},"u":{"r":{"a":6}},"y":{"m":{"p":{"t":{"o":{"t":4}}}}}},"t":{"a":[{"b":{"l":3},"c":4,"l":{"o":3},"p":4},24],"e":{"c":[{"h":4},5],"g":{"o":3},"n":{".":3},"r":{"a":3,"n":[{"a":19},6]},"s":{"t":3},"v":4},"h":[{"e":{"m":5,"n":19,"r":{"o":{"s":186}}},"o":[{"m":5},1]},18],"i":{".":18,"a":19,"b":20,"c":2,"f":3,"o":{"n":{"a":{"r":7}}},"t":{"u":3}},"o":{"g":21,"m":[{"i":{"z":4}},24],"p":21,"s":21},"r":[{"o":{"p":4}},29],"s":{"k":1},"t":{"a":{"g":1},"e":[{"s":{".":170}},4],"h":1},"u":[{"a":4,"e":4,"l":3,"r":{"a":3}},24],"y":24},"u":{"b":1,"g":{"h":[{"t":{"l":17}},12],"u":3},"l":[{"i":{"f":13}},40],"n":{"d":5},"r":3,"s":{"i":{"b":4}},"t":{"e":{"n":5},"h":2}},"v":{"a":[{"g":3,"n":19},24],"e":{"n":{"o":0},"r":{"a":3,"n":4,"y":4}},"i":[{"e":{"r":0},"g":3,"o":{"u":3}},2],"o":{"c":4,"r":29}},"w":{"a":{"y":27},"i":3,"l":{"y":1},"s":0},"x":{"i":{"c":1,"d":1}},"y":{"a":{"l":4},"e":0,"s":0},"z":{"i":{"e":{"r":0}},"z":{"i":5}}},"b":{"a":{".":32,"d":{"g":{"e":{"r":5}}},"g":{"e":1},"l":{"a":15},"n":{"d":{"a":{"g":5}},"e":0,"i":11},"r":{"b":{"i":7},"i":{"a":17},"o":{"n":{"i":{"e":187}}}},"s":{"s":{"i":0}},"t":[{"h":{"y":2}},41],"z":1,"c":{"k":{"e":{"r":{".":84}}}}},"b":[{"e":[{"r":23},24],"i":{"n":{"a":0},"t":0}},42],"d":43,"e":{".":18,"a":{"k":17,"t":12},"d":[{"a":3,"e":3,"i":3},44],"g":{"i":3,"u":4},"l":[{"i":2,"o":3},41],"m":45,"n":{"i":{"g":4},"u":4},"s":[{"p":3,"t":{"r":4}},46],"t":[{"i":{"z":5},"r":4,"w":3},27],"w":3,"y":{"o":4},"v":{"i":{"e":9}}},"f":25,"h":47,"i":{"b":9,"d":[{"i":{"f":167}},1],"e":[{"n":4,"r":1},27],"f":48,"l":[{"i":{"z":3},"l":{"a":{"b":8}}},41],"n":{"a":{"r":49},"d":0,"e":{"t":4}},"o":{"g":{"r":3},"u":4,"m":5,"r":{"b":2,"h":15}},"t":[{"i":{"o":50,"v":{"e":188}},"r":3,"u":{"a":51},"z":19},9]},"j":29,"k":1,"l":[{"a":{"t":{"h":7},"n":{"d":189}},"e":{".":21,"n":17,"s":{"p":32}},"i":{"s":23,"n":{"d":189}},"o":[{"n":{"d":190}},21],"u":{"n":{"t":17}}},52],"m":43,"n":[{"e":{"g":5}},47],"o":{"d":[{"i":11},27],"e":1,"l":{"i":{"c":11}},"m":{"b":{"i":0}},"n":{"a":[{"t":5},0]},"o":27,"r":{".":32,"a":43,"d":5,"e":32,"i":32,"n":{"o":191}},"s":53,"t":{"a":19,"h":6,"o":1,"u":{"l":192}},"u":{"n":{"d":54}}},"p":18,"r":{"i":{"t":18},"o":{"t":{"h":54}},"u":{"s":{"q":17}}},"s":[{"o":{"r":17}},55],"t":[{"l":1,"o":21,"r":23},25],"u":{"f":{"f":{"e":{"r":0}}},"g":{"a":1},"l":{"i":3},"m":{"i":17},"n":[{"t":{"i":17}},1],"r":{"e":3},"s":{"i":{"e":[{"r":193,"s":193},5]},"s":{"e":17,"i":{"n":{"g":17}}},"t":32},"t":{"a":18,"i":{"o":27},"o":19,"e":{"d":{".":8}},"t":{"e":{"d":0}}}},"v":29,"w":56,"y":{".":32,"s":0}},"c":{"a":[{"b":{"i":{"n":11},"l":2},"c":{"h":17},"d":{"e":{"n":4,"m":194}},"g":46,"h":57,"l":{"a":{"t":3},"l":{"a":0,"i":{"n":6}},"o":18},"n":{"d":5,"e":0,"i":{"c":0,"s":5,"z":11},"t":{"y":0},"y":17},"p":{"e":{"r":4}},"r":{"o":{"m":5}},"s":{"t":{"e":{"r":6},"i":{"g":5}},"y":18},"t":{"h":1,"i":{"v":18},"a":{"s":195}},"v":{"a":{"l":5}}},41],"c":[{"h":{"a":6},"i":{"a":0},"o":{"m":{"p":{"a":10}},"n":17,"u":{"t":12}}},23],"e":{".":25,"d":{".":18,"e":{"n":18}},"i":27,"l":{".":32,"l":27},"n":[{"c":27,"e":58,"i":18,"t":27},41],"p":27,"r":{"a":{"m":4}},"s":{"a":18,"s":{"i":[{"b":59},27]},"t":5},"t":[{"a":60},0],"w":0},"h":[{".":18,"a":{"b":61,"n":{"i":{"c":32,"s":20}}},"e":[{"a":{"p":54},"d":18,"l":{"o":5},"m":{"i":27},"n":{"e":4},"r":{".":3,"s":3}},8],"i":{"n":[{"e":{".":32,"s":{"s":4}},"i":32},62],"o":32,"t":27,"z":8,"e":{"v":{"o":6}}},"o":63,"t":{"i":1},"s":{".":18,"h":{"u":11}}},25],"i":[{"a":[{"b":64,"r":5},27],"c":4,"e":{"r":18},"f":{"i":{"c":{".":32}}},"i":18,"l":{"a":1,"i":27},"m":25,"n":[{"a":[{"t":27},21],"e":{"m":11},"g":[{".":19},29],"o":32,"q":8},25],"o":{"n":17},"p":{"e":18,"h":3,"i":{"c":18}},"s":{"t":{"a":18,"i":18}},"t":[{"i":{"z":11}},42],"z":32,"g":{"a":{"r":152}}},41],"k":[{"i":3},2],"l":[{"a":{"r":[{"a":{"t":{"i":{"o":19}}},"e":32},18]},"e":{"m":0,"a":{"r":0}},"i":{"c":18,"m":17},"y":0},65],"n":19,"o":[{"a":{"g":4},"e":8,"g":[{"r":1},25],"i":[{"n":{"c":3}},0],"l":{"i":5,"o":[{"r":11},32]},"m":{"e":{"r":5}},"n":{"a":0,"e":21,"g":11,"t":5},"p":{"a":3,"i":{"c":11},"l":1,"h":{"o":{"n":196}}},"r":{"b":18,"o":{"n":12}},"s":{"e":0},"v":[{"e":17},15],"w":{"a":5},"z":{"e":5,"i":4},"u":{"s":{"t":{"i":84}}}},41],"q":29,"r":{"a":{"s":{"t":6},"t":{".":32,"i":{"c":32}}},"e":{"a":{"t":11},"d":32,"t":{"a":47},"v":0},"i":[{"f":5,"n":21,"s":17,"t":{"i":[{"e":11},32]}},8],"o":{"p":{"l":0,"o":6},"s":{"e":17},"c":{"o":{"d":197}},"e":{"c":{"o":148}}},"u":{"d":0}},"s":66,"t":[{"a":{"b":0,"n":{"g":4,"t":19}},"e":[{"r":23},24],"i":{"c":{"u":21},"m":{"i":12}},"u":{"r":0},"w":21,"r":{"o":{"m":{"e":{"c":198}}}}},42],"u":{"d":5,"f":21,"i":[{"t":{"y":4}},21],"l":{"i":32,"t":{"i":{"s":0},"u":27}},"m":{"a":9,"e":23,"i":1},"n":27,"p":{"i":3,"y":4},"r":{"a":{"b":67,"n":{"c":{"e":199}}},"i":{"a":4}},"s":[{"s":{"i":17}},41],"t":[{"i":{"e":1,"v":56},"r":18},68]},"y":41,"z":{"e":0}},"d":{"a":[{".":32,"b":70,"c":{"h":17},"f":18,"g":25,"m":71,"n":{"g":11},"r":{"d":6,"k":6,"y":18},"t":[{"i":{"v":18},"o":18,"a":{"b":137}},27],"v":[{"e":5},53],"y":32,"l":{"o":{"n":{"e":48}}}},69],"b":29,"c":19,"d":[{"a":{"b":20},"i":{"b":94}},72],"e":{".":25,"a":{"f":6,"l":{"s":{".":1}}},"b":{"i":{"t":5},"o":{"n":1}},"c":{"a":{"n":36},"i":{"l":1},"o":{"m":4},"l":{"a":{"r":200},"i":{"n":{"a":64}}}},"d":42,"e":{".":18},"i":{"f":4},"l":{"i":{"e":17,"q":16},"o":4},"m":[{".":32,"i":{"c":[{".":5},27],"l":4},"o":{"n":{"s":1},"r":7,"s":9}},21],"n":[{"a":{"r":1},"o":3,"t":{"i":{"f":7}},"u":3},41],"p":[{"a":3,"i":17,"u":9},2],"q":23,"r":{"h":21,"m":32,"n":{"i":{"z":6}},"s":5},"s":[{".":24,"c":2,"o":64,"t":{"i":11,"r":3},"u":1,"i":{"c":11}},8],"t":[{"o":9,"i":{"c":9}},2],"v":[{"i":{"l":11}},2],"y":18,"f":{"i":{"n":{"i":{"t":{"i":201}}}}}},"f":43,"g":{"a":21,"e":{"t":73},"i":2,"y":24},"h":74,"i":{".":32,"a":[{"b":5},75],"c":{"a":{"m":1,"i":{"d":15}},"e":21,"t":27},"d":27,"e":{"n":76},"f":[{"f":{"r":{"a":5}}},29],"g":{"e":3},"l":{"a":{"t":{"o":1}}},"n":[{"a":41,"e":{".":27},"i":[{"z":4},32]},29],"o":[{"g":5},41],"p":{"l":1},"r":[{"e":[{"n":9,"r":9},2],"t":{"i":6}},8],"s":[{"i":32,"t":77},15],"t":{"i":24},"v":78,"m":{"e":{"t":{"h":{"y":141}}}}},"j":29,"k":79,"l":{"a":56,"e":{".":27,"d":27,"s":{".":27,"s":18},"a":{"d":42}},"o":48,"u":56,"y":25,"i":{"e":202}},"m":29,"n":80,"o":[{".":27,"d":{"e":4},"e":32,"f":57,"g":21,"l":{"a":1,"i":17,"o":{"r":4}},"m":{"i":{"z":5}},"n":{"a":{"t":3},"i":17},"o":{"d":11},"p":{"p":0},"r":21,"s":27,"u":{"t":56},"v":1,"x":27,"w":{"o":{"r":{"d":203}}}},41],"p":29,"r":[{"a":{"g":{"o":{"n":6}},"i":18},"e":[{"a":{"r":6},"n":[{"a":{"l":204}},32]},0],"i":{"b":0,"l":17,"f":{"t":{"a":189}},"p":{"l":{"e":{"g":205}}}},"o":{"p":0,"w":18,"m":{"e":{"d":206}}},"u":{"p":{"l":{"i":32}}},"y":18},41],"s":[{"p":1,"w":21,"y":21},81],"t":{"h":24,"a":{"b":23}},"u":[{"a":[{"l":{".":9}},82],"c":[{"a":29,"e":{"r":5},"t":{".":18,"s":18}},9],"e":{"l":4},"g":1,"l":{"e":23},"m":{"b":{"e":0}},"n":1,"p":[{"e":1},18],"o":{"p":{"o":{"l":207}}}},41],"v":29,"w":29,"y":[{"n":32,"s":{"e":1,"p":5}},24]},"e":{"a":{"b":72,"c":{"t":23},"d":[{"i":{"e":5}},15],"g":{"e":[{"r":4},1]},"l":[{"e":{"r":5},"o":{"u":11}},1],"m":{"e":{"r":11}},"n":{"d":19,"i":{"e":{"s":111}}},"r":{"a":11,"c":0,"e":{"s":5},"i":{"c":0,"l":0},"k":5,"t":[{"e":12},8]},"s":{"p":4,"s":23,"t":12},"t":[{"e":{"n":5},"h":{"i":12},"i":{"f":19},"u":83},9],"v":[{"e":{"n":11},"i":5,"o":5},9]},"b":[{"e":{"l":{".":21,"s":21},"n":21},"i":{"t":21},"r":23},42],"c":{"a":{"d":21,"n":{"c":6}},"c":{"a":6},"e":[{"s":{"s":{"a":4}}},29],"i":[{"b":21,"f":{"i":{"c":{"a":{"t":4}},"e":4},"y":4},"m":3,"t":[{"e":19},0]},9],"l":{"a":{"m":21},"u":{"s":21}},"o":{"l":24,"m":{"m":21,"p":{"e":21}},"n":{"c":21},"r":[{"a":3,"o":5},24]},"r":[{"e":{"m":21}},29],"t":{"a":{"n":1},"e":1},"u":[{"l":[{"a":3},21]},29],"h":{"a":{"s":23}}},"d":{"a":37,"d":61,"e":{"r":34,"s":0},"i":[{"a":23,"b":3,"c":{"a":3},"m":3,"t":2,"z":5},18],"o":[{"l":21,"n":84},18],"r":{"i":21},"u":{"l":[{"o":4,"i":{"n":{"g":2}}},21]},"g":{"l":15}},"e":{"c":9,"d":{"i":11},"f":9,"l":{"i":11,"y":1},"m":9,"n":{"a":1},"p":85,"s":[{"t":17},86],"t":{"y":1},"x":19},"f":[{"e":{"r":{"e":83}},"f":41,"i":{"c":[{"i":32},21],"l":17,"n":{"e":23,"i":{"t":{"e":20}}},"t":27},"o":{"r":{"e":{"s":6}}},"u":{"s":{"e":{".":21}}}},29],"g":{"a":{"l":18},"e":{"r":17},"i":{"b":4,"c":1,"n":{"g":4},"t":87},"n":4,"o":{".":21,"s":21},"u":{"l":2,"r":19},"y":32},"h":[{"e":{"r":17}},72],"i":[{"c":19,"d":4,"g":[{"l":4},8],"m":{"b":23},"n":{"f":23,"g":29,"s":{"t":19}},"r":{"d":0},"t":{"e":11,"h":3,"y":19}},9],"j":[{"u":{"d":[{"i":4},21]}},29],"k":{"i":{"n":0},"l":{"a":1}},"l":{"a":[{".":21,"c":21,"n":{"d":17},"t":{"i":{"v":4}},"w":21,"x":{"a":36}},29],"e":{"a":23,"b":{"r":{"a":4}},"c":32,"d":21,"g":{"a":3},"n":19,"r":34,"s":29},"f":9,"i":[{"b":{"e":23},"c":{".":33,"a":3},"e":{"r":23},"g":{"i":{"b":4}},"m":19,"n":{"g":83},"o":23,"s":[{"h":4},24],"v":88,"t":{"i":{"s":208}}},9],"l":{"a":[{"b":1},18],"o":17},"o":{"c":19,"g":4,"p":{".":3},"a":29},"s":{"h":9},"t":{"a":1},"u":{"d":19,"g":4}},"m":{"a":{"c":21,"g":21,"n":[{"a":4},19]},"b":4,"e":[{"l":24,"t":21},29],"i":{"c":{"a":3},"e":0,"g":{"r":{"a":4}},"n":[{"e":4,"i":35},89],"s":[{"h":4,"s":19},21],"z":3},"n":{"i":{"z":32}},"o":{"g":0,"n":{"i":{"o":7}}},"p":{"i":3},"u":{"l":[{"a":4},21],"n":11},"y":23},"n":{"a":{"m":{"o":4},"n":{"t":21}},"c":{"h":{"e":{"r":17}}},"d":{"i":{"c":3,"x":2}},"e":{"a":19,"e":19,"m":3,"r":{"o":4},"s":{"i":4,"t":4},"t":{"r":3},"w":23},"i":{"c":{"s":4},"e":19,"l":19,"o":23,"s":{"h":3},"t":3,"u":19,"z":32},"n":18,"o":[{"g":0,"s":21,"v":3},18],"s":{"w":1},"t":{"a":{"g":{"e":5}},"h":{"e":{"s":18}}},"u":{"a":3,"f":4},"y":{".":23},"z":61},"o":{"f":19,"g":[{"r":{"a":{"p":3}}},9],"i":90,"l":23,"p":{"a":{"r":11}},"r":[{"e":3,"o":{"l":4}},29],"s":0,"t":[{"o":1},21],"u":{"t":19},"w":19},"p":{"a":[{"i":23,"n":{"c":4}},24],"e":{"l":19,"n":{"t":23},"t":{"i":{"t":{"i":{"o":4}}}}},"h":{"e":17},"l":{"i":21},"o":29,"r":{"e":{"c":[{"a":4},21],"d":21,"h":3},"o":[{"b":21},23]},"s":{"h":1},"t":{"i":{"b":13}},"u":{"t":[{"a":4},21]},"i":{"n":{"e":{"p":{"h":209}}}}},"q":[{"u":{"i":{"l":12,"s":91}}},29],"r":{"a":[{"b":0,"n":{"d":18},"r":3,"t":{"i":{".":18}}},2],"b":[{"l":1},25],"c":{"h":[{"e":1},3]},"e":{".":25,"a":{"l":23},"c":{"o":5},"i":{"n":11},"l":{".":4},"m":{"o":3},"n":{"a":4,"c":{"e":4},"e":18,"t":3},"q":0,"s":{"s":4,"t":3},"t":17},"h":2,"i":[{"a":[{"n":{".":210}},92],"c":{"k":32},"e":{"n":23,"r":0},"n":{"e":3},"o":29,"t":18,"u":1,"v":[{"a":21},0]},2],"m":93,"n":{"i":{"s":1,"t":18,"z":32},"o":3},"o":[{"b":4,"c":19,"r":0,"u":2},25],"s":[{"e":{"t":3}},2],"t":{"e":{"r":11},"l":18,"w":3},"u":[{"t":0},18],"w":{"a":{"u":32}}},"s":{"a":[{"g":{"e":{".":21,"s":21}}},72],"c":[{"a":[{"n":4},24],"r":23,"u":4},9],"e":[{"c":[{"r":4},24],"n":{"c":4},"r":{"t":{".":21,"s":21},"v":{"a":21}}},74],"h":[{"a":23,"e":{"n":5}},18],"i":[{"c":24,"d":[{"e":{"n":4}},24],"g":{"n":{"a":4}},"m":94,"n":95,"s":{"t":{"e":17}},"u":0},29],"k":{"i":{"n":19}},"m":{"i":1},"o":{"l":[{"u":3},24],"n":[{"a":4},24]},"p":[{"e":{"r":3},"i":{"r":{"a":4}},"r":{"e":1},"a":{"c":{"i":211}}},29],"s":[{"i":{"b":96}},25],"t":{"a":{"n":36},"i":{"g":3,"m":4},"o":[{"n":23},44],"r":[{"o":19,"u":{"c":10}},25]},"u":{"r":[{"r":4},24]},"w":1},"t":{"a":{"b":0},"e":{"n":{"d":17},"o":23},"h":{"o":{"d":54},"y":{"l":{"e":{"n":{"e":162}}}}},"i":{"c":2,"d":{"e":19},"n":[{"o":0},17],"r":19,"t":{"i":{"o":19,"v":4}}},"n":18,"o":{"n":{"a":4}},"r":{"a":23,"e":23,"i":{"c":3,"f":4},"o":{"g":3,"s":4}},"u":{"a":3},"y":{"m":4},"z":4},"u":[{"n":19,"p":23,"r":{"o":3},"s":0,"t":{"e":17,"i":{"l":6},"r":4},"c":{"l":{"i":{"d":212}}}},18],"v":{"a":{"p":97,"s":[{"t":4},24]},"e":{"a":19,"l":{"l":3,"o":12},"n":{"g":19,"i":17},"r":[{"b":19},2]},"i":[{"d":3,"l":0,"n":21,"v":0},29],"o":{"c":19},"u":19},"w":{"a":[{"g":21},29],"e":{"e":19},"h":23,"i":{"l":6,"n":{"g":3},"t":23}},"x":{"p":41},"y":{"c":32,"e":{".":32},"s":0}},"f":{"a":[{"b":{"l":3,"r":11},"c":{"e":1},"g":18,"i":{"n":17},"l":{"l":{"e":6}},"m":{"a":26,"i":{"s":5}},"r":[{"t":{"h":5}},32],"t":{"a":3,"h":{"e":3},"o":18},"u":{"l":{"t":7}}},41],"b":56,"d":18,"e":{".":18,"a":{"s":17,"t":{"h":54}},"b":[{"r":{"u":{"a":15}}},1],"c":{"a":18,"t":32},"d":25,"l":{"i":3},"m":{"o":1},"n":{"d":[{"e":6},8]},"r":[{"r":32,"m":{"i":{"o":213}}},15],"v":0},"f":[{"e":{"s":21},"i":{"e":21,"n":{".":19},"s":94},"l":{"y":21},"y":24},43],"h":18,"i":[{"a":3,"c":{".":48,"a":{"l":47,"n":23,"t":{"e":18}},"e":{"n":23,"r":3},"i":[{"a":32,"e":32},0],"s":18,"u":3,"h":27},"d":{"e":{"l":4}},"g":{"h":{"t":7}},"l":{"i":5,"l":{"i":{"n":6}},"y":18},"n":[{"a":32,"d":97,"e":9,"g":98,"n":0},25],"s":{"t":{"i":0}},"t":{"t":{"e":{"d":{".":5}}}}},41],"l":[{"e":{"s":{"s":19}},"i":{"n":17},"o":{"r":{"e":11},"w":{"e":{"r":{".":84}}}},"y":100,"a":{"g":{"e":{"l":214}}},"u":{"o":{"r":27}}},99],"m":18,"n":18,"o":[{"n":[{"d":{"e":0},"t":0},32],"r":[{"a":{"t":4,"y":5},"e":{"t":6},"i":0,"t":{"a":6}},9],"s":5},41],"p":56,"r":{"a":{"t":0},"e":{"a":19,"s":{"c":6}},"i":[{"l":17},8],"o":{"l":6}},"s":48,"t":[{"o":21,"y":24},25],"u":[{"e":{"l":4},"g":18,"m":{"i":{"n":1}},"n":{"e":4},"r":{"i":3},"s":{"i":17,"s":0},"t":{"a":18}},27],"y":41},"g":{"a":[{"f":0,"l":{".":32,"i":27,"o":3},"m":[{"e":{"t":4},"o":19},25],"n":{"i":{"s":5,"z":[{"a":6},3]},"o":18},"r":{"n":67},"s":{"s":17},"t":{"h":12,"i":{"v":18}},"z":18},41],"b":23,"d":1,"e":{".":25,"d":25,"e":{"z":17},"l":{"i":{"n":0,"s":4,"z":4},"y":18},"n":[{"a":{"t":1},"i":{"z":4},"o":18,"y":18,"c":{"y":{".":8}}},41],"o":[{"m":3,"d":215},41],"r":{"y":21},"s":{"i":32},"t":{"h":6,"o":18,"y":1,"i":{"c":{".":8}}},"v":1},"g":[{"e":[{"r":23},24],"l":{"u":6},"o":0},101],"h":{"i":{"n":3},"o":{"u":{"t":4}},"t":{"o":1,"w":{"e":15}}},"i":{".":32,"a":[{"r":5},102],"c":[{"i":{"a":32},"o":21},29],"e":{"n":6,"s":{".":32}},"l":0,"m":{"e":{"n":23}},"n":{".":68,"g":{"e":5},"s":103},"o":32,"r":[{"l":0},27],"s":{"l":23},"u":1,"v":32,"z":27},"l":[{"a":[{"d":{"i":6},"s":32},0],"e":[{"a":{"d":29}},41],"i":{"b":0,"g":23,"s":{"h":43}},"o":[{"r":11,"b":{"i":{"n":106}}},27]},9],"m":[{"y":21},29],"n":{"a":[{".":21,"c":69},1],"e":{"t":{"t":17,"i":{"s":{"m":137}}}},"i":[{"n":24,"o":21},29],"o":[{"n":21,"m":{"o":5},"r":{".":216,"e":{"s":{"p":24}}}},29]},"o":[{".":27,"b":5,"e":32,"g":104,"i":{"s":3},"n":[{"a":105,"d":{"o":7},"i":[{"z":{"a":217}},3]},8],"o":32,"r":{"i":{"z":4},"o":{"u":5}},"s":{".":32},"v":15},41],"p":23,"r":[{"a":{"d":{"a":18},"i":21,"n":84,"p":{"h":{".":32,"e":{"r":[{".":7},19]},"i":{"c":32},"y":18}},"y":18},"e":{"n":0,"s":{"s":{".":18}}},"i":{"t":18,"e":{"v":213}},"o":21,"u":{"f":17}},41],"s":[{"t":{"e":19}},9],"t":{"h":11},"u":{"a":[{"r":{"d":27}},1],"e":25,"i":{"t":106},"n":27,"s":27,"t":[{"a":{"n":29}},26]},"w":23,"y":[{"n":107,"r":{"a":4}},41]},"h":{"a":{"b":{"l":73},"c":{"h":17},"e":{"m":0,"t":0},"g":{"u":19},"l":{"a":[{"m":12},3]},"m":1,"n":{"c":{"i":0,"y":0},"d":{".":32},"g":[{"e":{"r":6},"o":6},0],"i":{"z":108},"k":0,"t":{"e":0}},"p":{"l":11,"t":5,"a":{"r":{"r":218}}},"r":{"a":{"n":3,"s":4},"d":[{"e":12},8],"l":{"e":0},"p":{"e":{"n":6}},"t":{"e":{"r":5}}},"s":{"s":5},"u":{"n":17},"z":[{"a":11},32],"i":{"r":{"s":137}},"t":{"c":{"h":213}}},"b":29,"e":{"a":{"d":41,"r":27},"c":{"a":{"n":1,"t":19}},"d":[{"o":13},21],"l":{"i":93,"l":{"i":{"s":0},"y":0},"o":19},"m":{"p":0},"n":[{"a":[{"t":5},17]},9],"o":{"r":5},"p":5,"r":{"a":[{"p":12},21],"b":{"a":0},"e":{"a":6},"n":23,"o":{"u":19},"y":23},"s":[{"p":64},29],"t":[{"e":{"d":0}},1],"u":0,"x":{"a":168}},"f":29,"h":29,"i":{"a":{"n":4},"c":{"o":1},"g":{"h":6},"l":109,"m":{"e":{"r":36}},"n":{"a":21},"o":{"n":{"e":17}},"p":[{"e":{"l":{"a":219}}},1],"r":{"l":0,"o":3,"p":0,"r":0},"s":{"e":{"l":11},"s":0},"t":{"h":{"e":{"r":6}},"e":{"s":{"i":{"d":12}}}},"v":9},"k":18,"l":[{"a":{"n":17},"o":[{"r":{"i":11}},24]},80],"m":[{"e":{"t":17}},43],"n":[{"a":{"u":{"z":12}}},42],"o":{"d":{"i":{"z":19},"s":19},"g":[{"e":17},1],"l":{"a":{"r":5},"e":110},"m":{"a":1,"e":12},"n":{"a":0,"y":4},"o":{"d":27,"n":17},"r":{"a":{"t":5},"i":{"s":4,"c":{".":187}},"t":{"e":12},"u":4},"s":{"e":[{"n":4},0],"p":15},"u":{"s":[{"e":54},41]},"v":{"e":{"l":5}}},"p":56,"r":[{"e":{"e":6},"o":{"n":{"i":{"z":5}},"p":{"o":11}}},26],"s":[{"h":21},101],"t":{"a":{"r":21},"e":{"n":2,"s":4,"o":{"u":216}},"y":21},"u":{"g":1,"m":{"i":{"n":1}},"n":{"k":{"e":5},"t":0},"s":{"t":14},"t":1},"w":[{"a":{"r":{"t":21}}},29],"y":{"p":{"e":3,"h":3,"o":{"t":{"h":{"a":137}}}},"s":9}},"i":{"a":[{"l":24,"m":[{"e":{"t":{"e":5}}},0],"n":[{"c":18,"i":11,"t":46},24],"p":{"e":4},"s":{"s":17},"t":{"i":{"v":21},"r":{"i":{"c":1}},"u":21}},42],"b":{"e":[{"r":{"a":3,"t":4}},0],"i":{"a":4,"n":3,"t":{".":4,"e":4}},"l":[{"i":3},29],"o":19,"r":[{"i":94},29],"u":{"n":19}},"c":{"a":{"m":18,"p":32,"r":[{".":21,"a":21},18],"s":6,"y":21},"c":{"u":17},"e":{"o":18},"h":18,"i":[{"d":19,"n":{"a":4},"p":[{"a":3},24]},25],"l":{"y":21},"o":{"c":94},"r":[{"a":32,"y":21},43],"t":{"e":1,"u":[{"a":111},84]},"u":{"l":{"a":3},"m":1,"o":4,"r":23}},"d":[{"a":{"i":21,"n":{"c":4}},"d":4,"e":{"a":{"l":11},"s":0},"i":[{"a":{"n":4,"r":0},"e":19,"o":[{"u":5,"s":1},3],"t":2,"u":4},24],"l":{"e":23},"o":{"m":21,"w":3},"r":21,"u":[{"o":4},24]},25],"e":[{"d":{"e":0},"g":{"a":113},"l":{"d":12},"n":{"a":67,"e":0,"n":19,"t":{"i":23}},"r":{".":29},"s":{"c":23,"t":29},"t":23},112],"f":{".":18,"e":{"r":{"o":4}},"f":{"e":{"n":5},"r":1},"i":{"c":{".":18},"e":23},"l":23,"t":18,"a":{"c":{"e":{"t":137}}}},"g":[{"a":{"b":5},"e":{"r":{"a":3}},"h":{"t":{"i":12}},"i":[{"b":23,"l":3,"n":3,"t":3},18],"l":28,"o":[{"r":3,"t":4},24],"r":{"e":19},"u":{"i":5,"r":2},"n":{"i":{"t":[{"e":{"r":213}},0]}}},25],"h":23,"i":114,"j":[{"k":21},23],"k":18,"l":{"a":[{"b":93,"d":{"e":21},"m":94,"r":{"a":5}},29],"e":{"g":23,"r":2,"v":17},"f":4,"i":[{"a":3,"b":9,"o":3,"s":{"t":1},"t":25,"z":9},2],"l":{"a":{"b":5}},"n":18,"o":{"q":3},"t":{"y":1},"u":{"r":4},"v":3},"m":{"a":{"g":[{"e":3},21],"r":{"y":5}},"e":{"n":{"t":{"a":{"r":10}}},"t":18},"i":[{"d":{"a":4},"l":{"e":5},"n":{"i":19},"t":18},2],"n":{"i":1},"o":{"n":23},"u":[{"l":{"a":3}},24],"p":{"e":{"d":{"a":201}}}},"n":{".":25,"a":{"u":83,"v":18},"c":{"e":{"l":36,"r":3}},"d":[{"l":{"i":{"n":{"g":4}}}},18],"e":[{"e":23,"r":{"a":{"r":17}},"s":{"s":19}},25],"g":{"a":18,"e":[{"n":4},18],"i":18,"l":{"i":{"n":{"g":4}}},"o":18,"u":18},"i":[{".":19,"a":21,"o":3,"s":2,"t":{"e":{".":19,"l":{"y":{".":19}}},"i":{"o":32},"y":3}},25],"k":18,"l":18,"n":25,"o":[{"c":90,"s":0,"t":21},42],"s":[{"e":3,"u":{"r":{"a":7}}},25],"t":{".":25,"h":112},"u":[{"s":19},2],"y":18,"f":{"r":{"a":{"s":220}}}},"o":[{".":18,"g":{"e":17,"r":9},"l":29,"m":1,"n":{"a":{"t":11},"e":{"r":{"y":0}},"i":11},"p":{"h":4},"r":{"i":11},"s":21,"t":{"h":4,"i":19,"o":1},"u":{"r":21}},25],"p":[{"e":0,"h":{"r":{"a":{"s":115}}},"i":[{"c":1},3],"r":{"e":96},"u":{"l":3}},25],"q":{"u":{"a":23,"e":{"f":4},"i":{"d":3,"t":116}}},"r":[{"a":[{"b":0,"c":21},29],"d":{"e":5},"e":{"d":{"e":0},"f":21,"l":117,"s":21},"g":{"i":4},"i":[{"d":{"e":5},"s":1,"t":{"u":11},"z":118},2],"m":{"i":{"n":1}},"o":{"g":0,"n":{".":32}},"u":{"l":4},"r":{"e":{"v":{"o":{"c":221}}}}},18],"s":{".":25,"a":{"g":4,"r":3,"s":6},"c":[{"h":3},119],"e":[{"r":3},18],"f":27,"h":{"a":{"n":4},"o":{"n":3,"p":5}},"i":{"b":3,"d":0,"s":19,"t":{"i":{"v":4}}},"k":26,"l":{"a":{"n":36}},"m":{"s":18},"o":[{"m":{"e":{"r":5}}},24],"p":[{"i":9,"y":1},2],"s":[{"a":{"l":1},"e":{"n":36,"s":1}},62],"t":{"a":{".":1},"e":2,"i":2,"l":{"y":0},"r":{"a":{"l":18}}},"u":[{"s":4},24]},"t":{"a":{".":18,"b":{"i":0},"g":21,"m":120,"n":23,"t":23},"e":[{"r":{"a":3,"i":19},"s":[{"i":{"m":{"a":29}}},1]},25],"h":[{"i":{"l":148}},25],"i":[{"a":18,"c":[{"a":3,"k":31},22],"g":3,"l":{"l":4},"m":24,"o":25,"s":[{"m":21},18],"n":{"e":{"r":{"a":{"r":158}}}}},29],"o":{"m":121,"n":18},"r":{"a":{"m":21},"y":4},"t":18,"u":{"a":{"t":3},"d":19,"l":3},"z":{".":18}},"u":29,"v":[{"e":{"l":{"l":3},"n":{".":3},"r":{".":83,"s":{".":21}}},"i":{"l":{".":4},"o":4,"t":2},"o":{"r":{"e":19,"o":35},"t":83}},25],"w":56,"x":{"o":1},"y":18,"z":{"a":{"r":18},"i":0,"o":{"n":{"t":32}}}},"j":{"a":[{"c":{"q":0},"p":[{"a":{"n":{"e":{"s":220}}}},1],"n":{"u":{"a":12}}},32],"e":[{"r":{"s":5,"e":{"m":222}},"s":{"t":{"i":{"e":18},"y":18}},"w":11},41],"o":{"p":1},"u":{"d":{"g":32}}},"k":{"a":{".":27,"b":23,"g":19,"i":{"s":17},"l":0},"b":29,"e":{"d":24,"e":41,"g":1,"l":{"i":[{"n":{"g":223}},4]},"n":{"d":73},"r":29,"s":[{"t":{".":23}},0],"t":{"y":1}},"f":23,"h":1,"i":[{".":32,"c":122,"l":{"l":21,"o":6},"m":21,"n":{".":21,"d":{"e":0},"e":{"s":{"s":19},"t":{"i":{"c":224}}},"g":0},"p":1,"s":[{"h":19},0]},29],"k":1,"l":[{"e":{"y":18},"y":18},29],"m":29,"n":{"e":{"s":19},"o":69},"o":{"r":4,"s":{"h":17},"u":23,"v":{"i":{"a":{"n":41}}}},"r":{"o":{"n":5}},"s":[{"c":21,"l":1,"y":21,"h":{"a":23}},101],"t":19,"w":29},"l":{"a":{"b":{"i":{"c":11},"o":21},"c":{"i":[{"e":225},17]},"d":{"e":21,"y":3},"g":{"n":0},"m":{"o":11},"n":{"d":[{"l":0},27],"e":{"t":5},"t":{"e":0}},"r":{"g":0,"i":11,"c":{"e":{"n":176}}},"s":{"e":0},"t":{"a":{"n":4},"e":{"l":{"i":18}},"i":{"v":18}},"v":[{"a":95},18],"i":{"n":{"e":{"s":{"s":226}}}}},"b":[{"i":{"n":17}},42],"c":[{"e":0,"i":23,"h":{"a":{"i":23},"i":{"l":{"d":227}}}},101],"d":[{"e":[{"r":{"e":1,"i":1}},24],"i":[{"s":4},0],"r":[{"i":21},23]},25],"e":{"a":[{"d":{"e":{"r":{".":183}}},"s":{"a":228}},9],"b":{"i":1},"f":{"t":6},"g":{".":32,"g":32,"e":{"n":{"d":{"r":{"e":230}}}}},"m":{"a":{"t":[{"i":{"c":5}},1]}},"n":{".":18,"c":27,"e":{".":32},"t":41,"o":{"i":{"d":78}}},"p":{"h":3,"r":1},"r":{"a":{"b":6},"e":0,"g":27,"i":68,"o":21},"s":[{"c":{"o":4},"q":32,"s":[{".":32},27]},8],"v":{"a":23,"e":{"r":{".":0,"a":0,"s":0}}},"y":[{"e":18},27],"c":{"t":{"a":{"b":229}}}},"f":[{"r":19},25],"g":[{"a":[{"r":12},19],"e":{"s":21},"o":11},80],"h":48,"i":{"a":{"g":1,"m":9,"r":{"i":{"z":6}},"s":1,"t":{"o":1}},"b":{"i":4},"c":{"i":{"o":32},"o":{"r":1},"s":18,"t":{".":18},"u":21,"y":23},"d":{"a":23,"e":{"r":5},"i":27},"f":{"e":{"r":11},"f":21,"l":1},"g":{"a":{"t":{"e":32}},"h":27,"r":{"a":1}},"k":27,"l":123,"m":{"b":{"l":0},"i":11,"o":1,"p":90},"n":{"a":21,"e":[{"a":11},124],"i":11,"k":{"e":{"r":6}}},"o":{"g":4},"q":125,"s":{"p":0},"t":[{".":24,"i":{"c":{"a":32,"s":108}},"h":{"o":{"g":204}}},29],"v":{"e":{"r":11}},"z":29},"j":18,"k":{"a":[{"l":23,"t":0},11]},"l":[{"a":{"w":21},"e":[{"a":19,"c":23,"g":23,"l":23,"n":73,"t":73},24],"i":[{"n":[{"a":19},126],"s":{"h":231}},9],"o":[{"q":{"u":{"i":10}},"u":{"t":4},"w":19},1],"f":{"l":2}},29],"m":[{"e":{"t":19},"i":{"n":{"g":3}},"o":{"d":21,"n":[{"e":{"l":{"l":232}}},17]}},25],"n":81,"o":{".":27,"b":{"a":{"l":5},"o":{"t":{"o":233}}},"c":{"i":1},"f":18,"g":{"i":{"c":27},"o":19,"u":27,"e":{"s":{".":9}}},"m":{"e":{"r":11}},"n":{"g":32,"i":[{"z":127},0]},"o":{"d":6},"p":{"e":{".":32},"i":11,"m":23},"r":{"a":[{"t":{"o":1}},17],"i":{"e":4},"o":{"u":5}},"s":{".":32,"e":{"t":5},"o":{"p":{"h":{"i":{"z":32},"y":32}}},"t":0},"t":{"a":1},"u":{"n":{"d":6},"t":25},"v":18,"a":{"d":{"e":{"d":{".":17},"r":{".":183}}}}},"p":[{"a":{"b":5},"h":{"a":23,"i":19},"i":{"n":{"g":4},"t":23},"l":21,"r":19},25],"r":43,"s":[{"c":21,"e":24,"i":{"e":21}},81],"t":[{"a":{"g":4,"n":{"e":7}},"e":[{"n":17,"r":{"a":36},"a":23},29],"h":{"i":[{"l":{"y":148}},11]},"i":{"e":{"s":{".":19}},"s":17},"r":29,"u":[{"r":{"a":12}},8]},18],"u":{"a":4,"b":{"r":3},"c":{"h":17,"i":3},"e":{"n":3,"p":15},"f":0,"i":{"d":4},"m":{"a":1,"i":32,"n":{".":19,"i":{"a":32}},"b":{"i":{"a":{".":235}}}},"o":[{"r":11},3],"p":18,"s":{"s":17,"t":{"e":11}},"t":41,"n":{"k":{"e":{"r":234}}}},"v":{"e":{"n":19,"t":128}},"w":42,"y":[{"a":18,"b":18,"m":{"e":4},"n":{"o":3},"s":[{"e":19,"t":{"y":{"r":4}}},58],"g":{"a":{"m":{"i":236}}}},41]},"m":{"a":[{"b":25,"c":{"a":9,"h":{"i":{"n":{"e":4}}},"l":1},"g":{"i":{"n":5},"n":32},"h":25,"i":{"d":6},"l":{"d":18,"i":{"g":3,"n":4},"l":{"i":0},"t":{"y":0},"a":{"p":222}},"n":{"i":{"a":32,"s":5,"z":11},".":24,"u":{"s":{"c":237}}},"p":[{"h":{"r":{"o":244}}},18],"r":{"i":{"n":{"e":{".":4}},"z":4},"l":{"y":0},"v":11,"g":{"i":{"n":238}}},"s":{"c":{"e":4},"e":0,"t":15},"t":{"e":32,"h":12,"i":{"s":3,"z":{"a":18}}}},41],"b":[{"a":{"t":129},"i":{"l":19,"n":{"g":83},"v":0}},43],"c":56,"e":{".":18,"d":[{".":18,"i":{"a":32,"e":3,"c":[{"i":{"n":152}},84],"o":{"c":239}},"y":108},25],"g":[{"r":{"a":{"n":240}}},9],"l":{"o":{"n":5},"t":0},"m":[{"o":130},9],"n":[{"a":[{"c":5},0],"d":{"e":0},"e":18,"i":0,"s":[{"u":7},17],"t":[{"e":0},27],".":24},41],"o":{"n":4},"r":{"s":{"a":19}},"s":[{"t":{"i":27}},25],"t":{"a":[{"l":11},1],"e":2,"h":{"i":4},"r":[{"i":{"c":32,"e":4},"y":3},21]},"v":1},"f":43,"h":25,"i":{".":32,"a":3,"d":{"a":[{"b":241},0],"g":0},"g":0,"l":{"i":{"a":27,"e":108,"t":{"a":27}},"l":[{"a":{"g":208},"i":{"l":{"i":59}}},21]},"n":{"a":0,"d":27,"e":{"e":19},"g":{"l":[{"i":5,"y":19},21]},"t":0,"u":[{"t":{"e":{"r":242,"s":{"t":242}}}},21],"i":{"s":{".":174}}},"o":{"t":17},"s":[{"e":{"r":{".":0}},"l":5,"t":{"i":0,"r":{"y":19}}},24],"t":{"h":18},"z":24},"k":18,"l":43,"m":[{"a":{"r":{"y":5},"b":243}},29],"n":[{"a":1,"i":{"n":21},"o":1},43],"o":[{"c":{"r":[{"a":{"t":[{"i":{"z":32}},245]}},18]},"d":131,"g":{"o":1},"i":{"s":[{"e":5},84]},"k":18,"l":{"e":{"s":{"t":4},"c":246}},"m":{"e":3},"n":{"e":{"t":5,"y":{"l":247}},"g":{"e":5},"i":{"a":12,"s":{"m":0,"t":0},"z":3},"o":{"l":36,"c":{"h":12},"e":{"n":171},"s":249},"y":{".":3}},"r":[{"a":{".":18},"o":{"n":{"i":{"s":248}}}},9],"s":[{"e":{"y":4},"p":3},8],"t":{"h":[{"e":{"t":250}},12]},"u":{"f":19,"s":[{"i":{"n":98}},27]},"v":9,"e":{"l":{"a":{"s":167}}}},41],"p":[{"a":{"r":{"a":[{"b":5},7],"i":6}},"e":{"t":23},"h":{"a":{"s":36}},"i":[{"a":0,"e":{"s":4},"n":34,"r":19,"s":4},24],"o":{"r":{"i":11},"s":{"i":{"t":{"e":6}}},"u":{"s":21},"v":6},"t":{"r":1},"y":24},43],"r":47,"s":[{"h":[{"a":{"c":{"k":251}}},21],"i":19},101],"t":18,"u":[{"l":{"a":{"r":49},"t":[{"i":[{"u":252},54]},32]},"m":27,"n":8,"p":18,"u":1,"d":{"r":{"o":9}}},41],"w":18},"n":{"a":[{"b":[{"u":21},81],"c":{".":18,"a":1,"t":19},"g":{"e":{"r":{".":5}}},"k":0,"l":{"i":[{"a":4},1],"t":18},"m":{"i":{"t":4}},"n":[{"c":{"i":36},"i":{"t":0},"k":17},24],"r":{"c":[{"h":{"s":{".":73}}},11],"e":18,"i":11,"l":0,"m":19},"s":[{"c":0,"t":{"i":5}},21],"t":[{"a":{"l":3},"o":{"m":{"i":{"z":6}}}},24],"u":[{"s":{"e":11},"t":27},24],"v":{"e":0}},41],"b":80,"c":{"a":{"r":6},"e":{"s":{".":21}},"h":{"a":23,"e":{"o":19,"s":{"t":253}},"i":{"l":19,"s":23}},"i":{"n":2,"t":1},"o":{"u":{"r":{"a":7}}},"r":29,"u":29},"d":{"a":{"i":21,"n":19},"e":[{"s":{"t":{".":4}}},29],"i":{"b":0,"f":79,"t":29,"z":23,"e":{"c":{"k":29}}},"u":{"c":19,"r":0},"w":{"e":9},"t":{"h":{"r":3}}},"e":{".":25,"a":{"r":23},"b":[{"u":11,"a":{"c":{"k":3}}},9],"c":[{"k":32},9],"d":25,"g":{"a":{"t":[{"i":{"v":5}},1]},"e":32},"l":{"a":1,"i":{"z":5}},"m":{"i":4,"o":1},"n":[{"e":18},41],"o":27,"p":{"o":1},"q":9,"r":[{"a":{"b":6,"r":21},"e":24,"i":132,"r":0},29],"s":[{".":25,"p":18,"t":25,"w":18,"k":{"i":119}},41],"t":{"i":{"c":27}},"v":[{"e":19},1],"w":1},"f":[{"i":{"n":{"i":{"t":{"e":{"s":226}}}}}},23],"g":{"a":{"b":21},"e":{"l":23,"n":{"e":[{"s":5},133]},"r":{"e":19,"i":23}},"h":{"a":4,"o":2},"i":{"b":23,"n":2,"t":19},"l":{"a":21},"o":{"v":17},"s":{"h":4,"p":{"r":2}},"u":[{"m":21},29],"y":24},"h":[{"a":[{"b":12},0],"e":0},80],"i":{"a":[{"n":[{".":114},3],"p":1},68],"b":{"a":3,"l":1},"d":[{"i":4},1],"e":{"r":1},"f":{"i":[{"c":{"a":{"t":4}}},9]},"g":{"r":19},"k":0,"m":[{"i":{"z":3}},29],"n":[{"e":{".":32},"g":0},29],"o":1,"s":{".":32,"t":{"a":0}},"t":[{"h":21,"i":{"o":27},"o":{"r":23},"r":3},24]},"j":29,"k":[{"e":{"r":{"o":19},"t":23},"i":{"n":3},"l":29,"r":{"u":{"p":3}}},44],"l":[{"e":{"s":{"s":19}}},43],"m":[{"e":[{"t":17},0]},19],"n":[{"e":0,"i":{"a":{"l":11},"v":0}},101],"o":{"b":{"l":[{"e":3},0]},"c":{"l":19,"e":{"r":{"o":{"s":254}}}},"d":66,"e":27,"g":[{"e":17},18],"i":{"s":{"i":6}},"l":{"i":134,"o":{"g":{"i":{"s":32}}}},"m":{"i":{"c":27,"z":108,"s":{"t":82}},"o":1,"y":3,"a":{"l":214},"e":{"n":{"o":194}}},"n":[{"a":{"g":0},"i":[{"z":19,"s":{"o":255}},5],"e":{"q":15}},1],"p":[{"o":{"l":{"i":135,"y":{".":256}}}},18],"r":{"a":{"b":5,"r":{"y":1}}},"s":{"c":18,"e":0,"t":5},"t":{"a":4},"u":[{"n":27},41],"v":{"e":{"l":136,"m":{"b":2}}},"w":{"l":12}},"p":[{"i":0,"r":{"e":{"c":17}}},72],"q":29,"r":[{"u":0},29],"s":[{"a":{"b":4,"t":{"i":36}},"c":[{"e":{"i":{"v":4}}},1],"e":[{"s":83},24],"i":{"d":137,"g":17},"l":24,"m":[{"o":{"o":1}},3],"o":{"c":21},"p":{"e":1,"i":19},"t":{"a":{"b":{"l":6}}}},81],"t":[{"a":{"b":0},"e":{"r":{"s":12}},"i":[{"b":19,"e":{"r":0},"f":8,"n":{"e":23,"g":83},"p":0},9],"r":{"o":{"l":{"l":{"i":7}}},"e":{"p":137}},"s":1,"u":{"m":{"e":11}}},29],"u":{"a":2,"d":1,"e":{"n":4},"f":{"f":{"e":0}},"i":{"n":23,"t":50},"m":[{"e":2,"i":19},21],"n":138,"o":23,"t":{"r":3}},"v":74,"w":72,"y":{"m":0,"p":0},"z":[{"a":23},18]},"o":{"a":[{"d":11,"l":{"e":{"s":108}},"r":{"d":12},"s":{"e":0,"t":{"e":6}},"t":{"i":5}},18],"b":{"a":{"b":35,"r":19},"e":{"l":0},"i":[{"n":[{"g":4},24]},29],"r":23,"u":{"l":3},"l":{"i":{"g":189}}},"c":{"e":29,"h":[{"e":{"t":23},"a":{"s":23}},0],"i":{"f":12,"l":21},"l":{"a":{"m":21}},"o":{"d":21},"r":{"a":{"c":3,"t":{"i":{"z":4}}},"e":12,"i":{"t":32}},"t":{"o":{"r":{"a":7}}},"u":{"l":{"a":3},"r":{"e":19}}},"d":{"d":{"e":{"d":4}},"i":{"c":3,"o":11,"t":{"i":{"c":137}}},"o":[{"r":12},139],"u":{"c":{"t":{".":4,"s":4}}},"e":{"l":{"l":{"i":12}}}},"e":{"l":21,"n":{"g":19},"r":[{"s":{"t":257}},23],"t":{"a":1},"v":23},"f":{"i":[{"t":{"e":4,"t":17}},24]},"g":{"a":{"r":121,"t":{"i":{"v":4},"o":21}},"e":[{"n":{"e":19},"o":19,"r":21},29],"i":{"e":23,"s":140,"t":3},"l":[{"y":79},21],"n":{"i":{"z":27}},"r":{"o":21},"u":{"i":5},"y":[{"n":25},41]},"h":[{"a":{"b":6}},74],"i":[{"c":{"e":{"s":11}},"d":{"e":{"r":3}},"f":{"f":17},"g":0,"l":{"e":{"t":4}},"n":{"g":23,"t":{"e":{"r":6}}},"s":{"m":19,"o":{"n":4},"t":{"e":{"n":6}}},"t":{"e":{"r":3}}},9],"j":19,"k":[{"e":{"n":23,"s":{"t":15}},"i":{"e":4}},25],"l":{"a":[{"n":21,"s":{"s":36}},29],"d":[{"e":15},9],"e":{"r":3,"s":{"c":23,"t":{"e":{"r":88}}},"t":23},"f":{"i":1},"i":[{"a":23,"c":{"e":23},"d":{".":4},"f":73,"l":19,"n":{"g":3},"o":19,"s":{".":19,"h":3},"t":{"e":19,"i":{"o":19}},"v":19,"g":{"o":{"p":{"o":258}}}},9],"l":{"i":{"e":17}},"o":{"g":{"i":{"z":4}},"r":0,"n":{"o":{"m":259}}},"p":{"l":4},"t":9,"u":{"b":3,"m":{"e":3},"n":3,"s":19},"v":9,"y":24},"m":{"a":{"h":4,"l":5,"t":{"i":{"z":4}}},"b":{"e":9,"l":1},"e":[{"n":{"a":3},"r":{"s":{"e":4}},"t":[{"r":{"y":4}},21],"c":{"h":{"a":260}}},24],"i":{"a":23,"c":{".":3,"a":3},"d":19,"n":[{"i":19},2]},"m":{"e":{"n":{"d":32}}},"o":{"g":{"e":0},"n":21},"p":{"i":3,"r":{"o":7}}},"n":[{"a":[{"c":1,"n":23},2],"c":[{"i":{"l":27}},2],"d":[{"o":4},25],"e":{"n":23,"s":{"t":4}},"g":{"u":1},"i":{"c":2,"o":23,"s":2,"u":19},"k":{"e":{"y":3}},"o":{"d":{"i":1},"m":{"y":3,"i":{"c":137}},"r":{"m":{"a":23}},"t":{"o":{"n":261}},"u":23},"s":[{"p":{"i":[{"r":{"a":10}},36]},"u":17},3],"t":{"e":{"n":36},"i":[{"f":7},93]},"u":{"m":4},"v":{"a":6}},24],"o":[{"d":{"e":5,"i":5},"k":1,"p":{"i":11},"r":{"d":23},"s":{"t":6}},9],"p":{"a":24,"e":{"d":5,"r":[{"a":[{"g":18},27]},2]},"h":[{"a":{"n":19},"e":{"r":19}},25],"i":{"n":{"g":3},"t":23,"s":{"m":{".":2}}},"o":{"n":19,"s":{"i":21}},"r":29,"u":2,"y":5},"q":29,"r":{"a":[{".":19,"g":83,"l":{"i":{"z":4}},"n":{"g":{"e":4}}},29],"e":{"a":[{"l":19},5],"i":3,"s":{"h":5,"t":{".":4}},"w":17},"g":{"u":1},"i":{"a":56,"c":{"a":3},"l":19,"n":2,"o":29,"t":{"y":3},"u":23},"m":{"i":9},"n":{"e":8},"o":{"f":19,"u":{"g":3}},"p":{"e":4},"r":{"h":27},"s":{"e":[{"n":5},1],"t":17},"t":{"h":{"i":3,"y":3,"o":{"n":{"i":{"t":262}}},"r":{"i":137}},"y":1,"i":{"v":{"e":{"l":{"y":4}}}}},"u":{"m":19},"y":29},"s":{"a":{"l":3},"c":[{"e":1,"o":{"p":[{"i":18},23]},"r":19},9],"i":{"e":95,"t":{"i":{"v":4},"o":3,"y":3},"u":0},"l":1,"o":24,"p":{"a":1,"o":1,"h":{"e":{"r":83}}},"t":{"a":[{"t":{"i":19}},9],"i":{"l":4,"t":4}}},"t":{"a":{"n":21},"e":{"l":{"e":{"g":36}},"r":{".":3,"s":4},"s":[{"t":{"e":{"r":263},"o":{"r":264}}},21]},"h":[{"e":{"s":{"i":5},"o":{"s":265}},"i":14},18],"i":{"c":{".":3,"a":4,"e":23},"f":23,"s":23},"o":{"s":5}},"u":[{"b":{"l":3,"a":{"d":{"o":116}}},"c":{"h":{"i":6}},"e":{"t":4},"l":1,"n":{"c":{"e":{"r":6}},"d":8},"v":4},9],"v":{"e":{"n":1,"r":{"n":{"e":17},"s":12,"t":1}},"i":{"s":23,"t":{"i":36},"a":{"n":{".":266}}},"o":{"l":60}},"w":{"d":{"e":{"r":3}},"e":{"l":3,"s":{"t":4}},"i":2,"n":{"i":5},"o":21},"y":{"a":2},"x":{"i":{"d":{"i":{"c":267}}}}},"p":{"a":[{"c":{"a":1,"e":1,"t":0},"d":21,"g":{"a":{"n":32,"t":23}},"i":[{"n":17},21],"l":[{"m":{"a":{"t":268}}},21],"n":{"a":0,"e":{"l":11},"t":{"y":0},"y":3},"p":[{"u":1},2],"r":{"a":{"b":{"l":6},"g":{"e":5,"r":{"a":269}},"l":{"e":228},"m":[{"e":12},36]},"d":{"i":5},"e":[{"l":5},27],"i":[{"s":0},28]},"t":{"e":[{"r":4},9],"h":{"i":{"c":32},"y":4},"r":{"i":{"c":1}}},"v":0,"y":27},41],"b":43,"d":1,"e":{".":18,"a":[{"r":{"l":17}},138],"c":9,"d":[{"e":27,"i":[{"a":36,"c":0},27]},37],"e":[{"d":0,"v":208},21],"k":0,"l":{"a":1,"i":{"e":17}},"n":{"a":{"n":1},"c":21,"t":{"h":0}},"o":{"n":4},"r":{"a":{".":21,"b":{"l":6},"g":21},"i":[{"s":{"t":6}},21],"m":{"a":{"l":0},"e":7},"n":21,"o":11,"t":{"i":11},"u":4,"v":15},"t":[{"e":{"n":4},"i":{"z":4}},9]},"f":18,"g":18,"h":{".":18,"a":{"r":{"i":6}},"e":{"n":{"o":11},"r":1,"s":{".":1}},"i":{"c":2,"e":32,"n":{"g":4},"s":{"t":{"i":32}},"z":27,"l":{"a":{"n":{"t":168},"t":{"e":{"l":270}}}}},"l":9,"o":{"b":27,"n":{"e":27,"i":32},"r":0},"s":18,"t":3,"u":32,"y":41},"i":{"a":[{"n":17},3],"c":{"i":{"e":1},"y":1,"a":{"d":271}},"d":[{"a":19,"e":3,"i":32},21],"e":{"c":27,"n":3},"g":{"r":{"a":{"p":1}}},"l":{"o":3},"n":[{".":21,"d":17,"o":21},9],"o":[{"n":17},141],"t":{"h":[{"a":4},23],"u":9}},"k":142,"l":[{"a":{"n":27,"s":{"t":6}},"i":{"a":11,"e":{"r":5},"g":18,"n":[{"a":{"r":5}},0],"c":{"a":{"b":208}}},"o":{"i":17},"u":{"m":[{"b":17},0]}},143],"m":43,"n":48,"o":{"c":1,"d":{".":32},"e":{"m":4,"t":144},"g":145,"i":{"n":[{"t":32,"c":{"a":12}},84]},"l":{"y":{"t":6,"e":137,"p":{"h":{"o":{"n":{"o":272}}}}},"e":{".":41}},"n":{"i":1},"p":1,"r":[{"y":1},124],"s":[{"s":15},41],"t":[{"a":1},21],"u":{"n":32}},"p":[{"a":{"r":{"a":5}},"e":[{"d":21,"l":19,"n":23,"r":23,"t":23},24],"o":{"s":{"i":{"t":{"e":5}}}}},43],"r":[{"a":{"y":{"e":17}},"e":{"c":{"i":32,"o":5},"e":{"m":11},"f":{"a":{"c":6}},"l":{"a":0},"r":11,"s":{"e":23,"s":27,"p":{"l":{"i":84}}},"t":{"e":{"n":5}},"v":11,"m":{"a":{"c":273}},"n":{"e":{"u":15}}},"i":{"e":53,"n":{"t":146},"s":[{"o":12},0]},"o":{"c":{"a":23,"e":{"s":{"s":8}},"i":{"t":{"y":{".":274}}}},"f":{"i":{"t":6}},"l":11,"s":{"e":12},"t":15,"g":{"e":208}}},9],"s":[{"e":[{"u":{"d":[{"o":{"d":276,"f":276}},275]}},24],"h":1,"i":{"b":21}},81],"t":[{"a":{"b":134},"e":24,"h":24,"i":{"m":11},"u":{"r":0},"w":21,"o":{"m":{"a":{"t":277}}},"r":{"o":{"l":278}}},42],"u":{"b":[{"e":{"s":{"c":181}}},11],"e":0,"f":0,"l":{"c":11},"m":1,"n":9,"r":{"r":0},"s":32,"t":[{"e":[{"r":11},32],"r":3,"t":{"e":{"d":0},"i":{"n":0}}},9]},"w":23},"q":{"u":[{"a":{"v":5,"i":{"n":{"t":{"e":279}}},"s":{"i":[{"r":281,"s":281},280]}},"e":{".":25,"r":27,"t":27},"i":{"n":{"t":{"e":{"s":{"s":282}}}},"v":{"a":{"r":14}}}},9]},"r":{"a":{"b":[{"i":3,"o":{"l":{"i":{"c":29},"o":{"i":236}}}},25],"c":{"h":{"e":17,"u":3},"l":19},"f":{"f":{"i":5},"t":0},"i":24,"l":{"o":1},"m":{"e":{"t":[{"r":{"i":{"z":283}}},11],"n":24},"i":24,"o":{"u":3}},"n":{"e":{"o":6},"g":{"e":0},"i":21,"o":4,"h":{"a":{"s":167}}},"p":{"e":{"r":11},"h":{"y":27}},"r":{"c":5,"e":[{"f":5},17],"i":{"l":18}},"s":24,"t":{"i":{"o":{"n":115}}},"u":{"t":0},"v":{"a":{"i":4},"e":{"l":11}},"z":{"i":{"e":4}},"d":{"i":{"g":127,"o":{"g":249}}},"o":{"r":2}},"b":[{"a":{"b":21,"g":21},"i":[{"f":0,"n":[{"e":19,"g":{".":4,"e":284}},24]},8],"o":1},29],"c":[{"e":[{"n":17},24],"h":{"a":23,"e":{"r":0}},"i":{"b":90,"t":1},"u":{"m":12}},29],"d":{"a":{"l":21},"i":[{"a":0,"e":{"r":0},"n":[{"g":3},17]},9]},"e":{".":25,"a":{"l":2,"n":3,"r":{"r":4},"v":32,"w":1},"b":{"r":{"a":{"t":19}}},"c":{"o":{"l":{"l":5},"m":{"p":{"e":5}}},"r":{"e":1},"i":{"p":{"r":285}},"t":{"a":{"n":{"g":286}}}},"d":[{"e":2,"i":{"s":3,"t":5}},37],"f":{"a":{"c":1},"e":[{"r":{".":4}},9],"i":3,"y":1},"g":{"i":{"s":11}},"i":{"t":4},"l":{"i":2,"u":4},"n":{"t":{"a":90,"e":0}},"o":2,"p":{"i":{"n":4},"o":{"s":{"i":1}},"u":2},"r":[{"i":21,"o":17,"u":4},147],"s":{".":21,"p":{"i":1},"s":{"i":{"b":6}},"t":[{"a":{"l":4},"r":3},8]},"t":{"e":{"r":1},"i":{"z":96},"r":{"i":[{"b":{"u":85}},3]}},"u":[{"t":{"i":4}},8],"v":[{"a":{"l":1},"e":{"l":11,"r":{".":30,"s":4,"t":4}},"i":{"l":4},"o":{"l":{"u":5}}},8],"w":{"h":1}},"f":[{"u":0,"y":21},29],"g":[{"e":{"r":3,"t":23},"i":{"c":23,"n":[{"g":3},0],"s":19,"t":19},"l":29,"o":{"n":0},"u":23},9],"h":[{".":18,"a":{"l":18}},1],"i":{"a":[{"b":0,"g":1,"l":{".":23}},3],"b":[{"a":11},21],"c":{"a":{"s":5},"e":21,"i":[{"d":32,"e":1},18],"o":21},"d":{"e":{"r":5}},"e":{"n":{"c":3,"t":3},"r":2,"t":4},"g":{"a":{"n":5},"i":32},"l":{"i":{"z":11}},"m":{"a":{"n":32},"i":5,"o":27,"p":{"e":0}},"n":{"a":[{".":32},24],"d":0,"e":0,"g":0},"o":2,"p":{"h":[{"e":6},32],"l":[{"i":{"c":5}},9]},"q":21,"s":[{".":21,"c":0,"h":23,"p":0},24],"t":{"a":{"b":116},"e":{"d":{".":19},"r":{".":5,"s":5}},"i":{"c":11},"u":[{"r":5},9]},"v":{"e":{"l":5,"t":11},"i":11,"o":{"l":287}}},"j":23,"k":{"e":{"t":23},"l":{"e":1,"i":{"n":1}},".":288,"h":{"o":2},"r":{"a":{"u":29}},"s":{".":288}},"l":[{"e":[{"d":24,"q":{"u":30}},0],"i":{"g":21,"s":[{"h":4},21]},"o":73},29],"m":[{"a":{"c":5},"e":[{"n":23,"r":{"s":4}},24],"i":{"n":{"g":[{".":21},3]},"o":21,"t":23},"y":21},29],"n":{"a":{"r":21},"e":{"l":23,"r":21,"t":19,"y":23},"i":{"c":19,"s":92,"t":23,"v":23},"o":[{"u":21},0],"u":23},"o":{"b":{"l":11,"o":{"t":289}},"c":[{"r":3},24],"e":[{"l":{"a":{"s":167}},"p":{"i":{"d":{"e":290}}}},1],"f":{"e":2,"i":{"l":4}},"k":[{"e":{"r":4}},8],"l":{"e":{".":32}},"m":{"e":{"t":{"e":5},"s":{"h":3}},"i":0,"p":0},"n":{"a":{"l":0},"e":0,"i":{"s":134},"t":{"a":0}},"o":{"m":41,"t":32},"p":{"e":{"l":3},"i":{"c":11}},"r":{"i":11,"o":4},"s":{"p":{"e":{"r":5}},"s":0},"t":{"h":{"e":1},"y":1,"r":{"o":{"n":2}}},"v":{"a":1,"e":{"l":5}},"x":5},"p":[{"e":{"a":21,"n":{"t":19},"r":{".":4},"t":23},"h":95,"i":{"n":{"g":3}},"o":23,"a":{"u":{"l":{"i":291}}}},29],"r":[{"e":{"c":0,"f":0,"o":21,"s":{"t":0}},"i":{"o":0,"v":0},"o":{"n":17,"s":17},"y":{"s":17}},72],"s":[{"a":[{"t":{"i":5}},29],"c":1,"e":[{"c":[{"r":0},23],"r":{".":4,"a":{"d":{"i":238}}},"s":3,"v":148},24],"h":[{"a":19},29],"i":[{"b":90},29],"o":{"n":12},"p":29,"w":19},44],"t":{"a":{"c":{"h":36},"g":21},"e":{"b":23,"n":{"d":17},"o":5},"i":[{"b":4,"d":0,"e":{"r":21},"g":23,"l":{"i":12,"l":17,"y":21},"s":{"t":21},"v":21},29],"r":{"i":23,"o":{"p":{"h":115}},"e":{"u":29}},"s":{"h":1},"h":{"o":{"u":29}}},"u":{"a":3,"e":{"l":93,"n":3},"g":{"l":1},"i":{"n":3},"m":{"p":{"l":11}},"n":[{"k":6,"t":{"y":0}},9],"s":{"c":19},"t":{"i":{"n":6}}},"v":{"e":[{"l":{"i":17},"n":23,"r":{".":4},"s":{"t":19},"y":23,"i":{"l":29}},1],"i":{"c":23,"v":0},"o":23},"w":29,"y":{"c":1,"n":{"g":{"e":32}},"t":3},"z":{"s":{"c":2}}},"s":{"a":[{"b":42,"c":{"k":32,"r":{"i":11},"t":23},"i":32,"l":{"a":{"r":36},"m":0,"o":4,"t":0,"e":{"s":{"c":54,"w":7}}},"n":{"c":27,"d":{"e":0}},"p":[{"a":{"r":{"i":{"l":292}}}},29],"t":{"a":4,"i":{"o":76},"u":11},"u":0,"v":{"o":{"r":4}},"w":32},9],"b":56,"c":{"a":{"n":{"t":149},"p":[{"e":{"r":267}},0],"v":6,"t":{"o":{"l":208}}},"e":{"d":21,"i":18,"s":21},"h":[{"o":21,"i":{"t":{"z":21}},"r":{"o":{"d":{"i":{"n":{"g":293}}}}}},8],"i":{"e":68,"n":{"d":150},"u":{"t":{"t":294}}},"l":{"e":6,"i":21},"o":{"f":17,"p":{"y":18},"u":{"r":{"a":7}}},"u":29,"r":{"a":{"p":{"e":{"r":{".":36}}}}},"y":{"t":{"h":247}}},"d":56,"e":{".":18,"a":[{"s":17,"w":5},1],"c":{"o":151,"t":27},"d":[{"e":95,"l":19},125],"g":[{"r":11},9],"i":32,"l":{"e":2,"f":32,"v":32},"m":{"e":[{"s":{"t":295}},18],"o":{"l":1},"a":{"p":{"h":287}},"i":{"t":{"i":{"c":296}}}},"n":{"a":{"t":5},"c":18,"d":0,"e":{"d":19},"g":5,"i":{"n":19},"t":{"d":18,"l":18}},"p":{"a":152,"t":{"e":{"m":{"b":11}}}},"r":{".":43,"l":21,"o":0,"v":{"o":18}},"s":[{"h":4,"t":5},72],"u":{"m":113},"v":[{"e":{"n":11}},32],"w":{"i":0},"x":32},"f":47,"g":48,"h":[{".":25,"e":{"r":2,"v":32},"i":{"n":2,"o":3,"p":27,"v":6},"o":[{"l":{"d":4},"n":12,"r":[{"t":7},17],"e":{"s":{"t":137}}},0],"w":18},24],"i":{"b":2,"c":{"c":19},"d":{"e":{".":27,"s":[{"t":6,"w":6},32],"d":{".":8}},"i":[{"z":4},32]},"g":{"n":{"a":18}},"l":{"e":0,"y":18},"n":[{"a":24,"e":{".":32},"g":23},42],"o":[{"n":[{"a":6},32]},41],"r":[{"a":5,"e":{"s":{"i":{"d":4}}}},9],"s":41,"t":{"i":{"o":27}},"u":32,"v":41,"z":32},"k":[{"e":[{"t":23},18],"i":{"n":{"e":4,"g":4}},"y":{"s":{"c":15}}},9],"l":[{"a":{"t":23},"e":24,"i":{"t":{"h":7}},"o":{"v":{"a":{"k":{"i":{"a":297}}}}}},74],"m":[{"a":[{"l":{"l":54},"n":12},23],"e":{"l":17,"n":19},"i":{"t":{"h":32}},"o":{"l":{"d":49}}},42],"n":72,"o":[{"c":{"e":1},"f":{"t":12},"l":{"a":{"b":1},"d":153,"i":{"c":3},"v":32,"u":{"t":{"e":9}}},"m":27,"n":{".":68,"a":17,"g":0},"p":[{"h":{"i":{"c":32,"z":19},"y":19}},21],"r":{"c":5,"d":5},"v":[{"i":4},18],"g":{"a":{"m":{"y":298}}}},41],"p":{"a":[{"i":32,"n":0,"c":{"e":299,"i":{"n":69}}},25],"e":{"n":{"d":17},"o":57,"r":25,"c":{"i":{"o":11}}},"h":{"e":[{"r":[{"o":213},27]},24],"o":6},"i":{"l":17,"n":{"g":4},"o":18,"c":{"i":{"l":208}}},"l":{"y":21},"o":{"n":21,"r":[{"t":{"s":{"c":300,"w":300}}},17],"t":18,"k":{"e":{"s":{"w":10}}}}},"q":{"u":{"a":{"l":{"l":36}},"i":{"t":{"o":88}}}},"r":29,"s":[{"a":[{"s":12,"c":{"h":{"u":301}}},29],"c":94,"e":{"l":23,"n":{"g":19},"s":{".":21},"t":19},"i":[{"e":[{"r":0},21],"l":{"y":4},"a":{"n":{".":210}},"g":{"n":{"a":{"b":302}}}},29],"l":[{"i":1},21],"n":21,"p":{"e":{"n":{"d":115}}},"t":9,"u":{"r":{"a":6}},"w":4,"h":{"a":{"t":3}}},25],"t":{".":25,"a":{"g":24,"l":24,"m":{"i":17,"p":69},"n":{"d":32,"t":{"s":{"h":{"i":303}}}},"p":90,"t":{".":32,"i":15},"r":{"t":{"l":{"i":12}}}},"e":{"d":21,"r":{"n":{"i":7},"o":19},"w":[{"a":6},8]},"h":{"e":23},"i":[{".":21,"a":19,"c":[{"k":32},29],"e":21,"f":23,"n":{"g":3},"r":32},9],"l":{"e":29},"o":{"c":{"k":32},"m":{"a":12},"n":{"e":32},"p":21,"r":{"e":27,"a":{"b":304}}},"r":[{"a":{"d":21,"t":{"u":32,"a":{"g":305}},"y":21},"i":{"d":21,"b":{"u":{"t":7}}},"y":18},1],"w":61,"y":[{"l":{"i":{"s":137}}},24],"b":4,"s":{"c":{"r":4}},"u":{"p":{"i":{"d":306}}}},"u":[{"a":{"l":2},"b":111,"g":151,"i":{"s":4,"t":12},"l":21,"m":[{"i":11},9],"n":9,"r":9,"p":{"e":{"r":{"e":307}}}},41],"v":18,"w":[{"o":18,"i":{"m":{"m":177}}},9],"y":[{"c":18,"l":27,"n":{"o":5,"c":41},"r":{"i":{"n":4}},"t":{"h":{"i":308}}},21]},"t":{"a":[{".":27,"b":[{"l":{"e":{"s":4}},"o":{"l":{"i":{"z":32,"s":{"m":309}}}}},25],"c":{"i":18},"d":{"o":4},"f":46,"i":{"l":{"o":5}},"l":[{"a":4,"e":{"n":5},"i":11,"k":[{"a":204},18],"l":{"i":{"s":0}},"o":{"g":4}},9],"m":{"o":4,"i":{"n":82}},"n":{"d":{"e":0},"t":{"a":54}},"p":{"e":{"r":4},"l":4,"a":{"t":{"h":310}}},"r":{"a":0,"c":18,"e":18,"i":{"z":3},"r":{"h":311}},"s":{"e":0,"y":4},"t":{"i":{"c":18},"u":{"r":1}},"u":{"n":17},"v":0,"w":25,"x":{"i":{"s":0}},"g":{"o":{"n":{".":3}}}},41],"b":42,"c":[{"h":[{"e":{"t":5},"c":15,"i":{"e":{"r":237}}},21],"r":29},18],"d":43,"e":{".":18,"a":{"d":{"i":17},"t":18,"c":{"h":{"e":{"r":{".":36}}}}},"c":{"e":17,"t":32},"d":[{"i":4},42],"e":41,"g":[{"e":{"r":4},"i":4},0],"l":{".":27,"i":17,"s":32,"e":{"g":84,"r":{"o":249}}},"m":{"a":[{"t":11},154]},"n":{"a":{"n":27},"c":27,"d":27,"e":{"s":18},"t":[{"a":{"g":0}},41]},"o":41,"p":[{"e":4},1],"r":{"c":11,"d":155,"i":[{"e":{"s":5},"s":11,"z":{"a":6},"c":{".":8}},41],"n":{"i":{"t":32}},"v":5,"g":{"e":{"i":312}}},"s":{".":18,"s":[{".":23,"e":{"s":313}},18]},"t":{"h":{"e":6}},"u":27,"x":27,"y":18},"f":42,"g":43,"h":{".":25,"a":{"n":17,"l":{"a":{"m":228}}},"e":[{"a":[{"s":3,"t":5},18],"i":{"s":11},"t":27},9],"i":{"c":{".":4,"a":4},"l":18,"n":{"k":32}},"l":18,"o":{"d":{"e":4,"i":{"c":32},"o":{"n":11}},"o":18,"r":{"i":{"t":6,"z":5}},"g":{"e":{"n":{"i":314}}},"k":{"e":{"r":175}}},"s":25,"y":{"l":{"a":{"n":228}},"s":{"c":11}}},"i":{"a":[{"b":1,"t":{"o":1},"n":{".":70}},41],"b":156,"c":{"k":18,"o":21,"u":157},"d":{"i":32},"e":{"n":27},"f":[{"y":4},8],"g":[{"u":32},25],"l":{"l":{"i":{"n":6}}},"m":[{"p":18,"u":{"l":5}},41],"n":[{"a":24,"e":{".":27},"i":27,"o":{"m":285}},42],"o":[{"c":4,"n":{"e":{"e":6}}},41],"q":32,"s":{"a":3,"e":27,"m":0,"o":4,"p":0,"t":{"i":{"c":{"a":32}}}},"t":{"l":3},"u":1,"v":[{"a":0},41],"z":[{"a":3,"e":{"n":3}},41]},"l":[{"a":[{"n":17},19],"e":{".":27,"d":27,"s":{".":27},"t":{".":19}},"o":19,"i":{"e":{"r":315}}},25],"m":[{"e":0},43],"n":81,"o":[{"b":3,"c":{"r":{"a":{"t":4}}},"d":{"o":18},"f":25,"g":{"r":9},"i":{"c":4},"m":{"a":9,"b":0,"y":3},"n":{"a":{"l":{"i":0},"t":3},"o":18,"y":18},"r":{"a":9,"i":{"e":3,"z":5}},"s":8,"u":{"r":32,"t":18},"w":{"a":{"r":3}},"l":{"o":{"g":{"y":84}}},"t":{"i":{"c":11}}},41],"p":43,"r":{"a":[{"b":11,"c":{"h":5,"i":[{"t":17},36],"t":{"e":17}},"s":17,"v":{"e":{"n":5,"s":158,"r":{"s":[{"a":{"b":317}},15]}}},"i":{"t":{"o":{"r":316}}}},41],"e":{"f":5,"m":[{"i":6},0],"a":{"c":{"h":{"e":318}}}},"i":{"a":[{"l":{".":1}},32],"c":{"e":{"s":5},"i":{"a":32},"s":18},"m":25,"v":0},"o":{"m":{"i":5},"n":{"i":6,"y":18},"p":{"h":{"e":5},"i":{"s":175},"o":{"l":{"e":{"s":320},"i":{"s":320,"t":321}}}},"s":{"p":11},"v":11,"l":{"e":{"u":{"m":319}}},"f":{"i":{"c":{".":17},"t":11}}},"u":{"i":5,"s":17}},"s":[{"c":[{"h":{"i":{"e":12}}},21],"h":0,"w":21},101],"t":[{"e":{"s":21},"o":19,"u":0,"r":{"i":{"b":{"u":{"t":322}}}}},66],"u":[{"a":[{"r":3},2],"b":{"i":1},"d":8,"e":18,"f":46,"i":76,"m":27,"n":{"i":{"s":1}},"p":{".":48},"r":{"e":27,"i":[{"s":11},32],"o":5,"y":4,"n":{"a":{"r":12}}},"s":27},41],"v":18,"w":[{"a":43,"i":{"s":17},"o":18,"h":29},1],"y":[{"a":18,"l":25,"p":{"e":12,"h":4,"a":{"l":64}}},41],"z":[{"e":1},18]},"u":{"a":{"b":18,"c":0,"n":{"a":4,"i":0},"r":{"a":{"n":{"t":5}},"d":8,"i":11,"t":11},"t":29,"v":0,"d":{"r":{"a":{"t":{"i":3,"u":15}}}}},"b":{"e":[{"l":21,"r":[{"o":21},23]},1],"i":[{"n":{"g":33}},72],"l":{"e":{".":23}}},"c":{"a":23,"i":{"b":0,"t":1},"l":{"e":12},"r":23,"u":23,"y":21},"d":{"d":4,"e":{"r":3,"s":{"t":4},"v":17},"i":{"c":29,"e":{"d":3,"s":3},"s":4,"t":19},"o":{"n":[{"y":232},21]},"s":{"i":1},"u":21},"e":{"n":{"e":21,"s":17,"t":{"e":0}},"r":{"i":{"l":0}},"a":{"m":15}},"f":{"a":27,"l":23},"g":{"h":{"e":{"n":11}},"i":{"n":4}},"i":[{"l":{"i":{"z":5}},"n":[{"g":29},1],"r":{"m":0},"t":{"a":17},"v":[{"e":{"r":{".":0}}},11]},156],"j":19,"k":18,"l":{"a":[{"b":5,"t":{"i":19}},29],"c":{"h":[{"e":32},17]},"d":{"e":{"r":3}},"e":[{"n":29},1],"g":{"i":1},"i":[{"a":19,"n":{"g":3},"s":{"h":4}},9],"l":{"a":{"r":1},"i":{"b":96,"s":1}},"m":61,"o":72,"s":[{"e":{"s":5}},18],"t":{"i":2,"r":{"a":54},"u":18},"u":[{"l":4},23],"v":4},"m":{"a":{"b":4},"b":{"i":1,"l":{"y":1}},"i":[{"n":{"g":83}},29],"o":{"r":{"o":6}},"p":9},"n":{"a":{"t":17},"e":[{"r":1},24],"i":[{"m":1,"n":24,"s":{"h":4},"v":11},29],"s":[{"w":1},93],"t":{"a":{"b":11},"e":{"r":{".":1},"s":1}},"u":0,"y":4,"z":4},"o":{"r":{"s":21},"s":19,"u":29},"p":{"e":[{"r":{"s":6}},29],"i":{"a":19,"n":{"g":3}},"l":23,"p":[{"o":{"r":{"t":10}}},3],"t":{"i":{"b":5},"u":17}},"r":{"a":[{".":18,"g":21,"s":21,"l":{".":216}},29],"b":{"e":1},"c":0,"d":2,"e":{"a":{"t":5}},"f":{"e":{"r":1},"r":1},"i":{"f":[{"i":{"c":0}},23],"n":2,"o":23,"t":29,"z":3,"a":{"l":{".":0}}},"l":[{"i":{"n":{"g":{".":5}}}},9],"n":{"o":1},"o":{"s":17},"p":{"e":1,"i":1},"s":{"e":{"r":5}},"t":{"e":{"s":4},"h":{"e":3},"i":[{"e":1},17]},"u":23},"s":[{"a":{"d":19,"n":19,"p":1},"c":[{"i":3},8],"e":{"a":5,"r":{".":9}},"i":{"a":19,"c":23},"l":{"i":{"n":1}},"p":2,"s":{"l":4},"t":{"e":{"r":{"e":4}},"r":2},"u":[{"r":17},24]},25],"t":{"a":{"b":0,"t":23},"e":{".":18,"l":18,"n":[{"i":17},18]},"i":[{"l":{"i":{"z":5}},"n":{"e":23,"g":3},"o":{"n":{"a":7}},"s":21,"z":31},101],"l":34,"o":{"f":4,"g":5,"m":{"a":{"t":{"i":{"c":5}}}},"n":19,"u":21},"s":0},"u":[{"m":1},23],"v":74,"x":{"u":11},"z":{"e":1}},"v":{"a":[{".":32,"b":159,"c":{"i":{"l":5},"u":11},"g":[{"e":1,"u":{"e":{"r":170}}},0],"l":{"i":{"e":4},"o":5,"u":15},"m":{"o":4},"n":{"i":{"z":4}},"p":{"i":4},"r":{"i":{"e":{"d":5}}},"t":[{"i":{"v":29}},27],"u":{"d":{"e":{"v":54}}}},41],"e":{".":18,"d":18,"g":11,"l":{".":23,"l":{"i":11},"o":1,"y":21},"n":{"o":{"m":11},"u":{"e":19}},"r":{"d":21,"e":{".":32,"l":[{"y":{".":41}},21],"n":[{"c":5},23],"s":21,"i":{"g":324}},"i":{"e":11},"m":{"i":{"n":36}},"s":{"e":27},"t":{"h":11}},"s":[{".":18,"t":{"e":0,"i":{"t":{"e":15}}}},99],"t":{"e":[{"r":11},1],"y":1}},"i":{"a":{"l":{"i":4},"n":32},"d":{"e":{".":32,"d":32,"n":47,"s":32},"i":32},"f":23,"g":{"n":4},"k":0,"l":[{"i":{"t":32,"z":127}},25],"n":[{"a":26,"c":24,"d":5,"g":18},29],"o":{"l":11,"r":73,"u":2},"p":1,"r":{"o":4},"s":{"i":{"t":11},"o":3,"u":3},"t":{"i":18,"r":11,"y":18},"v":[{"i":{"p":{"a":{"r":325}}}},27]},"o":{".":32,"i":[{"r":{"d":{"u":323}},"c":{"e":{"p":213}}},0],"k":27,"l":{"a":1,"e":19,"t":32,"v":27},"m":{"i":5},"r":{"a":{"b":5},"i":17,"y":1},"t":{"a":1,"e":{"e":18}}},"v":26,"y":21},"w":{"a":{"b":{"l":19},"c":25,"g":{"e":{"r":4},"o":5},"i":{"t":6},"l":{".":19},"m":0,"r":{"t":0},"s":{"t":[{"e":{"w":{"a":326}}},0]},"t":{"e":2},"v":{"e":{"r":4,"g":327}}},"b":29,"e":{"a":{"r":{"i":{"e":5}},"t":{"h":54}},"d":{"n":0},"e":{"t":12,"v":5,"k":{"n":137}},"l":{"l":0},"r":29,"s":{"t":12},"v":23},"h":{"i":0},"i":[{"l":[{"l":{"i":{"n":6}}},8],"n":{"d":{"e":0},"g":0},"r":0,"s":{"e":27},"t":{"h":12},"z":5,"d":{"e":{"s":{"p":6}}}},9],"k":21,"l":{"e":{"s":1},"i":{"n":3}},"n":{"o":21},"o":[{"m":15,"v":{"e":{"n":4}},"k":{"e":{"n":85}}},160],"p":19,"r":{"a":[{"p":{"a":{"r":{"o":12}}}},0],"i":[{"t":{"a":36,"e":{"r":{".":183}}}},0]},"s":{"h":23,"l":1,"p":{"e":1},"t":60},"t":18,"y":1,"c":23},"x":{"a":[{"c":{"e":5},"g":{"o":21},"m":11,"p":21,"s":5},29],"c":161,"e":[{"c":{"u":{"t":{"o":1}}},"d":24,"r":{"i":0,"o":4}},29],"h":[{"i":[{"l":6},8],"u":0},29],"i":[{"a":4,"c":4,"d":{"i":4},"m":{"e":21,"i":{"z":4}}},23],"o":[{"b":21},23],"p":[{"a":{"n":{"d":17}},"e":{"c":{"t":{"o":10}},"d":11}},23],"t":[{"i":23},74],"u":[{"a":3},29],"x":1,"q":[{"u":{"i":{"s":54}}},29]},"y":{"a":{"c":19,"r":110,"t":19},"b":29,"c":[{"e":[{"r":4},24],"h":[{"e":[{"d":264},0]},23],"o":{"m":17,"t":17}},29],"d":29,"e":{"e":19,"r":[{"f":21},29],"s":[{"t":{"e":{"r":{"y":328}}}},0],"t":1},"g":{"i":19},"h":47,"i":29,"l":{"a":23,"l":{"a":{"b":{"l":6}}},"o":23,"u":19},"m":{"b":{"o":{"l":7}},"e":[{"t":{"r":{"y":20}}},0],"p":{"a":12}},"n":{"c":{"h":{"r":3}},"d":4,"g":4,"i":{"c":4},"x":32},"o":[{"d":4,"g":33,"m":0,"n":{"e":{"t":4},"s":21},"s":21},72],"p":{"e":{"d":21,"r":6},"i":3,"o":[{"c":21},23],"t":{"a":9},"u":19},"r":{"a":{"m":5},"i":{"a":4},"o":23,"r":1},"s":{"c":1,"e":161,"i":{"c":{"a":3},"o":3,"s":27},"o":21,"s":0,"t":[{"a":3,"r":{"o":29}},2],"u":{"r":17}},"t":{"h":{"i":{"n":23}},"i":{"c":3}},"w":29},"z":{"a":[{"b":79,"r":8},2],"b":18,"e":[{"n":1,"p":1,"r":[{"o":3},29],"t":0},25],"i":[{"l":21,"s":21,"a":{"n":{".":23}}},42],"l":32,"m":18,"o":[{"m":1,"o":{"l":4},"p":{"h":{"r":329}}},41],"t":{"e":0},"z":[{"y":21,"w":231},101]}}', ["as-so-ciate", "as-so-ciates", "dec-li-na-tion", "oblig-a-tory", "phil-an-thropic", "present", "presents", "project", "projects", "reci-procity", "re-cog-ni-zance", "ref-or-ma-tion", "ret-ri-bu-tion", "ta-ble"]];
	}); 
} (enUs));

var enUsExports = enUs.exports;
var pattern = /*@__PURE__*/getDefaultExportFromCjs(enUsExports);

/**
 * Create attributed string from text fragments
 *
 * @param fragments - Fragments
 * @returns Attributed string
 */
const fromFragments = fragments => {
  let offset = 0;
  let string = '';
  const runs = [];
  fragments.forEach(fragment => {
    string += fragment.string;
    runs.push({
      ...fragment,
      start: offset,
      end: offset + fragment.string.length,
      attributes: fragment.attributes || {}
    });
    offset += fragment.string.length;
  });
  return {
    string,
    runs
  };
};
const SOFT_HYPHEN$1 = '\u00ad';
/**
 * Default word hyphenation engine used when no one provided.
 * Does not perform word hyphenation at all
 *
 * @param word
 * @returns Same word
 */
const defaultHyphenate = word => [word];
/**
 * Remove soft hyphens from word
 *
 * @param word
 * @returns Word without soft hyphens
 */
const removeSoftHyphens = word => {
  return word.replaceAll(SOFT_HYPHEN$1, '');
};
/**
 * Wrap words of attribute string
 *
 * @param engines layout engines
 * @param options layout options
 */
const wrapWords = function (engines, options) {
  if (engines === void 0) {
    engines = {};
  }
  if (options === void 0) {
    options = {};
  }
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string including syllables
   */
  return attributedString => {
    var _engines$wordHyphenat, _engines;
    const syllables = [];
    const fragments = [];
    const builtinHyphenate = ((_engines$wordHyphenat = (_engines = engines).wordHyphenation) === null || _engines$wordHyphenat === void 0 ? void 0 : _engines$wordHyphenat.call(_engines)) || defaultHyphenate;
    const hyphenate = options.hyphenationCallback || builtinHyphenate;
    let offset = 0;
    for (let i = 0; i < attributedString.runs.length; i += 1) {
      let string = '';
      const run = attributedString.runs[i];
      const words = attributedString.string.slice(run.start, run.end).split(/([ ]+)/g).filter(Boolean);
      for (let j = 0; j < words.length; j += 1) {
        const word = words[j];
        const parts = hyphenate(word, builtinHyphenate).map(removeSoftHyphens);
        syllables.push(...parts);
        string += parts.join('');
      }
      // Modify run start and end based on removed soft hyphens.
      const runOffset = run.end - run.start - string.length;
      const start = run.start - offset;
      const end = run.end - offset - runOffset;
      fragments.push({
        ...run,
        start,
        end,
        string
      });
      offset += runOffset;
    }
    const result = {
      ...fromFragments(fragments),
      syllables
    };
    return result;
  };
};

/**
 * Clone rect
 *
 * @param rect - Rect
 * @returns Cloned rect
 */
const copy = rect => {
  return Object.assign({}, rect);
};

/**
 * Partition rect in two in the vertical direction
 *
 * @param rect - Rect
 * @param height - Height
 * @returns Partitioned rects
 */
const partition = (rect, height) => {
  const a = Object.assign({}, rect, {
    height
  });
  const b = Object.assign({}, rect, {
    y: rect.y + height,
    height: rect.height - height
  });
  return [a, b];
};

/**
 * Crop upper section of rect
 *
 * @param height - Height
 * @param rect - Rect
 * @returns Cropped rect
 */
const crop = (height, rect) => {
  const [, result] = partition(rect, height);
  return result;
};

/**
 * Get paragraph block height
 *
 * @param paragraph - Paragraph
 * @returns Paragraph block height
 */
const height$2 = paragraph => {
  return paragraph.reduce((acc, block) => acc + block.box.height, 0);
};

/**
 * Calculate run scale
 *
 * @param run - Run
 * @returns Scale
 */
const calculateScale = run => {
  var _font$;
  const attributes = run.attributes || {};
  const fontSize = attributes.fontSize || 12;
  const font = attributes.font;
  const unitsPerEm = typeof font === 'string' ? null : font === null || font === void 0 ? void 0 : (_font$ = font[0]) === null || _font$ === void 0 ? void 0 : _font$.unitsPerEm;
  return unitsPerEm ? fontSize / unitsPerEm : 0;
};
/**
 * Get run scale
 *
 * @param  run
 * @returns Scale
 */
const scale = run => {
  var _run$attributes;
  return ((_run$attributes = run.attributes) === null || _run$attributes === void 0 ? void 0 : _run$attributes.scale) || calculateScale(run);
};

/**
 * Get ligature offset by index
 *
 * Ex. ffi ligature
 *
 *   glyphs:         l  o  f  f  i  m
 *   glyphIndices:   0  1  2  2  2  3
 *   offset:         0  0  0  1  2  0
 *
 * @param index
 * @param run - Run
 * @returns Ligature offset
 */
const offset = (index, run) => {
  if (!run) return 0;
  const glyphIndices = run.glyphIndices || [];
  const value = glyphIndices[index];
  return glyphIndices.slice(0, index).filter(i => i === value).length;
};

/**
 * Get run font
 *
 * @param run - Run
 * @returns Font
 */
const getFont = run => {
  var _run$attributes2, _run$attributes2$font;
  return ((_run$attributes2 = run.attributes) === null || _run$attributes2 === void 0 ? void 0 : (_run$attributes2$font = _run$attributes2.font) === null || _run$attributes2$font === void 0 ? void 0 : _run$attributes2$font[0]) || null;
};

/**
 * Slice glyph between codePoints range
 * Util for breaking ligatures
 *
 * @param start - Start code point index
 * @param end - End code point index
 * @param font - Font to generate new glyph
 * @param glyph - Glyph to be sliced
 * @returns Sliced glyph parts
 */
const slice$2 = (start, end, font, glyph) => {
  if (!glyph) return [];
  if (start === end) return [];
  if (start === 0 && end === glyph.codePoints.length) return [glyph];
  const codePoints = glyph.codePoints.slice(start, end);
  const string = String.fromCodePoint(...codePoints);
  // passing LTR To force fontkit to not reverse the string
  return font ? font.layout(string, undefined, undefined, undefined, 'ltr').glyphs : [glyph];
};

/**
 * Return glyph index at string index, if glyph indices present.
 * Otherwise return string index
 *
 * @param index - Index
 * @param run - Run
 * @returns Glyph index
 */
const glyphIndexAt = (index, run) => {
  var _run$glyphIndices;
  const result = run === null || run === void 0 ? void 0 : (_run$glyphIndices = run.glyphIndices) === null || _run$glyphIndices === void 0 ? void 0 : _run$glyphIndices[index];
  return isNil(result) ? index : result;
};

/**
 * Returns new array starting with zero, and keeping same relation between consecutive values
 *
 * @param array - List
 * @returns Normalized array
 */
const normalize = array => {
  const head = array[0];
  return array.map(value => value - head);
};

/**
 * Slice run between glyph indices range
 *
 * @param start - Glyph index
 * @param end - Glyph index
 * @param run - Run
 * @returns Sliced run
 */
const slice$1 = (start, end, run) => {
  var _run$glyphs, _run$glyphs2;
  const runScale = scale(run);
  const font = getFont(run);
  // Get glyph start and end indices
  const startIndex = glyphIndexAt(start, run);
  const endIndex = glyphIndexAt(end, run);
  // Get start and end glyph
  const startGlyph = (_run$glyphs = run.glyphs) === null || _run$glyphs === void 0 ? void 0 : _run$glyphs[startIndex];
  const endGlyph = (_run$glyphs2 = run.glyphs) === null || _run$glyphs2 === void 0 ? void 0 : _run$glyphs2[endIndex];
  // Get start ligature chunks (if any)
  const startOffset = offset(start, run);
  const startGlyphs = startOffset > 0 ? slice$2(startOffset, Infinity, font, startGlyph) : [];
  // Get end ligature chunks (if any)
  const endOffset = offset(end, run);
  const endGlyphs = slice$2(0, endOffset, font, endGlyph);
  // Compute new glyphs
  const sliceStart = startIndex + Math.min(1, startOffset);
  const glyphs = (run.glyphs || []).slice(sliceStart, endIndex);
  // Compute new positions
  const glyphPosition = g => ({
    xAdvance: g.advanceWidth * runScale,
    yAdvance: 0,
    xOffset: 0,
    yOffset: 0
  });
  const startPositions = startGlyphs.map(glyphPosition);
  const positions = (run.positions || []).slice(sliceStart, endIndex);
  const endPositions = endGlyphs.map(glyphPosition);
  return Object.assign({}, run, {
    start: run.start + start,
    end: Math.min(run.end, run.start + end),
    glyphIndices: normalize((run.glyphIndices || []).slice(start, end)),
    glyphs: [startGlyphs, glyphs, endGlyphs].flat(),
    positions: [startPositions, positions, endPositions].flat()
  });
};

/**
 * Get run index that contains passed index
 *
 * @param index - Index
 * @param runs - Runs
 * @returns Run index
 */
const runIndexAt$1 = (index, runs) => {
  if (!runs) return -1;
  return runs.findIndex(run => run.start <= index && index < run.end);
};

/**
 * Filter runs contained between start and end
 *
 * @param start
 * @param end
 * @param runs
 * @returns Filtered runs
 */
const filter = (start, end, runs) => {
  const startIndex = runIndexAt$1(start, runs);
  const endIndex = Math.max(runIndexAt$1(end - 1, runs), startIndex);
  return runs.slice(startIndex, endIndex + 1);
};

/**
 * Subtract scalar to run
 *
 * @param index - Scalar
 * @param run - Run
 * @returns Subtracted run
 */
const subtract = (index, run) => {
  const start = run.start - index;
  const end = run.end - index;
  return Object.assign({}, run, {
    start,
    end
  });
};

/**
 * Slice array of runs
 *
 * @param start - Offset
 * @param end - Offset
 * @param runs
 * @returns Sliced runs
 */
const sliceRuns = (start, end, runs) => {
  const sliceFirstRun = a => slice$1(start - a.start, end - a.start, a);
  const sliceLastRun = a => slice$1(0, end - a.start, a);
  return runs.map((run, i) => {
    let result = run;
    const isFirst = i === 0;
    const isLast = !isFirst && i === runs.length - 1;
    if (isFirst) result = sliceFirstRun(run);
    if (isLast) result = sliceLastRun(run);
    return subtract(start, result);
  });
};
/**
 * Slice attributed string between two indices
 *
 * @param start - Offset
 * @param end - Offset
 * @param attributedString - Attributed string
 * @returns Attributed string
 */
const slice = (start, end, attributedString) => {
  if (attributedString.string.length === 0) return attributedString;
  const string = attributedString.string.slice(start, end);
  const filteredRuns = filter(start, end, attributedString.runs);
  const slicedRuns = sliceRuns(start, end, filteredRuns);
  return Object.assign({}, attributedString, {
    string,
    runs: slicedRuns
  });
};
const findCharIndex = string => {
  return string.search(/\S/g);
};
const findLastCharIndex = string => {
  const match = string.match(/\S/g);
  return match ? string.lastIndexOf(match[match.length - 1]) : -1;
};
/**
 * Removes (strips) whitespace from both ends of the attributted string.
 *
 * @param attributedString - Attributed string
 * @returns Attributed string
 */
const trim = attributedString => {
  const start = findCharIndex(attributedString.string);
  const end = findLastCharIndex(attributedString.string);
  return slice(start, end + 1, attributedString);
};

/**
 * Returns empty run
 *
 * @returns Empty run
 */
const empty$1 = () => {
  return {
    start: 0,
    end: 0,
    glyphIndices: [],
    glyphs: [],
    positions: [],
    attributes: {}
  };
};

/**
 * Check if value is a number
 *
 * @param value - Value to check
 * @returns Whether value is a number
 */
const isNumber$1 = value => {
  return typeof value === 'number';
};

/**
 * Append glyph indices with given length
 *
 * Ex. appendIndices(3, [0, 1, 2, 2]) => [0, 1, 2, 2, 3, 3, 3]
 *
 * @param length - Length
 * @param indices - Glyph indices
 * @returns Extended glyph indices
 */
const appendIndices = (length, indices) => {
  const lastIndex = last(indices);
  const value = isNil(lastIndex) ? 0 : lastIndex + 1;
  const newIndices = Array(length).fill(value);
  return indices.concat(newIndices);
};

/**
 * Get glyph for a given code point
 *
 * @param value - CodePoint
 * @param font - Font
 * @returns Glyph
 * */
const fromCodePoint = (value, font) => {
  if (typeof font === 'string') return null;
  return font && value ? font.glyphForCodePoint(value) : null;
};

/**
 * Append glyph to run
 *
 * @param glyph - Glyph
 * @param run - Run
 * @returns Run with glyph
 */
const appendGlyph = (glyph, run) => {
  var _glyph$codePoints;
  const glyphLength = ((_glyph$codePoints = glyph.codePoints) === null || _glyph$codePoints === void 0 ? void 0 : _glyph$codePoints.length) || 0;
  const end = run.end + glyphLength;
  const glyphs = run.glyphs.concat(glyph);
  const glyphIndices = appendIndices(glyphLength, run.glyphIndices);
  if (!run.positions) return Object.assign({}, run, {
    end,
    glyphs,
    glyphIndices
  });
  const positions = run.positions.concat({
    xAdvance: glyph.advanceWidth * scale(run),
    yAdvance: 0,
    xOffset: 0,
    yOffset: 0
  });
  return Object.assign({}, run, {
    end,
    glyphs,
    glyphIndices,
    positions
  });
};
/**
 * Append glyph or code point to run
 *
 * @param value - Glyph or codePoint
 * @param run - Run
 * @returns Run with glyph
 */
const append$1 = (value, run) => {
  if (!value) return run;
  const font = getFont(run);
  const glyph = isNumber$1(value) ? fromCodePoint(value, font) : value;
  return appendGlyph(glyph, run);
};

/**
 * Get string from array of code points
 *
 * @param codePoints - Points
 * @returns String
 */
const stringFromCodePoints = codePoints => {
  return String.fromCodePoint(...(codePoints || []));
};

/**
 * Append glyph into last run of attributed string
 *
 * @param glyph - Glyph or code point
 * @param attributedString - Attributed string
 * @returns Attributed string with new glyph
 */
const append = (glyph, attributedString) => {
  const codePoints = typeof glyph === 'number' ? [glyph] : glyph === null || glyph === void 0 ? void 0 : glyph.codePoints;
  const codePointsString = stringFromCodePoints(codePoints || []);
  const string = attributedString.string + codePointsString;
  const firstRuns = attributedString.runs.slice(0, -1);
  const lastRun = last(attributedString.runs) || empty$1();
  const runs = firstRuns.concat(append$1(glyph, lastRun));
  return Object.assign({}, attributedString, {
    string,
    runs
  });
};
const ELLIPSIS_UNICODE = 8230;
const ELLIPSIS_STRING = String.fromCharCode(ELLIPSIS_UNICODE);
/**
 * Get ellipsis codepoint. This may be different in standard and embedded fonts
 *
 * @param font
 * @returns Ellipsis codepoint
 */
const getEllipsisCodePoint = font => {
  if (!font.encode) return ELLIPSIS_UNICODE;
  const [codePoints] = font.encode(ELLIPSIS_STRING);
  return parseInt(codePoints[0], 16);
};
/**
 * Trucante block with ellipsis
 *
 * @param paragraph - Paragraph
 * @returns Sliced paragraph
 */
const truncate = paragraph => {
  var _last, _last2, _last2$attributes;
  const runs = ((_last = last(paragraph)) === null || _last === void 0 ? void 0 : _last.runs) || [];
  const font = (_last2 = last(runs)) === null || _last2 === void 0 ? void 0 : (_last2$attributes = _last2.attributes) === null || _last2$attributes === void 0 ? void 0 : _last2$attributes.font[0];
  if (font) {
    const index = paragraph.length - 1;
    const codePoint = getEllipsisCodePoint(font);
    const glyph = font.glyphForCodePoint(codePoint);
    const lastBlock = append(glyph, trim(paragraph[index]));
    return Object.assign([], paragraph, {
      [index]: lastBlock
    });
  }
  return paragraph;
};

/**
 * Omit attribute from run
 *
 * @param value - Attribute key
 * @param run - Run
 * @returns Run without ommited attribute
 */
const omit = (value, run) => {
  const attributes = Object.assign({}, run.attributes);
  delete attributes[value];
  return Object.assign({}, run, {
    attributes
  });
};

/**
 * Get run ascent
 *
 * @param run - Run
 * @returns Ascent
 */
const ascent$1 = run => {
  var _font$2;
  const {
    font,
    attachment
  } = run.attributes;
  const attachmentHeight = (attachment === null || attachment === void 0 ? void 0 : attachment.height) || 0;
  const fontAscent = typeof font === 'string' ? 0 : (font === null || font === void 0 ? void 0 : (_font$2 = font[0]) === null || _font$2 === void 0 ? void 0 : _font$2.ascent) || 0;
  return Math.max(attachmentHeight, fontAscent * scale(run));
};

/**
 * Get run descent
 *
 * @param run - Run
 * @returns Descent
 */
const descent = run => {
  var _run$attributes3, _font$3;
  const font = (_run$attributes3 = run.attributes) === null || _run$attributes3 === void 0 ? void 0 : _run$attributes3.font;
  const fontDescent = typeof font === 'string' ? 0 : (font === null || font === void 0 ? void 0 : (_font$3 = font[0]) === null || _font$3 === void 0 ? void 0 : _font$3.descent) || 0;
  return scale(run) * fontDescent;
};

/**
 * Get run lineGap
 *
 * @param run - Run
 * @returns LineGap
 */
const lineGap = run => {
  var _run$attributes4, _font$4;
  const font = (_run$attributes4 = run.attributes) === null || _run$attributes4 === void 0 ? void 0 : _run$attributes4.font;
  const lineGap = typeof font === 'string' ? 0 : (font === null || font === void 0 ? void 0 : (_font$4 = font[0]) === null || _font$4 === void 0 ? void 0 : _font$4.lineGap) || 0;
  return lineGap * scale(run);
};

/**
 * Get run height
 *
 * @param run - Run
 * @returns Height
 */
const height$1 = run => {
  var _run$attributes5;
  const lineHeight = (_run$attributes5 = run.attributes) === null || _run$attributes5 === void 0 ? void 0 : _run$attributes5.lineHeight;
  return lineHeight || lineGap(run) + ascent$1(run) - descent(run);
};

/**
 * Returns attributed string height
 *
 * @param attributedString - Attributed string
 * @returns Height
 */
const height = attributedString => {
  const reducer = (acc, run) => Math.max(acc, height$1(run));
  return attributedString.runs.reduce(reducer, 0);
};

/**
 * Checks if two rects intersect each other
 *
 * @param a - Rect A
 * @param b - Rect B
 * @returns Whether rects intersect
 */
const intersects = (a, b) => {
  const x = Math.max(a.x, b.x);
  const num1 = Math.min(a.x + a.width, b.x + b.width);
  const y = Math.max(a.y, b.y);
  const num2 = Math.min(a.y + a.height, b.y + b.height);
  return num1 >= x && num2 >= y;
};
const getLineFragment = (lineRect, excludeRect) => {
  if (!intersects(excludeRect, lineRect)) return [lineRect];
  const eStart = excludeRect.x;
  const eEnd = excludeRect.x + excludeRect.width;
  const lStart = lineRect.x;
  const lEnd = lineRect.x + lineRect.width;
  const a = Object.assign({}, lineRect, {
    width: eStart - lStart
  });
  const b = Object.assign({}, lineRect, {
    x: eEnd,
    width: lEnd - eEnd
  });
  return [a, b].filter(r => r.width > 0);
};
const getLineFragments = (rect, excludeRects) => {
  let fragments = [rect];
  for (let i = 0; i < excludeRects.length; i += 1) {
    const excludeRect = excludeRects[i];
    fragments = fragments.reduce((acc, fragment) => {
      const pieces = getLineFragment(fragment, excludeRect);
      return acc.concat(pieces);
    }, []);
  }
  return fragments;
};
const generateLineRects = (container, height) => {
  const {
    excludeRects,
    ...rect
  } = container;
  if (!excludeRects) return [rect];
  const lineRects = [];
  const maxY = Math.max(...excludeRects.map(r => r.y + r.height));
  let currentRect = rect;
  while (currentRect.y < maxY) {
    const [lineRect, rest] = partition(currentRect, height);
    const lineRectFragments = getLineFragments(lineRect, excludeRects);
    currentRect = rest;
    lineRects.push(...lineRectFragments);
  }
  return [...lineRects, currentRect];
};
const ATTACHMENT_CODE$1 = '\ufffc'; // 65532
/**
 * Remove attachment attribute if no char present
 *
 * @param line - Line
 * @returns Line
 */
const purgeAttachments = line => {
  const shouldPurge = !line.string.includes(ATTACHMENT_CODE$1);
  if (!shouldPurge) return line;
  const runs = line.runs.map(run => omit('attachment', run));
  return Object.assign({}, line, {
    runs
  });
};
/**
 * Layout paragraphs inside rectangle
 *
 * @param rects - Rects
 * @param lines - Attributed strings
 * @param indent
 * @returns layout blocks
 */
const layoutLines = (rects, lines, indent) => {
  let rect = rects.shift();
  let currentY = rect.y;
  return lines.map((line, i) => {
    var _line$runs, _line$runs$;
    const lineIndent = i === 0 ? indent : 0;
    const style = ((_line$runs = line.runs) === null || _line$runs === void 0 ? void 0 : (_line$runs$ = _line$runs[0]) === null || _line$runs$ === void 0 ? void 0 : _line$runs$.attributes) || {};
    const height$1 = Math.max(height(line), style.lineHeight);
    if (currentY + height$1 > rect.y + rect.height && rects.length > 0) {
      rect = rects.shift();
      currentY = rect.y;
    }
    const newLine = {
      string: line.string,
      runs: line.runs,
      box: {
        x: rect.x + lineIndent,
        y: currentY,
        width: rect.width - lineIndent,
        height: height$1
      }
    };
    currentY += height$1;
    return purgeAttachments(newLine);
  });
};
/**
 * Performs line breaking and layout
 *
 * @param engines - Engines
 * @param options - Layout options
 */
const layoutParagraph = function (engines, options) {
  if (options === void 0) {
    options = {};
  }
  /**
   * @param container - Container
   * @param paragraph - Attributed string
   * @returns Layout block
   */
  return (container, paragraph) => {
    var _paragraph$runs, _paragraph$runs$, _paragraph$runs$$attr;
    const height$1 = height(paragraph);
    const indent = ((_paragraph$runs = paragraph.runs) === null || _paragraph$runs === void 0 ? void 0 : (_paragraph$runs$ = _paragraph$runs[0]) === null || _paragraph$runs$ === void 0 ? void 0 : (_paragraph$runs$$attr = _paragraph$runs$.attributes) === null || _paragraph$runs$$attr === void 0 ? void 0 : _paragraph$runs$$attr.indent) || 0;
    const rects = generateLineRects(container, height$1);
    const availableWidths = rects.map(r => r.width);
    availableWidths.unshift(availableWidths[0] - indent);
    const lines = engines.linebreaker(options)(paragraph, availableWidths);
    return layoutLines(rects, lines, indent);
  };
};

/**
 * Slice block at given height
 *
 * @param height - Height
 * @param paragraph - Paragraph
 * @returns Sliced paragraph
 */
const sliceAtHeight = (height, paragraph) => {
  const newBlock = [];
  let counter = 0;
  for (let i = 0; i < paragraph.length; i += 1) {
    const line = paragraph[i];
    counter += line.box.height;
    if (counter < height) {
      newBlock.push(line);
    } else {
      break;
    }
  }
  return newBlock;
};

/**
 * Layout paragraphs inside container until it does not
 * fit anymore, performing line wrapping in the process.
 *
 * @param  engines - Engines
 * @param  options - Layout options
 * @param container - Container
 */
const typesetter = (engines, options, container) => {
  /**
   * @param attributedStrings - Attributed strings (paragraphs)
   * @returns Paragraph blocks
   */
  return attributedStrings => {
    const result = [];
    const paragraphs = [...attributedStrings];
    const layout = layoutParagraph(engines, options);
    const maxLines = isNil(container.maxLines) ? Infinity : container.maxLines;
    const truncateEllipsis = container.truncateMode === 'ellipsis';
    let linesCount = maxLines;
    let paragraphRect = copy(container);
    let nextParagraph = paragraphs.shift();
    while (linesCount > 0 && nextParagraph) {
      const paragraph = layout(paragraphRect, nextParagraph);
      const slicedBlock = paragraph.slice(0, linesCount);
      const linesHeight = height$2(slicedBlock);
      const shouldTruncate = truncateEllipsis && paragraph.length !== slicedBlock.length;
      linesCount -= slicedBlock.length;
      if (paragraphRect.height >= linesHeight) {
        result.push(shouldTruncate ? truncate(slicedBlock) : slicedBlock);
        paragraphRect = crop(linesHeight, paragraphRect);
        nextParagraph = paragraphs.shift();
      } else {
        result.push(truncate(sliceAtHeight(paragraphRect.height, slicedBlock)));
        break;
      }
    }
    return result;
  };
};

/**
 * Get attributed string start value
 *
 * @param attributedString - Attributed string
 * @returns Start
 */
const start = attributedString => {
  const {
    runs
  } = attributedString;
  return runs.length === 0 ? 0 : runs[0].start;
};

/**
 * Get attributed string end value
 *
 * @param attributedString - Attributed string
 * @returns End
 */
const end = attributedString => {
  const {
    runs
  } = attributedString;
  return runs.length === 0 ? 0 : last(runs).end;
};

/**
 * Get attributed string length
 *
 * @param attributedString - Attributed string
 * @returns End
 */
const length$1 = attributedString => {
  return end(attributedString) - start(attributedString);
};
const bidi$2 = bidiFactory();
const getBidiLevels$1 = runs => {
  return runs.reduce((acc, run) => {
    const length = run.end - run.start;
    const levels = repeat(run.attributes.bidiLevel, length);
    return acc.concat(levels);
  }, []);
};
const getReorderedIndices = (string, segments) => {
  // Fill an array with indices
  const indices = [];
  for (let i = 0; i < string.length; i += 1) {
    indices[i] = i;
  }
  // Reverse each segment in order
  segments.forEach(_ref => {
    let [start, end] = _ref;
    const slice = indices.slice(start, end + 1);
    for (let i = slice.length - 1; i >= 0; i -= 1) {
      indices[end - i] = slice[i];
    }
  });
  return indices;
};
const getItemAtIndex = (runs, objectName, index) => {
  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    const updatedIndex = run.glyphIndices[index - run.start];
    if (index >= run.start && index < run.end) {
      return run[objectName][updatedIndex];
    }
  }
  throw new Error(`index ${index} out of range`);
};
const reorderLine = line => {
  var _line$runs$2;
  const levels = getBidiLevels$1(line.runs);
  const direction = (_line$runs$2 = line.runs[0]) === null || _line$runs$2 === void 0 ? void 0 : _line$runs$2.attributes.direction;
  const level = direction === 'rtl' ? 1 : 0;
  const end = length$1(line) - 1;
  const paragraphs = [{
    start: 0,
    end,
    level
  }];
  const embeddingLevels = {
    paragraphs,
    levels
  };
  const segments = bidi$2.getReorderSegments(line.string, embeddingLevels);
  // No need for bidi reordering
  if (segments.length === 0) return line;
  const indices = getReorderedIndices(line.string, segments);
  const updatedString = bidi$2.getReorderedString(line.string, embeddingLevels);
  const updatedRuns = line.runs.map(run => {
    const selectedIndices = indices.slice(run.start, run.end);
    const updatedGlyphs = [];
    const updatedPositions = [];
    const addedGlyphs = new Set();
    for (let i = 0; i < selectedIndices.length; i += 1) {
      const index = selectedIndices[i];
      const glyph = getItemAtIndex(line.runs, 'glyphs', index);
      if (addedGlyphs.has(glyph.id)) continue;
      updatedGlyphs.push(glyph);
      updatedPositions.push(getItemAtIndex(line.runs, 'positions', index));
      if (glyph.isLigature) {
        addedGlyphs.add(glyph.id);
      }
    }
    return {
      ...run,
      glyphs: updatedGlyphs,
      positions: updatedPositions
    };
  });
  return {
    box: line.box,
    runs: updatedRuns,
    string: updatedString
  };
};
const reorderParagraph = paragraph => paragraph.map(reorderLine);
/**
 * Perform bidi reordering
 *
 * @returns Reordered paragraphs
 */
const bidiReordering = () => {
  /**
   * @param paragraphs - Paragraphs
   * @returns Reordered paragraphs
   */
  return paragraphs => paragraphs.map(reorderParagraph);
};
const DUMMY_CODEPOINT = 123;
/**
 * Resolve string indices based on glyphs code points
 *
 * @param glyphs
 * @returns Glyph indices
 */
const resolve = function (glyphs) {
  if (glyphs === void 0) {
    glyphs = [];
  }
  return glyphs.reduce((acc, glyph) => {
    const codePoints = (glyph === null || glyph === void 0 ? void 0 : glyph.codePoints) || [DUMMY_CODEPOINT];
    if (acc.length === 0) return codePoints.map(() => 0);
    const last = acc[acc.length - 1];
    const next = codePoints.map(() => last + 1);
    return [...acc, ...next];
  }, []);
};
const getCharacterSpacing = run => {
  var _run$attributes6;
  return ((_run$attributes6 = run.attributes) === null || _run$attributes6 === void 0 ? void 0 : _run$attributes6.characterSpacing) || 0;
};
/**
 * Scale run positions
 *
 * @param  run
 * @param  positions
 * @returns Scaled positions
 */
const scalePositions = (run, positions) => {
  const runScale = scale(run);
  const characterSpacing = getCharacterSpacing(run);
  return positions.map((position, i) => {
    const isLast = i === positions.length;
    const xSpacing = isLast ? 0 : characterSpacing;
    return Object.assign({}, position, {
      xAdvance: position.xAdvance * runScale + xSpacing,
      yAdvance: position.yAdvance * runScale,
      xOffset: position.xOffset * runScale,
      yOffset: position.yOffset * runScale
    });
  });
};
/**
 * Create glyph run
 *
 * @param string string
 */
const layoutRun = string => {
  /**
   * @param run - Run
   * @returns Glyph run
   */
  return run => {
    const {
      start,
      end,
      attributes = {}
    } = run;
    const {
      font
    } = attributes;
    if (!font) return {
      ...run,
      glyphs: [],
      glyphIndices: [],
      positions: []
    };
    const runString = string.slice(start, end);
    if (typeof font === 'string') throw new Error('Invalid font');
    // passing LTR To force fontkit to not reverse the string
    const glyphRun = font[0].layout(runString, undefined, undefined, undefined, 'ltr');
    const positions = scalePositions(run, glyphRun.positions);
    const glyphIndices = resolve(glyphRun.glyphs);
    const result = {
      ...run,
      positions,
      glyphIndices,
      glyphs: glyphRun.glyphs
    };
    return result;
  };
};
/**
 * Generate glyphs for single attributed string
 */
const generateGlyphs = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string with glyphs
   */
  return attributedString => {
    const runs = attributedString.runs.map(layoutRun(attributedString.string));
    const res = Object.assign({}, attributedString, {
      runs
    });
    return res;
  };
};

/**
 * Resolves yOffset for run
 *
 * @param run - Run
 * @returns Run
 */
const resolveRunYOffset = run => {
  var _run$attributes7, _run$attributes7$font, _run$attributes7$font2, _run$attributes8;
  if (!run.positions) return run;
  const unitsPerEm = ((_run$attributes7 = run.attributes) === null || _run$attributes7 === void 0 ? void 0 : (_run$attributes7$font = _run$attributes7.font) === null || _run$attributes7$font === void 0 ? void 0 : (_run$attributes7$font2 = _run$attributes7$font[0]) === null || _run$attributes7$font2 === void 0 ? void 0 : _run$attributes7$font2.unitsPerEm) || 0;
  const yOffset = (((_run$attributes8 = run.attributes) === null || _run$attributes8 === void 0 ? void 0 : _run$attributes8.yOffset) || 0) * unitsPerEm;
  const positions = run.positions.map(p => Object.assign({}, p, {
    yOffset
  }));
  return Object.assign({}, run, {
    positions
  });
};
/**
 * Resolves yOffset for multiple paragraphs
 */
const resolveYOffset = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string
   */
  return attributedString => {
    const runs = attributedString.runs.map(resolveRunYOffset);
    const res = Object.assign({}, attributedString, {
      runs
    });
    return res;
  };
};

/**
 * Sort runs in ascending order
 *
 * @param runs
 * @returns Sorted runs
 */
const sort = runs => {
  return runs.sort((a, b) => a.start - b.start || a.end - b.end);
};

/**
 * Is run empty (start === end)
 *
 * @param run - Run
 * @returns Is run empty
 */
const isEmpty = run => {
  return run.start === run.end;
};

/**
 * Sort points in ascending order
 * @param a - First point
 * @param b - Second point
 * @returns Sort order
 */
const sortPoints = (a, b) => {
  return a[1] - b[1] || a[3] - b[3];
};
/**
 * @param runs
 * @returns Points
 */
const generatePoints = runs => {
  const result = runs.reduce((acc, run, i) => {
    return acc.concat([['start', run.start, run.attributes, i], ['end', run.end, run.attributes, i]]);
  }, []);
  return result.sort(sortPoints);
};
/**
 * @param runs
 * @returns Merged runs
 */
const mergeRuns = runs => {
  return runs.reduce((acc, run) => {
    const attributes = Object.assign({}, acc.attributes, run.attributes);
    return Object.assign({}, run, {
      attributes
    });
  }, {});
};
/**
 * @param runs
 * @returns Grouped runs
 */
const groupEmptyRuns = runs => {
  const groups = runs.reduce((acc, run) => {
    if (!acc[run.start]) acc[run.start] = [];
    acc[run.start].push(run);
    return acc;
  }, []);
  return Object.values(groups);
};
/**
 * @param runs
 * @returns Flattened runs
 */
const flattenEmptyRuns = runs => {
  return groupEmptyRuns(runs).map(mergeRuns);
};
/**
 * @param runs
 * @returns Flattened runs
 */
const flattenRegularRuns = runs => {
  const res = [];
  const points = generatePoints(runs);
  let start = -1;
  let attrs = {};
  const stack = [];
  for (let i = 0; i < points.length; i += 1) {
    const [type, offset, attributes] = points[i];
    if (start !== -1 && start < offset) {
      res.push({
        start,
        end: offset,
        attributes: attrs,
        glyphIndices: [],
        glyphs: [],
        positions: []
      });
    }
    if (type === 'start') {
      stack.push(attributes);
      attrs = Object.assign({}, attrs, attributes);
    } else {
      attrs = {};
      for (let j = 0; j < stack.length; j += 1) {
        if (stack[j] === attributes) {
          stack.splice(j--, 1);
        } else {
          attrs = Object.assign({}, attrs, stack[j]);
        }
      }
    }
    start = offset;
  }
  return res;
};
/**
 * Flatten many runs
 *
 * @param runs
 * @returns Flattened runs
 */
const flatten = function (runs) {
  if (runs === void 0) {
    runs = [];
  }
  const emptyRuns = flattenEmptyRuns(runs.filter(run => isEmpty(run)));
  const regularRuns = flattenRegularRuns(runs.filter(run => !isEmpty(run)));
  return sort(emptyRuns.concat(regularRuns));
};

/**
 * Returns empty attributed string
 *
 * @returns Empty attributed string
 */
const empty = () => ({
  string: '',
  runs: []
});

/**
 *
 * @param attributedString
 * @returns Attributed string without font
 */
const omitFont = attributedString => {
  const runs = attributedString.runs.map(run => omit('font', run));
  return Object.assign({}, attributedString, {
    runs
  });
};
/**
 * Performs font substitution and script itemization on attributed string
 *
 * @param engines - engines
 */
const preprocessRuns = engines => {
  /**
   * @param attributedString - Attributed string
   * @returns Processed attributed string
   */
  return attributedString => {
    if (isNil(attributedString)) return empty();
    const {
      string
    } = attributedString;
    const {
      fontSubstitution,
      scriptItemizer,
      bidi
    } = engines;
    const {
      runs: omittedFontRuns
    } = omitFont(attributedString);
    const {
      runs: itemizationRuns
    } = scriptItemizer()(attributedString);
    const {
      runs: substitutedRuns
    } = fontSubstitution()(attributedString);
    const {
      runs: bidiRuns
    } = bidi()(attributedString);
    const runs = bidiRuns.concat(substitutedRuns).concat(itemizationRuns).concat(omittedFontRuns);
    return {
      string,
      runs: flatten(runs)
    };
  };
};

/**
 * Breaks attributed string into paragraphs
 */
const splitParagraphs = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Paragraphs attributed strings
   */
  return attributedString => {
    const paragraphs = [];
    let start = 0;
    let breakPoint = attributedString.string.indexOf('\n') + 1;
    while (breakPoint > 0) {
      paragraphs.push(slice(start, breakPoint, attributedString));
      start = breakPoint;
      breakPoint = attributedString.string.indexOf('\n', breakPoint) + 1;
    }
    if (start === 0) {
      paragraphs.push(attributedString);
    } else if (start < attributedString.string.length) {
      paragraphs.push(slice(start, length$1(attributedString), attributedString));
    }
    return paragraphs;
  };
};

/**
 * Return positions advance width
 *
 * @param positions - Positions
 * @returns {number} advance width
 */
const advanceWidth$2 = positions => {
  return positions.reduce((acc, pos) => acc + (pos.xAdvance || 0), 0);
};

/**
 * Return run advance width
 *
 * @param run - Run
 * @returns Advance width
 */
const advanceWidth$1 = run => {
  return advanceWidth$2(run.positions || []);
};

/**
 * Returns attributed string advancewidth
 *
 * @param attributedString - Attributed string
 * @returns Advance width
 */
const advanceWidth = attributedString => {
  const reducer = (acc, run) => acc + advanceWidth$1(run);
  return attributedString.runs.reduce(reducer, 0);
};
const WHITE_SPACES_CODE = 32;
/**
 * Check if glyph is white space
 *
 * @param glyph - Glyph
 * @returns Whether glyph is white space
 * */
const isWhiteSpace = glyph => {
  const codePoints = (glyph === null || glyph === void 0 ? void 0 : glyph.codePoints) || [];
  return codePoints.includes(WHITE_SPACES_CODE);
};

/**
 * Get white space leading positions
 *
 * @param run - Run
 * @returns White space leading positions
 */
const leadingPositions = run => {
  const glyphs = run.glyphs || [];
  const positions = run.positions || [];
  const leadingWhitespaces = glyphs.findIndex(g => !isWhiteSpace(g));
  return positions.slice(0, leadingWhitespaces);
};
/**
 * Get run leading white space offset
 *
 * @param run - Run
 * @returns Leading white space offset
 */
const leadingOffset$1 = run => {
  const positions = leadingPositions(run);
  return positions.reduce((acc, pos) => acc + (pos.xAdvance || 0), 0);
};

/**
 * Get attributed string leading white space offset
 *
 * @param attributedString - Attributed string
 * @returns Leading white space offset
 */
const leadingOffset = attributedString => {
  const runs = attributedString.runs || [];
  return leadingOffset$1(runs[0]);
};

/**
 * Get white space trailing positions
 *
 * @param run run
 * @returns White space trailing positions
 */
const trailingPositions = run => {
  const glyphs = reverse(run.glyphs || []);
  const positions = reverse(run.positions || []);
  const leadingWhitespaces = glyphs.findIndex(g => !isWhiteSpace(g));
  return positions.slice(0, leadingWhitespaces);
};
/**
 * Get run trailing white space offset
 *
 * @param run - Run
 * @returns Trailing white space offset
 */
const trailingOffset$1 = run => {
  const positions = trailingPositions(run);
  return positions.reduce((acc, pos) => acc + (pos.xAdvance || 0), 0);
};

/**
 * Get attributed string trailing white space offset
 *
 * @param attributedString - Attributed string
 * @returns Trailing white space offset
 */
const trailingOffset = attributedString => {
  const runs = attributedString.runs || [];
  return trailingOffset$1(last(runs));
};

/**
 * Drop last char of run
 *
 * @param run - Run
 * @returns Run without last char
 */
const dropLast$1 = run => {
  return slice$1(0, run.end - run.start - 1, run);
};

/**
 * Drop last glyph
 *
 * @param attributedString - Attributed string
 * @returns Attributed string with new glyph
 */
const dropLast = attributedString => {
  const string = dropLast$2(attributedString.string);
  const runs = adjust(-1, dropLast$1, attributedString.runs);
  return Object.assign({}, attributedString, {
    string,
    runs
  });
};
const ALIGNMENT_FACTORS$1 = {
  center: 0.5,
  right: 1
};
/**
 * Remove new line char at the end of line if present
 *
 * @param line
 * @returns Line
 */
const removeNewLine = line => {
  return last(line.string) === '\n' ? dropLast(line) : line;
};
const getOverflowLeft = line => {
  return leadingOffset(line) + (line.overflowLeft || 0);
};
const getOverflowRight = line => {
  return trailingOffset(line) + (line.overflowRight || 0);
};
/**
 * Ignore whitespace at the start and end of a line for alignment
 *
 * @param line
 * @returns Line
 */
const adjustOverflow = line => {
  const overflowLeft = getOverflowLeft(line);
  const overflowRight = getOverflowRight(line);
  const x = line.box.x - overflowLeft;
  const width = line.box.width + overflowLeft + overflowRight;
  const box = Object.assign({}, line.box, {
    x,
    width
  });
  return Object.assign({}, line, {
    box,
    overflowLeft,
    overflowRight
  });
};
/**
 * Performs line justification by calling appropiate engine
 *
 * @param engines - Engines
 * @param options - Layout options
 * @param align - Text align
 */
const justifyLine$1 = (engines, options, align) => {
  /**
   * @param line - Line
   * @returns Line
   */
  return line => {
    const lineWidth = advanceWidth(line);
    const alignFactor = ALIGNMENT_FACTORS$1[align] || 0;
    const remainingWidth = Math.max(0, line.box.width - lineWidth);
    const shouldJustify = align === 'justify' || lineWidth > line.box.width;
    const x = line.box.x + remainingWidth * alignFactor;
    const box = Object.assign({}, line.box, {
      x
    });
    const newLine = Object.assign({}, line, {
      box
    });
    return shouldJustify ? engines.justification(options)(newLine) : newLine;
  };
};
const finalizeLine = line => {
  let lineAscent = 0;
  let lineDescent = 0;
  let lineHeight = 0;
  let lineXAdvance = 0;
  const runs = line.runs.map(run => {
    const height = height$1(run);
    const ascent = ascent$1(run);
    const descent$1 = descent(run);
    const xAdvance = advanceWidth$1(run);
    lineHeight = Math.max(lineHeight, height);
    lineAscent = Math.max(lineAscent, ascent);
    lineDescent = Math.max(lineDescent, descent$1);
    lineXAdvance += xAdvance;
    return Object.assign({}, run, {
      height,
      ascent,
      descent: descent$1,
      xAdvance
    });
  });
  return Object.assign({}, line, {
    runs,
    height: lineHeight,
    ascent: lineAscent,
    descent: lineDescent,
    xAdvance: lineXAdvance
  });
};
/**
 * Finalize line by performing line justification
 * and text decoration (using appropiate engines)
 *
 * @param engines - Engines
 * @param options - Layout options
 */
const finalizeBlock = (engines, options) => {
  /**
   * @param line - Line
   * @param i - Line index
   * @param lines - Total lines
   * @returns Line
   */
  return (line, index, lines) => {
    var _line$runs2, _line$runs2$;
    const isLastFragment = index === lines.length - 1;
    const style = ((_line$runs2 = line.runs) === null || _line$runs2 === void 0 ? void 0 : (_line$runs2$ = _line$runs2[0]) === null || _line$runs2$ === void 0 ? void 0 : _line$runs2$.attributes) || {};
    const align = isLastFragment ? style.alignLastLine : style.align;
    return compose(finalizeLine, engines.textDecoration(), justifyLine$1(engines, options, align), adjustOverflow, removeNewLine)(line);
  };
};
/**
 * Finalize line block by performing line justification
 * and text decoration (using appropiate engines)
 *
 * @param engines - Engines
 * @param options - Layout options
 */
const finalizeFragments = (engines, options) => {
  /**
   * @param paragraphs - Paragraphs
   * @returns Paragraphs
   */
  return paragraphs => {
    const blockFinalizer = finalizeBlock(engines, options);
    return paragraphs.map(paragraph => paragraph.map(blockFinalizer));
  };
};
const ATTACHMENT_CODE = 0xfffc; // 65532
const isReplaceGlyph = glyph => glyph.codePoints.includes(ATTACHMENT_CODE);
/**
 * Resolve attachments of run
 *
 * @param run
 * @returns Run
 */
const resolveRunAttachments = run => {
  var _run$attributes9;
  if (!run.positions) return run;
  const glyphs = run.glyphs || [];
  const attachment = (_run$attributes9 = run.attributes) === null || _run$attributes9 === void 0 ? void 0 : _run$attributes9.attachment;
  if (!attachment) return run;
  const positions = run.positions.map((position, i) => {
    const glyph = glyphs[i];
    if (attachment.width && isReplaceGlyph(glyph)) {
      return Object.assign({}, position, {
        xAdvance: attachment.width
      });
    }
    return Object.assign({}, position);
  });
  return Object.assign({}, run, {
    positions
  });
};
/**
 * Resolve attachments for multiple paragraphs
 */
const resolveAttachments = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string
   */
  return attributedString => {
    const runs = attributedString.runs.map(resolveRunAttachments);
    const res = Object.assign({}, attributedString, {
      runs
    });
    return res;
  };
};

/**
 * @param attributes - Attributes
 * @returns Attributes with defaults
 */
const applyAttributes = a => {
  return {
    align: a.align || (a.direction === 'rtl' ? 'right' : 'left'),
    alignLastLine: a.alignLastLine || (a.align === 'justify' ? 'left' : a.align || 'left'),
    attachment: a.attachment || null,
    backgroundColor: a.backgroundColor || null,
    bullet: a.bullet || null,
    characterSpacing: a.characterSpacing || 0,
    color: a.color || 'black',
    direction: a.direction || 'ltr',
    features: a.features || [],
    fill: a.fill !== false,
    font: a.font || [],
    fontSize: a.fontSize || 12,
    hangingPunctuation: a.hangingPunctuation || false,
    hyphenationFactor: a.hyphenationFactor || 0,
    indent: a.indent || 0,
    justificationFactor: a.justificationFactor || 1,
    lineHeight: a.lineHeight || null,
    lineSpacing: a.lineSpacing || 0,
    link: a.link || null,
    marginLeft: a.marginLeft || a.margin || 0,
    marginRight: a.marginRight || a.margin || 0,
    opacity: a.opacity,
    paddingTop: a.paddingTop || a.padding || 0,
    paragraphSpacing: a.paragraphSpacing || 0,
    script: a.script || null,
    shrinkFactor: a.shrinkFactor || 0,
    strike: a.strike || false,
    strikeColor: a.strikeColor || a.color || 'black',
    strikeStyle: a.strikeStyle || 'solid',
    stroke: a.stroke || false,
    underline: a.underline || false,
    underlineColor: a.underlineColor || a.color || 'black',
    underlineStyle: a.underlineStyle || 'solid',
    verticalAlign: a.verticalAlign || null,
    wordSpacing: a.wordSpacing || 0,
    yOffset: a.yOffset || 0
  };
};
/**
 * Apply default style to run
 *
 * @param run - Run
 * @returns Run with default styles
 */
const applyRunStyles = run => {
  const attributes = applyAttributes(run.attributes);
  return Object.assign({}, run, {
    attributes
  });
};
/**
 * Apply default attributes for an attributed string
 */
const applyDefaultStyles = () => {
  return attributedString => {
    const string = attributedString.string || '';
    const runs = (attributedString.runs || []).map(applyRunStyles);
    return {
      string,
      runs
    };
  };
};

/**
 * Apply scaling and yOffset for verticalAlign 'sub' and 'super'.
 */
const verticalAlignment = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string
   */
  return attributedString => {
    attributedString.runs.forEach(run => {
      const {
        attributes
      } = run;
      const {
        verticalAlign
      } = attributes;
      if (verticalAlign === 'sub') {
        attributes.yOffset = -0.2;
      } else if (verticalAlign === 'super') {
        attributes.yOffset = 0.4;
      }
    });
    return attributedString;
  };
};
const bidi$1 = bidiFactory();
/**
 * @param runs
 * @returns Bidi levels
 */
const getBidiLevels = runs => {
  return runs.reduce((acc, run) => {
    const length = run.end - run.start;
    const levels = repeat(run.attributes.bidiLevel, length);
    return acc.concat(levels);
  }, []);
};
/**
 * Perform bidi mirroring
 */
const mirrorString = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string
   */
  return attributedString => {
    const levels = getBidiLevels(attributedString.runs);
    let updatedString = '';
    attributedString.string.split('').forEach((char, index) => {
      const isRTL = levels[index] % 2 === 1;
      const mirroredChar = isRTL ? bidi$1.getMirroredCharacter(attributedString.string.charAt(index)) : null;
      updatedString += mirroredChar || char;
    });
    const result = {
      ...attributedString,
      string: updatedString
    };
    return result;
  };
};

/**
 * A LayoutEngine is the main object that performs text layout.
 * It accepts an AttributedString and a Container object
 * to layout text into, and uses several helper objects to perform
 * various layout tasks. These objects can be overridden to customize
 * layout behavior.
 */
const layoutEngine = engines => {
  return function (attributedString, container, options) {
    if (options === void 0) {
      options = {};
    }
    const processParagraph = compose(resolveYOffset(), resolveAttachments(), verticalAlignment(), generateGlyphs(), wrapWords(engines, options), mirrorString(), preprocessRuns(engines));
    const processParagraphs = paragraphs => paragraphs.map(processParagraph);
    return compose(finalizeFragments(engines, options), bidiReordering(), typesetter(engines, options, container), processParagraphs, splitParagraphs(), applyDefaultStyles())(attributedString);
  };
};
const bidi = bidiFactory();
const bidiEngine = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string
   */
  return attributedString => {
    var _attributedString$run;
    const {
      string
    } = attributedString;
    const direction = (_attributedString$run = attributedString.runs[0]) === null || _attributedString$run === void 0 ? void 0 : _attributedString$run.attributes.direction;
    const {
      levels
    } = bidi.getEmbeddingLevels(string, direction);
    let lastLevel = null;
    let lastIndex = 0;
    let index = 0;
    const runs = [];
    for (let i = 0; i < levels.length; i += 1) {
      const level = levels[i];
      if (level !== lastLevel) {
        if (lastLevel !== null) {
          runs.push({
            start: lastIndex,
            end: index,
            attributes: {
              bidiLevel: lastLevel
            }
          });
        }
        lastIndex = index;
        lastLevel = level;
      }
      index += 1;
    }
    if (lastIndex < string.length) {
      runs.push({
        start: lastIndex,
        end: string.length,
        attributes: {
          bidiLevel: lastLevel
        }
      });
    }
    const result = {
      string,
      runs
    };
    return result;
  };
};
const INFINITY = 10000;
const skipPastGlueAndPenalty = (nodes, start) => {
  let j = start + 1;
  for (; j < nodes.length; j++) {
    if (nodes[j].type !== 'glue' && nodes[j].type !== 'penalty') {
      break;
    }
  }
  return nodes[j - 1];
};
const getNextBreakpoint = (subnodes, widths, lineNumber) => {
  let position = null;
  let minimumBadness = Infinity;
  const sum = {
    width: 0,
    stretch: 0,
    shrink: 0
  };
  const lineLength = widths[Math.min(lineNumber, widths.length - 1)];
  const calculateRatio = node => {
    const stretch = 'stretch' in node ? node.stretch : null;
    if (sum.width < lineLength) {
      if (!stretch) return INFINITY;
      return sum.stretch - stretch > 0 ? (lineLength - sum.width) / sum.stretch : INFINITY;
    }
    const shrink = 'shrink' in node ? node.shrink : null;
    if (sum.width > lineLength) {
      if (!shrink) return INFINITY;
      return sum.shrink - shrink > 0 ? (lineLength - sum.width) / sum.shrink : INFINITY;
    }
    return 0;
  };
  let hyphenWidth = 0;
  for (let i = 0; i < subnodes.length; i += 1) {
    const node = subnodes[i];
    if (node.type === 'box') {
      sum.width += node.width;
    }
    if (node.type === 'glue') {
      sum.width += node.width;
      sum.stretch += node.stretch;
      sum.shrink += node.shrink;
    }
    const potentialEndOfLine = skipPastGlueAndPenalty(subnodes, i);
    hyphenWidth = potentialEndOfLine.type === 'penalty' ? potentialEndOfLine.width : 0;
    if (sum.width - sum.shrink + hyphenWidth > lineLength) {
      if (position === null) {
        let j = i === 0 ? i + 1 : i;
        while (j < subnodes.length && (subnodes[j].type === 'glue' || subnodes[j].type === 'penalty')) {
          j++;
        }
        position = j - 1;
      }
      break;
    }
    if (node.type === 'penalty' || node.type === 'glue') {
      const ratio = calculateRatio(node);
      const penalty = node.type === 'penalty' ? node.penalty : 0;
      const badness = 100 * Math.abs(ratio) ** 3 + penalty;
      if (minimumBadness >= badness) {
        position = i;
        minimumBadness = badness;
      }
    }
  }
  return sum.width - sum.shrink + hyphenWidth > lineLength ? position : null;
};
const applyBestFit = (nodes, widths) => {
  let count = 0;
  let lineNumber = 0;
  let subnodes = nodes;
  const breakpoints = [0];
  while (subnodes.length > 0) {
    const breakpoint = getNextBreakpoint(subnodes, widths, lineNumber);
    if (breakpoint !== null) {
      count += breakpoint;
      breakpoints.push(count);
      subnodes = subnodes.slice(breakpoint + 1, subnodes.length);
      count++;
      lineNumber++;
    } else {
      subnodes = [];
    }
  }
  return breakpoints;
};

/* eslint-disable max-classes-per-file */
class LinkedListNode {
  constructor(data) {
    this.data = void 0;
    this.prev = void 0;
    this.next = void 0;
    this.data = data;
    this.prev = null;
    this.next = null;
  }
}
class LinkedList {
  constructor() {
    this.head = void 0;
    this.tail = void 0;
    this.listSize = void 0;
    this.listLength = void 0;
    this.head = null;
    this.tail = null;
    this.listSize = 0;
    this.listLength = 0;
  }
  isLinked(node) {
    return !(node && node.prev === null && node.next === null && this.tail !== node && this.head !== node || this.isEmpty());
  }
  size() {
    return this.listSize;
  }
  isEmpty() {
    return this.listSize === 0;
  }
  first() {
    return this.head;
  }
  last() {
    return this.last;
  }
  forEach(callback) {
    let node = this.head;
    while (node !== null) {
      callback(node);
      node = node.next;
    }
  }
  at(i) {
    let node = this.head;
    let index = 0;
    if (i >= this.listLength || i < 0) {
      return null;
    }
    while (node !== null) {
      if (i === index) {
        return node;
      }
      node = node.next;
      index += 1;
    }
    return null;
  }
  insertAfter(node, newNode) {
    if (!this.isLinked(node)) return this;
    newNode.prev = node;
    newNode.next = node.next;
    if (node.next === null) {
      this.tail = newNode;
    } else {
      node.next.prev = newNode;
    }
    node.next = newNode;
    this.listSize += 1;
    return this;
  }
  insertBefore(node, newNode) {
    if (!this.isLinked(node)) return this;
    newNode.prev = node.prev;
    newNode.next = node;
    if (node.prev === null) {
      this.head = newNode;
    } else {
      node.prev.next = newNode;
    }
    node.prev = newNode;
    this.listSize += 1;
    return this;
  }
  push(node) {
    if (this.head === null) {
      this.unshift(node);
    } else {
      this.insertAfter(this.tail, node);
    }
    return this;
  }
  unshift(node) {
    if (this.head === null) {
      this.head = node;
      this.tail = node;
      node.prev = null;
      node.next = null;
      this.listSize += 1;
    } else {
      this.insertBefore(this.head, node);
    }
    return this;
  }
  remove(node) {
    if (!this.isLinked(node)) return this;
    if (node.prev === null) {
      this.head = node.next;
    } else {
      node.prev.next = node.next;
    }
    if (node.next === null) {
      this.tail = node.prev;
    } else {
      node.next.prev = node.prev;
    }
    this.listSize -= 1;
    return this;
  }
}

/**
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * All rights reserved.
 */
LinkedList.Node = LinkedListNode;
function breakpoint(position, demerits, line, fitnessClass, totals, previous) {
  return {
    position,
    demerits,
    line,
    fitnessClass,
    totals: totals || {
      width: 0,
      stretch: 0,
      shrink: 0
    },
    previous
  };
}
function computeCost(nodes, lineLengths, sum, end, active, currentLine) {
  let width = sum.width - active.totals.width;
  let stretch = 0;
  let shrink = 0;
  // If the current line index is within the list of linelengths, use it, otherwise use
  // the last line length of the list.
  const lineLength = currentLine < lineLengths.length ? lineLengths[currentLine - 1] : lineLengths[lineLengths.length - 1];
  if (nodes[end].type === 'penalty') {
    width += nodes[end].width;
  }
  // Calculate the stretch ratio
  if (width < lineLength) {
    stretch = sum.stretch - active.totals.stretch;
    if (stretch > 0) {
      return (lineLength - width) / stretch;
    }
    return linebreak.infinity;
  }
  // Calculate the shrink ratio
  if (width > lineLength) {
    shrink = sum.shrink - active.totals.shrink;
    if (shrink > 0) {
      return (lineLength - width) / shrink;
    }
    return linebreak.infinity;
  }
  // perfect match
  return 0;
}
// Add width, stretch and shrink values from the current
// break point up to the next box or forced penalty.
function computeSum(nodes, sum, breakPointIndex) {
  const result = {
    width: sum.width,
    stretch: sum.stretch,
    shrink: sum.shrink
  };
  for (let i = breakPointIndex; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.type === 'glue') {
      result.width += node.width;
      result.stretch += node.stretch;
      result.shrink += node.shrink;
    } else if (node.type === 'box' || node.type === 'penalty' && node.penalty === -linebreak.infinity && i > breakPointIndex) {
      break;
    }
  }
  return result;
}
function findBestBreakpoints(activeNodes) {
  const breakpoints = [];
  if (activeNodes.size() === 0) return [];
  let tmp = {
    data: {
      demerits: Infinity
    }
  };
  // Find the best active node (the one with the least total demerits.)
  activeNodes.forEach(node => {
    if (node.data.demerits < tmp.data.demerits) {
      tmp = node;
    }
  });
  while (tmp !== null) {
    breakpoints.push(tmp.data.position);
    tmp = tmp.data.previous;
  }
  return breakpoints.reverse();
}
/**
 * @param nodes
 * @param availableWidths
 * @param tolerance
 * @preserve Knuth and Plass line breaking algorithm in JavaScript
 */
const linebreak = (nodes, availableWidths, tolerance) => {
  // Demerits are used as a way to penalize bad line breaks
  //  - line: applied to each line, depending on how much spaces need to stretch or shrink
  //  - flagged: applied when consecutive lines end in hyphenation
  //  - fitness: algorithm groups lines into fitness classes based on how loose or tight the spacing is.
  //             if a paragraph has consecutive lines from different fitness classes,
  //             a fitness demerit is applied to maintain visual consistency.
  const options = {
    demerits: {
      line: 10,
      flagged: 100,
      fitness: 3000
    },
    tolerance: tolerance || 3
  };
  const activeNodes = new LinkedList();
  const sum = {
    width: 0,
    stretch: 0,
    shrink: 0
  };
  const lineLengths = availableWidths;
  // Add an active node for the start of the paragraph.
  activeNodes.push(new LinkedList.Node(breakpoint(0, 0, 0, 0, undefined, null)));
  // The main loop of the algorithm
  function mainLoop(node, index, nodes) {
    let active = activeNodes.first();
    // The inner loop iterates through all the active nodes with line < currentLine and then
    // breaks out to insert the new active node candidates before looking at the next active
    // nodes for the next lines. The result of this is that the active node list is always
    // sorted by line number.
    while (active !== null) {
      let currentLine = 0;
      // Candidates fo each fitness class
      const candidates = [{
        active: undefined,
        demerits: Infinity
      }, {
        active: undefined,
        demerits: Infinity
      }, {
        active: undefined,
        demerits: Infinity
      }, {
        active: undefined,
        demerits: Infinity
      }];
      // Iterate through the linked list of active nodes to find new potential active nodes and deactivate current active nodes.
      while (active !== null) {
        currentLine = active.data.line + 1;
        const ratio = computeCost(nodes, lineLengths, sum, index, active.data, currentLine);
        // Deactive nodes when the distance between the current active node and the
        // current node becomes too large (i.e. it exceeds the stretch limit and the stretch
        // ratio becomes negative) or when the current node is a forced break (i.e. the end
        // of the paragraph when we want to remove all active nodes, but possibly have a final
        // candidate active node---if the paragraph can be set using the given tolerance value.)
        if (ratio < -1 || node.type === 'penalty' && node.penalty === -linebreak.infinity) {
          activeNodes.remove(active);
        }
        // If the ratio is within the valid range of -1 <= ratio <= tolerance calculate the
        // total demerits and record a candidate active node.
        if (ratio >= -1 && ratio <= options.tolerance) {
          const badness = 100 * Math.pow(Math.abs(ratio), 3);
          let demerits = 0;
          // Positive penalty
          if (node.type === 'penalty' && node.penalty >= 0) {
            demerits = Math.pow(options.demerits.line + badness, 2) + Math.pow(node.penalty, 2);
            // Negative penalty but not a forced break
          } else if (node.type === 'penalty' && node.penalty !== -linebreak.infinity) {
            demerits = Math.pow(options.demerits.line + badness, 2) - Math.pow(node.penalty, 2);
            // All other cases
          } else {
            demerits = Math.pow(options.demerits.line + badness, 2);
          }
          if (node.type === 'penalty' && nodes[active.data.position].type === 'penalty') {
            demerits += options.demerits.flagged * node.flagged *
            // @ts-expect-error node is penalty here
            nodes[active.data.position].flagged;
          }
          // Calculate the fitness class for this candidate active node.
          let currentClass;
          if (ratio < -0.5) {
            currentClass = 0;
          } else if (ratio <= 0.5) {
            currentClass = 1;
          } else if (ratio <= 1) {
            currentClass = 2;
          } else {
            currentClass = 3;
          }
          // Add a fitness penalty to the demerits if the fitness classes of two adjacent lines differ too much.
          if (Math.abs(currentClass - active.data.fitnessClass) > 1) {
            demerits += options.demerits.fitness;
          }
          // Add the total demerits of the active node to get the total demerits of this candidate node.
          demerits += active.data.demerits;
          // Only store the best candidate for each fitness class
          if (demerits < candidates[currentClass].demerits) {
            candidates[currentClass] = {
              active,
              demerits
            };
          }
        }
        active = active.next;
        // Stop iterating through active nodes to insert new candidate active nodes in the active list
        // before moving on to the active nodes for the next line.
        // TODO: The Knuth and Plass paper suggests a conditional for currentLine < j0. This means paragraphs
        // with identical line lengths will not be sorted by line number. Find out if that is a desirable outcome.
        // For now I left this out, as it only adds minimal overhead to the algorithm and keeping the active node
        // list sorted has a higher priority.
        if (active !== null && active.data.line >= currentLine) {
          break;
        }
      }
      const tmpSum = computeSum(nodes, sum, index);
      for (let fitnessClass = 0; fitnessClass < candidates.length; fitnessClass += 1) {
        const candidate = candidates[fitnessClass];
        if (candidate.demerits === Infinity) continue;
        const newNode = new LinkedList.Node(breakpoint(index, candidate.demerits, candidate.active.data.line + 1, fitnessClass, tmpSum, candidate.active));
        if (active !== null) {
          activeNodes.insertBefore(active, newNode);
        } else {
          activeNodes.push(newNode);
        }
      }
    }
  }
  nodes.forEach((node, index, nodes) => {
    if (node.type === 'box') {
      sum.width += node.width;
      return;
    }
    if (node.type === 'glue') {
      const precedesBox = index > 0 && nodes[index - 1].type === 'box';
      if (precedesBox) mainLoop(node, index, nodes);
      sum.width += node.width;
      sum.stretch += node.stretch;
      sum.shrink += node.shrink;
      return;
    }
    if (node.type === 'penalty' && node.penalty !== linebreak.infinity) {
      mainLoop(node, index, nodes);
    }
  });
  return findBestBreakpoints(activeNodes);
};
linebreak.infinity = 10000;
linebreak.glue = (width, start, end, stretch, shrink) => ({
  type: 'glue',
  start,
  end,
  width,
  stretch,
  shrink
});
linebreak.box = function (width, start, end, hyphenated) {
  if (hyphenated === void 0) {
    hyphenated = false;
  }
  return {
    type: 'box',
    width,
    start,
    end,
    hyphenated
  };
};
linebreak.penalty = (width, penalty, flagged) => ({
  type: 'penalty',
  width,
  penalty,
  flagged
});

/**
 * Add scalar to run
 *
 * @param index - Scalar
 * @param run - Run
 * @returns Added run
 */
const add = (index, run) => {
  const start = run.start + index;
  const end = run.end + index;
  return Object.assign({}, run, {
    start,
    end
  });
};

/**
 * Get run length
 *
 * @param run - Run
 * @returns Length
 */
const length = run => {
  return run.end - run.start;
};

/**
 * Concats two runs into one
 *
 * @param runA - First run
 * @param runB - Second run
 * @returns Concatenated run
 */
const concat = (runA, runB) => {
  const end = runA.end + length(runB);
  const glyphs = (runA.glyphs || []).concat(runB.glyphs || []);
  const positions = (runA.positions || []).concat(runB.positions || []);
  const attributes = Object.assign({}, runA.attributes, runB.attributes);
  const runAIndices = runA.glyphIndices || [];
  const runALastIndex = last(runAIndices) || 0;
  const runBIndices = (runB.glyphIndices || []).map(i => i + runALastIndex + 1);
  const glyphIndices = normalize(runAIndices.concat(runBIndices));
  return Object.assign({}, runA, {
    end,
    glyphs,
    positions,
    attributes,
    glyphIndices
  });
};

/**
 * Insert glyph to run in the given index
 *
 * @param index - Index
 * @param glyph - Glyph
 * @param run - Run
 * @returns Run with glyph
 */
const insertGlyph$1 = (index, glyph, run) => {
  if (!glyph) return run;
  // Split resolves ligature splitting in case new glyph breaks some
  const leadingRun = slice$1(0, index, run);
  const trailingRun = slice$1(index, Infinity, run);
  return concat(append$1(glyph, leadingRun), trailingRun);
};
/**
 * Insert either glyph or code point to run in the given index
 *
 * @param index - Index
 * @param value - Glyph or codePoint
 * @param run - Run
 * @returns Run with glyph
 */
const insert = (index, value, run) => {
  const font = getFont(run);
  const glyph = isNumber$1(value) ? fromCodePoint(value, font) : value;
  return insertGlyph$1(index, glyph, run);
};

/**
 * Get run index at char index
 *
 * @param index - Char index
 * @param attributedString - Attributed string
 * @returns Run index
 */
const runIndexAt = (index, attributedString) => {
  return runIndexAt$1(index, attributedString.runs);
};

/**
 * Insert glyph into attributed string
 *
 * @param index - Index
 * @param glyph - Glyph or code point
 * @param attributedString - Attributed string
 * @returns Attributed string with new glyph
 */
const insertGlyph = (index, glyph, attributedString) => {
  const runIndex = runIndexAt(index, attributedString);
  // Add glyph to the end if run index invalid
  if (runIndex === -1) return append(glyph, attributedString);
  const codePoints = [glyph];
  const string = attributedString.string.slice(0, index) + stringFromCodePoints(codePoints) + attributedString.string.slice(index);
  const runs = attributedString.runs.map((run, i) => {
    if (i === runIndex) return insert(index - run.start, glyph, run);
    if (i > runIndex) return add(codePoints.length, run);
    return run;
  });
  return Object.assign({}, attributedString, {
    string,
    runs
  });
};

/**
 * Advance width between two string indices
 *
 * @param start - Glyph index
 * @param end - Glyph index
 * @param run - Run
 * @returns Advanced width run
 */
const advanceWidthBetween$1 = (start, end, run) => {
  const runStart = run.start || 0;
  const glyphStartIndex = Math.max(0, glyphIndexAt(start - runStart, run));
  const glyphEndIndex = Math.max(0, glyphIndexAt(end - runStart, run));
  const positions = (run.positions || []).slice(glyphStartIndex, glyphEndIndex);
  return advanceWidth$2(positions);
};

/**
 * Advance width between start and end
 * Does not consider ligature splitting for the moment.
 * Check performance impact on supporting this
 *
 * @param start - Start offset
 * @param end - End offset
 * @param attributedString
 * @returns Advance width
 */
const advanceWidthBetween = (start, end, attributedString) => {
  const runs = filter(start, end, attributedString.runs);
  return runs.reduce((acc, run) => acc + advanceWidthBetween$1(start, end, run), 0);
};
const HYPHEN = 0x002d;
const TOLERANCE_STEPS = 5;
const TOLERANCE_LIMIT = 50;
const opts = {
  width: 3,
  stretch: 6,
  shrink: 9
};
/**
 * Slice attributed string to many lines
 *
 * @param attributedString - Attributed string
 * @param nodes
 * @param breaks
 * @returns Attributed strings
 */
const breakLines = (attributedString, nodes, breaks) => {
  let start = 0;
  let end = null;
  const lines = breaks.reduce((acc, breakPoint) => {
    const node = nodes[breakPoint];
    const prevNode = nodes[breakPoint - 1];
    // Last breakpoint corresponds to K&P mandatory final glue
    if (breakPoint === nodes.length - 1) return acc;
    let line;
    if (node.type === 'penalty') {
      // @ts-expect-error penalty node will always preceed box or glue node
      end = prevNode.end;
      line = slice(start, end, attributedString);
      line = insertGlyph(line.string.length, HYPHEN, line);
    } else {
      end = node.end;
      line = slice(start, end, attributedString);
    }
    start = end;
    return [...acc, line];
  }, []);
  lines.push(slice(start, attributedString.string.length, attributedString));
  return lines;
};
/**
 * Return Knuth & Plass nodes based on line and previously calculated syllables
 *
 * @param attributedString - Attributed string
 * @param attributes - Attributes
 * @param options - Layout options
 * @returns ?
 */
const getNodes = (attributedString, _ref2, options) => {
  let {
    align
  } = _ref2;
  let start = 0;
  const hyphenWidth = 5;
  const {
    syllables
  } = attributedString;
  const hyphenPenalty = options.hyphenationPenalty || (align === 'justify' ? 100 : 600);
  const result = syllables.reduce((acc, s, index) => {
    const width = advanceWidthBetween(start, start + s.length, attributedString);
    if (s.trim() === '') {
      const stretch = width * opts.width / opts.stretch;
      const shrink = width * opts.width / opts.shrink;
      const end = start + s.length;
      // Add glue node. Glue nodes are used to fill the space between words.
      acc.push(linebreak.glue(width, start, end, stretch, shrink));
    } else {
      const hyphenated = syllables[index + 1] !== ' ';
      const end = start + s.length;
      // Add box node. Box nodes are used to represent words.
      acc.push(linebreak.box(width, start, end, hyphenated));
      if (syllables[index + 1] && hyphenated) {
        // Add penalty node. Penalty nodes are used to represent hyphenation points.
        acc.push(linebreak.penalty(hyphenWidth, hyphenPenalty, 1));
      }
    }
    start += s.length;
    return acc;
  }, []);
  // Add mandatory final glue
  result.push(linebreak.glue(0, start, start, linebreak.infinity, 0));
  result.push(linebreak.penalty(0, -linebreak.infinity, 1));
  return result;
};
/**
 * @param attributedString - Attributed string
 * @returns Attributes
 */
const getAttributes = attributedString => {
  var _attributedString$run2, _attributedString$run3;
  return ((_attributedString$run2 = attributedString.runs) === null || _attributedString$run2 === void 0 ? void 0 : (_attributedString$run3 = _attributedString$run2[0]) === null || _attributedString$run3 === void 0 ? void 0 : _attributedString$run3.attributes) || {};
};
/**
 * Performs Knuth & Plass line breaking algorithm
 * Fallbacks to best fit algorithm if latter not successful
 *
 * @param options - Layout options
 */
const linebreaker = options => {
  /**
   * @param attributedString - Attributed string
   * @param availableWidths - Available widths
   * @returns Attributed string
   */
  return (attributedString, availableWidths) => {
    let tolerance = options.tolerance || 4;
    const attributes = getAttributes(attributedString);
    const nodes = getNodes(attributedString, attributes, options);
    let breaks = linebreak(nodes, availableWidths, tolerance);
    // Try again with a higher tolerance if the line breaking failed.
    while (breaks.length === 0 && tolerance < TOLERANCE_LIMIT) {
      tolerance += TOLERANCE_STEPS;
      breaks = linebreak(nodes, availableWidths, tolerance);
    }
    if (breaks.length === 0 || breaks.length === 1 && breaks[0] === 0) {
      breaks = applyBestFit(nodes, availableWidths);
    }
    return breakLines(attributedString, nodes, breaks.slice(1));
  };
};
var Direction$1;
(function (Direction) {
  Direction[Direction["GROW"] = 0] = "GROW";
  Direction[Direction["SHRINK"] = 1] = "SHRINK";
})(Direction$1 || (Direction$1 = {}));
const WHITESPACE_PRIORITY = 1;
const LETTER_PRIORITY = 2;
const EXPAND_WHITESPACE_FACTOR = {
  before: 0.5,
  after: 0.5,
  priority: WHITESPACE_PRIORITY,
  unconstrained: false
};
const EXPAND_CHAR_FACTOR = {
  before: 0.14453125,
  // 37/256
  after: 0.14453125,
  priority: LETTER_PRIORITY,
  unconstrained: false
};
const SHRINK_WHITESPACE_FACTOR = {
  before: -0.04296875,
  // -11/256
  after: -0.04296875,
  priority: WHITESPACE_PRIORITY,
  unconstrained: false
};
const SHRINK_CHAR_FACTOR = {
  before: -0.04296875,
  after: -0.04296875,
  priority: LETTER_PRIORITY,
  unconstrained: false
};
const getCharFactor = (direction, options) => {
  const expandCharFactor = options.expandCharFactor || {};
  const shrinkCharFactor = options.shrinkCharFactor || {};
  return direction === Direction$1.GROW ? Object.assign({}, EXPAND_CHAR_FACTOR, expandCharFactor) : Object.assign({}, SHRINK_CHAR_FACTOR, shrinkCharFactor);
};
const getWhitespaceFactor = (direction, options) => {
  const expandWhitespaceFactor = options.expandWhitespaceFactor || {};
  const shrinkWhitespaceFactor = options.shrinkWhitespaceFactor || {};
  return direction === Direction$1.GROW ? Object.assign({}, EXPAND_WHITESPACE_FACTOR, expandWhitespaceFactor) : Object.assign({}, SHRINK_WHITESPACE_FACTOR, shrinkWhitespaceFactor);
};
const factor = (direction, options) => glyphs => {
  const charFactor = getCharFactor(direction, options);
  const whitespaceFactor = getWhitespaceFactor(direction, options);
  const factors = [];
  for (let index = 0; index < glyphs.length; index += 1) {
    let f;
    const glyph = glyphs[index];
    if (isWhiteSpace(glyph)) {
      f = Object.assign({}, whitespaceFactor);
      if (index === glyphs.length - 1) {
        f.before = 0;
        if (index > 0) {
          factors[index - 1].after = 0;
        }
      }
    } else if (glyph.isMark && index > 0) {
      f = Object.assign({}, factors[index - 1]);
      f.before = 0;
      factors[index - 1].after = 0;
    } else {
      f = Object.assign({}, charFactor);
    }
    factors.push(f);
  }
  return factors;
};
const getFactors = (gap, line, options) => {
  const direction = gap > 0 ? Direction$1.GROW : Direction$1.SHRINK;
  const getFactor = factor(direction, options);
  const factors = line.runs.reduce((acc, run) => {
    return acc.concat(getFactor(run.glyphs));
  }, []);
  factors[0].before = 0;
  factors[factors.length - 1].after = 0;
  return factors;
};
const KASHIDA_PRIORITY = 0;
const NULL_PRIORITY = 3;
const getDistances = (gap, factors) => {
  let total = 0;
  const priorities = [];
  const unconstrained = [];
  for (let priority = KASHIDA_PRIORITY; priority <= NULL_PRIORITY; priority += 1) {
    priorities[priority] = unconstrained[priority] = 0;
  }
  // sum the factors at each priority
  for (let j = 0; j < factors.length; j += 1) {
    const f = factors[j];
    const sum = f.before + f.after;
    total += sum;
    priorities[f.priority] += sum;
    if (f.unconstrained) {
      unconstrained[f.priority] += sum;
    }
  }
  // choose the priorities that need to be applied
  let highestPriority = -1;
  let highestPrioritySum = 0;
  let remainingGap = gap;
  let priority;
  for (priority = KASHIDA_PRIORITY; priority <= NULL_PRIORITY; priority += 1) {
    const prioritySum = priorities[priority];
    if (prioritySum !== 0) {
      if (highestPriority === -1) {
        highestPriority = priority;
        highestPrioritySum = prioritySum;
      }
      // if this priority covers the remaining gap, we're done
      if (Math.abs(remainingGap) <= Math.abs(prioritySum)) {
        priorities[priority] = remainingGap / prioritySum;
        unconstrained[priority] = 0;
        remainingGap = 0;
        break;
      }
      // mark that we need to use 100% of the adjustment from
      // this priority, and subtract the space that it consumes
      priorities[priority] = 1;
      remainingGap -= prioritySum;
      // if this priority has unconstrained glyphs, let them consume the remaining space
      if (unconstrained[priority] !== 0) {
        unconstrained[priority] = remainingGap / unconstrained[priority];
        remainingGap = 0;
        break;
      }
    }
  }
  // zero out remaining priorities (if any)
  for (let p = priority + 1; p <= NULL_PRIORITY; p += 1) {
    priorities[p] = 0;
    unconstrained[p] = 0;
  }
  // if there is still space left over, assign it to the highest priority that we saw.
  // this violates their factors, but it only happens in extreme cases
  if (remainingGap > 0 && highestPriority > -1) {
    priorities[highestPriority] = (highestPrioritySum + (gap - total)) / highestPrioritySum;
  }
  // create and return an array of distances to add to each glyph's advance
  const distances = [];
  for (let index = 0; index < factors.length; index += 1) {
    // the distance to add to this glyph is the sum of the space to add
    // after this glyph, and the space to add before the next glyph
    const f = factors[index];
    const next = factors[index + 1];
    let dist = f.after * priorities[f.priority];
    if (next) {
      dist += next.before * priorities[next.priority];
    }
    // if this glyph is unconstrained, add the unconstrained distance as well
    if (f.unconstrained) {
      dist += f.after * unconstrained[f.priority];
      if (next) {
        dist += next.before * unconstrained[next.priority];
      }
    }
    distances.push(dist);
  }
  return distances;
};

/**
 * Adjust run positions by given distances
 *
 * @param distances
 * @param line
 * @returns Line
 */
const justifyLine = (distances, line) => {
  let index = 0;
  for (const run of line.runs) {
    for (const position of run.positions) {
      position.xAdvance += distances[index++];
    }
  }
  return line;
};
/**
 * A JustificationEngine is used by a Typesetter to perform line fragment
 * justification. This implementation is based on a description of Apple's
 * justification algorithm from a PDF in the Apple Font Tools package.
 *
 * @param options - Layout options
 */
const justification = options => {
  /**
   * @param line
   * @returns Line
   */
  return line => {
    const gap = line.box.width - advanceWidth(line);
    if (gap === 0) return line; // Exact fit
    const factors = getFactors(gap, line, options);
    const distances = getDistances(gap, factors);
    return justifyLine(distances, line);
  };
};

/**
 * Returns attributed string ascent
 *
 * @param attributedString - Attributed string
 * @returns Ascent
 */
const ascent = attributedString => {
  const reducer = (acc, run) => Math.max(acc, ascent$1(run));
  return attributedString.runs.reduce(reducer, 0);
};

// The base font size used for calculating underline thickness.
const BASE_FONT_SIZE = 12;
/**
 * A TextDecorationEngine is used by a Typesetter to generate
 * DecorationLines for a line fragment, including underlines
 * and strikes.
 */
const textDecoration = () => line => {
  let x = line.overflowLeft || 0;
  const overflowRight = line.overflowRight || 0;
  const maxX = advanceWidth(line) - overflowRight;
  line.decorationLines = [];
  for (let i = 0; i < line.runs.length; i += 1) {
    const run = line.runs[i];
    const width = Math.min(maxX - x, advanceWidth$1(run));
    const thickness = Math.max(0.5, Math.floor(run.attributes.fontSize / BASE_FONT_SIZE));
    if (run.attributes.underline) {
      const rect = {
        x,
        y: ascent(line) + thickness * 2,
        width,
        height: thickness
      };
      const decorationLine = {
        rect,
        opacity: run.attributes.opacity,
        color: run.attributes.underlineColor || 'black',
        style: run.attributes.underlineStyle || 'solid'
      };
      line.decorationLines.push(decorationLine);
    }
    if (run.attributes.strike) {
      const y = ascent(line) - ascent$1(run) / 3;
      const rect = {
        x,
        y,
        width,
        height: thickness
      };
      const decorationLine = {
        rect,
        opacity: run.attributes.opacity,
        color: run.attributes.strikeColor || 'black',
        style: run.attributes.strikeStyle || 'solid'
      };
      line.decorationLines.push(decorationLine);
    }
    x += width;
  }
  return line;
};
const ignoredScripts = ['Common', 'Inherited', 'Unknown'];
/**
 * Resolves unicode script in runs, grouping equal runs together
 */
const scriptItemizer = () => {
  /**
   * @param attributedString - Attributed string
   * @returns Attributed string
   */
  return attributedString => {
    const {
      string
    } = attributedString;
    let lastScript = 'Unknown';
    let lastIndex = 0;
    let index = 0;
    const runs = [];
    if (!string) return empty();
    for (let i = 0; i < string.length; i += 1) {
      const char = string[i];
      const codePoint = char.codePointAt(0);
      const script = $747425b437e121da$export$2e2bcd8739ae039.getScript(codePoint);
      if (script !== lastScript && !ignoredScripts.includes(script)) {
        if (lastScript !== 'Unknown') {
          runs.push({
            start: lastIndex,
            end: index,
            attributes: {
              script: lastScript
            }
          });
        }
        lastIndex = index;
        lastScript = script;
      }
      index += char.length;
    }
    if (lastIndex < string.length) {
      runs.push({
        start: lastIndex,
        end: string.length,
        attributes: {
          script: lastScript
        }
      });
    }
    const result = {
      string,
      runs: runs
    };
    return result;
  };
};
const SOFT_HYPHEN = '\u00ad';
const hyphenator = hyphen$1(pattern);
/**
 * @param word
 * @returns Word parts
 */
const splitHyphen = word => {
  return word.split(SOFT_HYPHEN);
};
const cache = {};
/**
 * @param word
 * @returns Word parts
 */
const getParts = word => {
  const base = word.includes(SOFT_HYPHEN) ? word : hyphenator(word);
  return splitHyphen(base);
};
const wordHyphenation = () => {
  /**
   * @param word - Word
   * @returns Word parts
   */
  return word => {
    const cacheKey = `_${word}`;
    if (isNil(word)) return [];
    if (cache[cacheKey]) return cache[cacheKey];
    cache[cacheKey] = getParts(word);
    return cache[cacheKey];
  };
};
const IGNORED_CODE_POINTS = [173];
const getFontSize = run => run.attributes.fontSize || 12;
const pickFontFromFontStack = (codePoint, fontStack, lastFont) => {
  if (IGNORED_CODE_POINTS.includes(codePoint)) return lastFont;
  const fontStackWithFallback = [...fontStack, lastFont];
  for (let i = 0; i < fontStackWithFallback.length; i += 1) {
    const font = fontStackWithFallback[i];
    if (font && font.hasGlyphForCodePoint && font.hasGlyphForCodePoint(codePoint)) {
      return font;
    }
  }
  return fontStack.at(-1);
};
const fontSubstitution = () => _ref3 => {
  let {
    string,
    runs
  } = _ref3;
  let lastFont = null;
  let lastFontSize = null;
  let lastIndex = 0;
  let index = 0;
  const res = [];
  for (let i = 0; i < runs.length; i += 1) {
    const run = runs[i];
    if (string.length === 0) {
      res.push({
        start: 0,
        end: 0,
        attributes: {
          font: run.attributes.font
        }
      });
      break;
    }
    const chars = string.slice(run.start, run.end);
    for (let j = 0; j < chars.length; j += 1) {
      const char = chars[j];
      const codePoint = char.codePointAt(0);
      // If the default font does not have a glyph and the fallback font does, we use it
      const font = pickFontFromFontStack(codePoint, run.attributes.font, lastFont);
      const fontSize = getFontSize(run);
      // If anything that would impact res has changed, update it
      if (font !== lastFont || fontSize !== lastFontSize || font.unitsPerEm !== lastFont.unitsPerEm) {
        if (lastFont) {
          res.push({
            start: lastIndex,
            end: index,
            attributes: {
              font: [lastFont],
              scale: lastFontSize / lastFont.unitsPerEm
            }
          });
        }
        lastFont = font;
        lastFontSize = fontSize;
        lastIndex = index;
      }
      index += char.length;
    }
  }
  if (lastIndex < string.length) {
    const fontSize = getFontSize(last(runs));
    res.push({
      start: lastIndex,
      end: string.length,
      attributes: {
        font: [lastFont],
        scale: fontSize / lastFont.unitsPerEm
      }
    });
  }
  return {
    string,
    runs: res
  };
};

var loadYoga$2 = (() => {
  var _scriptDir = import.meta.url;
  return function (loadYoga) {
    loadYoga = loadYoga || {};
    var h;
    h || (h = typeof loadYoga !== 'undefined' ? loadYoga : {});
    var aa, ca;
    h.ready = new Promise(function (a, b) {
      aa = a;
      ca = b;
    });
    var da = Object.assign({}, h),
      q = "";
    "undefined" != typeof document && document.currentScript && (q = document.currentScript.src);
    _scriptDir && (q = _scriptDir);
    0 !== q.indexOf("blob:") ? q = q.substr(0, q.replace(/[?#].*/, "").lastIndexOf("/") + 1) : q = "";
    var ea = h.print || console.log.bind(console),
      v = h.printErr || console.warn.bind(console);
    Object.assign(h, da);
    da = null;
    var w;
    h.wasmBinary && (w = h.wasmBinary);
    h.noExitRuntime || true;
    "object" != typeof WebAssembly && x("no native wasm support detected");
    var fa,
      ha = false;
    function z(a, b, c) {
      c = b + c;
      for (var d = ""; !(b >= c);) {
        var e = a[b++];
        if (!e) break;
        if (e & 128) {
          var f = a[b++] & 63;
          if (192 == (e & 224)) d += String.fromCharCode((e & 31) << 6 | f);else {
            var g = a[b++] & 63;
            e = 224 == (e & 240) ? (e & 15) << 12 | f << 6 | g : (e & 7) << 18 | f << 12 | g << 6 | a[b++] & 63;
            65536 > e ? d += String.fromCharCode(e) : (e -= 65536, d += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023));
          }
        } else d += String.fromCharCode(e);
      }
      return d;
    }
    var ia, ja, A, C, ka, D, E, la, ma;
    function na() {
      var a = fa.buffer;
      ia = a;
      h.HEAP8 = ja = new Int8Array(a);
      h.HEAP16 = C = new Int16Array(a);
      h.HEAP32 = D = new Int32Array(a);
      h.HEAPU8 = A = new Uint8Array(a);
      h.HEAPU16 = ka = new Uint16Array(a);
      h.HEAPU32 = E = new Uint32Array(a);
      h.HEAPF32 = la = new Float32Array(a);
      h.HEAPF64 = ma = new Float64Array(a);
    }
    var oa,
      pa = [],
      qa = [],
      ra = [];
    function sa() {
      var a = h.preRun.shift();
      pa.unshift(a);
    }
    var F = 0,
      G = null;
    function x(a) {
      if (h.onAbort) h.onAbort(a);
      a = "Aborted(" + a + ")";
      v(a);
      ha = true;
      a = new WebAssembly.RuntimeError(a + ". Build with -sASSERTIONS for more info.");
      ca(a);
      throw a;
    }
    function ua(a) {
      return a.startsWith("data:application/octet-stream;base64,");
    }
    var H;
    H = "data:application/octet-stream;base64,AGFzbQEAAAABugM3YAF/AGACf38AYAF/AX9gA39/fwBgAn98AGACf38Bf2ADf39/AX9gBH9/f30BfWADf398AGAAAGAEf39/fwBgAX8BfGACf38BfGAFf39/f38Bf2AAAX9gA39/fwF9YAZ/f31/fX8AYAV/f39/fwBgAn9/AX1gBX9/f319AX1gAX8BfWADf35/AX5gB39/f39/f38AYAZ/f39/f38AYAR/f39/AX9gBn9/f319fQF9YAR/f31/AGADf399AX1gBn98f39/fwF/YAR/fHx/AGACf30AYAh/f39/f39/fwBgDX9/f39/f39/f39/f38AYAp/f39/f39/f39/AGAFf39/f38BfGAEfHx/fwF9YA1/fX1/f399fX9/f39/AX9gB39/f319f38AYAJ+fwF/YAN/fX0BfWABfAF8YAN/fHwAYAR/f319AGAHf39/fX19fQF9YA1/fX99f31/fX19fX1/AX9gC39/f39/f399fX19AX9gCH9/f39/f319AGAEf39+fgBgB39/f39/f38Bf2ACfH8BfGAFf398fH8AYAN/f38BfGAEf39/fABgA39/fQBgBn9/fX99fwF/ArUBHgFhAWEAHwFhAWIAAwFhAWMACQFhAWQAFgFhAWUAEQFhAWYAIAFhAWcAAAFhAWgAIQFhAWkAAwFhAWoAAAFhAWsAFwFhAWwACgFhAW0ABQFhAW4AAwFhAW8AAQFhAXAAFwFhAXEABgFhAXIAAAFhAXMAIgFhAXQACgFhAXUADQFhAXYAFgFhAXcAAgFhAXgAAwFhAXkAGAFhAXoAAgFhAUEAAQFhAUIAEQFhAUMAAQFhAUQAAAOiAqACAgMSBwcACRkDAAoRBgYKEwAPDxMBBiMTCgcHGgMUASQFJRQHAwMKCgMmAQYYDxobFAAKBw8KBwMDAgkCAAAFGwACBwIHBgIDAQMIDAABKAkHBQURACkZASoAAAIrLAIALQcHBy4HLwkFCgMCMA0xAgMJAgACAQYKAQIBBQEACQIFAQEABQAODQ0GFQIBHBUGAgkCEAAAAAUyDzMMBQYINAUCAwUODg41AgMCAgIDBgICNgIBDAwMAQsLCwsLCx0CAAIAAAABABABBQICAQMCEgMMCwEBAQEBAQsLAQICAwICAgICAgIDAgIICAEICAgEBAQEBAQEBAQABAQABAQEBAAE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GiABQQA2AvADIAFCADcC6AMgAigC7AMiAyACKALoAyIERwRAIAMgBGsiBEEASA0FIAEgBBAeIgM2AuwDIAEgAzYC6AMgASADIARqNgLwAyACKALoAyIEIAIoAuwDIghHBEADQCADIAQoAgA2AgAgA0EEaiEDIARBBGoiBCAIRw0ACwsgASADNgLsAwsgASACKQL0AzcC9AMgASACKAKEBDYChAQgASACKQL8AzcC/AMgAUEANgLkAwsgBSABNgIAIAEgADYC5AMLIAZBAWohBiAFQQRqIgUgB0cNAAsLDwsQAgALUAACQAJAAkACQAJAIAIOBAQAAQIDCyAAIAEgAUEwahBDDwsgACABIAFBMGogAxBEDwsgACABIAFBMGoQQg8LECQACyAAIAEgAUEwaiADEEULcAIBfwF9IwBBEGsiBCQAIARBCGogACABQQJ0QdwlaigCACACEDZDAADAfyEFAkACQAJAIAQtAAxBAWsOAgABAgsgBCoCCCEFDAELIAQqAgggA5RDCtcjPJQhBQsgBEEQaiQAIAVDAAAAACAFIAVbGwt5AgF/AX0jAEEQayIDJAAgA0EIaiAAIAFBAnRB7CVqKAIAIAIQU0MAAMB/IQQCQAJAAkAgAy0ADEEBaw4CAAECCyADKgIIIQQMAQsgAyoCCEMAAAAAlEMK1yM8lCEECyADQRBqJAAgBEMAAAAAl0MAAAAAIAQgBFsbC1QAAkACQAJAAkACQCACDgQEAAECAwsgACABIAFBwgBqEEMPCyAAIAEgAUHCAGogAxBEDwsgACABIAFBwgBqEEIPCxAkAAsgACABIAFBwgBqIAMQRQsvACAAIAJFQQF0IgIgASADEGAgACACIAEQS5IgACACIAEgAxB/IAAgAiABEFKSkgvOAQIDfwJ9IwBBEGsiAyQAQQEhBCADQQhqIABB/ABqIgUgACABQQF0akH2AGoiAS8BABAfAkACQCADKgIIIgcgAioCACIGXARAIAcgB1sEQCACLQAEIQIMAgsgBiAGXCEECyACLQAEIQIgBEUNACADLQAMIAJB/wFxRg0BCyAFIAEgBiACEDkDQCAALQAAIgFBBHENASAAIAFBBHI6AAAgACgCECIBBEAgACABEQAACyAAQYCAgP4HNgKcASAAKALkAyIADQALCyADQRBqJAALzgECA38CfSMAQRBrIgMk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AWsOAgABAgsgBCoCCCEFDAELIAQqAgggA5RDCtcjPJQhBQsgBEEQaiQAIAVDAAAAACAFIAVbGwscACAAIAFBCCACpyACQiCIpyADpyADQiCIpxAVCwUAEFgACzkAIABFBEBBAA8LAn8gAUGAf3FBgL8DRiABQf8ATXJFBEBB/DtBGTYCAEF/DAELIAAgAToAAEEBCwvEAgACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCABQQlrDhIACgsMCgsCAwQFDAsMDAoLBwgJCyACIAIoAgAiAUEEajYCACAAIAEoAgA2AgAPCwALIAIgAigCACIBQQRqNgIAIAAgATIBADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATMBADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATAAADcDAA8LIAIgAigCACIBQQRqNgIAIAAgATEAADcDAA8LAAsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRAQALDwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMAC84BAgN/An0jAEEQayIDJABBASEEIANBCGogAEH8AGoiBSAAIAFBAXRqQegAaiIBLwEAEB8CQAJAIAMqAggiByACKgIAIgZcBEAgByAHWwRAIAItAAQhAgwCCyAGIAZcIQQLIAItAAQhAiAERQ0AIAMtAAwgAkH/AXFGDQELIAUgASAGIAIQOQNAIAAtAAAiAUEEcQ0BIAAgAUEEcjoAACAAKAIQIgEEQCAAIAERAAALIABBgICA/gc2ApwBIAAoAuQDIgANAAsLIANBEGokAAtdAQR/IAAoAgAhAgNAIAIsAAAiAxBXBEBBfyEEIAAgAkEBaiICNgIAIAFBzJmz5gBNBH9BfyADQTBrIgMgAUEKbCIEaiADIARB/////wdzShsFIAQLIQEMAQsLIAELrhQCEn8BfiMAQdAAayIIJAAgCCABNgJMIAhBN2ohFyAIQThqIRQCQAJAAkACQANAIAEhDSAHIA5B/////wdzSg0BIAcgDmohDgJAAkACQCANIgctAAAiCQRAA0ACQAJAIAlB/wFxIgFFBEAgByEBDAELIAFBJUcNASAH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IQEgAEIANwIEIAAgATYCACABIAA2AgQgAkEQaiQAIAALGwEBfyAABEAgACgCACIBBEAgARAjCyAAECMLC0kBAn9BBBAeIQFBIBAeIgBBADYCHCAAQoCAgICAgIDAPzcCFCAAQgA3AgwgAEEAOgAIIABBAzYCBCAAQQA2AgAgASAANgIAIAELIAAgAkEFR0EAIAIbRQRAQbgwIAMgBBBJDwsgAyAEEHALIgEBfiABIAKtIAOtQiCGhCAEIAARFQAiBUIgiKckASAFpwuoAQEFfyAAKAJUIgMoAgAhBSADKAIEIgQgACgCFCAAKAIcIgdrIgYgBCAGSRsiBgRAIAUgByAGECsaIAMgAygCACAGaiIFNgIAIAMgAygCBCAGayIENgIECyAEIAIgAiAESxsiBARAIAUgASAEECsaIAMgAygCACAEaiIFNgIAIAMgAygCBCAEazYCBAsgBUEAOgAAIAAgACgCLCIBNgIcIAAgATYCFCACCwQAQgALBABBAAuKBQIGfgJ/IAEgASgCAEEHakF4cSIBQRBqNgIAIAAhCSABKQMAIQMgASkDCCEGIwBBIGsiCCQAAkAgBkL///////////8AgyIEQoCAgICAgMCAPH0gBEKAgICAgIDA/8MAfVQEQCAGQgSGIANCPIiEIQQgA0L//////////w+DIgNCgYCAgICAgIAIWgRAIARCgYCAgICAgIDAAHwhAgwCCyAEQoCAgICAgICAQH0hAiADQoCAgICAgICACFINASACIARCAYN8IQIMAQsgA1AgBEKAgICAgIDA//8AVCAEQoCAgICAgMD//wBRG0UEQCAGQgSGIANCPIiEQv////////8Dg0KAgICAgICA/P8AhCECDAELQoCAgICAgID4/wAhAiAEQv///////7//wwBWDQBCACECIARCMIinIgBBkfcASQ0AIAMhAiAGQv///////z+DQoCAgICAgMAAhCIFIQcCQCAAQYH3AGsiAUHAAHEEQCACIAFBQGqthiEHQgAhAgwBCyABRQ0AIAcgAa0iBIYgAkHAACABa62IhCEHIAIgBIYhAgsgCCACNwMQIAggBzcDGAJAQYH4ACAAayIAQcAAcQRAIAUgAEFAaq2IIQNCACEFDAELIABFDQAgBUHAACAAa62GIAMgAK0iAoiEIQMgBSACiCEFCyAIIAM3AwAgCCAF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ASAAKAIAIQAgASACQQFxBH8gASgCACAAaigCAAUgAAsRCwALYQECfyMAQRBrIgIkACABIAAoAgQiA0EBdWohASAAKAIAIQAgAiABIANBAXEEfyABKAIAIABqKAIABSAACxEBAEEQEB4iACACKQMINwMIIAAgAikDADcDACACQRBqJAAgAAtjAQJ/IwBBEGsiAyQAIAEgACgCBCIEQQF1aiEBIAAoAgAhACADIAEgAiAEQQFxBH8gASgCACAAaigCAAUgAAsRAwBBEBAeIgAgAykDCDcDCCAAIAMpAwA3AwAgA0EQaiQAIAALNwEBfyABIAAoAgQiA0EBdWohASAAKAIAIQAgASACIANBAXEEfyABKAIAIABqKAIABSAACxEEAAs5AQF/IAEgACgCBCIEQQF1aiEBIAAoAgAhACABIAIgAyAEQQFxBH8gASgCACAAaigCAAUgAAsRCAALCQAgASAAEQIACwUAQcM7Cw8AIAEgACgCAGogAjYCAAsNACABIAAoAgBqKAIACxgBAX9BEBAeIgBCADcDCCAAQQA2AgAgAAsYAQF/QRAQHiIAQgA3AwAgAEIANwMIIAALDABBMBAeQQBBMBAqCzcBAX8gASAAKAIEIgNBAXVqIQEgACgCACEAIAEgAiADQQFxBH8gASgCACAAaigCAAUgAAsRHgALBQBBvjsLIQAgACABKAIAIAEgASwAC0EASBtBuzsgAigCABAQNgIACyoBAX9BDBAeIgFBADoABCABIAAoAgA2AgggAEEANgIAIAFB2Cc2AgAgAQsFAEG7OwsFAEG4OwshACAAIAEoAgAgASABLAALQQBIG0GkOyACKAIAEBA2AgAL2AEBBH8jAEEgayIDJAAgASgCACIEQfD///8HSQRAAkACQCAEQQtPBEAgBEEPckEBaiIFEB4hBiADIAVBgICAgHhyNgIQIAMgBjYCCCADIAQ2AgwgBCAGaiEFDAELIAMgBDoAEyADQQhqIgYgBGohBSAERQ0BCyAGIAFBBGogBBArGgsgBUEAOgAAIAMgAjYCACADQRhqIANBCGogAyAAEQMAIAMoAhgQHSADKAIYIgAQBiADKAIAEAYgAywAE0EASARAIAMoAggQIwsgA0EgaiQAIAAPCxACAAsqAQF/QQwQHiIBQQA6AAQgASAAKAIANgIIIABBADYCACABQeAmNgIA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AkEIaiAIIAYQHyACIAcgAC8AABAfQQEhAyACKgIIIgogAioCACILXAR/IAogClsNAyALIAtcBSADC0UNAiACLQAMIAItAARHDQILIABBAmohAEEBIQMgBCEGQQEhBCAGRQ0ACyABLwB6IgBBB3FFBEAgBS0AekEHcUUNAgsgCCAAECAiCiAHIAUvAHoQICILWw0BIAogClsNACALIAtcDQELIAFBFGogBUEUakHoABArGiABQfwAaiAFQfwAahCgAQNAIAEtAAAiAEEEcQ0BIAEgAEEEcjoAACABKAIQIgAEQCABIAARAAALIAFBgICA/gc2ApwBIAEoAuQDIgENAAsLIAJBEGokAAvGAwEEfyMAQaAEayICJAAgACgCBCEBIABBADYCBCABBEAgASABKAIAKAIEEQAACyAAKAIIIQEgAEEANgIIIAEEQCABIAEoAgAoAgQRAAALAkAgACgCACIAKALoAyAAKALsA0YEQCAAKALkAw0BIAAgAkEYaiAAKAL0AxBcIgEpAgA3AgAgACABKAIQNgIQIAAgASkCCDcCCCAAQRRqIAFBFGpB6AAQKxogACABKQKMATcCjAEgACABKQKEATcChAEgACABKQJ8NwJ8IAEoApQBIQQgAUEANgKUASAAKAKUASEDIAAgBDYClAEgAwRAIAMQWwsgAEGYAWogAUGYAWpB0AIQKxogACgC6AMiAwRAIAAgAzYC7AMgAxAjCyAAIAEoAugDNgLoAyAAIAEoAuwDNgLsAyAAIAEoAvADNgLwAyABQQA2AvADIAFCADcC6AMgACABKQL8AzcC/AMgACABKQL0AzcC9AMgACABKAKEBDYChAQgASgClAEhACABQQA2ApQBIAAEQCAAEFsLIAJBoARqJAAPCyACQfAcNgIQIABBBUHYJSACQRBqECwQJAALIAJB5hE2AgAgAEEFQdglIAIQLBAkAAsLAEEMEB4gABCiAQsLAEEMEB5BABCiAQsNACAAKAIALQAIQQFxCwoAIAAoAgAoAhQLGQAgAUH/AXEEQBACAAsgACgCACgCEEEBcQsYACAAKAIAIgAgAC0ACEH+AXEgAXI6AAgLJgAgASAAKAIAIgAoAhRHBEAgACABNgIUIAAgACgCDEEBajYCDAsLkgEBAn8jAEEQayICJAAgACgCACEAIAFDAAAAAGAEQCABIAAqAhhcBEAgACABOAIYIAAgACgCDEEBajYCDAsgAkEQaiQADwsgAkGIFDYCACMAQRBrIgMkACADIAI2AgwCQCAARQRAQbgwQdglIAIQSRoMAQsgAEEAQQVB2CUgAiAAKAIEEQ0AGgsgA0EQaiQAECQACz8AIAFB/wFxRQRAIAIgACgCACIAKAIQIgFBAXFHBEAgACABQX5xIAJyNgIQIAAgACgCDEEBajYCDAsPCxACAAsL4CYjAEGACAuBHk9ubHkgbGVhZiBub2RlcyB3aXRoIGN1c3RvbSBtZWFzdXJlIGZ1bmN0aW9ucyBzaG91bGQgbWFudWFsbHkgbWFyayB0aGVtc2VsdmVzIGFzIGRpcnR5AGlzRGlydHkAbWFya0RpcnR5AGRlc3Ryb3kAc2V0RGlzcGxheQBnZXREaXNwbGF5AHNldEZsZXgALSsgICAwWDB4AC0wWCswWCAwWC0weCsweCAweABzZXRGbGV4R3JvdwBnZXRGbGV4R3JvdwBzZXRPdmVyZmxvdwBnZXRPdmVyZmxvdwBoYXNOZXdMYXlvdXQAY2FsY3VsYXRlTGF5b3V0AGdldENvbXB1dGVkTGF5b3V0AHVuc2lnbmVkIHNob3J0AGdldENoaWxkQ291bnQAdW5zaWduZWQgaW50AHNldEp1c3RpZnlDb250ZW50AGdldEp1c3RpZnlDb250ZW50AGF2YWlsYWJsZUhlaWdodCBpcyBpbmRlZmluaXRlIHNvIGhlaWdodFNpemluZ01vZGUgbXVzdCBiZSBTaXppbmdNb2RlOjpNYXhDb250ZW50AGF2YWlsYWJsZVdpZHRoIGlzIGluZGVmaW5pdGUgc28gd2lkdGhTaXppbmdNb2RlIG11c3QgYmUgU2l6aW5nTW9kZTo6TWF4Q29udGVudABzZXRBbGlnbkNvbnRlbnQAZ2V0QWxpZ25Db250ZW50AGdldFBhcmVudABpbXBsZW1lbnQAc2V0TWF4SGVpZ2h0UGVyY2VudABzZXRIZWlnaHRQZXJjZW50AHNldE1pbkhlaWdodFBlcmNlbnQAc2V0RmxleEJhc2lzUGVyY2VudABzZXRHYXBQZXJjZW50AHNldFBvc2l0aW9uUGVyY2VudABzZXRNYXJnaW5QZXJjZW50AHNldE1heFdpZHRoUGVyY2VudABzZXRXaWR0aFBlcmNlbnQAc2V0TWluV2lkdGhQZXJjZW50AHNldFBhZGRpbmdQZXJjZW50AGhhbmRsZS50eXBlKCkgPT0gU3R5bGVWYWx1ZUhhbmRsZTo6VHlwZTo6UG9pbnQgfHwgaGFuZGxlLnR5cGUoKSA9PSBTdHlsZVZhbHVlSGFuZGxlOjpUeXBlOjpQZXJjZW50AGNyZWF0ZURlZmF1bHQAdW5pdAByaWdodABoZWlnaHQAc2V0TWF4SGVpZ2h0AGdldE1heEhlaWdodABzZXRIZWlnaHQAZ2V0SGVpZ2h0AHNldE1pbkhlaWdodABnZXRNaW5IZWlnaHQAZ2V0Q29tcHV0ZWRIZWlnaHQAZ2V0Q29tcHV0ZWRSaWdodABsZWZ0AGdldENvbXB1dGVkTGVmdAByZXNldABfX2Rlc3RydWN0AGZsb2F0AHVpbnQ2NF90AHVzZVdlYkRlZmF1bHRzAHNldFVzZVdlYkRlZmF1bHRzAHNldEFsaWduSXRlbXMAZ2V0QWxpZ25JdGVtcwBzZXRGbGV4QmFzaXMAZ2V0RmxleEJhc2lzAENhbm5vdCBnZXQgbGF5b3V0IHByb3BlcnRpZXMgb2YgbXVsdGktZWRnZSBzaG9ydGhhbmRzAHNldFBvaW50U2NhbGVGYWN0b3IATWVhc3VyZUNhbGxiYWNrV3JhcHBlcgBEaXJ0aWVkQ2FsbGJhY2tXcmFwcGVyAENhbm5vdCByZXNldCBhIG5vZGUgc3RpbGwgYXR0YWNoZWQgdG8gYSBvd25lcgBzZXRCb3JkZXIAZ2V0Qm9yZGVyAGdldENvbXB1dGVkQm9yZGVyAGdldE51bWJlcgBoYW5kbGUudHlwZSgpID09IFN0eWxlVmFsdWVIYW5kbGU6OlR5cGU6Ok51bWJlcgB1bnNpZ25lZCBjaGFyAHRvcABnZXRDb21wdXRlZFRvcABzZXRGbGV4V3JhcABnZXRGbGV4V3JhcABzZXRHYXAAZ2V0R2FwACVwAHNldEhlaWdodEF1dG8Ac2V0RmxleEJhc2lzQXV0bwBzZXRQb3NpdGlvbkF1dG8Ac2V0TWFyZ2luQXV0bwBzZXRXaWR0aEF1dG8AU2NhbGUgZmFjdG9yIHNob3VsZCBub3QgYmUgbGVzcyB0aGFuIHplcm8Ac2V0QXNwZWN0UmF0aW8AZ2V0QXNwZWN0UmF0aW8Ac2V0UG9zaXRpb24AZ2V0UG9zaXRpb24Abm90aWZ5T25EZXN0cnVjdGlvbgBzZXRGbGV4RGlyZWN0aW9uAGdldEZsZXhEaXJlY3Rpb24Ac2V0RGlyZWN0aW9uAGdldERpcmVjdGlvbgBzZXRNYXJnaW4AZ2V0TWFyZ2luAGdldENvbXB1dGVkTWFyZ2luAG1hcmtMYXlvdXRTZWVuAG5hbgBib3R0b20AZ2V0Q29tcHV0ZWRCb3R0b20AYm9vbABlbXNjcmlwdGVuOjp2YWwAc2V0RmxleFNocmluawBnZXRGbGV4U2hyaW5rAHNldEFsd2F5c0Zvcm1zQ29udGFpbmluZ0Jsb2NrAE1lYXN1cmVDYWxsYmFjawBEaXJ0aWVkQ2FsbGJhY2sAZ2V0TGVuZ3RoAHdpZHRoAHNldE1heFdpZHRoAGdldE1heFdpZHRoAHNldFdpZHRoAGdldFdpZHRoAHNldE1pbldpZHRoAGdldE1pbldpZHRoAGdldENvbXB1dGVkV2lkdGgAcHVzaAAvaG9tZS9ydW5uZXIvd29yay95b2dhL3lvZ2EvamF2YXNjcmlwdC8uLi95b2dhL3N0eWxlL1NtYWxsVmFsdWVCdWZmZXIuaAAvaG9tZS9ydW5uZXIvd29yay95b2dhL3lvZ2EvamF2YXNjcmlwdC8uLi95b2dhL3N0eWxlL1N0eWxlVmFsdWVQb29sLmgAdW5zaWduZWQgbG9uZwBzZXRCb3hTaXppbmcAZ2V0Qm94U2l6aW5nAHN0ZDo6d3N0cmluZwBzdGQ6OnN0cmluZwBzdGQ6OnUxNnN0cmluZwBzdGQ6OnUzMnN0cmluZwBzZXRQYWRkaW5nAGdldFBhZGRpbmcAZ2V0Q29tcHV0ZWRQYWRkaW5nAFRyaWVkIHRvIGNvbnN0cnVjdCBZR05vZGUgd2l0aCBudWxsIGNvbmZpZwBBdHRlbXB0aW5nIHRvIGNvbnN0cnVjdCBOb2RlIHdpdGggbnVsbCBjb25maWcAY3JlYXRlV2l0aENvbmZpZwBpbmYAc2V0QWxpZ25TZWxmAGdldEFsaWduU2VsZgBTaXplAHZhbHVlAFZhbHVlAGNyZWF0ZQBtZWFzdXJlAHNldFBvc2l0aW9uVHlwZQBnZXRQb3NpdGlvblR5cGUAaXNSZWZlcmVuY2VCYXNlbGluZQBzZXRJc1JlZmVyZW5jZUJhc2VsaW5lAGNvcHlTdHlsZQBkb3VibGUATm9kZQBleHRlbmQAaW5zZXJ0Q2hpbGQAZ2V0Q2hpbGQAcmVtb3ZlQ2hpbGQAdm9pZABzZXRFeHBlcmltZW50YWxGZWF0dXJlRW5hYmxlZABpc0V4cGVyaW1lbnRhbEZlYXR1cmVFbmFibGVkAGRpcnRpZWQAQ2Fubm90IHJlc2V0IGEgbm9kZSB3aGljaCBzdGlsbCBoYXMgY2hpbGRyZW4gYXR0YWNoZWQAdW5zZXRNZWFzdXJlRnVuYwB1bnNldERpcnRpZWRGdW5jAHNldEVycmF0YQBnZXRFcnJhdGEATWVhc3VyZSBmdW5jdGlvbiByZXR1cm5lZCBhbiBpbnZhbGlkIGRpbWVuc2lvbiB0byBZb2dhOiBbd2lkdGg9JWYsIGhlaWdodD0lZl0ARXhwZWN0IGN1c3RvbSBiYXNlbGluZSBmdW5jdGlvbiB0byBub3QgcmV0dXJuIE5hTgBOQU4ASU5GAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4Ac3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVk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";
    if (!ua(H)) {
      var va = H;
      H = h.locateFile ? h.locateFile(va, q) : q + va;
    }
    function wa() {
      var a = H;
      try {
        if (a == H && w) return new Uint8Array(w);
        if (ua(a)) try {
          var b = xa(a.slice(37)),
            c = new Uint8Array(b.length);
          for (a = 0; a < b.length; ++a) c[a] = b.charCodeAt(a);
          var d = c;
        } catch (f) {
          throw Error("Converting base64 string to bytes failed.");
        } else d = void 0;
        var e = d;
        if (e) return e;
        throw "both async and sync fetching of the wasm failed";
      } catch (f) {
        x(f);
      }
    }
    function ya() {
      return w || "function" != typeof fetch ? Promise.resolve().then(function () {
        return wa();
      }) : fetch(H, {
        credentials: "same-origin"
      }).then(function (a) {
        if (!a.ok) throw "failed to load wasm binary file at '" + H + "'";
        return a.arrayBuffer();
      }).catch(function () {
        return wa();
      });
    }
    function za(a) {
      for (; 0 < a.length;) a.shift()(h);
    }
    function Aa(a) {
      if (void 0 === a) return "_unknown";
      a = a.replace(/[^a-zA-Z0-9_]/g, "$");
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? "_" + a : a;
    }
    function Ba(a, b) {
      a = Aa(a);
      return function () {
        return b.apply(this, arguments);
      };
    }
    var J = [{}, {
        value: void 0
      }, {
        value: null
      }, {
        value: true
      }, {
        value: false
      }],
      Ca = [];
    function Da(a) {
      var b = Error,
        c = Ba(a, function (d) {
          this.name = a;
          this.message = d;
          d = Error(d).stack;
          void 0 !== d && (this.stack = this.toString() + "\n" + d.replace(/^Error(:[^\n]*)?\n/, ""));
        });
      c.prototype = Object.create(b.prototype);
      c.prototype.constructor = c;
      c.prototype.toString = function () {
        return void 0 === this.message ? this.name : this.name + ": " + this.message;
      };
      return c;
    }
    var K = void 0;
    function L(a) {
      throw new K(a);
    }
    var M = a => {
        a || L("Cannot use deleted val. handle = " + a);
        return J[a].value;
      },
      Ea = a => {
        switch (a) {
          case void 0:
            return 1;
          case null:
            return 2;
          case true:
            return 3;
          case false:
            return 4;
          default:
            var b = Ca.length ? Ca.pop() : J.length;
            J[b] = {
              ga: 1,
              value: a
            };
            return b;
        }
      },
      Fa = void 0,
      Ga = void 0;
    function N(a) {
      for (var b = ""; A[a];) b += Ga[A[a++]];
      return b;
    }
    var O = [];
    function Ha() {
      for (; O.length;) {
        var a = O.pop();
        a.M.$ = false;
        a["delete"]();
      }
    }
    var P = void 0,
      Q = {};
    function Ia(a, b) {
      for (void 0 === b && L("ptr should not be undefined"); a.R;) b = a.ba(b), a = a.R;
      return b;
    }
    var R = {};
    function Ja(a) {
      a = Ka(a);
      var b = N(a);
      S(a);
      return b;
    }
    function La(a, b) {
      var c = R[a];
      void 0 === c && L(b + " has unknown type " + Ja(a));
      return c;
    }
    function Ma() {}
    var Na = false;
    function Oa(a) {
      --a.count.value;
      0 === a.count.value && (a.T ? a.U.W(a.T) : a.P.N.W(a.O));
    }
    function Pa(a, b, c) {
      if (b === c) return a;
      if (void 0 === c.R) return null;
      a = Pa(a, b, c.R);
      return null === a ? null : c.na(a);
    }
    var Qa = {};
    function Ra(a, b) {
      b = Ia(a, b);
      return Q[b];
    }
    var Sa = void 0;
    function Ta(a) {
      throw new Sa(a);
    }
    function Ua(a, b) {
      b.P && b.O || Ta("makeClassHandle requires ptr and ptrType");
      !!b.U !== !!b.T && Ta("Both smartPtrType and smartPtr must be specified");
      b.count = {
        value: 1
      };
      return T(Object.create(a, {
        M: {
          value: b
        }
      }));
    }
    function T(a) {
      if ("undefined" === typeof FinalizationRegistry) return T = b => b, a;
      Na = new FinalizationRegistry(b => {
        Oa(b.M);
      });
      T = b => {
        var c = b.M;
        c.T && Na.register(b, {
          M: c
        }, b);
        return b;
      };
      Ma = b => {
        Na.unregister(b);
      };
      return T(a);
    }
    var Va = {};
    function Wa(a) {
      for (; a.length;) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Xa(a) {
      return this.fromWireType(D[a >> 2]);
    }
    var U = {},
      Ya = {};
    function V(a, b, c) {
      function d(k) {
        k = c(k);
        k.length !== a.length && Ta("Mismatched type converter count");
        for (var m = 0; m < a.length; ++m) W(a[m], k[m]);
      }
      a.forEach(function (k) {
        Ya[k] = b;
      });
      var e = Array(b.length),
        f = [],
        g = 0;
      b.forEach((k, m) => {
        R.hasOwnProperty(k) ? e[m] = R[k] : (f.push(k), U.hasOwnProperty(k) || (U[k] = []), U[k].push(() => {
          e[m] = R[k];
          ++g;
          g === f.length && d(e);
        }));
      });
      0 === f.length && d(e);
    }
    function Za(a) {
      switch (a) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw new TypeError("Unknown type size: " + a);
      }
    }
    function W(a, b, c) {
      if (c === void 0) {
        c = {};
      }
      if (!("argPackAdvance" in b)) throw new TypeError("registerType registeredInstance requires argPackAdvance");
      var d = b.name;
      a || L('type "' + d + '" must have a positive integer typeid pointer');
      if (R.hasOwnProperty(a)) {
        if (c.ua) return;
        L("Cannot register type '" + d + "' twice");
      }
      R[a] = b;
      delete Ya[a];
      U.hasOwnProperty(a) && (b = U[a], delete U[a], b.forEach(e => e()));
    }
    function $a(a) {
      L(a.M.P.N.name + " instance already deleted");
    }
    function X() {}
    function ab(a, b, c) {
      if (void 0 === a[b].S) {
        var d = a[b];
        a[b] = function () {
          a[b].S.hasOwnProperty(arguments.length) || L("Function '" + c + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + a[b].S + ")!");
          return a[b].S[arguments.length].apply(this, arguments);
        };
        a[b].S = [];
        a[b].S[d.Z] = d;
      }
    }
    function bb(a, b) {
      h.hasOwnProperty(a) ? (L("Cannot register public name '" + a + "' twice"), ab(h, a, a), h.hasOwnProperty(void 0) && L("Cannot register multiple overloads of a function with the same number of arguments (undefined)!"), h[a].S[void 0] = b) : h[a] = b;
    }
    function cb(a, b, c, d, e, f, g, k) {
      this.name = a;
      this.constructor = b;
      this.X = c;
      this.W = d;
      this.R = e;
      this.pa = f;
      this.ba = g;
      this.na = k;
      this.ja = [];
    }
    function db(a, b, c) {
      for (; b !== c;) b.ba || L("Expected null or instance of " + c.name + ", got an instance of " + b.name), a = b.ba(a), b = b.R;
      return a;
    }
    function eb(a, b) {
      if (null === b) return this.ea && L("null is not a valid " + this.name), 0;
      b.M || L('Cannot pass "' + fb(b) + '" as a ' + this.name);
      b.M.O || L("Cannot pass deleted object as a pointer of type " + this.name);
      return db(b.M.O, b.M.P.N, this.N);
    }
    function gb(a, b) {
      if (null === b) {
        this.ea && L("null is not a valid " + this.name);
        if (this.da) {
          var c = this.fa();
          null !== a && a.push(this.W, c);
          return c;
        }
        return 0;
      }
      b.M || L('Cannot pass "' + fb(b) + '" as a ' + this.name);
      b.M.O || L("Cannot pass deleted object as a pointer of type " + this.name);
      !this.ca && b.M.P.ca && L("Cannot convert argument of type " + (b.M.U ? b.M.U.name : b.M.P.name) + " to parameter type " + this.name);
      c = db(b.M.O, b.M.P.N, this.N);
      if (this.da) switch (void 0 === b.M.T && L("Passing raw pointer to smart pointer is illegal"), this.Ba) {
        case 0:
          b.M.U === this ? c = b.M.T : L("Cannot convert argument of type " + (b.M.U ? b.M.U.name : b.M.P.name) + " to parameter type " + this.name);
          break;
        case 1:
          c = b.M.T;
          break;
        case 2:
          if (b.M.U === this) c = b.M.T;else {
            var d = b.clone();
            c = this.xa(c, Ea(function () {
              d["delete"]();
            }));
            null !== a && a.push(this.W, c);
          }
          break;
        default:
          L("Unsupporting sharing policy");
      }
      return c;
    }
    function hb(a, b) {
      if (null === b) return this.ea && L("null is not a valid " + this.name), 0;
      b.M || L('Cannot pass "' + fb(b) + '" as a ' + this.name);
      b.M.O || L("Cannot pass deleted object as a pointer of type " + this.name);
      b.M.P.ca && L("Cannot convert argument of type " + b.M.P.name + " to parameter type " + this.name);
      return db(b.M.O, b.M.P.N, this.N);
    }
    function Y(a, b, c, d) {
      this.name = a;
      this.N = b;
      this.ea = c;
      this.ca = d;
      this.da = false;
      this.W = this.xa = this.fa = this.ka = this.Ba = this.wa = void 0;
      void 0 !== b.R ? this.toWireType = gb : (this.toWireType = d ? eb : hb, this.V = null);
    }
    function ib(a, b) {
      h.hasOwnProperty(a) || Ta("Replacing nonexistant public symbol");
      h[a] = b;
      h[a].Z = void 0;
    }
    function jb(a, b) {
      var c = [];
      return function () {
        c.length = 0;
        Object.assign(c, arguments);
        if (a.includes("j")) {
          var d = h["dynCall_" + a];
          d = c && c.length ? d.apply(null, [b].concat(c)) : d.call(null, b);
        } else d = oa.get(b).apply(null, c);
        return d;
      };
    }
    function Z(a, b) {
      a = N(a);
      var c = a.includes("j") ? jb(a, b) : oa.get(b);
      "function" != typeof c && L("unknown function pointer with signature " + a + ": " + b);
      return c;
    }
    var mb = void 0;
    function nb(a, b) {
      function c(f) {
        e[f] || R[f] || (Ya[f] ? Ya[f].forEach(c) : (d.push(f), e[f] = true));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new mb(a + ": " + d.map(Ja).join([", "]));
    }
    function ob(a, b, c, d, e) {
      var f = b.length;
      2 > f && L("argTypes array size mismatch! Must at least get return value and 'this' types!");
      var g = null !== b[1] && null !== c,
        k = false;
      for (c = 1; c < b.length; ++c) if (null !== b[c] && void 0 === b[c].V) {
        k = true;
        break;
      }
      var m = "void" !== b[0].name,
        l = f - 2,
        n = Array(l),
        p = [],
        r = [];
      return function () {
        arguments.length !== l && L("function " + a + " called with " + arguments.length + " arguments, expected " + l + " args!");
        r.length = 0;
        p.length = g ? 2 : 1;
        p[0] = e;
        if (g) {
          var u = b[1].toWireType(r, this);
          p[1] = u;
        }
        for (var t = 0; t < l; ++t) n[t] = b[t + 2].toWireType(r, arguments[t]), p.push(n[t]);
        t = d.apply(null, p);
        if (k) Wa(r);else for (var y = g ? 1 : 2; y < b.length; y++) {
          var B = 1 === y ? u : n[y - 2];
          null !== b[y].V && b[y].V(B);
        }
        u = m ? b[0].fromWireType(t) : void 0;
        return u;
      };
    }
    function pb(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(E[b + 4 * d >> 2]);
      return c;
    }
    function qb(a) {
      4 < a && 0 === --J[a].ga && (J[a] = void 0, Ca.push(a));
    }
    function fb(a) {
      if (null === a) return "null";
      var b = typeof a;
      return "object" === b || "array" === b || "function" === b ? a.toString() : "" + a;
    }
    function rb(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(la[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(ma[c >> 3]);
          };
        default:
          throw new TypeError("Unknown float type: " + a);
      }
    }
    function sb(a, b, c) {
      switch (b) {
        case 0:
          return c ? function (d) {
            return ja[d];
          } : function (d) {
            return A[d];
          };
        case 1:
          return c ? function (d) {
            return C[d >> 1];
          } : function (d) {
            return ka[d >> 1];
          };
        case 2:
          return c ? function (d) {
            return D[d >> 2];
          } : function (d) {
            return E[d >> 2];
          };
        default:
          throw new TypeError("Unknown integer type: " + a);
      }
    }
    function tb(a, b) {
      for (var c = "", d = 0; !(d >= b / 2); ++d) {
        var e = C[a + 2 * d >> 1];
        if (0 == e) break;
        c += String.fromCharCode(e);
      }
      return c;
    }
    function ub(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) C[b >> 1] = a.charCodeAt(e), b += 2;
      C[b >> 1] = 0;
      return b - d;
    }
    function vb(a) {
      return 2 * a.length;
    }
    function wb(a, b) {
      for (var c = 0, d = ""; !(c >= b / 4);) {
        var e = D[a + 4 * c >> 2];
        if (0 == e) break;
        ++c;
        65536 <= e ? (e -= 65536, d += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023)) : d += String.fromCharCode(e);
      }
      return d;
    }
    function xb(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.charCodeAt(e);
        if (55296 <= f && 57343 >= f) {
          var g = a.charCodeAt(++e);
          f = 65536 + ((f & 1023) << 10) | g & 1023;
        }
        D[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      D[b >> 2] = 0;
      return b - d;
    }
    function yb(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }
      return b;
    }
    var zb = {};
    function Ab(a) {
      var b = zb[a];
      return void 0 === b ? N(a) : b;
    }
    var Bb = [];
    function Cb(a) {
      var b = Bb.length;
      Bb.push(a);
      return b;
    }
    function Db(a, b) {
      for (var c = Array(a), d = 0; d < a; ++d) c[d] = La(E[b + 4 * d >> 2], "parameter " + d);
      return c;
    }
    var Eb = [],
      Fb = [null, [], []];
    K = h.BindingError = Da("BindingError");
    h.count_emval_handles = function () {
      for (var a = 0, b = 5; b < J.length; ++b) void 0 !== J[b] && ++a;
      return a;
    };
    h.get_first_emval = function () {
      for (var a = 5; a < J.length; ++a) if (void 0 !== J[a]) return J[a];
      return null;
    };
    Fa = h.PureVirtualError = Da("PureVirtualError");
    for (var Gb = Array(256), Hb = 0; 256 > Hb; ++Hb) Gb[Hb] = String.fromCharCode(Hb);
    Ga = Gb;
    h.getInheritedInstanceCount = function () {
      return Object.keys(Q).length;
    };
    h.getLiveInheritedInstances = function () {
      var a = [],
        b;
      for (b in Q) Q.hasOwnProperty(b) && a.push(Q[b]);
      return a;
    };
    h.flushPendingDeletes = Ha;
    h.setDelayFunction = function (a) {
      P = a;
      O.length && P && P(Ha);
    };
    Sa = h.InternalError = Da("InternalError");
    X.prototype.isAliasOf = function (a) {
      if (!(this instanceof X && a instanceof X)) return false;
      var b = this.M.P.N,
        c = this.M.O,
        d = a.M.P.N;
      for (a = a.M.O; b.R;) c = b.ba(c), b = b.R;
      for (; d.R;) a = d.ba(a), d = d.R;
      return b === d && c === a;
    };
    X.prototype.clone = function () {
      this.M.O || $a(this);
      if (this.M.aa) return this.M.count.value += 1, this;
      var a = T,
        b = Object,
        c = b.create,
        d = Object.getPrototypeOf(this),
        e = this.M;
      a = a(c.call(b, d, {
        M: {
          value: {
            count: e.count,
            $: e.$,
            aa: e.aa,
            O: e.O,
            P: e.P,
            T: e.T,
            U: e.U
          }
        }
      }));
      a.M.count.value += 1;
      a.M.$ = false;
      return a;
    };
    X.prototype["delete"] = function () {
      this.M.O || $a(this);
      this.M.$ && !this.M.aa && L("Object already scheduled for deletion");
      Ma(this);
      Oa(this.M);
      this.M.aa || (this.M.T = void 0, this.M.O = void 0);
    };
    X.prototype.isDeleted = function () {
      return !this.M.O;
    };
    X.prototype.deleteLater = function () {
      this.M.O || $a(this);
      this.M.$ && !this.M.aa && L("Object already scheduled for deletion");
      O.push(this);
      1 === O.length && P && P(Ha);
      this.M.$ = true;
      return this;
    };
    Y.prototype.qa = function (a) {
      this.ka && (a = this.ka(a));
      return a;
    };
    Y.prototype.ha = function (a) {
      this.W && this.W(a);
    };
    Y.prototype.argPackAdvance = 8;
    Y.prototype.readValueFromPointer = Xa;
    Y.prototype.deleteObject = function (a) {
      if (null !== a) a["delete"]();
    };
    Y.prototype.fromWireType = function (a) {
      function b() {
        return this.da ? Ua(this.N.X, {
          P: this.wa,
          O: c,
          U: this,
          T: a
        }) : Ua(this.N.X, {
          P: this,
          O: a
        });
      }
      var c = this.qa(a);
      if (!c) return this.ha(a), null;
      var d = Ra(this.N, c);
      if (void 0 !== d) {
        if (0 === d.M.count.value) return d.M.O = c, d.M.T = a, d.clone();
        d = d.clone();
        this.ha(a);
        return d;
      }
      d = this.N.pa(c);
      d = Qa[d];
      if (!d) return b.call(this);
      d = this.ca ? d.la : d.pointerType;
      var e = Pa(c, this.N, d.N);
      return null === e ? b.call(this) : this.da ? Ua(d.N.X, {
        P: d,
        O: e,
        U: this,
        T: a
      }) : Ua(d.N.X, {
        P: d,
        O: e
      });
    };
    mb = h.UnboundTypeError = Da("UnboundTypeError");
    var xa = "function" == typeof atob ? atob : function (a) {
        var b = "",
          c = 0;
        a = a.replace(/[^A-Za-z0-9\+\/=]/g, "");
        do {
          var d = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
          var e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
          var f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
          var g = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
          d = d << 2 | e >> 4;
          e = (e & 15) << 4 | f >> 2;
          var k = (f & 3) << 6 | g;
          b += String.fromCharCode(d);
          64 !== f && (b += String.fromCharCode(e));
          64 !== g && (b += String.fromCharCode(k));
        } while (c < a.length);
        return b;
      },
      Jb = {
        l: function (a, b, c, d) {
          x("Assertion failed: " + (a ? z(A, a) : "") + ", at: " + [b ? b ? z(A, b) : "" : "unknown filename", c, d ? d ? z(A, d) : "" : "unknown function"]);
        },
        q: function (a, b, c) {
          a = N(a);
          b = La(b, "wrapper");
          c = M(c);
          var d = [].slice,
            e = b.N,
            f = e.X,
            g = e.R.X,
            k = e.R.constructor;
          a = Ba(a, function () {
            e.R.ja.forEach(function (l) {
              if (this[l] === g[l]) throw new Fa("Pure virtual function " + l + " must be implemented in JavaScript");
            }.bind(this));
            Object.defineProperty(this, "__parent", {
              value: f
            });
            this.__construct.apply(this, d.call(arguments));
          });
          f.__construct = function () {
            this === f && L("Pass correct 'this' to __construct");
            var l = k.implement.apply(void 0, [this].concat(d.call(arguments)));
            Ma(l);
            var n = l.M;
            l.notifyOnDestruction();
            n.aa = true;
            Object.defineProperties(this, {
              M: {
                value: n
              }
            });
            T(this);
            l = n.O;
            l = Ia(e, l);
            Q.hasOwnProperty(l) ? L("Tried to register registered instance: " + l) : Q[l] = this;
          };
          f.__destruct = function () {
            this === f && L("Pass correct 'this' to __destruct");
            Ma(this);
            var l = this.M.O;
            l = Ia(e, l);
            Q.hasOwnProperty(l) ? delete Q[l] : L("Tried to unregister unregistered instance: " + l);
          };
          a.prototype = Object.create(f);
          for (var m in c) a.prototype[m] = c[m];
          return Ea(a);
        },
        j: function (a) {
          var b = Va[a];
          delete Va[a];
          var c = b.fa,
            d = b.W,
            e = b.ia,
            f = e.map(g => g.ta).concat(e.map(g => g.za));
          V([a], f, g => {
            var k = {};
            e.forEach((m, l) => {
              var n = g[l],
                p = m.ra,
                r = m.sa,
                u = g[l + e.length],
                t = m.ya,
                y = m.Aa;
              k[m.oa] = {
                read: B => n.fromWireType(p(r, B)),
                write: (B, ba) => {
                  var I = [];
                  t(y, B, u.toWireType(I, ba));
                  Wa(I);
                }
              };
            });
            return [{
              name: b.name,
              fromWireType: function (m) {
                var l = {},
                  n;
                for (n in k) l[n] = k[n].read(m);
                d(m);
                return l;
              },
              toWireType: function (m, l) {
                for (var n in k) if (!(n in l)) throw new TypeError('Missing field:  "' + n + '"');
                var p = c();
                for (n in k) k[n].write(p, l[n]);
                null !== m && m.push(d, p);
                return p;
              },
              argPackAdvance: 8,
              readValueFromPointer: Xa,
              V: d
            }];
          });
        },
        v: function () {},
        B: function (a, b, c, d, e) {
          var f = Za(c);
          b = N(b);
          W(a, {
            name: b,
            fromWireType: function (g) {
              return !!g;
            },
            toWireType: function (g, k) {
              return k ? d : e;
            },
            argPackAdvance: 8,
            readValueFromPointer: function (g) {
              if (1 === c) var k = ja;else if (2 === c) k = C;else if (4 === c) k = D;else throw new TypeError("Unknown boolean type size: " + b);
              return this.fromWireType(k[g >> f]);
            },
            V: null
          });
        },
        f: function (a, b, c, d, e, f, g, k, m, l, n, p, r) {
          n = N(n);
          f = Z(e, f);
          k && (k = Z(g, k));
          l && (l = Z(m, l));
          r = Z(p, r);
          var u = Aa(n);
          bb(u, function () {
            nb("Cannot construct " + n + " due to unbound types", [d]);
          });
          V([a, b, c], d ? [d] : [], function (t) {
            t = t[0];
            if (d) {
              var y = t.N;
              var B = y.X;
            } else B = X.prototype;
            t = Ba(u, function () {
              if (Object.getPrototypeOf(this) !== ba) throw new K("Use 'new' to construct " + n);
              if (void 0 === I.Y) throw new K(n + " has no accessible constructor");
              var kb = I.Y[arguments.length];
              if (void 0 === kb) throw new K("Tried to invoke ctor of " + n + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(I.Y).toString() + ") parameters instead!");
              return kb.apply(this, arguments);
            });
            var ba = Object.create(B, {
              constructor: {
                value: t
              }
            });
            t.prototype = ba;
            var I = new cb(n, t, ba, r, y, f, k, l);
            y = new Y(n, I, true, false);
            B = new Y(n + "*", I, false, false);
            var lb = new Y(n + " const*", I, false, true);
            Qa[a] = {
              pointerType: B,
              la: lb
            };
            ib(u, t);
            return [y, B, lb];
          });
        },
        d: function (a, b, c, d, e, f, g) {
          var k = pb(c, d);
          b = N(b);
          f = Z(e, f);
          V([], [a], function (m) {
            function l() {
              nb("Cannot call " + n + " due to unbound types", k);
            }
            m = m[0];
            var n = m.name + "." + b;
            b.startsWith("@@") && (b = Symbol[b.substring(2)]);
            var p = m.N.constructor;
            void 0 === p[b] ? (l.Z = c - 1, p[b] = l) : (ab(p, b, n), p[b].S[c - 1] = l);
            V([], k, function (r) {
              r = ob(n, [r[0], null].concat(r.slice(1)), null, f, g);
              void 0 === p[b].S ? (r.Z = c - 1, p[b] = r) : p[b].S[c - 1] = r;
              return [];
            });
            return [];
          });
        },
        p: function (a, b, c, d, e, f) {
          0 < b || x();
          var g = pb(b, c);
          e = Z(d, e);
          V([], [a], function (k) {
            k = k[0];
            var m = "constructor " + k.name;
            void 0 === k.N.Y && (k.N.Y = []);
            if (void 0 !== k.N.Y[b - 1]) throw new K("Cannot register multiple constructors with identical number of parameters (" + (b - 1) + ") for class '" + k.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
            k.N.Y[b - 1] = () => {
              nb("Cannot construct " + k.name + " due to unbound types", g);
            };
            V([], g, function (l) {
              l.splice(1, 0, null);
              k.N.Y[b - 1] = ob(m, l, null, e, f);
              return [];
            });
            return [];
          });
        },
        a: function (a, b, c, d, e, f, g, k) {
          var m = pb(c, d);
          b = N(b);
          f = Z(e, f);
          V([], [a], function (l) {
            function n() {
              nb("Cannot call " + p + " due to unbound types", m);
            }
            l = l[0];
            var p = l.name + "." + b;
            b.startsWith("@@") && (b = Symbol[b.substring(2)]);
            k && l.N.ja.push(b);
            var r = l.N.X,
              u = r[b];
            void 0 === u || void 0 === u.S && u.className !== l.name && u.Z === c - 2 ? (n.Z = c - 2, n.className = l.name, r[b] = n) : (ab(r, b, p), r[b].S[c - 2] = n);
            V([], m, function (t) {
              t = ob(p, t, l, f, g);
              void 0 === r[b].S ? (t.Z = c - 2, r[b] = t) : r[b].S[c - 2] = t;
              return [];
            });
            return [];
          });
        },
        A: function (a, b) {
          b = N(b);
          W(a, {
            name: b,
            fromWireType: function (c) {
              var d = M(c);
              qb(c);
              return d;
            },
            toWireType: function (c, d) {
              return Ea(d);
            },
            argPackAdvance: 8,
            readValueFromPointer: Xa,
            V: null
          });
        },
        n: function (a, b, c) {
          c = Za(c);
          b = N(b);
          W(a, {
            name: b,
            fromWireType: function (d) {
              return d;
            },
            toWireType: function (d, e) {
              return e;
            },
            argPackAdvance: 8,
            readValueFromPointer: rb(b, c),
            V: null
          });
        },
        e: function (a, b, c, d, e) {
          b = N(b);
          -1 === e && (e = 4294967295);
          e = Za(c);
          var f = k => k;
          if (0 === d) {
            var g = 32 - 8 * c;
            f = k => k << g >>> g;
          }
          c = b.includes("unsigned") ? function (k, m) {
            return m >>> 0;
          } : function (k, m) {
            return m;
          };
          W(a, {
            name: b,
            fromWireType: f,
            toWireType: c,
            argPackAdvance: 8,
            readValueFromPointer: sb(b, e, 0 !== d),
            V: null
          });
        },
        b: function (a, b, c) {
          function d(f) {
            f >>= 2;
            var g = E;
            return new e(ia, g[f + 1], g[f]);
          }
          var e = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][b];
          c = N(c);
          W(a, {
            name: c,
            fromWireType: d,
            argPackAdvance: 8,
            readValueFromPointer: d
          }, {
            ua: true
          });
        },
        o: function (a, b) {
          b = N(b);
          var c = "std::string" === b;
          W(a, {
            name: b,
            fromWireType: function (d) {
              var e = E[d >> 2],
                f = d + 4;
              if (c) for (var g = f, k = 0; k <= e; ++k) {
                var m = f + k;
                if (k == e || 0 == A[m]) {
                  g = g ? z(A, g, m - g) : "";
                  if (void 0 === l) var l = g;else l += String.fromCharCode(0), l += g;
                  g = m + 1;
                }
              } else {
                l = Array(e);
                for (k = 0; k < e; ++k) l[k] = String.fromCharCode(A[f + k]);
                l = l.join("");
              }
              S(d);
              return l;
            },
            toWireType: function (d, e) {
              e instanceof ArrayBuffer && (e = new Uint8Array(e));
              var f,
                g = "string" == typeof e;
              g || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Int8Array || L("Cannot pass non-string to std::string");
              if (c && g) {
                var k = 0;
                for (f = 0; f < e.length; ++f) {
                  var m = e.charCodeAt(f);
                  127 >= m ? k++ : 2047 >= m ? k += 2 : 55296 <= m && 57343 >= m ? (k += 4, ++f) : k += 3;
                }
                f = k;
              } else f = e.length;
              k = Ib(4 + f + 1);
              m = k + 4;
              E[k >> 2] = f;
              if (c && g) {
                if (g = m, m = f + 1, f = A, 0 < m) {
                  m = g + m - 1;
                  for (var l = 0; l < e.length; ++l) {
                    var n = e.charCodeAt(l);
                    if (55296 <= n && 57343 >= n) {
                      var p = e.charCodeAt(++l);
                      n = 65536 + ((n & 1023) << 10) | p & 1023;
                    }
                    if (127 >= n) {
                      if (g >= m) break;
                      f[g++] = n;
                    } else {
                      if (2047 >= n) {
                        if (g + 1 >= m) break;
                        f[g++] = 192 | n >> 6;
                      } else {
                        if (65535 >= n) {
                          if (g + 2 >= m) break;
                          f[g++] = 224 | n >> 12;
                        } else {
                          if (g + 3 >= m) break;
                          f[g++] = 240 | n >> 18;
                          f[g++] = 128 | n >> 12 & 63;
                        }
                        f[g++] = 128 | n >> 6 & 63;
                      }
                      f[g++] = 128 | n & 63;
                    }
                  }
                  f[g] = 0;
                }
              } else if (g) for (g = 0; g < f; ++g) l = e.charCodeAt(g), 255 < l && (S(m), L("String has UTF-16 code units that do not fit in 8 bits")), A[m + g] = l;else for (g = 0; g < f; ++g) A[m + g] = e[g];
              null !== d && d.push(S, k);
              return k;
            },
            argPackAdvance: 8,
            readValueFromPointer: Xa,
            V: function (d) {
              S(d);
            }
          });
        },
        i: function (a, b, c) {
          c = N(c);
          if (2 === b) {
            var d = tb;
            var e = ub;
            var f = vb;
            var g = () => ka;
            var k = 1;
          } else 4 === b && (d = wb, e = xb, f = yb, g = () => E, k = 2);
          W(a, {
            name: c,
            fromWireType: function (m) {
              for (var l = E[m >> 2], n = g(), p, r = m + 4, u = 0; u <= l; ++u) {
                var t = m + 4 + u * b;
                if (u == l || 0 == n[t >> k]) r = d(r, t - r), void 0 === p ? p = r : (p += String.fromCharCode(0), p += r), r = t + b;
              }
              S(m);
              return p;
            },
            toWireType: function (m, l) {
              "string" != typeof l && L("Cannot pass non-string to C++ string type " + c);
              var n = f(l),
                p = Ib(4 + n + b);
              E[p >> 2] = n >> k;
              e(l, p + 4, n + b);
              null !== m && m.push(S, p);
              return p;
            },
            argPackAdvance: 8,
            readValueFromPointer: Xa,
            V: function (m) {
              S(m);
            }
          });
        },
        k: function (a, b, c, d, e, f) {
          Va[a] = {
            name: N(b),
            fa: Z(c, d),
            W: Z(e, f),
            ia: []
          };
        },
        h: function (a, b, c, d, e, f, g, k, m, l) {
          Va[a].ia.push({
            oa: N(b),
            ta: c,
            ra: Z(d, e),
            sa: f,
            za: g,
            ya: Z(k, m),
            Aa: l
          });
        },
        C: function (a, b) {
          b = N(b);
          W(a, {
            va: true,
            name: b,
            argPackAdvance: 0,
            fromWireType: function () {},
            toWireType: function () {}
          });
        },
        s: function (a, b, c, d, e) {
          a = Bb[a];
          b = M(b);
          c = Ab(c);
          var f = [];
          E[d >> 2] = Ea(f);
          return a(b, c, f, e);
        },
        t: function (a, b, c, d) {
          a = Bb[a];
          b = M(b);
          c = Ab(c);
          a(b, c, null, d);
        },
        g: qb,
        m: function (a, b) {
          var c = Db(a, b),
            d = c[0];
          b = d.name + "_$" + c.slice(1).map(function (g) {
            return g.name;
          }).join("_") + "$";
          var e = Eb[b];
          if (void 0 !== e) return e;
          var f = Array(a - 1);
          e = Cb((g, k, m, l) => {
            for (var n = 0, p = 0; p < a - 1; ++p) f[p] = c[p + 1].readValueFromPointer(l + n), n += c[p + 1].argPackAdvance;
            g = g[k].apply(g, f);
            for (p = 0; p < a - 1; ++p) c[p + 1].ma && c[p + 1].ma(f[p]);
            if (!d.va) return d.toWireType(m, g);
          });
          return Eb[b] = e;
        },
        D: function (a) {
          4 < a && (J[a].ga += 1);
        },
        r: function (a) {
          var b = M(a);
          Wa(b);
          qb(a);
        },
        c: function () {
          x("");
        },
        x: function (a, b, c) {
          A.copyWithin(a, b, b + c);
        },
        w: function (a) {
          var b = A.length;
          a >>>= 0;
          if (2147483648 < a) return false;
          for (var c = 1; 4 >= c; c *= 2) {
            var d = b * (1 + .2 / c);
            d = Math.min(d, a + 100663296);
            var e = Math;
            d = Math.max(a, d);
            e = e.min.call(e, 2147483648, d + (65536 - d % 65536) % 65536);
            a: {
              try {
                fa.grow(e - ia.byteLength + 65535 >>> 16);
                na();
                var f = 1;
                break a;
              } catch (g) {}
              f = void 0;
            }
            if (f) return true;
          }
          return false;
        },
        z: function () {
          return 52;
        },
        u: function () {
          return 70;
        },
        y: function (a, b, c, d) {
          for (var e = 0, f = 0; f < c; f++) {
            var g = E[b >> 2],
              k = E[b + 4 >> 2];
            b += 8;
            for (var m = 0; m < k; m++) {
              var l = A[g + m],
                n = Fb[a];
              0 === l || 10 === l ? ((1 === a ? ea : v)(z(n, 0)), n.length = 0) : n.push(l);
            }
            e += k;
          }
          E[d >> 2] = e;
          return 0;
        }
      };
    (function () {
      function a(e) {
        h.asm = e.exports;
        fa = h.asm.E;
        na();
        oa = h.asm.J;
        qa.unshift(h.asm.F);
        F--;
        h.monitorRunDependencies && h.monitorRunDependencies(F);
        0 == F && (G && (e = G, G = null, e()));
      }
      function b(e) {
        a(e.instance);
      }
      function c(e) {
        return ya().then(function (f) {
          return WebAssembly.instantiate(f, d);
        }).then(function (f) {
          return f;
        }).then(e, function (f) {
          v("failed to asynchronously prepare wasm: " + f);
          x(f);
        });
      }
      var d = {
        a: Jb
      };
      F++;
      h.monitorRunDependencies && h.monitorRunDependencies(F);
      if (h.instantiateWasm) try {
        return h.instantiateWasm(d, a);
      } catch (e) {
        v("Module.instantiateWasm callback failed with error: " + e), ca(e);
      }
      (function () {
        return w || "function" != typeof WebAssembly.instantiateStreaming || ua(H) || "function" != typeof fetch ? c(b) : fetch(H, {
          credentials: "same-origin"
        }).then(function (e) {
          return WebAssembly.instantiateStreaming(e, d).then(b, function (f) {
            v("wasm streaming compile failed: " + f);
            v("falling back to ArrayBuffer instantiation");
            return c(b);
          });
        });
      })().catch(ca);
      return {};
    })();
    h.___wasm_call_ctors = function () {
      return (h.___wasm_call_ctors = h.asm.F).apply(null, arguments);
    };
    var Ka = h.___getTypeName = function () {
      return (Ka = h.___getTypeName = h.asm.G).apply(null, arguments);
    };
    h.__embind_initialize_bindings = function () {
      return (h.__embind_initialize_bindings = h.asm.H).apply(null, arguments);
    };
    var Ib = h._malloc = function () {
        return (Ib = h._malloc = h.asm.I).apply(null, arguments);
      },
      S = h._free = function () {
        return (S = h._free = h.asm.K).apply(null, arguments);
      };
    h.dynCall_jiji = function () {
      return (h.dynCall_jiji = h.asm.L).apply(null, arguments);
    };
    var Kb;
    G = function Lb() {
      Kb || Mb();
      Kb || (G = Lb);
    };
    function Mb() {
      function a() {
        if (!Kb && (Kb = true, h.calledRun = true, !ha)) {
          za(qa);
          aa(h);
          if (h.onRuntimeInitialized) h.onRuntimeInitialized();
          if (h.postRun) for ("function" == typeof h.postRun && (h.postRun = [h.postRun]); h.postRun.length;) {
            var b = h.postRun.shift();
            ra.unshift(b);
          }
          za(ra);
        }
      }
      if (!(0 < F)) {
        if (h.preRun) for ("function" == typeof h.preRun && (h.preRun = [h.preRun]); h.preRun.length;) sa();
        za(pa);
        0 < F || (h.setStatus ? (h.setStatus("Running..."), setTimeout(function () {
          setTimeout(function () {
            h.setStatus("");
          }, 1);
          a();
        }, 1)) : a());
      }
    }
    if (h.preInit) for ("function" == typeof h.preInit && (h.preInit = [h.preInit]); 0 < h.preInit.length;) h.preInit.pop()();
    Mb();
    return loadYoga.ready;
  };
})();

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @generated by enums.py

let Align = /*#__PURE__*/function (Align) {
  Align[Align["Auto"] = 0] = "Auto";
  Align[Align["FlexStart"] = 1] = "FlexStart";
  Align[Align["Center"] = 2] = "Center";
  Align[Align["FlexEnd"] = 3] = "FlexEnd";
  Align[Align["Stretch"] = 4] = "Stretch";
  Align[Align["Baseline"] = 5] = "Baseline";
  Align[Align["SpaceBetween"] = 6] = "SpaceBetween";
  Align[Align["SpaceAround"] = 7] = "SpaceAround";
  Align[Align["SpaceEvenly"] = 8] = "SpaceEvenly";
  return Align;
}({});
let BoxSizing = /*#__PURE__*/function (BoxSizing) {
  BoxSizing[BoxSizing["BorderBox"] = 0] = "BorderBox";
  BoxSizing[BoxSizing["ContentBox"] = 1] = "ContentBox";
  return BoxSizing;
}({});
let Dimension = /*#__PURE__*/function (Dimension) {
  Dimension[Dimension["Width"] = 0] = "Width";
  Dimension[Dimension["Height"] = 1] = "Height";
  return Dimension;
}({});
let Direction = /*#__PURE__*/function (Direction) {
  Direction[Direction["Inherit"] = 0] = "Inherit";
  Direction[Direction["LTR"] = 1] = "LTR";
  Direction[Direction["RTL"] = 2] = "RTL";
  return Direction;
}({});
let Display = /*#__PURE__*/function (Display) {
  Display[Display["Flex"] = 0] = "Flex";
  Display[Display["None"] = 1] = "None";
  Display[Display["Contents"] = 2] = "Contents";
  return Display;
}({});
let Edge = /*#__PURE__*/function (Edge) {
  Edge[Edge["Left"] = 0] = "Left";
  Edge[Edge["Top"] = 1] = "Top";
  Edge[Edge["Right"] = 2] = "Right";
  Edge[Edge["Bottom"] = 3] = "Bottom";
  Edge[Edge["Start"] = 4] = "Start";
  Edge[Edge["End"] = 5] = "End";
  Edge[Edge["Horizontal"] = 6] = "Horizontal";
  Edge[Edge["Vertical"] = 7] = "Vertical";
  Edge[Edge["All"] = 8] = "All";
  return Edge;
}({});
let Errata = /*#__PURE__*/function (Errata) {
  Errata[Errata["None"] = 0] = "None";
  Errata[Errata["StretchFlexBasis"] = 1] = "StretchFlexBasis";
  Errata[Errata["AbsolutePositionWithoutInsetsExcludesPadding"] = 2] = "AbsolutePositionWithoutInsetsExcludesPadding";
  Errata[Errata["AbsolutePercentAgainstInnerSize"] = 4] = "AbsolutePercentAgainstInnerSize";
  Errata[Errata["All"] = 2147483647] = "All";
  Errata[Errata["Classic"] = 2147483646] = "Classic";
  return Errata;
}({});
let ExperimentalFeature = /*#__PURE__*/function (ExperimentalFeature) {
  ExperimentalFeature[ExperimentalFeature["WebFlexBasis"] = 0] = "WebFlexBasis";
  return ExperimentalFeature;
}({});
let FlexDirection = /*#__PURE__*/function (FlexDirection) {
  FlexDirection[FlexDirection["Column"] = 0] = "Column";
  FlexDirection[FlexDirection["ColumnReverse"] = 1] = "ColumnReverse";
  FlexDirection[FlexDirection["Row"] = 2] = "Row";
  FlexDirection[FlexDirection["RowReverse"] = 3] = "RowReverse";
  return FlexDirection;
}({});
let Gutter = /*#__PURE__*/function (Gutter) {
  Gutter[Gutter["Column"] = 0] = "Column";
  Gutter[Gutter["Row"] = 1] = "Row";
  Gutter[Gutter["All"] = 2] = "All";
  return Gutter;
}({});
let Justify = /*#__PURE__*/function (Justify) {
  Justify[Justify["FlexStart"] = 0] = "FlexStart";
  Justify[Justify["Center"] = 1] = "Center";
  Justify[Justify["FlexEnd"] = 2] = "FlexEnd";
  Justify[Justify["SpaceBetween"] = 3] = "SpaceBetween";
  Justify[Justify["SpaceAround"] = 4] = "SpaceAround";
  Justify[Justify["SpaceEvenly"] = 5] = "SpaceEvenly";
  return Justify;
}({});
let LogLevel = /*#__PURE__*/function (LogLevel) {
  LogLevel[LogLevel["Error"] = 0] = "Error";
  LogLevel[LogLevel["Warn"] = 1] = "Warn";
  LogLevel[LogLevel["Info"] = 2] = "Info";
  LogLevel[LogLevel["Debug"] = 3] = "Debug";
  LogLevel[LogLevel["Verbose"] = 4] = "Verbose";
  LogLevel[LogLevel["Fatal"] = 5] = "Fatal";
  return LogLevel;
}({});
let MeasureMode = /*#__PURE__*/function (MeasureMode) {
  MeasureMode[MeasureMode["Undefined"] = 0] = "Undefined";
  MeasureMode[MeasureMode["Exactly"] = 1] = "Exactly";
  MeasureMode[MeasureMode["AtMost"] = 2] = "AtMost";
  return MeasureMode;
}({});
let NodeType = /*#__PURE__*/function (NodeType) {
  NodeType[NodeType["Default"] = 0] = "Default";
  NodeType[NodeType["Text"] = 1] = "Text";
  return NodeType;
}({});
let Overflow = /*#__PURE__*/function (Overflow) {
  Overflow[Overflow["Visible"] = 0] = "Visible";
  Overflow[Overflow["Hidden"] = 1] = "Hidden";
  Overflow[Overflow["Scroll"] = 2] = "Scroll";
  return Overflow;
}({});
let PositionType = /*#__PURE__*/function (PositionType) {
  PositionType[PositionType["Static"] = 0] = "Static";
  PositionType[PositionType["Relative"] = 1] = "Relative";
  PositionType[PositionType["Absolute"] = 2] = "Absolute";
  return PositionType;
}({});
let Unit = /*#__PURE__*/function (Unit) {
  Unit[Unit["Undefined"] = 0] = "Undefined";
  Unit[Unit["Point"] = 1] = "Point";
  Unit[Unit["Percent"] = 2] = "Percent";
  Unit[Unit["Auto"] = 3] = "Auto";
  return Unit;
}({});
let Wrap = /*#__PURE__*/function (Wrap) {
  Wrap[Wrap["NoWrap"] = 0] = "NoWrap";
  Wrap[Wrap["Wrap"] = 1] = "Wrap";
  Wrap[Wrap["WrapReverse"] = 2] = "WrapReverse";
  return Wrap;
}({});
const constants = {
  ALIGN_AUTO: Align.Auto,
  ALIGN_FLEX_START: Align.FlexStart,
  ALIGN_CENTER: Align.Center,
  ALIGN_FLEX_END: Align.FlexEnd,
  ALIGN_STRETCH: Align.Stretch,
  ALIGN_BASELINE: Align.Baseline,
  ALIGN_SPACE_BETWEEN: Align.SpaceBetween,
  ALIGN_SPACE_AROUND: Align.SpaceAround,
  ALIGN_SPACE_EVENLY: Align.SpaceEvenly,
  BOX_SIZING_BORDER_BOX: BoxSizing.BorderBox,
  BOX_SIZING_CONTENT_BOX: BoxSizing.ContentBox,
  DIMENSION_WIDTH: Dimension.Width,
  DIMENSION_HEIGHT: Dimension.Height,
  DIRECTION_INHERIT: Direction.Inherit,
  DIRECTION_LTR: Direction.LTR,
  DIRECTION_RTL: Direction.RTL,
  DISPLAY_FLEX: Display.Flex,
  DISPLAY_NONE: Display.None,
  DISPLAY_CONTENTS: Display.Contents,
  EDGE_LEFT: Edge.Left,
  EDGE_TOP: Edge.Top,
  EDGE_RIGHT: Edge.Right,
  EDGE_BOTTOM: Edge.Bottom,
  EDGE_START: Edge.Start,
  EDGE_END: Edge.End,
  EDGE_HORIZONTAL: Edge.Horizontal,
  EDGE_VERTICAL: Edge.Vertical,
  EDGE_ALL: Edge.All,
  ERRATA_NONE: Errata.None,
  ERRATA_STRETCH_FLEX_BASIS: Errata.StretchFlexBasis,
  ERRATA_ABSOLUTE_POSITION_WITHOUT_INSETS_EXCLUDES_PADDING: Errata.AbsolutePositionWithoutInsetsExcludesPadding,
  ERRATA_ABSOLUTE_PERCENT_AGAINST_INNER_SIZE: Errata.AbsolutePercentAgainstInnerSize,
  ERRATA_ALL: Errata.All,
  ERRATA_CLASSIC: Errata.Classic,
  EXPERIMENTAL_FEATURE_WEB_FLEX_BASIS: ExperimentalFeature.WebFlexBasis,
  FLEX_DIRECTION_COLUMN: FlexDirection.Column,
  FLEX_DIRECTION_COLUMN_REVERSE: FlexDirection.ColumnReverse,
  FLEX_DIRECTION_ROW: FlexDirection.Row,
  FLEX_DIRECTION_ROW_REVERSE: FlexDirection.RowReverse,
  GUTTER_COLUMN: Gutter.Column,
  GUTTER_ROW: Gutter.Row,
  GUTTER_ALL: Gutter.All,
  JUSTIFY_FLEX_START: Justify.FlexStart,
  JUSTIFY_CENTER: Justify.Center,
  JUSTIFY_FLEX_END: Justify.FlexEnd,
  JUSTIFY_SPACE_BETWEEN: Justify.SpaceBetween,
  JUSTIFY_SPACE_AROUND: Justify.SpaceAround,
  JUSTIFY_SPACE_EVENLY: Justify.SpaceEvenly,
  LOG_LEVEL_ERROR: LogLevel.Error,
  LOG_LEVEL_WARN: LogLevel.Warn,
  LOG_LEVEL_INFO: LogLevel.Info,
  LOG_LEVEL_DEBUG: LogLevel.Debug,
  LOG_LEVEL_VERBOSE: LogLevel.Verbose,
  LOG_LEVEL_FATAL: LogLevel.Fatal,
  MEASURE_MODE_UNDEFINED: MeasureMode.Undefined,
  MEASURE_MODE_EXACTLY: MeasureMode.Exactly,
  MEASURE_MODE_AT_MOST: MeasureMode.AtMost,
  NODE_TYPE_DEFAULT: NodeType.Default,
  NODE_TYPE_TEXT: NodeType.Text,
  OVERFLOW_VISIBLE: Overflow.Visible,
  OVERFLOW_HIDDEN: Overflow.Hidden,
  OVERFLOW_SCROLL: Overflow.Scroll,
  POSITION_TYPE_STATIC: PositionType.Static,
  POSITION_TYPE_RELATIVE: PositionType.Relative,
  POSITION_TYPE_ABSOLUTE: PositionType.Absolute,
  UNIT_UNDEFINED: Unit.Undefined,
  UNIT_POINT: Unit.Point,
  UNIT_PERCENT: Unit.Percent,
  UNIT_AUTO: Unit.Auto,
  WRAP_NO_WRAP: Wrap.NoWrap,
  WRAP_WRAP: Wrap.Wrap,
  WRAP_WRAP_REVERSE: Wrap.WrapReverse
};

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapAssembly(lib) {
  function patch(prototype, name, fn) {
    const original = prototype[name];
    prototype[name] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return fn.call(this, original, ...args);
    };
  }
  for (const fnName of ['setPosition', 'setMargin', 'setFlexBasis', 'setWidth', 'setHeight', 'setMinWidth', 'setMinHeight', 'setMaxWidth', 'setMaxHeight', 'setPadding', 'setGap']) {
    const methods = {
      [Unit.Point]: lib.Node.prototype[fnName],
      [Unit.Percent]: lib.Node.prototype[`${fnName}Percent`],
      [Unit.Auto]: lib.Node.prototype[`${fnName}Auto`]
    };
    patch(lib.Node.prototype, fnName, function (original) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      // We patch all these functions to add support for the following calls:
      // .setWidth(100) / .setWidth("100%") / .setWidth(.getWidth()) / .setWidth("auto")

      const value = args.pop();
      let unit, asNumber;
      if (value === 'auto') {
        unit = Unit.Auto;
        asNumber = undefined;
      } else if (typeof value === 'object') {
        unit = value.unit;
        asNumber = value.valueOf();
      } else {
        unit = typeof value === 'string' && value.endsWith('%') ? Unit.Percent : Unit.Point;
        asNumber = parseFloat(value);
        if (value !== undefined && !Number.isNaN(value) && Number.isNaN(asNumber)) {
          throw new Error(`Invalid value ${value} for ${fnName}`);
        }
      }
      if (!methods[unit]) throw new Error(`Failed to execute "${fnName}": Unsupported unit '${value}'`);
      if (asNumber !== undefined) {
        return methods[unit].call(this, ...args, asNumber);
      } else {
        return methods[unit].call(this, ...args);
      }
    });
  }
  function wrapMeasureFunction(measureFunction) {
    return lib.MeasureCallback.implement({
      measure: function () {
        const {
          width,
          height
        } = measureFunction(...arguments);
        return {
          width: width ?? NaN,
          height: height ?? NaN
        };
      }
    });
  }
  patch(lib.Node.prototype, 'setMeasureFunc', function (original, measureFunc) {
    // This patch is just a convenience patch, since it helps write more
    // idiomatic source code (such as .setMeasureFunc(null))
    if (measureFunc) {
      return original.call(this, wrapMeasureFunction(measureFunc));
    } else {
      return this.unsetMeasureFunc();
    }
  });
  function wrapDirtiedFunc(dirtiedFunction) {
    return lib.DirtiedCallback.implement({
      dirtied: dirtiedFunction
    });
  }
  patch(lib.Node.prototype, 'setDirtiedFunc', function (original, dirtiedFunc) {
    original.call(this, wrapDirtiedFunc(dirtiedFunc));
  });
  patch(lib.Config.prototype, 'free', function () {
    // Since we handle the memory allocation ourselves (via lib.Config.create),
    // we also need to handle the deallocation
    lib.Config.destroy(this);
  });
  patch(lib.Node, 'create', (_, config) => {
    // We decide the constructor we want to call depending on the parameters
    return config ? lib.Node.createWithConfig(config) : lib.Node.createDefault();
  });
  patch(lib.Node.prototype, 'free', function () {
    // Since we handle the memory allocation ourselves (via lib.Node.create),
    // we also need to handle the deallocation
    lib.Node.destroy(this);
  });
  patch(lib.Node.prototype, 'freeRecursive', function () {
    for (let t = 0, T = this.getChildCount(); t < T; ++t) {
      this.getChild(0).freeRecursive();
    }
    this.free();
  });
  patch(lib.Node.prototype, 'calculateLayout', function (original) {
    let width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : NaN;
    let height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : NaN;
    let direction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Direction.LTR;
    // Just a small patch to add support for the function default parameters
    return original.call(this, width, height, direction);
  });
  return {
    Config: lib.Config,
    Node: lib.Node,
    ...constants
  };
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

async function loadYoga$1() {
  return wrapAssembly(await loadYoga$2());
}

const r = String.raw;
const seq = r`(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})`;
const sTags = r`\u{E0061}-\u{E007A}`;
var emojiRegex = () => new RegExp(r`[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[${sTags}]{2}[\u{E0030}-\u{E0039}${sTags}]{1,3}\u{E007F}|${seq}(?:\u200D${seq})*`, 'gu');

let PNG$1 = class PNG {
  static decode(path, fn) {
    {
      return fs.readFile(path, (err, file) => {
        const png = new PNG(file);
        return png.decode(pixels => fn(pixels));
      });
    }
  }
  static load(path) {
    {
      const file = fs.readFileSync(path);
      return new PNG(file);
    }
  }
  constructor(data) {
    let i;
    this.data = data;
    this.pos = 8; // Skip the default header

    this.palette = [];
    this.imgData = [];
    this.transparency = {};
    this.text = {};
    while (true) {
      const chunkSize = this.readUInt32();
      let section = '';
      for (i = 0; i < 4; i++) {
        section += String.fromCharCode(this.data[this.pos++]);
      }
      switch (section) {
        case 'IHDR':
          // we can grab  interesting values from here (like width, height, etc)
          this.width = this.readUInt32();
          this.height = this.readUInt32();
          this.bits = this.data[this.pos++];
          this.colorType = this.data[this.pos++];
          this.compressionMethod = this.data[this.pos++];
          this.filterMethod = this.data[this.pos++];
          this.interlaceMethod = this.data[this.pos++];
          break;
        case 'PLTE':
          this.palette = this.read(chunkSize);
          break;
        case 'IDAT':
          for (i = 0; i < chunkSize; i++) {
            this.imgData.push(this.data[this.pos++]);
          }
          break;
        case 'tRNS':
          // This chunk can only occur once and it must occur after the
          // PLTE chunk and before the IDAT chunk.
          this.transparency = {};
          switch (this.colorType) {
            case 3:
              // Indexed color, RGB. Each byte in this chunk is an alpha for
              // the palette index in the PLTE ("palette") chunk up until the
              // last non-opaque entry. Set up an array, stretching over all
              // palette entries which will be 0 (opaque) or 1 (transparent).
              this.transparency.indexed = this.read(chunkSize);
              var short = 255 - this.transparency.indexed.length;
              if (short > 0) {
                for (i = 0; i < short; i++) {
                  this.transparency.indexed.push(255);
                }
              }
              break;
            case 0:
              // Greyscale. Corresponding to entries in the PLTE chunk.
              // Grey is two bytes, range 0 .. (2 ^ bit-depth) - 1
              this.transparency.grayscale = this.read(chunkSize)[0];
              break;
            case 2:
              // True color with proper alpha channel.
              this.transparency.rgb = this.read(chunkSize);
              break;
          }
          break;
        case 'tEXt':
          var text = this.read(chunkSize);
          var index = text.indexOf(0);
          var key = String.fromCharCode.apply(String, text.slice(0, index));
          this.text[key] = String.fromCharCode.apply(String, text.slice(index + 1));
          break;
        case 'IEND':
          // we've got everything we need!
          switch (this.colorType) {
            case 0:
            case 3:
            case 4:
              this.colors = 1;
              break;
            case 2:
            case 6:
              this.colors = 3;
              break;
          }
          this.hasAlphaChannel = [4, 6].includes(this.colorType);
          var colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
          this.pixelBitlength = this.bits * colors;
          switch (this.colors) {
            case 1:
              this.colorSpace = 'DeviceGray';
              break;
            case 3:
              this.colorSpace = 'DeviceRGB';
              break;
          }
          this.imgData = Buffer.from(this.imgData);
          return;
        default:
          // unknown (or unimportant) section, skip it
          this.pos += chunkSize;
      }
      this.pos += 4; // Skip the CRC

      if (this.pos > this.data.length) {
        throw new Error('Incomplete or corrupt PNG file');
      }
    }
  }
  read(bytes) {
    const result = new Array(bytes);
    for (let i = 0; i < bytes; i++) {
      result[i] = this.data[this.pos++];
    }
    return result;
  }
  readUInt32() {
    const b1 = this.data[this.pos++] << 24;
    const b2 = this.data[this.pos++] << 16;
    const b3 = this.data[this.pos++] << 8;
    const b4 = this.data[this.pos++];
    return b1 | b2 | b3 | b4;
  }
  readUInt16() {
    const b1 = this.data[this.pos++] << 8;
    const b2 = this.data[this.pos++];
    return b1 | b2;
  }
  decodePixels(fn) {
    return zlib.inflate(this.imgData, (err, data) => {
      if (err) throw err;
      var pos = 0;
      const {
        width,
        height
      } = this;
      var pixelBytes = this.pixelBitlength / 8;
      const pixels = Buffer.alloc(width * height * pixelBytes);
      function pass(x0, y0, dx, dy, singlePass) {
        if (singlePass === void 0) {
          singlePass = false;
        }
        const w = Math.ceil((width - x0) / dx);
        const h = Math.ceil((height - y0) / dy);
        const scanlineLength = pixelBytes * w;
        const buffer = singlePass ? pixels : Buffer.alloc(scanlineLength * h);
        let row = 0;
        let c = 0;
        while (row < h && pos < data.length) {
          var byte;
          var col;
          var i;
          var left;
          var upper;
          switch (data[pos++]) {
            case 0:
              // None
              for (i = 0; i < scanlineLength; i++) {
                buffer[c++] = data[pos++];
              }
              break;
            case 1:
              // Sub
              for (i = 0; i < scanlineLength; i++) {
                byte = data[pos++];
                left = i < pixelBytes ? 0 : buffer[c - pixelBytes];
                buffer[c++] = (byte + left) % 256;
              }
              break;
            case 2:
              // Up
              for (i = 0; i < scanlineLength; i++) {
                byte = data[pos++];
                col = (i - i % pixelBytes) / pixelBytes;
                upper = row && buffer[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
                buffer[c++] = (upper + byte) % 256;
              }
              break;
            case 3:
              // Average
              for (i = 0; i < scanlineLength; i++) {
                byte = data[pos++];
                col = (i - i % pixelBytes) / pixelBytes;
                left = i < pixelBytes ? 0 : buffer[c - pixelBytes];
                upper = row && buffer[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
                buffer[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
              }
              break;
            case 4:
              // Paeth
              for (i = 0; i < scanlineLength; i++) {
                var paeth;
                var upperLeft;
                byte = data[pos++];
                col = (i - i % pixelBytes) / pixelBytes;
                left = i < pixelBytes ? 0 : buffer[c - pixelBytes];
                if (row === 0) {
                  upper = upperLeft = 0;
                } else {
                  upper = buffer[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
                  upperLeft = col && buffer[(row - 1) * scanlineLength + (col - 1) * pixelBytes + i % pixelBytes];
                }
                const p = left + upper - upperLeft;
                const pa = Math.abs(p - left);
                const pb = Math.abs(p - upper);
                const pc = Math.abs(p - upperLeft);
                if (pa <= pb && pa <= pc) {
                  paeth = left;
                } else if (pb <= pc) {
                  paeth = upper;
                } else {
                  paeth = upperLeft;
                }
                buffer[c++] = (byte + paeth) % 256;
              }
              break;
            default:
              throw new Error(`Invalid filter algorithm: ${data[pos - 1]}`);
          }
          if (!singlePass) {
            let pixelsPos = ((y0 + row * dy) * width + x0) * pixelBytes;
            let bufferPos = row * scanlineLength;
            for (i = 0; i < w; i++) {
              for (let j = 0; j < pixelBytes; j++) pixels[pixelsPos++] = buffer[bufferPos++];
              pixelsPos += (dx - 1) * pixelBytes;
            }
          }
          row++;
        }
      }
      if (this.interlaceMethod === 1) {
        /*
          1 6 4 6 2 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
          3 6 4 6 3 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
        */
        pass(0, 0, 8, 8); // 1
        pass(4, 0, 8, 8); // 2
        pass(0, 4, 4, 8); // 3
        pass(2, 0, 4, 4); // 4
        pass(0, 2, 2, 4); // 5
        pass(1, 0, 2, 2); // 6
        pass(0, 1, 1, 2); // 7
      } else {
        pass(0, 0, 1, 1, true);
      }
      return fn(pixels);
    });
  }
  decodePalette() {
    const {
      palette
    } = this;
    const {
      length
    } = palette;
    const transparency = this.transparency.indexed || [];
    const ret = Buffer.alloc(transparency.length + length);
    let pos = 0;
    let c = 0;
    for (let i = 0; i < length; i += 3) {
      var left;
      ret[pos++] = palette[i];
      ret[pos++] = palette[i + 1];
      ret[pos++] = palette[i + 2];
      ret[pos++] = (left = transparency[c++]) != null ? left : 255;
    }
    return ret;
  }
  copyToImageData(imageData, pixels) {
    let j;
    var k;
    let {
      colors
    } = this;
    let palette = null;
    let alpha = this.hasAlphaChannel;
    if (this.palette.length) {
      palette = this._decodedPalette || (this._decodedPalette = this.decodePalette());
      colors = 4;
      alpha = true;
    }
    const data = imageData.data || imageData;
    const {
      length
    } = data;
    const input = palette || pixels;
    let i = j = 0;
    if (colors === 1) {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        const v = input[k++];
        data[i++] = v;
        data[i++] = v;
        data[i++] = v;
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    } else {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    }
  }
  decode(fn) {
    const ret = Buffer.alloc(this.width * this.height * 4);
    return this.decodePixels(pixels => {
      this.copyToImageData(ret, pixels);
      return fn(ret);
    });
  }
};

// Node back-compat.
const ENCODING_MAPPING = {
  utf16le: 'utf-16le',
  ucs2: 'utf-16le',
  utf16be: 'utf-16be'
};
class DecodeStream {
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.pos = 0;
    this.length = this.buffer.length;
  }
  readString(length, encoding) {
    if (encoding === void 0) {
      encoding = 'ascii';
    }
    encoding = ENCODING_MAPPING[encoding] || encoding;
    let buf = this.readBuffer(length);
    try {
      let decoder = new TextDecoder(encoding);
      return decoder.decode(buf);
    } catch (err) {
      return buf;
    }
  }
  readBuffer(length) {
    return this.buffer.slice(this.pos, this.pos += length);
  }
  readUInt24BE() {
    return (this.readUInt16BE() << 8) + this.readUInt8();
  }
  readUInt24LE() {
    return this.readUInt16LE() + (this.readUInt8() << 16);
  }
  readInt24BE() {
    return (this.readInt16BE() << 8) + this.readUInt8();
  }
  readInt24LE() {
    return this.readUInt16LE() + (this.readInt8() << 16);
  }
}
DecodeStream.TYPES = {
  UInt8: 1,
  UInt16: 2,
  UInt24: 3,
  UInt32: 4,
  Int8: 1,
  Int16: 2,
  Int24: 3,
  Int32: 4,
  Float: 4,
  Double: 8
};
for (let key of Object.getOwnPropertyNames(DataView.prototype)) {
  if (key.slice(0, 3) === 'get') {
    let type = key.slice(3).replace('Ui', 'UI');
    if (type === 'Float32') {
      type = 'Float';
    } else if (type === 'Float64') {
      type = 'Double';
    }
    let bytes = DecodeStream.TYPES[type];
    DecodeStream.prototype['read' + type + (bytes === 1 ? '' : 'BE')] = function () {
      const ret = this.view[key](this.pos, false);
      this.pos += bytes;
      return ret;
    };
    if (bytes !== 1) {
      DecodeStream.prototype['read' + type + 'LE'] = function () {
        const ret = this.view[key](this.pos, true);
        this.pos += bytes;
        return ret;
      };
    }
  }
}

const textEncoder = new TextEncoder();
const isBigEndian = new Uint8Array(new Uint16Array([0x1234]).buffer)[0] == 0x12;
class EncodeStream {
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
    this.pos = 0;
  }
  writeBuffer(buffer) {
    this.buffer.set(buffer, this.pos);
    this.pos += buffer.length;
  }
  writeString(string, encoding) {
    if (encoding === void 0) {
      encoding = 'ascii';
    }
    let buf;
    switch (encoding) {
      case 'utf16le':
      case 'utf16-le':
      case 'ucs2':
        // node treats this the same as utf16.
        buf = stringToUtf16(string, isBigEndian);
        break;
      case 'utf16be':
      case 'utf16-be':
        buf = stringToUtf16(string, !isBigEndian);
        break;
      case 'utf8':
        buf = textEncoder.encode(string);
        break;
      case 'ascii':
        buf = stringToAscii(string);
        break;
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
    this.writeBuffer(buf);
  }
  writeUInt24BE(val) {
    this.buffer[this.pos++] = val >>> 16 & 0xff;
    this.buffer[this.pos++] = val >>> 8 & 0xff;
    this.buffer[this.pos++] = val & 0xff;
  }
  writeUInt24LE(val) {
    this.buffer[this.pos++] = val & 0xff;
    this.buffer[this.pos++] = val >>> 8 & 0xff;
    this.buffer[this.pos++] = val >>> 16 & 0xff;
  }
  writeInt24BE(val) {
    if (val >= 0) {
      this.writeUInt24BE(val);
    } else {
      this.writeUInt24BE(val + 0xffffff + 1);
    }
  }
  writeInt24LE(val) {
    if (val >= 0) {
      this.writeUInt24LE(val);
    } else {
      this.writeUInt24LE(val + 0xffffff + 1);
    }
  }
  fill(val, length) {
    if (length < this.buffer.length) {
      this.buffer.fill(val, this.pos, this.pos + length);
      this.pos += length;
    } else {
      const buf = new Uint8Array(length);
      buf.fill(val);
      this.writeBuffer(buf);
    }
  }
}
function stringToUtf16(string, swap) {
  let buf = new Uint16Array(string.length);
  for (let i = 0; i < string.length; i++) {
    let code = string.charCodeAt(i);
    if (swap) {
      code = code >> 8 | (code & 0xff) << 8;
    }
    buf[i] = code;
  }
  return new Uint8Array(buf.buffer);
}
function stringToAscii(string) {
  let buf = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    // Match node.js behavior - encoding allows 8-bit rather than 7-bit.
    buf[i] = string.charCodeAt(i);
  }
  return buf;
}
for (let key of Object.getOwnPropertyNames(DataView.prototype)) {
  if (key.slice(0, 3) === 'set') {
    let type = key.slice(3).replace('Ui', 'UI');
    if (type === 'Float32') {
      type = 'Float';
    } else if (type === 'Float64') {
      type = 'Double';
    }
    let bytes = DecodeStream.TYPES[type];
    EncodeStream.prototype['write' + type + (bytes === 1 ? '' : 'BE')] = function (value) {
      this.view[key](this.pos, value, false);
      this.pos += bytes;
    };
    if (bytes !== 1) {
      EncodeStream.prototype['write' + type + 'LE'] = function (value) {
        this.view[key](this.pos, value, true);
        this.pos += bytes;
      };
    }
  }
}

class Base {
  fromBuffer(buffer) {
    let stream = new DecodeStream(buffer);
    return this.decode(stream);
  }
  toBuffer(value) {
    let size = this.size(value);
    let buffer = new Uint8Array(size);
    let stream = new EncodeStream(buffer);
    this.encode(stream, value);
    return buffer;
  }
}

class NumberT extends Base {
  constructor(type, endian) {
    if (endian === void 0) {
      endian = 'BE';
    }
    super();
    this.type = type;
    this.endian = endian;
    this.fn = this.type;
    if (this.type[this.type.length - 1] !== '8') {
      this.fn += this.endian;
    }
  }
  size() {
    return DecodeStream.TYPES[this.type];
  }
  decode(stream) {
    return stream[`read${this.fn}`]();
  }
  encode(stream, val) {
    return stream[`write${this.fn}`](val);
  }
}
const uint8 = new NumberT('UInt8');
const uint16be = new NumberT('UInt16', 'BE');
const uint16le = new NumberT('UInt16', 'LE');
new NumberT('UInt24', 'BE');
new NumberT('UInt24', 'LE');
const uint32be = new NumberT('UInt32', 'BE');
const uint32le = new NumberT('UInt32', 'LE');
new NumberT('Int8');
new NumberT('Int16', 'BE');
new NumberT('Int16', 'LE');
new NumberT('Int24', 'BE');
new NumberT('Int24', 'LE');
new NumberT('Int32', 'BE');
new NumberT('Int32', 'LE');
new NumberT('Float', 'BE');
new NumberT('Float', 'LE');
new NumberT('Double', 'BE');
new NumberT('Double', 'LE');
class Fixed extends NumberT {
  constructor(size, endian, fracBits) {
    if (fracBits === void 0) {
      fracBits = size >> 1;
    }
    super(`Int${size}`, endian);
    this._point = 1 << fracBits;
  }
  decode(stream) {
    return super.decode(stream) / this._point;
  }
  encode(stream, val) {
    return super.encode(stream, val * this._point | 0);
  }
}
new Fixed(16, 'BE');
new Fixed(16, 'LE');
new Fixed(32, 'BE');
new Fixed(32, 'LE');

function resolveLength(length, stream, parent) {
  let res;
  if (typeof length === 'number') {
    res = length;
  } else if (typeof length === 'function') {
    res = length.call(parent, parent);
  } else if (parent && typeof length === 'string') {
    res = parent[length];
  } else if (stream && length instanceof NumberT) {
    res = length.decode(stream);
  }
  if (isNaN(res)) {
    throw new Error('Not a fixed size');
  }
  return res;
}
class PropertyDescriptor {
  constructor(opts) {
    if (opts === void 0) {
      opts = {};
    }
    this.enumerable = true;
    this.configurable = true;
    for (let key in opts) {
      const val = opts[key];
      this[key] = val;
    }
  }
}

class ArrayT extends Base {
  constructor(type, length, lengthType) {
    if (lengthType === void 0) {
      lengthType = 'count';
    }
    super();
    this.type = type;
    this.length = length;
    this.lengthType = lengthType;
  }
  decode(stream, parent) {
    let length;
    const {
      pos
    } = stream;
    const res = [];
    let ctx = parent;
    if (this.length != null) {
      length = resolveLength(this.length, stream, parent);
    }
    if (this.length instanceof NumberT) {
      // define hidden properties
      Object.defineProperties(res, {
        parent: {
          value: parent
        },
        _startOffset: {
          value: pos
        },
        _currentOffset: {
          value: 0,
          writable: true
        },
        _length: {
          value: length
        }
      });
      ctx = res;
    }
    if (length == null || this.lengthType === 'bytes') {
      const target = length != null ? stream.pos + length : (parent != null ? parent._length : undefined) ? parent._startOffset + parent._length : stream.length;
      while (stream.pos < target) {
        res.push(this.type.decode(stream, ctx));
      }
    } else {
      for (let i = 0, end = length; i < end; i++) {
        res.push(this.type.decode(stream, ctx));
      }
    }
    return res;
  }
  size(array, ctx, includePointers) {
    if (includePointers === void 0) {
      includePointers = true;
    }
    if (!array) {
      return this.type.size(null, ctx) * resolveLength(this.length, null, ctx);
    }
    let size = 0;
    if (this.length instanceof NumberT) {
      size += this.length.size();
      ctx = {
        parent: ctx,
        pointerSize: 0
      };
    }
    for (let item of array) {
      size += this.type.size(item, ctx);
    }
    if (ctx && includePointers && this.length instanceof NumberT) {
      size += ctx.pointerSize;
    }
    return size;
  }
  encode(stream, array, parent) {
    let ctx = parent;
    if (this.length instanceof NumberT) {
      ctx = {
        pointers: [],
        startOffset: stream.pos,
        parent
      };
      ctx.pointerOffset = stream.pos + this.size(array, ctx, false);
      this.length.encode(stream, array.length);
    }
    for (let item of array) {
      this.type.encode(stream, item, ctx);
    }
    if (this.length instanceof NumberT) {
      let i = 0;
      while (i < ctx.pointers.length) {
        const ptr = ctx.pointers[i++];
        ptr.type.encode(stream, ptr.val, ptr.parent);
      }
    }
  }
}

class BufferT extends Base {
  constructor(length) {
    super();
    this.length = length;
  }
  decode(stream, parent) {
    const length = resolveLength(this.length, stream, parent);
    return stream.readBuffer(length);
  }
  size(val, parent) {
    if (!val) {
      return resolveLength(this.length, null, parent);
    }
    let len = val.length;
    if (this.length instanceof NumberT) {
      len += this.length.size();
    }
    return len;
  }
  encode(stream, buf, parent) {
    if (this.length instanceof NumberT) {
      this.length.encode(stream, buf.length);
    }
    return stream.writeBuffer(buf);
  }
}

class Reserved extends Base {
  constructor(type, count) {
    if (count === void 0) {
      count = 1;
    }
    super();
    this.type = type;
    this.count = count;
  }
  decode(stream, parent) {
    stream.pos += this.size(null, parent);
    return undefined;
  }
  size(data, parent) {
    const count = resolveLength(this.count, null, parent);
    return this.type.size() * count;
  }
  encode(stream, val, parent) {
    return stream.fill(0, this.size(val, parent));
  }
}

class StringT extends Base {
  constructor(length, encoding) {
    if (encoding === void 0) {
      encoding = 'ascii';
    }
    super();
    this.length = length;
    this.encoding = encoding;
  }
  decode(stream, parent) {
    let length, pos;
    let {
      encoding
    } = this;
    if (typeof encoding === 'function') {
      encoding = encoding.call(parent, parent) || 'ascii';
    }
    let width = encodingWidth(encoding);
    if (this.length != null) {
      length = resolveLength(this.length, stream, parent);
    } else {
      let buffer;
      ({
        buffer,
        length,
        pos
      } = stream);
      while (pos < length - width + 1 && (buffer[pos] !== 0x00 || width === 2 && buffer[pos + 1] !== 0x00)) {
        pos += width;
      }
      length = pos - stream.pos;
    }
    const string = stream.readString(length, encoding);
    if (this.length == null && stream.pos < stream.length) {
      stream.pos += width;
    }
    return string;
  }
  size(val, parent) {
    // Use the defined value if no value was given
    if (val === undefined || val === null) {
      return resolveLength(this.length, null, parent);
    }
    let {
      encoding
    } = this;
    if (typeof encoding === 'function') {
      encoding = encoding.call(parent != null ? parent.val : undefined, parent != null ? parent.val : undefined) || 'ascii';
    }
    if (encoding === 'utf16be') {
      encoding = 'utf16le';
    }
    let size = byteLength(val, encoding);
    if (this.length instanceof NumberT) {
      size += this.length.size();
    }
    if (this.length == null) {
      size += encodingWidth(encoding);
    }
    return size;
  }
  encode(stream, val, parent) {
    let {
      encoding
    } = this;
    if (typeof encoding === 'function') {
      encoding = encoding.call(parent != null ? parent.val : undefined, parent != null ? parent.val : undefined) || 'ascii';
    }
    if (this.length instanceof NumberT) {
      this.length.encode(stream, byteLength(val, encoding));
    }
    stream.writeString(val, encoding);
    if (this.length == null) {
      return encodingWidth(encoding) == 2 ? stream.writeUInt16LE(0x0000) : stream.writeUInt8(0x00);
    }
  }
}
function encodingWidth(encoding) {
  switch (encoding) {
    case 'ascii':
    case 'utf8':
      // utf8 is a byte-based encoding for zero-term string
      return 1;
    case 'utf16le':
    case 'utf16-le':
    case 'utf-16be':
    case 'utf-16le':
    case 'utf16be':
    case 'utf16-be':
    case 'ucs2':
      return 2;
    default:
      //TODO: assume all other encodings are 1-byters
      //throw new Error('Unknown encoding ' + encoding);
      return 1;
  }
}
function byteLength(string, encoding) {
  switch (encoding) {
    case 'ascii':
      return string.length;
    case 'utf8':
      let len = 0;
      for (let i = 0; i < string.length; i++) {
        let c = string.charCodeAt(i);
        if (c >= 0xd800 && c <= 0xdbff && i < string.length - 1) {
          let c2 = string.charCodeAt(++i);
          if ((c2 & 0xfc00) === 0xdc00) {
            c = ((c & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
          } else {
            // unmatched surrogate.
            i--;
          }
        }
        if ((c & 0xffffff80) === 0) {
          len++;
        } else if ((c & 0xfffff800) === 0) {
          len += 2;
        } else if ((c & 0xffff0000) === 0) {
          len += 3;
        } else if ((c & 0xffe00000) === 0) {
          len += 4;
        }
      }
      return len;
    case 'utf16le':
    case 'utf16-le':
    case 'utf16be':
    case 'utf16-be':
    case 'ucs2':
      return string.length * 2;
    default:
      throw new Error('Unknown encoding ' + encoding);
  }
}

class Struct extends Base {
  constructor(fields) {
    if (fields === void 0) {
      fields = {};
    }
    super();
    this.fields = fields;
  }
  decode(stream, parent, length) {
    if (length === void 0) {
      length = 0;
    }
    const res = this._setup(stream, parent, length);
    this._parseFields(stream, res, this.fields);
    if (this.process != null) {
      this.process.call(res, stream);
    }
    return res;
  }
  _setup(stream, parent, length) {
    const res = {};

    // define hidden properties
    Object.defineProperties(res, {
      parent: {
        value: parent
      },
      _startOffset: {
        value: stream.pos
      },
      _currentOffset: {
        value: 0,
        writable: true
      },
      _length: {
        value: length
      }
    });
    return res;
  }
  _parseFields(stream, res, fields) {
    for (let key in fields) {
      var val;
      const type = fields[key];
      if (typeof type === 'function') {
        val = type.call(res, res);
      } else {
        val = type.decode(stream, res);
      }
      if (val !== undefined) {
        if (val instanceof PropertyDescriptor) {
          Object.defineProperty(res, key, val);
        } else {
          res[key] = val;
        }
      }
      res._currentOffset = stream.pos - res._startOffset;
    }
  }
  size(val, parent, includePointers) {
    if (includePointers === void 0) {
      includePointers = true;
    }
    if (val == null) {
      val = {};
    }
    const ctx = {
      parent,
      val,
      pointerSize: 0
    };
    if (this.preEncode != null) {
      this.preEncode.call(val);
    }
    let size = 0;
    for (let key in this.fields) {
      const type = this.fields[key];
      if (type.size != null) {
        size += type.size(val[key], ctx);
      }
    }
    if (includePointers) {
      size += ctx.pointerSize;
    }
    return size;
  }
  encode(stream, val, parent) {
    let type;
    if (this.preEncode != null) {
      this.preEncode.call(val, stream);
    }
    const ctx = {
      pointers: [],
      startOffset: stream.pos,
      parent,
      val,
      pointerSize: 0
    };
    ctx.pointerOffset = stream.pos + this.size(val, ctx, false);
    for (let key in this.fields) {
      type = this.fields[key];
      if (type.encode != null) {
        type.encode(stream, val[key], ctx);
      }
    }
    let i = 0;
    while (i < ctx.pointers.length) {
      const ptr = ctx.pointers[i++];
      ptr.type.encode(stream, ptr.val, ptr.parent);
    }
  }
}

const getPath = (object, pathArray) => {
  return pathArray.reduce((prevObj, key) => prevObj && prevObj[key], object);
};
class VersionedStruct extends Struct {
  constructor(type, versions) {
    if (versions === void 0) {
      versions = {};
    }
    super();
    this.type = type;
    this.versions = versions;
    if (typeof type === 'string') {
      this.versionPath = type.split('.');
    }
  }
  decode(stream, parent, length) {
    if (length === void 0) {
      length = 0;
    }
    const res = this._setup(stream, parent, length);
    if (typeof this.type === 'string') {
      res.version = getPath(parent, this.versionPath);
    } else {
      res.version = this.type.decode(stream);
    }
    if (this.versions.header) {
      this._parseFields(stream, res, this.versions.header);
    }
    const fields = this.versions[res.version];
    if (fields == null) {
      throw new Error(`Unknown version ${res.version}`);
    }
    if (fields instanceof VersionedStruct) {
      return fields.decode(stream, parent);
    }
    this._parseFields(stream, res, fields);
    if (this.process != null) {
      this.process.call(res, stream);
    }
    return res;
  }
  size(val, parent, includePointers) {
    if (includePointers === void 0) {
      includePointers = true;
    }
    let key, type;
    if (!val) {
      throw new Error('Not a fixed size');
    }
    if (this.preEncode != null) {
      this.preEncode.call(val);
    }
    const ctx = {
      parent,
      val,
      pointerSize: 0
    };
    let size = 0;
    if (typeof this.type !== 'string') {
      size += this.type.size(val.version, ctx);
    }
    if (this.versions.header) {
      for (key in this.versions.header) {
        type = this.versions.header[key];
        if (type.size != null) {
          size += type.size(val[key], ctx);
        }
      }
    }
    const fields = this.versions[val.version];
    if (fields == null) {
      throw new Error(`Unknown version ${val.version}`);
    }
    for (key in fields) {
      type = fields[key];
      if (type.size != null) {
        size += type.size(val[key], ctx);
      }
    }
    if (includePointers) {
      size += ctx.pointerSize;
    }
    return size;
  }
  encode(stream, val, parent) {
    let key, type;
    if (this.preEncode != null) {
      this.preEncode.call(val, stream);
    }
    const ctx = {
      pointers: [],
      startOffset: stream.pos,
      parent,
      val,
      pointerSize: 0
    };
    ctx.pointerOffset = stream.pos + this.size(val, ctx, false);
    if (typeof this.type !== 'string') {
      this.type.encode(stream, val.version);
    }
    if (this.versions.header) {
      for (key in this.versions.header) {
        type = this.versions.header[key];
        if (type.encode != null) {
          type.encode(stream, val[key], ctx);
        }
      }
    }
    const fields = this.versions[val.version];
    for (key in fields) {
      type = fields[key];
      if (type.encode != null) {
        type.encode(stream, val[key], ctx);
      }
    }
    let i = 0;
    while (i < ctx.pointers.length) {
      const ptr = ctx.pointers[i++];
      ptr.type.encode(stream, ptr.val, ptr.parent);
    }
  }
}

const DACTable = new Struct({
  identifier: new BufferT(1),
  value: new BufferT(1)
});
const DACMarker = {
  name: () => "DAC",
  length: uint16be,
  tables: new ArrayT(DACTable, parent => parent.length / 2)
};

const readUInt8 = (array, offset) => {
  return array[offset];
};
const readUInt16BE = (array, offset) => {
  return array[offset] << 8 | array[offset + 1];
};
const readUInt16LE = (array, offset) => {
  return array[offset] | array[offset + 1] << 8;
};
const readUInt32BE = (array, offset) => {
  return readInt32BE(array, offset) >>> 0;
};
const readUInt32LE = (array, offset) => {
  return readInt32LE(array, offset) >>> 0;
};
const uint8ArrayToHexString = uint8Array => {
  return Array.from(uint8Array, byte => byte.toString(16).padStart(2, "0")).join("");
};
const decoder = new TextDecoder("utf-8");
const uint8ArrayToString = uint8Array => {
  return decoder.decode(uint8Array);
};
const concatenateUint8Arrays = arrays => {
  const totalLength = arrays.reduce((length, arr) => length + arr.length, 0);
  const concatenatedArray = new Uint8Array(totalLength);
  let offset = 0;
  arrays.forEach(arr => {
    concatenatedArray.set(arr, offset);
    offset += arr.length;
  });
  return concatenatedArray;
};
const readInt32BE = (array, offset) => {
  return array[offset] << 24 | array[offset + 1] << 16 | array[offset + 2] << 8 | array[offset + 3];
};
const readInt32LE = (array, offset) => {
  return array[offset] | array[offset + 1] << 8 | array[offset + 2] << 16 | array[offset + 3] << 24;
};

class HuffmanTableElements {
  decode(stream, parent) {
    const tables = {};
    let buffer = stream.buffer.slice(stream.pos, stream.pos + parent.length - 2);
    while (buffer.length > 0) {
      let offset = 1;
      const elements = [];
      const identifier = readUInt8(buffer, 0);
      const lengths = buffer.slice(offset, offset + 16);
      offset += 16;
      for (const length of lengths) {
        elements.push(buffer.slice(offset, offset + length));
        offset += length;
      }
      buffer = buffer.slice(offset);
      tables[identifier] = concatenateUint8Arrays(elements);
    }
    stream.pos += parent.length - 2;
    return tables;
  }
}
const DefineHuffmanTableMarker = {
  name: () => "DHT",
  length: uint16be,
  tables: new HuffmanTableElements()
};

const DQTMarker = {
  name: () => "DQT",
  length: uint16be,
  tables: new ArrayT(new Struct({
    identifier: new BufferT(1),
    data: new BufferT(64)
  }), parent => (parent.length - 2) / 65)
};

const DRIMarker = {
  name: () => "DRI",
  length: uint16be,
  restartInterval: uint16be
};

const EndOfImageMarker = {
  name: () => "EOI",
  afterEOI: new Reserved(uint8, Infinity)
};

const tags = {
  ifd: {
    "010e": "imageDescription",
    "010f": "make",
    "011a": "xResolution",
    "011b": "yResolution",
    "011c": "planarConfiguration",
    "012d": "transferFunction",
    "013b": "artist",
    "013e": "whitePoint",
    "013f": "primaryChromaticities",
    "0100": "imageWidth",
    "0101": "imageHeight",
    "0102": "bitsPerSample",
    "0103": "compression",
    "0106": "photometricInterpretation",
    "0110": "model",
    "0111": "stripOffsets",
    "0112": "orientation",
    "0115": "samplesPerPixel",
    "0116": "rowsPerStrip",
    "0117": "stripByteCounts",
    "0128": "resolutionUnit",
    "0131": "software",
    "0132": "dateTime",
    "0201": "jpegInterchangeFormat",
    "0202": "jpegInterchangeFormatLength",
    "0211": "ycbCrCoefficients",
    "0212": "ycbCrSubSampling",
    "0213": "ycbCrPositioning",
    "0214": "referenceBlackWhite",
    "829a": "exposureTime",
    "829d": "fNumber",
    "920a": "focalLength",
    "927c": "makerNote",
    8298: "copyright",
    8769: "exifIFDPointer",
    8822: "exposureProgram",
    8824: "spectralSensitivity",
    8825: "gpsInfoIFDPointer",
    8827: "photographicSensitivity",
    8828: "oecf",
    8830: "sensitivityType",
    8831: "standardOutputSensitivity",
    8832: "recommendedExposureIndex",
    8833: "isoSpeed",
    8834: "isoSpeedLatitudeyyy",
    8835: "isoSpeedLatitudezzz",
    9000: "exifVersion",
    9003: "dateTimeOriginal",
    9004: "dateTimeDigitized",
    9101: "componentsConfiguration",
    9102: "compressedBitsPerPixel",
    9201: "shutterSpeedValue",
    9202: "apertureValue",
    9203: "brightnessValue",
    9204: "exposureBiasValue",
    9205: "maxApertureValue",
    9206: "subjectDistance",
    9207: "meteringMode",
    9208: "lightSource",
    9209: "flash",
    9214: "subjectArea",
    9286: "userComment",
    9290: "subSecTime",
    9291: "subSecTimeOriginal",
    9292: "subSecTimeDigitized",
    a000: "flashpixVersion",
    a001: "colorSpace",
    a002: "pixelXDimension",
    a003: "pixelYDimension",
    a004: "relatedSoundFile",
    a005: "interoperabilityIFDPointer",
    a20b: "flashEnergy",
    a20c: "spatialFrequencyResponse",
    a20e: "focalPlaneXResolution",
    a20f: "focalPlaneYResolution",
    a40a: "sharpness",
    a40b: "deviceSettingDescription",
    a40c: "subjectDistanceRange",
    a210: "focalPlaneResolutionUnit",
    a214: "subjectLocation",
    a215: "exposureIndex",
    a217: "sensingMethod",
    a300: "fileSource",
    a301: "sceneType",
    a302: "cfaPattern",
    a401: "customRendered",
    a402: "exposureMode",
    a403: "whiteBalance",
    a404: "digitalZoomRatio",
    a405: "focalLengthIn35mmFilm",
    a406: "sceneCaptureType",
    a407: "gainControl",
    a408: "contrast",
    a409: "saturation",
    a420: "imageUniqueID",
    a430: "cameraOwnerName",
    a431: "bodySerialNumber",
    a432: "lensSpecification",
    a433: "lensMake",
    a434: "lensModel",
    a435: "lensSerialNumber",
    a500: "gamma"
  },
  gps: {
    "0000": "gpsVersionID",
    "0001": "gpsLatitudeRef",
    "0002": "gpsLatitude",
    "0003": "gpsLongitudeRef",
    "0004": "gpsLongitude",
    "0005": "gpsAltitudeRef",
    "0006": "gpsAltitude",
    "0007": "gpsTimeStamp",
    "0008": "gpsSatellites",
    "0009": "gpsStatus",
    "000a": "gpsMeasureMode",
    "000b": "gpsDOP",
    "000c": "gpsSpeedRef",
    "000d": "gpsSpeed",
    "000e": "gpsTrackRef",
    "000f": "gpsTrack",
    "0010": "gpsImgDirectionRef",
    "0011": "gpsImgDirection",
    "0012": "gpsMapDatum",
    "0013": "gpsDestLatitudeRef",
    "0014": "gpsDestLatitude",
    "0015": "gpsDestLongitudeRef",
    "0016": "gpsDestLongitude",
    "0017": "gpsDestBearingRef",
    "0018": "gpsDestBearing",
    "0019": "gpsDestDistanceRef",
    "001a": "gpsDestDistance",
    "001b": "gpsProcessingMethod",
    "001c": "gpsAreaInformation",
    "001d": "gpsDateStamp",
    "001e": "gpsDifferential",
    "001f": "gpsHPositioningError"
  }
};
class IDFEntries {
  constructor(bigEndian) {
    this.bigEndian = bigEndian;
    this.bytes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
  }
  _getTagValue(dataValue, dataFormat, componentsNumber) {
    switch (dataFormat) {
      case 2:
        return dataValue.toString("ascii").replace(/\0+$/, "");
      case 129:
        return dataValue.toString("utf8").replace(/\0+$/, "");
      case 7:
        return "0x" + dataValue.toString("hex");
      default:
        return this._getTagValueForNumericalData(dataValue, dataFormat, componentsNumber);
    }
  }
  _getTagValueForNumericalData(dataValue, dataFormat, componentsNumber) {
    const tagValue = [];
    const componentsBytes = this.bytes[dataFormat];
    for (let i = 0; i < componentsNumber; i += 1) {
      tagValue.push(this._getSingleTagValueForNumericalData(dataValue, dataFormat, i * componentsBytes));
    }
    return tagValue.length === 1 ? tagValue[0] : tagValue;
  }
  _getSingleTagValueForNumericalData(dataValue, dataFormat, pos) {
    const uint16 = pos => this.bigEndian ? readUInt16BE(dataValue, pos) : readUInt16LE(dataValue, pos);
    const uint32 = pos => this.bigEndian ? readUInt32BE(dataValue, pos) : readUInt32LE(dataValue, pos);
    const int32 = pos => this.bigEndian ? readInt32BE(dataValue, pos) : readInt32LE(dataValue, pos);
    switch (dataFormat) {
      case 1:
        return readUInt8(dataValue, pos);
      case 3:
        return uint16(pos);
      case 4:
        return uint32(pos);
      case 5:
        return uint32(pos) / uint32(pos + 4);
      case 9:
        return int32(pos);
      case 10:
        {
          return int32(pos) / int32(pos + 4);
        }
    }
  }
  _decodeIDFEntries(buffer, tags, offset, log) {
    let pos = 2 + offset;
    const entries = {};
    const uint16 = pos => this.bigEndian ? readUInt16BE(buffer, pos) : readUInt16LE(buffer, pos);
    const uint32 = pos => this.bigEndian ? readUInt32BE(buffer, pos) : readUInt32LE(buffer, pos);
    const numberOfEntries = uint16(offset);
    for (let i = 0; i < numberOfEntries; i++) {
      const tagAddress = buffer.slice(pos, pos + 2);
      const dataFormat = uint16(pos + 2);
      const componentsNumber = uint32(pos + 4);
      const componentsBytes = this.bytes[dataFormat];
      const dataLength = componentsNumber * componentsBytes;
      let dataValue = buffer.slice(pos + 8, pos + 12);
      if (dataLength > 4) {
        const dataOffset = this.bigEndian ? readUInt32BE(dataValue, 0) : readUInt32LE(dataValue, 0);
        dataValue = buffer.slice(dataOffset, dataOffset + dataLength);
      }
      const tagValue = this._getTagValue(dataValue, dataFormat, componentsNumber);
      const tagNumber = this.bigEndian ? uint8ArrayToHexString(tagAddress) : uint8ArrayToHexString(tagAddress.reverse());
      const tagName = tags[tagNumber];
      entries[tagName] = tagValue;
      pos += 12;
    }
    return entries;
  }
  decode(stream, parent) {
    const buffer = stream.buffer.slice(stream.pos - 8);
    const offsetToFirstIFD = parent.offsetToFirstIFD;
    if (offsetToFirstIFD > buffer.length) {
      stream.pos += parent.parent.length - 16;
      return {};
    }
    const entries = this._decodeIDFEntries(buffer, tags.ifd, offsetToFirstIFD);
    const {
      exifIFDPointer,
      gpsInfoIFDPointer
    } = entries;
    if (exifIFDPointer) {
      entries.subExif = this._decodeIDFEntries(buffer, tags.ifd, exifIFDPointer);
    }
    if (gpsInfoIFDPointer) {
      const gps = gpsInfoIFDPointer;
      entries.gpsInfo = this._decodeIDFEntries(buffer, tags.gps, gps, true);
    }
    stream.pos += parent.parent.length - 16;
    return entries;
  }
}
const IFDData = bigEndian => {
  const uint16 = bigEndian ? uint16be : uint16le;
  const uint32 = bigEndian ? uint32be : uint32le;
  return new Struct({
    fortyTwo: uint16,
    offsetToFirstIFD: uint32,
    entries: new IDFEntries(bigEndian)
  });
};
class TIFFHeader {
  decode(stream, parent) {
    const byteOrder = uint8ArrayToString(stream.buffer.slice(stream.pos, stream.pos + 2));
    const bigEndian = byteOrder === "MM";
    stream.pos += 2;
    const data = IFDData(bigEndian).decode(stream, parent);
    return data.entries;
  }
}
const EXIFMarker = {
  name: () => "EXIF",
  length: uint16be,
  identifier: new StringT(6),
  entries: new TIFFHeader()
};

const JFIFMarker = {
  name: () => "JFIF",
  length: uint16be,
  identifier: new StringT(5),
  version: uint16be,
  units: uint8,
  xDensity: uint16be,
  yDensity: uint16be,
  thumbnailWidth: uint8,
  thumbnailHeight: uint8
};

class ImageData {
  decode(stream) {
    const buffer = stream.buffer.slice(stream.pos);
    let length = 0;
    let i = buffer.indexOf(0xff);
    while (i !== -1) {
      length = i;
      const nextByte = buffer[length + 1];
      const comesRestart = nextByte >= 0xd0 && nextByte <= 0xd7;
      if (nextByte !== 0x00 && !comesRestart) break;
      i = buffer.indexOf(0xff, i + 1);
    }
    stream.pos += length;
    return buffer.slice(0, length);
  }
}
const SOSComponentSpecification = new Struct({
  scanComponentSelector: uint8,
  entropyCodingTable: new BufferT(1)
});
const SOSMarker = {
  name: () => "SOS",
  length: uint16be,
  numberOfImageComponents: uint8,
  componentSpecifications: new ArrayT(SOSComponentSpecification, parent => parent.numberOfImageComponents),
  startOfSpectral: uint8,
  endOfSpectral: uint8,
  successiveApproximationBit: new BufferT(1),
  data: new ImageData()
};

const FrameColorComponent = new Struct({
  id: uint8,
  samplingFactors: uint8,
  quantizationTableId: uint8
});
const StartOfFrameMarker = {
  name: () => "SOF",
  length: uint16be,
  precision: uint8,
  height: uint16be,
  width: uint16be,
  numberOfComponents: uint8,
  components: new ArrayT(FrameColorComponent, parent => parent.numberOfComponents)
};

const StartOfImageMarker = {
  name: () => "SOI"
};

const UnknownMarker = {
  length: uint16be,
  buf: new BufferT(parent => parent.length - 2)
};
const unknownMarkers = Array(63).fill(0).reduce((acc, v, i) => ({
  ...acc,
  [i + 0xffc0]: UnknownMarker
}), {});
const Marker = new VersionedStruct(uint16be, {
  ...unknownMarkers,
  0xffc0: StartOfFrameMarker,
  0xffc1: StartOfFrameMarker,
  0xffc2: StartOfFrameMarker,
  0xffc3: StartOfFrameMarker,
  0xffc4: DefineHuffmanTableMarker,
  0xffc5: StartOfFrameMarker,
  0xffc6: StartOfFrameMarker,
  0xffc7: StartOfFrameMarker,
  0xffc9: StartOfFrameMarker,
  0xffca: StartOfFrameMarker,
  0xffcb: StartOfFrameMarker,
  0xffcc: DACMarker,
  0xffcd: StartOfFrameMarker,
  0xffce: StartOfFrameMarker,
  0xffcf: StartOfFrameMarker,
  0xffd8: StartOfImageMarker,
  0xffd9: EndOfImageMarker,
  0xffda: SOSMarker,
  0xffdb: DQTMarker,
  0xffdd: DRIMarker,
  0xffe0: JFIFMarker,
  0xffe1: EXIFMarker
});
const JPEG$1 = new ArrayT(Marker);
const decode = buffer => {
  const markers = JPEG$1.fromBuffer(buffer);
  return markers.map(_ref => {
    let {
      version,
      ...rest
    } = _ref;
    return {
      type: version,
      ...rest
    };
  });
};
var _JPEG = {
  decode
};

class PNG {
  constructor(data) {
    this.data = void 0;
    this.width = void 0;
    this.height = void 0;
    this.format = void 0;
    const png = new PNG$1(data);
    this.data = data;
    this.width = png.width;
    this.height = png.height;
    this.format = 'png';
  }
  static isValid(data) {
    return data && Buffer.isBuffer(data) && data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71 && data[4] === 13 && data[5] === 10 && data[6] === 26 && data[7] === 10;
  }
}
class JPEG {
  constructor(data) {
    this.data = void 0;
    this.width = void 0;
    this.height = void 0;
    this.format = void 0;
    this.data = data;
    this.format = 'jpeg';
    this.width = 0;
    this.height = 0;
    if (data.readUInt16BE(0) !== 0xffd8) {
      throw new Error('SOI not found in JPEG');
    }
    const markers = _JPEG.decode(this.data);
    let orientation;
    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      if (marker.name === 'EXIF' && marker.entries.orientation) {
        orientation = marker.entries.orientation;
      }
      if (marker.name === 'SOF') {
        this.width ||= marker.width;
        this.height ||= marker.height;
      }
    }
    if (orientation > 4) {
      [this.width, this.height] = [this.height, this.width];
    }
  }
  static isValid(data) {
    return data && Buffer.isBuffer(data) && data.readUInt16BE(0) === 0xffd8;
  }
}
const createCache = function (_temp) {
  let {
    limit = 100
  } = _temp === void 0 ? {} : _temp;
  let cache = new Map();
  return {
    get: key => key ? cache.get(key) ?? undefined : null,
    set: (key, value) => {
      cache.delete(key);
      if (cache.size >= limit) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    reset: () => {
      cache = new Map();
    },
    length: () => cache.size
  };
};
const IMAGE_CACHE = createCache({
  limit: 30
});
const isBuffer = Buffer.isBuffer;
const isBlob = src => {
  return typeof Blob !== 'undefined' && src instanceof Blob;
};
const isDataImageSrc = src => {
  return 'data' in src;
};
const isDataUri = imageSrc => 'uri' in imageSrc && imageSrc.uri.startsWith('data:');
const getAbsoluteLocalPath = src => {
  const {
    protocol,
    auth,
    host,
    port,
    hostname,
    path: pathname
  } = url.parse(src);
  const absolutePath = pathname ? path.resolve(src) : undefined;
  if (protocol && protocol !== 'file:' || auth || host || port || hostname) {
    return undefined;
  }
  return absolutePath;
};
const fetchLocalFile = src => new Promise((resolve, reject) => {
  try {
    if (false) ;
    const absolutePath = getAbsoluteLocalPath(src.uri);
    if (!absolutePath) {
      reject(new Error(`Cannot fetch non-local path: ${src.uri}`));
      return;
    }
    fs.readFile(absolutePath, (err, data) => err ? reject(err) : resolve(data));
  } catch (err) {
    reject(err);
  }
});
const fetchRemoteFile = async src => {
  const {
    method = 'GET',
    headers,
    body,
    credentials
  } = src;
  const response = await fetch(src.uri, {
    method,
    headers,
    body,
    credentials
  });
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
};
const isValidFormat = format => {
  const lower = format.toLowerCase();
  return lower === 'jpg' || lower === 'jpeg' || lower === 'png';
};
const getImageFormat = buffer => {
  let format;
  if (JPEG.isValid(buffer)) {
    format = 'jpg';
  } else if (PNG.isValid(buffer)) {
    format = 'png';
  }
  return format;
};
function getImage(body, format) {
  switch (format.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return new JPEG(body);
    case 'png':
      return new PNG(body);
    default:
      return null;
  }
}
const resolveBase64Image = async _ref => {
  let {
    uri
  } = _ref;
  const match = /^data:image\/([a-zA-Z]*);base64,([^"]*)/g.exec(uri);
  if (!match) throw new Error(`Invalid base64 image: ${uri}`);
  const format = match[1];
  const data = match[2];
  if (!isValidFormat(format)) throw new Error(`Base64 image invalid format: ${format}`);
  return getImage(Buffer.from(data, 'base64'), format);
};
const resolveImageFromData = async src => {
  if (src.data && src.format) {
    return getImage(src.data, src.format);
  }
  throw new Error(`Invalid data given for local file: ${JSON.stringify(src)}`);
};
const resolveBufferImage = async buffer => {
  const format = getImageFormat(buffer);
  if (format) {
    return getImage(buffer, format);
  }
  return null;
};
const resolveBlobImage = async blob => {
  const {
    type
  } = blob;
  if (!type || type === 'application/octet-stream') {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return resolveBufferImage(buffer);
  }
  if (!type.startsWith('image/')) {
    throw new Error(`Invalid blob type: ${type}`);
  }
  const format = type.replace('image/', '');
  if (!isValidFormat(format)) {
    throw new Error(`Invalid blob type: ${type}`);
  }
  const buffer = await blob.arrayBuffer();
  return getImage(Buffer.from(buffer), format);
};
const resolveImageFromUrl = async src => {
  const data = getAbsoluteLocalPath(src.uri) ? await fetchLocalFile(src) : await fetchRemoteFile(src);
  const format = getImageFormat(data);
  if (!format) {
    throw new Error('Not valid image extension');
  }
  return getImage(data, format);
};
const getCacheKey = src => {
  var _src$data;
  if (isBlob(src) || isBuffer(src)) return null;
  if (isDataImageSrc(src)) return ((_src$data = src.data) === null || _src$data === void 0 ? void 0 : _src$data.toString('base64')) ?? null;
  return src.uri;
};
const resolveImage = function (src, _temp2) {
  let {
    cache = true
  } = _temp2 === void 0 ? {} : _temp2;
  let image;
  const cacheKey = getCacheKey(src);
  if (isBlob(src)) {
    image = resolveBlobImage(src);
  } else if (isBuffer(src)) {
    image = resolveBufferImage(src);
  } else if (cache && IMAGE_CACHE.get(cacheKey)) {
    return IMAGE_CACHE.get(cacheKey);
  } else if (isDataUri(src)) {
    image = resolveBase64Image(src);
  } else if (isDataImageSrc(src)) {
    image = resolveImageFromData(src);
  } else {
    image = resolveImageFromUrl(src);
  }
  if (cache && cacheKey) {
    IMAGE_CACHE.set(cacheKey, image);
  }
  return image;
};

/**
 * Apply transformation to text string
 *
 * @param {string} text
 * @param {string} transformation type
 * @returns {string} transformed text
 */
const transformText = (text, transformation) => {
  switch (transformation) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return capitalize(text);
    case 'upperfirst':
      return upperFirst(text);
    default:
      return text;
  }
};
const isTspan = node => node.type === P.Tspan;
const isTextInstance$4 = node => node.type === P.TextInstance;
const engines$1 = {
  bidi: bidiEngine,
  linebreaker,
  justification,
  textDecoration,
  scriptItemizer,
  wordHyphenation,
  fontSubstitution
};
const engine$1 = layoutEngine(engines$1);
const getFragments$1 = (fontStore, instance) => {
  if (!instance) return [{
    string: ''
  }];
  const fragments = [];
  const {
    fill = 'black',
    fontFamily = 'Helvetica',
    fontWeight,
    fontStyle,
    fontSize = 18,
    textDecorationColor,
    textDecorationStyle,
    textTransform,
    opacity
  } = instance.props;
  const _textDecoration = instance.props.textDecoration;
  const fontFamilies = typeof fontFamily === 'string' ? [fontFamily] : [...(fontFamily || [])];
  // Fallback font
  fontFamilies.push('Helvetica');
  const font = fontFamilies.map(fontFamilyName => {
    const opts = {
      fontFamily: fontFamilyName,
      fontWeight,
      fontStyle
    };
    const obj = fontStore.getFont(opts);
    return obj === null || obj === void 0 ? void 0 : obj.data;
  });
  const attributes = {
    font,
    opacity,
    fontSize,
    color: fill,
    underlineStyle: textDecorationStyle,
    underline: _textDecoration === 'underline' || _textDecoration === 'underline line-through' || _textDecoration === 'line-through underline',
    underlineColor: textDecorationColor || fill,
    strike: _textDecoration === 'line-through' || _textDecoration === 'underline line-through' || _textDecoration === 'line-through underline',
    strikeStyle: textDecorationStyle,
    strikeColor: textDecorationColor || fill
  };
  for (let i = 0; i < instance.children.length; i += 1) {
    const child = instance.children[i];
    if (isTextInstance$4(child)) {
      fragments.push({
        string: transformText(child.value, textTransform),
        attributes
      });
    } else if (child) {
      fragments.push(...getFragments$1(fontStore, child));
    }
  }
  return fragments;
};
const getAttributedString$1 = (fontStore, instance) => fromFragments(getFragments$1(fontStore, instance));
const AlmostInfinity = 999999999999;
const shrinkWhitespaceFactor = {
  before: -0.5,
  after: -0.5
};
const layoutTspan = fontStore => (node, xOffset) => {
  var _node$props;
  const attributedString = getAttributedString$1(fontStore, node);
  const x = node.props.x === undefined ? xOffset : node.props.x;
  const y = ((_node$props = node.props) === null || _node$props === void 0 ? void 0 : _node$props.y) || 0;
  const container = {
    x,
    y,
    width: AlmostInfinity,
    height: AlmostInfinity
  };
  const hyphenationCallback = node.props.hyphenationCallback || (fontStore === null || fontStore === void 0 ? void 0 : fontStore.getHyphenationCallback()) || null;
  const layoutOptions = {
    hyphenationCallback,
    shrinkWhitespaceFactor
  };
  const lines = engine$1(attributedString, container, layoutOptions).flat();
  return Object.assign({}, node, {
    lines
  });
};
// Consecutive TSpan elements should be joined with a space
const joinTSpanLines = node => {
  const children = node.children.map((child, index) => {
    if (!isTspan(child)) return child;
    const textInstance = child.children[0];
    if (child.props.x === undefined && index < node.children.length - 1 && textInstance !== null && textInstance !== void 0 && textInstance.value) {
      return Object.assign({}, child, {
        children: [{
          ...textInstance,
          value: `${textInstance.value} `
        }]
      });
    }
    return child;
  }, []);
  return Object.assign({}, node, {
    children
  });
};
const layoutText$1 = (fontStore, node) => {
  var _node$props2;
  if (!node.children) return node;
  let currentXOffset = ((_node$props2 = node.props) === null || _node$props2 === void 0 ? void 0 : _node$props2.x) || 0;
  const layoutFn = layoutTspan(fontStore);
  const joinedNode = joinTSpanLines(node);
  const children = joinedNode.children.map(child => {
    const childWithLayout = layoutFn(child, currentXOffset);
    currentXOffset += childWithLayout.lines[0].xAdvance;
    return childWithLayout;
  });
  return Object.assign({}, node, {
    children
  });
};
const isDefs = node => node.type === P.Defs;
const getDefs = node => {
  const children = node.children || [];
  const defs = children.find(isDefs);
  const values = (defs === null || defs === void 0 ? void 0 : defs.children) || [];
  return values.reduce((acc, value) => {
    var _value$props;
    const id = (_value$props = value.props) === null || _value$props === void 0 ? void 0 : _value$props.id;
    if (id) acc[id] = value;
    return acc;
  }, {});
};
const isNotDefs = node => node.type !== P.Defs;
const detachDefs = node => {
  if (!node.children) return node;
  const children = node.children.filter(isNotDefs);
  return Object.assign({}, node, {
    children
  });
};
const URL_REGEX = /url\(['"]?#([^'"]+)['"]?\)/;
const replaceDef = (defs, value) => {
  if (!value) return undefined;
  if (!URL_REGEX.test(value)) return value;
  const match = value.match(URL_REGEX);
  return defs[match[1]];
};
const parseNodeDefs = defs => node => {
  const props = node.props;
  const fill = `fill` in props ? replaceDef(defs, props === null || props === void 0 ? void 0 : props.fill) : undefined;
  const clipPath = `clipPath` in props ? replaceDef(defs, props === null || props === void 0 ? void 0 : props.clipPath) : undefined;
  const newProps = Object.assign({}, node.props, {
    fill,
    clipPath
  });
  const children = node.children ? node.children.map(parseNodeDefs(defs)) : undefined;
  return Object.assign({}, node, {
    props: newProps,
    children
  });
};
const parseDefs = root => {
  if (!root.children) return root;
  const defs = getDefs(root);
  const children = root.children.map(parseNodeDefs(defs));
  return Object.assign({}, root, {
    children
  });
};
const replaceDefs = node => {
  return detachDefs(parseDefs(node));
};
const parseViewbox = value => {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  const values = value.split(/[,\s]+/).map(parseFloat$1);
  if (values.length !== 4) return null;
  return {
    minX: values[0],
    minY: values[1],
    maxX: values[2],
    maxY: values[3]
  };
};
const getContainer$1 = node => {
  const viewbox = parseViewbox(node.props.viewBox);
  if (viewbox) {
    return {
      width: viewbox.maxX,
      height: viewbox.maxY
    };
  }
  if (node.props.width && node.props.height) {
    return {
      width: parseFloat$1(node.props.width),
      height: parseFloat$1(node.props.height)
    };
  }
  return {
    width: 0,
    height: 0
  };
};
const BASE_SVG_INHERITED_PROPS = ['x', 'y', 'clipPath', 'clipRule', 'opacity', 'fill', 'fillOpacity', 'fillRule', 'stroke', 'strokeLinecap', 'strokeLinejoin', 'strokeOpacity', 'strokeWidth', 'textAnchor', 'dominantBaseline', 'color', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'opacity', 'textDecoration', 'lineHeight', 'textAlign', 'visibility', 'wordSpacing'];
// Do not inherit "x" for <tspan> elements from <text> parent
const TEXT_SVG_INHERITED_PROPS = without(['x'], BASE_SVG_INHERITED_PROPS);
const SVG_INHERITED_PROPS = {
  [P.Text]: TEXT_SVG_INHERITED_PROPS
};
const getInheritProps = node => {
  const props = node.props || {};
  const svgInheritedProps = SVG_INHERITED_PROPS[node.type] ?? BASE_SVG_INHERITED_PROPS;
  return pick(svgInheritedProps, props);
};
const inheritProps = node => {
  if (!node.children) return node;
  const inheritedProps = getInheritProps(node);
  const children = node.children.map(child => {
    const props = Object.assign({}, inheritedProps, child.props || {});
    const newChild = Object.assign({}, child, {
      props
    });
    return inheritProps(newChild);
  });
  return Object.assign({}, node, {
    children
  });
};
const parseAspectRatio = value => {
  if (typeof value !== 'string') return value;
  const match = value.replace(/[\s\r\t\n]+/gm, ' ').replace(/^defer\s/, '').split(' ');
  const align = match[0] || 'xMidYMid';
  const meetOrSlice = match[1] || 'meet';
  return {
    align,
    meetOrSlice
  };
};
const STYLE_PROPS = ['width', 'height', 'color', 'stroke', 'strokeWidth', 'opacity', 'fillOpacity', 'strokeOpacity', 'fill', 'fillRule', 'clipPath', 'offset', 'transform', 'strokeLinejoin', 'strokeLinecap', 'strokeDasharray', 'gradientUnits', 'gradientTransform'];
const VERTICAL_PROPS = ['y', 'y1', 'y2', 'height', 'cy', 'ry'];
const HORIZONTAL_PROPS = ['x', 'x1', 'x2', 'width', 'cx', 'rx'];
const isSvg$3 = node => node.type === P.Svg;
const isText$5 = node => node.type === P.Text;
const isTextInstance$3 = node => node.type === P.TextInstance;
const transformPercent = container => props => mapValues(props, (value, key) => {
  const match = matchPercent(value);
  if (match && VERTICAL_PROPS.includes(key)) {
    return match.percent * container.height;
  }
  if (match && HORIZONTAL_PROPS.includes(key)) {
    return match.percent * container.width;
  }
  return value;
});
const parsePercent = value => {
  const match = matchPercent(value);
  return match ? match.percent : parseFloat$1(value);
};
const parseTransform = container => value => {
  return resolveStyles$1(container, {
    transform: value
  }).transform;
};
const parseProps = container => node => {
  let props = transformPercent(container)(node.props);
  props = evolve({
    x: parseFloat$1,
    x1: parseFloat$1,
    x2: parseFloat$1,
    y: parseFloat$1,
    y1: parseFloat$1,
    y2: parseFloat$1,
    r: parseFloat$1,
    rx: parseFloat$1,
    ry: parseFloat$1,
    cx: parseFloat$1,
    cy: parseFloat$1,
    width: parseFloat$1,
    height: parseFloat$1,
    offset: parsePercent,
    fill: transformColor,
    opacity: parsePercent,
    stroke: transformColor,
    stopOpacity: parsePercent,
    stopColor: transformColor,
    transform: parseTransform(container),
    gradientTransform: parseTransform(container)
  }, props);
  return Object.assign({}, node, {
    props
  });
};
const mergeStyles$1 = node => {
  const style = node.style || {};
  const props = Object.assign({}, style, node.props);
  return Object.assign({}, node, {
    props
  });
};
const removeNoneValues = node => {
  const removeNone = value => value === 'none' ? null : value;
  const props = mapValues(node.props, removeNone);
  return Object.assign({}, node, {
    props
  });
};
const pickStyleProps = node => {
  const props = node.props || {};
  const styleProps = pick(STYLE_PROPS, props);
  const style = Object.assign({}, styleProps, node.style || {});
  return Object.assign({}, node, {
    style
  });
};
const parseSvgProps = node => {
  const props = evolve({
    width: parseFloat$1,
    height: parseFloat$1,
    viewBox: parseViewbox,
    preserveAspectRatio: parseAspectRatio
  }, node.props);
  return Object.assign({}, node, {
    props
  });
};
const wrapBetweenTspan = node => ({
  type: P.Tspan,
  props: {},
  style: {},
  children: [node]
});
const addMissingTspan = node => {
  if (!isText$5(node)) return node;
  if (!node.children) return node;
  const resolveChild = child => isTextInstance$3(child) ? wrapBetweenTspan(child) : child;
  const children = node.children.map(resolveChild);
  return Object.assign({}, node, {
    children
  });
};
const parseText = fontStore => node => {
  if (isText$5(node)) return layoutText$1(fontStore, node);
  if (!node.children) return node;
  const children = node.children.map(parseText(fontStore));
  return Object.assign({}, node, {
    children
  });
};
const resolveSvgNode = container => compose(parseProps(container), addMissingTspan, removeNoneValues, mergeStyles$1);
const resolveChildren = container => node => {
  if (!node.children) return node;
  const resolveChild = compose(resolveChildren(container), resolveSvgNode(container));
  const children = node.children.map(resolveChild);
  return Object.assign({}, node, {
    children
  });
};
const buildXLinksIndex = node => {
  var _node$children;
  const idIndex = {};
  const listToExplore = ((_node$children = node.children) === null || _node$children === void 0 ? void 0 : _node$children.slice(0)) || [];
  while (listToExplore.length > 0) {
    const child = listToExplore.shift();
    if (child.props && 'id' in child.props) {
      idIndex[child.props.id] = child;
    }
    if (child.children) listToExplore.push(...child.children);
  }
  return idIndex;
};
const replaceXLinks = (node, idIndex) => {
  var _node$children2;
  if (node.props && 'xlinkHref' in node.props) {
    const linkedNode = idIndex[node.props.xlinkHref.replace(/^#/, '')];
    // No node to extend from
    if (!linkedNode) return node;
    const newProps = Object.assign({}, linkedNode.props, node.props);
    delete newProps.xlinkHref;
    return Object.assign({}, linkedNode, {
      props: newProps
    });
  }
  const children = (_node$children2 = node.children) === null || _node$children2 === void 0 ? void 0 : _node$children2.map(child => replaceXLinks(child, idIndex));
  return Object.assign({}, node, {
    children
  });
};
const resolveXLinks = node => {
  const idIndex = buildXLinksIndex(node);
  return replaceXLinks(node, idIndex);
};
const resolveSvgRoot = (node, fontStore) => {
  const container = getContainer$1(node);
  return compose(replaceDefs, parseText(fontStore), parseSvgProps, pickStyleProps, inheritProps, resolveChildren(container), resolveXLinks)(node);
};
/**
 * Pre-process SVG nodes so they can be rendered in the next steps
 *
 * @param node - Root node
 * @param fontStore - Font store
 * @returns Root node
 */
const resolveSvg = (node, fontStore) => {
  var _root$children;
  if (!('children' in node)) return node;
  const resolveChild = child => resolveSvg(child, fontStore);
  const root = isSvg$3(node) ? resolveSvgRoot(node, fontStore) : node;
  const children = (_root$children = root.children) === null || _root$children === void 0 ? void 0 : _root$children.map(resolveChild);
  return Object.assign({}, root, {
    children
  });
};
let instancePromise;
const loadYoga = async () => {
  // Yoga WASM binaries must be asynchronously compiled and loaded
  // to prevent Event emitter memory leak warnings, Yoga must be loaded only once
  const instance = await (instancePromise ??= loadYoga$1());
  const config = instance.Config.create();
  config.setPointScaleFactor(0);
  const node = {
    create: () => instance.Node.createWithConfig(config)
  };
  return {
    node
  };
};
const resolveYoga = async root => {
  const yoga = await loadYoga();
  return Object.assign({}, root, {
    yoga
  });
};
const getZIndex = node => node.style.zIndex;
const shouldSort = node => node.type !== P.Document && node.type !== P.Svg;
const sortZIndex = (a, b) => {
  const za = getZIndex(a);
  const zb = getZIndex(b);
  if (!za && !zb) return 0;
  if (!za) return 1;
  if (!zb) return -1;
  return zb - za;
};
/**
 * Sort children by zIndex value
 *
 * @param node
 * @returns Node
 */
const resolveNodeZIndex = node => {
  if (!node.children) return node;
  const sortedChildren = shouldSort(node) ? node.children.sort(sortZIndex) : node.children;
  const children = sortedChildren.map(resolveNodeZIndex);
  return Object.assign({}, node, {
    children
  });
};
/**
 * Sort children by zIndex value
 *
 * @param node
 * @returns Node
 */
const resolveZIndex = root => resolveNodeZIndex(root);

/* eslint-disable no-console */
// Caches emoji images data
const emojis = {};
const regex = emojiRegex();
/**
 * When an emoji as no variations, it might still have 2 parts,
 * the canonical emoji and an empty string.
 * ex.
 *   (no color) Array.from('❤️') => ["❤", "️"]
 *   (w/ color) Array.from('👍🏿') => ["👍", "🏿"]
 *
 * The empty string needs to be removed otherwise the generated
 * url will be incorect.
 */
const removeVariationSelectors = x => x !== '️';
const getCodePoints = function (string, withVariationSelectors) {
  if (withVariationSelectors === void 0) {
    withVariationSelectors = false;
  }
  return Array.from(string).filter(withVariationSelectors ? () => true : removeVariationSelectors).map(char => char.codePointAt(0).toString(16)).join('-');
};
const buildEmojiUrl = (emoji, source) => {
  if ('builder' in source) {
    return source.builder(getCodePoints(emoji, source.withVariationSelectors));
  }
  const {
    url,
    format = 'png',
    withVariationSelectors
  } = source;
  return `${url}${getCodePoints(emoji, withVariationSelectors)}.${format}`;
};
const fetchEmojis = (string, source) => {
  if (!source) return [];
  const promises = [];
  Array.from(string.matchAll(regex)).forEach(match => {
    const emoji = match[0];
    if (!emojis[emoji] || emojis[emoji].loading) {
      const emojiUrl = buildEmojiUrl(emoji, source);
      emojis[emoji] = {
        loading: true
      };
      promises.push(resolveImage({
        uri: emojiUrl
      }).then(image => {
        emojis[emoji].loading = false;
        emojis[emoji].data = image.data;
      }).catch(e => {
        console.warn(e, 'Failed to load emoji image');
        emojis[emoji].loading = false;
      }));
    }
  });
  return promises;
};
const embedEmojis = fragments => {
  const result = [];
  for (let i = 0; i < fragments.length; i += 1) {
    const fragment = fragments[i];
    let lastIndex = 0;
    Array.from(fragment.string.matchAll(regex)).forEach(match => {
      const {
        index
      } = match;
      const emoji = match[0];
      const emojiSize = fragment.attributes.fontSize;
      const chunk = fragment.string.slice(lastIndex, index + match[0].length);
      // If emoji image was found, we create a new fragment with the
      // correct attachment and object substitution character;
      if (emojis[emoji] && emojis[emoji].data) {
        result.push({
          string: chunk.replace(match[0], String.fromCharCode(0xfffc)),
          attributes: {
            ...fragment.attributes,
            attachment: {
              width: emojiSize,
              height: emojiSize,
              yOffset: Math.floor(emojiSize * 0.1),
              image: emojis[emoji].data
            }
          }
        });
      } else {
        // If no emoji data, we try to use emojis in the font
        result.push({
          string: chunk,
          attributes: fragment.attributes
        });
      }
      lastIndex = index + emoji.length;
    });
    if (lastIndex < fragment.string.length) {
      result.push({
        string: fragment.string.slice(lastIndex),
        attributes: fragment.attributes
      });
    }
  }
  return result;
};

/**
 * Get image source
 *
 * @param node - Image node
 * @returns Image src
 */
const getSource = node => {
  if (node.props.src) return node.props.src;
  if (node.props.source) return node.props.source;
};

/**
 * Resolves `src` to `@react-pdf/image` interface.
 *
 * Also it handles factories and async sources.
 *
 * @param src
 * @returns Resolved src
 */
const resolveSource = async src => {
  const source = typeof src === 'function' ? await src() : await src;
  return typeof source === 'string' ? {
    uri: source
  } : source;
};

/**
 * Fetches image and append data to node
 * Ideally this fn should be immutable.
 *
 * @param node
 */
const fetchImage = async node => {
  const src = getSource(node);
  const {
    cache
  } = node.props;
  if (!src) {
    console.warn(false, 'Image should receive either a "src" or "source" prop');
    return;
  }
  try {
    const source = await resolveSource(src);
    if (!source) {
      throw new Error(`Image's "src" or "source" prop returned ${source}`);
    }
    node.image = await resolveImage(source, {
      cache
    });
    if (Buffer.isBuffer(source) || source instanceof Blob) return;
    node.image.key = 'data' in source ? source.data.toString() : source.uri;
  } catch (e) {
    console.warn(e.message);
  }
};
const isImage$2 = node => node.type === P.Image;
/**
 * Get all asset promises that need to be resolved
 *
 * @param fontStore - Font store
 * @param node - Root node
 * @returns Asset promises
 */
const fetchAssets = (fontStore, node) => {
  var _node$children3;
  const promises = [];
  const listToExplore = ((_node$children3 = node.children) === null || _node$children3 === void 0 ? void 0 : _node$children3.slice(0)) || [];
  const emojiSource = fontStore ? fontStore.getEmojiSource() : null;
  while (listToExplore.length > 0) {
    var _n$style;
    const n = listToExplore.shift();
    if (isImage$2(n)) {
      promises.push(fetchImage(n));
    }
    if (fontStore && (_n$style = n.style) !== null && _n$style !== void 0 && _n$style.fontFamily) {
      const fontFamilies = castArray(n.style.fontFamily);
      promises.push(...fontFamilies.map(fontFamily => fontStore.load({
        fontFamily,
        fontStyle: n.style.fontStyle,
        fontWeight: n.style.fontWeight
      })));
    }
    if (typeof n === 'string') {
      promises.push(...fetchEmojis(n, emojiSource));
    }
    if ('value' in n && typeof n.value === 'string') {
      promises.push(...fetchEmojis(n.value, emojiSource));
    }
    if (n.children) {
      n.children.forEach(childNode => {
        listToExplore.push(childNode);
      });
    }
  }
  return promises;
};
/**
 * Fetch image, font and emoji assets in parallel.
 * Layout process will not be resumed until promise resolves.
 *
 * @param node root node
 * @param fontStore font store
 * @returns Root node
 */
const resolveAssets = async (node, fontStore) => {
  const promises = fetchAssets(fontStore, node);
  await Promise.all(promises);
  return node;
};
const isLink$1 = node => node.type === P.Link;
const DEFAULT_LINK_STYLES = {
  color: 'blue',
  textDecoration: 'underline'
};
/**
 * Computes styles using stylesheet
 *
 * @param container
 * @param node - Document node
 * @returns Computed styles
 */
const computeStyle = (container, node) => {
  let baseStyle = [node.style];
  if (isLink$1(node)) {
    baseStyle = Array.isArray(node.style) ? [DEFAULT_LINK_STYLES, ...node.style] : [DEFAULT_LINK_STYLES, node.style];
  }
  return resolveStyles$1(container, baseStyle);
};
/**
 * Resolves node styles
 *
 * @param container
 * @returns Resolve node styles
 */
const resolveNodeStyles = container => node => {
  const style = computeStyle(container, node);
  if (!node.children) return Object.assign({}, node, {
    style
  });
  const children = node.children.map(resolveNodeStyles(container));
  return Object.assign({}, node, {
    style,
    children
  });
};
/**
 * Resolves page styles
 *
 * @param page Document page
 * @returns Document page with resolved styles
 */
const resolvePageStyles = page => {
  var _page$props, _page$box, _page$box2, _page$props2;
  const dpi = ((_page$props = page.props) === null || _page$props === void 0 ? void 0 : _page$props.dpi) || 72;
  const style = page.style;
  const width = ((_page$box = page.box) === null || _page$box === void 0 ? void 0 : _page$box.width) || style.width;
  const height = ((_page$box2 = page.box) === null || _page$box2 === void 0 ? void 0 : _page$box2.height) || style.height;
  const orientation = ((_page$props2 = page.props) === null || _page$props2 === void 0 ? void 0 : _page$props2.orientation) || 'portrait';
  const remBase = (style === null || style === void 0 ? void 0 : style.fontSize) || 18;
  const container = {
    width,
    height,
    orientation,
    dpi,
    remBase
  };
  return resolveNodeStyles(container)(page);
};
/**
 * Resolves document styles
 *
 * @param root - Document root
 * @returns Document root with resolved styles
 */
const resolveStyles = root => {
  if (!root.children) return root;
  const children = root.children.map(resolvePageStyles);
  return Object.assign({}, root, {
    children
  });
};
const getTransformStyle = s => node => {
  var _node$style, _node$style2;
  return isNil((_node$style = node.style) === null || _node$style === void 0 ? void 0 : _node$style[s]) ? '50%' : ((_node$style2 = node.style) === null || _node$style2 === void 0 ? void 0 : _node$style2[s]) ?? null;
};
/**
 * Get node origin
 *
 * @param node
 * @returns {{ left?: number, top?: number }} node origin
 */
const getOrigin = node => {
  if (!node.box) return null;
  const {
    left,
    top,
    width,
    height
  } = node.box;
  const transformOriginX = getTransformStyle('transformOriginX')(node);
  const transformOriginY = getTransformStyle('transformOriginY')(node);
  const percentX = matchPercent(transformOriginX);
  const percentY = matchPercent(transformOriginY);
  const offsetX = percentX ? width * percentX.percent : transformOriginX;
  const offsetY = percentY ? height * percentY.percent : transformOriginY;
  if (isNil(offsetX) || typeof offsetX === 'string') throw new Error(`Invalid origin offsetX: ${offsetX}`);
  if (isNil(offsetY) || typeof offsetY === 'string') throw new Error(`Invalid origin offsetY: ${offsetY}`);
  return {
    left: left + offsetX,
    top: top + offsetY
  };
};

/**
 * Resolve node origin
 *
 * @param node
 * @returns Node with origin attribute
 */
const resolveNodeOrigin = node => {
  const origin = getOrigin(node);
  const newNode = Object.assign({}, node, {
    origin
  });
  if (!node.children) return newNode;
  const children = node.children.map(resolveNodeOrigin);
  return Object.assign({}, newNode, {
    children
  });
};
/**
 * Resolve document origins
 *
 * @param root - Document root
 * @returns Document root
 */
const resolveOrigin = root => {
  if (!root.children) return root;
  const children = root.children.map(resolveNodeOrigin);
  return Object.assign({}, root, {
    children
  });
};
const getBookmarkValue = bookmark => {
  return typeof bookmark === 'string' ? {
    title: bookmark,
    fit: false,
    expanded: false
  } : bookmark;
};
const resolveBookmarks = node => {
  let refs = 0;
  const children = (node.children || []).slice(0);
  const listToExplore = children.map(value => ({
    value,
    parent: null
  }));
  while (listToExplore.length > 0) {
    const element = listToExplore.shift();
    if (!element) break;
    const child = element.value;
    let parent = element.parent;
    if (child.props && 'bookmark' in child.props && child.props.bookmark) {
      var _parent;
      const bookmark = getBookmarkValue(child.props.bookmark);
      const ref = refs++;
      const newHierarchy = {
        ref,
        parent: (_parent = parent) === null || _parent === void 0 ? void 0 : _parent.ref,
        ...bookmark
      };
      child.props.bookmark = newHierarchy;
      parent = newHierarchy;
    }
    if (child.children) {
      child.children.forEach(childNode => {
        listToExplore.push({
          value: childNode,
          parent
        });
      });
    }
  }
  return node;
};
const VALID_ORIENTATIONS = ['portrait', 'landscape'];
/**
 * Get page orientation. Defaults to portrait
 *
 * @param page - Page object
 * @returns Page orientation
 */
const getOrientation = page => {
  var _page$props3;
  const value = ((_page$props3 = page.props) === null || _page$props3 === void 0 ? void 0 : _page$props3.orientation) || 'portrait';
  return VALID_ORIENTATIONS.includes(value) ? value : 'portrait';
};

/**
 * Return true if page is landscape
 *
 * @param page - Page instance
 * @returns Is page landscape
 */
const isLandscape = page => getOrientation(page) === 'landscape';

// Page sizes for 72dpi. 72dpi is used internally by pdfkit.
const PAGE_SIZES = {
  '4A0': [4767.87, 6740.79],
  '2A0': [3370.39, 4767.87],
  A0: [2383.94, 3370.39],
  A1: [1683.78, 2383.94],
  A2: [1190.55, 1683.78],
  A3: [841.89, 1190.55],
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  A6: [297.64, 419.53],
  A7: [209.76, 297.64],
  A8: [147.4, 209.76],
  A9: [104.88, 147.4],
  A10: [73.7, 104.88],
  B0: [2834.65, 4008.19],
  B1: [2004.09, 2834.65],
  B2: [1417.32, 2004.09],
  B3: [1000.63, 1417.32],
  B4: [708.66, 1000.63],
  B5: [498.9, 708.66],
  B6: [354.33, 498.9],
  B7: [249.45, 354.33],
  B8: [175.75, 249.45],
  B9: [124.72, 175.75],
  B10: [87.87, 124.72],
  C0: [2599.37, 3676.54],
  C1: [1836.85, 2599.37],
  C2: [1298.27, 1836.85],
  C3: [918.43, 1298.27],
  C4: [649.13, 918.43],
  C5: [459.21, 649.13],
  C6: [323.15, 459.21],
  C7: [229.61, 323.15],
  C8: [161.57, 229.61],
  C9: [113.39, 161.57],
  C10: [79.37, 113.39],
  RA0: [2437.8, 3458.27],
  RA1: [1729.13, 2437.8],
  RA2: [1218.9, 1729.13],
  RA3: [864.57, 1218.9],
  RA4: [609.45, 864.57],
  SRA0: [2551.18, 3628.35],
  SRA1: [1814.17, 2551.18],
  SRA2: [1275.59, 1814.17],
  SRA3: [907.09, 1275.59],
  SRA4: [637.8, 907.09],
  EXECUTIVE: [521.86, 756.0],
  FOLIO: [612.0, 936.0],
  LEGAL: [612.0, 1008.0],
  LETTER: [612.0, 792.0],
  TABLOID: [792.0, 1224.0],
  ID1: [153, 243]
};
/**
 * Parses scalar value in value and unit pairs
 *
 * @param value - Scalar value
 * @returns Parsed value
 */
const parseValue = value => {
  if (typeof value === 'number') return {
    value,
    unit: undefined
  };
  const match = /^(-?\d*\.?\d+)(in|mm|cm|pt|px)?$/g.exec(value);
  return match ? {
    value: parseFloat(match[1]),
    unit: match[2] || 'pt'
  } : {
    value,
    unit: undefined
  };
};
/**
 * Transform given scalar value to 72dpi equivalent of size
 *
 * @param value - Styles value
 * @param inputDpi - User defined dpi
 * @returns Transformed value
 */
const transformUnit = (value, inputDpi) => {
  if (!value) return 0;
  const scalar = parseValue(value);
  const outputDpi = 72;
  const mmFactor = 1 / 25.4 * outputDpi;
  const cmFactor = 1 / 2.54 * outputDpi;
  if (typeof scalar.value === 'string') throw new Error(`Invalid page size: ${value}`);
  switch (scalar.unit) {
    case 'in':
      return scalar.value * outputDpi;
    case 'mm':
      return scalar.value * mmFactor;
    case 'cm':
      return scalar.value * cmFactor;
    case 'px':
      return Math.round(scalar.value * (outputDpi / inputDpi));
    default:
      return scalar.value;
  }
};
const transformUnits = (_ref, dpi) => {
  let {
    width,
    height
  } = _ref;
  return {
    width: transformUnit(width, dpi),
    height: transformUnit(height, dpi)
  };
};
/**
 * Transforms array into size object
 *
 * @param v - Values array
 * @returns Size object with width and height
 */
const toSizeObject = v => ({
  width: v[0],
  height: v[1]
});
/**
 * Flip size object
 *
 * @param v - Size object
 * @returns Flipped size object
 */
const flipSizeObject = v => ({
  width: v.height,
  height: v.width
});
/**
 * Returns size object from a given string
 *
 * @param v - Page size string
 * @returns Size object with width and height
 */
const getStringSize = v => {
  return toSizeObject(PAGE_SIZES[v.toUpperCase()]);
};
/**
 * Returns size object from a single number
 *
 * @param n - Page size number
 * @returns Size object with width and height
 */
const getNumberSize = n => toSizeObject([n, n]);
/**
 * Return page size in an object { width, height }
 *
 * @param page - Page node
 * @returns Size object with width and height
 */
const getSize = page => {
  var _page$props4, _page$props5;
  const value = ((_page$props4 = page.props) === null || _page$props4 === void 0 ? void 0 : _page$props4.size) || 'A4';
  const dpi = ((_page$props5 = page.props) === null || _page$props5 === void 0 ? void 0 : _page$props5.dpi) || 72;
  let size;
  if (typeof value === 'string') {
    size = getStringSize(value);
  } else if (Array.isArray(value)) {
    size = transformUnits(toSizeObject(value), dpi);
  } else if (typeof value === 'number') {
    size = transformUnits(getNumberSize(value), dpi);
  } else {
    size = transformUnits(value, dpi);
  }
  return isLandscape(page) ? flipSizeObject(size) : size;
};

/**
 * Resolves page size
 *
 * @param page
 * @returns Page with resolved size in style attribute
 */
const resolvePageSize = page => {
  const size = getSize(page);
  const style = flatten$1(page.style || {});
  return {
    ...page,
    style: {
      ...style,
      ...size
    }
  };
};
/**
 * Resolves page sizes
 *
 * @param root  -Document root
 * @returns Document root with resolved page sizes
 */
const resolvePageSizes = root => {
  if (!root.children) return root;
  const children = root.children.map(resolvePageSize);
  return Object.assign({}, root, {
    children
  });
};
const isFixed = node => {
  if (!node.props) return false;
  return 'fixed' in node.props ? node.props.fixed === true : false;
};

/**
 * Get line index at given height
 *
 * @param node
 * @param height
 */
const lineIndexAtHeight = (node, height) => {
  let y = 0;
  if (!node.lines) return 0;
  for (let i = 0; i < node.lines.length; i += 1) {
    const line = node.lines[i];
    if (y + line.box.height > height) return i;
    y += line.box.height;
  }
  return node.lines.length;
};

/**
 * Get height for given text line index
 *
 * @param node
 * @param index
 */
const heightAtLineIndex = (node, index) => {
  let counter = 0;
  if (!node.lines) return counter;
  for (let i = 0; i < index; i += 1) {
    const line = node.lines[i];
    if (!line) break;
    counter += line.box.height;
  }
  return counter;
};
const getLineBreak = (node, height) => {
  var _node$box;
  const top = ((_node$box = node.box) === null || _node$box === void 0 ? void 0 : _node$box.top) || 0;
  const widows = node.props.widows || 2;
  const orphans = node.props.orphans || 2;
  const linesQuantity = node.lines.length;
  const slicedLine = lineIndexAtHeight(node, height - top);
  if (slicedLine === 0) {
    return 0;
  }
  if (linesQuantity < orphans) {
    return linesQuantity;
  }
  if (slicedLine < orphans || linesQuantity < orphans + widows) {
    return 0;
  }
  if (linesQuantity === orphans + widows) {
    return orphans;
  }
  if (linesQuantity - slicedLine < widows) {
    return linesQuantity - widows;
  }
  return slicedLine;
};
// Also receives contentArea in case it's needed
const splitText = (node, height) => {
  const slicedLineIndex = getLineBreak(node, height);
  const currentHeight = heightAtLineIndex(node, slicedLineIndex);
  const nextHeight = node.box.height - currentHeight;
  const current = Object.assign({}, node, {
    box: {
      ...node.box,
      height: currentHeight,
      borderBottomWidth: 0
    },
    style: {
      ...node.style,
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    },
    lines: node.lines.slice(0, slicedLineIndex)
  });
  const next = Object.assign({}, node, {
    box: {
      ...node.box,
      top: 0,
      height: nextHeight,
      borderTopWidth: 0
    },
    style: {
      ...node.style,
      marginTop: 0,
      paddingTop: 0,
      borderTopWidth: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0
    },
    lines: node.lines.slice(slicedLineIndex)
  });
  return [current, next];
};
const getTop$1 = node => {
  var _node$box2;
  return ((_node$box2 = node.box) === null || _node$box2 === void 0 ? void 0 : _node$box2.top) || 0;
};
const hasFixedHeight = node => {
  var _node$style3;
  return !isNil((_node$style3 = node.style) === null || _node$style3 === void 0 ? void 0 : _node$style3.height);
};
const splitNode = (node, height) => {
  if (!node) return [null, null];
  const nodeTop = getTop$1(node);
  const current = Object.assign({}, node, {
    box: {
      ...node.box,
      borderBottomWidth: 0
    },
    style: {
      ...node.style,
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    }
  });
  current.style.height = height - nodeTop;
  const nextHeight = hasFixedHeight(node) ? node.box.height - (height - nodeTop) : null;
  const next = Object.assign({}, node, {
    box: {
      ...node.box,
      top: 0,
      borderTopWidth: 0
    },
    style: {
      ...node.style,
      marginTop: 0,
      paddingTop: 0,
      borderTopWidth: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0
    },
    props: {
      ...node.props,
      bookmark: null
    }
  });
  if (nextHeight) {
    next.style.height = nextHeight;
  }
  return [current, next];
};
const NON_WRAP_TYPES = [P.Svg, P.Note, P.Image, P.Canvas];
const getWrap = node => {
  if (NON_WRAP_TYPES.includes(node.type)) return false;
  if (!node.props) return true;
  return 'wrap' in node.props ? node.props.wrap : true;
};
const getComputedPadding = (node, edge) => {
  const {
    yogaNode
  } = node;
  return yogaNode ? yogaNode.getComputedPadding(edge) : null;
};
/**
 * Get Yoga computed paddings. Zero otherwise
 *
 * @param  node
 * @returns paddings
 */
const getPadding = node => {
  const {
    style,
    box
  } = node;
  const paddingTop = getComputedPadding(node, Edge.Top) || (box === null || box === void 0 ? void 0 : box.paddingTop) || (style === null || style === void 0 ? void 0 : style.paddingTop) || 0;
  const paddingRight = getComputedPadding(node, Edge.Right) || (box === null || box === void 0 ? void 0 : box.paddingRight) || (style === null || style === void 0 ? void 0 : style.paddingRight) || 0;
  const paddingBottom = getComputedPadding(node, Edge.Bottom) || (box === null || box === void 0 ? void 0 : box.paddingBottom) || (style === null || style === void 0 ? void 0 : style.paddingBottom) || 0;
  const paddingLeft = getComputedPadding(node, Edge.Left) || (box === null || box === void 0 ? void 0 : box.paddingLeft) || (style === null || style === void 0 ? void 0 : style.paddingLeft) || 0;
  return {
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft
  };
};
const getWrapArea = page => {
  var _page$style;
  const height = (_page$style = page.style) === null || _page$style === void 0 ? void 0 : _page$style.height;
  const {
    paddingBottom
  } = getPadding(page);
  return height - paddingBottom;
};
const getContentArea = page => {
  var _page$style2;
  const height = (_page$style2 = page.style) === null || _page$style2 === void 0 ? void 0 : _page$style2.height;
  const {
    paddingTop,
    paddingBottom
  } = getPadding(page);
  return height - paddingBottom - paddingTop;
};
const isString = value => typeof value === 'string';
const isNumber = value => typeof value === 'number';
const isBoolean = value => typeof value === 'boolean';
const isFragment = value => value && value.type === Symbol.for('react.fragment');
/**
 * Transforms a react element instance to internal element format.
 *
 * Can return multiple instances in the case of arrays or fragments.
 *
 * @param element - React element
 * @returns Parsed React elements
 */
const createInstances = element => {
  if (!element) return [];
  if (Array.isArray(element)) {
    return element.reduce((acc, el) => acc.concat(createInstances(el)), []);
  }
  if (isBoolean(element)) {
    return [];
  }
  if (isString(element) || isNumber(element)) {
    return [{
      type: P.TextInstance,
      value: `${element}`
    }];
  }
  if (isFragment(element)) {
    // @ts-expect-error figure out why this is complains
    return createInstances(element.props.children);
  }
  if (!isString(element.type)) {
    // @ts-expect-error figure out why this is complains
    return createInstances(element.type(element.props));
  }
  const {
    type,
    props: {
      style = {},
      children,
      ...props
    }
  } = element;
  const nextChildren = castArray(children).reduce((acc, child) => acc.concat(createInstances(child)), []);
  return [{
    type,
    style,
    props,
    children: nextChildren
  }];
};
const getBreak = node => 'break' in node.props ? node.props.break : false;
const getMinPresenceAhead = node => 'minPresenceAhead' in node.props ? node.props.minPresenceAhead : 0;
const getFurthestEnd = elements => Math.max(...elements.map(node => node.box.top + node.box.height));
const getEndOfMinPresenceAhead = child => {
  return child.box.top + child.box.height + child.box.marginBottom + getMinPresenceAhead(child);
};
const getEndOfPresence = (child, futureElements) => {
  const afterMinPresenceAhead = getEndOfMinPresenceAhead(child);
  const endOfFurthestFutureElement = getFurthestEnd(futureElements.filter(node => !('fixed' in node.props)));
  return Math.min(afterMinPresenceAhead, endOfFurthestFutureElement);
};
const shouldBreak = (child, futureElements, height, previousElements) => {
  if ('fixed' in child.props) return false;
  const shouldSplit = height < child.box.top + child.box.height;
  const canWrap = getWrap(child);
  // Calculate the y coordinate where the desired presence of the child ends
  const endOfPresence = getEndOfPresence(child, futureElements);
  // If the child is already at the top of the page, breaking won't improve its presence
  // (as long as react-pdf does not support breaking into differently sized containers)
  const breakingImprovesPresence = previousElements.filter(node => !isFixed(node)).length > 0;
  return getBreak(child) || shouldSplit && !canWrap || !shouldSplit && endOfPresence > height && breakingImprovesPresence;
};
const IGNORABLE_CODEPOINTS = [8232,
// LINE_SEPARATOR
8233 // PARAGRAPH_SEPARATOR
];
const buildSubsetForFont = font => IGNORABLE_CODEPOINTS.reduce((acc, codePoint) => {
  if (font && font.hasGlyphForCodePoint && font.hasGlyphForCodePoint(codePoint)) {
    return acc;
  }
  return [...acc, String.fromCharCode(codePoint)];
}, []);
const ignoreChars = fragments => fragments.map(fragment => {
  const charSubset = buildSubsetForFont(fragment.attributes.font[0]);
  const subsetRegex = new RegExp(charSubset.join('|'));
  return {
    string: fragment.string.replace(subsetRegex, ''),
    attributes: fragment.attributes
  };
});
const PREPROCESSORS = [ignoreChars, embedEmojis];
const isImage$1 = node => node.type === P.Image;
const isTextInstance$2 = node => node.type === P.TextInstance;
/**
 * Get textkit fragments of given node object
 *
 * @param fontStore - Font store
 * @param instance - Node
 * @param parentLink - Parent link
 * @param level - Fragment level
 * @returns Text fragments
 */
const getFragments = function (fontStore, instance, parentLink, level) {
  var _instance$props, _instance$props2;
  if (parentLink === void 0) {
    parentLink = null;
  }
  if (level === void 0) {
    level = 0;
  }
  if (!instance) return [{
    string: ''
  }];
  let fragments = [];
  const {
    color = 'black',
    direction = 'ltr',
    fontFamily = 'Helvetica',
    fontWeight,
    fontStyle,
    fontSize = 18,
    textAlign,
    lineHeight,
    textDecoration,
    textDecorationColor,
    textDecorationStyle,
    textTransform,
    letterSpacing,
    textIndent,
    opacity,
    verticalAlign
  } = instance.style;
  const fontFamilies = typeof fontFamily === 'string' ? [fontFamily] : [...(fontFamily || [])];
  // Fallback font
  fontFamilies.push('Helvetica');
  const font = fontFamilies.map(fontFamilyName => {
    const opts = {
      fontFamily: fontFamilyName,
      fontWeight,
      fontStyle
    };
    const obj = fontStore.getFont(opts);
    return obj === null || obj === void 0 ? void 0 : obj.data;
  });
  // Don't pass main background color to textkit. Will be rendered by the render package instead
  const backgroundColor = level === 0 ? null : instance.style.backgroundColor;
  const attributes = {
    font,
    color,
    opacity,
    fontSize,
    lineHeight,
    direction,
    verticalAlign,
    backgroundColor,
    indent: textIndent,
    characterSpacing: letterSpacing,
    strikeStyle: textDecorationStyle,
    underlineStyle: textDecorationStyle,
    underline: textDecoration === 'underline' || textDecoration === 'underline line-through' || textDecoration === 'line-through underline',
    strike: textDecoration === 'line-through' || textDecoration === 'underline line-through' || textDecoration === 'line-through underline',
    strikeColor: textDecorationColor || color,
    underlineColor: textDecorationColor || color,
    // @ts-expect-error allow this props access
    link: parentLink || ((_instance$props = instance.props) === null || _instance$props === void 0 ? void 0 : _instance$props.src) || ((_instance$props2 = instance.props) === null || _instance$props2 === void 0 ? void 0 : _instance$props2.href),
    align: textAlign || (direction === 'rtl' ? 'right' : 'left')
  };
  for (let i = 0; i < instance.children.length; i += 1) {
    const child = instance.children[i];
    if (isImage$1(child)) {
      fragments.push({
        string: String.fromCharCode(0xfffc),
        attributes: {
          ...attributes,
          attachment: {
            width: child.style.width || fontSize,
            height: child.style.height || fontSize,
            image: child.image.data
          }
        }
      });
    } else if (isTextInstance$2(child)) {
      fragments.push({
        string: transformText(child.value, textTransform),
        attributes
      });
    } else if (child) {
      fragments.push(...getFragments(fontStore, child, attributes.link, level + 1));
    }
  }
  for (let i = 0; i < PREPROCESSORS.length; i += 1) {
    const preprocessor = PREPROCESSORS[i];
    fragments = preprocessor(fragments);
  }
  return fragments;
};
/**
 * Get textkit attributed string from text node
 *
 * @param fontStore - Font store
 * @param instance Node
 * @returns Attributed string
 */
const getAttributedString = (fontStore, instance) => {
  const fragments = getFragments(fontStore, instance);
  return fromFragments(fragments);
};
const engines = {
  bidi: bidiEngine,
  linebreaker,
  justification,
  textDecoration,
  scriptItemizer,
  wordHyphenation,
  fontSubstitution
};
const engine = layoutEngine(engines);
const getMaxLines = node => {
  var _node$style4;
  return (_node$style4 = node.style) === null || _node$style4 === void 0 ? void 0 : _node$style4.maxLines;
};
const getTextOverflow = node => {
  var _node$style5;
  return (_node$style5 = node.style) === null || _node$style5 === void 0 ? void 0 : _node$style5.textOverflow;
};
/**
 * Get layout container for specific text node
 *
 * @param {number} width
 * @param {number} height
 * @param {Object} node
 * @returns {Object} layout container
 */
const getContainer = (width, height, node) => {
  const maxLines = getMaxLines(node);
  const textOverflow = getTextOverflow(node);
  return {
    x: 0,
    y: 0,
    width,
    maxLines,
    height: height || Infinity,
    truncateMode: textOverflow
  };
};
/**
 * Get text layout options for specific text node
 *
 * @param {Object} node instance
 * @returns {Object} layout options
 */
const getLayoutOptions = (fontStore, node) => ({
  hyphenationPenalty: node.props.hyphenationPenalty,
  shrinkWhitespaceFactor: {
    before: -0.5,
    after: -0.5
  },
  hyphenationCallback: node.props.hyphenationCallback || (fontStore === null || fontStore === void 0 ? void 0 : fontStore.getHyphenationCallback()) || null
});
/**
 * Get text lines for given node
 *
 * @param node - Node
 * @param width - Container width
 * @param height - Container height
 * @param fontStore - Font store
 * @returns Layout lines
 */
const layoutText = (node, width, height, fontStore) => {
  const attributedString = getAttributedString(fontStore, node);
  const container = getContainer(width, height, node);
  const options = getLayoutOptions(fontStore, node);
  const lines = engine(attributedString, container, options);
  return lines.reduce((acc, line) => [...acc, ...line], []);
};
const isSvg$2 = node => node.type === P.Svg;
const isText$4 = node => node.type === P.Text;
const shouldIterate = node => !isSvg$2(node) && !isText$4(node);
const shouldLayoutText = node => isText$4(node) && !node.lines;
/**
 * Performs text layout on text node if wasn't calculated before.
 * Text layout is usually performed on Yoga's layout process (via setMeasureFunc),
 * but we need to layout those nodes with fixed width and height.
 *
 * @param node
 * @returns Layout node
 */
const resolveTextLayout = (node, fontStore) => {
  if (shouldLayoutText(node)) {
    const width = node.box.width - (node.box.paddingRight + node.box.paddingLeft);
    const height = node.box.height - (node.box.paddingTop + node.box.paddingBottom);
    node.lines = layoutText(node, width, height, fontStore);
  }
  if (shouldIterate(node)) {
    if (!node.children) return node;
    const mapChild = child => resolveTextLayout(child, fontStore);
    const children = node.children.map(mapChild);
    return Object.assign({}, node, {
      children
    });
  }
  return node;
};
const BASE_INHERITABLE_PROPERTIES = ['color', 'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'opacity', 'textDecoration', 'textTransform', 'lineHeight', 'textAlign', 'visibility', 'wordSpacing'];
const TEXT_INHERITABLE_PROPERTIES = [...BASE_INHERITABLE_PROPERTIES, 'backgroundColor'];
const isType$2 = type => node => node.type === type;
const isSvg$1 = isType$2(P.Svg);
const isText$3 = isType$2(P.Text);
// Merge style values
const mergeValues = (styleName, value, inheritedValue) => {
  switch (styleName) {
    case 'textDecoration':
      {
        // merge not none and not false textDecoration values to one rule
        return [inheritedValue, value].filter(v => v && v !== 'none').join(' ');
      }
    default:
      return value;
  }
};
// Merge inherited and node styles
const merge = (inheritedStyles, style) => {
  const mergedStyles = {
    ...inheritedStyles
  };
  Object.entries(style).forEach(_ref2 => {
    let [styleName, value] = _ref2;
    mergedStyles[styleName] = mergeValues(styleName, value, inheritedStyles[styleName]);
  });
  return mergedStyles;
};
/**
 * Merges styles with node
 *
 * @param inheritedStyles - Style object
 * @returns Merge styles function
 */
const mergeStyles = inheritedStyles => node => {
  const style = merge(inheritedStyles, node.style || {});
  return Object.assign({}, node, {
    style
  });
};
/**
 * Inherit style values from the root to the leafs
 *
 * @param node - Document root
 * @returns Document root with inheritance
 *
 */
const resolveInheritance = node => {
  if (isSvg$1(node)) return node;
  if (!('children' in node)) return node;
  const inheritableProperties = isText$3(node) ? TEXT_INHERITABLE_PROPERTIES : BASE_INHERITABLE_PROPERTIES;
  const inheritStyles = pick(inheritableProperties, node.style || {});
  const resolveChild = compose(resolveInheritance, mergeStyles(inheritStyles));
  const children = node.children.map(resolveChild);
  return Object.assign({}, node, {
    children
  });
};
const getComputedMargin = (node, edge) => {
  const {
    yogaNode
  } = node;
  return yogaNode ? yogaNode.getComputedMargin(edge) : null;
};
/**
 * Get Yoga computed magins. Zero otherwise
 *
 * @param node
 * @returns Margins
 */
const getMargin = node => {
  const {
    style,
    box
  } = node;
  const marginTop = getComputedMargin(node, Edge.Top) || (box === null || box === void 0 ? void 0 : box.marginTop) || (style === null || style === void 0 ? void 0 : style.marginTop) || 0;
  const marginRight = getComputedMargin(node, Edge.Right) || (box === null || box === void 0 ? void 0 : box.marginRight) || (style === null || style === void 0 ? void 0 : style.marginRight) || 0;
  const marginBottom = getComputedMargin(node, Edge.Bottom) || (box === null || box === void 0 ? void 0 : box.marginBottom) || (style === null || style === void 0 ? void 0 : style.marginBottom) || 0;
  const marginLeft = getComputedMargin(node, Edge.Left) || (box === null || box === void 0 ? void 0 : box.marginLeft) || (style === null || style === void 0 ? void 0 : style.marginLeft) || 0;
  return {
    marginTop,
    marginRight,
    marginBottom,
    marginLeft
  };
};

/**
 * Get Yoga computed position. Zero otherwise
 *
 * @param node
 * @returns Position
 */
const getPosition = node => {
  const {
    yogaNode
  } = node;
  return {
    top: (yogaNode === null || yogaNode === void 0 ? void 0 : yogaNode.getComputedTop()) || 0,
    right: (yogaNode === null || yogaNode === void 0 ? void 0 : yogaNode.getComputedRight()) || 0,
    bottom: (yogaNode === null || yogaNode === void 0 ? void 0 : yogaNode.getComputedBottom()) || 0,
    left: (yogaNode === null || yogaNode === void 0 ? void 0 : yogaNode.getComputedLeft()) || 0
  };
};
const DEFAULT_DIMENSION = {
  width: 0,
  height: 0
};
/**
 * Get Yoga computed dimensions. Zero otherwise
 *
 * @param node
 * @returns Dimensions
 */
const getDimension = node => {
  const {
    yogaNode
  } = node;
  if (!yogaNode) return DEFAULT_DIMENSION;
  return {
    width: yogaNode.getComputedWidth(),
    height: yogaNode.getComputedHeight()
  };
};
const getComputedBorder = (yogaNode, edge) => yogaNode ? yogaNode.getComputedBorder(edge) : 0;
/**
 * Get Yoga computed border width. Zero otherwise
 *
 * @param node
 * @returns Border widths
 */
const getBorderWidth = node => {
  const {
    yogaNode
  } = node;
  return {
    borderTopWidth: getComputedBorder(yogaNode, Edge.Top),
    borderRightWidth: getComputedBorder(yogaNode, Edge.Right),
    borderBottomWidth: getComputedBorder(yogaNode, Edge.Bottom),
    borderLeftWidth: getComputedBorder(yogaNode, Edge.Left)
  };
};

/**
 * Set display attribute to node's Yoga instance
 *
 * @param value - Display
 * @returns Node instance wrapper
 */
const setDisplay = value => node => {
  const {
    yogaNode
  } = node;
  if (yogaNode) {
    yogaNode.setDisplay(value === 'none' ? Display.None : Display.Flex);
  }
  return node;
};
const OVERFLOW = {
  hidden: Overflow.Hidden,
  scroll: Overflow.Scroll
};
/**
 * Set overflow attribute to node's Yoga instance
 *
 * @param value - Overflow value
 * @returns Node instance wrapper
 */
const setOverflow = value => node => {
  const {
    yogaNode
  } = node;
  if (!isNil(value) && yogaNode) {
    const overflow = OVERFLOW[value] || Overflow.Visible;
    yogaNode.setOverflow(overflow);
  }
  return node;
};
const FLEX_WRAP = {
  wrap: Wrap.Wrap,
  'wrap-reverse': Wrap.WrapReverse
};
/**
 * Set flex wrap attribute to node's Yoga instance
 *
 * @param value - Flex wrap value
 * @returns Node instance wrapper
 */
const setFlexWrap = value => node => {
  const {
    yogaNode
  } = node;
  if (yogaNode) {
    const flexWrap = FLEX_WRAP[value] || Wrap.NoWrap;
    yogaNode.setFlexWrap(flexWrap);
  }
  return node;
};

/**
 * Set generic yoga attribute to node's Yoga instance, handing `auto`, edges and percentage cases
 *
 * @param attr - Property
 * @param edge - Edge
 * @returns Node instance wrapper
 */
const setYogaValue = (attr, edge) => value => node => {
  const {
    yogaNode
  } = node;
  if (!isNil(value) && yogaNode) {
    const hasEdge = !isNil(edge);
    const fixedMethod = `set${upperFirst(attr)}`;
    const autoMethod = `${fixedMethod}Auto`;
    const percentMethod = `${fixedMethod}Percent`;
    const percent = matchPercent(value);
    if (percent && !yogaNode[percentMethod]) {
      throw new Error(`You can't pass percentage values to ${attr} property`);
    }
    if (percent) {
      if (hasEdge) {
        var _yogaNode$percentMeth;
        (_yogaNode$percentMeth = yogaNode[percentMethod]) === null || _yogaNode$percentMeth === void 0 ? void 0 : _yogaNode$percentMeth.call(yogaNode, edge, percent.value);
      } else {
        var _yogaNode$percentMeth2;
        (_yogaNode$percentMeth2 = yogaNode[percentMethod]) === null || _yogaNode$percentMeth2 === void 0 ? void 0 : _yogaNode$percentMeth2.call(yogaNode, percent.value);
      }
    } else if (value === 'auto') {
      if (hasEdge) {
        var _yogaNode$autoMethod;
        (_yogaNode$autoMethod = yogaNode[autoMethod]) === null || _yogaNode$autoMethod === void 0 ? void 0 : _yogaNode$autoMethod.call(yogaNode, edge);
      } else {
        var _yogaNode$autoMethod2;
        (_yogaNode$autoMethod2 = yogaNode[autoMethod]) === null || _yogaNode$autoMethod2 === void 0 ? void 0 : _yogaNode$autoMethod2.call(yogaNode);
      }
    } else if (hasEdge) {
      var _yogaNode$fixedMethod;
      (_yogaNode$fixedMethod = yogaNode[fixedMethod]) === null || _yogaNode$fixedMethod === void 0 ? void 0 : _yogaNode$fixedMethod.call(yogaNode, edge, value);
    } else {
      var _yogaNode$fixedMethod2;
      (_yogaNode$fixedMethod2 = yogaNode[fixedMethod]) === null || _yogaNode$fixedMethod2 === void 0 ? void 0 : _yogaNode$fixedMethod2.call(yogaNode, value);
    }
  }
  return node;
};

/**
 * Set flex grow attribute to node's Yoga instance
 *
 * @param  value - Flex grow value
 * @returns Node instance wrapper
 */
const setFlexGrow = value => node => {
  return setYogaValue('flexGrow')(value || 0)(node);
};

/**
 * Set flex basis attribute to node's Yoga instance
 *
 * @param flex - Basis value
 * @param node - Node instance
 * @returns Node instance
 */
const setFlexBasis = setYogaValue('flexBasis');
const ALIGN = {
  'flex-start': Align.FlexStart,
  center: Align.Center,
  'flex-end': Align.FlexEnd,
  stretch: Align.Stretch,
  baseline: Align.Baseline,
  'space-between': Align.SpaceBetween,
  'space-around': Align.SpaceAround,
  'space-evenly': Align.SpaceEvenly
};
/**
 * Set generic align attribute to node's Yoga instance
 *
 * @param attr - Specific align property
 * @param value - Specific align value
 * @param node - Node
 * @returns Node
 */
const setAlign = attr => value => node => {
  const {
    yogaNode
  } = node;
  const defaultValue = attr === 'items' ? Align.Stretch : Align.Auto;
  if (yogaNode) {
    const align = ALIGN[value] || defaultValue;
    yogaNode[`setAlign${upperFirst(attr)}`](align);
  }
  return node;
};

/**
 * Set align self attribute to node's Yoga instance
 *
 * @param align - Value
 * @param node - Node instance
 * @returns Node instance
 */
const setAlignSelf = setAlign('self');

/**
 * Set align items attribute to node's Yoga instance
 *
 * @param align - Value
 * @param node - Node instance
 * @returns Node instance
 */
const setAlignItems = setAlign('items');

/**
 * Set flex shrink attribute to node's Yoga instance
 *
 * @param value - Flex shrink value
 * @returns Node instance wrapper
 */
const setFlexShrink = value => node => {
  return setYogaValue('flexShrink')(value || 1)(node);
};

/**
 * Set aspect ratio attribute to node's Yoga instance
 *
 * @param value - Ratio
 * @returns Node instance
 */
const setAspectRatio = value => node => {
  const {
    yogaNode
  } = node;
  if (!isNil(value) && yogaNode) {
    yogaNode.setAspectRatio(value);
  }
  return node;
};

/**
 * Set align content attribute to node's Yoga instance
 *
 * @param align - Value
 * @param node - Instance
 * @returns Node instance
 */
const setAlignContent = setAlign('content');
const POSITION = {
  absolute: PositionType.Absolute,
  relative: PositionType.Relative,
  static: PositionType.Static
};
/**
 * Set position type attribute to node's Yoga instance
 *
 * @param value - Position position type
 * @returns Node instance
 */
const setPositionType = value => node => {
  const {
    yogaNode
  } = node;
  if (!isNil(value) && yogaNode) {
    yogaNode.setPositionType(POSITION[value]);
  }
  return node;
};
const FLEX_DIRECTIONS = {
  row: FlexDirection.Row,
  'row-reverse': FlexDirection.RowReverse,
  'column-reverse': FlexDirection.ColumnReverse
};
/**
 * Set flex direction attribute to node's Yoga instance
 *
 * @param value - Flex direction value
 * @returns Node instance wrapper
 */
const setFlexDirection = value => node => {
  const {
    yogaNode
  } = node;
  if (yogaNode) {
    const flexDirection = FLEX_DIRECTIONS[value] || FlexDirection.Column;
    yogaNode.setFlexDirection(flexDirection);
  }
  return node;
};
const JUSTIFY_CONTENT = {
  center: Justify.Center,
  'flex-end': Justify.FlexEnd,
  'space-between': Justify.SpaceBetween,
  'space-around': Justify.SpaceAround,
  'space-evenly': Justify.SpaceEvenly
};
/**
 * Set justify content attribute to node's Yoga instance
 *
 * @param value - Justify content value
 * @returns Node instance wrapper
 */
const setJustifyContent = value => node => {
  const {
    yogaNode
  } = node;
  if (!isNil(value) && yogaNode) {
    const justifyContent = JUSTIFY_CONTENT[value] || Justify.FlexStart;
    yogaNode.setJustifyContent(justifyContent);
  }
  return node;
};

/**
 * Set margin top attribute to node's Yoga instance
 *
 * @param margin - Margin top
 * @param node - Node instance
 * @returns Node instance
 */
const setMarginTop = setYogaValue('margin', Edge.Top);
/**
 * Set margin right attribute to node's Yoga instance
 *
 * @param margin - Margin right
 * @param node - Node instance
 * @returns Node instance
 */
const setMarginRight = setYogaValue('margin', Edge.Right);
/**
 * Set margin bottom attribute to node's Yoga instance
 *
 * @param margin - Margin bottom
 * @param node - Node instance
 * @returns Node instance
 */
const setMarginBottom = setYogaValue('margin', Edge.Bottom);
/**
 * Set margin left attribute to node's Yoga instance
 *
 * @param margin - Margin left
 * @param node - Node instance
 * @returns Node instance
 */
const setMarginLeft = setYogaValue('margin', Edge.Left);

/**
 * Set padding top attribute to node's Yoga instance
 *
 * @param padding - Padding top
 * @param node - Node instance
 * @returns Node instance
 */
const setPaddingTop = setYogaValue('padding', Edge.Top);
/**
 * Set padding right attribute to node's Yoga instance
 *
 * @param padding - Padding right
 * @param node - Node instance
 * @returns Node instance
 */
const setPaddingRight = setYogaValue('padding', Edge.Right);
/**
 * Set padding bottom attribute to node's Yoga instance
 *
 * @param padding - Padding bottom
 * @param node Node instance
 * @returns Node instance
 */
const setPaddingBottom = setYogaValue('padding', Edge.Bottom);
/**
 * Set padding left attribute to node's Yoga instance
 *
 * @param padding - Padding left
 * @param node - Node instance
 * @returns Node instance
 */
const setPaddingLeft = setYogaValue('padding', Edge.Left);

/**
 * Set border top attribute to node's Yoga instance
 *
 * @param border - Border top width
 * @param node - Node instance
 * @returns Node instance
 */
const setBorderTop = setYogaValue('border', Edge.Top);
/**
 * Set border right attribute to node's Yoga instance
 *
 * @param border - Border right width
 * @param node - Node instance
 * @returns Node instance
 */
const setBorderRight = setYogaValue('border', Edge.Right);
/**
 * Set border bottom attribute to node's Yoga instance
 *
 * @param border - Border bottom width
 * @param node - Node instance
 * @returns Node instance
 */
const setBorderBottom = setYogaValue('border', Edge.Bottom);
/**
 * Set border left attribute to node's Yoga instance
 *
 * @param border - Border left width
 * @param node - Node instance
 * @returns Node instance
 */
const setBorderLeft = setYogaValue('border', Edge.Left);

/**
 * Set position top attribute to node's Yoga instance
 *
 * @param position - Position top
 * @param node - Node instance
 * @returns Node instance
 */
const setPositionTop = setYogaValue('position', Edge.Top);
/**
 * Set position right attribute to node's Yoga instance
 *
 * @param position - Position right
 * @param node - Node instance
 * @returns Node instance
 */
const setPositionRight = setYogaValue('position', Edge.Right);
/**
 * Set position bottom attribute to node's Yoga instance
 *
 * @param position - Position bottom
 * @param node - Node instance
 * @returns Node instance
 */
const setPositionBottom = setYogaValue('position', Edge.Bottom);
/**
 * Set position left attribute to node's Yoga instance
 *
 * @param position - Position left
 * @param node - Node instance
 * @returns Node instance
 */
const setPositionLeft = setYogaValue('position', Edge.Left);

/**
 * Set width to node's Yoga instance
 *
 * @param width - Width
 * @param node - Node instance
 * @returns Node instance
 */
const setWidth = setYogaValue('width');
/**
 * Set min width to node's Yoga instance
 *
 * @param min - Width
 * @param node - Node instance
 * @returns Node instance
 */
const setMinWidth = setYogaValue('minWidth');
/**
 * Set max width to node's Yoga instance
 *
 * @param max - Width
 * @param node - Node instance
 * @returns Node instance
 */
const setMaxWidth = setYogaValue('maxWidth');
/**
 * Set height to node's Yoga instance
 *
 * @param height - Height
 * @param node - Node instance
 * @returns Node instance
 */
const setHeight = setYogaValue('height');
/**
 * Set min height to node's Yoga instance
 *
 * @param min - Height
 * @param node - Node instance
 * @returns Node instance
 */
const setMinHeight = setYogaValue('minHeight');
/**
 * Set max height to node's Yoga instance
 *
 * @param max - Height
 * @param node - Node instance
 * @returns Node instance
 */
const setMaxHeight = setYogaValue('maxHeight');

/**
 * Set rowGap value to node's Yoga instance
 *
 * @param value - Gap value
 * @returns Node instance wrapper
 */
const setRowGap = setYogaValue('gap', Gutter.Row);
/**
 * Set columnGap value to node's Yoga instance
 *
 * @param value - Gap value
 * @returns Node instance wrapper
 */
const setColumnGap = setYogaValue('gap', Gutter.Column);
const getAspectRatio = viewbox => {
  if (!viewbox) return null;
  if (typeof viewbox === 'string') return null;
  return (viewbox.maxX - viewbox.minX) / (viewbox.maxY - viewbox.minY);
};
/**
 * Yoga svg measure function
 *
 * @param page
 * @param node
 * @returns Measure svg
 */
const measureCanvas$1 = (page, node) => (width, widthMode, height, heightMode) => {
  const aspectRatio = getAspectRatio(node.props.viewBox) || 1;
  if (widthMode === MeasureMode.Exactly || widthMode === MeasureMode.AtMost) {
    return {
      width,
      height: width / aspectRatio
    };
  }
  if (heightMode === MeasureMode.Exactly) {
    return {
      width: height * aspectRatio
    };
  }
  return {};
};

/**
 * Get lines width (if any)
 *
 * @param node
 * @returns Lines width
 */
const linesWidth = node => {
  if (!node.lines) return 0;
  return Math.max(0, ...node.lines.map(line => line.xAdvance));
};

/**
 * Get lines height (if any)
 *
 * @param node
 * @returns Lines height
 */
const linesHeight = node => {
  if (!node.lines) return -1;
  return node.lines.reduce((acc, line) => acc + line.box.height, 0);
};
const ALIGNMENT_FACTORS = {
  center: 0.5,
  right: 1
};
/**
 * Yoga text measure function
 *
 * @param page
 * @param node
 * @param fontStore
 * @returns {MeasureText} measure text function
 */
const measureText = (page, node, fontStore) => (width, widthMode, height) => {
  if (widthMode === MeasureMode.Exactly) {
    if (!node.lines) node.lines = layoutText(node, width, height, fontStore);
    return {
      height: linesHeight(node),
      width
    };
  }
  if (widthMode === MeasureMode.AtMost) {
    var _node$style6;
    const alignFactor = ALIGNMENT_FACTORS[(_node$style6 = node.style) === null || _node$style6 === void 0 ? void 0 : _node$style6.textAlign] || 0;
    if (!node.lines) {
      node.lines = layoutText(node, width, height, fontStore);
      node.alignOffset = (width - linesWidth(node)) * alignFactor; // Compensate align in variable width containers
    }
    return {
      height: linesHeight(node),
      width: Math.min(width, linesWidth(node))
    };
  }
  return {};
};

/**
 * Get image ratio
 *
 * @param node - Image node
 * @returns Image ratio
 */
const getRatio = node => {
  var _node$image;
  return (_node$image = node.image) !== null && _node$image !== void 0 && _node$image.data ? node.image.width / node.image.height : 1;
};

/**
 * Checks if page has auto height
 *
 * @param page
 * @returns Is page height auto
 */
const isHeightAuto = page => {
  var _page$box3;
  return isNil((_page$box3 = page.box) === null || _page$box3 === void 0 ? void 0 : _page$box3.height);
};
const SAFETY_HEIGHT$1 = 10;
/**
 * Yoga image measure function
 *
 * @param page - Page
 * @param node - Node
 * @returns Measure image
 */
const measureImage = (page, node) => (width, widthMode, height, heightMode) => {
  var _page$box4;
  const imageRatio = getRatio(node);
  const imageMargin = getMargin(node);
  const pagePadding = getPadding(page);
  // TODO: Check image percentage margins
  const pageArea = isHeightAuto(page) ? Infinity : (((_page$box4 = page.box) === null || _page$box4 === void 0 ? void 0 : _page$box4.height) || 0) - pagePadding.paddingTop - pagePadding.paddingBottom - imageMargin.marginTop - imageMargin.marginBottom - SAFETY_HEIGHT$1;
  // Skip measure if image data not present yet
  if (!node.image) return {
    width: 0,
    height: 0
  };
  if (widthMode === MeasureMode.Exactly && heightMode === MeasureMode.Undefined) {
    const scaledHeight = width / imageRatio;
    return {
      height: Math.min(pageArea, scaledHeight)
    };
  }
  if (heightMode === MeasureMode.Exactly && (widthMode === MeasureMode.AtMost || widthMode === MeasureMode.Undefined)) {
    return {
      width: Math.min(height * imageRatio, width)
    };
  }
  if (widthMode === MeasureMode.Exactly && heightMode === MeasureMode.AtMost) {
    const scaledHeight = width / imageRatio;
    return {
      height: Math.min(height, pageArea, scaledHeight)
    };
  }
  if (widthMode === MeasureMode.AtMost && heightMode === MeasureMode.AtMost) {
    if (imageRatio > 1) {
      return {
        width,
        height: Math.min(width / imageRatio, height)
      };
    }
    return {
      height,
      width: Math.min(height * imageRatio, width)
    };
  }
  return {
    height,
    width
  };
};
const SAFETY_HEIGHT = 10;
const getMax = values => Math.max(-Infinity, ...values);
/**
 * Helper object to predict canvas size
 * TODO: Implement remaining functions (as close as possible);
 */
const measureCtx = () => {
  const ctx = {};
  const points = [];
  const nil = () => ctx;
  const addPoint = (x, y) => points.push([x, y]);
  const moveTo = (x, y) => {
    addPoint(x, y);
    return ctx;
  };
  const rect = (x, y, w, h) => {
    addPoint(x, y);
    addPoint(x + w, y);
    addPoint(x, y + h);
    addPoint(x + w, y + h);
    return ctx;
  };
  const ellipse = (x, y, rx, ry) => {
    ry = ry || rx;
    addPoint(x - rx, y - ry);
    addPoint(x + rx, y - ry);
    addPoint(x + rx, y + ry);
    addPoint(x - rx, y + ry);
    return ctx;
  };
  const polygon = function () {
    points.push(...arguments);
    return ctx;
  };
  // Change dimensions
  ctx.rect = rect;
  ctx.moveTo = moveTo;
  ctx.lineTo = moveTo;
  ctx.circle = ellipse;
  ctx.polygon = polygon;
  ctx.ellipse = ellipse;
  ctx.roundedRect = rect;
  // To be implemented
  ctx.text = nil;
  ctx.path = nil;
  ctx.lineWidth = nil;
  ctx.bezierCurveTo = nil;
  ctx.quadraticCurveTo = nil;
  ctx.scale = nil;
  ctx.rotate = nil;
  ctx.translate = nil;
  // These don't change dimensions
  ctx.dash = nil;
  ctx.clip = nil;
  ctx.save = nil;
  ctx.fill = nil;
  ctx.font = nil;
  ctx.stroke = nil;
  ctx.lineCap = nil;
  ctx.opacity = nil;
  ctx.restore = nil;
  ctx.lineJoin = nil;
  ctx.fontSize = nil;
  ctx.fillColor = nil;
  ctx.miterLimit = nil;
  ctx.strokeColor = nil;
  ctx.fillOpacity = nil;
  ctx.strokeOpacity = nil;
  ctx.linearGradient = nil;
  ctx.radialGradient = nil;
  ctx.getWidth = () => getMax(points.map(p => p[0]));
  ctx.getHeight = () => getMax(points.map(p => p[1]));
  return ctx;
};
/**
 * @typedef {Function} MeasureCanvas
 * @returns {{ width: number, height: number }} canvas width and height
 */
/**
 * Yoga canvas measure function
 *
 * @param {Object} page
 * @param {Object} node
 * @returns {MeasureCanvas} measure canvas
 */
const measureCanvas = (page, node) => () => {
  var _page$box5;
  const imageMargin = getMargin(node);
  const pagePadding = getPadding(page);
  // TODO: Check image percentage margins
  const pageArea = isHeightAuto(page) ? Infinity : (((_page$box5 = page.box) === null || _page$box5 === void 0 ? void 0 : _page$box5.height) || 0) - pagePadding.paddingTop - pagePadding.paddingBottom - imageMargin.marginTop - imageMargin.marginBottom - SAFETY_HEIGHT;
  const ctx = measureCtx();
  node.props.paint(ctx);
  const width = ctx.getWidth();
  const height = Math.min(pageArea, ctx.getHeight());
  return {
    width,
    height
  };
};
const isType$1 = type => node => node.type === type;
const isSvg = isType$1(P.Svg);
const isText$2 = isType$1(P.Text);
const isNote = isType$1(P.Note);
const isPage = isType$1(P.Page);
const isImage = isType$1(P.Image);
const isCanvas = isType$1(P.Canvas);
const isTextInstance$1 = isType$1(P.TextInstance);
const setNodeHeight = node => {
  var _node$box3, _node$style7;
  const value = isPage(node) ? (_node$box3 = node.box) === null || _node$box3 === void 0 ? void 0 : _node$box3.height : (_node$style7 = node.style) === null || _node$style7 === void 0 ? void 0 : _node$style7.height;
  return setHeight(value);
};
/**
 * Set styles valeus into yoga node before layout calculation
 *
 * @param node
 */
const setYogaValues = node => {
  compose(setNodeHeight(node), setWidth(node.style.width), setMinWidth(node.style.minWidth), setMaxWidth(node.style.maxWidth), setMinHeight(node.style.minHeight), setMaxHeight(node.style.maxHeight), setMarginTop(node.style.marginTop), setMarginRight(node.style.marginRight), setMarginBottom(node.style.marginBottom), setMarginLeft(node.style.marginLeft), setPaddingTop(node.style.paddingTop), setPaddingRight(node.style.paddingRight), setPaddingBottom(node.style.paddingBottom), setPaddingLeft(node.style.paddingLeft), setPositionType(node.style.position), setPositionTop(node.style.top), setPositionRight(node.style.right), setPositionBottom(node.style.bottom), setPositionLeft(node.style.left), setBorderTop(node.style.borderTopWidth), setBorderRight(node.style.borderRightWidth), setBorderBottom(node.style.borderBottomWidth), setBorderLeft(node.style.borderLeftWidth), setDisplay(node.style.display), setFlexDirection(node.style.flexDirection), setAlignSelf(node.style.alignSelf), setAlignContent(node.style.alignContent), setAlignItems(node.style.alignItems), setJustifyContent(node.style.justifyContent), setFlexWrap(node.style.flexWrap), setOverflow(node.style.overflow), setAspectRatio(node.style.aspectRatio), setFlexBasis(node.style.flexBasis), setFlexGrow(node.style.flexGrow), setFlexShrink(node.style.flexShrink), setRowGap(node.style.rowGap), setColumnGap(node.style.columnGap))(node);
};
/**
 * Inserts child into parent' yoga node
 *
 * @param parent parent
 * @returns Insert yoga nodes
 */
const insertYogaNodes = parent => child => {
  parent.insertChild(child.yogaNode, parent.getChildCount());
  return child;
};
const setMeasureFunc = (node, page, fontStore) => {
  const {
    yogaNode
  } = node;
  if (isText$2(node)) {
    yogaNode.setMeasureFunc(measureText(page, node, fontStore));
  }
  if (isImage(node)) {
    yogaNode.setMeasureFunc(measureImage(page, node));
  }
  if (isCanvas(node)) {
    yogaNode.setMeasureFunc(measureCanvas(page, node));
  }
  if (isSvg(node)) {
    yogaNode.setMeasureFunc(measureCanvas$1(page, node));
  }
  return node;
};
const isLayoutElement = node => !isText$2(node) && !isNote(node) && !isSvg(node);
/**
 * @typedef {Function} CreateYogaNodes
 * @param {Object} node
 * @returns {Object} node with appended yoga node
 */
/**
 * Creates and add yoga node to document tree
 * Handles measure function for text and image nodes
 *
 * @returns Create yoga nodes
 */
const createYogaNodes = (page, fontStore, yoga) => node => {
  const yogaNode = yoga.node.create();
  const result = Object.assign({}, node, {
    yogaNode
  });
  setYogaValues(result);
  if (isLayoutElement(node) && node.children) {
    const resolveChild = compose(insertYogaNodes(yogaNode), createYogaNodes(page, fontStore, yoga));
    result.children = node.children.map(resolveChild);
  }
  setMeasureFunc(result, page, fontStore);
  return result;
};
/**
 * Performs yoga calculation
 *
 * @param page - Page node
 * @returns Page node
 */
const calculateLayout = page => {
  page.yogaNode.calculateLayout();
  return page;
};
/**
 * Saves Yoga layout result into 'box' attribute of node
 *
 * @param node
 * @returns Node with box data
 */
const persistDimensions = node => {
  if (isTextInstance$1(node)) return node;
  const box = Object.assign(getPadding(node), getMargin(node), getBorderWidth(node), getPosition(node), getDimension(node));
  const newNode = Object.assign({}, node, {
    box
  });
  if (!node.children) return newNode;
  const children = node.children.map(persistDimensions);
  return Object.assign({}, newNode, {
    children
  });
};
/**
 * Removes yoga node from document tree
 *
 * @param node
 * @returns Node without yoga node
 */
const destroyYogaNodes = node => {
  const newNode = Object.assign({}, node);
  delete newNode.yogaNode;
  if (!node.children) return newNode;
  const children = node.children.map(destroyYogaNodes);
  return Object.assign({}, newNode, {
    children
  });
};
/**
 * Free yoga node from document tree
 *
 * @param node
 * @returns Node without yoga node
 */
const freeYogaNodes = node => {
  if (node.yogaNode) node.yogaNode.freeRecursive();
  return node;
};
/**
 * Calculates page object layout using Yoga.
 * Takes node values from 'box' and 'style' attributes, and persist them back into 'box'
 * Destroy yoga values at the end.
 *
 * @param page - Object
 * @returns Page object with correct 'box' layout attributes
 */
const resolvePageDimensions = (page, fontStore, yoga) => {
  if (isNil(page)) return null;
  return compose(destroyYogaNodes, freeYogaNodes, persistDimensions, calculateLayout, createYogaNodes(page, fontStore, yoga))(page);
};
/**
 * Calculates root object layout using Yoga.
 *
 * @param node - Root object
 * @param fontStore - Font store
 * @returns Root object with correct 'box' layout attributes
 */
const resolveDimensions = (node, fontStore) => {
  if (!node.children) return node;
  const resolveChild = child => resolvePageDimensions(child, fontStore, node.yoga);
  const children = node.children.map(resolveChild);
  return Object.assign({}, node, {
    children
  });
};
const isText$1 = node => node.type === P.Text;
// Prevent splitting elements by low decimal numbers
const SAFETY_THRESHOLD = 0.001;
const assingChildren = (children, node) => Object.assign({}, node, {
  children
});
const getTop = node => {
  var _node$box4;
  return ((_node$box4 = node.box) === null || _node$box4 === void 0 ? void 0 : _node$box4.top) || 0;
};
const allFixed = nodes => nodes.every(isFixed);
const isDynamic = node => node.props && 'render' in node.props;
const relayoutPage = compose(resolveTextLayout, resolvePageDimensions, resolveInheritance, resolvePageStyles);
const warnUnavailableSpace = node => {
  console.warn(`Node of type ${node.type} can't wrap between pages and it's bigger than available page height`);
};
const splitNodes = (height, contentArea, nodes) => {
  const currentChildren = [];
  const nextChildren = [];
  for (let i = 0; i < nodes.length; i += 1) {
    const child = nodes[i];
    const futureNodes = nodes.slice(i + 1);
    const futureFixedNodes = futureNodes.filter(isFixed);
    const nodeTop = getTop(child);
    const nodeHeight = child.box.height;
    const isOutside = height <= nodeTop;
    const shouldBreak$1 = shouldBreak(child, futureNodes, height, currentChildren);
    const shouldSplit = height + SAFETY_THRESHOLD < nodeTop + nodeHeight;
    const canWrap = getWrap(child);
    const fitsInsidePage = nodeHeight <= contentArea;
    if (isFixed(child)) {
      nextChildren.push(child);
      currentChildren.push(child);
      continue;
    }
    if (isOutside) {
      const box = Object.assign({}, child.box, {
        top: child.box.top - height
      });
      const next = Object.assign({}, child, {
        box
      });
      nextChildren.push(next);
      continue;
    }
    if (!fitsInsidePage && !canWrap) {
      currentChildren.push(child);
      nextChildren.push(...futureNodes);
      warnUnavailableSpace(child);
      break;
    }
    if (shouldBreak$1) {
      const box = Object.assign({}, child.box, {
        top: child.box.top - height
      });
      const props = Object.assign({}, child.props, {
        wrap: true,
        break: false
      });
      const next = Object.assign({}, child, {
        box,
        props
      });
      currentChildren.push(...futureFixedNodes);
      nextChildren.push(next, ...futureNodes);
      break;
    }
    if (shouldSplit) {
      const [currentChild, nextChild] = split(child, height, contentArea);
      // All children are moved to the next page, it doesn't make sense to show the parent on the current page
      if (child.children.length > 0 && currentChild.children.length === 0) {
        // But if the current page is empty then we can just include the parent on the current page
        if (currentChildren.length === 0) {
          currentChildren.push(child, ...futureFixedNodes);
          nextChildren.push(...futureNodes);
        } else {
          const box = Object.assign({}, child.box, {
            top: child.box.top - height
          });
          const next = Object.assign({}, child, {
            box
          });
          currentChildren.push(...futureFixedNodes);
          nextChildren.push(next, ...futureNodes);
        }
        break;
      }
      if (currentChild) currentChildren.push(currentChild);
      if (nextChild) nextChildren.push(nextChild);
      continue;
    }
    currentChildren.push(child);
  }
  return [currentChildren, nextChildren];
};
const splitChildren = (height, contentArea, node) => {
  const children = node.children || [];
  const availableHeight = height - getTop(node);
  return splitNodes(availableHeight, contentArea, children);
};
const splitView = (node, height, contentArea) => {
  const [currentNode, nextNode] = splitNode(node, height);
  const [currentChilds, nextChildren] = splitChildren(height, contentArea, node);
  return [assingChildren(currentChilds, currentNode), assingChildren(nextChildren, nextNode)];
};
const split = (node, height, contentArea) => isText$1(node) ? splitText(node, height) : splitView(node, height, contentArea);
const shouldResolveDynamicNodes = node => {
  const children = node.children || [];
  return isDynamic(node) || children.some(shouldResolveDynamicNodes);
};
const resolveDynamicNodes = (props, node) => {
  const isNodeDynamic = isDynamic(node);
  // Call render prop on dynamic nodes and append result to children
  const resolveChildren = function (children) {
    if (children === void 0) {
      children = [];
    }
    if (isNodeDynamic) {
      const res = node.props.render(props);
      return createInstances(res).filter(Boolean)
      // @ts-expect-error rework dynamic nodes. conflicting types
      .map(n => resolveDynamicNodes(props, n));
    }
    return children.map(c => resolveDynamicNodes(props, c));
  };
  // We reset dynamic text box so it can be computed again later on
  const resetHeight = isNodeDynamic && isText$1(node);
  const box = resetHeight ? {
    ...node.box,
    height: 0
  } : node.box;
  const children = resolveChildren(node.children);
  // @ts-expect-error handle text here specifically
  const lines = isNodeDynamic ? null : node.lines;
  return Object.assign({}, node, {
    box,
    lines,
    children
  });
};
const resolveDynamicPage = (props, page, fontStore, yoga) => {
  if (shouldResolveDynamicNodes(page)) {
    const resolvedPage = resolveDynamicNodes(props, page);
    return relayoutPage(resolvedPage, fontStore, yoga);
  }
  return page;
};
const splitPage = (page, pageNumber, fontStore, yoga) => {
  const wrapArea = getWrapArea(page);
  const contentArea = getContentArea(page);
  const dynamicPage = resolveDynamicPage({
    pageNumber
  }, page, fontStore, yoga);
  const height = page.style.height;
  const [currentChilds, nextChilds] = splitNodes(wrapArea, contentArea, dynamicPage.children);
  const relayout = node =>
  // @ts-expect-error rework pagination
  relayoutPage(node, fontStore, yoga);
  const currentBox = {
    ...page.box,
    height
  };
  const currentPage = relayout(Object.assign({}, page, {
    box: currentBox,
    children: currentChilds
  }));
  if (nextChilds.length === 0 || allFixed(nextChilds)) return [currentPage, null];
  const nextBox = omit$1('height', page.box);
  const nextProps = omit$1('bookmark', page.props);
  const nextPage = relayout(Object.assign({}, page, {
    props: nextProps,
    box: nextBox,
    children: nextChilds
  }));
  return [currentPage, nextPage];
};
const resolvePageIndices = (fontStore, yoga, page, pageNumber, pages) => {
  const totalPages = pages.length;
  const props = {
    totalPages,
    pageNumber: pageNumber + 1,
    subPageNumber: page.subPageNumber + 1,
    subPageTotalPages: page.subPageTotalPages
  };
  return resolveDynamicPage(props, page, fontStore, yoga);
};
const assocSubPageData = subpages => {
  return subpages.map((page, i) => ({
    ...page,
    subPageNumber: i,
    subPageTotalPages: subpages.length
  }));
};
const dissocSubPageData = page => {
  return omit$1(['subPageNumber', 'subPageTotalPages'], page);
};
const paginate = (page, pageNumber, fontStore, yoga) => {
  var _page$props6;
  if (!page) return [];
  if (((_page$props6 = page.props) === null || _page$props6 === void 0 ? void 0 : _page$props6.wrap) === false) return [page];
  let splittedPage = splitPage(page, pageNumber, fontStore, yoga);
  const pages = [splittedPage[0]];
  let nextPage = splittedPage[1];
  while (nextPage !== null) {
    splittedPage = splitPage(nextPage, pageNumber + pages.length, fontStore, yoga);
    pages.push(splittedPage[0]);
    nextPage = splittedPage[1];
  }
  return pages;
};
/**
 * Performs pagination. This is the step responsible of breaking the whole document
 * into pages following pagiation rules, such as `fixed`, `break` and dynamic nodes.
 *
 * @param root - Document node
 * @param fontStore - Font store
 * @returns Layout node
 */
const resolvePagination = (root, fontStore) => {
  let pages = [];
  let pageNumber = 1;
  for (let i = 0; i < root.children.length; i += 1) {
    const page = root.children[i];
    let subpages = paginate(page, pageNumber, fontStore, root.yoga);
    subpages = assocSubPageData(subpages);
    pageNumber += subpages.length;
    pages = pages.concat(subpages);
  }
  pages = pages.map(function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return dissocSubPageData(resolvePageIndices(fontStore, root.yoga, ...args));
  });
  return assingChildren(pages, root);
};

/**
 * Translates page percentage horizontal paddings in fixed ones
 *
 * @param container - Page container
 * @returns Resolve page horizontal padding
 */
const resolvePageHorizontalPadding = container => value => {
  const match = matchPercent(value);
  const width = container.width;
  return match ? match.percent * width : value;
};
/**
 * Translates page percentage vertical paddings in fixed ones
 *
 * @param container - Page container
 * @returns Resolve page vertical padding
 */
const resolvePageVerticalPadding = container => value => {
  const match = matchPercent(value);
  const height = container.height;
  return match ? match.percent * height : value;
};
/**
 * Translates page percentage paddings in fixed ones
 *
 * @param page
 * @returns Page with fixed paddings
 */
const resolvePagePaddings = page => {
  const container = page.style;
  const style = evolve({
    paddingTop: resolvePageVerticalPadding(container),
    paddingLeft: resolvePageHorizontalPadding(container),
    paddingRight: resolvePageHorizontalPadding(container),
    paddingBottom: resolvePageVerticalPadding(container)
  }, page.style);
  return Object.assign({}, page, {
    style
  });
};
/**
 * Translates all pages percentage paddings in fixed ones
 * This has to be computed from pages calculated size and not by Yoga
 * because at this point we didn't performed pagination yet.
 *
 * @param root - Document root
 * @returns Document root with translated page paddings
 */
const resolvePagesPaddings = root => {
  if (!root.children) return root;
  const children = root.children.map(resolvePagePaddings);
  return Object.assign({}, root, {
    children
  });
};
const resolveRadius = box => value => {
  if (!value) return undefined;
  const match = matchPercent(value);
  return match ? match.percent * Math.min(box.width, box.height) : value;
};
/**
 * Transforms percent border radius into fixed values
 *
 * @param node
 * @returns Node
 */
const resolvePercentRadius = node => {
  const style = evolve({
    borderTopLeftRadius: resolveRadius(node.box),
    borderTopRightRadius: resolveRadius(node.box),
    borderBottomRightRadius: resolveRadius(node.box),
    borderBottomLeftRadius: resolveRadius(node.box)
  }, node.style || {});
  const newNode = Object.assign({}, node, {
    style
  });
  if (!node.children) return newNode;
  const children = node.children.map(resolvePercentRadius);
  return Object.assign({}, newNode, {
    children
  });
};

/**
 * Transform percent height into fixed
 *
 * @param height
 * @returns Height
 */
const transformHeight = (pageArea, height) => {
  const match = matchPercent(height);
  return match ? match.percent * pageArea : height;
};
/**
 * Get page area (height minus paddings)
 *
 * @param page
 * @returns Page area
 */
const getPageArea = page => {
  var _page$style3, _page$style4;
  const pageHeight = page.style.height;
  const pagePaddingTop = ((_page$style3 = page.style) === null || _page$style3 === void 0 ? void 0 : _page$style3.paddingTop) || 0;
  const pagePaddingBottom = ((_page$style4 = page.style) === null || _page$style4 === void 0 ? void 0 : _page$style4.paddingBottom) || 0;
  return pageHeight - pagePaddingTop - pagePaddingBottom;
};
/**
 * Transform node percent height to fixed
 *
 * @param page
 * @param node
 * @returns Transformed node
 */
const resolveNodePercentHeight = (page, node) => {
  var _page$style5, _node$style8;
  if (isNil((_page$style5 = page.style) === null || _page$style5 === void 0 ? void 0 : _page$style5.height)) return node;
  if (isNil((_node$style8 = node.style) === null || _node$style8 === void 0 ? void 0 : _node$style8.height)) return node;
  const pageArea = getPageArea(page);
  const height = transformHeight(pageArea, node.style.height);
  const style = Object.assign({}, node.style, {
    height
  });
  return Object.assign({}, node, {
    style
  });
};
/**
 * Transform page immediate children with percent height to fixed
 *
 * @param page
 * @returns Transformed page
 */
const resolvePagePercentHeight = page => {
  if (!page.children) return page;
  const resolveChild = child => resolveNodePercentHeight(page, child);
  const children = page.children.map(resolveChild);
  return Object.assign({}, page, {
    children
  });
};
/**
 * Transform all page immediate children with percent height to fixed.
 * This is needed for computing correct dimensions on pre-pagination layout.
 *
 * @param root - Document root
 * @returns Transformed document root
 */
const resolvePercentHeight = root => {
  if (!root.children) return root;
  const children = root.children.map(resolvePagePercentHeight);
  return Object.assign({}, root, {
    children
  });
};
const isType = type => node => node.type === type;
const isLink = isType(P.Link);
const isText = isType(P.Text);
const isTextInstance = isType(P.TextInstance);
/**
 * Checks if node has render prop
 *
 * @param node
 * @returns Has render prop?
 */
const hasRenderProp = node => 'render' in node.props;
/**
 * Checks if node is text type (Text or TextInstance)
 *
 * @param node
 * @returns Are all children text instances?
 */
const isTextType = node => isText(node) || isTextInstance(node);
/**
 * Checks if is tet link that needs to be wrapped in Text
 *
 * @param node
 * @returns Are all children text instances?
 */
const isTextLink = node => {
  const children = node.children || [];
  // Text string inside a Link
  if (children.every(isTextInstance)) return true;
  // Text node inside a Link
  if (children.every(isText)) return false;
  return children.every(isTextType);
};
/**
 * Wraps node children inside Text node
 *
 * @param node
 * @returns Node with intermediate Text child
 */
const wrapText = node => {
  const textElement = {
    type: P.Text,
    props: {},
    style: {},
    box: {},
    children: node.children
  };
  return Object.assign({}, node, {
    children: [textElement]
  });
};
const transformLink = node => {
  if (!isLink(node)) return node;
  // If has render prop substitute the instance by a Text, that will
  // ultimately render the inline Link via the textkit PDF renderer.
  if (hasRenderProp(node)) return Object.assign({}, node, {
    type: P.Text
  });
  // If is a text link (either contains Text or TextInstance), wrap it
  // inside a Text element so styles are applied correctly
  if (isTextLink(node)) return wrapText(node);
  return node;
};
/**
 * Transforms Link layout to correctly render text and dynamic rendered links
 *
 * @param node
 * @returns Node with link substitution
 */
const resolveLinkSubstitution = node => {
  if (!node.children) return node;
  const resolveChild = compose(transformLink, resolveLinkSubstitution);
  const children = node.children.map(resolveChild);
  return Object.assign({}, node, {
    children
  });
};
const layout = asyncCompose(resolveZIndex, resolveOrigin, resolveAssets, resolvePagination, resolveTextLayout, resolvePercentRadius, resolveDimensions, resolveSvg, resolveAssets, resolveInheritance, resolvePercentHeight, resolvePagesPaddings, resolveStyles, resolveLinkSubstitution, resolveBookmarks, resolvePageSizes, resolveYoga);

const omitNils = object => Object.fromEntries(Object.entries(object).filter(_ref => {
  let [, value] = _ref;
  return value !== undefined;
}));

const createInstance = (type, _ref) => {
  let {
    style,
    children,
    ...props
  } = _ref;
  return {
    type,
    box: {},
    style: style || {},
    props: props || {},
    children: []
  };
};
const createTextInstance = text => ({
  type: 'TEXT_INSTANCE',
  value: text
});
const appendChild = (parent, child) => {
  const isParentText = parent.type === 'TEXT' || parent.type === 'LINK' || parent.type === 'TSPAN' || parent.type === 'NOTE';
  const isChildTextInstance = child.type === 'TEXT_INSTANCE';
  const isOrphanTextInstance = isChildTextInstance && !isParentText;

  // Ignore orphan text instances.
  // Caused by cases such as <>{name && <Text>{name}</Text>}</>
  if (isOrphanTextInstance) {
    console.warn(`Invalid '${child.value}' string child outside <Text> component`);
    return;
  }
  parent.children.push(child);
};
const appendChildToContainer = (parentInstance, child) => {
  if (parentInstance.type === 'ROOT') {
    parentInstance.document = child;
  } else {
    appendChild(parentInstance, child);
  }
};
const insertBefore = (parentInstance, child, beforeChild) => {
  var _parentInstance$child;
  const index = (_parentInstance$child = parentInstance.children) === null || _parentInstance$child === void 0 ? void 0 : _parentInstance$child.indexOf(beforeChild);
  if (index === undefined) return;
  if (index !== -1 && child) parentInstance.children.splice(index, 0, child);
};
const removeChild = (parentInstance, child) => {
  var _parentInstance$child2;
  const index = (_parentInstance$child2 = parentInstance.children) === null || _parentInstance$child2 === void 0 ? void 0 : _parentInstance$child2.indexOf(child);
  if (index === undefined) return;
  if (index !== -1) parentInstance.children.splice(index, 1);
};
const removeChildFromContainer = (parentInstance, child) => {
  var _parentInstance$child3;
  const index = (_parentInstance$child3 = parentInstance.children) === null || _parentInstance$child3 === void 0 ? void 0 : _parentInstance$child3.indexOf(child);
  if (index === undefined) return;
  if (index !== -1) parentInstance.children.splice(index, 1);
};
const commitTextUpdate = (textInstance, oldText, newText) => {
  textInstance.value = newText;
};
const commitUpdate = (instance, updatePayload, type, oldProps, newProps) => {
  const {
    style,
    ...props
  } = newProps;
  instance.props = props;
  instance.style = style;
};
const createRenderer = _ref2 => {
  let {
    onChange = () => {}
  } = _ref2;
  return Reconciler({
    appendChild,
    appendChildToContainer,
    commitTextUpdate,
    commitUpdate,
    createInstance,
    createTextInstance,
    insertBefore,
    removeChild,
    removeChildFromContainer,
    resetAfterCommit: onChange
  });
};

var version$1 = "4.3.10";
var packageJson = {
	version: version$1};

const {
  version
} = packageJson;
const fontStore = new FontStore();

// We must keep a single renderer instance, otherwise React will complain
let renderer;

// The pdf instance acts as an event emitter for DOM usage.
// We only want to trigger an update when PDF content changes
const events = {};
const pdf = initialValue => {
  const onChange = () => {
    var _events$change;
    const listeners = ((_events$change = events.change) === null || _events$change === void 0 ? void 0 : _events$change.slice()) || [];
    for (let i = 0; i < listeners.length; i += 1) listeners[i]();
  };
  const container = {
    type: 'ROOT',
    document: null
  };
  renderer = renderer || createRenderer({
    onChange
  });
  const mountNode = renderer.createContainer(container);
  const updateContainer = (doc, callback) => {
    renderer.updateContainer(doc, mountNode, null, callback);
  };
  if (initialValue) updateContainer(initialValue);
  const render = async function (compress) {
    if (compress === void 0) {
      compress = true;
    }
    const props = container.document.props || {};
    const {
      pdfVersion,
      language,
      pageLayout,
      pageMode,
      title,
      author,
      subject,
      keyboards,
      creator = 'react-pdf',
      producer = 'react-pdf',
      creationDate = new Date(),
      modificationDate
    } = props;
    const ctx = new PDFDocument({
      compress,
      pdfVersion,
      lang: language,
      displayTitle: true,
      autoFirstPage: false,
      info: omitNils({
        Title: title,
        Author: author,
        Subject: subject,
        Keywords: keyboards,
        Creator: creator,
        Producer: producer,
        CreationDate: creationDate,
        ModificationDate: modificationDate
      })
    });
    if (pageLayout) {
      ctx._root.data.PageLayout = upperFirst(pageLayout);
    }
    if (pageMode) {
      ctx._root.data.PageMode = upperFirst(pageMode);
    }
    const layout$1 = await layout(container.document, fontStore);
    const fileStream = renderPDF(ctx, layout$1);
    return {
      layout: layout$1,
      fileStream
    };
  };
  const callOnRender = function (params) {
    if (params === void 0) {
      params = {};
    }
    if (container.document.props.onRender) {
      container.document.props.onRender(params);
    }
  };
  const toBlob = async () => {
    const chunks = [];
    const {
      layout: _INTERNAL__LAYOUT__DATA_,
      fileStream: instance
    } = await render();
    return new Promise((resolve, reject) => {
      instance.on('data', chunk => {
        chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
      });
      instance.on('end', () => {
        try {
          const blob = new Blob(chunks, {
            type: 'application/pdf'
          });
          callOnRender({
            blob,
            _INTERNAL__LAYOUT__DATA_
          });
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  // TODO: rename this method to `toStream` in next major release, because it return stream not a buffer
  const toBuffer = async () => {
    const {
      layout: _INTERNAL__LAYOUT__DATA_,
      fileStream
    } = await render();
    callOnRender({
      _INTERNAL__LAYOUT__DATA_
    });
    return fileStream;
  };

  /*
   * TODO: remove this method in next major release. it is buggy
   * see
   * - https://github.com/diegomura/react-pdf/issues/2112
   * - https://github.com/diegomura/react-pdf/issues/2095
   */
  const toString = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('`toString` is deprecated and will be removed in next major release');
    }
    let result = '';
    const {
      fileStream: instance
    } = await render(false); // For some reason, when rendering to string if compress=true the document is blank

    return new Promise((resolve, reject) => {
      try {
        instance.on('data', buffer => {
          result += buffer;
        });
        instance.on('end', () => {
          callOnRender();
          resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
  };
  const on = (event, listener) => {
    if (!events[event]) events[event] = [];
    events[event].push(listener);
  };
  const removeListener = (event, listener) => {
    if (!events[event]) return;
    const idx = events[event].indexOf(listener);
    if (idx > -1) events[event].splice(idx, 1);
  };
  return {
    on,
    container,
    toBlob,
    toBuffer,
    toString,
    removeListener,
    updateContainer
  };
};
const Font = fontStore;
const StyleSheet = {
  create: s => s
};

/**
 * @param {React.ReactElement} element
 * @returns {Promise<NodeJS.ReadableStream>}
 */
const renderToStream = async element => {
  const instance = pdf(element);
  const stream = await instance.toBuffer();
  return stream;
};

/**
 * @param {React.ReactElement} element
 * @param {string} filePath
 * @param {Function} [callback]
 */
const renderToFile = async (element, filePath, callback) => {
  const output = await renderToStream(element);
  const stream = fs.createWriteStream(filePath);
  output.pipe(stream);
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      if (callback) callback(output, filePath);
      resolve(output);
    });
    stream.on('error', reject);
  });
};

/**
 * @param {React.ReactElement} element
 * @returns {Promise<Buffer>}
 */
const renderToBuffer = element => renderToStream(element).then(stream => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', chunk => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer$1.concat(chunks)));
  stream.on('error', error => reject(error));
}));
const renderToString = element => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('`renderToString` is deprecated and will be removed in next major release, use `renderToBuffer` instead');
  }
  return renderToBuffer(element).then(buffer => buffer.toString());
};

const throwEnvironmentError = name => {
  throw new Error(`${name} is a web specific API. You're either using this component on Node, or your bundler is not loading react-pdf from the appropriate web build.`);
};
const usePDF = () => {
  throwEnvironmentError('usePDF');
};
const PDFViewer = () => {
  throwEnvironmentError('PDFViewer');
};
const PDFDownloadLink = () => {
  throwEnvironmentError('PDFDownloadLink');
};
const BlobProvider = () => {
  throwEnvironmentError('BlobProvider');
};
const render = renderToFile;

// TODO: remove this default export in next major release because it breaks tree-shacking
var index = {
  pdf,
  Font,
  version,
  StyleSheet,
  usePDF,
  PDFViewer,
  BlobProvider,
  PDFDownloadLink,
  renderToStream,
  renderToString,
  renderToFile,
  render,
  ...P
};

export { BlobProvider, Font, PDFDownloadLink, PDFViewer, StyleSheet, createRenderer, index as default, pdf, render, renderToBuffer, renderToFile, renderToStream, renderToString, usePDF, version };
//# sourceMappingURL=react-pdf.js.map
