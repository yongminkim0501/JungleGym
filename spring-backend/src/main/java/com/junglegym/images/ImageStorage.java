package com.junglegym.images;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.junglegym.common.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.Base64;

/** Uses the same Cloudinary account and base64 upload contract as the original frontend. */
@Service
public class ImageStorage {
    private final Cloudinary cloudinary;
    private final boolean configured;
    @org.springframework.beans.factory.annotation.Autowired
    public ImageStorage(@Value("${app.cloudinary.cloud-name}") String cloudName,
                        @Value("${app.cloudinary.api-key}") String apiKey,
                        @Value("${app.cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap("cloud_name", cloudName,
                "api_key", apiKey, "api_secret", apiSecret, "secure", true));
        this.configured = !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }
    ImageStorage(Cloudinary cloudinary) { this.cloudinary = cloudinary; this.configured = true; }
    public String save(String dataUrl) {
        if (dataUrl == null || dataUrl.isBlank()) return null;
        if (dataUrl.length() > 14_000_000) throw invalid("사진은 10MB 이하로 선택해주세요.");
        int separator = dataUrl.indexOf(',');
        if (separator < 0 || !dataUrl.substring(0, separator).matches("data:image/[a-zA-Z0-9.+-]+;base64"))
            throw invalid("올바른 이미지 파일을 선택해주세요.");
        try {
            if (Base64.getDecoder().decode(dataUrl.substring(separator + 1)).length > 10 * 1024 * 1024)
                throw invalid("사진은 10MB 이하로 선택해주세요.");
        } catch (IllegalArgumentException exception) { throw invalid("올바른 이미지 파일을 선택해주세요."); }
        if (!configured) throw new BusinessException("IMAGE_UPLOAD_NOT_CONFIGURED",
                "사진 업로드 설정을 확인해주세요.", HttpStatus.SERVICE_UNAVAILABLE);
        try {
            var response = cloudinary.uploader().upload(dataUrl,
                    ObjectUtils.asMap("resource_type", "image", "use_filename", true, "unique_filename", false));
            Object url = response.get("secure_url");
            if (!(url instanceof String secureUrl) || !secureUrl.startsWith("https://"))
                throw new IOException("Missing secure image URL");
            return secureUrl;
        } catch (IOException | RuntimeException exception) {
            throw new BusinessException("IMAGE_UPLOAD_FAILED", "사진을 업로드하지 못했습니다. 다시 시도해주세요.", HttpStatus.BAD_GATEWAY);
        }
    }
    private static BusinessException invalid(String message) {
        return new BusinessException("INVALID_IMAGE", message, HttpStatus.BAD_REQUEST);
    }
}
