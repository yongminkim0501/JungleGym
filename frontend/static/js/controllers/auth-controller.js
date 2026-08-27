$(function () {
  const $message = $("#err-msg");

  function showError(message) {
    $message.removeClass("hidden").text(message);
  }

  function hideError() {
    $message.addClass("hidden").text("");
  }

  $("#login-password-toggle").on("click", function () {
    const $password = $("#login-password");
    const showPassword = $password.attr("type") === "password";

    $password.attr("type", showPassword ? "text" : "password");
    $(this)
      .attr("aria-pressed", String(showPassword))
      .attr("aria-label", showPassword ? "비밀번호 숨기기" : "비밀번호 표시");
    $("#login-eye-open").toggleClass("hidden", showPassword);
    $("#login-eye-closed").toggleClass("hidden", !showPassword);
  });

  $("#login-form").on("submit", function (event) {
    event.preventDefault();

    const $button = $("#login-submit-btn");
    const buttonText = $button.text().trim();

    hideError();
    $button.prop("disabled", true).text("로그인 중...");

    $.ajax({
      url: "/api/auth/login",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        email: $("#login-email").val().trim(),
        password: $("#login-password").val(),
      }),
    })
      .done(function () {
        window.location.href = "/";
      })
      .fail(function (xhr) {
        showError(FormValidator.responseMessage(xhr, "로그인에 실패했습니다."));
      })
      .always(function () {
        $button.prop("disabled", false).text(buttonText);
      });
  });

  $("#register-form").on("submit", function (event) {
    event.preventDefault();

    const email = $("#register-email").val().trim();
    const nickname = $("#register-nickname").val().trim();
    const name = $("#register-name").val().trim();
    const password = $("#register-password").val();
    const passwordConfirm = $("#register-password-confirm").val();

    const error = FormValidator.register({
      email,
      nickname,
      name,
      password,
      passwordConfirm,
    });

    if (error) {
      showError(error);
      return;
    }

    const $button = $("#register-submit-button");
    const buttonText = $button.text().trim();

    hideError();
    $button.prop("disabled", true).text("처리 중...");

    $.ajax({
      url: "/api/auth/register",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ email, nickname, name, password }),
    })
      .done(function () {
        window.location.href = "/login";
      })
      .fail(function (xhr) {
        showError(FormValidator.responseMessage(xhr, "회원가입에 실패했습니다."));
      })
      .always(function () {
        $button.prop("disabled", false).text(buttonText);
      });
  });
});
