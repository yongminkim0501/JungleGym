from dependency_injector import containers, providers

from backend.database.pymongo_client import _client
from backend.domains.gym.repo import GymRepository
from backend.domains.gym.service import GymService
from backend.domains.user.service import UserService
from backend.domains.user.repo import UserRepository
from backend.domains.images.repo import ImageRepository

class ApplicationContainers(containers.DeclarativeContainer):
    config = providers.Configuration()

    db = providers.Object(_client["dbjungle"])

    image_repo = providers.Factory(
        ImageRepository,
    )

    user_repo = providers.Factory(
        UserRepository,
        db = db
    )

    user_service = providers.Factory(
        UserService,
        repo = user_repo,
        image_repo = image_repo
    )

    gym_repo = providers.Factory(
        GymRepository,
        db = db
    )

    gym_service = providers.Factory(
        GymService,
        user_repo = user_repo,
        gym_repo = gym_repo
    )