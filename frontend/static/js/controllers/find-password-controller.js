$(function () {
  const $email = $("#find-password-email");
  const $code = $("#find-password-code");
  const $password = $("#find-password-new");
  const $passwordConfirm = $("#find-password-confirm");
  const $sendButton = $("#find-password-send-code-btn");
  const $resendButton = $("#find-password-resend-code-btn");
  const $stepOneButton = $("#find-password-step-1-next-btn");
  const $verifyButton = $("#find-password-step-2-next-btn");
  const $resetButton = $("#find-password-reset-btn");

  function showStep(step, $focus) {
    for (let number = 1; number <= 3; number += 1) {
      const $step = $("#find-password-step-" + number);
      $step.toggleClass("hidden", number !== step);
      $step.toggleClass("flex", number === step);
    }

    if ($focus) $focus.trigger("focus");
  }

  function previewCodeSend() {
    if (!$email.get(0).reportValidity()) return;

    const email = $email.val().trim();
    $("#find-password-verified-email").val(email);
    $stepOneButton.prop("disabled", false);
    $sendButton.text("전송 완료");
  }

  $sendButton.add($resendButton).on("click", previewCodeSend);

  $stepOneButton.on("click", function () {
    showStep(2, $code);
  });

  $verifyButton.on("click", function () {
    if (!$code.get(0).reportValidity()) return;

    showStep(3, $password);
  });

  $passwordConfirm.on("input", function () {
    this.setCustomValidity("");
  });

  $("#find-password-form").on("submit", function (event) {
    event.preventDefault();

    $passwordConfirm.get(0).setCustomValidity("");
    if (!$password.get(0).reportValidity()) return;
    if (!$passwordConfirm.get(0).reportValidity()) return;

    if ($password.val() !== $passwordConfirm.val()) {
      const passwordConfirm = $passwordConfirm.get(0);
      passwordConfirm.setCustomValidity("비밀번호가 일치하지 않습니다.");
      passwordConfirm.reportValidity();
      return;
    }

    $resetButton.prop("disabled", true).text("확인 완료");
  });
});
