class PubSubUser(object):
    def __init__(self, conn, server, logger):
        self.conn = conn
        self.server = server
        self._log = logger
        self.channels = set()
        self.conn.set_cb(self._register)
        self._log('NEW CONNECTION', 1, True)

    def join(self, channel):
        self.channels.add(channel)

    def leave(self, channel):
        if channel in self.channels:
            self.channels.remove(channel)

    def write(self, data):
        data["data"]["datetime"] = str(datetime.now()) # do a better job
        dstring = json.dumps(data) # pre-encode so we can log
        self._log('WRITE: "%s" -> "%s"'%(self.name, dstring), 3)
        self.conn.write(dstring, noEncode=True)

    def _read(self, obj):
        if obj["action"] == "close":
            return self.conn.close()
        getattr(self.server, obj["action"])(obj["data"], self)

    def _close(self):
        for channel in list(self.channels):
            channel.leave(self)
        if self.name in self.server.clients: # _should_ be
            del self.server.clients[self.name]

    def _register(self, obj):
        name = obj["data"]
        self._log('REGISTER: "%s"'%(name,), 1, True)
        self.name = name
        self.server.clients[name] = self
        self.conn.set_cb(self._read)
        self.conn.set_close_cb(self._close)