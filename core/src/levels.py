from PIL import Image
import numpy as np

from core_def import CoreModeKey, LevelsKey


class Levels(object):

    CHANNEL_INDEX_MAPPING_TABLE = {
        LevelsKey.CHANNEL_R: 0,
        LevelsKey.CHANNEL_G: 1,
        LevelsKey.CHANNEL_B: 2
    }

    @staticmethod
    def run(image, config, show):

        color_level_val = {
            LevelsKey.SHADOW: config[LevelsKey.SHADOW],
            LevelsKey.MIDTONES: config[LevelsKey.MIDTONES],
            LevelsKey.HIGHLIGHT: config[LevelsKey.HIGHLIGHT],
            LevelsKey.OUTSHADOW: config[LevelsKey.OUTSHADOW],
            LevelsKey.OUTHIGHLIGHT: config[LevelsKey.OUTHIGHLIGHT]
        }

        return Levels.__do_levels(image, color_level_val, config[LevelsKey.CHANNEL], show)

    @staticmethod
    def __do_levels(image, color_level_val, channel, show=False):

        color_level_tables = {
            LevelsKey.CHANNEL_R: np.zeros(256, dtype=np.int),
            LevelsKey.CHANNEL_G: np.zeros(256, dtype=np.int),
            LevelsKey.CHANNEL_B: np.zeros(256, dtype=np.int)
        }

        for i in range(256):
            color_level_tables[LevelsKey.CHANNEL_R][i] \
                = color_level_tables[LevelsKey.CHANNEL_G][i] = color_level_tables[LevelsKey.CHANNEL_B][i] = i

        # make color level table & process image
        if channel == LevelsKey.CHANNEL_RGB:
            Levels.__get_color_level_table(color_level_val, color_level_tables[LevelsKey.CHANNEL_R])
            Levels.__get_color_level_table(color_level_val, color_level_tables[LevelsKey.CHANNEL_G])
            Levels.__get_color_level_table(color_level_val, color_level_tables[LevelsKey.CHANNEL_B])
            image[:, :, 0] = color_level_tables[LevelsKey.CHANNEL_R][image[:, :, 0]]
            image[:, :, 1] = color_level_tables[LevelsKey.CHANNEL_G][image[:, :, 1]]
            image[:, :, 2] = color_level_tables[LevelsKey.CHANNEL_B][image[:, :, 2]]
        else:
            index = Levels.CHANNEL_INDEX_MAPPING_TABLE[channel]
            Levels.__get_color_level_table(color_level_val, color_level_tables[channel])
            image[:, :, index] = color_level_tables[LevelsKey.CHANNEL_R][image[:, :, index]]

        if show:
            image_o = Image.fromarray(image)
            image_o.show()

        return image

    @staticmethod
    def __get_color_level_table(color_level_val, color_level_table):

        diff = color_level_val[LevelsKey.HIGHLIGHT] - color_level_val[LevelsKey.SHADOW]
        out_diff = color_level_val[LevelsKey.OUTHIGHLIGHT] - color_level_val[LevelsKey.OUTSHADOW]

        coef = 255.0 / diff
        out_coef = out_diff / 255.0
        exponent = 1.0 / color_level_val[LevelsKey.MIDTONES]

        for i in range(256):
            v = 0
            if color_level_table[i] > color_level_val[LevelsKey.SHADOW]:
                v = int((color_level_table[i] - color_level_val[LevelsKey.SHADOW]) * coef + 0.5)
                if v > 255:
                    v = 255

            v = int(pow(v / 255.0, exponent) * 255.0 + 0.5)
            color_level_table[i] = int(v * out_coef + color_level_val[LevelsKey.OUTSHADOW] + 0.5)
