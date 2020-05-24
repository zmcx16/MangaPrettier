from PIL import Image
from PIL.ImageEnhance import Brightness, Color, Contrast, Sharpness
import numpy as np

from core_def import CoreModeKey, ImageEnhanceKey


class ImageEnhance(object):

    @staticmethod
    def run(image, config, show):
        return ImageEnhance.__do_image_enhance(image, config[CoreModeKey.MODE], config[ImageEnhanceKey.FACTOR], show)

    @staticmethod
    def __do_image_enhance(image, mode, factor, show=False):

        image_pil = Image.fromarray(image)
        enhance_img = ImageEnhance.EffectFunc[mode](image_pil)
        output_img = enhance_img.enhance(factor)
        output_img_arr = np.uint8(output_img)

        if show:
            output_img.show()

        return output_img_arr

    EffectFunc = {
        ImageEnhanceKey.BRIGHTNESS: Brightness,
        ImageEnhanceKey.COLOR: Color,
        ImageEnhanceKey.CONTRAST: Contrast,
        ImageEnhanceKey.SHARPNESS: Sharpness
    }
