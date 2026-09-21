$(function () {
  const layerSelector = "#check-in-modal, #check-out-modal, #workout-record-sheet";
  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let imagePreviewUrl = "";

  function focusableElements($layer) {
    return $layer.find(focusableSelector).filter(":visible");
  }

  function openLayer($layer, returnFocus) {
    $layer.data("return-focus", returnFocus || document.activeElement);
    $layer.removeClass("hidden").addClass("flex").attr("aria-hidden", "false");
    $("body").addClass("overflow-hidden");

    const firstElement = focusableElements($layer).first().get(0) || $layer.get(0);
    firstElement.focus();
  }

  function closeLayer($layer, restoreFocus = true) {
    if ($layer.hasClass("hidden")) return;

    const returnFocus = $layer.data("return-focus");

    $layer.addClass("hidden").removeClass("flex").attr("aria-hidden", "true");
    $layer.removeData("return-focus");

    const hasOpenLayer = $(layerSelector).filter(function () {
      return !$(this).hasClass("hidden");
    }).length;

    if (!hasOpenLayer) $("body").removeClass("overflow-hidden");
    if (restoreFocus && returnFocus && document.contains(returnFocus)) returnFocus.focus();
  }

  function activeLayer() {
    return $(layerSelector)
      .filter(function () {
        return !$(this).hasClass("hidden");
      })
      .last();
  }

  function keepFocusInside(event, $layer) {
    const $elements = focusableElements($layer);

    if (!$elements.length) {
      event.preventDefault();
      $layer.trigger("focus");
      return;
    }

    const firstElement = $elements.first().get(0);
    const lastElement = $elements.last().get(0);

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function currentTime() {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  }

  function responseMessage(xhr, fallback) {
    const response = xhr.responseJSON || {};
    return response.message || fallback;
  }

  function showError($message, text) {
    $message.removeClass("hidden").text(text);
  }

  function hideError($message) {
    $message.addClass("hidden").text("");
  }

  function clearWorkoutImage() {
    const input = $("#workout-image-input").get(0);
    if (input) input.value = "";

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    imagePreviewUrl = "";

    $("#workout-image-preview").attr("src", "");
    $("#workout-image-selected").addClass("hidden");
    $("#workout-image-empty").removeClass("hidden").addClass("flex");
  }

  function resetWorkoutForm() {
    $("#workout-title").val("");
    $("#workout-title-count").text("0");
    hideError($("#workout-error"));
    clearWorkoutImage();
  }

  function closeWorkoutSheet() {
    closeLayer($("#workout-record-sheet"));
    resetWorkoutForm();
  }

  function addWorkoutTag(tag) {
    const $title = $("#workout-title");
    const title = $title.val().trim();
    const maxLength = Number($title.attr("maxlength")) || 100;

    if (title.split(/\s+/).includes(tag)) return;

    const nextTitle = title ? title + " " + tag : tag;

    if (nextTitle.length > maxLength) {
      showError($("#workout-error"), `제목은 ${maxLength}자 이하로 입력해주세요.`);
      return;
    }

    $title.val(nextTitle).trigger("input").trigger("focus");
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  }

  function workoutData(title, image) {
    if (!image) {
      return Promise.resolve({ title: title || "", image: "" });
    }

    return readFileAsDataUrl(image).then(function (base64Image) {
      return { title: title || "", image: base64Image };
    });
  }

  function checkOut(dataPromise, $button) {
    const buttonText = $button.text().trim();
    const $message = $("#workout-error");

    hideError($message);
    $button.prop("disabled", true).text("퇴실 처리 중...");

    dataPromise
      .then(function (payload) {
        return $.ajax({
          url: "/api/gym/check-out",
          method: "POST",
          data: JSON.stringify(payload),
          contentType: "application/json",
          dataType: "json",
        });
      })
      .then(function () {
        window.location.href = "/qr/success?type=check-out";
      })
      .catch(function (xhr) {
        showError($message, responseMessage(xhr, "퇴실 처리에 실패했습니다."));
      })
      .finally(function () {
        $button.prop("disabled", false).text(buttonText);
      });
  }

  $("#open-check-in-btn").on("click", function () {
    if (this.disabled) return;

    $("#check-in-current-time").text(currentTime());
    hideError($("#check-in-error"));
    openLayer($("#check-in-modal"));
  });

  $("#check-in-cancel-btn").on("click", function () {
    closeLayer($("#check-in-modal"));
  });

  $("#check-in-confirm-btn").on("click", function () {
    const $button = $(this);
    const $message = $("#check-in-error");
    const buttonText = $button.text().trim();

    hideError($message);
    $button.prop("disabled", true).text("입실 처리 중...");

    $.ajax({
      url: "/api/gym/check-in",
      method: "POST",
      dataType: "json",
    })
      .done(function (response) {
        window.location.href = "/qr/success?type=check-in";
      })
      .fail(function (xhr) {
        showError($message, responseMessage(xhr, "입실 처리에 실패했습니다."));
      })
      .always(function () {
        $button.prop("disabled", false).text(buttonText);
      });
  });

  $("#open-check-out-btn").on("click", function () {
    if (this.disabled) return;

    $("#check-out-current-time").text(currentTime());
    hideError($("#check-out-error"));
    openLayer($("#check-out-modal"));
  });

  $("#check-out-cancel-btn").on("click", function () {
    closeLayer($("#check-out-modal"));
  });

  $("#check-out-confirm-btn").on("click", function () {
    const returnFocus = $("#check-out-modal").data("return-focus");

    closeLayer($("#check-out-modal"), false);
    resetWorkoutForm();
    openLayer($("#workout-record-sheet"), returnFocus);
  });

  $("#workout-cancel-btn").on("click", closeWorkoutSheet);

  $(
    "#workout-tag-complete, #workout-tag-upper, #workout-tag-lower, #workout-tag-cardio, #workout-tag-stretch",
  ).on("click", function () {
    addWorkoutTag($(this).text().trim());
  });

  $("#workout-title").on("input", function () {
    $("#workout-title-count").text($(this).val().length);
    hideError($("#workout-error"));
  });

  $("#workout-image-input").on("change", function () {
    const file = this.files[0];

    if (!file) {
      clearWorkoutImage();
      return;
    }

    if (!file.type.startsWith("image/")) {
      clearWorkoutImage();
      showError($("#workout-error"), "이미지 파일만 선택할 수 있습니다.");
      return;
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    imagePreviewUrl = URL.createObjectURL(file);

    hideError($("#workout-error"));
    $("#workout-image-preview").attr("src", imagePreviewUrl);
    $("#workout-image-empty").addClass("hidden").removeClass("flex");
    $("#workout-image-selected").removeClass("hidden");
  });

  $("#workout-image-remove-btn").on("click", clearWorkoutImage);

  $("#workout-record-form").on("submit", function (event) {
    event.preventDefault();

    const title = $("#workout-title").val().trim();
    const imageInput = $("#workout-image-input").get(0);
    const image = imageInput && imageInput.files[0];

    if (!title && !image) {
      showError($("#workout-error"), "운동 내용이나 사진 중 하나를 등록해주세요.");
      $("#workout-title").trigger("focus");
      return;
    }

    checkOut(workoutData(title, image), $("#workout-submit-btn"));
  });

  $("#workout-skip-btn").on("click", function () {
    checkOut(workoutData("", ""), $(this));
  });

  $("#check-in-modal, #check-out-modal").on("click", function (event) {
    if (event.target === this) closeLayer($(this));
  });

  $(document).on("keydown", function (event) {
    const $layer = activeLayer();
    if (!$layer.length) return;

    if (event.key === "Tab") {
      keepFocusInside(event, $layer);
      return;
    }

    if (event.key !== "Escape") return;

    if ($layer.is("#workout-record-sheet")) {
      closeWorkoutSheet();
      return;
    }

    closeLayer($layer);
  });
});
