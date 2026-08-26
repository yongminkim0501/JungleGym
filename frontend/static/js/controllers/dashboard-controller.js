$(function () {
  const $modal = $("#workout-photo-modal");
  const $image = $("#workout-photo-modal-image");
  const $memo = $("#workout-photo-modal-memo");
  const $date = $("#workout-photo-modal-title");
  const $imageError = $("#workout-photo-modal-error");
  let returnFocus = null;

  function openPhoto($button) {
    const photoUrl = ($button.attr("data-photo-url") || "").trim();
    const memo = ($button.attr("data-photo-memo") || "").trim();
    const photoDate = ($button.attr("data-photo-date") || "").trim();

    if (!photoUrl) return;

    returnFocus = $button.get(0);
    $image.removeClass("hidden").attr("src", photoUrl).attr("alt", memo || "오운완 사진");
    $imageError.addClass("hidden").removeClass("flex");
    $memo.removeClass("hidden").text(memo || "오운완");
    $date.text(photoDate);
    $modal.removeClass("hidden").addClass("flex").attr("aria-hidden", "false");
    $("body").addClass("overflow-hidden");
    $("#workout-photo-close-btn").trigger("focus");
  }

  function closePhoto() {
    $modal.addClass("hidden").removeClass("flex").attr("aria-hidden", "true");
    $image.removeClass("hidden").attr("src", "");
    $imageError.addClass("hidden").removeClass("flex");
    $memo.addClass("hidden").text("");
    $date.text("");
    $("body").removeClass("overflow-hidden");

    if (returnFocus && document.contains(returnFocus)) {
      returnFocus.focus();
    }
    returnFocus = null;
  }

  $image.on("load", function () {
    $image.removeClass("hidden");
    $imageError.addClass("hidden").removeClass("flex");
  });

  $image.on("error", function () {
    if ($modal.hasClass("hidden")) {
      return;
    }

    $image.addClass("hidden");
    $imageError.removeClass("hidden").addClass("flex");
  });

  $(".workout-photo-button").on("click", function () {
    openPhoto($(this));
  });

  $("#workout-photo-close-btn").on("click", closePhoto);

  $modal.on("click", function (event) {
    if (event.target === this) {
      closePhoto();
    }
  });

  $(document).on("keydown", function (event) {
    if ($modal.hasClass("hidden")) {
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      $("#workout-photo-close-btn").trigger("focus");
      return;
    }

    if (event.key === "Escape") {
      closePhoto();
    }
  });
});
