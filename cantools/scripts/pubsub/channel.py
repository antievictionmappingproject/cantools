class PubSubChannel(object):
    def __init__(self, name, logger):
        self._log = logger
        self.name = name
        self.users = set()
        self.history = []
        self._log('NEW CHANNEL: "%s"'%(name,), 1, True)

    def _broadcast(self, obj):
        for user in self.users:
            user.write(obj)

    def write(self, subobj):
        subobj["channel"] = self.name
        obj = {
            "action": "publish",
            "data": subobj
        }
        self._broadcast(obj)
        self.history.append(subobj)
        self.history = self.history[:config.pubsub.history]

    def leave(self, user):
        if user in self.users:
            self.users.remove(user)
            user.leave(self)
            self._broadcast({
                "action": "unsubscribe",
                "data": {
                    "user": user.name,
                    "channel": self.name
                }
            })

    def join(self, user):
        self._broadcast({
            "action": "subscribe",
            "data": {
                "user": user.name,
                "channel": self.name
            }
        })
        self.users.add(user)
        user.join(self)