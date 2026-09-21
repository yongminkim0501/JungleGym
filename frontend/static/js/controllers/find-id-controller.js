$(function () {
  const CODE_SECONDS = 300;
  const RESEND_AFTER_SECONDS = 180;

  const $email = $("#find-id-email");
  const $code = $("#find-id-code");
  const $message = $("#find-id-message");
  const $timer = $("#find-id-code-timer");
  const $sendButton = $("#find-id-send-code-btn");
  const $resendButton = $("#find-id-resend-code-btn");
  const $stepOneButton = $("#find-id-step-1-next-btn");
  const $verifyButton = $("#find-id-step-2-next-btn");

  let timerId;
  let codeExpired = false;

  function responseMessage(xhr, fallback) {
    const response = xhr.responseJSON || {};
    return response.message || fallback;
  }

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
      const $step = $("#find-id-step-" + number);
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

  function startTimer() {
    const expiresAt = Date.now() + CODE_SECONDS * 1000;

    stopTimer();
    codeExpired = false;
    $timer
      .removeClass("bg-red-100 text-red-600")
      .addClass("bg-neutral-200 text-neutral-700");
    $resendButton.addClass("hidden");
    $verifyButton.prop("disabled", false);

    function updateTimer() {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      const elapsed = CODE_SECONDS - remaining;

      $timer.text(formatTime(remaining));
      $resendButton.toggleClass("hidden", elapsed < RESEND_AFTER_SECONDS);

      if (remaining > 0) return;

      stopTimer();
      codeExpired = true;
      $timer
        .removeClass("bg-neutral-200 text-neutral-700")
        .addClass("bg-red-100 text-red-600");
      $verifyButton.prop("disabled", true);
      showMessage("인증코드가 만료되었습니다. 다시 전송해주세요.", true);
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
      data: { email: email, purpose: "find_id" },
      dataType: "json",
    })
      .done(function (response) {
        $("#find-id-verified-email").val(email);
        $stepOneButton.prop("disabled", false);
        $code.val("");
        $button.prop("disabled", false).text(buttonText);
        $sendButton.prop("disabled", true).text("전송 완료");
        startTimer();
        showMessage(response.message || "인증코드를 전송했습니다.");
      })
      .fail(function (xhr) {
        $button.prop("disabled", false).text(buttonText);
        showMessage(responseMessage(xhr, "인증코드 전송에 실패했습니다."), true);
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

    const buttonText = $verifyButton.text().trim();

    hideMessage();
    $verifyButton.prop("disabled", true).text("확인 중...");

    $.ajax({
      url: "/api/recovery/verify-code",
      method: "POST",
      data: {
        email: $email.val().trim(),
        code: $code.val().trim(),
        purpose: "find_id",
      },
      dataType: "json",
    })
      .done(function (response) {
        stopTimer();
        $("#find-id-result").text(response.user_id);
        $("#find-id-name").text(response.name || "");
        showStep(3);
      })
      .fail(function (xhr) {
        showMessage(responseMessage(xhr, "인증코드가 올바르지 않습니다."), true);
      })
      .always(function () {
        $verifyButton.prop("disabled", codeExpired).text(buttonText);
      });
  });
});
