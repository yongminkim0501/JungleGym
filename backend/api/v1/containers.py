from dependency_injector import containers, providers

from database.pymongo_client import _client
from domains.dashboard.repo import DashboardRepository
from domains.dashboard.service import DashboardService
from domains.email.repo import MailRepo
from domains.email.service import MailService
from domains.gym.repo import GymRepository
from domains.gym.service import GymService
from domains.user.service import UserService
from domains.user.repo import UserRepository
from domains.images.repo import ImageRepository

class ApplicationContainers(containers.DeclarativeContainer):
    config = providers.Configuration()

    db = providers.Object(_client["dbjungle"])

    image_repo = providers.Factory(
        ImageRepository,
        db = db,
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
        gym_repo = gym_repo,
        image_repo = image_repo
    )

    mail_repo = providers.Factory(
        MailRepo,
        db = db
    )

    mail_service = providers.Factory(
        MailService,
        repo = mail_repo
    )

    dashboard_repo = providers.Factory(
        DashboardRepository,
        db = db
    )

    dashboard_service = providers.Factory(
        DashboardService,
        repo = dashboard_repo,
        user_repo = user_repo
    )