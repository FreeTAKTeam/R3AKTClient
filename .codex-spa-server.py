from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(r'C:\Users\broth\Documents\work\ATAK\src\R3AKTClient\apps\mobile\dist')
os.chdir(ROOT)

class SpaHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if self.path.startswith('/assets/') or self.path in ['/', '/index.html'] or Path(path).exists():
            return super().do_GET()
        self.path = '/index.html'
        return super().do_GET()

ThreadingHTTPServer(('127.0.0.1', 4175), SpaHandler).serve_forever()
