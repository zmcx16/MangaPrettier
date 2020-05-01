from PIL import Image
import numpy as np
from blend_modes import soft_light, multiply

from coredef import CoreModeKey, BlackWhiteKey


class BlackWhite(object):

    @staticmethod
    def run(image, config, show):
        return BlackWhite.__do_blend(image, config[CoreModeKey.MODE], config[BlackWhiteKey.OPACITY], show)

    @staticmethod
    def __do_blend(image, mode, opacity, show=False):

        background_img = image
        background_img_float = background_img.astype(float)  # Inputs to blend_modes need to be floats.

        foreground_img = image
        foreground_img_float = foreground_img.astype(float)  # Inputs to blend_modes need to be floats.

        blended_img_float = BlackWhite.EffectFunc[mode](background_img_float, foreground_img_float, opacity)

        blended_img = np.uint8(blended_img_float)  # Image needs to be converted back to uint8 type for PIL handling.

        if show:
            blended_img_raw = Image.fromarray(
                blended_img)  # Note that alpha channels are displayed in black by PIL by default.
            # This behavior is difficult to change (although possible).
            # If you have alpha channels in your images, then you should give
            # OpenCV a try.

            # Display blended image
            blended_img_raw.show(mode, opacity)

        return blended_img

    EffectFunc = {
        BlackWhiteKey.SOFT_LIGHT: soft_light,
        BlackWhiteKey.MULTIPLY: multiply
    }
