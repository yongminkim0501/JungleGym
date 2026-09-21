$(function () {
  const $profileButton = $("#profile-menu-button");
  const $profileMenu = $("#profile-menu");
  const $logoutButton = $("#logout-btn");
  const $logoutLabel = $("#logout-button-label");
  const $logoutError = $("#logout-error");

  function setProfileMenu(open) {
    $profileMenu.toggleClass("hidden", !open).attr("aria-hidden", String(!open));
    $profileButton
      .attr("aria-expanded", String(open))
      .attr("aria-label", open ? "프로필 메뉴 닫기" : "프로필 메뉴 열기");
  }

  $profileButton.on("click", function (event) {
    event.stopPropagation();

    setProfileMenu($profileMenu.hasClass("hidden"));
  });

  $profileMenu.on("click", function (event) {
    event.stopPropagation();
  });

  $profileButton.add($profileMenu).on("focusout", function () {
    setTimeout(function () {
      const focusedElement = document.activeElement;
      const focusStayedInside =
        $profileButton.is(focusedElement) || $profileMenu.has(focusedElement).length > 0;

      if (!focusStayedInside) {
        setProfileMenu(false);
      }
    }, 0);
  });

  $(document).on("click", function () {
    setProfileMenu(false);
  });

  $(document).on("keydown", function (event) {
    if (event.key === "Escape" && !$profileMenu.hasClass("hidden")) {
      setProfileMenu(false);
      $profileButton.trigger("focus");
    }
  });

  $logoutButton.on("click", function () {
    const buttonText = $logoutLabel.text().trim();

    $logoutError.addClass("hidden").text("");
    $logoutButton.prop("disabled", true);
    $logoutLabel.text("로그아웃 중...");

    $.ajax({
      url: '/api/auth/logout',
      method: "POST",
      dataType: "json",
    })
      .done(function (response) {
        window.location.href = "/login";
      })
      .fail(function (xhr) {
        if (xhr.status === 401) {
          window.location.href = "/login";
          return;
        }

        const response = xhr.responseJSON || {};

        $logoutError
          .removeClass("hidden")
          .text(response.message || "로그아웃 처리에 실패했습니다.");
      })
      .always(function () {
        $logoutButton.prop("disabled", false);
        $logoutLabel.text(buttonText);
      });
  });
});
