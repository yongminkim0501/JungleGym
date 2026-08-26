$(function () {
  const CODE_SECONDS = 300;
  const RESEND_AFTER_SECONDS = 180;

  const $email = $("#find-password-email");
  const $code = $("#find-password-code");
  const $password = $("#find-password-new");
  const $passwordConfirm = $("#find-password-confirm");
  const $message = $("#find-password-message");
  const $codeTimer = $("#find-password-code-timer");
  const $resetTimer = $("#find-password-reset-timer");
  const $sendButton = $("#find-password-send-code-btn");
  const $resendButton = $("#find-password-resend-code-btn");
  const $stepOneButton = $("#find-password-step-1-next-btn");
  const $verifyButton = $("#find-password-step-2-next-btn");
  const $resetButton = $("#find-password-reset-btn");

  const resendButtonText = $resendButton.text().trim();
  const verifyButtonText = $verifyButton.text().trim();
  const resetButtonText = $resetButton.text().trim();

  let timerId;
  let codeSent = false;
  let codeExpired = false;

  function showMessage(text, isError = false) {
    $message
      .removeClass("hidden bg-red-50 text-red-600 bg-emerald-50 text-emerald-700")
      .addClass(isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700")
      .text(text);
  }

  function hideMessage() {
    $message.addClass("hidden").text("");
  }

  function showStep(step, $focus) {
    for (let number = 1; number <= 3; number += 1) {
      const $step = $("#find-password-step-" + number);
      $step.toggleClass("hidden", number !== step);
      $step.toggleClass("flex", number === step);
    }

    if ($focus) $focus.trigger("focus");
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, "0");
    return minutes + ":" + remainingSeconds;
  }

  function stopTimer() {
    clearInterval(timerId);
  }

  function expireCode() {
    stopTimer();
    codeExpired = true;
    $codeTimer
      .removeClass("bg-neutral-200 text-neutral-700")
      .addClass("bg-red-100 text-red-600");
    $resetTimer.removeClass("text-[#05D082]").addClass("text-red-500");
    $resendButton.removeClass("hidden");
    $verifyButton.prop("disabled", true);
    $resetButton.prop("disabled", true);

    if (!$("#find-password-step-3").hasClass("hidden")) {
      showStep(2, $code);
    }

    showMessage("인증코드가 만료되었습니다. 다시 전송해주세요.", true);
  }

  function startTimer() {
    const expiresAt = Date.now() + CODE_SECONDS * 1000;

    stopTimer();
    codeExpired = false;
    $codeTimer
      .removeClass("bg-red-100 text-red-600")
      .addClass("bg-neutral-200 text-neutral-700");
    $resetTimer.removeClass("text-red-500").addClass("text-[#05D082]");
    $resendButton.addClass("hidden").text(resendButtonText);
    $verifyButton.prop("disabled", false);
    $resetButton.prop("disabled", false);

    function updateTimer() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      const elapsed = CODE_SECONDS - remaining;
      const time = formatTime(remaining);

      $codeTimer.text(time);
      $resetTimer.text(time);
      $resendButton.toggleClass("hidden", elapsed < RESEND_AFTER_SECONDS);

      if (remaining === 0) expireCode();
    }

    updateTimer();
    timerId = setInterval(updateTimer, 1000);
  }

  function sendCode($button) {
    if (!$email.get(0).reportValidity()) return;

    const buttonText = $button.text().trim();
    const email = $email.val().trim();

    hideMessage();
    $button.prop("disabled", true).text("전송 중...");

    $.ajax({
      url: "/api/recovery/send-code",
      method: "POST",
      data: { email: email, purpose: "password_reset" },
      dataType: "json",
    })
      .done(function (response) {
        codeSent = true;
        $("#find-password-verified-email").val(email);
        $code.val("");
        $password.val("");
        $passwordConfirm.val("");
        $stepOneButton.prop("disabled", false);
        $button.text("전송 완료");
        startTimer();
        showMessage(response.message || "인증코드를 전송했습니다.");
      })
      .fail(function (xhr) {
        $button.text(buttonText);
        showMessage(FormValidator.responseMessage(xhr, "인증코드 전송에 실패했습니다."), true);
      })
      .always(function () {
        $button.prop("disabled", false);
        $sendButton.prop("disabled", codeSent);
      });
  }

  $sendButton.add($resendButton).on("click", function () {
    sendCode($(this));
  });

  $stepOneButton.on("click", function () {
    hideMessage();
    showStep(2, $code);
  });

  $verifyButton.on("click", function () {
    if (!$code.get(0).reportValidity()) return;

    hideMessage();
    $verifyButton.prop("disabled", true).text("확인 중...");

    $.ajax({
      url: "/api/recovery/verify-code",
      method: "POST",
      data: {
        email: $email.val().trim(),
        code: $code.val().trim(),
        purpose: "password_reset",
      },
      dataType: "json",
    })
      .done(function () {
        showStep(3, $password);
      })
      .fail(function (xhr) {
        showMessage(FormValidator.responseMessage(xhr, "인증코드가 올바르지 않습니다."), true);
      })
      .always(function () {
        $verifyButton.prop("disabled", codeExpired).text(verifyButtonText);
      });
  });

  $("#find-password-form").on("submit", function (event) {
    event.preventDefault();

    const error = FormValidator.passwordReset({
      password: $password.val(),
      passwordConfirm: $passwordConfirm.val(),
    });

    if (error) {
      showMessage(error, true);
      return;
    }

    hideMessage();
    $resetButton.prop("disabled", true).text("변경 중...");

    $.ajax({
      url: "/api/recovery/reset-password",
      method: "POST",
      data: {
        email: $email.val().trim(),
        code: $code.val().trim(),
        password: $password.val(),
        password_confirm: $passwordConfirm.val(),
      },
      dataType: "json",
    })
      .done(function (response) {
        stopTimer();
        window.location.href = response.redirect_url || "/login";
      })
      .fail(function (xhr) {
        showMessage(FormValidator.responseMessage(xhr, "비밀번호 변경에 실패했습니다."), true);
      })
      .always(function () {
        $resetButton.prop("disabled", codeExpired).text(resetButtonText);
      });
  });
});
