"""Same-origin local demo server. Ollama remains loopback-only and is never proxied raw."""
import argparse, http.server, json, pathlib, urllib.error
from urllib.parse import unquote, urlsplit
from understanding import parse, compile_result, GATE, MODEL
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,format,*args):
        # No transcripts or request bodies in access logs.
        if not self.path.startswith('/api/'):super().log_message(format,*args)
    def output(self,status,body):
        data=json.dumps(body,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data)
    def do_GET(self):
        path=unquote(urlsplit(self.path).path)
        if path=='/api/model-status':return self.output(200,{'enabled':True,'model':MODEL})
        # Never serve model weights, private state, repository internals, or service source.
        if any(part.startswith('.') for part in pathlib.PurePosixPath(path).parts):return self.send_error(404)
        if path!='/' and not path.startswith('/assets/') and (len(pathlib.PurePosixPath(path).parts)!=2 or pathlib.Path(path).suffix not in ['.html','.js','.css','.webmanifest']):return self.send_error(404)
        if path=='/' or path.endswith('.html'):
            file=pathlib.Path(self.translate_path(path if path!='/' else '/index.html'))
            if not file.is_relative_to(ROOT) or not file.is_file():return self.send_error(404)
            raw=file.read_bytes().replace(b'</head>',b'<meta name="demo-language-model" content="/api/understand"></head>',1)
            self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw);return
        super().do_GET()
    def do_HEAD(self):
        self.send_error(405)
    def do_POST(self):
        if self.path!='/api/understand':return self.send_error(404)
        if self.headers.get('Sec-Fetch-Site')=='cross-site':return self.output(403,{'error':'same_origin_required'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=16000:return self.output(413,{'error':'request_too_large'})
            body=json.loads(self.rfile.read(length));text=body.get('text');context=body.get('context',{})
            if not isinstance(text,str) or not text.strip() or len(text)>1000 or not isinstance(context,dict):return self.output(400,{'error':'invalid_request'})
            context={k:v for k,v in context.items() if k in ['network','scope','period','personId','lastIntent','pending','salesContext','homeScenario']}
            if not GATE.acquire(blocking=False):return self.output(503,{'error':'model_busy'})
            try:
                data=parse(text,context);result=compile_result(text,data,context)
            finally:GATE.release()
            self.output(200,result)
        except (ValueError,KeyError,TypeError):self.output(502,{'error':'invalid_model_result'})
        except (TimeoutError,urllib.error.URLError):self.output(503,{'error':'model_unavailable'})
        except (BrokenPipeError,ConnectionResetError):pass
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8002);args=parser.parse_args()
    print(f'Demo + local understanding: http://127.0.0.1:{args.port} ({MODEL})',flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
