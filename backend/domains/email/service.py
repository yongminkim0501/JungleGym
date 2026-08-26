import random

class MailService:
    def __init__(self, repo):
        self.repo = repo

    def _generator_verfication_code(self):
        return random.randint(1000, 9999)

    def send_mail(self, email):
        code = self._generator_verfication_code()
        msg = self.repo.generate_send_msg(email = email, code = code)
        self.repo.send(email = email, msg = msg)
        self.repo.save_send(email=email, code=code, expired_in = 300)
        return True

    def verify(self, email, code):
        if self.repo.check_expires_time_code(email=email, code=code):
            return True
        return False # 이 부분의 비즈니스적 실패가 2가지 종류라 이 부분에 각각 다르게 반환해줘야 함