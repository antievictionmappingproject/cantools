CT.autocomplete.Guesser = CT.Class({
	CLASSNAME: "CT.autocomplete.Guesser",
	_doNothing: function() {},
	_returnTrue: function() { return true; },
	expand: function(cb) {
		this._position();
		this.viewing = true;
		this.node.className = "autocomplete autocomplete-open";
		cb && CT.trans.trans({ node: this.node, cb: cb });
	},
	retract: function() {
		if (!this.viewing)
			return;
		this.viewing = false;
		this.input.blur();
		var acnode = this.node;
		acnode.className = "autocomplete";
		CT.trans.trans({
			node: acnode,
			cb: function() {
				acnode.className = "autocomplete hider";
			}
		});
	},
	tapTag: function(data) {
		this.opts.tapCb(data);
	    this.retract();
	},
	addTag: function(data) {
		var tagName = data[data.label];
		var n = CT.dom.node(tagName, "div", "tagline", "ac" + tagName);
		var tlower = tagName.toLowerCase();
		for (var i = 1; i <= tlower.length; i++)
			n.className += " " + tlower.slice(0, i);
		this.node.firstChild.appendChild(n);
		n.onclick = function() {
			this.tapTag(data);
		}.bind(this);
	},
	_upOne: function(d) {
		if (!CT.dom.id("ac" + d[d.label]))
			this.addTag(d);
	},
	_update: function(data) {
		data.forEach(this._upOne);
	},
	_onUp: function(e) {
		if (!this.viewing) {
			this.opts.expandCb();
			CT.dom.mod({
				className: "tagline",
				show: true
			});
			this.expand(function() {
				this.input.active = true;
				this.input.focus();
			}.bind(this));
			return true;
		}
	},
	_onKeyUp: function(e) {
		e = e || window.event;
		var code = e.keyCode || e.which;
		if (code == 13 || code == 3) {
			this.input.blur();
			this.opts.enterCb(this.input.value);
		} else if (this.input.value) {
			var tagfrag = this.input.value.toLowerCase(),
				targets = CT.dom.className(tagfrag, this.node);
			CT.dom.mod({
				className: "tagline",
				hide: true
			});
			if (targets.length)
				CT.dom.mod({
					className: tagfrag,
					show: true
				});
			else
				this.opts.guessCb(tagfrag, this._update);
			if (!this.viewing)
				this.expand();
		} else CT.dom.mod({
			className: "tagline",
			hide: true
		});
		this.opts.keyUpCb();
	},
	_onTap: function(data) {
		this.input.value = data[data.label];
	},
	_position: function() {
		var ipos = CT.align.offset(this.input);
		this.node.style.width = (this.input.clientWidth + 2) + "px";
		this.node.style.top = (ipos.top + 22) + "px";
		this.node.style.left = (ipos.left + 2) + "px";
	},
	init: function(opts) {
		opts = this.opts = CT.merge(opts, {
			enterCb: this._doNothing,
			keyUpCb: this._doNothing,
			expandCb: this._doNothing,
			tapCb: this._onTap,
			guessCb: this.guesser
		});
		CT.autocomplete.Guesser.id += 1;
		this.id = CT.autocomplete.Guesser.id;
		this.input = opts.input;
		this.node = CT.dom.node(CT.dom.node(), null, "autocomplete hider");
		document.body.appendChild(this.node);
		CT.drag.makeDraggable(this.node, { constraint: "horizontal" });
		CT.gesture.listen("down", this.input, this._returnTrue);
		CT.gesture.listen("up", this.input, this._onUp);
		this.input.onkeyup = this._onKeyUp;
	}
});
CT.autocomplete.Guesser.id = 0;

CT.autocomplete.DBGuesser = CT.Class({
	CLASSNAME: "CT.autocomplete.DBGuesser",
	guesser: function(frag) {
		var filters = {};
		filters[this.opts.property] = {
			comparator: "like",
			value: frag + "%"
		};
		CT.db.get(this.opts.modelName, this._update, null, null, null, filters);
	}
}, CT.autocomplete.Guesser);