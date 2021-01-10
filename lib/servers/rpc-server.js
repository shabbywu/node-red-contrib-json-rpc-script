const axios = require('axios')
const JSONRPCClient = require('json-rpc-2.0').JSONRPCClient
const spwan = require("child_process").spawn

const ServersConfig = {
    python3: {
        cmd: "python3",
        args: [`${__dirname}/python3/asgi.py`],
        host: "http://127.0.0.1:5001/api/v1/jsonrpc"
    }
}


const RPCServer = function (language) {
    const config = ServersConfig[language];
    const process = spwan(config.cmd, config.args);
    
    const client = new JSONRPCClient((jsonRPCRequest) =>
        axios.post(config.host, jsonRPCRequest).then((response) => {
            if (response.status === 200) {
                // Use client.receive when you received a JSON-RPC response.
                return client.receive(response.data)
            } else if (jsonRPCRequest.id !== undefined) {
                return Promise.reject(new Error(response.statusText));
            }
        })
    );

    process.on('close', (code) => {
        if (code !== 0) {
            console.log(`进程退出，退出码 ${code}`);
        }
        this.process = process
    });

    process.on('error', (err) => {
        console.error('启动服务器失败');
        reject(err)
    });
    this.process = process
    this.client = client
}


RPCServer.prototype.close = function () {
    if (this.process) {
        this.process.kill();
    }
    delete this.client
}

module.exports = RPCServer
