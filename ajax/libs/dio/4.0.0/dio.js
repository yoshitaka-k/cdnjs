/*!
 *  ___ __ __  
 * (   (  /  \ 
 *  ) ) )( () )
 * (___(__\__/ 
 * 
 * dio is a fast javascript framework
 * 
 * @licence MIT
 */
(function (factory) {
	if (typeof exports === 'object' && typeof module !== 'undefined') {
		module.exports = factory(global);
	} else if (typeof define === 'function' && define.amd) {
		define(factory(window));
	} else {
		window.dio = factory(window);
	}
}(function (window) {


	'use strict';


	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * constants
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	// current version
	var version = '4.0.0';
	
	// enviroment variables
	var document = window.document || null;
	var browser = document !== null;
	var server = browser === false;
	
	// namespaces
	var nsStyle = 'data-scope';
	var nsMath  = 'http://www.w3.org/1998/Math/MathML';
	var nsXlink = 'http://www.w3.org/1999/xlink';
	var nsSvg = 'http://www.w3.org/2000/svg';
	
	// empty shapes
	var objEmpty = Object.create(null);
	var arrEmpty = [];
	var nodEmpty = VNode(0, '', objEmpty, arrEmpty, null, null, null);
	
	// random characters
	var randomChars = 'JrIFgLKeEuQUPbhBnWZCTXDtRcxwSzaqijOvfpklYdAoMHmsVNGy';
	
	// ssr
	var readable = server ? require('stream').Readable : null;
	
	// void elements
	var isVoid = {
		'area':   0, 'base':  0, 'br':   0, '!doctype': 0, 'col':    0, 'embed': 0,
		'wbr':    0, 'track': 0, 'hr':   0, 'img':      0, 'input':  0, 
		'keygen': 0, 'link':  0, 'meta': 0, 'param':    0, 'source': 0
	};
	
	// unicode characters
	var uniCodes = {
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
		'&': '&amp;'
	};
	
	// regular expressions
	var regEsc = /[<>&"']/g;
	var regStyleCamel = /([a-zA-Z])(?=[A-Z])/g;
	var regStyleVendor = /^(ms|webkit|moz)/;
	
	
	// router
	var regRoute = /([:*])(\w+)|([\*])/g;
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * utilities
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * escape string
	 * 
	 * @param  {(string|boolean|number)} subject
	 * @return {string}
	 */
	function escape (subject) {
		return String(subject).replace(regEsc, unicoder);
	}
	
	
	/**
	 * unicoder, escape => () helper
	 * 
	 * @param  {string} char
	 * @return {string}
	 */
	function unicoder (char) {
		return uniCodes[char] || char;
	}
	
	
	/**
	 * try catch helper
	 * 
	 * @param  {function}  func
	 * @param  {function=} error
	 * @param  {any=}      value
	 * @return {any}
	 */
	function sandbox (func, error, value) {
		try {
			return value != null ? func(value) : func();
		} catch (e) {
			return error && error(e);
		}
	}
	
	
	/**
	 * generate random string of a certain length
	 * 
	 * @param  {number} length
	 * @return {string}
	 */
	function random (length) {
	    var text = '';
	
	    // 52 is the length of characters in the string `randomChars`
	    for (var i = 0; i < length; i++) {
	        text += randomChars[Math.floor(Math.random() * 52)];
	    }
	
	    return text;
	}
	
	
	/**
	 * for in proxy
	 * 
	 * @param  {Object}   obj
	 * @param  {function} func
	 */
	function each (obj, func) {
		for (var name in obj) {
			func(obj[name], name);
		}
	}
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * stylesheet
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * stylesheet
	 * 
	 * @param  {Component}     component
	 * @param  {function}      constructor
	 * @return {function(?Node)}
	 */
	function stylesheet (component, constructor) {
		var styles = component.stylesheet();
		var id     = random(5);
		var css    = stylis('['+nsStyle+'='+id+']', styles, true, true);
	
		function styler (element) {
			if (element === null) {
				// cache for server-side rendering
				return css;
			} else {
				element.setAttribute(nsStyle, id);
	
				// avoid adding a style element when one is already present
				if (document.getElementById(id) == null) { 
					var style = document.createElement('style');
					
					style.textContent = css;
					style.id = id;
	
					document.head.appendChild(style);
				}
			}
		}
	
		styler.styler = id;
	
		return constructor.prototype.stylesheet = styler;
	}
	
	
	/**
	 * css compiler
	 *
	 * @example compiler('.class1', 'css...', false);
	 * 
	 * @param  {string}  selector
	 * @param  {string}  styles
	 * @param  {boolean} nsAnimations
	 * @param  {boolean} nsKeyframes
	 * @return {string}
	 */
	function stylis (selector, styles, nsAnimations, nsKeyframes) {
	    var prefix = '';
	    var id     = '';
	    var type   = selector.charCodeAt(0) || 0;
	
	    // [
	    if (type === 91) {
	        // `[data-id=namespace]` -> ['data-id', 'namespace']
	        var attr = selector.substring(1, selector.length-1).split('=');            
	        var char = (id = attr[1]).charCodeAt(0);
	
	        // [data-id="namespace"]/[data-id='namespace']
	        // --> "namespace"/'namspace' -> namespace
	        if (char === 34 || char === 39) {
	            id = id.substring(1, id.length-1);
	        }
	
	        // re-build and extract namespace/id
	        prefix = '['+ attr[0] + '=\'' + id +'\']';
	    }
	    // `#` or `.` or `>`
	    else if (type === 35 || type === 46 || type === 62) {
	        id = (prefix = selector).substring(1);
	    }
	    // element selector
	    else {
	        id = prefix = selector;
	    }
	
	    var keyframeNs  = (nsAnimations === void 0 || nsAnimations === true ) ? id : '';
	    var animationNs = (nsKeyframes === void 0 || nsKeyframes === true ) ? id : '';
	
	    var output  = '';
	    var line    = '';
	    var blob    = '';
	
	    var len     = styles.length;
	
	    var i       = 0;
	    var special = 0;
	    var type    = 0;
	    var close   = 0;
	    var flat    = 1; 
	    var comment = 0;
	
	    // parse + compile
	    while (i < len) {
	        var code = styles.charCodeAt(i);
	
	        // {, }, ; characters, parse line by line
	        if (code === 123 || code === 125 || code === 59) {
	            line += styles[i];
	
	            var first = line.charCodeAt(0);
	
	            // only trim when the first character is a space ` `
	            if (first === 32) { 
	                first = (line = line.trim()).charCodeAt(0); 
	            }
	
	            var second = line.charCodeAt(1) || 0;
	
	            // /, *, block comment
	            if (first === 47 && second === 42) {
	                first = (line = line.substring(line.indexOf('*/')+2)).charCodeAt(0);
	                second = line.charCodeAt(1) || 0;
	            }
	
	            // @, special block
	            if (first === 64) {
	                // exit flat css context with the first block context
	                flat === 1 && (flat = 0, output.length !== 0 && (output = prefix + ' {'+output+'}'));
	
	                // @keyframe/@global, `k` or @global, `g` character
	                if (second === 107 || second === 103) {
	                    special++;
	
	                    if (second === 107) {
	                        blob = line.substring(1, 11) + keyframeNs + line.substring(11);
	                        line = '@-webkit-'+blob;
	                        type = 1;
	                    } else {
	                        line = '';
	                    }
	                }
	            } else {
	                var third = line.charCodeAt(2) || 0;
	
	                // animation: a, n, i characters
	                if (first === 97 && second === 110 && third === 105) {
	                    var anims = line.substring(10).split(',');
	                    var build = 'animation:';
	
	                    for (var j = 0, length = anims.length; j < length; j++) {
	                        build += (j === 0 ? '' : ',') + animationNs + anims[j].trim();
	                    }
	
	                    // vendor prefix
	                    line = '-webkit-' + build + build;
	                }
	                // appearance: a, p, p
	                else if (first === 97 && second === 112 && third === 112) {
	                    // vendor prefix -webkit- and -moz-
	                    line = '-webkit-' + line + '-moz-' + line + line;
	                }
	                // hyphens: h, y, p
	                // user-select: u, s, e
	                else if (
	                    (first === 104 && second === 121 && third === 112) ||
	                    (first === 117 && second === 115 && third === 101)
	                ) {
	                    // vendor prefix all
	                    line = '-webkit-' + line + '-moz-' + line + '-ms-' + line + line;
	                }
	                // flex: f, l, e
	                // order: o, r, d
	                else if (
	                    (first === 102 && second === 108 && third === 101) ||
	                    (first === 111 && second === 114 && third === 100)
	                ) {
	                    // vendor prefix only -webkit-
	                    line = '-webkit-' + line + line;
	                }
	                // transforms & transitions: t, r, a 
	                else if (first === 116 && second === 114 && third === 97) {
	                    // vendor prefix -webkit- and -ms- if transform
	                    line = '-webkit-' + line + (line.charCodeAt(5) === 102 ? '-ms-' + line : '') + line;
	                }
	                // display: d, i, s
	                else if (first === 100 && second === 105 && third === 115) {
	                    if (line.indexOf('flex') > -1) {
	                        // vendor prefix
	                        line = 'display:-webkit-flex; display:flex;';
	                    }
	                }
	                // { character, selector declaration
	                else if (code === 123) {
	                    // exit flat css context with the first block context
	                    flat === 1 && (flat = 0, output.length !== 0 && (output = prefix + ' {'+output+'}'));
	
	                    if (special === 0) {
	                        var split = line.split(',');
	                        var build = '';
	
	                        // prefix multiple selectors with namesapces
	                        // @example h1, h2, h3 --> [namespace] h1, [namespace] h1, ....
	                        for (var j = 0, length = split.length; j < length; j++) {
	                            var selector = split[j];
	                            var firstChar = selector.charCodeAt(0);
	
	                            // ` `, trim if first char is space
	                            if (firstChar === 32) {
	                                firstChar = (selector = selector.trim()).charCodeAt(0);
	                            }
	
	                            // &
	                            if (firstChar === 38) {
	                                selector = prefix + selector.substring(1);
	                            }
	                            // : 
	                            else if (firstChar === 58) {
	                                var secondChar = selector.charCodeAt(1);
	
	                                // :host 
	                                if (secondChar === 104) {
	                                    var nextChar = (selector = selector.substring(5)).charCodeAt(0);
	                                    
	                                    // :host(selector)                                                    
	                                    if (nextChar === 40) {
	                                        selector = prefix + selector.substring(1).replace(')', '');
	                                    } 
	                                    // :host-context(selector)
	                                    else if (nextChar === 45) {
	                                        selector = selector.substring(9, selector.indexOf(')')) + ' ' + prefix + ' {';
	                                    }
	                                    // :host
	                                    else {
	                                        selector = prefix + selector;
	                                    }
	                                }
	                                // :global()
	                                else if (secondChar === 103) {
	                                    selector = selector.substring(8).replace(')', '');
	                                }
	                                // :hover, :active, :focus, etc...
	                                else {
	                                    selector = prefix + (firstChar === 58 ? '' : ' ') + selector;
	                                }
	                            }
	                            else {
	                                selector = prefix + (firstChar === 58 ? '' : ' ') + selector;
	                            }
	
	                            build += j === 0 ? selector : ',' + selector;
	                        }
	
	                        line = build;
	                    }
	                }
	
	                // @global/@keyframes
	                if (special !== 0) {
	                    // find the closing tag
	                    if (code === 125) {
	                        close++;
	                    } else if (code === 123 && close !== 0) {
	                        close--;
	                    }
	
	                    // closing tag
	                    if (close === 2) {
	                        // @global
	                        if (type === 0) {
	                            line = '';
	                        }
	                        // @keyframes 
	                        else {
	                            // vendor prefix
	                            line = '}@'+blob+'}';
	                            // reset blob
	                            blob = '';
	                        }
	
	                        // reset flags
	                        type = 0;
	                        close = special > 1 ? 1 : 0;
	                        special--;
	                    }
	                    // @keyframes 
	                    else if (type === 1) {
	                        blob += line;
	                    }
	                }
	            }
	
	            output += line;
	            line    = '';
	            comment = 0;
	        }
	        // build line by line
	        else {
	            // \r, \n, remove line comments
	            if (comment === 1 && (code === 13 || code === 10)) {
	                line = '';
	            }
	            // not `\t`, `\r`, `\n` characters
	            else if (code !== 9 && code !== 13 && code !== 10) {
	                code === 47 && comment === 0 && (comment = 1);
	                line += styles[i];
	            }
	        }
	
	        // next character
	        i++; 
	    }
	
	    return flat === 1 && output.length !== 0 ? prefix+' {'+output+'}' : output;
	}
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * element
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * virtual element node factory
	 * 
	 * @param  {string}  type
	 * @param  {Object=} props
	 * @param  {any[]=}  children
	 * @return {VNode}
	 */
	function VElement (type, props, children) {
		return {
			nodeType: 1, 
			type: type, 
			props: (props || objEmpty), 
			children: (children || []), 
			_node: null,
			_owner: null,
			_index: null
		};
	}
	
	
	/**
	 * virtual component node factory
	 * 
	 * @param  {(function|Component)} type
	 * @param  {Object=}              props
	 * @param  {any[]=}               children
	 * @return {VNode}
	 */
	function VComponent (type, props, children) {
		return {
			nodeType: 2, 
			type: type, 
			props: (props || type.defaultProps || objEmpty), 
			children: (children || arrEmpty),
			_node: null,
			_owner: null,
			_index: null
		};
	}
	
	
	/**
	 * virtual fragment node factory
	 * 
	 * @param  {VNode[]} children
	 * @return {VNode}
	 */
	function VFragment (children) {
		return {
			nodeType: 11, 
			type: '@', 
			props: objEmpty, 
			children: children,
			_node: null,
			_owner: null,
			_index: null
		};
	}
	
	
	/**
	 * virtual text node factory
	 * 
	 * @param  {(string|boolean|number)} text
	 * @return {VNode}
	 */
	function VText (text) {
		return {
			nodeType: 3, 
			type: 'text', 
			props: objEmpty, 
			children: text, 
			_node: null,
			_owner: null,
			_index: null
		};
	}
	
	
	/**
	 * virtual svg node factory
	 * 
	 * @param  {string}  type
	 * @param  {Object=} props
	 * @param  {any[]=}  children
	 * @return {VNode}
	 */
	function VSvg (type, props, children) {
		return {
			nodeType: 1, 
			type: type, 
			props: (props = props || {}, props.xmlns = nsSvg, props), 
			children: (children || []),
			_node: null,
			_owner: null,
			_index: null
		};
	}
	
	
	/**
	 * virtual node factory
	 * 
	 * @param {number}                      nodeType
	 * @param {(function|Component|string)} type
	 * @param {Object}                      props
	 * @param {VNode[]}                     children
	 * @param {?Node}                      _node
	 * @param {?Component}                 _owner
	 * @param {?index}                     _index
	 */
	function VNode (nodeType, type, props, children, _node, _owner, _index) {
		return {
			nodeType: nodeType,
			type: type,
			props: props,
			children: children,
			_node: _node,
			_owner: _owner,
			_index: _index
		};
	}
	
	
	/**
	 * virtual empty node factory
	 * 
	 * @return {VNode}
	 */
	function VEmpty () {
		return {
			nodeType: 1, 
			type: 'noscript', 
			props: objEmpty, 
			children: [], 
			_node: null,
			_owner: null,
			_index: null
		};
	}
	
	
	/**
	 * create virtual element
	 * 
	 * @param  {(string|function|Object)} type
	 * @param  {Object=}                  props
	 * @param  {...*=}                    children
	 * @return {Object}
	 */
	function createElement (type, props) {
		var length   = arguments.length;
		var children = [];
		var position = 2;
	
		// if props is not a normal object
		if (props == null || props.nodeType !== void 0 || props.constructor !== Object) {
			// update position if props !== null
			if (props !== null) {
				props = null;
				position = 1; 
			}
		}
	
		if (length !== 1) {
			var index = 0;
			
			// construct children
			for (var i = position; i < length; i++) {
				var child = arguments[i];
				
				// only add non null/undefined children
				if (child != null) {
					// if array, flatten
					if (child.constructor === Array) {
						// add array child
						for (var j = 0, len = child.length; j < len; j++) {
							index = createChild(child[j], children, index);
						}
					} else {
						index = createChild(child, children, index);
					}
				}
			}
		}
	
		// if type is a function, create component VNode
		if (typeof type === 'function') {
			return VComponent(type, props, children);
		} 
		else if (type === '@') {
			return VFragment(children);
		} 
		else {
			if (props === null) {
				props = {};
			}
	
			// if props.xmlns is undefined and type === 'svg' or 'math' 
			// assign svg && math namespaces to props.xmlns
			if (props.xmlns === void 0) {	
				if (type === 'svg') { 
					props.xmlns = nsSvg; 
				} else if (type === 'math') { 
					props.xmlns = nsMath; 
				}
			}
	
			return VElement(type, props, children);
		}
	}
	
	
	/**
	 * create virtual child node
	 * 
	 * @param {any} child
	 */
	function createChild (child, children, index) {
		if (child != null) {
			if (child.nodeType !== void 0) {
				// Element
				children[index++] = child;
			} else {
				var type = typeof child;
	
				if (type === 'function') {
					// Component
					children[index++] = VComponent(child, null, null);
				} else if (type === 'object') {
					// Array
					for (var i = 0, len = child.length; i < len; i++) {
						index = createChild(child[i], children, index);
					}
				} else {
					// Text
					children[index++] = VText(type !== 'boolean' ? child : '');
				}
			}
		}
	
		return index;
	}
	
	
	/**
	 * clone and return an element having the original element's props
	 * with new props merged in shallowly and new children replacing existing ones.
	 * 
	 * @param  {VNode}   subject
	 * @param  {Object=} newProps
	 * @param  {any[]=}  newChildren
	 * @return {VNode}
	 */
	function cloneElement (subject, newProps, newChildren) {
		var type     = subject.type;
		var props    = newProps || {};
		var children = newChildren || subject.children;
	
		// copy old props
		each(subject.props, function (value, name) {
			if (props[name] === void 0) {
				props[name] = value;
			}
		});
	
		// replace children
		if (newChildren !== void 0) {
			var length = newChildren.length;
	
			// if not empty, copy
			if (length > 0) {
				var index    = 0;
					children = [];
	
				// copy old children
				for (var i = 0; i < length; i++) {
					index = createChild(newChildren[i], children, index);
				}
			}
		}
	
		return createElement(type, props, children);
	}
	
	
	/**
	 * create element factory
	 * 
	 * @param  {string}  element
	 * @return {function}
	 */
	function createFactory (type, props) {
		return props ? VElement.bind(null, type, props) : VElement.bind(null, type);
	}
	/**
	 * is valid element
	 * 
	 * @param  {*} subject
	 * @return {boolean}
	 */
	function isValidElement (subject) {
		return subject && subject.nodeType;
	}
	
	
	/**
	 * DOM factory, create VNode factories
	 *
	 * @param {string[]} types
	 */
	function DOM (types) {
		var elements = {};
	
		// add element factories
		for (var i = 0, length = types.length; i < length; i++) {
			elements[types[i]] = VElement.bind(null, types[i]);
		}
		
		// if svg, add related svg element factories
		if (elements.svg) {
			var svgs = ['rect','path','polygon','circle','ellipse','line','polyline','svg',
				'g','defs','text','textPath','tspan','mpath','defs','g'];
	
			for (var i = 0, length = svgs.length; i < length; i++) {
				elements[svgs[i]] = VSvg.bind(null, svgs[i]);
			}
		}
	
		return elements;
	}
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * component
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * set state
	 * 
	 * @param {Object}    newState
	 * @param {function=} callback
	 */
	function setState (newState, callback) {
		if (this.shouldComponentUpdate && this.shouldComponentUpdate(this.props, newState) === false) {
			return;
		}
	
		updateState(this.state, newState);
	
		callback ? this.forceUpdate(callback) : this.forceUpdate();
	}
	
	
	/**
	 * update state, hoisted to avoid deopts
	 * 
	 * @param  {Object} state
	 * @param  {Object} newState
	 */
	function updateState (state, newState) {
		for (var name in newState) {
			state[name] = newState[name];
		}
	}
	
	
	/**
	 * force an update
	 *
	 * @param  {function=}
	 */
	function forceUpdate (callback) {
		if (this.componentWillUpdate) {
			this.componentWillUpdate(this.props, this.state);
		}
	
		var newNode = extractRender(this);
		var oldNode = this._vnode;
	
		// component returns a different root node
		if (newNode.type !== oldNode.type) {		
			// replace node
			replaceNode(newNode, oldNode, oldNode._node.parentNode, createNode(newNode, null, null));
	
			// hydrate newNode
			oldNode.nodeType = newNode.nodeType;
			oldNode.type     = newNode.type;
			oldNode.props    = newNode.props;
			oldNode.children = newNode.children;
			oldNode._node    = newNode._node;
			oldNode._owner   = newNode._owner;
		} else {
			// patch node
			patch(newNode, oldNode, false);
		}
	
		if (this.componentDidUpdate) {
			this.componentDidUpdate(this.props, this.state);
		}
	
		// callback
		if (callback) {
			callback.call(this);
		}
	}
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * component
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * component class
	 * 
	 * @param {Object=} props
	 */
	function Component (props) {
		// initial props
		if (this.getInitialProps) {
			this.props = this.getInitialProps(props);
		}
		// assign props
		else if (props !== objEmpty) {
			this.componentWillReceiveProps && this.componentWillReceiveProps(props);
			this.props = props;
		} 
		// default props
		else {
			this.props = this.props || (this.getDefaultProps && this.getDefaultProps()) || {};
		}
	
		// assign state
		this.state = this.state || (this.getInitialState && this.getInitialState()) || {};
	
		// create vnode addresses reference
		this._cache = this._vnode = null;
	}
	
	
	/**
	 * component prototype
	 * 
	 * @type {Object}
	 */
	Component.prototype = Object.create(null, {
		setState:    { value: setState },
		forceUpdate: { value: forceUpdate }
	});
	
	
	/**
	 * create class
	 * 
	 * @param  {(Object|function)} subject
	 * @return {function}
	 */
	function createClass (subject) {
		if (subject._component) {
			return subject._component; 
		} else {
			var func  = typeof subject === 'function';
			var shape = func ? subject() : subject;
	
			// shape has a constructor method
			var init  = shape.hasOwnProperty('constructor');
	
			function component (props) {
				// constructor
				if (init) {
					this.constructor(props);
				}
	
				// extend Component
				Component.call(this, props); 
			}
	
			// extend Component prototype
			component.prototype             = shape;
			component.prototype.setState    = Component.prototype.setState;
			component.prototype.forceUpdate = Component.prototype.forceUpdate;
	
			// function component, cache created component
			if (func) {
				subject._component = component;
			}
	
			return component.constructor = component;
		}
	}
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * render
	 * 
	 * ---------------------------------------------------------------------------------
	 */
		
	
	/**
	 * hydrates a server-side rendered dom structure
	 * 
	 * @param  {Node}       parent
	 * @param  {VNode}      subject
	 * @param  {number}     index
	 * @param  {VNode}      parentNode
	 * @param  {?Component}
	 */
	function hydrate (parent, subject, index, parentNode, component) {
		var newNode  = subject.nodeType === 2 ? extractComponent(subject) : subject;
		var nodeType = newNode.nodeType;
	
		var element = nodeType === 11 ? parent : parent.childNodes[index];
	
		// if the node is not a textNode and
		// has children hydrate each of its children
		if (nodeType === 1) {
			var props       = newNode.props;
			var newChildren = newNode.children;
			var newLength   = newChildren.length;
	
			// vnode has component attachment
			if (subject._owner !== null) {
				(component = subject._owner)._vnode._node = parent;
			}
	
			// async hydration
			for (var i = 0; i < newLength; i++) {
				setTimeout(hydrate, 0, element, newChildren[i], i, newNode, component);
			}
	
			// not a fragment
			if (nodeType !== 11) {
				if (props !== objEmpty) {
					// refs
					if (props.ref) {
						props.ref.call(component, element);
					}
	
					// assign events
					assignProps(element, props, true, newNode._owner || null);
				}
			}
	
			// hydrate the dom element to the virtual element
			subject._node = element;
		}
		else if (nodeType === 3) {
			var children = parentNode.children;
			var length   = children.length;
			var next     = children[index+1] || nodEmpty;
	
			/*
				when we reach a string child that is followed by a string child, 
				it is assumed that the dom representing it is a single textNode,
				we do a look ahead of the child, create & append each textNode child to documentFragment 
				starting from current child till we reach a non textNode such that on h('p', 'foo', 'bar') 
				foo and bar are two different textNodes in the fragment, we then replace the 
				single dom's textNode with the fragment converting the dom's single textNode to multiple
			 */
			if (length > 1 && next.nodeType === 3) {
				// fragment to use to replace a single textNode with multiple text nodes
				// case in point h('h1', 'Hello', 'World') output: <h1>HelloWorld</h1>
				// but HelloWorld is one text node in the dom while two in the vnode
				var fragment = document.createDocumentFragment();
				
				// look ahead of this nodes siblings and add all textNodes to the the fragment.
				// exit when a non text node is encounted
				for (var i = index, len = length - index; i < len; i++) {
					var textNode = children[i];
	
					// exit early once we encounter a non text/string node
					if (textNode.nodeType !== 3) {
						break;
					}
	
					// create textnode, append to the fragment
					fragment.appendChild(textNode._node = document.createTextNode(textNode.children));
				}
	
				// replace the textNode with a set of textNodes
				parent.replaceChild(fragment, element);
			} else {
				newNode._node = element;
			}
		}
	}
	
	
	/**
	 * render
	 * 
	 * @param  {(Component|VNode)} subject
	 * @param  {(Node|string)}     target
	 * @return {function(Object=)}
	 */
	function render (subject, target) {
		// renderer
		function reconciler (props) {
			if (initial) {
				// dispatch mount
				mount(element, node);
	
				// register mount has been dispatched
				initial = false;
	
				// assign component
				component === void 0 && (component = node._owner);
			} else {
				// update props
				if (props !== void 0) {
					if (
						component.shouldComponentUpdate !== void 0 && 
						component.shouldComponentUpdate(props, component.state) === false
					) {
						return reconciler;
					}
	
					component.props = props;
				}
	
				// update component
				component.forceUpdate();
			}
	
			return reconciler;
		}
	
		var component;
		var node;
		var element;
	
		if (subject.render !== void 0) {
			// create component from object
			node = VComponent(createClass(subject));
		} else if (subject.type === void 0) {
			// fragment/component
			node = subject.constructor === Array ? createElement('@', null, subject) : VComponent(subject);
		} else {
			node = subject;
		}
	
		if (server) {
			return reconciler;
		}
	
		// retrieve mount element
	  	if (target != null && target.nodeType != null) {
		  // target is a dom element
		  element = target;
		} else {
		  // target might be a selector
		  target = document.querySelector(target);
	
		  // default to document.body if no match/document
		  element = (target === null || target === document) ? document.body : target;
		}
	
		// initial mount registry
		var initial = true;
	
		// hydration
		if (element.hasAttribute('hydrate')) {
			// dispatch hydration
			hydrate(element, node, 0, nodEmpty, null);
	
			// cleanup element hydrate attributes
			element.removeAttribute('hydrate');
	
			// register mount has been dispatched
			initial = false;
	
			// assign component
			component === void 0 && (component = node._owner); 
		} else {
			reconciler();
		}
	
		return reconciler;
	}
	
	
	/**
	 * mount render
	 * 
	 * @param  {Node}   element
	 * @param  {Object} newNode
	 */
	function mount (element, newNode) {
		// clear element
		element.textContent = '';
		// create element
		appendNode(newNode, element, createNode(newNode, null, null));
	}
	
	
	/**
	 * patch nodes
	 *  
	 * @param  {VNode}   newNode  
	 * @param  {VNode}   oldNode  
	 * @param  {boolean} innerRecursive
	 * @return {number}  number
	 */
	function patch (newNode, oldNode, innerRecursive) {
		var newNodeType = newNode.nodeType;
		var oldNodeType = oldNode.nodeType;
	
		// remove operation
		if (newNodeType === 0) { 
			return 1; 
		}
		// add operation
		else if (oldNodeType === 0) { 
			return 2;
		}
		// text operation
		else if (newNodeType === 3 && oldNodeType === 3) { 
			if (newNode.children !== oldNode.children) {
				return 3; 
			} 
		}
		// key operation
		else if (innerRecursive && (newNode.props.key !== void 0 || oldNode.props.key !== void 0)) {
			return 5;
		}
		// replace operation
		else if (newNode.type !== oldNode.type) {
			return 4;
		}
		// recursive
		else {
			// if currentNode and oldNode are the identical, exit early
			if (newNode !== oldNode) {		
				// extract node from possible component node
				var currentNode = newNodeType === 2 ? extractComponent(newNode) : newNode;
	
				// a component
				if (oldNodeType === 2) {
					var oldComponent = oldNode._owner;
					var newComponent = newNode._owner;
	
					// a component with shouldComponentUpdate method
					if (
						oldComponent.shouldComponentUpdate && 
						oldComponent.shouldComponentUpdate(newNode.props, newComponent.state) === false
					) {
						// exit early
						return 0;
					}
	
					// a component with a componentWillUpdate method
					if (oldComponent.componentWillUpdate) {
						oldComponent.componentWillUpdate(newNode.props, newComponent.state);
					}
				}
	
				// references, children & children length
				var newChildren = currentNode.children;
				var oldChildren = oldNode.children;
				var newLength   = newChildren.length;
				var oldLength   = oldChildren.length;
	
				// new children length is 0 clear/remove all children
				if (newLength === 0) {
					// but only if old children is not already cleared
					if (oldLength !== 0) {
						oldNode._node.textContent = '';
						oldNode.children = newChildren;
					}	
				}
				// newNode has children
				else {
					var parentNode = oldNode._node;
					var hasKeys = false;
					var diffKeys = false;
					var oldKeys;
					var newKeys;
	
					// for loop, the end point being which ever is the 
					// greater value between newLength and oldLength
					for (var i = 0; i < newLength || i < oldLength; i++) {
						var newChild = newChildren[i] || nodEmpty;
						var oldChild = oldChildren[i] || nodEmpty;
						var action   = patch(newChild, oldChild, true);
	
						// if action dispatched, 
						// 1 - remove, 2 - add, 3 - text update, 4 - replace, 5 - key
						if (action !== 0) {
							if (diffKeys) {
								action = 5;
							}
	
							switch (action) {
								// remove operation
								case 1: {
									// remove dom node, remove old child
									removeNode(oldChildren.pop(), parentNode);
	
									break;
								}
								// add operation
								case 2: {
									// append dom node, push new child
									appendNode(
										oldChildren[oldChildren.length] = newChild, 
										parentNode, 
										createNode(newChild, null, null)
									);
	
									break;
								}
								// text operation
								case 3: {
									// replace dom node text, replace old child text
									oldChild._node.nodeValue = oldChild.children = newChild.children;
	
									break;
								}
								// replace operation
								case 4: {
									// replace dom node, replace old child
									replaceNode(
										oldChildren[i] = newChild, 
										oldChild, 
										parentNode, 
										createNode(newChild, null, null)
									);
	
									break;
								}
								// keyed operation
								case 5: {
									var newKey = newChild.props.key;
									var oldKey = oldChild.props.key;
	
									// initialize key hash maps
									if (hasKeys === false) {
										hasKeys = true;
										oldKeys = {};
										newKeys = {};
									}
	
									// opt for keyed diffing if atleast one node has different keys
									if (diffKeys === false && newKey !== oldKey) {
										diffKeys = true;
									}
	
									// register key
									newKeys[newKey] = (newChild._index = i, newChild);
									oldKeys[oldKey] = (oldChild._index = i, oldChild);
	
									break;
								}
							}
						}
					}
				}
	
				// reconcile keyed children
				if (diffKeys) {
					// offloaded to another function to keep the type feedback 
					// of this function to a minimum when non-keyed
					keyed(
						newKeys, 
						oldKeys, 
						parentNode, 
						oldNode, 
						newChildren, 
						oldChildren, 
						newLength, 
						oldLength
					);
				}
	
				// patch props only if oldNode is not a textNode 
				// and the props objects of the two nodes are not equal
				if (currentNode.props !== oldNode.props) {
					patchProps(currentNode, oldNode); 
				}
	
				// a component with a componentDidUpdate method
				if (oldNodeType === 2 && oldComponent.componentDidUpdate) {
					oldComponent.componentDidUpdate(newNode.props, newComponent.state);
				}
			}
		}
	
		return 0;
	}
	
	
	/**
	 * patch keyed nodes
	 *
	 * @param {Object}  newKeys
	 * @param {Object}  oldKeys
	 * @param {VNode}   oldNode
	 * @param {Node}    parentNode
	 * @param {VNode[]} newChildren
	 * @param {VNode[]} oldChildren
	 * @param {number}  newLength
	 * @param {number}  oldLength
	 */
	
	// var index = 0;
	
	function keyed (newKeys, oldKeys, parentNode, oldNode, newChildren, oldChildren, newLength, oldLength) {
		var reconciled   = new Array(newLength);
		var children     = parentNode.children;
		var length       = children.length;
		var delOffset    = 0;
		var addOffset    = 0;
	
		for (var i = 0; i < oldLength; i++) {
			var oldChild = oldChildren[i];
			var oldKey   = oldChild.props.key;
			var newChild = newKeys[oldKey];
	
			// removed
			if (newChild === void 0) {
				delOffset++;
	
				removeNode(oldChild, parentNode);
			}
	
			// update old indexes
			if (delOffset !== 0) {
				oldChild._index -= delOffset;
			}
		}
	
		// update length
		length -= delOffset;
	
		for (var j = 0; j < newLength; j++) {
			var newChild = newChildren[j];
			var newKey   = newChild.props.key;
			var oldChild = oldKeys[newKey];
	
			// exists
			if (oldChild) {
				var index = oldChild._index;
	
				// moved
				if (index+addOffset !== j) {
					parentNode.insertBefore(oldChild._node, children[j]);
				}
	
				reconciled[j] = oldChild; 	
			} else {
				reconciled[j] = newChild;
	
				addOffset++;
	
				if (j < length) {
					// insert
					insertNode(newChild, children[j], parentNode, createNode(newChild, null, null));
				} else {
					// append
					appendNode(newChild, parentNode, createNode(newChild, null, null));
				}
	
				length++;
			}		
		}
	
		oldNode.children = reconciled;
	}
	/**
	 * assign prop for create element
	 * 
	 * @param  {Node}       target
	 * @param  {Object}     props
	 * @param  {number}     onlyEvents
	 * @param  {Component}  component
	 */
	function assignProps (target, props, onlyEvents, component) {
		for (var name in props) {
			assignProp(target, name, props, onlyEvents, component);
		}
	}
	
	
	/**
	 * assign prop for create element
	 * 
	 * @param  {Node}       target
	 * @param  {string}     name
	 * @param  {Object}     props
	 * @param  {number}     onlyEvents,
	 * @param  {Component}  component
	 */
	function assignProp (target, name, props, onlyEvents, component) {
		var propValue = props[name];
	
		if (isEventName(name)) {
			var eventName = extractEventName(name);
	
			if (typeof propValue !== 'function') {
				var cache = component._cache === null ? component._cache = {} : component._cache;
	
				target.addEventListener(
					eventName, 
					cache[eventName] || bindEvent(eventName, propValue, cache, component)
				)
			} else {
				target.addEventListener(eventName, propValue);
			}
		} else if (onlyEvents === false) {
			// add attribute
			updateProp(target, 'setAttribute', name, propValue, props.xmlns);
		}
	}
	
	
	/**
	 * patch props
	 * 
	 * @param  {VNode} newNode
	 * @param  {VNode} oldNode
	 */
	function patchProps (newNode, oldNode) {
		var diff   = diffProps(newNode, oldNode, newNode.props.xmlns || '', []);
		var length = diff.length;
	
		// if diff length > 0 apply diff
		if (length !== 0) {
			var target = oldNode._node;
	
			for (var i = 0; i < length; i++) {
				var prop = diff[i];
				// [0: action, 1: name, 2: value, namespace]
				updateProp(target, prop[0], prop[1], prop[2], prop[3]);
			}
	
			oldNode.props = newNode.props;
		}
	}
	
	
	/**
	 * collect prop diffs
	 * 
	 * @param  {VNode}   newNode 
	 * @param  {VNode}   oldNode 
	 * @param  {string}  namespace
	 * @param  {Array[]} propsDiff
	 * @return {Array[]}          
	 */
	function diffProps (newNode, oldNode, namespace, diff) {
		// diff newProps
		for (var newName in newNode.props) { 
			diffNewProps(newNode, oldNode, newName, namespace, diff); 
		}
	
		// diff oldProps
		for (var oldName in oldNode.props) { 
			diffOldProps(newNode, oldName, namespace, diff); 
		}
	
		return diff;
	}
	
	
	/**
	 * diff newProps agains oldProps
	 * 
	 * @param  {VNode}   newNode 
	 * @param  {VNode}   oldNode 
	 * @param  {string}  newName
	 * @param  {string}  namespace
	 * @param  {Array[]} diff
	 * @return {Array[]}          
	 */
	function diffNewProps (newNode, oldNode, newName, namespace, diff) {
		var newValue = newNode.props[newName];
		var oldValue = oldNode.props[newName];
	
		if (newValue != null && oldValue !== newValue) {
			diff[diff.length] = ['setAttribute', newName, newValue, namespace];
		}
	}
	
	
	/**
	 * diff oldProps agains newProps
	 * 
	 * @param  {VNode}   newNode 
	 * @param  {Object}  oldName 
	 * @param  {string}  namespace
	 * @param  {Array[]} diff
	 * @return {Array[]}          
	 */
	function diffOldProps (newNode, oldName, namespace, diff) {
		var newValue = newNode.props[oldName];
	
		if (newValue == null) {
			diff[diff.length] = ['removeAttribute', oldName, '', namespace];
		}
	}
	
	
	/**
	 * assign/update/remove prop
	 * 
	 * @param  {Node}   target
	 * @param  {string} action
	 * @param  {string} name
	 * @param  {*}      propValue
	 * @param  {string} namespace
	 */
	function updateProp (target, action, name, propValue, namespace) {
		// avoid refs, keys, events and xmlns namespaces
		if (name === 'ref' || 
			name === 'key' || 
			isEventName(name) || 
			propValue === nsSvg || 
			propValue === nsMath
		) {
			return;
		}
	
		// if xlink:href set, exit, 
		if (name === 'xlink:href') {
			return (target[action + 'NS'](nsXlink, 'href', propValue), void 0);
		}
	
		var isSVG = false;
		var propName;
	
		// normalize class/className references, i.e svg className !== html className
		// uses className instead of class for html elements
		if (namespace === nsSvg) {
			isSVG = true;
			propName = name === 'className' ? 'class' : name;
		} else {
			propName = name === 'class' ? 'className' : name;
		}
	
		var targetProp = target[propName];
		var isDefinedValue = propValue != null && propValue !== false;
	
		// objects, adds property if undefined, else, updates each memeber of attribute object
		if (isDefinedValue && typeof propValue === 'object') {
			targetProp === void 0 ? target[propName] = propValue : updatePropObject(propValue, targetProp);
		} else {
			if (targetProp !== void 0 && isSVG === false) {
				target[propName] = propValue;
			} else {
				if (isDefinedValue) {
					// reduce value to an empty string if true, <tag checked=true> --> <tag checked>
					if (propValue === true) { 
						propValue = ''; 
					}
	
					target[action](propName, propValue);
				} else {
					// remove attributes with false/null/undefined values
					target.removeAttribute(propName);
				}
			}
		}
	}
	
	
	/**
	 * update prop objects, i.e .style
	 * 
	 * @param  {Object} value
	 * @param  {*}      targetAttr
	 */
	function updatePropObject (value, targetAttr) {
		for (var propName in value) {
			var propValue = value[propName] || null;
	
			// if targetAttr object has propName, assign
			if (propName in targetAttr) {
				targetAttr[propName] = propValue;
			}
		}
	}
	
	
	/**
	 * create element
	 * 
	 * @param  {VNode}      subject
	 * @param  {?Component} component
	 * @param  {?string}    namespace
	 * @return {Node}
	 */
	function createNode (subject, component, namespace) {
		var nodeType = subject.nodeType;
		
		if (nodeType === 3) {
			// textNode
			return subject._node = document.createTextNode(subject.children);
		} else {
			// element
			var element;
			var props;
	
			if (subject._node) {
				// hoisted vnode
				props   = subject.props;
				element = subject._node;
			} else {
				// create
				var newNode  = nodeType === 2 ? extractComponent(subject) : subject;
				var type     = newNode.type;
				var children = newNode.children;
				var length   = children.length;
	
				props = newNode.props;
	
				// assign namespace
				if (props.xmlns !== void 0) { 
					namespace = props.xmlns; 
				}
	
				// if namespaced, create namespaced element
				if (namespace !== null) {
					// if undefined, assign svg namespace
					if (props.xmlns === void 0) {
						props.xmlns = namespace;
					}
	
					element = document.createElementNS(namespace, type);
				} else {
					if (newNode.nodeType === 11) {
						element = document.createDocumentFragment();
					} else {
						element = document.createElement(type);
					}
				}
	
				// vnode has component attachment
				if (subject._owner !== null) {
					(component = subject._owner)._vnode._node = element;
	
					// stylesheets
					if (component.stylesheet) {
						if (component.stylesheet.styler === void 0) {
							// create
							stylesheet(component, subject.type)(element);
						} else {
							// namespace
							component.stylesheet(element);
						}
					}
				}
	
				if (length !== 0) {
					// create children
					for (var i = 0; i < length; i++) {
						var newChild = children[i];
	
						// hoisted nodes, clone
						if (newChild._node) {
							newChild = children[i] = VNode(
								newChild.nodeType,
								newChild.type,
								newChild.props,
								newChild.children,
								newChild._node.cloneNode(true),
								null,
								null
							);
						}
	
						// append child
						appendNode(newChild, element, createNode(newChild, component, namespace));					
					}
				}
	
				if (props !== objEmpty) {
					// refs
					if (props.ref) {
						props.ref.call(component, element);
					}
	
					// initialize props
					assignProps(element, props, false, component);
				}
	
				// cache element reference
				subject._node = element;
			}
	
			return element;
		}
	}
	
	
	/**
	 * append element
	 *
	 * @param {VNode} newNode
	 * @param {Node}  parentNode
	 * @param {Node}  nextNode
	 */
	function appendNode (newNode, parentNode, nextNode) {
		if (newNode._owner !== null && newNode._owner.componentWillMount) {
			newNode._owner.componentWillMount(nextNode);
		}
	
		// append node
		parentNode.appendChild(nextNode);
	
		if (newNode._owner !== null && newNode._owner.componentDidMount) {
			newNode._owner.componentDidMount(nextNode);
		}
	}
	
	
	/**
	 * insert element
	 *
	 * @param {VNode} newNode
	 * @param {Node}  oldNode
	 * @param {Node}  parentNode
	 * @param {Node}  nextNode
	 */
	function insertNode (newNode, oldNode, parentNode, nextNode) {
		if (newNode._owner !== null && newNode._owner.componentWillMount) {
			newNode._owner.componentWillMount(nextNode);
		}
	
		// insert node
		parentNode.insertBefore(nextNode, oldNode);
	
		if (newNode._owner !== null && newNode._owner.componentDidMount) {
			newNode._owner.componentDidMount(nextNode);
		}
	}
	
	
	/**
	 * remove element
	 *
	 * @param {VNode} oldNode
	 * @param {Node}  parentNode
	 */
	function removeNode (oldNode, parentNode) {
		if (oldNode._owner !== null && oldNode._owner.componentWillUnmount) {
			oldNode._owner.componentWillUnmount(oldNode._node);
		}
	
		// remove node
		parentNode.removeChild(oldNode._node);
	
		// clear references
		oldNode._node = null;
	}
	
	
	/**
	 * replace element
	 *
	 * @param {VNode} newNode
	 * @param {VNode} oldNode
	 * @param {Node}  parentNode 
	 * @param {Node}  nextNode
	 */
	function replaceNode (newNode, oldNode, parentNode, nextNode) {
		if (oldNode._owner !== null && oldNode._owner.componentWillUnmount) {
			oldNode._owner.componentWillUnmount(oldNode._node);
		}
	
		if (newNode._owner !== null && newNode._owner.componentWillMount) {
			newNode._owner.componentWillMount(nextNode);
		}
	
		// replace node
		parentNode.replaceChild(nextNode, oldNode._node);
		
		if (newNode._owner !== null && newNode._owner.componentDidMount) {
			newNode._owner.componentDidMount(nextNode);
		}
	
		// clear references
		oldNode._node = null;
	}
	
	
	/**
	 * extract event name from prop
	 * 
	 * @param  {string} name
	 * @return {string}
	 */
	function extractEventName (name) {
		return name.substring(2).toLowerCase();
	}
	
	
	/**
	 * check if a name is an event-like name, i.e onclick, onClick...
	 * 
	 * @param  {string}  name
	 * @return {boolean}
	 */
	function isEventName (name) {
		return name.charCodeAt(0) === 111 && name.charCodeAt(1) === 110 && name.length > 3;
	}
	
	
	/**
	 * bind event
	 *
	 * @param  {string}    name
	 * @param  {Object}    value
	 * @param  {Object}    cache
	 * @param  {Component} component
	 * @return {function}
	 */
	function bindEvent (name, value, cache, component) {
		var bind = value.bind;
		var data = value.with;
	
		var preventDefault = value.preventDefault === void 0 || value.preventDefault === true;
	
		if (typeof bind === 'object') {
			var property = bind.property || data;
	
			return cache[name] = function (e) {
				preventDefault && e.preventDefault();
	
				var target = e.currentTarget || e.target || this;
				var value  = data in target ? target[data] : target.getAttribute(data);
	
				// update component state
				component.state[property] = value;
	
				// update component
				component.forceUpdate();
			}
		} else {
			return cache[name] = function (e) {
				preventDefault && e.preventDefault();
				bind.call(data, data, e);
			}
		}
	}
	/**
	 * extract component
	 * 
	 * @param  {VNode} subject
	 * @return {VNode} 
	 */
	function extractComponent (subject, mutate) {
		var candidate;
		var type = subject.type;
	
		if (type._component !== void 0) {
			// cache
			candidate = type._component;
		} else if (type.constructor === Function && type.prototype.render === void 0) {
			// function components
			candidate = type._component = createClass(type);
		} else {
			// class / createClass components
			candidate = type;
		}
	
		// create component instance
		var component = subject._owner = new candidate(subject.props);
	
		// add children to props if not empty
		if (subject.children.length !== 0) {
			component.props.children = subject.children;
		}
		
		// retrieve vnode
		var vnode = extractRender(component);
	
		// if keyed, assign key to vnode
		if (subject.props.key !== void 0 && vnode.props.key === void 0) {
			vnode.props.key = subject.props.key;
		}
	
		// if render returns a component, extract that component
		if (vnode.nodeType === 2) {
			vnode = extractComponent(vnode);
		}
	
		// replace props and children of old vnode
		subject.props    = vnode.props
		subject.children = vnode.children;
	
		// assign reference to component and return vnode
		return component._vnode = vnode;
	}
	
	
	/**
	 * extract a render function
	 *
	 * @param  {Component} component
	 * @return {VNode}
	 */
	function extractRender (component) {
		// extract render
		var vnode = component.render(component.props, component.state, component) || VEmpty();
	
		// if vnode, else fragment
		return vnode.nodeType !== void 0 ? vnode : VFragment(vnode);
	}
	
	
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * Server Side Render
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * server side render to string
	 * 
	 * @param  {(Object|function)}  subject
	 * @param  {(string|function)=} template
	 * @return {string}
	 */
	function renderToString (subject, template) {
		var lookup = {styles: '', ids: {}};
		var body   = renderVNodeToString(renderVNode(subject), lookup);
		var styles = lookup.styles;
		var style  = styles.length !== 0 ? '<style>'+styles+'<style>' : '';
	
		if (template) {
			if (typeof template === 'string') {
				return template.replace('@body', body+style);
			} else {
				return template(body, styles);
			}
		} else {
			return body+style;
		}
	}
	
	
	/**
	 * server-side render to stream
	 * 
	 * @param  {(VNode|Component)} subject 
	 * @param  {string=}           template
	 * @return {Stream}
	 */
	function renderToStream (subject, template) {	
		return subject ? (
			new Stream(subject, template == null ? null : template.split('@body'))
		) : function (subject) {
			return new Stream(subject);
		}
	}
	
	
	/**
	 * Stream
	 * 
	 * @param {(VNode|Component)} subject
	 * @param {string=}           template
	 */
	function Stream (subject, template) {
		this.initial  = 0;
		this.stack    = [];
		this.lookup   = {styles: '', ids: {}};
		this.template = template;
		this.node     = renderVNode(subject);
	
		readable.call(this);
	}
	
	
	/**
	 * Stream prototype
	 * 
	 * @type {Object}
	 */
	Stream.prototype = server ? Object.create(readable.prototype, {
		_type: {
			value: 'text/html'
		},
		_read: {
			value: function () {
				if (this.initial === 1 && this.stack.length === 0) {
					var style = this.lookup.styles;
	
					// if there are styles, append
					if (style.length !== 0) {
						this.push('<style>'+style+'</style>');
					}
	
					// has template, push closing
					if (this.template) {
						this.push(this.template[1]);
					}
	
					// end of stream
					this.push(null);
	
					// reset `initial` identifier
					this.initial = 0;			
				} else {
					// start of stream
					if (this.initial === 0) {
						this.initial = 1;
	
						// has template, push opening 
						this.template && this.push(this.template[0]);
					}
	
					// pipe a chunk
					this._pipe(this.node, true, this.stack, this.lookup);
				}
			}
		},
		_pipe: {
			value: function (subject, flush, stack, lookup) {
				// if there is something pending in the stack give that priority
				if (flush && stack.length !== 0) {
					stack.pop()(this); return;
				}
	
				var nodeType = subject.nodeType;
	
				// text node, sync
				if (nodeType === 3) {
					this.push(escape(subject.children)); return;
				}
	
				var vnode;
	
				// if component
				if (nodeType === 2) {
					// if cached
					if (subject.type._html !== void 0) {
						this.push(subject.type._html); return;
					} else {
						vnode = extractComponent(subject);
					}
				} else {
					vnode = subject;
				}
	
				// references
				var type     = vnode.type;
				var props    = vnode.props;
				var children = vnode.children;
	
				var propsStr = renderStylesheetToString(
					nodeType, subject._owner, subject.type, renderPropsToString(props), lookup
				);
	
				if (isVoid[type] === 0) {
					// <type ...props>
					this.push('<'+type+propsStr+'>');
				} else {
					var opening = '';
					var closing = '';
	
					// fragments do not have opening/closing tags
					if (vnode.nodeType !== 11) {
						// <type ...props>...children</type>
						opening = '<'+type+propsStr+'>';
						closing = '</'+type+'>';
					}
	
					if (props.innerHTML !== void 0) {
						// special case when a prop replaces children
						this.push(opening+props.innerHTML+closing);
					} else {
						var length = children.length;
	
						if (length === 0) {
							// no children, sync
							this.push(opening+closing);
						} else if (length === 1 && children[0].nodeType === 3) {
							// one text node child, sync
							this.push(opening+escape(children[0].children)+closing);
						} else {
							// has children, async
							// since we cannot know ahead of time the number of children
							// this is operation is split into asynchronously added chunks of data
							var index = 0;
							// add one more for the closing tag
							var middlwares = length + 1;
	
							var doctype = type === 'html';
							var eof = doctype || type === 'body';
	
							// for each _read if queue has middleware
							// middleware execution will take priority
							var middleware = function (stream) {
								// done, close html tag, delegate next middleware
								if (index === length) {
									// if the closing tag is body or html
									// we want to push the styles before we close them
									if (eof && lookup.styles.length !== 0) {
										stream.push('<style>'+lookup.styles+'</style>');
										// clear styles, avoid adding duplicates
										lookup.styles = '';
									}
	
									stream.push(closing);
								} else {
									stream._pipe(children[index++], false, stack, lookup);
								}
							}
	
							// if opening html tag, push doctype first
							if (doctype) {
								this.push('<!doctype html>');
							}
	
							// push opening tag
							this.push(opening);
	
							// push middlwares
							for (var i = 0; i < middlwares; i++) {
								stack[stack.length] = middleware;
							}
						}
					}
				}
			}
		}
	}) : objEmpty;
	
	
	/**
	 * renderToCache
	 * 
	 * @param  {Object} subject
	 * @return {Object} subject
	 */
	function renderToCache (subject) {
		if (subject) {
			// array, run all VNodes through renderToCache
			if (subject.constructor === Array) {
				for (var i = 0, length = subject.length; i < length; i++) {
					renderToCache(subject[i]);
				}
			} else if (subject.nodeType === void 0) {
				subject._html = renderToString(subject);
			} else if (subject.nodeType === 2 && subject.type._html === void 0) {
				subject.type._html = renderToString(subject);
			}
		}
	
		return subject;
	}
	
	
	/**
	 * render stylesheet to string
	 *
	 * @param  {number}              nodeType
	 * @param  {Component}           component
	 * @param  {function}            constructor
	 * @param  {string}              output   
	 * @param  {Object<string, any>} lookup
	 * @return {string}          
	 */
	function renderStylesheetToString (nodeType, component, constructor, output, lookup) {
		// stylesheet
		if (nodeType === 2) {
			// stylesheets
			if (component.stylesheet) {
				var id = component.stylesheet.styler;
	
				if (id === void 0) {
					// create
					lookup.styles += stylesheet(component, constructor)(null);
					lookup.ids[id = component.stylesheet.styler] = true;
				}
			 	else if (!lookup.ids[id]) {
					lookup.styles += component.stylesheet(null);
					lookup.ids[id] = true;
				}
	
				// add attribute to element
				output += ' '+nsStyle+'='+'"'+id+'"';
			}
		}
	
		return output;
	}
	
	
	/**
	 * render props to string
	 * 
	 * @param  {Object<string, any>} props
	 * @return {string}
	 */
	function renderPropsToString (props) {
		var string = '';
	
		// construct props string
		if (props !== objEmpty && props !== null) {
			each(props, function (value, name) {
				// value --> <type name=value>, exclude props with undefined/null/false as values
				if (value != null && value !== false) {
					var type = typeof value;
	
					if (type === 'string' && value) {
						value = escape(value);
					}
	
					// do not process these props
					if (
						type !== 'function' &&
						name !== 'key' && 
						name !== 'ref' && 
						name !== 'innerHTML'
					) {
						if (type !== 'object') {
							if (name === 'className') { 
								name = 'class'; 
							}
	
							// if falsey/truefy checkbox=true ---> <type checkbox>
							string += ' ' + (value === true ? name : name + '="' + value + '"');
						} else {
							// if style objects
							var style = '';
	
							each(value, function (value, name) {
								// if camelCase convert to dash-case 
								// i.e marginTop --> margin-top
								if (name !== name.toLowerCase()) {
									name.replace(regStyleCamel, '$1-').replace(regStyleVendor, '-$1').toLowerCase();
								}
	
								style += name + ':' + value + ';';
							});
	
							string += name + '="' + value + '"';
						}
					}
				}
			});
		}
	
		return string;
	}
	
	
	/**
	 * render a VNode to string
	 * 
	 * @param  {VNode}               subject
	 * @param  {Object<string, any>} lookup
	 * @return {string}  
	 */
	function renderVNodeToString (subject, lookup) {
		var nodeType = subject.nodeType;
	
		// textNode
		if (nodeType === 3) {
			return escape(subject.children);
		}
	
		var vnode;
	
		// if component
		if (nodeType === 2) {
			// if cached
			if (subject.type._html !== void 0) {
				return subject.type._html;
			} else {
				vnode = extractComponent(subject);
			}
		} else {
			vnode = subject;
		}
	
		// references
		var type = vnode.type;
		var props = vnode.props;
		var children = vnode.children;
	
		var childrenStr = '';
	
		if (props.innerHTML !== void 0) {
			// special case when a prop replaces children
			childrenStr = props.innerHTML;
		} else {		
			// construct children string
			if (children.length !== 0) {
				for (var i = 0, length = children.length; i < length; i++) {
					childrenStr += renderVNodeToString(children[i], lookup);
				}
			}
		}
	
		var propsStr = renderStylesheetToString(
			nodeType, subject._owner, subject.type, renderPropsToString(props), lookup
		);
	
		if (vnode.nodeType === 11) {
			return childrenStr;
		} else if (isVoid[type] === 0) {
			// <type ...props>
			return '<'+type+propsStr+'>';
		} else {
			// <type ...props>...children</type>
			return '<'+type+propsStr+'>'+childrenStr+'</'+type+'>';
		}
	}
	
	
	/**
	 * render virtual node
	 * 
	 * @param  {(function|Object)} subject
	 * @return {VNode}
	 */
	function renderVNode (subject) {
		if (subject.type) {
			return subject;
		} else {
			return typeof subject === 'function' ? VComponent(subject) : createElement('@', null, subject);
		}
	}
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * stream
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * create stream
	 * 
	 * @param  {(function(resolve, reject)|*)} value
	 * @param  {(function(...*)|boolean)}      middleware
	 * @return {function}
	 */
	function stream (value, middleware) {
		var store;
	
		// this allows us to return values in a .then block that will
		// get passed to the next .then block
		var chain = { then: null, catch: null };
	
		// .then/.catch listeners
		var listeners = { then: [], catch: [] };
	
		// predetermine if a middlware was passed
		var hasMiddleware = middleware != null;
	
		// predetermine if the middlware passed is a function
		var middlewareFunc = hasMiddleware && typeof middleware === 'function';
	
		function Stream (value) {
			// received value, update stream
			if (arguments.length !== 0) {
				return (setTimeout(dispatch, 0, 'then', store = value), Stream);
			} else {
				// if you pass a middleware function i.e a = stream(1, String)
				// the stream will return 1 processed through String
				// if you pass a boolean primitive the assumtion is made that the store
				// is a function and that it should return the functions return value
				if (hasMiddleware) {
					return middlewareFunc ? middleware(store) : store();
				} else {
					return store;
				}
			}
		}
	
		// dispatcher, dispatches listerners
		function dispatch (type, value) {
			var collection = listeners[type];
			var length = collection.length;
	
			if (length !== 0) {
				// executes a listener, adding the return value to the chain
				var action = function (listener) {
					// link in the .then / .catch chain
					var link = listener(chain[type] || value);
					// add to chain if defined
					if (link !== void 0) { chain[type] = link; }
				}
	
				for (var i = 0; i < length; i++) {
					sandbox(action, reject, collection[i]);
				}
			}
		}
	
		// resolve value
		function resolve (value) {
			return Stream(value); 
		}
	
		// reject
		function reject (reason) { 
			setTimeout(dispatch, 0, 'catch', reason);
		}
	
		// add done listener, ends the chain
		function done (listener, onerror) {
			then(listener, onerror || true);
		}
		
		// add catch/error listener
		function error (listener) {
			return push('catch', listener, null);
		}
	
		// ...JSON.strinfigy()
		function toJSON () {
			return store;
		}
	
		// {function}.valueOf()
		function valueOf () {
			return store; 
		}
	
		// push listener
		function push (type, listener, end) {
			listeners[type].push(function (chain) {
				return listener(chain);
			});
	
			return end === null ? Stream : void 0;
		}
	
		// add then listener
		function then (listener, onerror) {
			if (onerror) {
				error(onerror);
			}
	
			if (listener) {
				return push('then', listener, onerror || null);
			}
		}
	
		// create a map
		function map (callback) {
			return stream(function (resolve) {
				resolve(function () { return callback(Stream()); });
			}, true);
		}
	
		// end/reset a stream
		function end (value) {
			value !== void 0 && (store = value);
	
			chain.then      = null;
			chain.catch     = null; 
			listeners.then  = []; 
			listeners.catch = [];
		}
	
		// assign public methods
		Stream.then    = then;
		Stream.done    = done;
		Stream.catch   = error;
		Stream.map     = map;
		Stream.end     = end;
		Stream.valueOf = valueOf;
		Stream.toJSON  = toJSON;
		// signature
		Stream._stream = true;
	
		// acts like a promise if a function is passed as value
		typeof value === 'function' ? value(resolve, reject) : Stream(value);
	
		return Stream;
	}
	
	
	/**
	 * create new stream in resolved state
	 * 
	 * @param  {*}          value
	 * @return {function}
	 */
	stream.resolve = function (value) {
		return stream(function (resolve, reject) {
			resolve(value);
		});
	};
	
	
	/**
	 * create new stream in rejected state
	 * 
	 * @param  {*}     value 
	 * @return {function}
	 */
	stream.reject = function (value) {
		return stream(function (resolve, reject) {
			reject(value);
		});
	};
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * request
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * request constructor
	 * 
	 * @return {function}
	 */
	function http () {
		/**
		 * serialize + encode object
		 * 
		 * @example serialize({url:'http://.com'}) //=> 'url=http%3A%2F%2F.com'
		 * 
		 * @param  {Object} object   
		 * @param  {string} prefix
		 * @return {string}
		 */
		function serialize (object, prefix) {
			var arr = [];
		
			each(object, function (value, key) {
				var prefixValue = prefix !== void 0 ? prefix + '[' + key + ']' : key;
		
				// when the value is equal to an object 
				// we have somethinglike value = {name:'John', addr: {...}}
				// re-run param(addr) to serialize 'addr: {...}'
				arr[arr.length] = typeof value == 'object' ? 
										serialize(value, prefixValue) :
										encodeURIComponent(prefixValue) + '=' + encodeURIComponent(value);
			});
		
			return arr.join('&');
		}
		
		
		/**
		 * retrieve and format response
		 * 
		 * @param  {XMLHttpRequest} xhr
		 * @param  {string}         responseType
		 * @param  {function}       reject
		 * @return {(Node|string|Object)}
		 */
		function response (xhr, responseType, reject) {			
			var data, header = xhr.getResponseHeader('Content-Type');
		
			if (!xhr.responseType || xhr.responseType === 'text') {
				data = xhr.responseText;
			} else if (xhr.responseType === 'document') {
				data = responseXML;
			} else {
				data = response;
			}
		
			// response format
			if (!responseType) {
				responseType = (header.indexOf(';') > -1 ? header.split(';')[0].split('/') : header.split('/'))[1];
			}
		
			var body;
		
			if (responseType === 'json') {
				body = sandbox(JSON.parse, reject, data);
			} else if (responseType === 'html' || responseType === 'document') {
				body = (new DOMParser()).parseFromString(data, 'text/html');
			} else {
				body = data;
			}
		
			return body;
		}
		
		
		/**
		 * create http request
		 * 
		 * @param  {string}            method
		 * @param  {string}            uri
		 * @param  {(Object|string)=}  payload
		 * @param  {string=}           enctype
		 * @param  {string=}           responseType
		 * @param  {boolean=}          withCredential
		 * @param  {initial=}          initial
		 * @param  {function=}         config
		 * @param  {string=}           username
		 * @param  {string=}           password
		 * @return {function}
		 */
		function create (
			method, uri, payload, enctype, responseType, withCredentials, initial, headers, config, username, password
		) {
			// return a a stream
			return stream(function (resolve, reject, stream) {
				// if XMLHttpRequest constructor absent, exit early
				if (window.XMLHttpRequest == null) {
					return;
				}
		
				// create xhr object
				var xhr = new window.XMLHttpRequest();
		
				// retrieve browser location 
				var location = window.location;
		
				// create anchor element
				var anchor = document.createElement('a');
				
				// plug uri as href to anchor element, 
				// to extract hostname, port, protocol properties
				anchor.href = uri;
		
				// check if cross origin request
				var isCrossOriginRequest = !(
					anchor.hostname   === location.hostname && 
					anchor.port       === location.port &&
					anchor.protocol   === location.protocol && 
					location.protocol !== 'file:'
				);
		
				// remove reference
				anchor = null;
		
				// open request
				xhr.open(method, uri, true, username, password);
		
				// on success resolve
				xhr.onload  = function () { resolve(response(this, responseType, reject)); };
				// on error reject
				xhr.onerror = function () { reject(this.statusText); };
				
				// cross origin request cookies
				isCrossOriginRequest && withCredentials && (xhr.withCredentials = true);
		
				// assign content type and payload
				if (method === 'POST') {
					xhr.setRequestHeader('Content-Type', enctype);
		
					if (enctype.indexOf('x-www-form-urlencoded') > -1) {
						payload = serialize(payload);
					} else if (enctype.indexOf('json') > -1) {
						payload = JSON.stringify(payload);
					}
				}
		
				if (headers != null) {
					each(headers, function (value, name) {
						xhr.setRequestHeader(name, value);
					});
				}
		
				// if, assign inital value of stream
				initial !== void 0 && resolve(initial);
		
				// config, expose underlying XMLHttpRequest object
				// allows us to save a reference to it and call abort when required
				config != null && typeof config === 'function' && config(xhr);
		
				// send request
				payload !== void 0 ? xhr.send(payload) : xhr.send();
			});
		}
		
		
		/**
		 * create request method
		 * 
		 * @param  {string}
		 * @return {function}
		 */
		function method (method) {
			return function (
				url, payload, enctype, responseType, withCredentials, initial, headers, config, username, password
			) {
				// encode url
				var uri = encodeURI(url);
		
				// enctype syntax sugar
				switch (enctype) {
					case 'json': { enctype = 'application/json'; break; }
					case 'text': { enctype = 'text/plain'; break; }
					case 'file': { enctype = 'multipart/form-data'; break; }
					default:     { enctype = 'application/x-www-form-urlencoded'; }
				}
		
				// if has payload && GET pass payload as query string
				if (method === 'GET' && payload) {
					uri = uri + '?' + (typeof payload === 'object' ? serialize(payload) : payload);
				}
		
				// return promise-like stream
				return create(
					method, uri, payload, enctype, responseType, withCredentials, initial, headers, config, username, password
				);
			}
		}
		
		
		/**
		 * request constructor
		 * 
		 * request({method: 'GET', url: '?'}) === request.get('?')
		 * 
		 * @param  {Object} subject
		 * @return {function}
		 */
		function request (subject) {
			if (typeof subject === 'string') {
				return request.get(subject);
			} else {
				return request[(subject.method || 'GET').toLowerCase()](
					subject.url, 
					subject.payload || subject.data,
					subject.enctype, 
					subject.responseType,
					subject.withCredentials,
					subject.initial,
					subject.headers,
					subject.config,
					subject.username, 
					subject.password
				);
			}
		}
		
		request.get  = method('GET'),
		request.post = method('POST');
		
		
	
		return request;
	}
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * router
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * router
	 * 
	 * @param  {Object<string, (function|Component)>} routes
	 * @param  {string=}                              address 
	 * @param  {string=}                              initialiser
	 * @param  {(string|Node)=}                       element
	 * @param  {function=}                            middleware
	 * @param  {function=}                            notFound
	 * @return {Object}
	 */
	function router (routes, address, initialiser, element, middleware, notFound) {
		if (typeof routes === 'function') {
			routes = routes();
		}
	
		if (typeof address === 'function') {
			address = address();
		}
	
		if (typeof address === 'object') {
			element     = address.mount;
			initialiser = address.initial;
			middleware  = address.middleware;
			notFound    = address['404'];
			address     = address.directory;
		}
	
		if (middleware !== void 0) {
			each(routes, function (func, uri) {
				routes[uri] = function callback (data) { middleware(func, data, element); };
			});
		} else if (element !== void 0) {
			each(routes, function (component, uri) {
				routes[uri] = function callback (data) { render(VComponent(component, data), element); };
			});
		}
	
		return createRouter(routes, address, initialiser, notFound);
	}
	
	
	/**
	 * router constructor
	 * 
	 * @param {Object<string, (function|Component)>} patterns
	 * @param {string=}                              address
	 * @param {function=}                            initialiser
	 * @param {function=}                            notFound
	 */
	function createRouter (patterns, address, initialiser, notFound) {
		// listens for changes to the url
		function listen () {
			if (interval !== 0) {
				// clear the interval if it's already set
				clearInterval(interval);
				interval = 0;
			}
	
			// start listening for a change in the url
			interval = setInterval(function () {
				href = location.href;
	
				// current url does not equal the url of the browser
				if (href !== current) {
					// update the current and dispatch
					dispatch((current = href).replace(origin, ''));
				}
			}, 40);
		}
	
		// register routes
		function register () {
			// assign routes
			for (var name in patterns) {
				set(name, patterns[name]);
			}
		}
	
		// assign a route
		function set (uri, callback) {
			// - params is where we store variable names
			// i.e in /:user/:id - user, id are variables
			var params = [];
	
			// uri is the url/RegExp that describes the uri match thus
			// given the following /:user/:id/*
			// the pattern will be / ([^\/]+) / ([^\/]+) / (?:.*)
			var pattern = uri.replace(regRoute, function () {
				// id => arguments: 'user', id, undefned
				var id = arguments[2];
				// if, not variable, else, capture variable
				return id != null ? (params[params.length] = id, '([^\/]+)') : '(?:.*)';
			});
	
			// assign a route item
			Object.defineProperty(routes, uri, {
				value: Object.create(null, {
					callback: { value: callback, },
					pattern:  { value: new RegExp((address ? address + pattern : pattern) + '$'), },
					params:   { value: params, }
				}),
				enumerable: true
			});
		}
	
		// called when the listener detects a route change
		function dispatch (current) {
			for (var name in routes) {
				finder(routes[name], name, current);
			}
	
			// if resolved flag is 0 and a notFound function is available
			if (resolved === 0 && notFound !== void 0) {
				notFound({url: current});
			}
	
			// reset resolved flag
			resolved = 0;
		}
	
		// find a match from the available routes
		function finder (route, uri, current) {
			var callback = route.callback;
			var pattern  = route.pattern;
			var params   = route.params;
			var match    = current.match(pattern);
	
			// we have a match
			if (match != null) {
				// create params object to pass to callback
				// i.e {user: 'simple', id: '1234'}
				var data = match.slice(1, match.length);
	
				var args = data.reduce(function (previousValue, currentValue, index) {
					// if this is the first value, create variables store
					if (previousValue === null) {
						previousValue = {url: current};
					}
	
					// name: value, i.e user: 'simple'
					// `vars` contains the keys for variables
					previousValue[params[index]] = currentValue;
	
					return previousValue;
	
					// null --> first value
				}, null) || {uri: current};
	
				callback(args, uri);
	
				// register match
				resolved = 1;
			} else {
				// register not found
				resolved = 0;
			}
		}
	
		// middleware between event and route
		function link (to) {
			var func = typeof to === 'function';
	
			return function (e) {
				var target = e.currentTarget || e.target || this;
				var value  = func ? to(target) : to;
	
				navigate(target[value] || (target.nodeName && target.getAttribute(value)) || value); 
			};
		}
	
		// navigate to a uri
		function navigate (uri) {
			if (typeof uri === 'string') {
				history.pushState(null, null, address ? address + uri : uri);
			}
		}
	
		// resume listener
		function resume () {
			current = location.href;
			listen();
		}
	
		// pause listerner
		function pause () {
			clearInterval(interval);
		}
	
		// stop listening and clear all routes 
		function destroy () {
			pause();
			routes = {};
		}
	
		// manually resolve a route
		function resolve (uri) {
			dispatch(uri);
		}
	
		// normalize rootAddress format
		// i.e '/url/' -> '/url', 47 === `/` character
		if (typeof address === 'string' && address.charCodeAt(address.length - 1) === 47) {
			address = address.substring(0, address.length - 1);
		}
	
		var history  = window.history || objEmpty;
		var location = history.location || window.location;
		var origin   = location.origin;
		var current  = '';
		var href     = '';
		var interval = 0;
		var resolved = 0;
		var routes   = {};
		var api      = Object.defineProperty({
			navigate: navigate,
			back:     history.back, 
			foward:   history.forward, 
			link:     link,
			resume:   resume,
			pause:    pause,
			destroy:  destroy,
			set:      set,
			resolve:  resolve,
			routes:   routes
		}, 'location', {
			get: function () { return current; },
			set: navigate
		});
	
		// register routes
		register();
	
		// state listening if browser enviroment
		if (browser) {
			listen();
		}
	
		// initialiser, if function pass api as args, else string, navigate to uri
		if (initialiser !== void 0) {
			var type = typeof initialiser;
	
			if (type === 'function') {
				// initialiser function
				initialiser(api);
			} else if (type === 'string') {
				// navigate to path
				navigate(initialiser);
			}
		}
	
		return api;
	}
	
	
	
	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * store
	 * 
	 * ---------------------------------------------------------------------------------
	 */
	
	
	/**
	 * creates a store enhancer
	 *
	 * @param   {...function} middlewares
	 * @return  {function}    a store enhancer
	 */
	function applyMiddleware () {
		var middlewares = [];
		var length      = arguments.length;
	
		// passing arguments to a function i.e [].splice() will prevent this function
		// from getting optimized by the VM, so we manually build the array in-line
		for (var i = 0; i < length; i++) {
			middlewares[i] = arguments[i];
		}
	
		return function (Store) {
			return function (reducer, initialState, enhancer) {
				// create store
				var store = Store(reducer, initialState, enhancer);
				var api   = {
					getState: store.getState,
					dispatch: store.dispatch
				};
	
				// create chain
				var chain = [];
	
				// add middlewares to chain
				for (var i = 0; i < length; i++) {
					chain[i] = middlewares[i](api);
				}
	
				// return store with composed dispatcher
				return {
					getState: store.getState, 
					dispatch: composeMiddlewares.apply(null, chain)(store.dispatch), 
					subscribe: store.subscribe,
					connect: store.connect,
					replaceReducer: store.replaceReducer
				};
			}
		}
	}
	
	
	/**
	 * composes single-argument functions from right to left. The right most
	 * function can take multiple arguments as it provides the signature for
	 * the resulting composite function
	 *
	 * @param  {...function} funcs functions to compose
	 * @return {function}          function obtained by composing the argument functions
	 * from right to left. for example, compose(f, g, h) is identical to doing
	 * (...args) => f(g(h(...args))).
	 */
	function composeMiddlewares () {
		var length = arguments.length;
	
		// no functions passed
		if (length === 0) {
			return function (a) { return a; }
		} else {
			// list of functions to compose
			var funcs = [];
	
			// passing arguments to a function i.e [].splice() will prevent this function
			// from getting optimized by the VM, so we manually build the array in-line
			for (var i = 0; i < length; i++) {
				funcs[i] = arguments[i];
			}
	
			// remove and retrieve last function
			// we will use this for the initial composition
			var lastFunc = funcs.pop();
	
			// decrement length of funcs array as a reflection of the above
			length--;
	
			return function () {
				// initial composition
				var output = lastFunc.apply(null, arguments);
					
				// recursively commpose all functions
				while (length--) {
					output = funcs[length](output);
				}
	
				return output;
			}
		}
	}
	
	
	/**
	 * combines a set of reducers
	 * 
	 * @param  {Object<string, function>}  reducers
	 * @return {function}
	 */
	function combineReducers (reducers) {
		var keys   = Object.keys(reducers);
		var length = keys.length;
	
		// create and return a single reducer
		return function (state, action) {
			state = state || {};
	
			var nextState = {};
	
			for (var i = 0; i < length; i++) {
				var key = keys[i]; 
	
				nextState[key] = reducers[key](state[key], action);
			}
	
			return nextState;
		}
	}
	
	
	/**
	 * create store interface
	 * 
	 * @param  {function}  reducer
	 * @param  {*}         initialState
	 * @param  {function=} enhancer
	 * @return {Object}    {getState, dispatch, subscribe, connect, replaceReducer}
	 */
	function createStore (reducer, initialState, enhancer) {
		// exit early, reducer is not a function
		if (typeof reducer !== 'function') {
			throw 'reducer should be a function';
		}
	
		// if initialState is a function and enhancer is undefined
		// we assume that initialState is an enhancer
		if (typeof initialState === 'function' && enhancer === void 0) {
			enhancer = initialState;
			initialState = void 0;
		}
	
		// delegate to enhancer if defined
		if (enhancer !== void 0) {
			// exit early, enhancer is not a function
			if (typeof enhancer !== 'function') {
				throw 'enhancer should be a function';
			}
	
			return applyMiddleware(enhancer)(Store)(reducer, initialState);
		}
	
		// if object, multiple reducers, else, single reducer
		return typeof reducer === 'object' ? Store(combineReducers(reducer)) : Store(reducer);
	}
	
	
	/**
	 * create store constructor
	 * 
	 * @param  {function} reducer
	 * @param  {*}        initialState
	 * @return {Object}   {getState, dispatch, subscribe, connect, replaceReducer}
	 */
	function Store (reducer, initialState) {
		var currentState = initialState;
		var listeners    = [];
	
		// state getter, retrieves the current state
		function getState () {
			return currentState;
		}
	
		// dispatchs a action
		function dispatch (action) {
			if (action.type === void 0) {
				throw 'actions without type';
			}
	
			// update state with return value of reducer
			currentState = reducer(currentState, action);
	
			// dispatch to all listeners
			for (var i = 0, length = listeners.length; i < length; i++) {
				listeners[i](currentState);
			}
	
			return action;
		}
	
		// subscribe to a store
		function subscribe (listener) {
			if (typeof listener !== 'function') {
				throw 'listener should be a function';
			}
	
			// retrieve index position
			var index = listeners.length;
	
			// append listener
			listeners[index] = listener;
	
			// return unsubscribe function
			return function unsubscribe () {
				// for each listener
				for (var i = 0, length = listeners.length; i < length; i++) {
					// if currentListener === listener, remove
					if (listeners[i] === listener) {
						listeners.splice(i, 1);
					}
				}
			}
		}
	
		// replace a reducer
		function replaceReducer (nextReducer) {
			// exit early, reducer is not a function
			if (typeof nextReducer !== 'function') {
				throw 'reducer should be a function';
			}
	
			// replace reducer
			reducer = nextReducer;
	
			// dispath initial action
			dispatch({type: '@/STORE'});
		}
	
		// auto subscribe a component to a store
		function connect (subject, element) {
			var renderer;
	
			// if component and element 
			if (element) {			
				// create renderer add it as a subscriber and return the renderer
				return subscribe(renderer = render(VComponent(subject, currentState, null), element)), renderer;
			} else {
				return subscribe(subject);
			}
		}
	
		// dispath initial action
		dispatch({type: '@/STORE'});
	
		return {
			getState:       getState, 
			dispatch:       dispatch, 
			subscribe:      subscribe,
			connect:        connect,
			replaceReducer: replaceReducer
		};
	}
	
	


	/**
	 * ---------------------------------------------------------------------------------
	 * 
	 * exports
	 * 
	 * ---------------------------------------------------------------------------------
	 */


	if (browser) {
		window.h = createElement;
	}

	return {
		// elements
		createElement:    createElement,
		isValidElement:   isValidElement,
		cloneElement:     cloneElement,
		createFactory:    createFactory,
		VText:            VText,
		VElement:         VElement,
		VSvg:             VSvg,
		VFragment:        VFragment,
		VComponent:       VComponent,
		DOM:              DOM,

		// render
		render:           render,
		renderToString:   renderToString,
		renderToStream:   renderToStream,
		renderToCache:    renderToCache,

		// components
		Component:        Component,
		createClass:      createClass,

		// stores
		createStore:      createStore,
		applyMiddleware:  applyMiddleware,
		combineReducers:  combineReducers,
		
		// utilities
		request:          http(),
		router:           router,
		stream:           stream,

		// version
		version:          version,

		// alias
		h:                createElement,
	};
}));