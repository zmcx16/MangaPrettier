import sys
import logging
from PIL import Image
import numpy as np

from blackwhite import BlackWhite


class MangaPrettierCore(object):

    def __init__(self):
        self.logger = logging.getLogger("MangaPrettierCore")
        formatter = logging.Formatter('%(asctime)s %(levelname)s : %(message)s - %(funcName)s (%(lineno)d)')
        file_handler = logging.FileHandler("core.log")
        file_handler.setFormatter(formatter)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.formatter = formatter
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        self.logger.setLevel(logging.DEBUG)

    def run(self, param):

        try:
            image_src = param['src']
            image = np.array(Image.open(image_src))

            h, w, layers = image.shape
            if layers == 3:
                image = np.dstack((image, np.zeros((h, w), dtype=np.uint8) + 255))

            self.logger.debug(image)
            self.logger.debug(image.shape)

            mode = MangaPrettierCore.ModeDict[param['type']]

            for config in param['effects']:
                image = mode.run(image, config, param['show'])

            return image

        except Exception as exc:
            self.logger.error('exception = %s', exc, exc_info=True)
            return None

    ModeDict = {
        'bw': BlackWhite
    }


if __name__ == "__main__":

    print('hello')

