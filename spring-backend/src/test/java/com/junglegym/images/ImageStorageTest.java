package com.junglegym.images;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.junglegym.common.BusinessException;
import org.junit.jupiter.api.Test;
import java.io.IOException;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class ImageStorageTest {
    @Test void usesCloudinarySecureUrlAndOriginalUploadOptions() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(), anyMap())).thenReturn(Map.of("secure_url", "https://res.cloudinary.com/test/image/upload/photo.png"));
        String input = "data:image/png;base64,aW1hZ2U=";
        assertEquals("https://res.cloudinary.com/test/image/upload/photo.png", new ImageStorage(cloudinary).save(input));
        verify(uploader).upload(eq(input), argThat(options -> "image".equals(options.get("resource_type"))
                && Boolean.TRUE.equals(options.get("use_filename")) && Boolean.FALSE.equals(options.get("unique_filename"))));
    }
    @Test void rejectsRemoteUrlsAndInvalidBase64BeforeCallingCloudinary() {
        Cloudinary cloudinary = mock(Cloudinary.class);
        ImageStorage images = new ImageStorage(cloudinary);
        assertNull(images.save(""));
        assertThrows(BusinessException.class, () -> images.save("http://localhost/private"));
        assertThrows(BusinessException.class, () -> images.save("data:image/png;base64,%%%"));
        verifyNoInteractions(cloudinary);
    }
    @Test void uploadFailuresDoNotExposeCredentials() throws Exception {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(), anyMap())).thenThrow(new IOException("sensitive provider detail"));
        BusinessException error = assertThrows(BusinessException.class,
                () -> new ImageStorage(cloudinary).save("data:image/png;base64,aW1hZ2U="));
        assertFalse(error.getMessage().contains("sensitive"));
    }
}
