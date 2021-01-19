const RPCServer = require('./servers/rpc-server')

module.exports = function (RED) {
  function JSONRPC(config) {
    const BackendMaps = {
      'python3': new RPCServer('python3')
    }

    var node = this;
    RED.nodes.createNode(node, config);

    node.on('input', function(msg) {
      let client = BackendMaps[config.language].client
      let msg_req = msg.req
      let msg_res = msg.res


      // TODO: 定义更好的规则
      if (msg_req !== undefined) {
        msg.req = {
          query: msg_req.query,
          params: msg_req.params,
          headers: msg_req.headers,
          body: msg_req.body,
          cookies: msg_req.cookies,
        }
      }

      if (msg_res !== undefined) {
        delete msg.res
      }

      client.request("call_function", {msg, code: config.code}).then(res => {
        if (msg_res !== undefined) {
          res.res = msg_res
        }
        node.send(res)
      })
    });

    node.on('close', function () {
      for (server of ServerMaps) {
        server.close()
      }
    });
  }
  RED.nodes.registerType('代码执行', JSONRPC);
};
