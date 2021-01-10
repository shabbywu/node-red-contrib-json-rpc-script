# -*- coding: utf-8 -*-
import ast
from typing import Dict, Callable
from textwrap import dedent

import fastapi_jsonrpc as jsonrpc
from pydantic import BaseModel
from fastapi import Body


app = jsonrpc.API()
api_v1 = jsonrpc.Entrypoint('/api/v1/jsonrpc')

METHOD_NAME = "method"
def default_method(msg):
    msg["error"] = "method not founds."
    return msg


def compile_method(code: str) -> Callable[[Dict], Dict]:
    globalns = {}
    module_code = compile(code, "<>", mode="exec")
    exec(module_code, globalns)
    return globalns.get(METHOD_NAME, default_method)


@api_v1.method()
async def call_function(msg: Dict, code: str = dedent(f"""
    def {METHOD_NAME}(msg):
        return msg
    """)) -> Dict:
    method = compile_method(code)
    try:
        payload = method(msg)
        error = None
    except Exception as e:
        error = payload = str(e)

    if payload is not msg:
        msg["payload"] = payload
        msg["error"] = error
    return msg


app.bind_entrypoint(api_v1)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, port=5001, debug=True, access_log=False)