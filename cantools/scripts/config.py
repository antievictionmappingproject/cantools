from cfg import cfg

class Config(object):
	def __init__(self, cfg):
		self._cfg = {}
		for key, val in cfg.items():
			self.update(key, val)

	def __getattr__(self, key):
		return self._cfg[key]

	# dict compabitility
	def values(self):
		return self._cfg.values()

	def items(self):
		return self._cfg.items()

	def keys(self):
		return self._cfg.keys()

	def update(self, key, val):
		self._cfg[key] = isinstance(val, dict) and Config(val) or val

config = Config(cfg)