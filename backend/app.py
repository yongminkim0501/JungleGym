from flask import Flask
from auth.routes import auth_bp
from middleware import auth_middleware

app = Flask(__name__)

app.register_blueprint(
    auth_bp,
    url_prefix="/auth"
)

app.before_request(auth_middleware)

# frontend request를 보내면 미들웨어 jwt guard 를 먼저 지나고 그 후에 엔드포인트로