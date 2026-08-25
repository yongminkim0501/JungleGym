import os

import cloudinary.uploader
import cloudinary
import cloudinary.uploader

API_KEY = os.getenv("CLOUDINARY_API_KEY")

class ImageRepository:
    def __init__(self):
        cloudinary.config(
            cloud_name="bhrv5jri",
            api_key="313521525263326",
            api_secret=API_KEY,  # Click 'View API Keys' above to copy your API secret
            secure=True
        )
        self.cloud = cloudinary

    def image_upload(self, image_path):
        response = self.cloud.uploader.upload(
            image_path,
            use_filename = True,
            unique_filename = False
        )

        secure_url = response.get("secure_url")
        return response.get("public_id")