import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")
MANAGER_EMAIL = os.getenv("MANAGER_EMAIL")
MANAGER_PASSWORD = os.getenv("MANAGER_PASSWORD")


class MailRepo:
    def __init__(self, db):
        self.collection = db.mails

    def send(self, email, msg):
        connection = smtplib.SMTP(SMTP_SERVER, int(SMTP_PORT))
        connection.starttls()
        connection.login(user=MANAGER_EMAIL, password=MANAGER_PASSWORD)
        connection.send_message(msg)
        connection.quit()

    def _get_email_body(self, verification_code):
        body_data = f"""
        <!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>JUNGLE GYM 이메일 인증코드</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family:
        Arial, &quot;Apple SD Gothic Neo&quot;, &quot;Noto Sans KR&quot;,
        sans-serif;
      color: #171717;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="width: 100%; background-color: #ffffff"
    >
      <tr>
        <td align="center" style="padding: 40px 16px">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width: 100%;
              max-width: 672px;
              overflow: hidden;
              background-color: #ffffff;
            "
          >
            <tr>
              <td style="padding: 16px; background-color: #05d082">
                <img
                  src="https://res.cloudinary.com/vcong7b4/image/upload/f_png/v1787713221/Logo.png"
                  width="248"
                  height="43"
                  alt="JUNGLE GYM"
                  style="display: block; width: 248px; height: 43px; border: 0"
                />
              </td>
            </tr>

            <tr>
              <td style="padding: 30px 16px 34px">
                <p
                  style="
                    margin: 0 0 10px;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.5;
                    color: #525252;
                  "
                >
                  Email Verify Code&nbsp;&nbsp;&rarr;
                </p>
                <h1
                  style="
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    line-height: 1.4;
                    letter-spacing: -0.7px;
                    color: #171717;
                  "
                >
                  <span style="color: #05d082">JUNGLE GYM</span>
                  이메일 인증코드
                </h1>
                <p
                  style="
                    margin: 0 0 10px;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.5;
                    color: #525252;
                  "
                >
                  아래 인증코드를 인증 화면에 입력해주세요.
                </p>

                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="width: 100%; margin-top: 24px"
                >
                  <tr>
                    <td
                      align="center"
                      height="150"
                      style="
                        height: 150px;
                        border-radius: 8px;
                        background-color: #05d082;
                        padding: 0 16px;
                        vertical-align: middle;
                      "
                    >
                      <p
                        id="verification-code"
                        style="
                          margin: 0;
                          font-size: 36px;
                          font-weight: 700;
                          line-height: 1.2;
                          letter-spacing: 7px;
                          color: #ffffff;
                        "
                      >
                        {verification_code}
                      </p>
                    </td>
                  </tr>
                </table>

                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="width: 100%; margin-top: 14px"
                >
                  <tr>
                    <td
                      style="
                        margin: 0 0 10px;
                        font-size: 14px;
                        font-weight: 500;
                        line-height: 1.5;
                        color: #525252;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 10px;
                          font-size: 14px;
                          font-weight: 500;
                          line-height: 1.5;
                          color: #525252;
                        "
                      >
                        인증코드는 발송 후
                        <strong style="color: #404040">5분 동안</strong>
                        유효합니다. 본인이 요청하지 않았다면 이 메일을
                        무시해주세요.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color: #2d2d2d; padding: 18px 16px">
                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    line-height: 1.6;
                    color: #ffffff;
                  "
                >
                  본 메일은 발신 전용입니다.<br />
                  &copy; JUNGLE GYM. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
        """
        return body_data

    def generate_send_msg(self, email, code):
        msg = MIMEMultipart()
        msg['Subject'] = '[JungleGym] 이메일 인증번호'
        msg['From'] = MANAGER_EMAIL
        msg['To'] = email
        html_body = self._get_email_body(verification_code=code)
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        return msg

    def save_send(self, email, code, expired_in):
        now = datetime.now(timezone.utc)
        self.collection.update_one(
            {"email": email},
            {"$set": {
                "code": code,
                "expires_at": now + timedelta(seconds=expired_in),
            }},
            upsert=True,
        )

    def check_expires_time_code(self, email, code):
        data = self.collection.find_one({"email": email})
        if data is None:
            return False
        expires_at = data['expires_at'].replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            return False
        return data['code'] == code


