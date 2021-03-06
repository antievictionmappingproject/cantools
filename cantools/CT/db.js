CT.db = {
	_schema: {},
	key2model: function(key) {
		return JSON.parse(atob(key)).model;
	},
	key2label: function(key) {
		var d = CT.data.get(key);
		return d[d.label];
	},
	isKey: function(modelName, property) {
		return !!CT.db._schema[modelName]._kinds[property];
	},
	getSchema: function(modelName) {
		return modelName ? CT.db._schema[modelName] : CT.db._schema;
	},
	setSchema: function(schema) {
		CT.db._schema = schema;
		var s, p, ref, rmap = CT.db._rmap = {};
		for (s in schema) {
			for (p in schema[s]._kinds) {
				ref = s + "." + p;
				schema[s]._kinds[p].forEach(function(k) {
					if (! (k in rmap) )
						rmap[k] = [];
					rmap[k].push(ref);
				});
			}
		}
	},
	reference2label: function(modelName, property) {
		var t = CT.db._schema[modelName]._kinds[property][0];
		return {
			modelName: t,
			property: CT.db._schema[t]._label
		};
	},
	get: function(modelName, cb, limit, offset, order, filters) {
		var qdata = {
			"action": "get",
			"modelName": modelName,
			"limit": limit || 20,
			"offset": offset || 0
		};
		if (order)
			qdata.order = order;
		if (filters)
			qdata.filters = filters;
		CT.net.post("/_db", qdata, null, function(d) {
			CT.data.addSet(d);
			cb(d);
		});
	},
	multi: function(keys, cb) {
		var needed = keys.filter(function(k) {
			return !CT.data.get(k);
		});
		if (!needed.length) {
			return cb(keys.map(function(k) {
				return CT.data.get(k);
			}));
		}
		CT.net.post("/_db", {
			action: "get",
			keys: needed
		}, null, function(dlist) {
			CT.data.addSet(dlist);
			cb && cb(keys.map(function(k) {
				return CT.data.get(k);
			}));
		});
	},
	one: function(key, cb) {
		if (CT.data.has(key))
			return cb && cb(CT.data.get(key));
		CT.net.post("/_db", {
			action: "get",
			key: key
		}, null, function(d) {
			CT.data.add(d);
			cb && cb(d);
		});
	},
	init: function(opts) {
		CT.db._opts = opts = CT.merge(opts, {
			panel_key: "db", // required: builder(). also why not: post_pager
		});
		CT.net.post("/_db", { "action": "schema" }, null, function(schema) {
			CT.db.setSchema(schema);
			opts.cb && opts.cb(schema);
		});
	},
	query: function(opts, transition) {
		(new CT.modal.Modal({
			"node": (new CT.db.Query(opts)).node,
			"transition": transition || "none"
		})).show();
	},
	_refill: function(modelName, order, filters) {
		return function(obj, cb) {
			CT.db.get(modelName, cb, obj.limit, obj.offset, order, filters);
		};
	},
	pager: function(modelName, order, filters, k, pnode, cnode) {
		var o = CT.db._opts, key = k || modelName,
			cnode = cnode || CT.dom.id(o.panel_key + "content" + key);
		cnode.appendChild(CT.panel.pager(o.builder(modelName),
			CT.db._refill(modelName, order, filters), 10, "rcol", "data", key));
		o.post_pager && o.post_pager(key, modelName);
	}
};

CT.db.edit = {
	_d: { // unimplemented: list -- no editing (yet) :)
		"string": "",
		"integer": 0,
		"float": 0.0,
		"boolean": false,
		"datetimeautostamper": null,
		"key": null
	},
	_no_ent: {
		"key": null,
		"label": "name",
		"name": "(tap to select)"
	},
	propertyDefault: function(ptype) {
		return CT.db.edit._d[ptype];
	},
	isSupported: function(ptype) {
		// implement list editing soon!!
		return ptype in CT.db.edit._d;
	},
	getDefaults: function(modelName, extras) {
		var k, d = extras || {},
			schema = CT.db._schema[modelName];
		for (k in schema)
			d[k] = CT.db.edit._d[schema[k]];
		return d;
	},
	_val: function(f, ptype) {
		return function() {
			if (ptype == "boolean")
				return f.checked;
			if (ptype == "integer")
				return parseInt(f.value) || null;
			if (ptype == "float")
				return parseFloat(f.value) || null;
			if (ptype == "key")
				return f.data.key;
			if (ptype == "datetimeautostamper")
				return f.value();
			return f.value; // string
		};
	},
	input: function(k, ptype, val, modelName, opts) {
		var valcell;
		opts = opts || {};
		if (ptype == "string")
			valcell = CT.dom.field(null, val);
		else if (ptype == "boolean")
			valcell = CT.dom.checkbox(null, val, {
				"display": "inline-block",
				"width": "160px"
			});
		else if (ptype == "float")
			valcell = CT.parse.numOnly(CT.dom.field(null, val), true);
		else if (ptype == "integer")
			valcell = CT.parse.numOnly(CT.dom.field(null, val));
		else if (ptype == "key")
			valcell = (new CT.db.edit.EntityRow({
				property: k,
				key: val,
				modelName: modelName
			})).node;
		else if (ptype == "datetimeautostamper")
			valcell = CT.dom.dateSelectors(null, null, opts.startYear, null, null, null, val);
		valcell.getValue = CT.db.edit._val(valcell, ptype);
		valcell.rowKey = k;
		return valcell;
	}
};

CT.db.edit.EntityRow = CT.Class({
	CLASSNAME: "CT.db.edit.EntityRow",
	mtable: function() {
		var k, n = CT.dom.node();
		for (k in this.node.data)
			n.appendChild(CT.dom.node([
				CT.dom.node(k + ":", "div", "keycell"),
				CT.dom.node(this.node.data[k] || "(none)", "span")
			], "div", "lister"));
		n.appendChild(CT.dom.button("change", this.change));
		CT.admin && n.appendChild(CT.dom.button("edit", this.edit));
		return n;
	},
	edit: function() {
		CT.admin.db.starLink(this.node.data).onclick();
		this._modal.hide();
	},
	modal: function() {
		this._change && this._change.hide();
		this._modal = this._modal || new CT.modal.Modal({
			transition: "fade",
			node: this.mtable()
		});
		this._modal.show();
	},
	change: function() {
		this._modal && this._modal.hide();
		this._change = this._change || new CT.modal.Prompt({
			transition: "slide",
			prompt: "enter name of new " + this.opts.property,
			cb: this.node.fill,
			autocomplete: CT.db.reference2label(this.opts.modelName, this.opts.property)
		});
		this._change.show();
	},
	_change_or_modal: function() {
		if (this.opts.key)
			this.modal();
		else
			this.change();
	},
	init: function(opts) {
		this.opts = opts;
		var vdata = CT.data.get(opts.key),
			n = this.node = CT.dom.node(CT.dom.link(null, this._change_or_modal), "span");
		n.fill = function(d) {
			d = n.data = d || CT.db.edit._no_ent;
			opts.key = d.key;
			CT.dom.setContent(n.firstChild, d[d.label]);
		};
		if (vdata || !opts.key)
			n.fill(vdata);
		else
			CT.db.one(opts.key, function(d) {
				CT.data.add(d);
				n.fill(d);
			});
	}
});

CT.db.Query = CT.Class({
	CLASSNAME: "CT.db.Query",
	_filter: function() {
		var valcell = CT.dom.node(null, "span"), that = this,
			compcell = CT.dom.select(["==", ">", "<", ">=", "<=", "!=", "like"]),
			selectcell = CT.dom.select(this.filterables),
			rmcell = CT.dom.button("remove", function() {
				CT.dom.remove(selectcell.parentNode);
			});
		selectcell.onchange = function() {
			CT.dom.setContent(valcell,
				CT.db.edit.input(selectcell.value, that.schema[selectcell.value],
					null, that.modelName, that.opts));
		};
		selectcell.onchange();
		this.filters.appendChild(CT.dom.node([selectcell, compcell, valcell, rmcell]));
	},
	_order: function() {
		var selectcell = CT.dom.select(["None"].concat(this.filterables).concat(CT.db._rmap[this.modelName] || [])),
			dircell = CT.dom.select(["ascending", "descending"]);
		dircell.className = "hidden";
		selectcell.onchange = function() {
			if (selectcell.value == "None")
				dircell.classList.add("hidden");
			else
				dircell.classList.remove("hidden");
		};
		return CT.dom.node([selectcell, dircell]);
	},
	_submit: function() {
		var order = null, filters = {}, osel = this.order.firstChild;
		if (osel.value != "None")
			order = osel.nextSibling.value == "descending"
				? "-" + osel.value : osel.value;
		CT.dom.each(this.filters, function(fnode) {
			var propcell = fnode.firstChild,
				compcell = propcell.nextSibling,
				valcell = compcell.nextSibling;
			filters[propcell.value] = {
				comparator: compcell.value,
				value: valcell.firstChild.getValue()
			};
		});
		this.opts.submit({
			modelName: this.modelName,
			order: order,
			filters: filters
		});
		this.node.parentNode.modal.hide();
	},
	_submitCb: function(opts) {
		var key = this.modelName + "query" + this.id;
		CT.panel.add(this.modelName + " (" + this.id + ")",
			false, "db", CT.dom.id("dbqueries"), null, key);
		CT.db.pager(this.modelName, opts.order, opts.filters, key);
		CT.panel.swap(key, false, "db");
	},
	_build: function() {
		this.filters = CT.dom.node();
		this.order = this._order();
		this.node = CT.dom.node([
			CT.dom.node("Query: " + this.modelName, "div", "bigger bold"),
			CT.dom.node("Order", "div", "big bold"),
			this.order,
			CT.dom.node([
				CT.dom.node("Filters", "span", "big bold"),
				CT.dom.button("add", this._filter)
			]),
			CT.dom.node("Select 'like' comparator for values such as 'MO%' (meaning 'starts with MO')",
				"div", this.opts.showHelp && "italic" || "hidden"),
			this.filters,
			CT.dom.button("submit", this._submit)
		]);
	},
	_filterables: function() {
		this.filterables = [];
		for (var k in this.schema)
			if (CT.db.edit.isSupported(this.schema[k]))
				this.filterables.push(k);
	},
	init: function(opts) {
		this.opts = opts = CT.merge(opts, {
			submit: this._submitCb
		});
		this.id = CT.db.Query._id;
		CT.db.Query._id += 1;
		this.modelName = opts.modelName;
		this.schema = CT.db.getSchema(opts.modelName);
		this._filterables();
		this._build();
	}
});
CT.db.Query._id = 0;
