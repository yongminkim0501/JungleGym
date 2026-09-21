(function (window) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function register({ email, nickname, name, password, passwordConfirm }) {
    if (!email) return "이메일을 입력해주세요.";
    if (!emailPattern.test(email)) return "올바른 이메일 형식이 아닙니다.";
    if (!nickname) return "닉네임을 입력해주세요.";
    if (nickname.length < 4 || nickname.length > 25) {
      return "닉네임은 4자 이상 25자 이하로 입력해주세요.";
    }
    if (!name) return "이름을 입력해주세요.";
    if (name.length > 50) return "이름은 50자 이하로 입력해주세요.";
    if (!password) return "비밀번호를 입력해주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상 입력해주세요.";
    if (!passwordConfirm) return "비밀번호를 한 번 더 입력해주세요.";
    if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    return null;
  }

  function passwordReset({ password, passwordConfirm }) {
    if (!password) return "비밀번호를 입력해주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상 입력해주세요.";
    if (!passwordConfirm) return "비밀번호를 한 번 더 입력해주세요.";
    if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    return null;
  }

  function responseMessage(xhr, fallback) {
    const response = xhr.responseJSON || {};
    return response.message || fallback;
  }

  window.FormValidator = { register, passwordReset, responseMessage };
})(window);
