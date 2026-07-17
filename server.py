import http.server
import socketserver
import webbrowser
import os

PORT = 8005
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"GhostTrack Dashboard serving locally at http://localhost:{PORT}")
        print("Opening dashboard in default web browser...")
        webbrowser.open(f"http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped. Exiting.")

if __name__ == "__main__":
    main()
