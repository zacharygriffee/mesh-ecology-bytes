const Hyperswarm = require('hyperswarm')

class HyperswarmTransport {
  constructor(options = {}) {
    this.swarm = options.swarm || new Hyperswarm(options.swarmOptions)
    this._ownsSwarm = !options.swarm
    this._attachments = new Map()
    this._onConnection = this._handleConnection.bind(this)

    this.swarm.on('connection', this._onConnection)
  }

  async attachCore(core, options = {}) {
    if (!core || typeof core.ready !== 'function') {
      throw new TypeError('attachCore requires an opened Hypercore instance')
    }

    await core.ready()

    const roleConfig = {
      server: options.server !== false,
      client: options.client !== false
    }

    const existingEntry = this._attachments.get(core)

    if (existingEntry) {
      await existingEntry.discovery.refresh(roleConfig)
      existingEntry.server = roleConfig.server
      existingEntry.client = roleConfig.client

      if (existingEntry.server && options.waitForAnnouncement !== false) {
        await existingEntry.discovery.flushed()
      }

      return {
        topic: existingEntry.topic,
        discovery: existingEntry.discovery,
        detach: () => this.detachCore(core)
      }
    }

    const topic = Buffer.from(core.discoveryKey)
    const discovery = this.swarm.join(topic, roleConfig)
    const entry = {
      topic,
      topicHex: topic.toString('hex'),
      core,
      discovery,
      server: roleConfig.server,
      client: roleConfig.client
    }

    this._attachments.set(core, entry)

    if (entry.server && options.waitForAnnouncement !== false) {
      await discovery.flushed()
    }

    return {
      topic,
      discovery,
      detach: () => this.detachCore(core)
    }
  }

  async detachCore(core) {
    const entry = this._attachments.get(core)

    if (!entry) return

    this._attachments.delete(core)
    await entry.discovery.destroy()
  }

  async flush() {
    await this.swarm.flush()
  }

  async close() {
    this.swarm.off('connection', this._onConnection)

    for (const core of [...this._attachments.keys()]) {
      await this.detachCore(core)
    }

    if (this._ownsSwarm) {
      await this.swarm.destroy()
    }
  }

  _handleConnection(connection, peerInfo) {
    const activeTopics = new Set((peerInfo.topics || []).map((topic) => topic.toString('hex')))

    for (const entry of this._attachments.values()) {
      if (!this._shouldReplicate(entry, peerInfo, activeTopics)) continue
      entry.core.replicate(connection)
    }
  }

  _shouldReplicate(entry, peerInfo, activeTopics) {
    if (peerInfo.client === false) {
      return entry.server
    }

    if (peerInfo.client === true) {
      return entry.client && activeTopics.has(entry.topicHex)
    }

    return entry.server || (entry.client && activeTopics.has(entry.topicHex))
  }
}

function createHyperswarmTransport(options) {
  return new HyperswarmTransport(options)
}

module.exports = {
  HyperswarmTransport,
  createHyperswarmTransport
}
