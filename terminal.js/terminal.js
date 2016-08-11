(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Terminal = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require("./lib/terminal.js");

module.exports.TermState = require("./lib/term_state.js");
module.exports.TermDiff = require("./lib/term_diff.js");
module.exports.output = {
	PlainOutput: require("./lib/output/plain.js"),
	AnsiOutput: require("./lib/output/ansi.js"),
	TtyOutput: require("./lib/output/tty.js"),
	HtmlOutput: require("./lib/output/html.js"),
	DomOutput: require("./lib/output/dom.js")
};

module.exports.source = {
	EmitterSource: require("./lib/source/emitter.js")
};

module.exports.input = {
	DomInput: require('./lib/input/dom.js'),
	TtyInput: require('./lib/input/tty.js'),
};

},{"./lib/input/dom.js":10,"./lib/input/tty.js":11,"./lib/output/ansi.js":12,"./lib/output/dom.js":14,"./lib/output/html.js":15,"./lib/output/plain.js":17,"./lib/output/tty.js":18,"./lib/source/emitter.js":20,"./lib/term_diff.js":21,"./lib/term_state.js":22,"./lib/terminal.js":23}],2:[function(require,module,exports){
"use strict";

// function(cmd, chunk);
/**
* handlers for command characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var chr = {
	/**
	* BELL
	*/
	"\x07": function(cmd, chunk) { // BELL
		this.emit("bell");
	},
	/**
	* BACKSPACE
	*/
	"\x08": function(cmd, chunk) { // BACKSPACE
		this.state.mvCursor(-1, 0);
	},
	/**
	* TAB
	*/
	"\x09": function(cmd, chunk) { // TAB
		this.state.mvTab(1);
	},
	/**
	* DELETE
	*/
	"\x7f": function(cmd, chunk) { // DELETE
		this.state.removeChar(1);
	},
	/**
	* TABSET
	*/
	"\x88": function(cmd, chunk) { // TABSET
		this.state.setTab();
	},
	/**
	* SO
	*/
	"\x0e": function() { }, // SO
	/**
	* SI
	*/
	"\x0f": function() { }, // SI

	/**
	* ESCAPE
	*/
	"\x1b": function(cmd, chunk) {
		return chunk[1] !== undefined ?
			this.callHandler("esc", chunk[1], chunk) :
			0;
	},
	/**
	* CARRIAGE RETURN
	*/
	"\r": function(cmd, chunk) {
		this.state.setCursor(0, null);
	}
};
module.exports = chr;

},{}],3:[function(require,module,exports){
"use strict";

// function(cmd, n, m, args, mod);
/**
* csi command handlers
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var csi = {
	/**
	* CSI Ps @ <br>
	* Insert Ps (Blank) Character(s) (default = 1) (ICH)
	*/
	"@": function(cmd, n, m, args, mod) {
		this.state.insertBlank(n || 1);
	},

	/**
	* CSI Ps A <br>
	* Cursor Up Ps Times (default = 1) (CUU)
	*/
	"A": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, -(n || 1));
	},

	/**
	* CSI Ps B <br>
	* Cursor Down Ps Times (default = 1) (CUD)
	*/
	"B": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, n || 1);
	},

	/**
	* CSI Ps C <br>
	* Cursor Forward Ps Times (default = 1) (CUF)
	*/
	"C": function(cmd, n, m, args, mod) {
		this.state.mvCursor(n || 1, 0);
	},

	/**
	* CSI Ps D <br>
	* Cursor backward Ps Times (default = 1) (CUB)
	*/
	"D": function(cmd, n, m, args, mod) {
		this.state.mvCursor(-(n || 1), 0);
	},

	/**
	* CSI Ps E <br>
	* Cursor down Ps Rows, to column 1 (default = 1) (CNL , NEL)
	*/
	"E": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, n || 1).setCursor(0, null);
	},

	/**
	* CSI Ps F <br>
	* Cursor Preceding Line PS Times (default = 1) (CPL)
	*/
	"F": function(cmd, n, m, args, mod) {
		// (vt52 compatibility mode - Use special graphics character set? )
		this.state.mvCursor(0, -n || 1).setCursor(0, null);
	},

	/**
	* CSI Ps G <br>
	* Cursor Character Absolute  [column] (default = [row,1]) (CHA)
	*/
	"G": function(cmd, n, m, args, mod) {
		//vt52 compatibility mode - Use normal US/UK character set )
		this.state.setCursor((n || 1) - 1);
	},

	/**
	* CSI Ps ; Ps H <br>
	* Cursor Position [row;column] (default = [1,1]) (CUP)
	*/
	"H": function(cmd, n, m, args, mod) {
		this.state.setCursor((m || 1) - 1, (n || 1) - 1);
	},

	/**
	* CSI Ps I <br>
	* Cursor Forward Tabulation Ps tab stops (default = 1) (CHT)
	*/
	"I": function(cmd, n, m, args, mod) {
		this.state.mvTab(n || 1);
	},

	/**
	* CSI Ps J <br>
	* Erase in Display (default = 0) (ED)
	* <ul>
	* <li>J  - erase from cursor to end of display</li>
	* <li>0J - erase from cursor to end of display</li>
	* <li>1J - erase from start to cursor</li>
	* <li>2J - erase whole display</li>
	* </ul>
	*/
	"J": function(cmd, n, m, args, mod) {
		this.state.eraseInDisplay(n || 0);
	},

	/**
	* CSI Ps K <br>
	* Erase in Line (default = 0) (EL)
	* <ul>
	* <li>K  - erase from cursor to end of line</li>
	* <li>0K - erase from cursor to end of line</li>
	* <li>1K - erase from start of line to cursor</li>
	* <li>2K - erase whole line</li>
	* </ul>
	*/
	"K": function(cmd, n, m, args, mod) {
		this.state.eraseInLine(n || 0);
	},

	/**
	* CSI Ps L <br>
	* Insert Ps Line(s) (default = 1) (IL)
	*/
	"L": function(cmd, n, m, args, mod) {
		this.state.insertLine(n || 1);
	},

	/**
	* CSI Ps M <br>
	* Delete Ps Line(s) (default = 1) (DL)
	*/
	"M": function(cmd, n, m, args, mod) {
		this.state.removeLine(n || 1);
	},

	/**
	* CSI Ps P <br>
	* Delete Ps Character(s) (default = 1) (DCH)
	*/
	"P": function(cmd, n, m, args, mod) {
		this.state.removeChar(n || 1);
	},

	/**
	* CSI Pl ; Pc R <br>
	* Report cursor pAosition (CPR)<br>
	* <ul>
	* <li>Pl indicates what line the cursor is on</li>
	* <li>Pr indicated what row the cursor is on</li>
	* </ul>
	* @todo implement
	*/
	"R": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps S <br>
	* Scroll up Ps lines (default = 1) (SU)
	*/
	"S": function(cmd, n, m, args, mod) {
		this.state.scroll(n || 1);
	},

	/**
	* CSI Ps T <br>
	* Scroll down Ps lines (default = 1) (SD) <br>
	* CSI Ps ; Ps ; Ps ; Ps ; Ps T <br>
	* Initiate highlight mouse tracking <br>
	* CSI > Ps; Ps T <br>
	* @todo handle ">" mode
	*/
	"T": function(cmd, n, m, args, mod) {
		if(args.length <= 1)
			this.state.scroll(-n || -1);
	},

	/**
	* CSI Ps X <br>
	* Erase Ps Character(s) (default = 1) (ECH)
	*/
	"X": function(cmd, n, m, args, mod) {
		this.state.eraseCharacters(n || 1);
	},

	/**
	* CSI Ps Z <br>
	* Cursor Backward Tabulation Ps tab stops (default = 1) (CBT)
	*/
	"Z": function(cmd, n, m, args, mod) {
		this.state.mvTab(-(n || 1));
	},

	/**
	* CSI Ps a <br>
	* Move cursor right the indicated # of columns (default = 1) (HPR)
	*/
	"a": function(cmd, n, m, args, mod) {
		this.state.mvCursor(n || 1, 0);
	},

	/**
	* CSI Ps b <br>
	* Repeat the preceding graphic character Ps times (REP)
	*/
	"b": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI P s c <br>
	* Send Device Attributes (Primary DA) <br>
	* CSI > P s c <br>
	* Send Device Attributes (Secondary DA) <br>
	*/
	"c": function(cmd, n, m, args, mod) {
		// TODO
		this.emit("request", "\x1b>0;95;c");
	},

	/**
	* CSI Pm d <br>
	* Line Position Absolute  [row] (default = [1,column]) (VPA)
	*/
	"d": function(cmd, n, m, args, mod) {
		this.state.setCursor(null, (n || 1) - 1);
	},

	/**
	* CSI Pm e <br>
	* Vertical position relative.
	* Move cursor down the indicated # of rows (default = 1) (VPR)
	*/
	"e": function(cmd, n, m, args, mod) {
		this.state.mvCursor(0, n || 1);
	},

	/**
	* CSI Ps ; Ps f <br>
	* Horizontal and Vertical Position [row;column] (default =  [1,1]) (HVP)
	*/
	"f": function(cmd, n, m, args, mod) {
		this.state.setCursor((m || 1) - 1, (n || 1) - 1);
	},

	/**
	* CSI Ps g <br>
	* Tab Clear (default = 0) (TBC)
	*/
	"g": function(cmd, n, m, args, mod) {
		// 0g = clear tab stop at the current position
		// 3g = delete all tab stops
		// TODO
		this.state.tabClear(n || 0);
	},

	/**
	* CSI Pm h <br>
	* Set Mode (SM) <br>
	* CSI ? Pm h - mouse escape codes, cursor escape codes <br>
	*/
	"h": function(cmd, n, m, args, mod) {
		var i;

		for(i = 0; i < args.length; i++)
			this.callHandler("mode", mod+args[i], true);
	},

	/**
	* CSI Pm i  Media Copy (MC) <br>
	* CSI ? Pm i <br>
	*/
	"i": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Pm l  Reset Mode (RM) <br>
	* CSI ? Pm l <br>
	*/
	"l": function(cmd, n, m, args, mod) {
		var i;

		for(i = 0; i < args.length; i++)
			this.callHandler("mode", mod+args[i], false);
	},

	/**
	* CSI Pm m <br>
	* Character Attributes (SGR) <br>
	* CSI > Ps; Ps m <br>
	*/
	"m": function(cmd, n, m, args, mod) {
		// Set graphic rendition

		var i;
		if(args[1] === 5 && args[0] === 38)
			this.state.setAttribute("fg", args[2]);
		else if(args[1] === 5 && args[0] === 48)
			this.state.setAttribute("bg", args[2]);
		else {
			for(i = 0; i < args.length; i++)
				this.callHandler("sgr", args[i]);
			if(i === 0)
				this.callHandler("sgr", 0);
		}
	},

	/**
	* CSI Ps n  Device Status Report (DSR) <br>
	* CSI > Ps n <br>
	* <ul>
	* <li>5n - Device Status report</li>
	* <li>0n - Response: terminal is OK</li>
	* <li>3n - Response: terminal is not OK</li>
	* <li>6n - Request cursor position (CPR)</li>
	* </ul>
	* @todo implement
	*/
	"n": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI > Ps p  Set pointer mode <br>
	* CSI ! p   Soft terminal reset (DECSTR) <br>
	* CSI Ps$ p <br>
	*   Request ANSI mode (DECRQM) <br>
	* CSI ? Ps$ p <br>
	* Request DEC private mode (DECRQM) <br>
	* CSI Ps ; Ps " p <br>
	*/
	"p": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps q <br>
	* Load LEDs (DECLL) <br>
	* CSI Ps SP q <br>
	* CSI Ps " q <br>
	* <ul>
	* <li>0q - turn off all four leds</li>
	* <li>1q - turn on Led #1</li>
	* <li>2q - turn on Led #2</li>
	* <li>3q - turn on Led #3</li>
	* <li>4q - turn on Led #4</li>
	* </ul>
	*/
	"q": function(cmd, n, m, args, mod) {
		if(n === 0)
			this.state.resetLeds();
		else
			this.state.ledOn(n-1);
	},

	/**
	* CSI Ps ; Ps r <br>
	* Set Scrolling Region [top;bottom] (default = full size of window)
	* (DECSTBM) <br>
	* CSI ? Pm r <br>
	* CSI Pt; Pl; Pb; Pr; Ps$ r <br>
	*/
	"r": function(cmd, n, m, args, mod) {
		// TODO handle ? prefix, $ ends
		this.state.setScrollRegion((n || 1) -1 , (m || (this.state.rows) ) -1);
	},

	/**
	* CSI ? Pm s <br>
	* Save cursor (ANSI.SYS)
	*/
	"s": function(cmd, n, m, args, mod) {
		this.state.saveCursor();
	},

	/**
	* CSI t <br>
	* unknown
	* @todo implement
	*/
	"t": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps SP u <br>
	* Restore cursor (ANSI.SYS)
	*/
	"u": function(cmd, n, m, args, mod) {
		this.state.restoreCursor();
	},

	/**
	* CSI Pt; Pl; Pb; Pr; Pp; Pt; Pl; Pp$ v <br>
	* (DECCRA)
	* @todo implement
	*/
	"v": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Pt ; Pl ; Pb ; Pr " w <br>
	* (DECEFR)
	* @todo implement
	*/
	"w": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps x  Request Terminal Parameters (DECREQTPARM) <br>
	* CSI Ps x  Select Attribute Change Extent (DECSACE) <br>
	* CSI Pc; Pt; Pl; Pb; Pr$ x <br>
	* @todo implement
	*/
	"x": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* Request Checksum of Rectangular Area
	* DECRQCRA
	* @todo implement
	*/
	"y": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Ps ; Pu " z <br>
	* CSI Pt; Pl; Pb; Pr$ z <br>
	* (DECELR) / (DECERA)
	* Erase rectangular area
	*/
	"z": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI Pm `  Character Position Absolute <br>
	*   [column] (default = [row,1]) (HPA)
	*/
	"`": function(cmd, n, m, args, mod) {
		this.state.setCursor((n || 1) - 1);
	},

	/**
	* CSI Pm " { <br>
	* CSI Pt; Pl; Pb; Pr$ { <br>
	* Selectively erase retangular area (DECSLE) / (DECSERA)
	* @todo implement
	*/
	"{": function(cmd, n, m, args, mod) {
		// TODO
	},


	/**
	* CSI Ps " | <br>
	* Request locator position (DECRQLP)
	* @todo implement
	*/
	"|": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI P m SP } <br>
	* Insert P s Column(s) (default = 1) (DECIC), VT420 and up
	* @todo implement
	*/
	"}": function(cmd, n, m, args, mod) {
		// TODO
	},

	/**
	* CSI P m SP ~ <br>
	* Delete P s Column(s) (default = 1) (DECDC), VT420 and up
	* @todo implement
	*/
	"~": function(cmd, n, m, args, mod) {
		// TODO
	}
};
module.exports = csi;

},{}],4:[function(require,module,exports){
"use strict";

// function(cmd, n, m, args, mod);

/**
* dcs command handlers
* Currently we ignore all DCS codes
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
module.exports = {

};

},{}],5:[function(require,module,exports){
"use strict";

/**
* esc command handlers
* Currently we ignore all DCS codes
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var esc = {
	/**
	* ESC c<br>
	* Full Reset (RIS)
	*/
	"c": function(cmd, chunk) {
		this.state.reset();
		return 2;
	},

	/**
	* ESC D<br>
	* Index (IND is 0x84)
	* Moves cursor down one line in same column. 
	* If cursor is at bottom margin, screen performs a scroll-up.
	*/
	"D": function(cmd, chunk) {
		this.state.nextLine();
		return 2;
	},

	/**
	* ESC E<br>
	* Next Line (NEL is 0x85)
	* This sequence causes the active position to move to the first position on
	* the next line downward
	* If the active position is at the bottom margin, a scroll up is performed
	*/
	"E": function(cmd, chunk) {
		this.state.nextLine().setCursor(0);
		return 2;
	},

	/**
	* ESC F<br>
	* Start of Selected Area to be sent to auxiliary output device (SSA)
	*/

	/**
	* ESC G<br>
	* End of Selected Area to be sent to auxiliary output device (SSA)
	*/

	/**
	* ESC H<br>
	* Tab Set (HTS is 0x88)
	*/
	"H": function(cmd, chunk) {
		this.state.setTab();
		return 2;
	},

	/**
	* ESC I<br>
	* Horizontal Tab Justify, moves string to next tab position (HTJ)
	*/

	/**
	* ESC J<br>
	* Vertical Tabulation Set at current line (VTS)
	*/

	/**
	* ESC K<br>
	* Partial Line Down (subscript) (PLD)
	*/

	/**
	* ESC L<br>
	* Partial Line Up (superscript) (PLU)
	*/
 
	/**
	* ESC M<br>
	* Reverse Index (RI is 0x8d)
	* Move the active position to the same horizontal position on the preceding line. 
	* If the active position is at the top margin, a scroll down is performed
	*/
	"M": function(cmd, chunk) {
		this.state.prevLine();
		return 2;
	},

	/**
	* ESC N<br>
	* Single Shift Select of G2 Character Set (SS2 is 0x8e). This affects next character only
	*/
	"N": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC O<br>
	* Single Shift Select of G3 Character Set (SS3 is 0x8f). This affects next character only
	*/
	"O": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC P<br>
	* Device Control String (DCS is 0x90)
	* @todo function should return errors if it detects garbaged DCS sequences
	*/
	"P": function(cmd, chunk) {

		var dcs = this.parseDcs(chunk);
		if(dcs === null || dcs.cmd === "")
			return 0;
		else if(dcs.length !== chunk.length && dcs.cmd === "") {
			// TODO Garbaged DCS. report error.
			return 1;
		}

		var result = this.callHandler("dcs", dcs.cmd, +dcs.args[0],
									  +dcs.args[1], dcs.args, dcs.mod);
		return dcs.length;
	},

	/**
	* ESC Q<br>
	* Private Use 1 (PU1)
	*/
	"Q": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC R<br>
	* Private Use 2 (PU2)
	*/
	"R": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC S<br>
	* Set Transmit State (STS)
	*/
	"S": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC T<br>
	* Cancel Character, ignore previous character (CCH)
	* @todo implement
	*/
	"T": function(cmd, chunk) {
		//TODO
		return 2;
	},

	/**
	* ESC U<br>
	* Message Waiting, turns on an indicator on the terminal (MW)
	*/
	"U": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC V<br>
	* Start of Protected Area (SPA)
	*/
	"V": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC W<br>
	* End of Protected Area (EPA)
	*/
	"W": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC X<br>
	* Reserved
	*/
	"X": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC Y<br>
	* Reserved
	*/
	"Y": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC Z<br>
	* DECID Dec Private identification
	* The kernel returns the string ESC [ ? 6 c , claiming it is a VT102
	*/
	"Z": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC n<br>
	* Invoke the G2 Character Set as GL (LS2)
	* @todo implement
	*/
	"n": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC o<br>
	* Invoke the G3 Character Set as GL (LS3)
	* @todo implement
	*/
	"o": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC 7<br>
	* Save Cursor (DECSC)
	*/
	"7": function(cmd, chunk) {
		this.state.saveCursor();
		return 2;
	},

	/**
	* ESC 8<br>
	* Restore Cursor (DECRC)
	*/
	"8": function(cmd, chunk) {
		this.state.restoreCursor();
		return 2;
	},

	/**
	* ESC |<br>
	* Invoke the G3 Character Set as GR (LS3R)
	*/
	"|": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC [<br>
	* Control sequence introducer (CSI)
	* @todo function should return errors if it detects garbaged CSI sequences
	*/
	"[": function(cmd, chunk) {
		var csi = this.parseCsi(chunk);
		if(csi === null || csi.cmd === "")
			return 0;
		else if(csi.length !== chunk.length && csi.cmd === "") {
			// TODO Garbaged CSI. report error.
			return 1;
		}

		var result = this.callHandler("csi", csi.cmd, +csi.args[0], +csi.args[1], csi.args, csi.mod);
		//if(result === null)
		// TODO Unknown CSI. report error.
		return csi.length;
	},

	/**
	* ESC \<br>
	* 7-bit - File Separator (FS)
	* 8-bit - String Terminator (VT125 exits graphics) (ST)
	*/
	"\\": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC ]<br>
	* 7-bit - Group Separator (GS)
	* 8-bit - Operating System Command (OSC is 0x9d)
	* @todo function should return errors if it detects garbaged OSC sequences
	*/
	"]": function(cmd, chunk) {
		var osc = this.parseOsc(chunk);
		if(osc === null || osc.terminated === false)
			return 0;
		else if(osc.length !== chunk.length && osc.terminated === false) {
			// TODO Garbaged OSC. report error.
			return 1;
		}

		var result = this.callHandler("osc", osc.cmd, osc.args);
		//if(result === null)
		// TODO Unknown OSC. report error.
		return osc.length;
	},

	/**
	* ESC ^<br>
	* Privacy Message (password verification), terminaed by ST 
	* (PM is 0x9e) (PM)
	*/
	"^": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC _<br>
	* Application Program Command (to word processor), term by ST
	* (APC is 0x9f) (APC)
	*/
	"_": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC %<br>
	* Select default/utf-8 character set.
	* @ = default, G = utf-8; 8 (Obsolete)
	*/
	"%": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC }<br>
	* Invoke the G2 Character Set as GR (LS2R)
	*/
	"}": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC ~<br>
	* Invoke the G1 Character Set as GR (LS1R)
	*/
	"~": function(cmd, chunk) {
		// TODO
		return 2;
	},

	/**
	* ESC ( ) * + - .<br>
	* TODO
	*/
	"(": function(cmd, chunk) {
		if(chunk[2] === undefined)
			return 0;
		this.state.setMode("graphic", chunk[2] === "0");
		return 3;
	},
	")": ".",
	"*": ".",
	"+": ".",
	"-": ".",
	".": function(cmd, chunk) {
		if(chunk[2] === undefined)
			return 0;
		this.state.setMode("graphic", false);
		return 3;
	},

	/**
	* ESC #<br>
	* 3 DEC line height/width
	*/
	"#": function(cmd, chunk) {
		if(chunk[2] === undefined)
			return 0;
		var line = this.state.getLine();
		switch(chunk[2]) {
		case "3":
			line.attr.doubleheight = "top";
			break;
		case "4":
			line.attr.doubleheight = "bottom";
			break;
		case "5":
			line.attr.doubleheight =
			line.attr.doublewidth = false;
			break;
		case "6":
			line.attr.doublewidth = true;
			break;
		}
		this.state.setLine(line);
		return 3;
	},

	/**
	* ESC g<br>
	* Visual Bell
	*/
	"g": function(cmd, chunk) {
		this.emit("bell", true);
		return 2;
	},

	/**
	* ESC &lt;<br>
	* The terminal interprets all sequences according to ANSI standards X3.64-1979 and X3.41-1974.
	* The VT52 escape sequences described in this chapter are not recognized.
	* (DECANM)
	*/
	"<": function(cmd, chunk) {
		return 2;
	},

	/**
	* ESC &gt;<br>
	* (set numeric keypad mode?)
	* Normal Keypad (DECPNM)
	*/
	">": function(cmd, chunk) {
		this.state.setMode("appKeypad", false);
		return 2;
	},

	/**
	* ESC =<br>
	* Application Keypad (DECPAM)
	* Serial port requested application keyboard
	*/
	"=": function(cmd, chunk) {
		this.state.setMode("appKeypad", true);
		return 2;
	}
};
module.exports = esc;

},{}],6:[function(require,module,exports){
"use strict";

// function(cmd, value)
function genMode(s) {
	return function(cmd, value) {
		this.state.setMode(s, value);
	};
}
/**
* handlers for Mode escape characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var mode = {
	// "0": // Error this command is ignored
	"1": genMode("appKeypad"), // Application Key Pad - Guarded Area Transmit Mode, send all (VT132) (GATM)
	// "?1": // Cursor Keys Mode (DECCKM)
	// "2": // Keyboard Action Mode , disable keyboard input (KAM)
	// "?2": // ANSI Mode, use ESC < to switch VT52 to ANSI (DECANM)
	// "3": , // Enable or disable control characters to be displayed
	// "?3": genMode("132col"), // Column mode - 132 col (DECOLM)
	"4": genMode("insert"), //  Insert/Replace Mode (IRM)
	// "?4": , // Scrolling Mode - Smooth (DECSCLM)
	//"5": // Status Report Transfer Mode, report after DCS (STRM)
	"?5": genMode("reverse"), // Screen Mode - Reverse (DECSCNM)
	//"?6": genMode("relative"), // Origin Mode, line 1 is relative to scroll region (DECOM)
	"7": genMode("wrap"), // Wraparound - On - Vertical Editing Mode (VEM)
	//"?7": // AutoWrap Mode, start newline after column 80 (DECWAM)
	//"8": // reserved
	//"?8": // Auto Repeat Mode, key will autorepeat (DECARM)
	//"9": // reserved
	//"?9": genMode("interlace"), // INterLace Mode, interlaced for taking photos
	//"10": // (HEM)
	//"?10": // EDit Mode, VT132 is in EDIT mode (DECEDM)
	//"11": // (PUM)
	//"?11": // Line Transmit Mode, ignore TTM, send line (DECLTM)
	//"12": // (SRM), // Local Echo: Send/Receive Mode
	"?12": genMode("cursorBlink"), // Blink Cursor
	//"13": // Format Effector Action Mode, FE"s are stored (FEAM)
	//"?13": // Space Compression/Field Delimiting on (DECSCFDM)
	//"14": // Format Effector Transfer Mode, send only if stored (FETM)
	//"?14": // Transmit Execution Mode, transmit on ENTER (DECTEM)
	//"15": // Multiple Area Transfer Mode, send all areas (MATM)
	//"16": // Transmit Termination Mode, send scrolling region (TTM)
	//"17": // Send Area Transmit Mode, send entire buffer (SATM)
	//"18": // Tabulation Stop Mode, lines are independent (TSM)
	//"?18": // Print FormFeed mode, send FF after printscreen (DECPFF) - Print Form Feed Mode
	//"19": // Editing Boundry Mode, all of memory affected (EBM)
	//"?19": // Printer Extent Mode (DECPEX) (DECPEXT)
	"20": genMode("crlf"), // Automatic Linefeed Mode (LNM)
	// "?20": // Overstrike, overlay characters on GIGI (OV1)
	// "?21": // Local BASIC, GIGI to keyboard and screen (BA1)
	// "?22": // Host BASIC, GIGI to host computer (BA2)
	// "?23": // GIGI numeric keypad sends reprogrammable sequences (PK1)
	// "?24": // Autohardcopy before erasing or rolling GIGI screen (AH1
	"?25": genMode("cursor"), // Visible Cursor (DECTCEM)
	// "34": // Normal Cursor visibility (DECRLM)
	// "?35": // (DECHEBM) - Hebrew/N-A Keyboard Mapping
	// "?36": // (DECHEM) - Hebrew Encoding Mode
	// "?38": // (DECTEK)- TEKtronix mode graphics
	// "?42": // (DECNRCM) - Enable operation in 7-bit or 8-bit character mode
	"?47": function(cmd, value) {
		this.state.switchBuffer(value);
	},
	// "?57": // (DECNAKB) - Greek/N-A Keyboard Mapping
	// "?60": // (DECHCCM) - Page Cursor-Coupling Mode
	// "?61": // (DECVCCM) - Vertical Cursor-Coupling Mode
	// "?64": // (DECPCCM) - Page Cursor-Coupling Mode
	// "?66": // (DECNKM) - Numeric Keypad Mode
	// "?67": // (DECKBUM) - Typewriter or Data Processing Keys
	// "?68": // (DECLRMM) (DECVSSM) - Left Right Margin Mode
	// "?73": // (DECXRLMM)
	// "?95": // (DECNCSM) - Set/Reset No Clearing Screen On Column Change
	// "?96": // (DECRLCM) - Right-to-Left Copy
	// "?97": // (DECCRTSM) - Set/Reset CRT Save Mode
	// "?98": // (DECARSM) - Set/Reset Auto Resize Mode
	// "?99": // (DECMCM) - Set/Reset Modem Control Mode
	// "?100": // (DECAAM) - Set/Reset Auto Answerback Mode
	// "?101": // (DECCANSM) - Conceal Answerback Message Mode
	// "?102": // (DECNULM) - Set/Reset Ignoring Null Mode
	// "?103": // (DECHDPXM) - Set/Reset Half-Duplex Mode
	// "?104": // (DECESKM) - Enable Secondary Keyboard Language Mode
	// "?106": // (DECOSNM)
	"?1000": genMode("mousebtn"), // VT200 Mouse tracking
	"?1002": genMode("mousemtn"),

	"?1047": function(cmd, value) {
		this.state.switchBuffer(value);
	},
	"?1048": function(cmd, v) {
		if(v)
			this.state.saveCursor();
		else
			this.state.restoreCursor();
	},
	"?1049": function(cmd, v) {
		this.callHandler("mode", "1048", v);
		this.callHandler("mode", "1047", v);
		if(v)
			this.state.setCursor(0, 0);
	}
};
module.exports = mode;

},{}],7:[function(require,module,exports){
"use strict";

function emitter(name) {
	var args_ = arguments;
	return function(cmd, arg) {
		var args = Array.prototype.slice(args_, 1);
		args.unshift(arg);
		this.emit.apply(name, args);
	};
}

function meta(name) {
	return function(cmd, arg) {
		this.state.setMeta(name, arg);
	};
}

var specialColor = {
	0: "bold",
	1: "underline",
	2: "blink",
	3: "reverse"
};

/**
* handlers for OSC escape characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var osc = {
	"": "0",
	0: function(cmd, args) {
		this.state.setMeta("title", args[0]);
		this.state.setMeta("icon", args[0]);
	},
	1: meta("icon"),
	2: meta("title"),
	3: function() {},
	4: function(cmd, arg) {
		arg = arg.split(";");
		this.emit("colorchange", arg[0], arg[1]);
	},
	5: function(cmd, arg) {
		arg = arg.split(";");
		this.emit("colorchange", specialColor[arg[0]], arg[1]);
	},
	10: emitter("colorchange", "fg"),
	11: emitter("colorchange", "bg"),
	12: emitter("colorchange", "cursor"),
	13: emitter("colorchange", "mousefg"),
	14: emitter("colorchange", "mousebg"),
	15: emitter("colorchange", "tektronixfg"),
	16: emitter("colorchange", "tektronixbg"),
	17: emitter("colorchange", "highlightbg"),
	18: emitter("colorchange", "tektronixhighlight"),
	19: emitter("colorchange", "highlightfg"),

	46: emitter("logfilechange"),
	50: emitter("fontchange"),
	51: emitter("emacs"),

	// TODO: Manipulate Selection Data
	52: function() {
		
	},
	104: function(cmd, arg) {
		this.emit("colorreset", arg);
	},
	105: function(cmd, arg) {
		this.emit("colorreset", specialColor[arg]);
	},

	110: emitter("colorreset", "fg"),
	111: emitter("colorreset", "bg"),
	112: emitter("colorreset", "cursor"),
	113: emitter("colorreset", "mousefg"),
	114: emitter("colorreset", "mousebg"),
	115: emitter("colorreset", "tektronixfg"),
	116: emitter("colorreset", "tektronixbg"),
	117: emitter("colorreset", "highlightbg"),
	118: emitter("colorreset", "tektronixhighlight"),
	119: emitter("colorreset", "highlightfg"),
};
module.exports = osc;

},{}],8:[function(require,module,exports){
"use strict";

function attr(name, value) {
	return function() {
		this.state.setAttribute(name, value);
	};
}
/**
* handlers for SGR escape characters
* @enum {Function|string}
* @readonly
* @this refers to calling {@link Terminal}
*/
var sgr = {
	0: function(cmd) {
		this.state.resetAttribute();
	},
	1: attr("bold", true), // Bold
	2: function(cmd) {}, // Weight:feint
	3: attr("italic", true), // Italic
	4: attr("underline", true), // Underline
	5: "6", // Slowly Blinking
	6: attr("blink", true), //Rapidly Blinking
	7: attr("inverse", true), // Inverse
	8: function(cmd) {}, // Hidden
	9: function(cmd) {}, // Strike Through
	20: function(cmd) {}, // Style:fraktur
	21: function(cmd) {}, // Double Underlined
	22: attr("bold", false),
	23: attr("italic", false),
	24: attr("underline", false),
	25: attr("blink", false),
	27: attr("inverse", false),

	30: "37", 31: "37", 32: "37", 33: "37", 34: "37", 35: "37", 36: "37",
	37: function(cmd) {
		this.state.setAttribute("fg", (+cmd) - 30);
	},

	38: function(cmd) {
		// TODO 255 color support
	},
	39: function(cmd) {
		this.state.resetAttribute("fg");
	},

	40: "47", 41: "47", 42: "47", 43: "47", 44: "47", 45: "47", 46: "47",
	47: function(cmd) {
		this.state.setAttribute("bg", (+cmd) - 40);
	},
	48: function(cmd) {
		// TODO 255 color support
	},
	49: function(cmd) {
		this.state.resetAttribute("bg");
	},

	51: function(cmd) { // Frame:box
		
	},

	52: function(cmd) { // Frame:circle
		
	},

	53: function(cmd) { // Overlined
		
	},

	90: "97", 91: "97", 92: "97", 93: "97", 94: "97", 95: "97", 96: "97",
	97: function(cmd) {
		this.state.setAttribute("fg", (+cmd) - 90 + 8);
	},
	100: "107", 101: "107", 102: "107", 103: "107", 104: "107", 105: "107", 106: "107",
	107: function(cmd) {
		this.state.setAttribute("bg", (+cmd) - 100 + 8);
	}
};
module.exports = sgr;

},{}],9:[function(require,module,exports){
"use strict";

var stream = require("stream");
var util = require("util");
var myUtil = require("../util.js");

function BaseInput(target, buffer) {
	BaseInput.super_.apply(this, arguments);

	var opts = arguments[Math.max(1, arguments.length - 1)];
	this.target = target;
	this.buffer = buffer;
	this._appKeypad = false;
	var self = this;
	buffer.on("modechange", function(name, value) {
		if(name === "appKeypad")
			self._appKeypad = value;
	});
	this._opts = myUtil.extend({}, this._defOpts, opts);
}
util.inherits(BaseInput, stream.Readable);

BaseInput.prototype.getKey = function(key) {
	switch(key) {
	case "up":
		key = this._appKeypad ? "\x1bOA" : "\x1b[A";
		break;
	case "down":
		key = this._appKeypad ? "\x1bOB" : "\x1b[B";
		break;
	case "right":
		key = this._appKeypad ? "\x1bOC" : "\x1b[C";
		break;
	case "left":
		key = this._appKeypad ? "\x1bOD" : "\x1b[D";
		break;
	}
	return key;
};

BaseInput.prototype._read = function() {

};

module.exports = BaseInput;

},{"../util.js":24,"stream":47,"util":51}],10:[function(require,module,exports){
"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function DomInput(target, buffer, opts) {
	DomInput.super_.apply(this, arguments);

	target.tabIndex = 0;
	this._input = window.document.createElement("input");
	this._input.style.width = this._input.style.height = this._input.style.opacity = "0";
	this._input.style.border = "none";
	this._input.style.position = "absolute";
	this._input.style.zIndex = -10000;
	target.parentNode.insertBefore(this._input, target);
	this._addListener(target, "focus", this._focus);
	this._addListener(this._input, "keypress", this._keypress);
	this._addListener(this._input, "keydown", this._keydown);
}
inherits(DomInput, require("./base"));
module.exports = DomInput;

DomInput.prototype._addListener = function(elem, name, cb) {
	var self = this;
	var wrap = function(ev) {
		ev = ev || window.event;
		return cb.call(self, ev);
	};
	if(elem.addEventListener)
		elem.addEventListener(name, wrap);
	else
		elem["on"+name] = wrap;
};

DomInput.prototype.getKeyCode = function(ev) {
	if(!ev)
		return;
	else if(ev.charCode)
		return ev.charCode;
	else if(ev.which)
		return ev.which;
	else
		return ev.keyCode;
};
// Taken from tty.js: https://github.com/chjj/tty.js
DomInput.prototype._keypress = function(ev) {
	var key = this.getKeyCode(ev);
	if (!key || ev.ctrlKey || ev.altKey || ev.metaKey) return;

	if(ev.stopPropagation) ev.stopPropagation();
	if(ev.preventDefault) ev.preventDefault();
	this.push(String.fromCharCode(key));
	return false;
};

DomInput.prototype._focus = function(ev) {
	this._input.focus();
};
// Taken from tty.js: https://github.com/chjj/tty.js
DomInput.prototype._keydown = function(ev) {
	var key, keyCode = this.getKeyCode(ev);

	switch (keyCode) {
	//backspace
	case 8:
		if (ev.shiftKey) {
			key = "\x08"; //^H
			break;
		}
		key = "\x7f"; //^?
		break;
	//tab
	case 9:
		if (ev.shiftKey) {
			key = "\x1b[Z";
			break;
		}
		key = "\t";
		break;
	//return /enter
	case 13:
		key = "\r";
		break;
	//escape
	case 27:
		key = "\x1b";
		break;
	//left - arrow
	case 37:
		key = this.getKey("left");
		break;
	//right - arrow
	case 39:
		key = this.getKey("right");
		break;
	//up - arrow
	case 38:
		key = this.getKey("up");
		break;
	//down - arrow
	case 40:
		key = this.getKey("down");
		break;
	//delete
	case 46:
		key = "\x1b[3~";
		break;
	//insert
	case 45:
		key = "\x1b[2~";
		break;
	//home
	case 36:
		key = "\x1bOH";
		break;
	//end
	case 35:
		key = "\x1bOF";
		break;
	//page up
	case 33:
		key = "\x1b[5~";
		break;
	//page down
	case 34:
		key = "\x1b[6~";
		break;
	//F1
	case 112:
		key = "\x1bOP";
		break;
	//F2
	case 113:
		key = "\x1bOQ";
		break;
	//F3
	case 114:
		key = "\x1bOR";
		break;
	//F4
	case 115:
		key = "\x1bOS";
		break;
	//F5
	case 116:
		key = "\x1b[15~";
		break;
	//F6
	case 117:
		key = "\x1b[17~";
		break;
	//F7
	case 118:
		key = "\x1b[18~";
		break;
	//F8
	case 119:
		key = "\x1b[19~";
		break;
	//F9
	case 120:
		key = "\x1b[20~";
		break;
	//F10
	case 121:
		key = "\x1b[21~";
		break;
	//F11
	case 122:
		key = "\x1b[23~";
		break;
	//F12
	case 123:
		key = "\x1b[24~";
		break;
	default:
		//a - z and space
		if (ev.ctrlKey) {
			if (keyCode >= 65 && keyCode <= 90)
				key = String.fromCharCode(keyCode - 64);
			else if (keyCode === 32)
				//NUL
				key = String.fromCharCode(0);
			else if (keyCode >= 51 && keyCode <= 55)
				//escape, file sep, group sep, record sep, unit sep
				key = String.fromCharCode(keyCode - 51 + 27);
			else if (keyCode === 56)
				//delete
				key = String.fromCharCode(127);
			else if (keyCode === 219)
				//^[-escape
					key = String.fromCharCode(27);
			else if (keyCode === 221)
				//^] - group sep
				key = String.fromCharCode(29);
		} else if (ev.altKey) {
			if (keyCode >= 65 && keyCode <= 90)
				key = "\x1b" + String.fromCharCode(keyCode + 32);
			else if (keyCode === 192)
				key = "\x1b`";
			else if (keyCode >= 48 && keyCode <= 57)
				key = "\x1b" + (keyCode - 48);
		}
		break;
	}
	if(key !== undefined) {
		if(ev.stopPropagation) ev.stopPropagation();
		if(ev.preventDefault) ev.preventDefault();
		this.push(key);
		return false;
	}
};

DomInput.canHandle = require("../output/dom.js").canHandle;

},{"../output/dom.js":14,"../util":24,"./base":9,"util":51}],11:[function(require,module,exports){
"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function TtyInput(target, buffer, opts) {
	TtyInput.super_.apply(this, arguments);
	var self = this;
	if(this.target.stdout)
		this.target = this.target.stdout;
	this.target.on("readable", function() {
		self.doread();
	});
}
inherits(TtyInput, require("./base"));
module.exports = TtyInput;

var APP_KEYPAD_PATTERN = /\x1b\[([0-9;]*[ABCD])/g;
TtyInput.prototype.doread = function() {
	var data = this.target.read().toString();
	if(this.appKeypad)
		data = data.replace(APP_KEYPAD_PATTERN, "\x1bO$1");

	this.push(data);
};

TtyInput.canHandle = function(target) {
	if(target.stdin)
		target = target.stdin;
	return typeof target === "object" && "read" in target && "on" in target && target.isTTY;
};

},{"../util":24,"./base":9,"util":51}],12:[function(require,module,exports){
"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function AnsiOutput(state, opts) {
	AnsiOutput.super_.apply(this, arguments);
}
inherits(AnsiOutput, require("./base.js"));
module.exports = AnsiOutput;

AnsiOutput.prototype._mkSgr = function(attr, extra) {
	var codes = "", cursor = extra && extra.$cursor;

	codes += attr.bold === true ? ";1" : ";22";
	codes += attr.italic === true ? ";3" : ";23";
	codes += attr.underline === true ? ";4" : ";24";
	codes += attr.blink === true ? ";5" : ";25";
	codes += (attr.inverse === true || (cursor && attr.inverse !== true)) ?
		";7" : ";27";

	var fg = attr.fg;
	var bg = attr.bg;

	if (fg) {
		if (fg < 8) codes += ";" + (+fg + 30);
		else if (fg < 16) codes += ";" + (+fg + 90 - 8);
		else codes += ";38;5;"+fg;
	}
	if (bg) {
		if (bg < 7) codes += ";" + (+bg + 30);
		else if (bg < 16) codes += ";" + (+bg + 100 - 8);
		else codes += ";48;5;"+bg;
	}

	return "\x1b["+codes.substr(1)+"m";
};

AnsiOutput.prototype._renderLine = function(line, cursor) {
	var i, start;
	var output = "", attr;
	var str = line.str;

	if(line.attr[str.length].bg !== null)
		str += myUtil.repeat(" ", this.state.colums - str.length);
	else if(cursor !== undefined)
		str += myUtil.repeat(" ", cursor + 1 - str.length);

	for(i = 0; i < str.length;) {
		start = i++;
		if(start in line.attr)
			attr = line.attr[start];
		if(cursor !== start)
			while(i < str.length && !(i in line.attr) && cursor !== i)
				i++;

		output += this._mkSgr(attr, { $cursor: cursor === start}) +
			str.substring(start, i);
	}
	return output;
};

AnsiOutput.prototype.toString = function() {
	var lines = "";
	var c = this.state.cursor;

	for(var i = 0; i < this.state.rows; i++) {
		var line = this.state.getLine(i);
		lines += "\n" + this._renderLine(line, c.y === i ? c.x : null);
	}
	
	return lines.substr(1) + "\x1b[0m";
};

AnsiOutput.canHandle = function(target) {
	return target === "ansi";
};

},{"../util":24,"./base.js":13,"util":51}],13:[function(require,module,exports){
"use strict";

var myUtil = require("../util.js");

function BaseOutput(state) {
	var opts = arguments[Math.max(1, arguments.length - 1)];
	this.state = state;
	this._opts = myUtil.extend({}, this._defOpts, opts);
}
module.exports = BaseOutput;

BaseOutput.prototype.toString = function() {
	throw new Error("toString is not implemented!");
};

},{"../util.js":24}],14:[function(require,module,exports){
"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;
var HtmlOutput = require("./html.js");

function DomOutput(state, writer, target, opts) {
	this.html = new HtmlOutput(state, opts);
	target.innerHTML = "<div style='visibility:hidden;'></div>";
	this.spacer = target.firstChild;
	this.cursorView = null;
	DomOutput.super_.apply(this, arguments);
	this._opts.adhesiveCursor = true;
	this._updateRowCount();
}
inherits(DomOutput, require("./live_base.js"));
module.exports = DomOutput;

DomOutput.prototype._detach = function(view, blk) {
	var parent = view.parentNode;
	var next = view.nextSibling;
	parent.removeChild(view);
	blk.call(this, view);
	if(next)
		parent.insertBefore(view, next);
	else
		parent.appendChild(view);
	return view;
};

DomOutput.prototype.createView = function() {
	var e = this.target.ownerDocument.createElement("div");
	return e;
};

DomOutput.prototype.removeLine = function(number, view) {
	this._updateRowCount();
	return this.target.removeChild(view);
};

DomOutput.prototype.changeLine = function(number, view, line, cursor) {
	// replace a node with its modified clone ist much faster as setting innerHTML directly.
	// see: http://blog.stevenlevithan.com/archives/faster-than-innerhtml
	//view.innerHTML = this.html._renderLine(line, cursor);
	return this._detach(view, function(v) {
		v.innerHTML = this.html._renderLine(line, cursor);
		this.html._mkAttr(line.attr, {$line:true}, v);
	});
};

DomOutput.prototype.insertLine = function(number, view, line, cursor) {
	view.innerHTML = this.html._renderLine(line, cursor);
	this.html._mkAttr(line.attr, {$line:true}, view);
	this.target.insertBefore(view, this.target.childNodes[number]);
	this._updateRowCount();
	return view;
};

DomOutput.prototype.changeLed = function(l1, l2, l3, l4) {

};

DomOutput.prototype.setCursor = function(x, y) {
};

DomOutput.prototype.resize = function(size) {
	this.target.lastChild.innerHTML = this.html._genColumnsString();
};

DomOutput.prototype.commit = function() {

};
DomOutput.prototype._updateRowCount = function() {
	var diff = this.state.rows - this.state.getBufferRowCount();

	var html = myUtil.repeat("<div>&nbsp;</div>", diff) +
		"<div style='line-height:0'>" + myUtil.repeat("&nbsp;", this.state.columns) + "</div>";

	this._detach(this.spacer, function(s) {
		s.innerHTML = html;
		s.lineHeight = diff === 0 ? "0" : "inherit";
	});
};

DomOutput.canHandle = function(target) {
	// Test if target is some kind of DOM-Element
	return target !== null && typeof target === "object" && "ownerDocument" in target;
};

},{"../util":24,"./html.js":15,"./live_base.js":16,"util":51}],15:[function(require,module,exports){
"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;

function HtmlOutput(state, opts) {
	HtmlOutput.super_.apply(this, arguments);
}
inherits(HtmlOutput, require("./base"));
module.exports = HtmlOutput;

HtmlOutput.prototype._defOpts = {
	cssClass: false,
	cursorBg: "#00ff00",
	cursorFg: "#ffffff",
};

// Taken from https://github.com/dtinth/headles-terminal/blob/master/vendor/term.js#L226
HtmlOutput.prototype.colors = [
	// dark:
	"#2e3436",
	"#cc0000",
	"#4e9a06",
	"#c4a000",
	"#3465a4",
	"#75507b",
	"#06989a",
	"#d3d7cf",
	// bright:
	"#555753",
	"#ef2929",
	"#8ae234",
	"#fce94f",
	"#729fcf",
	"#ad7fa8",
	"#34e2e2",
	"#eeeeec"
];

// Taken from https://github.com/chjj/tty.js/blob/master/static/term.js#L250
// Colors 16-255
// Thanks to TooTallNate for writing this.
HtmlOutput.prototype.colors = (function() {
	function out(r, g, b) {
		colors.push("#" + hex(r) + hex(g) + hex(b));
	}

	function hex(c) {
		c = c.toString(16);
		return c.length < 2 ? "0" + c : c;
	}

	var colors = HtmlOutput.prototype.colors,
		r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff], i;

	// 16-231
	i = 0;
	for (; i < 216; i++) {
		out(r[(i / 36) % 6 | 0], r[(i / 6) % 6 | 0], r[i % 6]);
	}

	// 232-255 (grey)
	i = 0;
	for (; i < 24; i++) {
		r = 8 + i * 10;
		out(r, r, r);
	}

	return colors;
})();

HtmlOutput.prototype._mkCssProperties = function(attr) {
	if(!attr)
		return;
	var css = {};
	var p, html = "", inverse = !!attr.inverse;

	for(p in attr) {
		if(attr[p] === false || attr[p] === null)
			continue;
		switch(p) {
		case "fg":
			css[inverse ? "background" : "color"] = this.colors[attr[p]];
			break;
		case "bg":
			css[inverse ? "color" : "background"] = this.colors[attr[p]];
			break;
		case "bold":
			css["font-weight"] = "bold";
			break;
		case "italic":
			css["font-style"] = "italic";
			break;
		case "underline":
		case "blink":
			css["text-decoration"] = (css["text-decoration"] || "") + " " + p;
			break;
		case "doublewidth":
			css["-webkit-transform"] = (css["-webkit-transform"] || "") + " scaleX(2)";
			css["-moz-transform"] = (css["-moz-transform"] || "") + " scaleX(2)";
			if(!css["-moz-transform-origin"] && !css["-moz-transform-origin"])
				css["-moz-transform-origin"] = css["-webkit-transform-origin"] = "left";
			break;
		case "doubleheight":
			css["-webkit-transform"] = (css["-webkit-transform"] || "") + " scaleY(2)";
			css["-moz-transform"] = (css["-moz-transform"] || "") + " scaleY(2)";
			css["-moz-transform-origin"] =
			css["-webkit-transform-origin"] = "left " + attr[p];
			break;
		case "$cursor":
			css.background = this._opts.cursorBg;
			css.color = this._opts.cursorFg;
			break;
		case "$line":
			css.overflow = "hidden";
			break;
		}
	}
	for(p in css) {
		html += p + ":" + css[p] + ";";
	}
	return html;
};

var PATTERN_LT = /</g;
var PATTERN_GT = />/g;
var PATTERN_SPACE = / /g;
HtmlOutput.prototype.escapeHtml = function(str) {
	return str.replace(PATTERN_LT, "&lt;").
				replace(PATTERN_GT, "&gt;").
				replace(PATTERN_SPACE, "&nbsp;");
};

HtmlOutput.prototype._mkAttr = function(attr, extra, e) {
	var css = this._mkCssProperties(attr) +
		this._mkCssProperties(extra);
	if(e) {
		e.setAttribute("style", "white-space: nowrap;" + css);
	}
	return "style='" + css + "'";
};

HtmlOutput.prototype._renderLine = function(line, cursor) {
	var i, start;
	var html = "", attr;
	var str = line.str;

	if(line.attr[str.length].bg !== null)
		str += myUtil.repeat(" ", this.state.columns - str.length);
	else if(cursor !== undefined && cursor < this.state.columns)
		str += myUtil.repeat(" ", cursor + 1 - str.length);

	for(i = 0; i < str.length;) {
		start = i++;
		if(start in line.attr)
			attr = line.attr[start];
		if(cursor !== start)
			while(i < str.length && !(i in line.attr) && cursor !== i)
				i++;

		html += "</span><span " +
			this._mkAttr(attr, { $cursor: this.state.getMode("cursor") && cursor === start}) +
			">" + this.escapeHtml(str.substring(start, i));
	}
	return "<span>" + html + "</span><br />";
};

HtmlOutput.prototype.toString = function() {
	var i;

	var lines = "";
	for(i = 0; i < this.state.rows; i++) {
		var line = this.state.getLine(i);
		lines += "<div "+ this._mkAttr(line.attr, {$line:true}) + ">" +
			this._renderLine(line) + "</div>";
	}
	return lines + "<div style='line-height:0;visibility:hidden;'>" +
		this._genColumnsString() + "</div>";
};

HtmlOutput.prototype._genColumnsString = function() {
	return myUtil.repeat("&nbsp;",this.state.columns);
};

HtmlOutput.canHandle = function(target) {
	return target === "html";
};

},{"../util":24,"./base":13,"util":51}],16:[function(require,module,exports){
"use strict";

var inherits = require("util").inherits;

var dummy = function() {};

function LiveBaseOutput(state, writer, target, opts) {
	LiveBaseOutput.super_.apply(this, arguments);

	var i;
	this.target = target;
	this.writer = writer;
	this._views = [];
	this._oldViews = [];
	this._cursorView = null;
	var registerEvents = {
		lineremove: this._removeLine,
		linechange: this._changeLine,
		lineinsert: this._insertLine,
		ledchange: this._changeLed,
		cursormove: this._setCursor,
		resize: this._resize,
		bell: this._bell
	};
	this._cursorDrawnAt = null;

	var self = this;
	var reg = function(i) {
		state.on(i, function() {
			registerEvents[i].apply(self, arguments);
		});
	};
	for(i in registerEvents) {
		reg(i);
	}
	writer.on("ready", function() {
		self._commit();
	});
}
inherits(LiveBaseOutput, require("./base"));
module.exports = LiveBaseOutput;

LiveBaseOutput.prototype._updateCursor = function(action, number) {
	if(!this._opts.adhesiveCursor || this._cursorDrawnAt === null)
		return;
	switch(action) {
	case "insert":
		if(number <= this._cursorDrawnAt)
			this._cursorDrawnAt = Math.min(this._cursorDrawnAt + 1, this.state.rows - 1);
		break;
	case "change":
		if(number === this._cursorDrawnAt && number !== this.state.cursor.y)
			this._cursorDrawnAt = null;
		break;
	case "remove":
		if(number < this._cursorDrawnAt)
			this._cursorDrawnAt--;
		else if(number === this._cursorDrawnAt)
			this._cursorDrawnAt = null;
		break;
	}
};

LiveBaseOutput.prototype._removeLine = function(number) {
	var view = this._views.splice(number, 1)[0];
	this.removeLine(number, view);
	if(view)
		this._oldViews.push(view);

	this._updateCursor("remove", number);
};

LiveBaseOutput.prototype._changeLine = function(number, line, cursor) {
	var view = this.changeLine(number, this._views[number], line, cursor);
	if(view !== undefined)
		this._views[number] = view;
};

LiveBaseOutput.prototype._insertLine = function(number, line, cursor) {
	var view = this.insertLine(
		number,
		this._oldViews.shift() || this.createView(),
	line, cursor);
	this._views.splice(number, 0, view);

	this._updateCursor("insert", number);
};

LiveBaseOutput.prototype._changeLed = function() {
	this.changeLed.apply(this, arguments);
};

LiveBaseOutput.prototype._setCursor = function(x, y) {
	this._cursorView = this.setCursor(x, y);
};

LiveBaseOutput.prototype._resize = function(size) {
	this.resize(size);
};

LiveBaseOutput.prototype._commit = function() {
	var c = this.state.cursor;
	if(c.y !== this._cursorDrawnAt && this._cursorDrawnAt !== null) {
		this._changeLine(this._cursorDrawnAt, this.state.getLine(this._cursorDrawnAt));
	}

	if(c.y < this._views.length) {
		this._changeLine(c.y, this.state.getLine(c.y), c.x);
		this._cursorDrawnAt = c.y;
	}


	this.commit.apply(this, arguments);
};

LiveBaseOutput.prototype._bell = function() {
	this.bell.apply(this, arguments);
};


LiveBaseOutput.prototype.createView =
LiveBaseOutput.prototype.removeLine =
LiveBaseOutput.prototype.changeLine =
LiveBaseOutput.prototype.insertLine =
LiveBaseOutput.prototype.changeLed =
LiveBaseOutput.prototype.setCursor =
LiveBaseOutput.prototype.resize =
LiveBaseOutput.prototype.bell =
LiveBaseOutput.prototype.commit = dummy;

},{"./base":13,"util":51}],17:[function(require,module,exports){
"use strict";

var inherits = require("util").inherits;
var myUtil = require("../util");

function PlainOutput(state, opts) {
	PlainOutput.super_.apply(this, arguments);
}
inherits(PlainOutput, require("./base.js"));
module.exports = PlainOutput;

PlainOutput.prototype.toString = function() {
	var lines = "";
	var locateCursor = this._opts.locateCursor;

	if(locateCursor)
		lines += myUtil.repeat(" ", this.state.cursor.x+1) + "v\n";

	for(var i = 0; i < this.state.rows; i++) {
		var line = this.state.getLine(i);
		if(locateCursor) {
			lines += i === this.state.cursor.y ? ">" : " ";
		}
		lines += line.str + "\n";
	}
	if(locateCursor)
		lines += myUtil.repeat(" ", this.state.cursor.x+1) + "^\n";

	return lines;
};

PlainOutput.canHandle = function(target) {
	return target === "plain";
};

},{"../util":24,"./base.js":13,"util":51}],18:[function(require,module,exports){
"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;
var AnsiOutput = require("./ansi.js");

function TtyOutput(state, writer, target, opts) {
	this.ansi = new AnsiOutput(state, opts);
	if(target.stdout)
		target = target.stdout;
	target.write("\x1b[3J\x1b[H\x1b[?25l");
	TtyOutput.super_.call(this, state, writer, target, opts);
	this._opts.adhesiveCursor = true;
}
inherits(TtyOutput, require("./live_base.js"));
module.exports = TtyOutput;

TtyOutput.prototype.removeLine = function(number, view) {
	this.target.write("\x1b["+(number+1)+";1H\x1b[M");
	return null;
};
TtyOutput.prototype.changeLine = function(number, view, line, cursor) {
	this.target.write("\x1b["+(number+1)+";1H" +
		this.ansi._renderLine(line, cursor));
	return null;
};
TtyOutput.prototype.insertLine = function(number, view, line, cursor) {
	this.target.write("\x1b["+(number+1)+";1H\x1b[L");
	this.changeLine.apply(this, arguments);
	return null;
};
TtyOutput.prototype.changeLed = function(l1, l2, l3, l4) {

};
TtyOutput.prototype.setCursor = function(x, y) {
};
TtyOutput.prototype.resize = function(size) {
	// TODO
};
TtyOutput.prototype.commit = function() {

};

TtyOutput.canHandle = function(target) {
	if(target.stdout)
		target = target.stdout;
	return typeof target === "object" && "read" in target && "on" in target && target.isTTY;
};

},{"../util":24,"./ansi.js":12,"./live_base.js":16,"util":51}],19:[function(require,module,exports){
"use strict";

var myUtil = require("../util.js");

function BaseSource(writer, source) {
	var opts = arguments[Math.max(1, arguments.length - 1)];
	this.writer = writer;
	this.source = source;
	this._opts = myUtil.extend({}, this._defOpts, opts);
}
module.exports = BaseSource;

},{"../util.js":24}],20:[function(require,module,exports){
"use strict";

var myUtil = require("../util");
var inherits = require("util").inherits;
function genCall(name) {
	return function() {
		if(typeof this.source[name] === "function")
			return this.source[name].apply(this.source, arguments);
		else {
			Array.prototype.unshift.call(arguments, name);
			return this.source.emit.apply(this.source, arguments);
		}
	};
}

function EmitterSource(writer, source, opts) {
	EmitterSource.super_.apply(this, arguments);

	this._register();
}
inherits(EmitterSource, require("./base"));
module.exports = EmitterSource;

EmitterSource.prototype._register = function() {
	var self = this;
	var writer = this.writer;

	this.source
		.on("data", function(data) {
			writer.write(data);
		})
		.on("exit", function() {
			writer.end();
		});
};


EmitterSource.prototype.write = genCall("write");
EmitterSource.prototype.end = genCall("end");
EmitterSource.prototype._resize = genCall("resize");
EmitterSource.prototype.kill = genCall("kill");
EmitterSource.prototype.resize = function(size) {
	return this._resize(size);
};

EmitterSource.canHandle = function(source) {
	return source && typeof source.addListener === "function" &&
		typeof source.on === "function";
};

},{"../util":24,"./base":19,"util":51}],21:[function(require,module,exports){
"use strict";

var myUtil = require("./util.js");

function getChanged(oldObj, newObj) {
	var result = {};
	var i;
	if(newObj instanceof Array) {
		for(i = 0; i < newObj.length || i < oldObj.length; i++) {
			if(newObj[i] !== oldObj[i])
				result[i] = newObj[i];
		}
	}
	else {
		for(i in newObj) {
			if(newObj[i] !== oldObj[i])
				result[i] = newObj[i];
		}
	}
	return result;
}

function TermDiff(oldState, newState) {
	this._changes = [];
	this._cursor = null;
	this._scrollRegion = null;
	this._savedCursor = null;
	this._modes = null;
	this._leds = null;
	this._size = null;
	this._tabs = null;
	this._columns = null;
	this._rows = null;

	if(typeof oldState === "object" && oldState.getLine) {
		this.oldState = oldState;
		this.newState = newState;

		this._mkDiff(oldState, newState);
		this._mkCursor(oldState, newState);
		this._mkScrollRegion(oldState, newState);
		this._mkModes(oldState, newState);
		this._mkLeds(oldState, newState);
		this._mkSize(oldState, newState);
		this._mkTabs(oldState, newState);
	}
	else if(typeof oldState === "string") {
		var json = JSON.parse(oldState);
		this._loadJson(json);
	}
	else {
		this._loadJson(oldState);
	}
}
module.exports = TermDiff;

TermDiff.prototype._mkCursor = function(oldState, newState){
	var cursor = {cursor:"_cursor", _savedCursor:"_savedCursor"};
	for(var k in cursor) {
		if(oldState[k].x !== newState[k].x || oldState[k].y !== newState[k].y)
			this[cursor[k]] = myUtil.extend({}, newState[k]);
	}
};

TermDiff.prototype._mkScrollRegion = function(oldState, newState){
	this._scrollRegion = newState._scrollRegion.slice();
};

TermDiff.prototype._mkModes = function(oldState, newState){
	this._modes = getChanged(oldState._modes, newState._modes);
};

TermDiff.prototype._mkLeds = function(oldState, newState){
	this._leds = getChanged(oldState._leds, newState._leds);
};

TermDiff.prototype._mkSize = function(oldState, newState){
	if(oldState.columns !== newState.columns || oldState.rows !== newState.rows) {
		this._rows = newState.rows;
		this._columns = newState.columns;
	}
};

TermDiff.prototype._mkTabs = function(oldState, newState){
	this._tabs = newState._tabs.slice();
};


TermDiff.prototype._getChange = function(line) {
	var l = {l: line};
	for(var i = this._changes.length - 1; i >= 0; i--) {
		if(this._changes[i].l === line)
			return this._changes[i];
		else if(this._changes[i].l < line) {
			this._changes.splice(i+1, 0, l);
			return l;
		}
	}
	this._changes.unshift(l);
	return l;
};

TermDiff.prototype._cmpLines = function(line1, line2) {
	var a, p;
	if(line1 === line2)
		return true;
	else if(line1 === undefined || line2 === undefined)
		return false;
	else if(line1.str !== line2.str)
		return false;

	for(a in line1.attr) {
		for(p in line1.attr[a]) {
			if(line1.attr[p] !== line2.attr[p])
				return false;
		}
	}

	for(a in line2.attr) {
		for(p in line2.attr[a]) {
			if(line1.attr[p] !== line2.attr[p])
				return false;
		}
	}

	return true;
};

TermDiff.prototype._mkDiff = function(oldState, newState) {
	var m = Math.max(1, oldState.getBufferRowCount()),
	n = Math.max(1, newState.getBufferRowCount());

	var left = -1, up = -m, diag = left + up;
	var seq = new Array(m * n);
	var dir = seq.slice(0);
	var i,j,k,l, toJ, toK;

	var tmp = "";
	for(i = 0; i < seq.length; i++) {
		j = i % m;
		k = ~~(i / m); // Cast to int
		var hasDiffs = this._cmpLines(oldState.getLine(j), newState.getLine(k));
		if(hasDiffs)
			dir[i] = diag;
		else if(seq[i + left] <= seq[i + up])
			dir[i] = up;
		else
			dir[i] = left;
		seq[i] = ~~(diag === dir[i]) + ~~(j === 0 ? 0 : seq[i + dir[i]]);
	}

	k = n-1;
	j = m-1;
	for(i = seq.length - 1; i >= 0; j--, k--, i+=dir[i]) {
		// Goto next common line
		for(; !isNaN(i) && dir[i] !== diag; i += dir[i]);

		toJ = i % m;
		toK = ~~(i / m); // Cast to int
		if(isNaN(i))
			toJ = toK = -1;

		// changed or inserted
		for(; k > toK; j = Math.max(j-1, toJ), k--) {
			this._getChange(k)[j > toJ ? "." : "+"] = newState.getLine(k);
		}

		// line is in old, but not in new
		for(; j > toJ; j--) {
			l = this._getChange(toK+1);
			l["-"] = (l["-"] || 0) + 1;
		}

		if(j === 0 && (dir[i] === diag || dir[i] === left))
			dir[i] = up;
	}
};

TermDiff.prototype.toJSON = function() {
	return {
		changes: this._changes,
		cursor: this._cursor,
		savedCursor: this._savedCursor,
		leds: this._leds,
		modes: this._modes,
		size: this._size,
		tabs: this._tabs,
		scrollRegion: this._scrollRegion
	};
};

TermDiff.prototype.toString = function() {
	var i,j;
	var result = [];
	var lastline = 0;
	var oldNbr = this._changes[0] ? this._changes[0].l : 0;
	for(i = 0; i < this._changes.length; i++, lastline++, oldNbr++) {
		for(; lastline < this._changes[i].l; lastline++, oldNbr++) {
			result.push(" " + this.newState.getLine(lastline).str);
		}
		for(j = 0; j < this._changes[i]["-"]; j++) {
			result.push("-" + this.oldState.getLine(oldNbr).str);
		}
		if(this._changes[i]["+"]) {
			result.push("+" + this._changes[i]["+"].str);
			oldNbr--;
		}
		if(this._changes[i]["."]) {
			result.push("." + this._changes[i]["."].str);
		}
	}
	return result.join("\n");
};

TermDiff.prototype._loadJson = function(diff) {
	this._cursor = diff.cursor;
	this._savedCursor = diff.savedCursor;
	this._scrollRegion = diff.scrollRegion;
	this._modes = diff.modes;
	this._leds = diff.leds;
	this._rows = diff.rows;
	this._columns = diff.columns;
	this._changes = diff.changes;
	this._tabs = diff.tabs;
};

TermDiff.prototype.apply = function(diff) {
	if(this._columns || this._rows) this._applySize(diff);
	if(this._cursor) this._applyCursor(diff);
	if(this._scrollRegion) this._applyScrollRegion(diff);
	if(this._leds) this._applyLeds(diff);
	if(this._tabs) this._applyTabs(diff);
	if(this._savedCursor)this._applySavedCursor(diff);
	if(this._modes) this._applyModes(diff);
	if(this._changes) this._applyChanges(diff);
};

TermDiff.prototype._applySize = function(t) {
	t.resize({columns: this._columns, rows: this._rows });
};

TermDiff.prototype._applyCursor = function(t) {
	t.setCursor(this._cursor.x, this._cursor.y);
};

TermDiff.prototype._applyScrollRegion = function(t) {
	t.setScrollRegion(this._scrollRegion[0], this._scrollRegion[1]);
};

TermDiff.prototype._applyLeds = function(t) {
	for(var k in this._leds)
		t.setLed(k, this._leds[k]);
};

TermDiff.prototype._applySavedCursor = function(t) {
	t._savedCursor.x = this._savedCursor.x;
	t._savedCursor.y = this._savedCursor.y;
};

TermDiff.prototype._applyTabs = function(t) {
	t.tabs = this._tabs.splice(0);
};

TermDiff.prototype._applyModes = function(t) {
	for (var m in this._modes) {
		t.setMode(m,this._modes[m]);
	}
};

TermDiff.prototype._applyChanges = function(t) {
	for(var i = 0; i < this._changes.length; i++) {
		var c = this._changes[i];
		if (c["-"])
			t._removeLine(c.l, c["-"]); // removing lines

		if (c["+"])
			t._insertLine(c.l, c["+"]); // adding lines
		else if (c["."])
			t.setLine(c.l, c["."]); // replacing lines
	}
};

},{"./util.js":24}],22:[function(require,module,exports){
"use strict";

var myUtil = require("./util.js");
var inherits = require("util").inherits;

/**
* map of graphical character aliases
* @enum
* @private
*/
var graphics = {
        "`": "\u25C6",
        "a": "\u2592",
        "b": "\u2409",
        "c": "\u240C",
        "d": "\u240D",
        "e": "\u240A",
        "f": "\u00B0",
        "g": "\u00B1",
        "h": "\u2424",
        "i": "\u240B",
        "j": "\u2518",
        "k": "\u2510",
        "l": "\u250C",
        "m": "\u2514",
        "n": "\u253C",
        "o": "\u23BA",
        "p": "\u23BB",
        "q": "\u2500",
        "r": "\u23BC",
        "s": "\u23BD",
        "t": "\u251C",
        "u": "\u2524",
        "v": "\u2534",
        "w": "\u252C",
        "x": "\u2502",
        "y": "\u2264",
        "z": "\u2265",
        "{": "\u03C0",
        "|": "\u2260",
        "}": "\u00A3",
        "~": "\u00B7"
};

/**
* Creates setter for a specific property used on attributes, modes, and meta
* properties
* @private
*/
function setterFor(objName) {
	return function(name, value) {
		if("_"+objName+"sCow" in this) {
			if(this["_"+objName+"sCow"] === true)
				this["_"+objName+"s"] = myUtil.extend({}, this["_"+objName+"s"]);
			this["_"+objName+"sCow"] = false;
		}
		var obj = this["_"+objName+"s"];

		if(!(name in obj))
			throw new Error("Unknown "+objName+" `"+name+"`");
		this.emit(objName+"change", name, value, obj[name]);
		obj[name] = value;
	};
}

/**
* A class which holds the terminals state and content
* @param {number} columns - number of columns in the terminal
* @param {number} rows - number of rows in the terminal
* @param {object} attributes - initial attributes of the terminal
* @param {string} [attributes.fg=null] initial foreground color
* @param {string} [attributes.bg=null] initial background color
* @param {boolean} [attributes.bold=false] terminal is bold by default
* @param {boolean} [attributes.underline=false] terminal is underlined by default
* @param {boolean} [attributes.italic=false] terminal is italic by default
* @param {boolean} [attributes.blink=false] terminal blinks by default
* @param {boolean} [attributes.inverse=false] terminal has reverse colors by default
* @constructor
*/
function TermState(options) {
	TermState.super_.call(this, {
		decodeStrings: false
	});
	options = myUtil.extend({
		attributes: {},
	}, options);
	this._defaultAttr = myUtil.extend({
		fg: null,
		bg: null,
		bold: false,
		underline: false,
		italic: false,
		blink: false,
		inverse: false
	}, options.attributes);
	this._attributesCow = true;

	this.rows = ~~options.rows || 24;
	this.columns = ~~options.columns || 80;

	this
		.on("newListener", this._newListener)
		.on("removeListener", this._removeListener)
		.on("pipe", this._pipe);
	// Reset all on first use
	this.reset();
}
inherits(TermState, require("stream").Writable);
module.exports = TermState;

/**
* emits resize on the reader of this class
* @param {ReadableStream} a Readable Stream
* @private
*/
TermState.prototype._pipe = function(src) {
	var onresize = src.emit.bind(src, "resize");
	this.on("resize", onresize)
		.on("unpipe", function(src) {
			src.removeListener(onresize);
		});
};

/**
* tells a new listener the terminals state when it is registered
* @param {string} ev - event name
* @param {function} cb - the listening function
* @private
*/
TermState.prototype._newListener = function(ev, cb) {
	var i;
	switch(ev) {
		case "lineinsert":
			for(i = 0; i < this.getBufferRowCount(); i++)
				cb.call(this, i, this.getLine(i));
			break;
		case "resize":
			cb.call(this, { columns: this.columns, rows: this.rows });
			break;
		case "cursormove":
			cb.call(this, this.cursor.x, this.cursor.y);
			break;
	}
};

/**
* cleans up listener when it is removed from the terminal state
* @param {string} ev - event name
* @param {function} cb - the listening function
* @private
*/
TermState.prototype._removeListener = function(ev, cb) {
	var i;
	if(ev === "lineremove") {
		for(i = 0; i < this.getBufferRowCount(); i++)
			cb.call(this, 0, this.getLine(i));
	}
};

/**
* resets the terminals state.
*/
TermState.prototype.reset = function() {
	if(this._buffer)
		this._removeLine(0, this.getBufferRowCount());
	this._buffer = this._defBuffer = {
		str: [], attr: []
	};
	this._altBuffer = {
		str: [], attr: []
	};
	this._scrollback = {
		str: [], attr: []
	};
	this._modes = {
		cursor: true,
		cursorBlink: false,
		appKeypad: false,
		wrap: true,
		insert: false,
		crlf: false,
		mousebtn: false,
		mousemtn: false,
		reverse: false,
		graphic: false
	};
	this._metas = {
		title: "",
		icon: ""
	};
	this.resetAttribute();
	this.cursor = {x:0,y:0};
	this._savedCursor = {x:0,y:0};
	this._scrollRegion = [0, this.rows-1];
	this.resetLeds();
	this._tabs = [];

	this._lineAttr = {
		doubletop: false,
		doublebottom: false,
		doublewidth: false
	};

};

/**
* creates a new line in the buffer
* @param [line] - build line upon this value
* @private
*/
TermState.prototype._createLine = function(line) {
	if(line === undefined || typeof line !== "object") {
		line = line ? line.toString() : "";
		line = { str: line, attr: {0: this._defaultAttr} };
	}
	else if(!line || typeof line.str !== "string" || typeof line.attr !== "object")
		throw new Error("line objects must contain attr and str" + line);

	for(var i in line.attr) {
		if(+i > line.str.length || line.attr[i] === undefined)
			delete line.attr[i];
	}
	return line;
};

/**
* @deprecated since 0.2
* @see write
*/
TermState.prototype.inject = function(str) {
	console.warn("inject() is deprecated. use write() instead.");
	this.write(str);
};

/**
* Takes a chunk of data and puts it in the buffer
* @alias TermState.prototype.write
* @see http://nodejs.org/docs/latest/api/stream.html#stream_writable_write_chunk_encoding_callback
*/
TermState.prototype._write = function(chunk, encoding, callback) {
	var i, j, line;
	var lines = chunk.split("\n");
	var wrapped;
	var c = this.cursor, cx;

	for(i = 0; i < lines.length; i++) {
		wrapped = false;
		// Handle long lines
		if(lines[i].length > this.columns - c.x) {
			if(c.x >= this.columns)
				c.x = this.columns - 1;
			if(this._modes.wrap) {
				lines.splice(i, 1,
					lines[i].substr(0, this.columns - c.x),
					lines[i].substr(this.columns - c.x)
				);
				wrapped = true;
			}
			else {
				lines[i] = lines[i].substr(0, this.columns - c.x - 1) +
					lines[i].substr(-1);
			}
		}

		// write line
		this._lineInject(lines[i]);

		if(i + 1 !== lines.length) {
			c.y++;
			if(this._modes.crlf || wrapped)
				c.x = 0;

			if(c.y > this._scrollRegion[1]) {
				c.y--;
				this._removeLine(this._scrollRegion[0]);
				this._insertLine(this._scrollRegion[1]);
			}
		}
	}
	this.setCursor();
	return callback();
};

/**
* converts graphics from ascii to utf8 characters when in graphics mode.
* @private
*/
TermState.prototype._graphConvert = function(content) {
	var result = "", i;
	if(this._modes.graphic) {
		for(i = 0; i < content.length; i++) {
			result += (content[i] in graphics) ?
				graphics[content[i]] :
				content[i];
		}
		return result;
	} else  {
		return content;
	}
};

/**
* injects a single line into the buffer.
* @see _write
* @private
*/
TermState.prototype._lineInject = function(content) {
	var c = this.cursor;
	var line = this.getLine();
	var args;
	if(this._modes.insert) {
		args = new Array(content.length);
		args.unshift(line.attr, line.str.length+1, c.x, 0);
		myUtil.objSplice.apply(0, args);
		line.str = line.str.substr(0, c.x) + myUtil.repeat(" ",c.x - line.str.length) +
			this._graphConvert(content) + line.str.substr(c.x);
		line.str = line.str.substr(0, this.columns);
	}
	else {
		line.str = line.str.substr(0, c.x) +
			myUtil.repeat(" ", c.x - line.str.length) +
			this._graphConvert(content) + line.str.substr(c.x + content.length);
	}

	this._applyAttributes(line, c.x, content.length);
	this.setLine(line);

	c.x += content.length;
};

/**
* removes characters at cursor position.
* @params {number} count - number of characters to be removed
*/
TermState.prototype.removeChar = function(count) {
	var c = this.cursor, line = this.getLine(c.y);
	var last = line.attr[line.str.length];
	myUtil.objSplice(line.attr, line.str.length+1, c.x, count);
	line.str = line.str.substr(0, c.x) + line.str.substr(c.x+count);
	line.attr[line.str.length] = last;
	this.setLine(c.y, line);
};

/**
* inserts whitespaces at cursor position
* @params {number} count - number of whitespaces to be inserted
*/
TermState.prototype.insertBlank = function(count) {
	var c = this.cursor, line = this.getLine(c.y);
	var last = line.attr[line.str.length];
	// TODO: unify this into one objSplice call.
	myUtil.objSplice(line.attr, line.str.length+1, c.x, 0, new Array(count));
	myUtil.objSplice(line.attr, line.str.length+1, this.columns);
	line.str = line.str.substr(0, c.x) +
		myUtil.repeat(" ", count) + line.str.substr(c.x);
	line.str = line.str.substr(0, this.columns);
	line.attr[line.str.length] = last;
	this.setLine(c.y, line);
};

/**
* removes lines at cursor position.
* @params {number} count - number of lines to be removed
*/
TermState.prototype.removeLine = function(count) {
	this._removeLine(this.cursor.y, +count);
	if(this._scrollRegion[1] !== this.rows-1 && this.cursor.y <= this._scrollRegion[1])
		this._insertLine(this._scrollRegion[1] + 1 - count, +count);
};

/**
* removes lines at given position
* @params {number} line - line number to start removing
* @params {number} count - number of lines to be removed
* @private
*/
TermState.prototype._removeLine = function(line, count) {
	var i, str, attr;
	if(count === undefined)
		count = 1;
	str = this._buffer.str.splice(line, count);
	this._scrollback.str.push.call(this._scrollback, str);
	attr = this._buffer.attr.splice(line, count);
	this._scrollback.attr.push.call(this._scrollback, attr);
	for(i = 0; i < str.length; i++)
		this.emit("lineremove", line, {str: str[i], attr: attr[i] });
	return count;
};

/**
* sets the line to a value and emits "linechanged" event
* @params {number} nbr - line number to set
* @params {object} line - line content to set
*/
TermState.prototype.setLine = function(nbr, line) {
	if(typeof nbr === "object" && line === undefined) {
		line = nbr;
		nbr = this.cursor.y;
	}
	line = this._createLine(line);
	if(this._buffer.str.length <= nbr) {
		this._insertLine(nbr, line);
	}
	else {
		if(line.str.length > this.columns)
			line.attr[this.columns] = line.attr[line.str.length];
		this._buffer.str[nbr] = line.str.substr(0, this.columns);
		this._buffer.attr[nbr] = line.attr;
		this.emit("linechange", nbr, line);
	}
};

/**
* inserts lines at cursor position
* @params {number} count - number of lines to insert
*/
TermState.prototype.insertLine = function(count) {
	this._insertLine(this.cursor.y, +count);
};

/**
* inserts lines at given position
* @params {number} line - line number to start inserting
* @params {number} count - number of lines to be inserted
* @private
*/
TermState.prototype._insertLine = function(nbr, line) {
	var h = this.getBufferRowCount();
	var start = Math.min(h, nbr);
	var end = nbr + 1;
	var i;
	if(typeof line === "number") {
		end = nbr + line;
		line = undefined;
	}

	for(i = start; i < end; i++) {
		if(this.rows === this.getBufferRowCount())
			this._removeLine(this._scrollRegion[1], 1);
		line = this._createLine(line);
		this._buffer.str.splice(start, 0, line.str);
		this._buffer.attr.splice(start, 0, line.attr);
		this.emit("lineinsert", start, line);
		line = undefined;
	}
};

/**
* TODO
* @private
*/
TermState.prototype._applyAttributes = function(line, index, len) {
	var i, prev;

	for(i = index+len; i > 0 && line.attr[i] === undefined; i--);
	prev = line.attr[i];
	for(i = index; i < index+len; i++)
		delete line.attr[i];

	line.attr[index] = this._attributes;
	if(index + len <= this.columns)
		line.attr[index + len] = prev;

	this._attributesCow = true;
	return this;
};

/**
* sets cursor to a specific position
* @param {number} x - column of cursor starting at 0
* @param {number} y - row of cursor starting at 0
*/
TermState.prototype.setCursor = function(x, y) {
	var c = this.cursor, line;

	if(typeof x !== "number")
		x = c.x;
	if(typeof y !== "number")
		y = c.y;

	if(x < 0)
		x = 0;
	else if(x > this.columns)
		x = this.columns;

	if(y < 0)
		y = 0;
	else if(y >= this.rows)
		y = this.rows - 1;

	if(c.x !== x || c.y !== y || arguments.length === 0) {
		c.x = x;
		c.y = y;

		this.emit("cursormove", x, y);
	}

	return this;
};

/**
* resizes terminal to a specific dimension
* @param {object} size - new size of the terminal
*/
TermState.prototype.resize = function(size) {
	var line;
	this._removeLine(0, Math.max(0, this.rows - size.rows));

	this.rows = ~~size.rows;
	this.columns = ~~size.columns;

	for(var i = 0; i < this._buffer.str.length; i++)
		this.setLine(i, this.getLine(i));

	this.setScrollRegion(0, this.rows-1);

	this.emit("resize", {rows: this.rows, columns: this.columns});

	this.setCursor();
	return this;
};

/**
* moves cursor relative
* @param {number} x - relative horizontal movement
* @param {number} y - relative vertical movement
*/
TermState.prototype.mvCursor = function(x, y) {
	if(x || y)
		this.setCursor(this.cursor.x + x, this.cursor.y + y);
	return this;
};

/**
* scrolls the scroll area of a buffer
* @param {number} scroll - number of lines to be scrolled (positive: up; negative: down)
*/
TermState.prototype.scroll = function(scroll) {
	var i;
	var count = Math.min(Math.abs(scroll), this._scrollRegion[1] - this._scrollRegion[0]);

	if(scroll > 0) {
		this._removeLine(this._scrollRegion[0], count);
		for(i = 0; i < count; i++) {
			this._insertLine(this._scrollRegion[1] +1  - count);
		}
	}
	else {
		this._removeLine(this._scrollRegion[1] +1 -count, count);
		for(i = 0; i < count; i++) {
			this._insertLine(this._scrollRegion[0]);
		}
	}
};

/**
* returns plain text representation of the buffer
*/
TermState.prototype.toString = function() {
	return this._buffer.str.join("\n");
};

/**
* moves cursor to previous line or scrolls up if at top
*/
TermState.prototype.prevLine = function() {
		if(this.cursor.y === this._scrollRegion[0])
			this.scroll(-1);
		else
			this.mvCursor(0, -1);
		return this;
};

/**
* moves cursor to next line or scrolls down if at bottom
*/
TermState.prototype.nextLine = function() {
		if(this.cursor.y === this._scrollRegion[1])
			this.scroll(1);
		else
			this.mvCursor(0, 1);
		return this;
};

/**
* resets the attributes
*/
TermState.prototype.resetAttribute = function(name) {
	if(name)
		this.setAttribute(name, this._defaultAttr[name]);
	else {
		this._attributesCow = true;
		this._attributes = this._defaultAttr;
	}
	return this;
};

/**
* saves cursor position
*/
TermState.prototype.saveCursor = function() {
	this._savedCursor.x = this.cursor.x;
	this._savedCursor.y = this.cursor.y;
	return this;
};

/**
* restore previously saved cursor position
*/
TermState.prototype.restoreCursor = function() {
	return this.setCursor(this._savedCursor.x, this._savedCursor.y);
};

/**
* truncate characters from buffer at cursor position.
* @param {number} count number of characters to truncate
*/
TermState.prototype.eraseCharacters = function(count) {
	var c = this.cursor, line = this.getLine(c.y);

	line.str = line.str.substr(0, c.x) + myUtil.repeat(" ", count) +
		line.str.substr(c.x + count);
	line.str = line.str.substr(0, this.columns);
	this._applyAttributes(line, c.x, count);
	this.setLine(c.y, line);
};

/**
* cleans lines
* @param n can be one of the following:
* <ul>
* 	<li>0 or "after": cleans below and after cursor</li>
* 	<li>1 or "before": cleans above and before cursor</li>
* 	<li>2 or "all": cleans entire screen</li>
* </ul>
*/
TermState.prototype.eraseInDisplay = function(n) {
	var c = this.cursor, i, line, self = this;
	var chLine = function() {
		line = self._createLine();
		self._applyAttributes(line, 0, self.columns);
		self.setLine(i, line);
	};
	switch(n || 0) {
		case "below":
		case "after":
		case 0:
			n = 0;
			for(i = c.y+1; i < this.rows; i++)
				chLine();
			break;
		case "above":
		case "before":
		case 1:
			n = 1;
			for(i = 0; i < c.y-1; i++)
				chLine();
			break;
		case "all":
		case 2:
			for(i = 0; i < this.rows; i++)
				chLine();
			return this;
	}
	return this.eraseInLine(n);
};

/**
* cleans one line
* @param n can be one of the following:
* <ul>
* 	<li>0 or "after": cleans from the cursor to the end of the line</li>
* 	<li>1 or "before": cleans from the start of the line to the cursor</li>
* 	<li>2 or "all": cleans entire screen</li>
* </ul>
*/
TermState.prototype.eraseInLine = function(n) {
	var c = this.cursor;
	var line = this.getLine();
	switch(n || 0) {
		case "after":
		case 0:
			line.str = line.str.substr(0, c.x);
			this._applyAttributes(line, c.x, this.columns);
			break;
		case "before":
		case 1:
			line.str = myUtil.repeat(" ",c.x) + line.str.substr(c.x);
			this._applyAttributes(line, 0, c.x);
			break;
		case "all":
		case 2:
			line = this._createLine();
			break;
	}
	this.setLine(c.y, line);
	return this;
};

/**
* sets scroll region
*/
TermState.prototype.setScrollRegion = function(n, m) {
	this._scrollRegion[0] = +n;
	this._scrollRegion[1] = +m;
	return this;
};

/**
* switches between default and alternative buffer
* @param alt {boolean} true for switch to alternative buffer, false for default
* buffer
*/
TermState.prototype.switchBuffer = function(alt) {
	var i;
	var active, inactive;
	if(alt) {
		active = this._altBuffer;
		inactive = this._defBuffer;
	}
	else {
		active = this._defBuffer;
		inactive = this._altBuffer;
	}
	if(active === this._buffer)
		return;

	for(i = active.str.length; i < inactive.str.length; i++)
		this.emit("lineremove", active.str.length, this.getLine(i));

	this._buffer = active;

	for(i = 0; i < active.str.length && i < inactive.str.length; i++)
		this.emit("linechange", active.str.length, this.getLine(i));

	for(; i < active.str.length; i++)
		this.emit("lineinsert", i, this.getLine(i));
	return this;
};

/**
* enables a LED
* @param led {number} LED 0 - 3
*/
TermState.prototype.ledOn = function(led) {
	this.setLed(led, true);
	return this;
};

/**
* enables a LED
* @param led {number} LED 0 - 3
* @param value {boolean} sets LED to value
*/
TermState.prototype.setLed = function(led, value) {
	if (led < this._leds.length) { // we only have 4 leds (0,1,2,3)
		this._leds[led] = !!value;
		this.emit("ledchange", Array.apply(null, this._leds));
	}
	return this;
};

/**
* disables all LEDs
*/
TermState.prototype.resetLeds = function() {
	this._leds = [!!0,!!0,!!0,!!0];
	this.emit("ledchange", Array.apply(null, this._leds));
	return this;
};

/**
* gets the internal buffer row count. Will be lesser equal than actual number of
* rows
*/
TermState.prototype.getBufferRowCount = function() {
	return this._buffer.str.length;
};

/**
* gets the current value of an LED
* @param led {number} LED 0 - 3
* @returns true if LED is enabled, false otherwise
*/
TermState.prototype.getLed = function(n) {
	return this._leds[n];
};

/**
* gets the line definition
* @param n {number} - line number starting at 0
* @returns line definition
*/
TermState.prototype.getLine = function(n) {
	if(n === undefined)
		n = this.cursor.y;

	if(this._buffer.str[n])
		return {
			str: this._buffer.str[n],
			attr: this._buffer.attr[n]
		};
	else
		return this._createLine();
};

/**
* returns the current value of a given mode
* @param n {string} - mode
*/
TermState.prototype.getMode = function(n) {
	return this._modes[n];
};


/**
* moves Cursor forward or backward a specified amount of tabs
* @param n {number} - number of tabs to move. <0 moves backward, >0 moves
* forward
*/
TermState.prototype.mvTab = function(n) {
	var x = this.cursor.x;
	var tabMax = this._tabs[this._tabs.length - 1] || 0;
	var positive = n > 0;
	n = Math.abs(n);
	while(n !== 0 && x > 0 && x < this.columns-1) {
		x += positive ? 1 : -1;
		if(~myUtil.indexOf(this._tabs, x) || (x > tabMax && x % 8 === 0))
			n--;
	}
	this.setCursor(x);
};

/**
* set tab at specified position
* @param pos {number} - position to set a tab at
*/
TermState.prototype.setTab = function(pos) {
	// Set the default to current cursor if no tab position is specified
	if(pos === undefined) {
		pos = this.cursor.x;
	}
	// Only add the tab position if it is not there already
	if (~myUtil.indexOf(this._tabs, pos)) {
		this._tabs.push(pos);
		this._tabs.sort();
	}
};

/**
* remove a tab
* @param pos {number} - position to remove a tab. Do nothing if the tab isn't
* set at this position
*/
TermState.prototype.removeTab = function(pos) {
	var i, tabs = this._tabs;
	for(i = 0; i < tabs.length && tabs[i] !== pos; i++);
	tabs.splice(i, 1);
};

/**
* removes a tab at a given index
* @params n {number} - can be one of the following
* <ul>
* 	<li>"current" or 0: searches tab at current position. no tab is at current
* 	position delete the next tab</li>
* 	<li>"all" or 3: deletes all tabs</li>
*/
TermState.prototype.tabClear = function(n) {
	switch(n || "current") {
		case "current":
		case 0:
			for(var i = this._tabs.length - 1; i >= 0; i--) {
				if(this._tabs[i] < this.cursor.x) {
					this._tabs.splice(i, 1);
					break;
				}
			}
			break;
		case "all":
		case 3:
			this._tabs = [];
			break;
	}
};

/**
* sets a given Attribute
*/
TermState.prototype.setAttribute = setterFor("attribute");
/**
* sets a given Mode
*/
TermState.prototype.setMode = setterFor("mode");
/**
* sets a given Meta date
*/
TermState.prototype.setMeta = setterFor("meta");

},{"./util.js":24,"stream":47,"util":51}],23:[function(require,module,exports){
"use strict";

var inherits = require("util").inherits;
var myUtil = require("./util");
var TermState = require("./term_state.js");
var DomOutput = require("./output/dom.js");
var DomInput = require("./input/dom.js");

var outputs = {
	plain: require("./output/plain.js"),
	html: require("./output/html.js"),
	ansi: require("./output/ansi.js")
};


var CSI_PATTERN = /^\x1b\[([?!>]?)([0-9;]*)([@A-Za-z`]?)/;
var DCS_PATTERN = /^\x1bP([0-9;@A-Za-z`]*)\x1b\\/;
var OSC_PATTERN = /^\x1b\]([0-9]*);([^\x07]*)(\x07?)/;

/**
* Terminal is the glue between a TerminalState and the escape sequence
* interpreters.
* @constructor
*/
function Terminal(options) {
	Terminal.super_.call(this, { decodeStrings: false });

	this.options = myUtil.extend({
		columns: 80,
		rows: 24,
		attributes: {}
	}, options || {});
	this.rows = ~~this.rows;
	this.columns = ~~this.columns;
	this.state = new TermState(this.options);
	this.oldChunk = null;
	this.on("pipe", this._pipe);
}
inherits(Terminal, require("stream").Writable);
module.exports = Terminal;

Terminal.prototype.handlers = {
	chr: require("./handler/chr.js"),
	esc: require("./handler/esc.js"),
	csi: require("./handler/csi.js"),
	sgr: require("./handler/sgr.js"),
	dcs: require("./handler/dcs.js"),
	mode: require("./handler/mode.js"),
	osc: require("./handler/osc.js"),
};

/**
* emits resize on the reader of this class
* @param {ReadableStream} a Readable Stream
* @private
*/
Terminal.prototype._pipe = function(src) {
	var onresize = function(size) {
		if(typeof src.resize === "function") // assume it"s a pty.js-object
			src.resize(size.columns, size.rows);
		src.emit("resize", size);
	};
	this.on("resize", onresize)
		.on("unpipe", function(src) {
			src.removeListener(onresize);
		});
};

/**
* Takes a chunk of data, interprets its escape sequences, and fills backend state
* @alias Terminal.prototype.write
* @see http://nodejs.org/docs/latest/api/stream.html#stream_writable_write_chunk_encoding_callback
*/
Terminal.prototype._write = function(chunk, encoding, callback) {
	var len = 1;
	if(typeof chunk !== "string")
		chunk = chunk.toString();

	if(this.oldChunk !== null) {
		chunk = this.oldChunk + chunk;
		this.oldChunk = null;
	}

	while(chunk.length > 0 && len > 0) {
		len = this.callHandler("chr", chunk[0], chunk);
		if(len === null) {
			for(len = 1; len < chunk.length &&
				!(chunk[len] in this.handlers.chr); len++);

			this.state.write(chunk.substr(0, len));
		}

		if(len > 0)
			chunk = chunk.slice(len);
	}
	if(chunk.length !== 0)
		this.oldChunk = chunk;
	this.emit("ready");
	callback();
};

/**
* calls an handler
* @param type {string} one of the following types:
* <ul>
* <li>chr: interprets special characters (such as \r or \b)</li>
* <li>esc: interprets simple escape characters starting with \x1b</li>
* <li>csi: interprets CSI escape sequences</li>
* <li>sgr: interprets SGR escape sequences</li>
* <li>dcs: interprets DCS escape sequences</li>
* <li>mode: interprets mode sequences</li>
* <li>osc: interpretes OSC escape sequences</li>
* </ul>
* @param cmd {string} command to execute
* @param ... {...array} passed to the command function
*/
Terminal.prototype.callHandler = function(type, cmd) {
	var args = Array.prototype.slice.call(arguments, 1);
	var result;

	if(!(type in this.handlers && cmd in this.handlers[type]))
		return null;

	if(typeof this.handlers[type][cmd] === "string")
		cmd = this.handlers[type][cmd];

	result = this.handlers[type][cmd].apply(this, args);
	return result === undefined ? 1 : result;
};

/**
* reads a CSI command sequence from a chunk of data
* @param chunk {string} a chunk of data to parse
* @returns {{args: Number|Array, mod: String, cmd: String, length: Number}}
*/
Terminal.prototype.parseCsi = function(chunk) {
	var i;
	var match = CSI_PATTERN.exec(chunk);
	if(match === null)
		return null;
	var args = match[2] === "" ? [] : match[2].split(";");
	for(i = 0; i < args.length; i++)
		args[i] = +args[i];
	return {
		args: args,
		mod: match[1],
		cmd: match[3],
		length: match[0].length
	};
};

/**
* reads a OSC command sequence from a chunk of data
* @param chunk {string} a chunk of data to parse
* @returns {{args: String|Array, mod: String, cmd: String, length: Number,
* terminated: Boolean}}
*/
Terminal.prototype.parseOsc = function(chunk) {
	var match = OSC_PATTERN.exec(chunk);
	if(match === null)
		return null;
	return {
		args: match[2].split(";"),
		cmd: match[1],
		terminated: match[3] === "\x07",
		length: match[0].length
	};
};

/**
* reads a OSC command sequence from a chunk of data
* @param chunk {string} a chunk of data to parse
* @returns {{args: String|Array, mod: String, cmd: String, length: Number}}
*/
Terminal.prototype.parseDcs = function(chunk) {
	var i;
	var match = DCS_PATTERN.exec(chunk);
	if(match === null)
		return null;
	return {
		args: [null,null],
		mod: match[1],
		cmd: match[1],
		length: match[0].length
	};
};

/**
* sets up a DOM element as Terminal in- and output
* @param element a DOM element node
* @param options options field
* @returns a terminal input which can be used to send data to a pty
*/
Terminal.prototype.dom = function(element, opts) {
	var input = new DomInput(element, this.state, opts);
	var output = new DomOutput(this.state, this, element, opts);

	return input;
};

/**
* will give a string representation of the terminal
* @param format one of "html", "ansi", "plain" if not present,
* {@link TermState#toString} will be called.
* @returns string representation of the terminal
*/
Terminal.prototype.toString = function(format) {
	if(typeof format !== "string")
		return this.state.toString.apply(this.state, arguments);

	var output = new outputs[format](this.state);

	return output.toString();
};

},{"./handler/chr.js":2,"./handler/csi.js":3,"./handler/dcs.js":4,"./handler/esc.js":5,"./handler/mode.js":6,"./handler/osc.js":7,"./handler/sgr.js":8,"./input/dom.js":10,"./output/ansi.js":12,"./output/dom.js":14,"./output/html.js":15,"./output/plain.js":17,"./term_state.js":22,"./util":24,"stream":47,"util":51}],24:[function(require,module,exports){
"use strict";

var A = Array.prototype;

exports.extend = function(o){
	for(var i = 1; i < arguments.length; i++)
		for(var key in arguments[i])
			o[key] = arguments[i][key];
	return o;
};

exports.repeat = function(str, n) {
	var i, result = "";
	for(i = 0; i < n; i++) {
		result += str;
	}
	return result;
};

exports.objSplice = function(obj, length, start, end, replace) {
	var splice = A.splice, args = [ start, end ];
	A.push.apply(args, replace);
	obj.length = length;
	splice.apply(obj, args);
	delete obj.length;
};

exports.indexOf = A.indexOf ?
	function() {
		var args = A.slice.call(arguments);
		return A.indexOf.apply(args.shift(), args);
	} :
	function(obj, needle) {
		for (var i = 0; i < this.length; i++)
			if (this[i] === needle) return i;
		return -1;
	};


},{}],25:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],26:[function(require,module,exports){

},{}],27:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":25,"ieee754":31,"isarray":28}],28:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],29:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":33}],30:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],31:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],32:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],33:[function(require,module,exports){
/**
 * Determine if an object is Buffer
 *
 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * License:  MIT
 *
 * `npm install is-buffer`
 */

module.exports = function (obj) {
  return !!(obj != null &&
    (obj._isBuffer || // For Safari 5-7 (missing Object.prototype.constructor)
      (obj.constructor &&
      typeof obj.constructor.isBuffer === 'function' &&
      obj.constructor.isBuffer(obj))
    ))
}

},{}],34:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],35:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn) {
  var args = new Array(arguments.length - 1);
  var i = 0;
  while (i < args.length) {
    args[i++] = arguments[i];
  }
  process.nextTick(function afterTick() {
    fn.apply(null, args);
  });
}

}).call(this,require('_process'))
},{"_process":36}],36:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],37:[function(require,module,exports){
module.exports = require("./lib/_stream_duplex.js")

},{"./lib/_stream_duplex.js":38}],38:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/



/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

},{"./_stream_readable":40,"./_stream_writable":42,"core-util-is":29,"inherits":32,"process-nextick-args":35}],39:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./_stream_transform":41,"core-util-is":29,"inherits":32}],40:[function(require,module,exports){
(function (process){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/


/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events');

/*<replacement>*/
var EElistenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/



/*<replacement>*/
var Stream;
(function (){try{
  Stream = require('st' + 'ream');
}catch(_){}finally{
  if (!Stream)
    Stream = require('events').EventEmitter;
}}())
/*</replacement>*/

var Buffer = require('buffer').Buffer;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/



/*<replacement>*/
var debugUtil = require('util');
var debug;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var StringDecoder;

util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function')
    this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function() {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}


// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (n === null || isNaN(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = computeNewHighWaterMark(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else {
      return state.length;
    }
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (ret !== null)
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!(Buffer.isBuffer(chunk)) &&
      typeof chunk !== 'string' &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      processNextTick(emitReadable_, stream);
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    processNextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      if (state.pipesCount === 1 &&
          state.pipes[0] === dest &&
          src.listenerCount('data') === 1 &&
          !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];


  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined))
      return;
    else if (!state.objectMode && (!chunk || !chunk.length))
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }; }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};


// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else if (list.length === 1)
      ret = list[0];
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))
},{"./_stream_duplex":38,"_process":36,"buffer":27,"core-util-is":29,"events":30,"inherits":32,"isarray":34,"process-nextick-args":35,"string_decoder/":48,"util":26}],41:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function')
      this._transform = options.transform;

    if (typeof options.flush === 'function')
      this._flush = options.flush;
  }

  this.once('prefinish', function() {
    if (typeof this._flush === 'function')
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":38,"core-util-is":29,"inherits":32}],42:[function(require,module,exports){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/


/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/



/*<replacement>*/
var Stream;
(function (){try{
  Stream = require('st' + 'ream');
}catch(_){}finally{
  if (!Stream)
    Stream = require('events').EventEmitter;
}}())
/*</replacement>*/

var Buffer = require('buffer').Buffer;

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function (){try {
Object.defineProperty(WritableState.prototype, 'buffer', {
  get: internalUtil.deprecate(function() {
    return this.getBuffer();
  }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' +
     'instead.')
});
}catch(_){}}());


function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function')
      this._write = options.write;

    if (typeof options.writev === 'function')
      this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;

  if (!(Buffer.isBuffer(chunk)) &&
      typeof chunk !== 'string' &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = nop;

  if (state.ended)
    writeAfterEnd(this, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.bufferedRequest)
      clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string')
    encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64',
'ucs2', 'ucs-2','utf16le', 'utf-16le', 'raw']
.indexOf((encoding + '').toLowerCase()) > -1))
    throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync)
    processNextTick(cb, er);
  else
    cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      processNextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var buffer = [];
    var cbs = [];
    while (entry) {
      cbs.push(entry.callback);
      buffer.push(entry);
      entry = entry.next;
    }

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    state.lastBufferedRequest = null;
    doWrite(stream, state, true, state.length, buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null)
      state.lastBufferedRequest = null;
  }
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined)
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(state) {
  return (state.ending &&
          state.length === 0 &&
          state.bufferedRequest === null &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      processNextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./_stream_duplex":38,"buffer":27,"core-util-is":29,"events":30,"inherits":32,"process-nextick-args":35,"util-deprecate":49}],43:[function(require,module,exports){
module.exports = require("./lib/_stream_passthrough.js")

},{"./lib/_stream_passthrough.js":39}],44:[function(require,module,exports){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":38,"./lib/_stream_passthrough.js":39,"./lib/_stream_readable.js":40,"./lib/_stream_transform.js":41,"./lib/_stream_writable.js":42}],45:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":41}],46:[function(require,module,exports){
module.exports = require("./lib/_stream_writable.js")

},{"./lib/_stream_writable.js":42}],47:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":30,"inherits":32,"readable-stream/duplex.js":37,"readable-stream/passthrough.js":43,"readable-stream/readable.js":44,"readable-stream/transform.js":45,"readable-stream/writable.js":46}],48:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":27}],49:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],50:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],51:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":50,"_process":36,"inherits":32}]},{},[1])(1)
});