from dotenv import load_dotenv
load_dotenv()

from flask import Flask

from api.v1.containers import ApplicationContainers
from api.v1.endpoints.gym import check
from api.v1.endpoints.gym.check import gym_bp
from api.v1.endpoints.auth.user import auth_bp
from api.v1.endpoints.auth import user

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'dev-secret-change-me'

    container = ApplicationContainers()
    container.wire(modules=[user, check])

    app.container = container

    db = container.db()
    db.users.create_index('email', unique=True)
    db.users.create_index('nickname', unique=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(gym_bp)

    return app

if __name__ == "__main__":
    create_app().run('0.0.0.0', port=5000, debug=True)